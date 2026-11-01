// Record lifecycle: AR request cases, invoices, journal entries, numbering, generic save.
// Each function mirrors a ServiceNow UI action or business rule (named in the comments).
import { ctrById, custById, invoiceUse } from "./ledger.js";
import { DOC_TYPES, FREQUENCIES, TABLES } from "./schema.js";
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
export const REQ_TYPE = { first: "1st AR request", adhoc: "Ad-hoc AR", recurring: "Recurring AR" };
export const DOC_LABEL = Object.fromEntries(DOC_TYPES);
const DOC_KEY = { contract: "docContract", acra: "docAcra", billing_form: "docBillingForm" };

// ---------- AR-i: customer documents, billing contacts ----------
export const contactFor = (customerId, department) => S.contacts.find(c => c.customerId === customerId && c.department === department);

/** Which customer documents are already on file. contract/PO is per contract when one is chosen; billing form per department. */
export function docsOnFile(customerId, contractId, department) {
  const out = {};
  for (const [t] of DOC_TYPES) {
    out[t] = customerId ? S.documents.find(d => d.customerId === customerId && d.docType === t &&
      (t !== "contract" || !contractId || !d.contractId || d.contractId === contractId) && (t !== "billing_form" || d.department === department)) || null : null;
  }
  return out;
}

/** AR-i record producer validation (UI policies + mandatory variables). Returns {key: message}. */
export function validateARi(d) {
  const e = {}, need = (k, msg) => { const v = d[k]; if (v === undefined || v === null || v === "" || v === false) e[k] = msg; };
  need("requestType", "Choose the request type.");
  need("department", "Choose your department.");
  if (d.newCustomer) need("newCustName", "Enter the new customer's name.");
  else need("customerId", "Choose the customer, or tick New customer.");
  const contact = !d.newCustomer && d.customerId ? contactFor(d.customerId, d.department) : null;
  if (d.newCustomer || !contact || d.updateBillTo) { need("billToName", "Enter who to bill in this department."); need("billToEmail", "Enter the bill-to email."); }
  if (d.billToEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.billToEmail)) e.billToEmail = "Enter a valid email address.";
  need("title", d.requestType === "recurring" ? "Describe what is billed each period." : "Describe what should be invoiced.");
  if (!(d.amount > 0)) e.amount = "Enter an amount greater than zero.";
  if (d.requestType === "recurring") { need("frequency", "Choose how often to bill."); need("firstBillDate", "Enter the first billing date.");
    if (d.lastBillDate && d.firstBillDate && d.lastBillDate < d.firstBillDate) e.lastBillDate = "Must be on or after the first billing date."; }
  need("contractLocation", "Tell AR where the signed contract is kept.");
  if (["repository", "physical"].includes(d.contractLocation)) need("contractLocationRef", "Give the link or file location.");
  if (d.contractLocation === "attached" && !d.docContract) e.docContract = "Attach the signed contract / PO, or choose another location.";
  const onFile = d.newCustomer ? {} : docsOnFile(d.customerId, d.contractId, d.department);
  for (const [t, label] of DOC_TYPES) if (!onFile[t] && !d[DOC_KEY[t]] && !(t === "contract" && d.contractLocation && d.contractLocation !== "attached")) e[DOC_KEY[t]] = `Attach the ${label.toLowerCase()} (not on file yet).`;
  if (d.periodStart && d.periodEnd && d.periodEnd < d.periodStart) e.periodEnd = "Must be on or after the start of the period.";
  return e;
}

/** Setup checklist for an AR-i on the workspace record. */
export function setupStatus(r) {
  const linked = !!r.customerId && !r.newCustomer;
  const contact = linked ? contactFor(r.customerId, r.department) : null;
  const docsGiven = Object.entries(DOC_KEY).filter(([, k]) => r[k]).map(([t]) => t);
  const filed = docsGiven.filter(t => S.documents.some(d => d.requestId === r.id && d.docType === t));
  const ctr = r.contractId ? S.contracts.find(k => k.id === r.contractId) : null;
  return { linked, contact, docsGiven, filed, docsDone: filed.length === docsGiven.length,
    location: !r.contractLocation || !ctr ? null : !!ctr.contractLocation, schedule: r.scheduleId ? S.schedules.find(x => x.id === r.scheduleId) : null };
}

/** UI action "Link to customer": create or link the customer, upsert the department's billing contact,
 *  file the documents on the customer, record the contract location. existingId links a new-customer AR-i to an existing customer instead. */
