// Cash application view and the top-level render() that redraws whichever tab is active.
import { ctrById, invById, invoiceUse } from "../ledger.js";
import { act } from "../matching.js";
import { $, S } from "../state.js";
import { esc, fmt, today } from "../util.js";
import { renderCustomers } from "./customers.js";
import { pickerPanel } from "./finder.js";

export const EXC = { none: ["Exact", "c-ok"], multi_invoice: ["Multi-invoice", "c-accent"], discount: ["Discount taken", "c-warn"], short_pay: ["Short pay", "c-warn"], partial: ["Partial", "c-warn"], over_pay: ["Overpayment", "c-warn"], ambiguous: ["Ambiguous", "c-bad"], unidentified: ["Unidentified", "c-bad"] };

export const STATUS = { accepted: ["Applied", "c-ok"], proposed: ["Proposed", "c-warn"], unmatched: ["Unmatched", "c-bad"], rejected: ["Rejected", "c-bad"] };

export const METHOD = { rule: "Auto", manual: "Manual" };

export function render() {
  const { applied, reserved } = invoiceUse();
  // summary
  const arTotal = S.invoices.reduce((s, i) => s + i.amount, 0);
  const appliedTotal = Object.values(applied).reduce((s, v) => s + v, 0);
  const reservedTotal = Object.values(reserved).reduce((s, v) => s + v, 0);
  const cash = S.payments.reduce((s, p) => s + p.amount, 0);
  const unapplied = cash - appliedTotal - reservedTotal;
  const nAcc = S.payments.filter(p => S.matches[p.id]?.status === "accepted").length;
  const nProp = S.payments.filter(p => S.matches[p.id]?.status === "proposed").length;
  const pct = (a, b) => b ? Math.max(0, Math.min(100, a / b * 100)) : 0;
  $("summary").innerHTML = `
    <div class="stat"><div class="k">Open AR</div><div class="v">${fmt(arTotal - appliedTotal)}</div><div class="n">${S.invoices.length} invoices</div></div>
    <div class="stat"><div class="k">Cash received</div><div class="v">${fmt(cash)}</div><div class="n">${S.payments.length} payments</div></div>
    <div class="stat"><div class="k">Applied</div><div class="v">${fmt(appliedTotal)}</div><div class="n">${nAcc} accepted</div>
      <div class="meter"><i style="width:${pct(appliedTotal, cash)}%;background:var(--ok)"></i><i style="width:${pct(reservedTotal, cash)}%;background:var(--warn)"></i></div></div>
    <div class="stat"><div class="k">Awaiting review</div><div class="v">${fmt(reservedTotal)}</div><div class="n">${nProp} proposals</div></div>
    <div class="stat"><div class="k">Unapplied cash</div><div class="v" style="color:${unapplied > 0 ? "var(--bad)" : "inherit"}">${fmt(unapplied)}</div><div class="n">${S.isSample ? "Sample data" : "On account"}</div></div>`;

  // payments
  const filt = p => { const st = S.matches[p.id]?.status || "unmatched";
    return S.filter === "all" || (S.filter === "review" && st === "proposed") || (S.filter === "open" && (st === "unmatched" || st === "rejected")) || (S.filter === "done" && st === "accepted"); };
  const rows = S.payments.filter(filt);
  $("payCount").textContent = S.payments.length ? `${rows.length} of ${S.payments.length}` : "";
  const openInv = S.invoices.map(i => ({ i, open: i.amount - (applied[i.id] || 0) - (reserved[i.id] || 0) })).filter(x => x.open > 0);
  $("payList").innerHTML = rows.length ? rows.map(p => {
    const m = S.matches[p.id] || { status: "unmatched", allocations: [] };
    const [sl, sc] = STATUS[m.status] || STATUS.unmatched;
    const exc = m.exception && m.exception !== "none" || m.status === "proposed" || m.status === "accepted" ? (EXC[m.exception] || [m.exception, "c-neutral"]) : null;
    const allocTotal = m.allocations.reduce((s, a) => s + a.amount, 0);
    const confColor = m.confidence >= .9 ? "var(--ok)" : m.confidence >= .7 ? "var(--warn)" : "var(--bad)";
    const allocHtml = m.allocations.length ? `<div class="alloc">${m.allocations.map(a => { const i = invById(a.invoiceId) || {};
        return `<span class="inv">${esc(i.number)}</span><span class="cust">${esc(i.customer)}</span><span class="num">${fmt(a.amount)}</span>`; }).join("")}
        ${p.amount - allocTotal !== 0 ? `<span class="inv" style="color:var(--muted)">Unapplied</span><span></span><span class="num" style="color:var(--bad)">${fmt(p.amount - allocTotal)}</span>` : ""}</div>` : "";
    const pickable = openInv.filter(x => !m.allocations.some(a => a.invoiceId === x.i.id));
    const canAddManual = m.status !== "proposed" && (p.amount - (m.status === "accepted" ? allocTotal : 0)) > 0 && pickable.length;
    const pk = S.pick[p.id];
    const pkOpen = canAddManual && pk && pk.open;
    const manual = canAddManual ? `<button class="btn small" data-pickopen="${p.id}" aria-expanded="${pkOpen ? "true" : "false"}">${pkOpen ? "Close finder" : m.status === "accepted" ? "Add invoice…" : "Find invoice…"}</button>` : "";
    const pickerHtml = pkOpen ? pickerPanel(p, m) : "";
    const btns = m.status === "proposed" ? `<button class="btn small ok" data-act="accept" data-id="${p.id}">Accept</button><button class="btn small bad" data-act="reject" data-id="${p.id}">Reject</button>`
      : m.status === "accepted" && m.method !== "manual" ? `<button class="btn small" data-act="undo" data-id="${p.id}">Undo</button>`
      : m.status === "accepted" ? `<button class="btn small" data-act="reject" data-id="${p.id}">Remove</button>` : "";
    return `<article class="pay s-${m.status}">
      <div><div class="payer">${esc(p.payer)}</div><div class="meta">${esc(p.date)} · ${esc(p.currency)}</div>
        ${p.reference ? `<span class="ref">${esc(p.reference)}</span>` : `<span class="ref" style="color:var(--muted)">no reference</span>`}
        <div class="amt">${fmt(p.amount)}</div></div>
      <div class="match">
        <div class="chips"><span class="chip ${sc}">${sl}</span>${exc ? `<span class="chip ${exc[1]}">${esc(exc[0])}</span>` : ""}${m.method && m.status !== "unmatched" && m.status !== "rejected" ? `<span class="chip c-neutral">${METHOD[m.method] || ""}</span>` : ""}
          ${m.allocations.length && m.method !== "manual" ? `<span class="conf"><span class="track"><i style="width:${Math.round(m.confidence * 100)}%;background:${confColor}"></i></span>${Math.round(m.confidence * 100)}%</span>` : ""}</div>
        ${allocHtml}
        ${m.reason ? `<div class="reason">${esc(m.reason)}</div>` : (m.status === "unmatched" ? `<div class="reason">Not matched yet. Run auto-match or use Find invoice.</div>` : "")}
        <div class="actions">${btns}${manual}</div>
      </div>${pickerHtml}</article>`;
  }).join("") : `<div class="empty">${S.payments.length ? "Nothing in this view." : "No payments yet. Load the sample data or import a bank statement / remittance CSV."}</div>`;

  // invoices
  $("invCount").textContent = S.invoices.length ? `${S.invoices.length}` : "";
  $("invBody").innerHTML = S.invoices.length ? S.invoices.map(i => {
    const ap = applied[i.id] || 0, rs = reserved[i.id] || 0, open = i.amount - ap;
    const st = open <= 0 ? ["Paid", "c-ok"] : ap > 0 ? ["Part paid", "c-accent"] : rs > 0 ? ["Proposed", "c-warn"] : ["Open", "c-neutral"];
    const dueD = new Date(i.due); const late = open > 0 && !isNaN(dueD) && dueD < today;
    return `<tr><td><span class="mono">${esc(i.number)}</span><span class="due ${late ? "late" : ""}" style="display:block">${late ? "Overdue · " : "Due "}${esc(i.due)}</span></td>
      <td><button class="linkish cust" data-gocust="${esc(i.customerId || "")}" title="Open ${esc(i.customer)}">${esc(i.customer)}</button><span class="desc">${esc(ctrById(i.contractId)?.number || "No contract")}</span></td>
      <td class="num">${fmt(i.amount)}</td><td class="num">${fmt(open)}</td><td><span class="chip ${st[1]}">${st[0]}</span></td></tr>`;
  }).join("") : `<tr><td colspan="5" class="empty">No invoices yet.</td></tr>`;

  $("runBtn").disabled = S.busy; $("runBtn").textContent = S.busy ? "Matching…" : "Run auto-match";
  $("acceptHighBtn").disabled = S.busy || !S.payments.some(p => S.matches[p.id]?.status === "proposed" && S.matches[p.id].confidence >= .95);
  $("exportBtn").hidden = !Object.values(S.matches).some(m => m && m.allocations.length);
  if (S.view === "customers") renderCustomers();
}
