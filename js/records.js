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
export const REQ_OPEN = ["new", "in_progress", "awaiting_info"];
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
export function validateARix(d) {
  const e = {}, need = (k, msg) => { const v = d[k]; if (v === undefined || v === null || v === "" || v === false) e[k] = msg; };
  generalInfoErrors(d, e);
  if (d.newCustomer) need("newCustName", "Enter the customer's name.");
  else need("customerId", "Search for the customer, or add its name if AR doesn't have it.");
  if (d.newCustomer || d.customerId) {
    need("contractOption", "Choose the contract.");
    if (d.contractOption === "existing") need("contractId", "Choose the contract.");
    if (d.contractOption === "new") need("newCtrRef", "Enter the contract / tenancy agreement / reference number.");
  }
  const types = giroTypesFor(d);
  need("giroType", "Choose Add GIRO or Remove GIRO.");
  if (d.giroType && types.length && !types.includes(d.giroType)) e.giroType = giroBlock(d) || "This type isn't possible for the chosen contract.";
  if (d.giroType !== "add") return e;                    // AR-ix decision 14: Remove GIRO needs nothing more
  need("giroPurpose", "Choose the purpose.");
  if (d.giroPurpose === "others") need("giroPurposeOther", "Describe the purpose.");
  need("applicantName", "Enter the applicant name or entity.");
  need("applicantEmail", "Enter the applicant's email.");
  if (d.applicantEmail && !EMAIL_RE.test(d.applicantEmail)) e.applicantEmail = "Enter a valid email address.";
  if (d.giroPurpose === "rental") {
    need("giroLocation", "Enter the location.");
    need("giroStart", "Enter the effective start date.");
    if (d.giroStart && d.giroEnd && d.giroEnd < d.giroStart) e.giroEnd = "Must be on or after the start date.";
  }
  if (d.giroPurpose === "carpark") {
    need("carplate", "Enter the car plate.");
    need("parkStart", "Enter the parking start date.");
    if (d.parkStart && d.parkEnd && d.parkEnd < d.parkStart) e.parkEnd = "Must be on or after the start date.";
  }
  return e;
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
  if (r.state === "new") r.state = "in_progress";
  return null;
}
/** UI action: Complete (AR-ix decision 11). Closes the case only; AR updates the contract's GIRO status and active case on the contract record by hand. */
export function completeGiro(reqId) {
  const r = reqById(reqId); if (!r) return "Record not found.";
  r.state = "completed"; r.updated = isoToday();
  journal(r, "system", "State changed to Completed.");
  return null;
}
/** AR-ix: the contract a draft or case points at. Existing contract, or for No contract required the customer's shell for the department when it exists. */
export const giroTarget = d => d.contractOption === "existing" ? (d.contractId ? ctrById(d.contractId) : null)
  : d.contractOption === "none" && d.customerId && !d.newCustomer ? shellFor(d.customerId, d.department) || null : null;

/** AR-i record producer validation (UI policies + mandatory variables + billing lines). Returns {key: message}.
 *  Line errors are keyed "line:<index>:<field>"; "lines" when there are no lines. */
export function validateARi(d) {
  if (d.form === "AR-ix") return validateARix(d);
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
  const ls = r.lines || reqLines(r), s = linesSummary(ls);
  return [s.nOne ? `${s.nOne} one-off` : "", s.nRec ? `${s.nRec} recurring` : ""].filter(Boolean).join(" · ") || "No lines";
}
/** A line is done when its one-off invoice is issued, or its recurring schedule exists. */
export function lineStatus(l) {
  if (l.lineType === "recurring") return l.scheduleId ? "scheduled" : "open";
  const inv = l.invoiceId ? S.invoices.find(i => i.id === l.invoiceId) : null;
  return !inv || inv.state === "cancelled" ? "open" : inv.state === "issued" ? "invoiced" : "draft";
}
/** Business rule: request becomes Billed when every line is invoiced or scheduled. */
function updateBilled(r) {
  const ls = reqLines(r);
  if (ls.length && ls.every(l => ["invoiced", "scheduled"].includes(lineStatus(l)))) {
    if (r.state !== "invoiced") { r.state = "invoiced"; journal(r, "system", "All billing lines are invoiced or scheduled; state changed to Billed."); }
  } else if (r.state === "invoiced") r.state = "in_progress";
}

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

/** UI action "Link to customer": create or link the customer, upsert the department's billing contact,
 *  file the documents on the customer. existingId links a new-customer AR-i to an existing customer instead. */
