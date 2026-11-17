// Record lifecycle: AR request cases, invoices, journal entries, numbering, generic save.
// Each function mirrors a ServiceNow UI action or business rule (named in the comments).
import { companyById, ctrById, custById, invoiceUse, withCompany } from "./ledger.js";
import { CONTRACT_CATEGORIES, DOC_TYPES, FREQUENCIES, GIRO_PURPOSES, GIRO_TYPES, GST_RATE, TABLES, clearHidden } from "./schema.js";
import { S } from "./state.js";
import { addDays, cents, isoToday, today, uid } from "./util.js";

export const userById = id => S.users.find(u => u.id === id);
export const me = () => S.users.find(u => u.id === (S.ui.persona === "ar" ? "u_ar1" : "u_pm1"));
export const reqById = id => S.requests.find(r => r.id === id);
export const depositById = id => S.deposits.find(p => p.id === id);

export function recById(table, id) {
  return (S[table] || []).find(r => r.id === id);
}

export function displayOf(table, rec) {
  if (!rec) return "";
  if (table === "users") return rec.name;
  if (table === "bankAccounts") return `${{ MB: "Marina", OB: "Orchard", US: "Union Straits" }[rec.bank]} · ${rec.number}`;
  return rec[TABLES[table].display === "name" ? "name" : "number"] || "";
}

/** Auto-number like ServiceNow number maintenance: prefix + zero-padded counter. */
/** System Contract ID (CCI 2026-11-16): CTR0001001, CTR0001002 … on every contract and No contract record, in creation order. */
export function assignContractIds() {
  let max = S.contracts.reduce((m, k) => Math.max(m, +(String(k.ctrId || "").replace(/\D/g, "")) || 0), 1000);
  for (const k of S.contracts) if (!k.ctrId) k.ctrId = "CTR" + String(++max).padStart(7, "0");
}
export function nextNumber(table) {
  const list = S[table];
  if (table === "invoices") {
    let max = 0, prefix = "INV-";
    for (const i of list) { const m = String(i.number).match(/^(.*?)(\d+)$/); if (m && +m[2] > max) { max = +m[2]; prefix = m[1]; } }
    return prefix + String(max + 1).padStart(5, "0");
  }
  const prefix = TABLES[table].prefix;
  const max = list.reduce((mx, r) => Math.max(mx, +(String(r.number || "").replace(/\D/g, "")) || 0), 1000);
  return prefix + String(max + 1).padStart(7, "0");
}

export const REQ_STATE = Object.fromEntries(TABLES.requests.fields.find(f => f.key === "state").choices);
export const REQ_OPEN = ["new", "work_in_progress", "awaiting_requestor_info"];
export const LINE_TYPE = { one_off: "One-off", recurring: "Recurring" };
export const DOC_LABEL = Object.fromEntries(DOC_TYPES);
const DOC_KEY = { contract: "docContract", acra: "docAcra", billing_form: "docBillingForm" };

// ---------- AR-i: customer documents, billing contacts ----------
export const contactFor = (customerId, department) => S.contacts.find(c => c.customerId === customerId && c.department === department);

// ---------- contracts: billing hierarchy customer › contract / shell › billing lines › invoices (D15) ----------
export const isShell = k => k?.contractType === "shell";
/** The customer's no-contract shell for a department (one per customer + department). */
export const shellFor = (customerId, department) => S.contracts.find(k => isShell(k) && k.customerId === customerId && k.department === department);
export const ctrLabel = k => !k ? "—" : isShell(k) ? `${k.number} · No contract (${k.department})` : `${k.number} · ${k.title}`;
/** The contract or shell an AR-i draft/request bills under, when it already exists. */
export function targetContract(d) {
  if (d.contractId) return ctrById(d.contractId);
  if (d.newCustomer || !d.customerId) return null;
  if (d.contractOption === "none") return shellFor(d.customerId, d.department) || null;
  return null;
}
/** Bill-to lives on the contract (D16): ask for it when the contract/shell has none yet, or the requester changes it. */
export const needBillTo = d => d.contractOption === "new" || (d.contractOption === "none" && !targetContract(d)?.billToName);
/** Contract-level proration amounts (first / last month), or null. */
export const contractPro = k => k?.prorate === "yes" ? { firstAmount: k.prorateFirst || 0, lastAmount: k.prorateLast || 0 } : null;
/** Proration that applies to an AR-i draft / request: the new contract's fields, or the existing contract's. */
export const draftPro = d => d.contractOption === "new" ? (d.newCtrProrate === "yes" ? { firstAmount: d.newCtrProFirst || 0, lastAmount: d.newCtrProLast || 0 } : null)
  : d.contractOption === "existing" && d.contractId ? contractPro(ctrById(d.contractId)) : null;
/** Prefill an empty bill-to from the department's usual billing contact. */
export function prefillBillTo(d) {
  if (!needBillTo(d) || d.billToName) return;
  const c = !d.newCustomer && d.customerId && d.department ? contactFor(d.customerId, d.department) : null;
  if (c) Object.assign(d, { billToName: c.name, billToEmail: c.email, billToPhone: c.phone || "", billToAddress: c.address || "", billToPrefilled: true });
}

/** Which customer documents are already on file. contract/PO is per contract when one is chosen; billing form per department. */
export function docsOnFile(customerId, contractId, department) {
  const out = {};
  for (const [t] of DOC_TYPES) {
    out[t] = customerId ? S.documents.find(d => d.customerId === customerId && d.docType === t &&
      (t !== "contract" || !contractId || !d.contractId || d.contractId === contractId) && (t !== "billing_form" || d.department === department)) || null : null;
  }
  return out;
}

// ---------- General information (all AR forms, D19) ----------
const EMAIL_RE = /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/;
export const ccEmails = s => String(s || "").split(/[,;\s]+/).map(x => x.trim()).filter(Boolean);
function generalInfoErrors(d, e) {
  if (!String(d.requesterName || "").trim()) e.requesterName = "Enter the requester's name.";
  if (!d.department) e.department = "Choose your department.";
  const bad = ccEmails(d.ccList).filter(x => !EMAIL_RE.test(x));
  if (bad.length) e.ccList = `Not a valid email: ${bad.join(", ")}. Separate emails with commas.`;
}
/** Portal: requests the user raised, or is on the CC list of (CC'd people can view the case). */
export const canViewReq = (r, u = me()) => r.requestedBy === u.id || ccEmails(r.ccList).map(x => x.toLowerCase()).includes(String(u.email || "").toLowerCase());

