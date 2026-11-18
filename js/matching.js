// Matching in the standard workspace (BSU decision 21): manual only (D5, no auto-match). Allocations are added from
// a deposit, an invoice or a Collections case (Suggested matches tabs and New allocation); ranking is a suggestion only.
import { allocKey, custById, invById, invoiceState, invoiceUse, payerSim } from "./ledger.js";
import { REQ_OPEN } from "./records.js";
import { COLLECTION_FORMS } from "./schema.js";
import { S } from "./state.js";
import { digitRuns } from "./util.js";
import { render } from "./views/app.js";

// Only issued invoices can be matched to BSU deposits (drafts and cancelled invoices are excluded).
const issued = () => S.invoices.filter(i => i.state === "issued");
// D29: open Collections cases (AR-iii, AR-iv, AR-v) can be matched too, against their Request value (amount).
// A case is shown to the finder in the shape of an invoice (kind "case"); its allocation records requestId instead of invoiceId.
const caseTarget = r => ({ kind: "case", id: r.id, number: r.number, customer: custById(r.customerId)?.name || r.newCustName || "", customerId: r.customerId, contractId: r.contractId,
  amount: r.amount || 0, date: r.opened, due: "", desc: r.title, form: r.colType || r.form, department: r.department, refs: [r.colRef, r.ar5Receipt, r.caseNumber, r.ibCase].filter(Boolean) });
export const openCollections = () => S.requests.filter(r => COLLECTION_FORMS.includes(r.form) && REQ_OPEN.includes(r.state) && r.amount > 0).map(caseTarget);
/** An invoice, or a Collections case in invoice shape. */
export function targetById(id) { const i = invById(id); if (i) return i; const r = S.requests.find(x => x.id === id && COLLECTION_FORMS.includes(x.form)); return r ? caseTarget(r) : null; }

export function act(pid, what, extra) {
  const m = S.matches[pid];
  if (what === "remove" && m) { S.matches[pid] = { status: "unmatched", allocations: [], reason: "Allocations removed. Match again from Suggested matches or New." }; }
  render();
}

export function remainingToApply(p, m) { return p.amount - (m && m.status === "accepted" ? m.allocations.reduce((s, a) => s + a.amount, 0) : 0); }

export function signals(p, i, open, toApply) {
  const refD = new Set(digitRuns(p.reference));
  // a Collections case is also found by its own references (AR-iv Reference Number, AR-v G56 receipt / case numbers)
  const invD = [i.number, ...(i.kind === "case" ? i.refs || [] : [])].flatMap(x => String(x || "").match(/\d{3,}/g) || []);
  const ref = invD.some(x => refD.has(x));
  const ns = i.kind === "case" ? 0 : payerSim(p.payer, i);
  const diff = toApply - open;
  const exact = diff === 0;
  const near = !exact && Math.abs(diff) <= Math.round(open * 0.03);
  // BSU decision 13: a case of a collection type this bank account receives ranks higher (never hidden)
  const a = S.bankAccounts.find(x => x.id === p.bankAccountId), acct = i.kind === "case" && !!a && (a.colTypes || []).includes(i.form);
  return { ref, ns, exact, near, diff, acct, score: (ref ? 3 : 0) + ns * 2 + (exact ? 2 : near ? 1 : 0) + (acct ? 2 : 0) };
}

export function candidateList(p, m) {
  const toApply = remainingToApply(p, m);
  const mine = new Set((m?.allocations || []).map(allocKey));
  return [...issued(), ...openCollections()].filter(i => !mine.has(i.id)).map(i => { const st = invoiceState(i); return { i, st, sg: signals(p, i, st.open, toApply) }; })
    .filter(x => x.st.open > 0).sort((a, b) => b.sg.score - a.sg.score || (a.i.due || "9999").localeCompare(b.i.due || "9999"));
}


/** BSU decision 21: one manual allocation of a deposit to an invoice or Collections case. `amount` in cents, or null for
 *  the default: the smaller of what is left on the deposit and what is open on the target. Returns an error text or null. */
export function allocate(pid, targetId, amount, note) {
  const p = S.deposits.find(x => x.id === pid), t = targetId && targetById(targetId);
  if (!p) return "Choose a BSU deposit.";
  if (!t) return "Choose an issued invoice or an open Collections case.";
  const m = S.matches[pid], left = remainingToApply(p, m), open = invoiceState(t).open;
  if (left <= 0) return `${p.number} is fully matched already.`;
  if (open <= 0) return `${t.number} has nothing left to match.`;
  const amt = amount == null || amount === "" ? Math.min(left, open) : amount;
  if (!(amt > 0)) return "Enter an amount above zero.";
  if (amt > left) return `Only ${(left / 100).toFixed(2)} is left on ${p.number}.`;
  if (amt > open) return `Only ${(open / 100).toFixed(2)} is open on ${t.number}.`;
  const prev = m && m.status === "accepted" ? m.allocations : [];
  const all = [...prev, t.kind === "case" ? { requestId: t.id, amount: amt } : { invoiceId: t.id, amount: amt }];
  const exception = left - amt > 0 ? "over_pay" : open - amt > 0 ? "short_pay" : all.length > 1 ? "multi_invoice" : "none";
  const n = (note || "").trim();
  S.matches[pid] = { status: "accepted", method: "manual", exception, allocations: all,
    reason: "Matched manually" + (n ? `: ${n}` : "."), by: S.ui.persona === "ar" ? "u_ar1" : null };
  return null;
}

/** BSU decision 21: deposits with money left, ranked for an invoice or Collections case (same signals, reversed). */
export function depositCandidates(targetId) {
  const t = targetById(targetId); if (!t) return [];
  const open = invoiceState(t).open; if (open <= 0 || (t.kind !== "case" && t.state !== "issued")) return [];
  return S.deposits.map(p => ({ p, left: remainingToApply(p, S.matches[p.id]) })).filter(x => x.left > 0)
    .map(x => ({ ...x, sg: signals(x.p, t, open, x.left) })).sort((a, b) => b.sg.score - a.sg.score || String(b.p.date).localeCompare(String(a.p.date)));
}