/** AR-i customer details captured on the request (transaction data) ↔ customer master fields (D23). [request key, customer key] */
export const CUST_DETAILS = [["agencyType", "agencyType"], ["vag", "vag"], ["subBu", "vagSubBu"], ["pocName", "pocName"], ["pocEmail", "pocEmail"]];
/** Request-shaped copy of a customer's master details (a found customer's values are read-only on AR-i). */
export const custDetailsOf = c => Object.fromEntries(CUST_DETAILS.map(([rk, ck]) => [rk, c?.[ck] || ""]));
/** core_company records with no x_ar_customer yet: the companies a new customer can be created for (D26). */
export const freeCompanies = () => S.companies.filter(co => !S.customers.some(c => c.companyId === co.id));
export function linkCustomer(id, existingId, companyId) {
  const r = reqById(id); if (!r) return "Record not found.";
  const notes = [];
  if (r.newCustomer) {
    let c = existingId ? custById(existingId) : null;
    if (!c) {
      // the officer creates the customer: it must point to a core_company record (D26); the name is dot-walked, never typed
      const co = companyById(companyId);
      if (!co) return "Choose the company (core_company) for the new customer, or link to an existing customer.";
      if (S.customers.some(x => x.companyId === co.id)) return `${co.name} already has a customer record. Link to that customer instead.`;
      c = withCompany({ id: uid("c"), companyId: co.id, uen: r.newCustUen || "", address: r.newCustAddress || "", parent: "", aliases: [], terms: 30, creditLimit: 0, notes: `Created from ${r.number}.` }); S.customers.push(c); notes.push(`created customer for company ${c.name}`);
    }
    else notes.push(`linked to existing customer ${c.name}`);
    r.customerId = c.id; r.newCustomer = false;
  } else notes.push(`customer ${custById(r.customerId)?.name} confirmed`);
  // replicate the request's customer details to the customer master (D23): fill what the master doesn't have yet
  { const c = custById(r.customerId), set = CUST_DETAILS.filter(([rk, ck]) => r[rk] && !c[ck]);
    for (const [rk, ck] of set) c[ck] = r[rk];
    if (set.length) notes.push(`copied ${set.map(([rk]) => TABLES.requests.fields.find(f => f.key === rk).label).join(", ")} to the customer`); }
  // contract level (D15): existing contract, new contract, or the customer's no-contract shell for the department
  let ctr = r.contractId ? ctrById(r.contractId) : null;
  if (ctr && ctr.customerId !== r.customerId) ctr = null;
  if (!ctr && r.contractOption === "new") {
    const no = String(r.newCtrNumber || r.newCtrRef || "").trim();
    ctr = S.contracts.find(k => k.customerId === r.customerId && !isShell(k) && k.number.toLowerCase() === no.toLowerCase());
    if (ctr) notes.push(`linked to existing contract ${ctr.number}`);
    else { ctr = { id: uid("k"), contractType: "contract", customerId: r.customerId, department: r.department, number: no || `NEW-${r.number}`, title: r.newCtrTitle || r.title,
        category: r.newCtrType || "", reference: r.newCtrRef || "", poNumber: r.newCtrPo || "",
        start: r.newCtrStart || "", end: r.newCtrEnd || "", value: r.newCtrValue || 0, billing: CONTRACT_CATEGORY[r.newCtrType] || "",
        billingCycle: r.newCtrCycle || "", billingCycleOther: r.newCtrCycleOther || "", invoiceDate: r.newCtrInvDate || "",
        paymentTerms: r.newCtrTerms || "30", paymentTermsOther: r.newCtrTermsOther || "", terms: r.newCtrTerms === "others" ? custById(r.customerId)?.terms || 30 : 30,
        prorate: r.newCtrProrate || "no", prorateFirst: r.newCtrProFirst || 0, prorateLast: r.newCtrProLast || 0,
        typeOfBilling: r.typeOfBilling || "", bulkDocs: r.docBulk || [], discPct: 0, discDays: 0, giroStatus: "none", giroCaseId: null, notes: `Created from ${r.number}.` };
      S.contracts.push(ctr); notes.push(`created contract ${ctr.number}`); }
  }
  if (!ctr && (r.contractOption === "none" || !r.contractOption)) {
    ctr = shellFor(r.customerId, r.department);
    if (ctr) notes.push(`filed under no-contract shell ${ctr.number}`);
    else { ctr = { id: uid("k"), contractType: "shell", customerId: r.customerId, department: r.department, number: nextShellNumber(r.department), title: `No contract – ${r.department}`,
        start: "", end: "", value: 0, billing: "", terms: custById(r.customerId)?.terms || 30, discPct: 0, discDays: 0, notes: "Holds billing for this customer and department that has no contract (D15)." };
      S.contracts.push(ctr); notes.push(`created no-contract shell ${ctr.number}`); }
  }
  if (ctr) { r.contractId = ctr.id; for (const l of reqLines(r)) l.contractId = ctr.id; }
  if (r.billToName && ctr) {
    const changed = ctr.billToName && (ctr.billToName !== r.billToName || ctr.billToEmail !== r.billToEmail);
    Object.assign(ctr, { billToName: r.billToName, billToEmail: r.billToEmail || "", billToPhone: r.billToPhone || "", billToAddress: r.billToAddress || "" });
    notes.push(`${changed ? "updated" : "set"} bill-to on ${ctr.number}`);
    if (!contactFor(r.customerId, r.department)) { S.contacts.push({ id: uid("t"), customerId: r.customerId, department: r.department, name: r.billToName, email: r.billToEmail || "", phone: r.billToPhone || "", address: r.billToAddress || "", requestId: r.id }); notes.push(`added ${r.department} default billing contact`); }
  }
  for (const [t, k] of Object.entries(DOC_KEY)) {
    if (!r[k] || S.documents.some(d => d.requestId === r.id && d.docType === t)) continue;
    S.documents.push({ id: uid("d"), number: nextNumber("documents"), customerId: r.customerId, docType: t, fileName: r[k], contractId: t === "contract" ? r.contractId || null : null,
      department: t === "billing_form" ? r.department : "", requestId: r.id, received: isoToday() });
    notes.push(`filed ${DOC_LABEL[t].toLowerCase()}`);
  }
  if (r.state === "new") { r.state = "in_progress"; if (!r.assignedTo) r.assignedTo = me().id; }
  journal(r, "work_note", `Link to customer: ${notes.join("; ")}.`);
  return null;
}