// ---------- AR-ix GIRO authorisation (AR-ix module) ----------
export const CONTRACT_CATEGORY = Object.fromEntries(CONTRACT_CATEGORIES);
export const GIRO_PURPOSE = Object.fromEntries(GIRO_PURPOSES), GIRO_TYPE = Object.fromEntries(GIRO_TYPES);
/** AR-i cases (form AR-i, or blank on older data): only these have billing lines and generate the 1st invoice. */
export const isARi = r => !r.form || r.form === "AR-i";
/** Collections form (AR-iii module, D30): General information, then the collection type. Shell until the owner gives the fields. */
export function validateCOL(d) {
  const e = {}; generalInfoErrors(d, e);
  if (!d.colType) e.colType = "Choose the collection type.";
  return e;
}
/** AR-ix decision 22 (E8.5): the existing contracts a requester may pick. The customer's contracts (not No contract) whose
 *  department is the form's Department, or of which the requester is a contract owner (reference qualifier on REQ.contract). */
export function giroContracts(d, u = me()) {
  if (!d.customerId) return [];
  return S.contracts.filter(k => k.customerId === d.customerId && !isShell(k) && ((d.department && k.department === d.department) || (k.owners || []).includes(u?.id)));
}
export function validateARix(d) {
  const e = {}, need = (k, msg) => { const v = d[k]; if (v === undefined || v === null || v === "" || v === false) e[k] = msg; };
  generalInfoErrors(d, e);
  need("customerId", "Search for the customer. Customer not found? Submit an AR-i to set up the customer first.");   // AR-ix decision 17 (E8.1)
  if (d.customerId) {
    need("contractOption", "Choose the contract.");
    if (d.contractOption === "existing") need("contractId", "Choose the contract.");
    if (d.contractOption === "existing" && d.contractId && !giroContracts(d).some(k => k.id === d.contractId)) e.contractId = "Choose a contract of your department, or one you own.";
  }
  const types = giroTypesFor(d);
  need("giroType", "Choose Add GIRO or Remove GIRO.");
  if (d.giroType && types.length && !types.includes(d.giroType)) e.giroType = giroBlock(d) || "This type isn't possible for the chosen contract.";
  if (d.giroType === "remove") need("giroEnd", "Enter the effective end date.");   // AR-ix decision 18 (E8.8)
  if (d.giroType !== "add") return e;
  need("giroPurpose", "Choose the purpose.");
  if (d.giroPurpose && !giroPurposesFor(d).includes(d.giroPurpose)) e.giroPurpose = "This purpose isn't possible for the chosen contract.";   // decision 25
  if (d.giroPurpose === "others") need("giroPurposeOther", "Describe the purpose.");
  need("applicantName", "Enter the customer name.");
  need("applicantEmail", "Enter the customer's email.");
  if (d.applicantEmail && !EMAIL_RE.test(d.applicantEmail)) e.applicantEmail = "Enter a valid email address.";
  need("giroStart", "Enter the effective start date.");                          // AR-ix decision 18 (E8.7)
  if (d.giroPurpose === "rental" || d.giroPurpose === "carpark") need("giroLocation", "Enter the location.");   // decision 21 (E8.15)
  if (d.giroPurpose === "carpark") need("carplate", "Enter the car plate.");
  return e;
}
/** AR-ix decision 25: the purposes the contract option allows. No contract required → Carpark, Others; existing or new contract → Rental, Others. */
export function giroPurposesFor(d) {
  if (d.contractOption === "none") return ["carpark", "others"];
  if (d.contractOption === "existing" || d.contractOption === "new") return ["rental", "others"];
  return GIRO_PURPOSES.map(p => p[0]);
}
/** AR-ix decision 14: the GIRO types the chosen contract allows. New contract or no contract → Add only; existing contract → Add when GIRO is not active, Remove only when it is. */
export function giroTypesFor(d) {
  if (d.contractOption === "new" || d.contractOption === "none") return ["add"];
  if (d.contractOption === "existing" && d.contractId) return activeGiroCase(ctrById(d.contractId)) ? ["remove"] : ["add"];
  return [];
}
export const giroLabel = r => [GIRO_TYPE[r.giroType] || "GIRO", r.giroPurpose === "others" ? r.giroPurposeOther || "Others" : GIRO_PURPOSE[r.giroPurpose]].filter(Boolean).join(" · ");
/** AR-i GIRO section (read-only, D22): Yes when the existing contract has GIRO active from an AR-ix; otherwise No. */
export const giroOnContractOf = d => d.contractOption === "existing" && d.contractId && ctrById(d.contractId)?.giroStatus === "active" ? "yes" : d.contractOption ? "no" : "";
/** The AR-ix case whose GIRO is active on a contract (D21: at most one per contract), or null. */
export const activeGiroCase = k => k && k.giroStatus === "active" && k.giroCaseId ? reqById(k.giroCaseId) : null;
/** AR-ix cases filed on a contract, newest first (the contract's GIRO history). */
export const giroCases = k => S.requests.filter(r => r.form === "AR-ix" && r.contractId === k.id).sort((a, b) => String(b.updated || b.opened).localeCompare(String(a.updated || a.opened)) || b.number.localeCompare(a.number));
/** Why Activate / Remove GIRO can't run on this case's contract yet ("" when it can). */
export function giroBlock(r, k = ctrById(r.contractId)) {
  if (!k) return "";
  const cur = activeGiroCase(k);
  if (r.giroType === "remove") return cur ? "" : `GIRO is not active on ${k.number}, so there is nothing to remove.`;
  return cur && cur.id !== r.id ? `GIRO is already active on ${k.number} (${cur.number}: ${giroLabel(cur)}). Only one GIRO can be active per contract; remove it with a Remove GIRO case first.` : "";
}
/** UI action: Link contract (AR-ix). For a contract not on file, AR processes the AR-i that creates it first, then links it here. */
export function linkContract(reqId, contractId) {
  const r = reqById(reqId), k = ctrById(contractId);
  if (!r || !k) return "Choose the contract to link.";
  Object.assign(r, { contractId: k.id, customerId: k.customerId, newCustomer: false, updated: isoToday() });
  journal(r, "system", `Linked to contract ${k.number} (${custById(k.customerId)?.name}).`);
  if (r.state === "new") r.state = "work_in_progress";
  return null;
}
/** AR-ix: the contract a draft or case points at. Existing contract, or for No contract required the customer's shell for the department when it exists. */
export const giroTarget = d => d.contractOption === "existing" ? (d.contractId ? ctrById(d.contractId) : null)
  : d.contractOption === "none" && d.customerId && !d.newCustomer ? shellFor(d.customerId, d.department) || null : null;

