// Cash application page (AR workspace): deposits from the Bank statements table, matched to issued invoices
// manually with the invoice finder. No auto-matching (decision D5).
import { acctById } from "../bsu.js";
import { invById, invoiceUse } from "../ledger.js";
import { BANKS } from "../schema.js";
import { S } from "../state.js";
import { esc, fmt } from "../util.js";
import { depositMoney, refLink, sn } from "./common.js";
import { pickerPanel } from "./finder.js";

export const EXC = { none: ["Exact", "c-ok"], multi_invoice: ["Multi-invoice", "c-accent"], discount: ["Discount taken", "c-warn"], short_pay: ["Short pay", "c-warn"], partial: ["Partial", "c-warn"], over_pay: ["Overpayment", "c-warn"] };

function summary() {
  const { applied } = invoiceUse();
  const issued = S.invoices.filter(i => i.state === "issued");
  const openAR = issued.reduce((s, i) => s + i.amount - (applied[i.id] || 0), 0);
  const total = S.deposits.reduce((s, p) => s + p.amount, 0);
  const matched = S.deposits.reduce((s, p) => s + depositMoney(p).applied, 0);
  const unmatched = S.deposits.filter(p => depositMoney(p).unapplied > 0);
  const pct = total ? Math.min(100, matched / total * 100) : 0;
  return `<section class="summary" aria-label="Summary"${sn("CSH-02")}>
    <div class="stat"><div class="k">Open AR</div><div class="v">${fmt(openAR)}</div><div class="n">${issued.length} issued invoices</div></div>
    <div class="stat"><div class="k">BSU deposits loaded</div><div class="v">${fmt(total)}</div><div class="n">${S.deposits.length} deposits · ${S.uploads.length} uploads</div></div>
    <div class="stat"><div class="k">Matched</div><div class="v">${fmt(matched)}</div><div class="n">${S.deposits.length - unmatched.length} fully matched</div>
      <div class="meter"><i style="width:${pct}%;background:var(--ok)"></i></div></div>
    <div class="stat"><div class="k">To match</div><div class="v" style="color:${unmatched.length ? "var(--bad)" : "inherit"}">${fmt(total - matched)}</div><div class="n">${unmatched.length} deposits</div></div>
  </section>`;
}

function depositCard(p, openInv) {
  const m = S.matches[p.id] || { status: "unmatched", allocations: [] };
  const money = depositMoney(p), a = acctById(p.bankAccountId);
  const exc = m.allocations.length ? (EXC[m.exception] || [m.exception, "c-neutral"]) : null;
  const allocHtml = m.allocations.length ? `<div class="alloc">${m.allocations.map(x => { const i = invById(x.invoiceId) || {};
      return `<span class="inv">${refLink("invoices", i.id, i.number)}</span><span class="cust">${esc(i.customer)}</span><span class="num">${fmt(x.amount)}</span>`; }).join("")}
      ${money.unapplied ? `<span class="inv muted">Unmatched</span><span></span><span class="num" style="color:var(--bad)">${fmt(money.unapplied)}</span>` : ""}</div>` : "";
  const pickable = openInv.filter(x => !m.allocations.some(al => al.invoiceId === x.i.id));
  const canMatch = money.unapplied > 0 && pickable.length;
  const pkOpen = canMatch && S.pick[p.id]?.open;
  const cls = money.state === "Matched" ? "accepted" : money.state === "Part matched" ? "proposed" : "unmatched";
  return `<article class="pay s-${cls}">
    <div><div class="payer">${esc(p.payer)}</div>
      <div class="meta">${refLink("deposits", p.id, p.number)}</div>
      <div class="meta">${esc(a ? `${BANKS[a.bank].name} · ${a.number}` : "")} · ${esc(p.date)}</div>
      ${p.reference ? `<span class="ref">${esc(p.reference)}</span>` : `<span class="ref muted">no reference</span>`}
      <div class="amt">${fmt(p.amount)}</div></div>
    <div class="match">
      <div class="chips"><span class="chip ${money.state === "Matched" ? "c-ok" : money.state === "Part matched" ? "c-accent" : "c-warn"}">${money.state}</span>${exc ? `<span class="chip ${exc[1]}">${esc(exc[0])}</span>` : ""}${a ? `<span class="chip c-neutral">${esc(a.department)}</span>` : ""}</div>
      ${allocHtml}
      ${m.reason ? `<div class="reason">${esc(m.reason)}</div>` : `<div class="reason">Not matched yet. Use Find invoice to choose the invoice(s) this deposit pays.</div>`}
      <div class="actions">
        ${canMatch ? `<button class="btn small${m.allocations.length ? "" : " primary"}" data-pickopen="${p.id}" aria-expanded="${pkOpen ? "true" : "false"}"${sn("UA-DEP-find")}>${pkOpen ? "Close finder" : m.allocations.length ? "Add invoice…" : "Find invoice…"}</button>` : ""}
        ${m.allocations.length ? `<button class="btn small" data-act="remove" data-id="${p.id}"${sn("UA-DEP-remove")}>Remove match</button>` : ""}
      </div>
    </div>${pkOpen ? pickerPanel(p, m) : ""}</article>`;
}

export function cashPage() {
  const { applied } = invoiceUse();
  const filt = p => { const st = depositMoney(p).state;
    return S.filter === "all" || (S.filter === "open" && st !== "Matched") || (S.filter === "done" && st === "Matched"); };
  const rows = S.deposits.filter(filt).sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.number.localeCompare(b.number));
  const openInv = S.invoices.filter(i => i.state === "issued").map(i => ({ i, open: i.amount - (applied[i.id] || 0) })).filter(x => x.open > 0);
  const st = S.status;
  const hasAlloc = Object.values(S.matches).some(m => m && m.allocations.length);
  return `<div class="page"${sn("CSH-01")}>
    <div class="pagehead"><div><h1 class="pt">Cash application</h1><p class="psub">Match BSU deposits (money received, loaded from the daily bank statements) to issued invoices. Matching is always manual: open a deposit's invoice finder, pick the invoice(s), check the preview and confirm.</p></div>
      <div class="bar"><button type="button" class="btn" data-rail="bsu">${"Upload statement"}</button><button class="btn" id="exportBtn"${sn("UA-DEP-export")}${hasAlloc ? "" : " hidden"}>Export matches (.csv)</button></div></div>
    ${summary()}
    ${st ? `<div class="notice${st.kind === "err" ? " err" : ""}"><span class="grow">${esc(st.text)}</span><button class="btn small" id="dismissBtn">Dismiss</button></div>` : ""}
    <section class="panel" aria-label="Deposits"${sn("CSH-03")}>
      <header><h2>BSU deposits <small>${S.deposits.length ? `${rows.length} of ${S.deposits.length}` : ""}</small></h2>
        <div class="seg" role="group" aria-label="Filter">${[["open", "To match"], ["done", "Matched"], ["all", "All"]].map(([k, l]) => `<button data-f="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join("")}</div>
      </header>
      <div id="payList">${rows.length ? rows.map(p => depositCard(p, openInv)).join("") : `<div class="empty">${S.deposits.length ? "Nothing in this view." : "No BSU deposits yet. Upload a bank statement first."}</div>`}</div>
    </section>
  </div>`;
}
