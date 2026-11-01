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
export const LINE_TYPE = { one_off: "One-off", recurring: "Recurring" };
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

/** AR-i record producer validation (UI policies + mandatory variables + billing lines). Returns {key: message}.
 *  Line errors are keyed "line:<index>:<field>"; "lines" when there are no lines. */
export function validateARi(d) {
  const e = {}, need = (k, msg) => { const v = d[k]; if (v === undefined || v === null || v === "" || v === false) e[k] = msg; };
  need("department", "Choose your department.");
  if (d.newCustomer) need("newCustName", "Enter the new customer's name.");
  else need("customerId", "Search for the customer, or add it as a new customer.");
  const contact = !d.newCustomer && d.customerId ? contactFor(d.customerId, d.department) : null;
  if (d.newCustomer || !contact || d.updateBillTo) { need("billToName", "Enter who to bill in this department."); need("billToEmail", "Enter the bill-to email."); }
  if (d.billToEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.billToEmail)) e.billToEmail = "Enter a valid email address.";
  need("title", "Give the request a short summary.");
  const lines = d.lines || [];
  if (!lines.length) e.lines = "Add at least one billing line.";
  lines.forEach((l, i) => {
    const le = lineErrors(l); for (const [k, m] of Object.entries(le)) e[`line:${i}:${k}`] = m;
  });
  need("contractLocation", "Tell AR where the signed contract is kept.");
  if (["repository", "physical"].includes(d.contractLocation)) need("contractLocationRef", "Give the link or file location.");
  if (d.contractLocation === "attached" && !d.docContract) e.docContract = "Attach the signed contract / PO, or choose another location.";
  const onFile = d.newCustomer ? {} : docsOnFile(d.customerId, d.contractId, d.department);
  for (const [t, label] of DOC_TYPES) if (!onFile[t] && !d[DOC_KEY[t]] && !(t === "contract" && d.contractLocation && d.contractLocation !== "attached")) e[DOC_KEY[t]] = `Attach the ${label.toLowerCase()} (not on file yet).`;
  return e;
}

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
export function lineValue(l) { return l.lineType === "recurring" ? (l.amount || 0) * periodDates(l.frequency || "monthly", l.startDate, l.endDate).length : (l.amount || 0); }
export function linesSummary(lines) {
  const one = lines.filter(l => l.lineType !== "recurring"), rec = lines.filter(l => l.lineType === "recurring");
  return { oneOffTotal: one.reduce((s, l) => s + (l.amount || 0), 0), recurringValue: rec.reduce((s, l) => s + lineValue(l), 0),
    total: lines.reduce((s, l) => s + lineValue(l), 0), nOne: one.length, nRec: rec.length };
}
export const reqLines = r => S.lines.filter(l => l.requestId === r.id);
/** Short label like "2 one-off · 1 recurring". */
export function linesLabel(r) {
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
  const contact = linked ? contactFor(r.customerId, r.department) : null;
  const docsGiven = Object.entries(DOC_KEY).filter(([, k]) => r[k]).map(([t]) => t);
  const filed = docsGiven.filter(t => S.documents.some(d => d.requestId === r.id && d.docType === t));
  const ctr = r.contractId ? S.contracts.find(k => k.id === r.contractId) : null;
  return { linked, contact, docsGiven, filed, docsDone: filed.length === docsGiven.length,
    location: !r.contractLocation || !ctr ? null : !!ctr.contractLocation };
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
  if (!r?.customerId || r.newCustomer) return "Link the request to a customer first.";
  if (l.scheduleId) return "This line already has a billing schedule.";
  const sch = { id: uid("s"), number: nextNumber("schedules"), customerId: r.customerId, contractId: r.contractId || null, department: r.department, desc: l.desc,
    frequency: l.frequency || "monthly", amount: l.amount, firstDate: l.startDate, lastDate: l.endDate, requestId: r.id, lineId: l.id };
  S.schedules.push(sch); l.scheduleId = sch.id; if (r.state === "new") r.state = "in_progress"; if (!r.assignedTo) r.assignedTo = me().id;
  const n = periodDates(sch.frequency, sch.firstDate, sch.lastDate).length;
  journal(r, "comment", `Recurring line "${l.desc}" set up as billing schedule ${sch.number}: ${n} ${freqLabel(sch.frequency).toLowerCase()} invoice${n === 1 ? "" : "s"} of SGD ${(sch.amount / 100).toFixed(2)} from ${sch.firstDate} to ${sch.lastDate}. AR raises each invoice; no further AR forms are needed for this line.`);
  updateBilled(r);
  return { opened: sch };
}

/** UI action "Create invoice" on a one-off billing line. */
export function lineInvoice(lineId) {
  const l = S.lines.find(x => x.id === lineId); if (!l) return "Billing line not found.";
  const r = reqById(l.requestId);
  if (l.lineType !== "one_off") return "Recurring lines are billed from a billing schedule.";
  if (!r?.customerId || r.newCustomer) return "Link the request to a customer first (Link to customer).";
  if (lineStatus(l) !== "open") return "This line already has an invoice.";
  const k = ctrById(r.contractId), c = custById(r.customerId);
  const date = l.invoiceDate && l.invoiceDate > isoToday() ? l.invoiceDate : isoToday();
  const inv = { id: uid("i"), number: nextNumber("invoices"), state: "draft", customerId: r.customerId, contractId: r.contractId || null, requestId: r.id, lineId: l.id,
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
  const { lines = [], ...rest } = vals;
  const req = { id: uid("r"), number: nextNumber("requests"), state: "new", requestedBy: me().id, assignedTo: null,
    opened: isoToday(), updated: isoToday(), activity: [], attachments: rest.attachments || [], ...rest };
  req.amount = linesSummary(lines).total;
  S.requests.push(req);
  for (const l of lines) S.lines.push({ id: uid("l"), number: nextNumber("lines"), requestId: req.id, lineType: l.lineType, desc: l.desc.trim(), amount: l.amount,
    invoiceDate: l.lineType === "one_off" ? l.invoiceDate || "" : "", frequency: l.lineType === "recurring" ? l.frequency || "monthly" : "",
    startDate: l.lineType === "recurring" ? l.startDate : "", endDate: l.lineType === "recurring" ? l.endDate : "", invoiceId: null, scheduleId: null });
  journal(req, "system", `Submitted from ${req.form || "AR-i"} on the portal${req.newCustomer ? " for a new customer" : ""} with ${linesLabel(req)}.`, req.requestedBy);
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
  const errors = validate(table, merged);
  if (table === "contacts" && S.contacts.some(c => c.id !== merged.id && c.customerId === merged.customerId && c.department === merged.department)) errors.department = `This customer already has a ${merged.department} billing contact. Edit that one instead.`;
  if (table === "contracts" && S.contracts.some(k => k.id !== merged.id && k.number && k.number.toLowerCase() === String(merged.number || "").toLowerCase())) errors.number = `Contract ${merged.number} already exists.`;
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
  if (table === "customers") Object.assign(rec, { aliases: rec.aliases || [], terms: rec.terms || 30 });
  if (table === "contracts") Object.assign(rec, { terms: rec.terms || custById(rec.customerId)?.terms || 30 });
  if (table === "bankAccounts") rec.currency = "SGD";
  S[table].push(rec);
  return { rec };
}