/** AR-i record producer validation (UI policies + mandatory variables + billing lines). Returns {key: message}.
 *  Line errors are keyed "line:<index>:<field>"; "lines" when there are no lines. */
export function validateARi(d) {
  if (d.form === "AR-ix") return validateARix(d);
  if (d.form === "COL") return validateCOL(d);
  const e = {}, need = (k, msg) => { const v = d[k]; if (v === undefined || v === null || v === "" || v === false) e[k] = msg; };
  generalInfoErrors(d, e);
  if (d.newCustomer) need("newCustName", "Enter the new customer's name.");
  else need("customerId", "Search for the customer, or add it as a new customer.");
  if (d.newCustomer || d.customerId) {
    need("contractOption", "Choose an existing contract, a new contract, or No contract required.");
    if (d.contractOption === "existing") need("contractId", "Choose the contract.");
    if (d.contractOption === "new") {
      need("newCtrType", "Choose Recurring or Ad-hoc."); need("newCtrNumber", "Enter the contract number."); need("newCtrTitle", "Give the contract a title."); need("newCtrStart", "Enter the contract start date.");
      if (!(d.newCtrValue > 0)) e.newCtrValue = "Enter the contract value.";
      if (d.newCtrStart && d.newCtrEnd && d.newCtrEnd < d.newCtrStart) e.newCtrEnd = "Must be on or after the start date.";
      if (d.newCtrCycle === "others") need("newCtrCycleOther", "Suggest the billing cycle.");
      if (d.newCtrTerms === "others") need("newCtrTermsOther", "Describe the payment terms.");
      if (d.newCtrProrate === "yes") { if (!(d.newCtrProFirst > 0)) e.newCtrProFirst = "Enter the 1st month amount."; if (!(d.newCtrProLast > 0)) e.newCtrProLast = "Enter the last month amount."; }
    }
    if (needBillTo(d)) { need("billToName", "Enter who to bill for this contract."); need("billToEmail", "Enter the bill-to email."); }
    if (d.billToEmail && needBillTo(d) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.billToEmail)) e.billToEmail = "Enter a valid email address.";
  }
  if (d.pocEmail && !EMAIL_RE.test(d.pocEmail)) e.pocEmail = "Enter a valid email address.";
  // Invoice details (AR-i decisions 31–33): one billing event per request, recurring when the contract type is Recurring
  need("title", "Describe what the invoice is for.");
  if (d.attnEmail && !EMAIL_RE.test(d.attnEmail)) e.attnEmail = "Enter a valid email address.";
  if (!(d.perPeriod > 0)) e.perPeriod = "Enter the amount billed per period (before GST).";
  const bm = billingMode(d);
  // AR-i decision 38: no date asked for a recurring contract (a new one still needs an end date); the
  // one-invoice Preferred invoice date choice and its justification are optional
  if (bm.recurring && !contractEnd(d) && d.contractOption === "new") e.newCtrEnd = "A recurring contract needs an end date.";
  if (d.needItems === "yes") {
    const items = d.items || [];
    if (!items.length) e.items = "Add at least one billing line item, or choose No.";
    items.forEach((it, i) => { if (!(it.amount > 0)) e[`item:${i}:amount`] = "Enter the amount."; });
  }
  const onFile = d.newCustomer ? {} : docsOnFile(d.customerId, d.contractId, d.department);
  for (const [t, label] of DOC_TYPES) if (t !== "contract" && !onFile[t] && !d[DOC_KEY[t]]) e[DOC_KEY[t]] = `Attach the ${label.toLowerCase()} (not on file yet).`;
  return e;
}

/** Contract type of the request's contract: Recurring or Ad-hoc ("" when not on file). No contract = ad-hoc. */
export function contractCategoryOf(d) {
  if (d.contractOption === "new") return d.newCtrType || "";
  if (d.contractOption === "existing") return ctrById(d.contractId)?.category || "";
  return d.contractOption === "none" ? "ad_hoc" : "";
}
/** How the request is billed (D13 as amended, AR-i decision 31): recurring contract → every period; otherwise one invoice. */
export const billingMode = d => ({ category: contractCategoryOf(d), recurring: contractCategoryOf(d) === "recurring" });
export const contractStart = d => d.contractOption === "new" ? d.newCtrStart || "" : d.contractOption === "existing" ? ctrById(d.contractId)?.start || "" : "";
export const contractEnd = d => d.contractOption === "new" ? d.newCtrEnd || "" : d.contractOption === "existing" ? ctrById(d.contractId)?.end || "" : "";
/** The one billing line created from the invoice details at submit. AR-i decision 38: the form asks no invoice date.
 *  INTERIM until the workspace is designed (AR-i open questions 25–26): a recurring line starts at the contract start
 *  date; a one-off line has no preferred date, so Create invoice defaults to today. */
export function draftLine(d) {
  const rec = billingMode(d).recurring;
  return { lineType: rec ? "recurring" : "one_off", desc: String(d.title || "").trim(), amount: d.perPeriod || 0, invoiceDate: "",
    frequency: rec ? "monthly" : "", startDate: rec ? contractStart(d) : "", endDate: rec ? contractEnd(d) : "", remarks: "" };
}
/** GST on an amount in cents (GST_RATE %), rounded to the cent. */
export const gstOf = amt => Math.round((amt || 0) * GST_RATE / 100);
export const itemCalc = it => ({ ...it, gst: gstOf(it.amount), total: (it.amount || 0) + gstOf(it.amount) });
export const reqItems = r => (S.items || []).filter(x => x.requestId === r.id);

