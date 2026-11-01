// Invoice finder panel: ranked candidates and allocation preview before a manual match.
import { ctrById } from "../ledger.js";
import { allocationPlan, candidateList } from "../matching.js";
import { S } from "../state.js";
import { DAY, esc, fmt, today } from "../util.js";

export function dueText(i) {
  const d = new Date(i.due); if (isNaN(d)) return esc(i.due || "—");
  const days = Math.round((today - d) / DAY);
  return days > 0 ? `<span style="color:var(--bad)">${days} day${days > 1 ? "s" : ""} overdue</span>` : days === 0 ? "Due today" : `Due in ${-days} day${days < -1 ? "s" : ""}`;
}

export function candRows(p, m) {
  const pk = S.pick[p.id]; const q = (pk.q || "").trim().toLowerCase();
  let list = candidateList(p, m);
  if (q) list = list.filter(x => [x.i.number, x.i.customer, fmt(x.st.open), (x.st.open / 100).toFixed(2), x.i.due].join(" ").toLowerCase().includes(q));
  const total = list.length, shown = q ? list : list.slice(0, 12);
  if (!shown.length) return `<div class="empty">No open invoices match “${esc(pk.q)}”.</div>`;
  return shown.map(({ i, st, sg }) => {
    const on = pk.sel.includes(i.id);
    const tags = [
      sg.ref ? `<span class="chip c-accent">Cited in reference</span>` : "",
      sg.exact ? `<span class="chip c-ok">Amount matches</span>` : sg.near ? `<span class="chip c-warn">Within 3% (${sg.diff < 0 ? "short" : "over"} ${fmt(Math.abs(sg.diff))})</span>` : "",
      sg.ns >= .5 ? `<span class="chip c-neutral">Name ${Math.round(sg.ns * 100)}% similar</span>` : "",
      (m?.rejectedInvoices || []).includes(i.id) ? `<span class="chip c-bad">You rejected this</span>` : ""
    ].join("");
    return `<label class="cand${on ? " on" : ""}" data-candrow="${i.id}">
      <input type="checkbox" id="pk-${p.id}-${i.id}" data-pick="${p.id}" value="${i.id}"${on ? " checked" : ""}>
      <span class="cmain"><span class="crow"><span class="mono">${esc(i.number)}</span><span class="num">${fmt(st.open)}</span></span>
        <span class="meta cline">${esc(i.customer)}${ctrById(i.contractId) ? " · " + esc(ctrById(i.contractId).number) : ""} · ${dueText(i)}</span>${i.desc ? `<span class="desc">${esc(i.desc)}</span>` : ""}
        ${tags ? `<span class="chips">${tags}</span>` : ""}</span></label>`;
  }).join("") + (!q && total > shown.length ? `<div class="hint" style="padding:8px 12px">Showing the 12 likeliest of ${total}. Search to find others.</div>` : "");
}