export function linkCustomer(id, existingId) {
  const r = reqById(id); if (!r) return "Record not found.";
  const notes = [];
  if (r.newCustomer) {
    let c = existingId ? custById(existingId) : null;
    if (!c) { c = { id: uid("c"), name: r.newCustName, uen: r.newCustUen || "", address: r.newCustAddress || "", parent: "", aliases: [], terms: 30, creditLimit: 0, notes: `Created from ${r.number}.` }; S.customers.push(c); notes.push(`created customer ${c.name}`); }
    else notes.push(`linked to existing customer ${c.name}`);
    r.customerId = c.id; r.newCustomer = false;
  } else notes.push(`customer ${custById(r.customerId)?.name} confirmed`);
  if (r.billToName) {
    const ex = contactFor(r.customerId, r.department), vals = { name: r.billToName, email: r.billToEmail || "", phone: r.billToPhone || "", address: r.billToAddress || "", requestId: r.id };
    if (ex) { Object.assign(ex, vals); notes.push(`updated ${r.department} billing contact`); }
    else { S.contacts.push({ id: uid("t"), customerId: r.customerId, department: r.department, ...vals }); notes.push(`added ${r.department} billing contact`); }
  }
  for (const [t, k] of Object.entries(DOC_KEY)) {
    if (!r[k] || S.documents.some(d => d.requestId === r.id && d.docType === t)) continue;
    S.documents.push({ id: uid("d"), number: nextNumber("documents"), customerId: r.customerId, docType: t, fileName: r[k], contractId: t === "contract" ? r.contractId || null : null,
      department: t === "billing_form" ? r.department : "", requestId: r.id, received: isoToday() });
    notes.push(`filed ${DOC_LABEL[t].toLowerCase()}`);
  }
  const ctr = r.contractId ? S.contracts.find(k => k.id === r.contractId) : null;
  if (ctr && r.contractLocation) { ctr.contractLocation = r.contractLocation; ctr.contractLocationRef = r.contractLocationRef || (r.contractLocation === "attached" ? `Customer document from ${r.number}` : ""); notes.push(`recorded contract location on ${ctr.number}`); }
  if (r.state === "new") { r.state = "in_progress"; if (!r.assignedTo) r.assignedTo = me().id; }
  journal(r, "work_note", `Link to customer: ${notes.join("; ")}.`);
  return null;
}

// ---------- recurring billing ----------
const FREQ = Object.fromEntries(FREQUENCIES.map(f => [f[0], f]));
export const freqLabel = f => FREQ[f]?.[1] || f || "—";
const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"), day = d.getDate(); d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

/** Billing periods of a schedule: date, invoice (if raised), status Invoiced / Due / Upcoming. */
export function schedulePeriods(sch, horizonMonths = 3) {
  const step = FREQ[sch.frequency]?.[2] || 1, out = [];
  const ctrEnd = sch.contractId ? S.contracts.find(k => k.id === sch.contractId)?.end : "";
  const last = sch.lastDate || ctrEnd || addMonths(isoToday(), 12);
  const horizon = addMonths(isoToday(), horizonMonths);
  for (let n = 0, d = sch.firstDate; d && d <= last && n < 60; n++, d = addMonths(sch.firstDate, step * n)) {
    if (n === 0) d = sch.firstDate;
    const inv = S.invoices.find(i => i.scheduleId === sch.id && i.periodDate === d && i.state !== "cancelled");
    const status = inv ? "Invoiced" : d <= isoToday() ? "Due" : "Upcoming";
    if (status === "Upcoming" && d > horizon) { out.push({ date: d, inv: null, status, more: true }); break; }
    out.push({ date: d, inv, status });
  }
  return out;
}
export const periodsDue = sch => schedulePeriods(sch).filter(p => p.status === "Due");
export function nextBilling(sch) { const p = schedulePeriods(sch).find(x => !x.inv); return p ? p.date : null; }

/** UI action "Set up billing schedule" (Recurring AR-i). */
export function setupSchedule(id) {
  const r = reqById(id); if (!r) return "Record not found.";
  if (r.requestType !== "recurring") return "Only Recurring AR requests get a billing schedule.";
  if (!r.customerId || r.newCustomer) return "Link the request to a customer first.";
  if (r.scheduleId) return "A billing schedule already exists.";
  const sch = { id: uid("s"), number: nextNumber("schedules"), customerId: r.customerId, contractId: r.contractId || null, department: r.department, desc: r.title,
    frequency: r.frequency, amount: r.amount, firstDate: r.firstBillDate, lastDate: r.lastBillDate || "", requestId: r.id };
  S.schedules.push(sch); r.scheduleId = sch.id; r.state = "scheduled"; if (!r.assignedTo) r.assignedTo = me().id;
  journal(r, "comment", `Recurring billing set up as ${sch.number}: ${freqLabel(sch.frequency).toLowerCase()} SGD ${(sch.amount / 100).toFixed(2)} from ${sch.firstDate}${sch.lastDate ? ` to ${sch.lastDate}` : ""}. AR will raise each invoice; no further AR forms are needed for this billing.`);
  return { opened: sch };
}