/** Errors for one billing line. */
export function lineErrors(l) {
  const e = {};
  if (!String(l.desc || "").trim()) e.desc = "Describe what this line bills.";
  if (!(l.amount > 0)) e.amount = l.lineType === "recurring" ? "Enter the amount per period." : "Enter an amount greater than zero.";
  if (l.lineType === "recurring") {
    if (!l.startDate) e.startDate = "Enter the first billing date.";
    if (!l.endDate) e.endDate = "Enter the last billing date.";
    if (l.startDate && l.endDate && l.endDate < l.startDate) e.endDate = "Must be on or after the From date.";
  }
  return e;
}

/** Billing dates of a recurring line (or schedule): start, then every n months up to and including end. */
export function periodDates(freq, start, end, cap = 120) {
  const step = FREQ[freq]?.[2] || 1, out = [];
  if (!start || !end || end < start) return out;
  for (let n = 0; n < cap; n++) { const d = addMonths(start, step * n); if (d > end) break; out.push(d); }
  return out;
}
/** Amount billed for each period of a recurring line or schedule: prorated first / last period when set. */
export function periodAmounts(x, dates) {
  return dates.map((d, i) => x.prorate !== false && x.firstAmount && i === 0 ? x.firstAmount : x.prorate !== false && x.lastAmount && i === dates.length - 1 && i > 0 ? x.lastAmount : x.amount || 0);
}
/** Line value. Recurring lines use the contract's proration (first / last month) when it has one. */
export function lineValue(l, pro = l.contractId ? contractPro(ctrById(l.contractId)) : null) {
  if (l.lineType !== "recurring") return l.amount || 0;
  const dates = periodDates(l.frequency || "monthly", l.startDate, l.endDate);
  return periodAmounts({ amount: l.amount, ...(pro || {}) }, dates).reduce((s, a) => s + a, 0);
}
export function linesSummary(lines, pro) {
  const one = lines.filter(l => l.lineType !== "recurring"), rec = lines.filter(l => l.lineType === "recurring");
  const v = l => pro === undefined ? lineValue(l) : lineValue(l, pro);
  return { oneOffTotal: one.reduce((s, l) => s + (l.amount || 0), 0), recurringValue: rec.reduce((s, l) => s + v(l), 0),
    total: lines.reduce((s, l) => s + v(l), 0), nOne: one.length, nRec: rec.length };
}
export const reqLines = r => S.lines.filter(l => l.requestId === r.id);
/** Short label like "2 one-off · 1 recurring". */
export function linesLabel(r) {
  if (r.form === "AR-ix") return giroLabel(r);
  if (r.form === "COL") return `Collections · ${r.colType || "type not set"}`;
  const ls = r.lines || reqLines(r), s = linesSummary(ls);
  return [s.nOne ? `${s.nOne} one-off` : "", s.nRec ? `${s.nRec} recurring` : ""].filter(Boolean).join(" · ") || "No lines";
}
/** A line is done when its one-off invoice is issued, or its recurring schedule exists. */
export function lineStatus(l) {
  if (l.lineType === "recurring") return l.scheduleId ? "scheduled" : "open";
  const inv = l.invoiceId ? S.invoices.find(i => i.id === l.invoiceId) : null;
  return !inv || inv.state === "cancelled" ? "open" : inv.state === "issued" ? "invoiced" : "draft";
}
/** Billed is no longer a state (AR-00, 2026-11-16): AR closes the case by hand; nothing automatic. */
function updateBilled() {}   // kept as a no-op hook: callers below are unchanged

/** Setup checklist for an AR-i on the workspace record. */
export function setupStatus(r) {
  const linked = !!r.customerId && !r.newCustomer;
  const ctr = r.contractId ? ctrById(r.contractId) : null;
  const billToOk = !!ctr?.billToName && (!r.billToName || (ctr.billToName === r.billToName && ctr.billToEmail === r.billToEmail));
  const docsGiven = Object.entries(DOC_KEY).filter(([, k]) => r[k]).map(([t]) => t);
  const filed = docsGiven.filter(t => S.documents.some(d => d.requestId === r.id && d.docType === t));
  const linesOnCtr = !!ctr && reqLines(r).every(l => l.contractId === ctr.id);
  return { linked, ctr, contractDone: !!ctr && linesOnCtr, billToOk, docsGiven, filed, docsDone: filed.length === docsGiven.length };
}

/** AR-i customer details captured on the request (transaction data) ↔ customer master fields (D23). [request key, customer key] */
export const CUST_DETAILS = [["agencyType", "agencyType"], ["vag", "vag"], ["subBu", "vagSubBu"], ["pocName", "pocName"], ["pocEmail", "pocEmail"]];
/** Request-shaped copy of a customer's master details (a found customer's values are read-only on AR-i). */
export const custDetailsOf = c => Object.fromEntries(CUST_DETAILS.map(([rk, ck]) => [rk, c?.[ck] || ""]));
/** core_company records with no x_ar_customer yet: the companies a new customer can be created for (D26). */
export const freeCompanies = () => S.companies.filter(co => !S.customers.some(c => c.companyId === co.id));
// D31 (2026-11-17): UI action "Link to customer" retired. AR creates customers, contracts and No contract records and files
// documents by hand in master data (D22), then links the case with the Link section (link_customer / link_contract).


// ---------- recurring billing ----------
const FREQ = Object.fromEntries(FREQUENCIES.map(f => [f[0], f]));
export const freqLabel = f => FREQ[f]?.[1] || f || "—";
const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"), day = d.getDate(); d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

