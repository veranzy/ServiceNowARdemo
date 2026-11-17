// Cash application: manual matching only (decision D5, no auto-match). Remove/manual actions, allocation planning,
// and candidate ranking for the invoice finder.
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
  amount: r.amount || 0, date: r.opened, due: "", desc: r.title, form: r.colType || r.form });
export const openCollections = () => S.requests.filter(r => COLLECTION_FORMS.includes(r.form) && REQ_OPEN.includes(r.state) && r.amount > 0).map(caseTarget);
/** An invoice, or a Collections case in invoice shape. */
export function targetById(id) { const i = invById(id); if (i) return i; const r = S.requests.find(x => x.id === id && COLLECTION_FORMS.includes(x.form)); return r ? caseTarget(r) : null; }

export function act(pid, what, extra) {
  const m = S.matches[pid];
  if (what === "remove" && m) { S.matches[pid] = { status: "unmatched", allocations: [], reason: "Allocations removed. Match again with Find invoice." }; }
  if (what === "manual") {
    const p = S.deposits.find(x => x.id === pid); if (!p) return;
    const plan = allocationPlan(p, m, extra.ids); if (!plan.total) return;
    const prev = m && m.status === "accepted" ? m.allocations : [];
    const all = [...prev, ...plan.rows.filter(r => r.alloc > 0).map(r => r.i.kind === "case" ? { requestId: r.i.id, amount: r.alloc } : { invoiceId: r.i.id, amount: r.alloc })];
    const leftOnInvoices = plan.rows.some(r => r.after > 0);
    const exception = plan.unapplied > 0 ? "over_pay" : leftOnInvoices ? "short_pay" : all.length > 1 ? "multi_invoice" : "none";
    const note = (extra.note || "").trim();
    S.matches[pid] = { status: "accepted", method: "manual", exception, allocations: all,
      reason: "Matched manually" + (note ? `: ${note}` : "."), by: S.ui.persona === "ar" ? "u_ar1" : null };
    delete S.pick[pid];
  }
  render();
}

export function remainingToApply(p, m) { return p.amount - (m && m.status === "accepted" ? m.allocations.reduce((s, a) => s + a.amount, 0) : 0); }

export function signals(p, i, open, toApply) {
  const refD = new Set(digitRuns(p.reference));
  const invD = String(i.number).match(/\d{3,}/g) || [];
  const ref = invD.some(x => refD.has(x));
  const ns = payerSim(p.payer, i);
  const diff = toApply - open;
  const exact = diff === 0;
  const near = !exact && Math.abs(diff) <= Math.round(open * 0.03);
  return { ref, ns, exact, near, diff, score: (ref ? 3 : 0) + ns * 2 + (exact ? 2 : near ? 1 : 0) };
}

export function candidateList(p, m) {
  const toApply = remainingToApply(p, m);
  const mine = new Set((m?.allocations || []).map(allocKey));
  return [...issued(), ...openCollections()].filter(i => !mine.has(i.id)).map(i => { const st = invoiceState(i); return { i, st, sg: signals(p, i, st.open, toApply) }; })
    .filter(x => x.st.open > 0).sort((a, b) => b.sg.score - a.sg.score || (a.i.due || "9999").localeCompare(b.i.due || "9999"));
}

export function allocationPlan(p, m, ids) {
  let avail = remainingToApply(p, m); const rows = [];
  for (const id of ids) { const i = targetById(id); if (!i) continue; const st = invoiceState(i);
    const alloc = Math.max(0, Math.min(st.open, avail)); avail -= alloc; rows.push({ i, st, alloc, after: st.open - alloc }); }
  return { rows, total: rows.reduce((s, r) => s + r.alloc, 0), unapplied: avail, toApply: remainingToApply(p, m) };
}
