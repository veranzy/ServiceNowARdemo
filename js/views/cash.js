// Cash application page (AR workspace): summary, auto-match, proposals to review, manual invoice finder.
import { invById, invoiceUse } from "../ledger.js";
import { S } from "../state.js";
import { esc, fmt } from "../util.js";
import { refLink, sn } from "./common.js";
import { pickerPanel } from "./finder.js";

export const EXC = { none: ["Exact", "c-ok"], multi_invoice: ["Multi-invoice", "c-accent"], discount: ["Discount taken", "c-warn"], short_pay: ["Short pay", "c-warn"], partial: ["Partial", "c-warn"], over_pay: ["Overpayment", "c-warn"], ambiguous: ["Ambiguous", "c-bad"], unidentified: ["Unidentified", "c-bad"] };
export const STATUS = { accepted: ["Applied", "c-ok"], proposed: ["Proposed", "c-warn"], unmatched: ["Unmatched", "c-bad"], rejected: ["Rejected", "c-bad"] };
export const METHOD = { rule: "Auto", manual: "Manual" };

function summary() {
  const { applied, reserved } = invoiceUse();
  const issued = S.invoices.filter(i => i.state === "issued");
  const arTotal = issued.reduce((s, i) => s + i.amount, 0);
  const appliedTotal = Object.values(applied).reduce((s, v) => s + v, 0);
  const reservedTotal = Object.values(reserved).reduce((s, v) => s + v, 0);
  const cash = S.payments.reduce((s, p) => s + p.amount, 0);
  const unapplied = cash - appliedTotal - reservedTotal;
  const nAcc = S.payments.filter(p => S.matches[p.id]?.status === "accepted").length;
  const nProp = S.payments.filter(p => S.matches[p.id]?.status === "proposed").length;
  const pct = (a, b) => b ? Math.max(0, Math.min(100, a / b * 100)) : 0;
  return `<section class="summary" aria-label="Summary"${sn("Workspace data visualisation (UI Builder): single-score cards over x_ar_payment / x_ar_allocation")}>
    <div class="stat"><div class="k">Open AR</div><div class="v">${fmt(arTotal - appliedTotal)}</div><div class="n">${issued.length} issued invoices</div></div>
    <div class="stat"><div class="k">Cash received</div><div class="v">${fmt(cash)}</div><div class="n">${S.payments.length} payments</div></div>
    <div class="stat"><div class="k">Applied</div><div class="v">${fmt(appliedTotal)}</div><div class="n">${nAcc} accepted</div>
      <div class="meter"><i style="width:${pct(appliedTotal, cash)}%;background:var(--ok)"></i><i style="width:${pct(reservedTotal, cash)}%;background:var(--warn)"></i></div></div>
    <div class="stat"><div class="k">Awaiting review</div><div class="v">${fmt(reservedTotal)}</div><div class="n">${nProp} proposals</div></div>
    <div class="stat"><div class="k">Unapplied cash</div><div class="v" style="color:${unapplied > 0 ? "var(--bad)" : "inherit"}">${fmt(unapplied)}</div><div class="n">On account</div></div>
  </section>`;
}

function payCard(p, openInv) {
  const m = S.matches[p.id] || { status: "unmatched", allocations: [] };
  const [sl, sc] = STATUS[m.status] || STATUS.unmatched;
  const exc = m.exception && m.exception !== "none" || m.status === "proposed" || m.status === "accepted" ? (EXC[m.exception] || [m.exception, "c-neutral"]) : null;
  const allocTotal = m.allocations.reduce((s, a) => s + a.amount, 0);
  const confColor = m.confidence >= .9 ? "var(--ok)" : m.confidence >= .7 ? "var(--warn)" : "var(--bad)";
  const allocHtml = m.allocations.length ? `<div class="alloc">${m.allocations.map(a => { const i = invById(a.invoiceId) || {};
      return `<span class="inv">${refLink("invoices", i.id, i.number)}</span><span class="cust">${esc(i.customer)}</span><span class="num">${fmt(a.amount)}</span>`; }).join("")}
      ${p.amount - allocTotal !== 0 ? `<span class="inv muted">Unapplied</span><span></span><span class="num" style="color:var(--bad)">${fmt(p.amount - allocTotal)}</span>` : ""}</div>` : "";
  const pickable = openInv.filter(x => !m.allocations.some(a => a.invoiceId === x.i.id));
  const canAddManual = m.status !== "proposed" && (p.amount - (m.status === "accepted" ? allocTotal : 0)) > 0 && pickable.length;
  const pkOpen = canAddManual && S.pick[p.id]?.open;
  const manual = canAddManual ? `<button class="btn small" data-pickopen="${p.id}" aria-expanded="${pkOpen ? "true" : "false"}"${sn("UI action → opens invoice finder (modal / side panel in the workspace)")}>${pkOpen ? "Close finder" : m.status === "accepted" ? "Add invoice…" : "Find invoice…"}</button>` : "";
  const btns = m.status === "proposed" ? `<button class="btn small ok" data-act="accept" data-id="${p.id}"${sn("UI action: Accept → allocation.state = accepted")}>Accept</button><button class="btn small bad" data-act="reject" data-id="${p.id}"${sn("UI action: Reject → allocation.state = rejected")}>Reject</button>`
    : m.status === "accepted" && m.method !== "manual" ? `<button class="btn small" data-act="undo" data-id="${p.id}">Undo</button>`
    : m.status === "accepted" ? `<button class="btn small" data-act="reject" data-id="${p.id}">Remove</button>` : "";
  return `<article class="pay s-${m.status}">
    <div><div class="payer">${esc(p.payer)}</div><div class="meta">${refLink("payments", p.id, p.number)} · ${esc(p.date)} · ${esc(p.currency)}</div>
      ${p.reference ? `<span class="ref">${esc(p.reference)}</span>` : `<span class="ref muted">no reference</span>`}
      <div class="amt">${fmt(p.amount)}</div></div>
    <div class="match">
      <div class="chips"><span class="chip ${sc}">${sl}</span>${exc ? `<span class="chip ${exc[1]}">${esc(exc[0])}</span>` : ""}${m.method && m.status !== "unmatched" && m.status !== "rejected" ? `<span class="chip c-neutral">${METHOD[m.method] || ""}</span>` : ""}
        ${m.allocations.length && m.method !== "manual" ? `<span class="conf"><span class="track"><i style="width:${Math.round(m.confidence * 100)}%;background:${confColor}"></i></span>${Math.round(m.confidence * 100)}%</span>` : ""}</div>
      ${allocHtml}
      ${m.reason ? `<div class="reason">${esc(m.reason)}</div>` : (m.status === "unmatched" ? `<div class="reason">Not matched yet. Run auto-match or use Find invoice.</div>` : "")}
      <div class="actions">${btns}${manual}</div>
    </div>${pkOpen ? pickerPanel(p, m) : ""}</article>`;
}