/** Billing periods of a schedule: date, invoice (if raised), status Invoiced / Due / Upcoming. Upcoming periods beyond the horizon collapse into one "more" row. */
export function schedulePeriods(sch, horizonMonths = 3) {
  const out = [], horizon = addMonths(isoToday(), horizonMonths);
  const last = sch.lastDate || sch.contractId && S.contracts.find(k => k.id === sch.contractId)?.end || addMonths(isoToday(), 12);
  const dates = periodDates(sch.frequency, sch.firstDate, last);
  for (const d of dates) {
    const inv = S.invoices.find(i => i.scheduleId === sch.id && i.periodDate === d && i.state !== "cancelled");
    const status = inv ? "Invoiced" : d <= isoToday() ? "Due" : "Upcoming";
    if (status === "Upcoming" && d > horizon) { out.push({ date: d, inv: null, status, more: true, remaining: dates.filter(x => x >= d).length }); break; }
    out.push({ date: d, inv, status });
  }
  return out;
}
export const periodsDue = sch => schedulePeriods(sch).filter(p => p.status === "Due");
export function nextBilling(sch) { const p = schedulePeriods(sch).find(x => !x.inv); return p ? p.date : null; }

/** UI action "Set up billing schedule" on a recurring billing line. */
export function setupSchedule(lineId) {
  const l = S.lines.find(x => x.id === lineId); if (!l) return "Billing line not found.";
  const r = reqById(l.requestId);
  if (l.lineType !== "recurring") return "Only recurring lines get a billing schedule.";
  if (!r?.customerId || r.newCustomer || !l.contractId) return "Link the request to the customer and contract first.";
  if (l.scheduleId) return "This line already has a billing schedule.";
  const sch = { id: uid("s"), number: nextNumber("schedules"), customerId: r.customerId, contractId: l.contractId, department: r.department, desc: l.desc,
    frequency: l.frequency || "monthly", amount: l.amount, firstDate: l.startDate, lastDate: l.endDate, requestId: r.id, lineId: l.id,
    firstAmount: contractPro(ctrById(l.contractId))?.firstAmount || 0, lastAmount: contractPro(ctrById(l.contractId))?.lastAmount || 0 };
  S.schedules.push(sch); l.scheduleId = sch.id; if (r.state === "new") r.state = "work_in_progress"; if (!r.assignedTo) r.assignedTo = me().id;
  const n = periodDates(sch.frequency, sch.firstDate, sch.lastDate).length;
  journal(r, "comment", `Recurring line "${l.desc}" set up as billing schedule ${sch.number}: ${n} ${freqLabel(sch.frequency).toLowerCase()} invoice${n === 1 ? "" : "s"} of SGD ${(sch.amount / 100).toFixed(2)}${sch.firstAmount || sch.lastAmount ? ` (prorated: first SGD ${((sch.firstAmount || sch.amount) / 100).toFixed(2)}, last SGD ${((sch.lastAmount || sch.amount) / 100).toFixed(2)})` : ""} from ${sch.firstDate} to ${sch.lastDate}. AR raises each invoice; no further AR forms are needed for this line.`);
  updateBilled(r);
  return { opened: sch };
}

/** CCI decision 8: setting an AR-i case to Closed complete generates its 1st invoice, a DRAFT from the AR-i form, for every
 *  billing line without one. One-off: its only invoice (preferred invoice date if later than today, else today). Recurring:
 *  the first period (line start date, or today if that has passed); the 2nd invoice onwards comes from the billing schedule
 *  that AR creates on the contract. Needs the customer and contract linked. Returns an error or the invoices created. */
export function firstInvoices(r) {
  if (!r.customerId || r.newCustomer || !r.contractId) return "Set Link Customer Reference and Link Contract Reference before Closed complete: the 1st invoice needs the customer and contract.";
  const made = [], t = isoToday();
  for (const l of reqLines(r)) {
    if (l.invoiceId || S.invoices.some(i => i.lineId === l.id && i.state !== "cancelled")) continue;
    const k = ctrById(l.contractId || r.contractId), c = custById(r.customerId);
    // CCI decision 9: invoice date suggested from the AR-i's indicated start (kept even if earlier than today); AR reviews it and sets the Approval date
    const date = (l.lineType === "recurring" ? l.startDate : l.invoiceDate) || t;
    const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: r.customerId, contractId: k?.id || null, requestId: r.id, lineId: l.id,
      periodDate: l.lineType === "recurring" ? l.startDate || "" : "", customer: c?.name || "", desc: l.desc, amount: l.amount, date, approvalDate: "",
      due: addDays(date, k?.terms || c?.terms || 30), currency: "SGD" };
    S.invoices.push(inv); l.invoiceId = inv.id; made.push(inv);
    journal(r, "work_note", `Closed complete: 1st invoice ${inv.number} generated as a draft from the AR-i (${l.lineType === "recurring" ? "first period; later invoices come from the billing schedule on the contract" : "one-off"}).`);
  }
  return made;
}

/** UI action "Create invoice" on a one-off billing line (RETIRED 2026-11-16, CCI decision 8: the 1st invoice comes from Closed complete). */
export function lineInvoice(lineId) {
  const l = S.lines.find(x => x.id === lineId); if (!l) return "Billing line not found.";
  const r = reqById(l.requestId);
  if (l.lineType !== "one_off") return "Recurring lines are billed from a billing schedule.";
  if (!r?.customerId || r.newCustomer || !l.contractId) return "Set Link Customer Reference and Link Contract Reference first.";
  if (lineStatus(l) !== "open") return "This line already has an invoice.";
  const k = ctrById(l.contractId), c = custById(r.customerId);
  const date = l.invoiceDate && l.invoiceDate > isoToday() ? l.invoiceDate : isoToday();
  const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: r.customerId, contractId: l.contractId, requestId: r.id, lineId: l.id,
    customer: c?.name || "", desc: l.desc, amount: l.amount, date, due: addDays(date, k?.terms || c?.terms || 30), currency: "SGD" };
  S.invoices.push(inv); l.invoiceId = inv.id; if (r.state === "new") r.state = "work_in_progress";
  if (!r.assignedTo) r.assignedTo = me().id;
  journal(r, "work_note", `Draft invoice ${inv.number} created for line "${l.desc}".`);
  return { opened: inv };
}