export function previewHtml(p, m) {
  const pk = S.pick[p.id];
  const plan = allocationPlan(p, m, pk.sel);
  if (!plan.rows.length) return `<div class="pv-empty"><div class="k">Payment to apply</div><div class="amt">${fmt(plan.toApply)}</div>
    <p class="hint">Tick one or more invoices to see their full details and exactly how this payment would be applied. Nothing changes until you press Apply.</p></div>`;
  const cards = plan.rows.map(r => {
    const i = r.i;
    return `<div class="pv-inv">
      <div class="crow"><span class="mono" style="font-weight:500">${esc(i.number)}</span><span class="chip ${r.after > 0 ? "c-warn" : "c-ok"}">${r.after > 0 ? "Stays open" : "Fully paid"}</span></div>
      <div class="meta">${esc(i.customer)}${ctrById(i.contractId) ? ` · ${esc(ctrById(i.contractId).number)} ${esc(ctrById(i.contractId).title)}` : ""}</div>${i.desc ? `<div class="desc">${esc(i.desc)}</div>` : ""}
      <dl class="kv">
        <dt>Invoice date</dt><dd>${esc(i.date || "—")}</dd>
        <dt>Due</dt><dd>${esc(i.due || "—")} · ${dueText(i)}</dd>
        <dt>Original amount</dt><dd class="num">${fmt(i.amount)}</dd>
        ${r.st.applied ? `<dt>Already applied</dt><dd class="num">−${fmt(r.st.applied)}</dd>` : ""}
        ${r.st.reserved ? `<dt>Held by other proposals</dt><dd class="num">−${fmt(r.st.reserved)}</dd>` : ""}
        <dt>Open now</dt><dd class="num">${fmt(r.st.open)}</dd>
        <dt><b>Apply from this payment</b></dt><dd class="num"><b>${fmt(r.alloc)}</b></dd>
        <dt>Balance after</dt><dd class="num" style="color:${r.after > 0 ? "var(--warn)" : "var(--ok)"}">${fmt(r.after)}</dd>
      </dl>
      ${r.st.holders.length ? `<p class="warn">Also proposed for ${esc(r.st.holders.join(", "))}. Review that proposal so the invoice isn't paid twice.</p>` : ""}
      ${r.alloc === 0 ? `<p class="warn">Nothing left from this payment to apply here. Untick it or reorder your selection.</p>` : ""}
    </div>`; }).join("");
  const shortRow = plan.rows.find(r => r.after > 0 && r.alloc > 0);
  let verdict = "";
  if (plan.unapplied > 0) verdict = `<p class="verdict v-warn">${fmt(plan.unapplied)} of this payment stays unapplied and sits on account as unallocated cash.</p>`;
  else if (shortRow) { const pct = shortRow.after / shortRow.st.open * 100;
    verdict = `<p class="verdict v-warn">${esc(shortRow.i.number)} is short by ${fmt(shortRow.after)} (${pct.toFixed(pct < 10 ? 1 : 0)}%). ${pct <= 3 ? "That looks like an early-payment discount or bank charge." : "That looks like a partial payment or a deduction."} The balance stays open on the invoice.</p>`; }
  else verdict = `<p class="verdict v-ok">The payment is fully applied and every selected invoice is settled.</p>`;
  return `<div class="pv-sum">
      <div><div class="k">Payment</div><div class="num">${fmt(plan.toApply)}</div></div>
      <div><div class="k">Applied</div><div class="num">${fmt(plan.total)}</div></div>
      <div><div class="k">Unapplied</div><div class="num" style="color:${plan.unapplied > 0 ? "var(--bad)" : "inherit"}">${fmt(plan.unapplied)}</div></div>
    </div>${verdict}
    ${plan.rows.length > 1 ? `<p class="hint">Applied in the order you ticked them.</p>` : ""}
    <div class="pv-cards">${cards}</div>
    <label class="hint" for="pknote-${p.id}">Note for the audit trail (optional)</label>
    <input class="pv-note" id="pknote-${p.id}" data-picknote="${p.id}" value="${esc(pk.note || "")}" placeholder="e.g. Confirmed by customer email 22 Oct">
    <div class="actions"><button class="btn primary small" data-apply="${p.id}"${plan.total ? "" : " disabled"}>Apply ${fmt(plan.total)} to ${plan.rows.filter(r => r.alloc > 0).length} invoice${plan.rows.filter(r => r.alloc > 0).length === 1 ? "" : "s"}</button>
      <button class="btn small" data-pickclear="${p.id}">Clear selection</button></div>`;
}

export function pickerPanel(p, m) {
  const pk = S.pick[p.id];
  return `<div class="picker">
    <div class="pk-list">
      <div class="pk-search"><input type="search" id="pkq-${p.id}" data-pickq="${p.id}" value="${esc(pk.q || "")}" placeholder="Search invoice no., customer or amount" aria-label="Search open invoices"></div>
      <div class="pk-rows" id="pk-list-${p.id}">${candRows(p, m)}</div>
    </div>
    <div class="pk-prev" id="pk-prev-${p.id}" aria-live="polite">${previewHtml(p, m)}</div>
  </div>`;
}

export function refreshPicker(pid, which) {
  const p = S.payments.find(x => x.id === pid), m = S.matches[pid];
  if (!p || !S.pick[pid]) return;
  if (which !== "preview") { const el = document.getElementById("pk-list-" + pid); if (el) el.innerHTML = candRows(p, m); }
  if (which !== "list") { const el = document.getElementById("pk-prev-" + pid); if (el) el.innerHTML = previewHtml(p, m); }
}