/** UI action "Raise invoice" on a billing period: draft invoice for that period. */
export function raiseInvoice(scheduleId, date) {
  const sch = S.schedules.find(x => x.id === scheduleId); if (!sch) return "Schedule not found.";
  if (S.invoices.some(i => i.scheduleId === sch.id && i.periodDate === date && i.state !== "cancelled")) return "This period already has an invoice.";
  const k = ctrById(sch.contractId), c = custById(sch.customerId);
  const label = new Date(date + "T00:00:00").toLocaleDateString("en-SG", { month: "short", year: "numeric" });
  const invDate = date > isoToday() ? date : isoToday();
  const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: sch.customerId, contractId: sch.contractId, requestId: sch.requestId || null, scheduleId: sch.id, periodDate: date,
    customer: c?.name || "", desc: `${sch.desc} – ${label}`, amount: sch.amount, date: invDate, due: addDays(invDate, k?.terms || c?.terms || 30), currency: "SGD" };
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
  const req = { id: uid("r"), number: nextNumber("requests"), state: "new", requestedBy: me().id, assignedTo: null, invoiceId: null,
    opened: isoToday(), updated: isoToday(), activity: [], attachments: vals.attachments || [], ...vals };
  delete req.attachments_input;
  S.requests.push(req);
  journal(req, "system", `Submitted from ${req.form || "AR-i"} (${REQ_TYPE[req.requestType] || "AR form"}) on the portal.`, req.requestedBy);
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
  if (vals.periodStart && vals.periodEnd && vals.periodEnd < vals.periodStart) err.periodEnd = "Must be on or after the start of the period.";
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
  } else if (action === "invoice") {               // UI action: Create invoice
    if (r.invoiceId) return "An invoice already exists for this request.";
    if (!r.customerId || r.newCustomer) return "Link the request to a customer first (Link to customer).";
    if (r.requestType === "recurring") return "Recurring requests are billed from a billing schedule. Use Set up billing schedule.";
    const k = ctrById(r.contractId), c = custById(r.customerId);
    const date = r.invoiceDate && r.invoiceDate > isoToday() ? r.invoiceDate : isoToday();
    const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: r.customerId, contractId: r.contractId || null, requestId: r.id,
      customer: c?.name || "", desc: r.title, amount: r.amount, date, due: addDays(date, k?.terms || c?.terms || 30), currency: "SGD" };
    S.invoices.push(inv); r.invoiceId = inv.id; if (r.state === "new") r.state = "in_progress";
    if (!r.assignedTo) r.assignedTo = me().id;
    journal(r, "work_note", `Draft invoice ${inv.number} created from this request.`);
    return { opened: inv };
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
  if (r) { r.state = "invoiced"; journal(r, "comment", `Invoice ${i.number} was issued on ${i.date}, due ${i.due}.`); }
  return null;
}

/** UI action: Cancel invoice (only when no BSU deposit is matched to it). */
export function cancelInvoice(id) {
  const i = S.invoices.find(x => x.id === id); if (!i) return "Record not found.";
  if ((invoiceUse().applied[i.id] || 0) > 0) return "A BSU deposit is matched to this invoice. Remove the match first.";
  i.state = "cancelled";
  for (const m of Object.values(S.matches)) if (m && m.status === "proposed" && m.allocations.some(a => a.invoiceId === i.id)) { m.status = "unmatched"; m.allocations = []; m.reason = `Proposal removed: ${i.number} was cancelled.`; }
  const r = reqById(i.requestId);
  if (r) { r.invoiceId = null; if (r.state === "invoiced") r.state = "in_progress"; journal(r, "work_note", `Invoice ${i.number} was cancelled.`); }
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
  const errors = validate(table, merged);
  if (table === "contacts" && S.contacts.some(c => c.id !== merged.id && c.customerId === merged.customerId && c.department === merged.department)) errors.department = `This customer already has a ${merged.department} billing contact. Edit that one instead.`;
  if (table === "contracts" && S.contracts.some(k => k.id !== merged.id && k.number && k.number.toLowerCase() === String(merged.number || "").toLowerCase())) errors.number = `Contract ${merged.number} already exists.`;
  if (Object.keys(errors).length) return { errors };
  if (existing) {
    Object.assign(existing, vals);
    if (table === "customers") S.invoices.forEach(i => { if (i.customerId === existing.id) i.customer = existing.name; });
    if (table === "invoices") existing.customer = custById(existing.customerId)?.name || "";
    if (table === "requests") existing.updated = isoToday();
    return { rec: existing };
  }
  const rec = { id: uid(table[0]), ...vals };
  if (table === "customers") Object.assign(rec, { aliases: rec.aliases || [], terms: rec.terms || 30 });
  if (table === "contracts") Object.assign(rec, { terms: rec.terms || custById(rec.customerId)?.terms || 30 });
  if (table === "bankAccounts") rec.currency = "SGD";
  S[table].push(rec);
  return { rec };
}