/** CCI decision 9: the contract billing cycle's day of month (1st or 15th); null for Others / not set. */
export const cycleDay = k => ({ first: 1, fifteenth: 15 })[k?.billingCycle] || null;
/** Next date on the cycle day strictly after `from` (default today); "" when the contract has no fixed cycle day. */
export function nextCycleDate(k, from = isoToday()) {
  const day = cycleDay(k); if (!day) return "";
  const d = new Date(from + "T00:00:00"); d.setDate(d.getDate() + 1);
  while (d.getDate() !== day) d.setDate(d.getDate() + 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Working days (Mon–Fri) before a date: the day the daily job creates the draft. */
export function draftDate(iso, n = 5) {
  const d = new Date(iso + "T00:00:00");
  while (n > 0) { d.setDate(d.getDate() - 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; }
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
/** Scheduled job "Daily invoice check" (D12 amended 2026-11-16): for every billing schedule, each period without an invoice whose
 *  invoice date is 5 working days away or less gets a DRAFT invoice, linked to the schedule and to the original AR-i case and line.
 *  AR issues drafts by hand (Issue invoice). Returns the invoices created. */
export function runDailyInvoiceCheck() {
  const made = [], t = isoToday();
  for (const sch of S.schedules) {
    const dates = periodDates(sch.frequency, sch.firstDate, sch.lastDate), amounts = periodAmounts(sch, dates);
    dates.forEach((date, ix) => {
      if (draftDate(date) > t) return;
      if (S.invoices.some(i => i.scheduleId === sch.id && i.periodDate === date && i.state !== "cancelled")) return;
      const k = ctrById(sch.contractId), c = custById(sch.customerId || k?.customerId);
      const label = new Date(date + "T00:00:00").toLocaleDateString("en-SG", { month: "short", year: "numeric" });
      const invDate = date > t ? date : t;
      const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: c?.id || sch.customerId, contractId: sch.contractId, requestId: sch.requestId || null,
        lineId: sch.lineId || null, scheduleId: sch.id, periodDate: date, customer: c?.name || "", desc: `${sch.desc} – ${label}`, amount: amounts[ix] ?? sch.amount,
        date: invDate, due: addDays(invDate, k?.terms || c?.terms || 30), currency: "SGD" };
      S.invoices.push(inv); made.push(inv);
      const r = sch.requestId && reqById(sch.requestId);
      if (r) journal(r, "work_note", `Daily invoice check: draft invoice ${inv.number} created for ${label} (${sch.number}).`, null);
    });
  }
  return made;
}

/** Journal entry. kind: "comment" (visible to requester), "work_note" (AR only), "system". */
export function journal(req, kind, text, by) {
  const d = new Date(); req.activity.push({ at: new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19), by: by ?? me()?.id, kind, text });
  req.updated = isoToday();
}

/** Record producer submit (portal AR form). `o` overrides the case header when a case is loaded from data/AR_form.csv (UIX decision 13). */
export function createRequest(vals, o = {}) {
  const { lines, items = [], ...rest } = vals;
  clearHidden("requests", rest);
  const by = o.requestedBy || me().id;
  const req = { id: uid("r"), number: o.number || nextNumber("requests"), state: "new", substate: "", requestedBy: by, assignmentGroup: "g_ar", assignedTo: null,
    opened: o.opened || isoToday(), updated: o.opened || isoToday(), activity: [], attachments: rest.attachments || [], ...rest,
    requesterEmail: o.requestedBy ? rest.requesterEmail || "" : me().email || "" };
  if (req.form === "AR-ix") {
    req.amount = 0;                                  // AR-ix amount is free text with no linkages (AR-ix decision 13)
    if (req.contractOption === "none") req.contractId = giroTarget(req)?.id || null;
    req.title = `${giroLabel(req)}${req.carplate ? ` · ${req.carplate}` : req.giroLocation ? ` · ${req.giroLocation}` : ""}`;
    S.requests.push(req);
    journal(req, "system", `Submitted from AR-ix on the portal: ${giroLabel(req)} ${req.contractOption === "existing" ? `on contract ${ctrById(req.contractId)?.number}` : req.contractOption === "none" ? (req.contractId ? `on no-contract shell ${ctrById(req.contractId)?.number}` : `with no contract (no ${req.department} no-contract shell on file yet; AR links it)`) : `for a new contract${req.giroReference ? ` ${req.giroReference}` : ""} (not on file yet; AR links it after processing its AR-i)`}.`, req.requestedBy);
    return req;
  }
  if (req.form === "COL") {                           // Collections (D30): no billing lines; amount to collect comes with the form's fields
    req.amount = req.amount || 0;
    req.title = `Collections – ${req.colType || ""}`;
    S.requests.push(req);
    journal(req, "system", `Submitted from the Collections form (${req.colType}) on the portal.`, req.requestedBy);
    return req;
  }
  const line = draftLine(req);
  req.amount = lineValue(line, draftPro(req));
  req.giroOnContract = giroOnContractOf(req);
  if (req.contractOption === "existing") { const k = ctrById(req.contractId); req.typeOfBilling = k?.typeOfBilling || ""; req.docBulk = []; }
  S.requests.push(req);
  S.lines.push({ id: uid("l"), number: nextNumber("lines"), requestId: req.id, contractId: req.contractOption === "existing" ? req.contractId || null : null, ...line, invoiceId: null, scheduleId: null });
  if (line.lineType === "recurring") { req.invoiceTiming = ""; req.expediteReason = ""; }
  // Billing line items are numbered 1, 2, 3… in row order (AR-i decision 37)
  if (req.needItems === "yes") items.forEach((it, i) => S.items.push({ id: uid("q"), requestId: req.id, ...itemCalc({ seq: i + 1, amount: it.amount || 0, lpiRate: it.lpiRate || 0, accountCode: it.accountCode || "" }) }));
  const ctrText = req.contractOption === "existing" ? `under contract ${ctrById(req.contractId)?.number}` : req.contractOption === "new" ? `under new contract ${req.newCtrNumber}` : "with no contract";
  journal(req, "system", `Submitted from ${req.form || "AR-i"} on the portal${req.newCustomer ? " for a new customer" : ""} ${ctrText}, with ${linesLabel(req)}.`, req.requestedBy);
  return req;
}

/** Validate an invoice-able payload; returns {field: message}. */
export function validate(table, vals) {
  const err = {};
  for (const f of TABLES[table].fields) {
    if (!f.mandatory || f.readonly) continue;
    const v = vals[f.key];
    if (v === undefined || v === null || v === "" || (f.type === "Currency" && !(v > 0))) err[f.key] = f.type === "Currency" ? "Enter an amount greater than zero." : `${f.label} is required.`;
  }
  if (table === "lines") Object.assign(err, lineErrors(vals));
  if (table === "contracts" && vals.lpiApplicable) {
    if (!(vals.lpiRate > 0)) err.lpiRate = "Enter the LPI rate.";
    if (!(vals.lpiMinRate > 0)) err.lpiMinRate = "Enter the minimum LPI rate.";
    else if (vals.lpiRate > 0 && vals.lpiMinRate > vals.lpiRate) err.lpiMinRate = "Must not exceed the LPI rate.";
  }
  return err;
}

/** Workspace UI action on an AR request: Assign to me (AR-00, 2026-11-16: the only case action besides Save; Request info, Reject and Complete are retired, AR uses the State dropdown). */
export function requestAction(id, action) {
  const r = reqById(id); if (!r) return "Record not found.";
  if (action === "assign") {
    r.assignedTo = me().id; r.assignmentGroup = r.assignmentGroup || "g_ar";
    if (r.state === "new") { r.state = "work_in_progress"; journal(r, "system", `Assigned to ${me().name}; state changed to Work in progress.`); }
    else journal(r, "system", `Assigned to ${me().name}.`);
  }
  return null;
}

/** Portal: requester adds a comment. Business rule: reply on Awaiting requestor information moves the case back to Work in progress (substate cleared). */
export function portalComment(id, text) {
  const r = reqById(id), t = String(text || "").trim(); if (!r || !t) return "Write a message first.";
  journal(r, "comment", t);
  if (r.state === "awaiting_requestor_info") { r.state = "work_in_progress"; r.substate = ""; journal(r, "system", "Requester replied; state changed to Work in progress."); }
  return null;
}

/** UI action: Issue invoice. Business rule: linked AR request moves to Invoiced with a requester-visible comment. */
export function issueInvoice(id) {
  const i = S.invoices.find(x => x.id === id); if (!i || i.state !== "draft") return "Only draft invoices can be issued.";
  if (!(i.amount > 0) || !i.customerId || !i.desc) return "Customer, description and amount are required before issuing.";
  if (!i.approvalDate) return "Set the Approval date before issuing.";   // CCI decision 9: every invoice
  i.state = "issued"; if (!i.date) i.date = isoToday();
  if (!i.due) { const k = ctrById(i.contractId), c = custById(i.customerId); i.due = addDays(i.date, k?.terms || c?.terms || 30); }
  const r = reqById(i.requestId);
  if (r) { journal(r, "comment", `Invoice ${i.number} (${i.desc}) was issued on ${i.date} for SGD ${(i.amount / 100).toFixed(2)}, due ${i.due}.`); updateBilled(r); }
  return null;
}

/** UI action: Cancel invoice (only when no BSU deposit is matched to it). */
export function cancelInvoice(id) {
  const i = S.invoices.find(x => x.id === id); if (!i) return "Record not found.";
  if ((invoiceUse().applied[i.id] || 0) > 0) return "A BSU deposit is matched to this invoice. Remove the match first.";
  i.state = "cancelled";
  for (const m of Object.values(S.matches)) if (m && m.status === "proposed" && m.allocations.some(a => a.invoiceId === i.id)) { m.status = "unmatched"; m.allocations = []; m.reason = `Proposal removed: ${i.number} was cancelled.`; }
  const r = reqById(i.requestId);
  const l = i.lineId ? S.lines.find(x => x.id === i.lineId) : null; if (l && l.invoiceId === i.id) l.invoiceId = null;
  if (r) { journal(r, "work_note", `Invoice ${i.number} was cancelled.`); updateBilled(r); }
  return null;
}

/** Generic form save: coerce values by field type, validate, write. Returns {errors} or {rec}. */
export function saveRecord(table, id, raw) {
  const def = TABLES[table], vals = {};
  for (const f of def.fields) {
    if (!(f.key in raw) || f.readonly) continue;
    let v = raw[f.key];
    if (f.type === "Currency") v = typeof v === "number" ? v : v === "" ? 0 : cents(v);
    else if (f.type === "Integer" || f.type === "Decimal") v = v === "" ? 0 : Number(v);
    else if (f.key === "aliases") v = Array.isArray(v) ? v : String(v).split(",").map(s => s.trim()).filter(Boolean);
    else v = typeof v === "string" ? v.trim() : v;
    if (f.type === "Reference" && v === "") v = null;
    vals[f.key] = v;
  }
  const existing = id && id !== "new" ? recById(table, id) : null;
  const merged = { ...(existing || {}), ...vals };
  if (table === "contracts" && !merged.contractType) merged.contractType = vals.contractType = "contract";
  const errors = validate(table, merged);
  if (table === "contacts" && S.contacts.some(c => c.id !== merged.id && c.customerId === merged.customerId && c.department === merged.department)) errors.department = `This customer already has a ${merged.department} billing contact. Edit that one instead.`;
  if (table === "contracts" && S.contracts.some(k => k.id !== merged.id && k.number && k.number.toLowerCase() === String(merged.number || "").toLowerCase())) errors.number = `Contract ${merged.number} already exists.`;
  if (table === "contracts" && merged.contractType === "contract" && !String(merged.number || "").trim()) errors.number = "Enter the contract number.";
  if (table === "schedules" && merged.contractId) vals.customerId = ctrById(merged.contractId)?.customerId || merged.customerId;
  if (table === "contracts" && merged.giroStatus !== "active" && merged.giroCaseId) merged.giroCaseId = vals.giroCaseId = null;   // AR-ix decision 11
  if (table === "contracts" && merged.giroStatus === "active" && !merged.giroCaseId) errors.giroCaseId = "Choose the AR-ix case whose GIRO is active.";
  if (table === "contracts" && merged.contractType === "shell" && !merged.department) errors.department = "A No contract record needs a department.";
  if (table === "customers" && merged.companyId && S.customers.some(c => c.id !== merged.id && c.companyId === merged.companyId)) errors.companyId = `${companyById(merged.companyId)?.name} already has a customer record. One customer per company (D26).`;
  // CCI decision 8: Closed complete on an AR-i generates the 1st invoice (blocked until the case is linked)
  if (table === "requests" && existing && isARi(existing) && vals.state === "closed_complete" && existing.state !== "closed_complete") {
    const probe = { ...existing, ...vals };
    if (!probe.linkCustomer || !probe.linkContract) errors.state = "Set Link Customer Reference and Link Contract Reference before Closed complete: the 1st invoice needs the customer and contract.";   // D31
  }
  if (table === "schedules" && merged.firstDate && cycleDay(ctrById(merged.contractId)) && +merged.firstDate.slice(8, 10) !== cycleDay(ctrById(merged.contractId)))
    errors.firstDate = `The contract billing cycle is the ${cycleDay(ctrById(merged.contractId)) === 1 ? "1st" : "15th"} of the month: choose a first billing date on that day.`;
  if (table === "schedules" && merged.requestId) {
    const r = reqById(merged.requestId), l = r && reqLines(r).find(x => x.lineType === "recurring");
    if (r && r.contractId !== merged.contractId) errors.requestId = "Choose an AR-i case on this contract.";
    else vals.lineId = l?.id || null;
  }
  if (table === "requests" && existing && isARi(existing) && merged.linkContract && merged.linkCustomer && ctrById(merged.linkContract)?.customerId !== merged.linkCustomer)
    errors.linkContract = "Choose a contract of the linked customer.";
  if (Object.keys(errors).length) return { errors };
  // AR-00 2026-11-16: State dropdown. Substate only for Awaiting requestor information; a state change is journalled.
  // AR-ix: setting Contract on the case replaces the retired Link contract (the customer follows the contract).
  if (table === "requests" && existing) {
    if (merged.state !== "awaiting_requestor_info") vals.substate = "";
    if ("state" in vals && vals.state !== existing.state) journal(existing, "system", `State changed to ${def.fields.find(f => f.key === "state").choices.find(c => c[0] === vals.state)?.[1] || vals.state}.`);
    // D31 Link section: Link Customer Reference sets the case's customer; Link Contract Reference sets its contract
    // (AR-i: and every billing line's contract; AR-ix: the customer follows the contract)
    if ("linkCustomer" in vals && vals.linkCustomer && vals.linkCustomer !== existing.linkCustomer) {
      Object.assign(vals, { customerId: vals.linkCustomer, newCustomer: false });
      journal(existing, "system", `Link Customer Reference set to ${custById(vals.linkCustomer)?.uen || "—"} (${custById(vals.linkCustomer)?.name}).`);
    }
    if ("linkContract" in vals && vals.linkContract && vals.linkContract !== existing.linkContract) {
      const k = ctrById(vals.linkContract);
      if (k) {
        vals.contractId = k.id; if (existing.form === "AR-ix") Object.assign(vals, { customerId: k.customerId, newCustomer: false });
        if (isARi(existing)) for (const l of reqLines(existing)) l.contractId = k.id;
        journal(existing, "system", `Link Contract Reference set to ${k.ctrId || k.number} (${k.number}).`);
      }
    }
  }
  if (table === "contracts" && existing && !String(merged.number || "").trim()) vals.number = existing.ctrId;
  const wasState = existing?.state;
  if (existing) {
    Object.assign(existing, vals);
    if (table === "requests" && isARi(existing) && vals.state === "closed_complete" && wasState !== "closed_complete") firstInvoices(existing);
    if (table === "customers") S.invoices.forEach(i => { if (i.customerId === existing.id) i.customer = existing.name; });
    if (table === "invoices") existing.customer = custById(existing.customerId)?.name || "";
    if (table === "requests") existing.updated = isoToday();
    if (table === "lines") { const r = reqById(existing.requestId); if (r) r.amount = linesSummary(reqLines(r)).total; }
    return { rec: existing };
  }
  const rec = { id: uid(table[0]), ...vals };
  if (table === "customers") { Object.assign(rec, { aliases: rec.aliases || [], terms: rec.terms || 30 }); withCompany(rec); }
  if (table === "contracts") Object.assign(rec, { terms: rec.terms || custById(rec.customerId)?.terms || 30 });
  if (table === "bankAccounts") rec.currency = "SGD";
  S[table].push(rec);
  if (table === "contracts") { assignContractIds(); if (!rec.number) rec.number = rec.ctrId; }   // No contract without a number shows its Contract ID
  return { rec };
}

// ---------- record history (sys_audit) ----------
// The build audits every x_ar table (dictionary "Audit" on). The prototype emulates it by diffing the data
// tables on each render: inserts become "Created", changed schema fields become one entry each.
const AUDITED = Object.keys(TABLES);
let auditBase = null;
const snap = r => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "activity").map(([k, v]) => [k, JSON.stringify(v ?? null)]));
function snapshot() { const out = {}; for (const t of AUDITED) { out[t] = {}; for (const r of S[t] || []) out[t][r.id] = snap(r); } return out; }
const nowStamp = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19); };
/** Called by render(): record what changed since the last render. resetAudit() after loading sample data. */
export function auditTick() {
  const cur = snapshot();
  if (auditBase) {
    const at = nowStamp(), by = me()?.id;
    for (const t of AUDITED) for (const [id, after] of Object.entries(cur[t])) {
      const before = auditBase[t][id];
      if (!before) { S.history.push({ table: t, id, at, by, kind: "created" }); continue; }
      for (const f of TABLES[t].fields) {
        const a = before[f.key] ?? "null", b = after[f.key] ?? "null";
        if (a !== b) S.history.push({ table: t, id, at, by, kind: "update", field: f.key, old: JSON.parse(a), new: JSON.parse(b) });
      }
    }
  }
  auditBase = cur;
}
export function resetAudit() { auditBase = null; }
export const historyOf = (table, id) => S.history.filter(h => h.table === table && h.id === id).slice().reverse();
