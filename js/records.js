// Record lifecycle: AR request cases, invoices, journal entries, numbering, generic save.
// Each function mirrors a ServiceNow UI action or business rule (named in the comments).
import { ctrById, custById, invoiceUse } from "./ledger.js";
import { TABLES } from "./schema.js";
import { S } from "./state.js";
import { addDays, cents, isoToday, uid } from "./util.js";

export const userById = id => S.users.find(u => u.id === id);
export const me = () => S.users.find(u => u.id === (S.ui.persona === "ar" ? "u_ar1" : "u_pm1"));
export const reqById = id => S.requests.find(r => r.id === id);
export const payById = id => S.payments.find(p => p.id === id);

export function recById(table, id) {
  return (S[table] || []).find(r => r.id === id);
}

export function displayOf(table, rec) {
  if (!rec) return "";
  if (table === "users") return rec.name;
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
  journal(req, "system", "Submitted from the AR form on the portal.", req.requestedBy);
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

/** UI action: Cancel invoice (only without applied payments). */
export function cancelInvoice(id) {
  const i = S.invoices.find(x => x.id === id); if (!i) return "Record not found.";
  if ((invoiceUse().applied[i.id] || 0) > 0) return "This invoice has payments applied. Remove the allocations first.";
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
  S[table].push(rec);
  return { rec };
}