function nextShellNumber(dept) {
  const n = S.contracts.filter(isShell).length + 1;
  return `NC-${String(dept || "GEN").slice(0, 3).toUpperCase()}-${String(n).padStart(4, "0")}`;
}

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
  S.schedules.push(sch); l.scheduleId = sch.id; if (r.state === "new") r.state = "in_progress"; if (!r.assignedTo) r.assignedTo = me().id;
  const n = periodDates(sch.frequency, sch.firstDate, sch.lastDate).length;
  journal(r, "comment", `Recurring line "${l.desc}" set up as billing schedule ${sch.number}: ${n} ${freqLabel(sch.frequency).toLowerCase()} invoice${n === 1 ? "" : "s"} of SGD ${(sch.amount / 100).toFixed(2)}${sch.firstAmount || sch.lastAmount ? ` (prorated: first SGD ${((sch.firstAmount || sch.amount) / 100).toFixed(2)}, last SGD ${((sch.lastAmount || sch.amount) / 100).toFixed(2)})` : ""} from ${sch.firstDate} to ${sch.lastDate}. AR raises each invoice; no further AR forms are needed for this line.`);
  updateBilled(r);
  return { opened: sch };
}

/** UI action "Create invoice" on a one-off billing line. */
export function lineInvoice(lineId) {
  const l = S.lines.find(x => x.id === lineId); if (!l) return "Billing line not found.";
  const r = reqById(l.requestId);
  if (l.lineType !== "one_off") return "Recurring lines are billed from a billing schedule.";
  if (!r?.customerId || r.newCustomer || !l.contractId) return "Link the request to the customer and contract first (Link to customer).";
  if (lineStatus(l) !== "open") return "This line already has an invoice.";
  const k = ctrById(l.contractId), c = custById(r.customerId);
  const date = l.invoiceDate && l.invoiceDate > isoToday() ? l.invoiceDate : isoToday();
  const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: r.customerId, contractId: l.contractId, requestId: r.id, lineId: l.id,
    customer: c?.name || "", desc: l.desc, amount: l.amount, date, due: addDays(date, k?.terms || c?.terms || 30), currency: "SGD" };
  S.invoices.push(inv); l.invoiceId = inv.id; if (r.state === "new") r.state = "in_progress";
  if (!r.assignedTo) r.assignedTo = me().id;
  journal(r, "work_note", `Draft invoice ${inv.number} created for line "${l.desc}".`);
  return { opened: inv };
}

/** UI action "Raise invoice" on a billing period: draft invoice for that period. */
export function raiseInvoice(scheduleId, date) {
  const sch = S.schedules.find(x => x.id === scheduleId); if (!sch) return "Schedule not found.";
  if (S.invoices.some(i => i.scheduleId === sch.id && i.periodDate === date && i.state !== "cancelled")) return "This period already has an invoice.";
  const k = ctrById(sch.contractId), c = custById(sch.customerId);
  const label = new Date(date + "T00:00:00").toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  const invDate = date > isoToday() ? date : isoToday();
  const dates = periodDates(sch.frequency, sch.firstDate, sch.lastDate), amount = periodAmounts(sch, dates)[dates.indexOf(date)] ?? sch.amount;
  const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: sch.customerId, contractId: sch.contractId, requestId: sch.requestId || null, scheduleId: sch.id, periodDate: date,
    customer: c?.name || "", desc: `${sch.desc} – ${label}`, amount, date: invDate, due: addDays(invDate, k?.terms || c?.terms || 30), currency: "SGD" };
  S.invoices.push(inv);
  return { opened: inv };
}