export function cashPage() {
  const { applied, reserved } = invoiceUse();
  const filt = p => { const st = S.matches[p.id]?.status || "unmatched";
    return S.filter === "all" || (S.filter === "review" && st === "proposed") || (S.filter === "open" && (st === "unmatched" || st === "rejected")) || (S.filter === "done" && st === "accepted"); };
  const rows = S.payments.filter(filt);
  const openInv = S.invoices.filter(i => i.state === "issued").map(i => ({ i, open: i.amount - (applied[i.id] || 0) - (reserved[i.id] || 0) })).filter(x => x.open > 0);
  const st = S.status;
  const hasHigh = S.payments.some(p => S.matches[p.id]?.status === "proposed" && S.matches[p.id].confidence >= .95);
  const hasAlloc = Object.values(S.matches).some(m => m && m.allocations.length);
  return `<div class="page">
    <div class="pagehead"><div><h1 class="pt">Cash application</h1><p class="psub">Apply incoming payments to issued invoices. Auto-match proposes allocations; you accept, reject or match manually.</p></div></div>
    ${summary()}
    <div class="bar">
      <button class="btn primary" id="runBtn"${S.busy ? " disabled" : ""}${sn("UI action: Run auto-match → Script Include x_ar.AutoMatch (or scheduled Flow) creates proposed allocations")}>${S.busy ? "Matching…" : "Run auto-match"}</button>
      <button class="btn" id="acceptHighBtn"${hasHigh && !S.busy ? "" : " disabled"}${sn("List UI action: Accept all with confidence ≥ 95%")}>Accept all ≥ 95%</button>
      <button class="btn" id="importToggle" aria-expanded="${S.importOpen}"${sn("Interim: CSV import. Later requirement: bank statement load (Data Source + Transform Map / IntegrationHub)")}>Import payments</button>
      <span class="sp"></span>
      <button class="btn" id="exportBtn"${hasAlloc ? "" : " hidden"}>Export matches (.csv)</button>
    </div>
    ${st ? `<div class="notice${st.kind === "err" ? " err" : ""}"><span class="grow">${esc(st.text)}</span><button class="btn small" id="dismissBtn">Dismiss</button></div>` : ""}
    ${S.importOpen ? `<section class="import" aria-label="Import payments">
      <div class="row"><label class="btn small" for="fileIn">Choose .csv file</label><input type="file" id="fileIn" accept=".csv,text/csv,text/plain" hidden>
        <label class="hint"><input type="checkbox" id="replaceChk"> Replace existing payments</label></div>
      <p class="hint">Columns: payer, date, amount, reference (memo or remittance text), currency. Most bank statement exports work if they have these. Loading bank statements directly is a later requirement.</p>
      <textarea id="importText" spellcheck="false" placeholder="Paste CSV with a header row">${esc(S.importText)}</textarea>
      <div class="row"><button class="btn primary small" id="importBtn">Import rows</button><span class="hint" id="importMsg"></span></div></section>` : ""}
    <section class="panel" aria-label="Payments">
      <header><h2>Payments received <small>${S.payments.length ? `${rows.length} of ${S.payments.length}` : ""}</small></h2>
        <div class="seg" role="group" aria-label="Filter">${[["all", "All"], ["review", "To review"], ["open", "Unmatched"], ["done", "Applied"]].map(([k, l]) => `<button data-f="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join("")}</div>
      </header>
      <div id="payList">${rows.length ? rows.map(p => payCard(p, openInv)).join("") : `<div class="empty">${S.payments.length ? "Nothing in this view." : "No payments yet. Import a payments CSV."}</div>`}</div>
    </section>
  </div>`;
}
