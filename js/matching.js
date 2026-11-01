// Cash application: rule-based auto-match, accept/reject/manual actions, allocation planning.
import { invById, invoiceState, invoiceUse, payerSim } from "./ledger.js";
import { $, S } from "./state.js";
import { digitRuns, normTok } from "./util.js";
import { render } from "./views/cash.js";
import { setStatus } from "./views/shell.js";

export function rulesPass() {
  let made = 0;
  const pending = S.payments.filter(p => !S.matches[p.id] || S.matches[p.id].status === "unmatched");
  for (const p of pending) {
    const { applied, reserved } = invoiceUse();
    const avail = i => i.amount - (applied[i.id] || 0) - (reserved[i.id] || 0);
    const refTok = new Set(String(p.reference).toUpperCase().split(/[^A-Z0-9]+/).map(normTok).filter(Boolean));
    const refDigits = new Set(digitRuns(p.reference));
    const referenced = S.invoices.filter(i => {
      if (avail(i) <= 0) return false;
      if (refTok.has(normTok(i.number))) return true;
      const d = (String(i.number).match(/\d{3,}/g) || []);
      return d.length && d.some(x => refDigits.has(x));
    });
    if (referenced.length) {
      const total = referenced.reduce((s, i) => s + avail(i), 0);
      if (total === p.amount) {
        S.matches[p.id] = { status: "proposed", method: "rule", confidence: 0.99,
          exception: referenced.length > 1 ? "multi_invoice" : "none",
          allocations: referenced.map(i => ({ invoiceId: i.id, amount: avail(i) })),
          reason: `Reference cites ${referenced.map(i => i.number).join(", ")} and the amount equals the open balance exactly.` };
        made++; continue;
      }
    }
    if (!refDigits.size || !referenced.length) {
      const cands = S.invoices.filter(i => avail(i) === p.amount && payerSim(p.payer, i) >= 0.5);
      if (cands.length === 1) {
        const i = cands[0];
        S.matches[p.id] = { status: "proposed", method: "rule", confidence: 0.9, exception: "none",
          allocations: [{ invoiceId: i.id, amount: p.amount }],
          reason: `Only open invoice for this customer with exactly this amount (${i.number}); no reference given.` };
        made++; continue;
      }
    }
    S.matches[p.id] = S.matches[p.id] || { status: "unmatched", allocations: [] };
  }
  return made;
}

export async function runMatching() {
  if (S.busy) return;
  if (!S.payments.length || !S.invoices.length) { setStatus("info", "Add open invoices and payments first: load the sample data or import CSV."); return; }
  S.busy = true; render();
  const r = rulesPass(); render();
  S.busy = false;
  const unm = S.payments.filter(p => S.matches[p.id]?.status !== "accepted" && S.matches[p.id]?.status !== "proposed").length;
  if (!$("status").classList.contains("err")) setStatus("ok", `${r} payment${r === 1 ? "" : "s"} auto-matched${unm ? `, ${unm} left for manual matching with Find invoice` : ""}. Review the proposals, then accept or reject each.`);
  render();
}

export function act(pid, what, extra) {
  const m = S.matches[pid];
  if (what === "accept" && m) m.status = "accepted";
  if (what === "reject" && m) { m.rejectedInvoices = [...new Set([...(m.rejectedInvoices || []), ...m.allocations.map(a => a.invoiceId)])]; m.status = "rejected"; m.allocations = []; m.reason = "Rejected. Run matching again for a new proposal, or assign manually."; m.method = m.method; m.confidence = 0; m.exception = "none"; }
  if (what === "undo" && m) m.status = "proposed";
  if (what === "manual") {
    const p = S.payments.find(x => x.id === pid); if (!p) return;
    const plan = allocationPlan(p, m, extra.ids); if (!plan.total) return;
    const prev = m && m.status === "accepted" ? m.allocations : [];
    const all = [...prev, ...plan.rows.filter(r => r.alloc > 0).map(r => ({ invoiceId: r.i.id, amount: r.alloc }))];
    const leftOnInvoices = plan.rows.some(r => r.after > 0);
    const exception = plan.unapplied > 0 ? "over_pay" : leftOnInvoices ? "short_pay" : all.length > 1 ? "multi_invoice" : "none";
    const note = (extra.note || "").trim();
    S.matches[pid] = { status: "accepted", method: "manual", confidence: 1, exception, allocations: all,
      reason: "Assigned manually" + (note ? `: ${note}` : "."), rejectedInvoices: m?.rejectedInvoices || [] };
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
  const mine = new Set((m?.allocations || []).map(a => a.invoiceId));
  return S.invoices.filter(i => !mine.has(i.id)).map(i => { const st = invoiceState(i); return { i, st, sg: signals(p, i, st.open, toApply) }; })
    .filter(x => x.st.open > 0).sort((a, b) => b.sg.score - a.sg.score || a.i.due.localeCompare(b.i.due));
}

export function allocationPlan(p, m, ids) {
  let avail = remainingToApply(p, m); const rows = [];
  for (const id of ids) { const i = invById(id); if (!i) continue; const st = invoiceState(i);
    const alloc = Math.max(0, Math.min(st.open, avail)); avail -= alloc; rows.push({ i, st, alloc, after: st.open - alloc }); }
  return { rows, total: rows.reduce((s, r) => s + r.alloc, 0), unapplied: avail, toApply: remainingToApply(p, m) };
}