/** Journal entry. kind: "comment" (visible to requester), "work_note" (AR only), "system". */
export function journal(req, kind, text, by) {
  const d = new Date(); req.activity.push({ at: new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19), by: by ?? me()?.id, kind, text });
  req.updated = isoToday();
}

/** Record producer submit (portal AR form). */
export function createRequest(vals) {
  const { lines, items = [], ...rest } = vals;
  clearHidden("requests", rest);
  const req = { id: uid("r"), number: nextNumber("requests"), state: "new", requestedBy: me().id, assignedTo: null,
    opened: isoToday(), updated: isoToday(), activity: [], attachments: rest.attachments || [], ...rest, requesterEmail: me().email || "" };
  if (req.form === "AR-ix") {
    req.amount = 0;                                  // AR-ix amount is free text with no linkages (AR-ix decision 13)
    if (req.contractOption === "none") req.contractId = giroTarget(req)?.id || null;
    req.title = `${giroLabel(req)}${req.carplate ? ` · ${req.carplate}` : req.giroLocation ? ` · ${req.giroLocation}` : ""}`;
    S.requests.push(req);
    journal(req, "system", `Submitted from AR-ix on the portal: ${giroLabel(req)} ${req.contractOption === "existing" ? `on contract ${ctrById(req.contractId)?.number}` : req.contractOption === "none" ? (req.contractId ? `on no-contract shell ${ctrById(req.contractId)?.number}` : `with no contract (no ${req.department} no-contract shell on file yet; AR links it)`) : `for contract ${req.newCtrRef} (not on file yet; AR links it after processing its AR-i)`}.`, req.requestedBy);
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

/** Workspace UI actions on an AR request. Returns an error string or null. */
export function requestAction(id, action, text) {
  const r = reqById(id); if (!r) return "Record not found.";
  const t = String(text || "").trim();
  if (action === "assign") {                       // UI action: Assign to me
    r.assignedTo = me().id; if (r.state === "new") r.state = "in_progress";
    journal(r, "system", `Assigned to ${me().name}.`);
  } else if (action === "info") {                  // UI action: Request info
    if (!t) return "Write the question for the requester in the composer first.";
    r.state = "awaiting_info"; journal(r, "comment", t); S.ui.ws.composer[id] = { kind: "comment", text: "" };
  } else if (action === "reject") {                // UI action: Reject
    if (!t) return "Add a customer-visible comment explaining the rejection first.";
    r.state = "rejected"; journal(r, "comment", t); journal(r, "system", "State changed to Rejected."); S.ui.ws.composer[id] = { kind: "comment", text: "" };
  }
  return null;
}

/** Portal: requester adds a comment. Business rule: reply on Awaiting info moves the case back to In progress. */
export function portalComment(id, text) {
  const r = reqById(id), t = String(text || "").trim(); if (!r || !t) return "Write a message first.";
  journal(r, "comment", t);
  if (r.state === "awaiting_info") { r.state = "in_progress"; journal(r, "system", "Requester replied; state changed to In progress."); }
  return null;
}

/** UI action: Issue invoice. Business rule: linked AR request moves to Invoiced with a requester-visible comment. */
export function issueInvoice(id) {
  const i = S.invoices.find(x => x.id === id); if (!i || i.state !== "draft") return "Only draft invoices can be issued.";
  if (!(i.amount > 0) || !i.customerId || !i.desc) return "Customer, description and amount are required before issuing.";
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
  if (table === "contracts" && merged.giroStatus !== "active" && merged.giroCaseId) merged.giroCaseId = vals.giroCaseId = null;   // AR-ix decision 11
  if (table === "contracts" && merged.giroStatus === "active" && !merged.giroCaseId) errors.giroCaseId = "Choose the AR-ix case whose GIRO is active.";
  if (table === "contracts" && merged.contractType === "shell" && !merged.department) errors.department = "A no-contract shell needs a department.";
  if (table === "contracts" && merged.contractType === "shell" && S.contracts.some(k => k.id !== merged.id && isShell(k) && k.customerId === merged.customerId && k.department === merged.department)) errors.department = `This customer already has a ${merged.department} no-contract shell.`;
  if (table === "customers" && merged.companyId && S.customers.some(c => c.id !== merged.id && c.companyId === merged.companyId)) errors.companyId = `${companyById(merged.companyId)?.name} already has a customer record. One customer per company (D26).`;
  if (Object.keys(errors).length) return { errors };
  if (existing) {
    Object.assign(existing, vals);
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
