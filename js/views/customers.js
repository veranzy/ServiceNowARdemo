// Customers & contracts module: customer list, customer detail, contracts, invoices, forms.
import { ctrById, ctrStatus, custById, custNames, invoiceUse, nextInvoiceNumber, rollup } from "../ledger.js";
import { $, S } from "../state.js";
import { addDays, cents, esc, fmt, isoToday, normTok, today, uid } from "../util.js";
import { render } from "./cash.js";

export const F = {
  customer: [
    { name: "name", label: "Customer name", req: true },
    { name: "parent", label: "Parent group", ph: "Optional, e.g. holding company that pays" },
    { name: "terms", label: "Payment terms (days)", type: "number" },
    { name: "creditLimit", label: "Credit limit", type: "number", step: "0.01" },
    { name: "aliases", label: "Names seen on bank statements", wide: true, ph: "Comma-separated, e.g. KESTREL ENGG, KESTREL ENG SB" },
    { name: "notes", label: "Notes for matching", type: "textarea", wide: true, ph: "Who pays, deduction habits, remittance quirks" }],
  contract: [
    { name: "number", label: "Contract number", req: true },
    { name: "title", label: "Title", req: true },
    { name: "billing", label: "Billing", type: "select", options: ["Monthly", "Milestone", "Annual", "Time & materials", "Per PO"].map(x => [x, x]) },
    { name: "value", label: "Contract value", type: "number", step: "0.01" },
    { name: "start", label: "Start", type: "date" },
    { name: "end", label: "End", type: "date" },
    { name: "terms", label: "Payment terms (days)", type: "number" },
    { name: "discPct", label: "Early-settlement discount %", type: "number", step: "0.1" },
    { name: "discDays", label: "Discount if paid within (days)", type: "number" },
    { name: "notes", label: "Notes", type: "textarea", wide: true, ph: "Instalments, retention, special terms" }],
  invoice: [
    { name: "number", label: "Invoice number", req: true },
    { name: "amount", label: "Amount", type: "number", step: "0.01", req: true },
    { name: "date", label: "Invoice date", type: "date" },
    { name: "due", label: "Due date", type: "date", ph: "Defaults from terms" },
    { name: "desc", label: "Description", wide: true, ph: "e.g. Milestone 2: detailed design" }]
};

export function formHtml(kind, vals, title, submit) {
  const fields = F[kind].map(f => {
    const v = vals[f.name] ?? "", id = `f-${kind}-${f.name}`;
    const ctl = f.type === "select" ? `<select id="${id}" name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}"${String(v) === o[0] ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`
      : f.type === "textarea" ? `<textarea id="${id}" name="${f.name}" rows="2" placeholder="${esc(f.ph || "")}">${esc(v)}</textarea>`
      : `<input id="${id}" name="${f.name}" type="${f.type || "text"}"${f.step ? ` step="${f.step}"` : ""}${f.req ? " required" : ""} value="${esc(v)}" placeholder="${esc(f.ph || "")}">`;
    return `<label class="fld${f.wide ? " wide" : ""}" for="${id}"><span>${esc(f.label)}</span>${ctl}</label>`;
  }).join("");
  return `<form class="eform" data-form="${kind}" novalidate><h4>${esc(title)}</h4>${fields}
    <div class="factions"><button class="btn primary small" type="submit">${esc(submit)}</button><button class="btn small" type="button" data-cact="cancel">Cancel</button><span class="hint ferr" id="ferr"></span></div></form>`;
}

export function renderCustomers() {
  const q = S.custQ.trim().toLowerCase();
  const all = S.customers.map(c => ({ c, r: rollup(S.invoices.filter(i => i.customerId === c.id)), nk: S.contracts.filter(k => k.customerId === c.id).length }))
    .sort((a, b) => b.r.overdue - a.r.overdue || b.r.open - a.r.open || a.c.name.localeCompare(b.c.name));
  const list = q ? all.filter(x => custNames(x.c).join(" ").toLowerCase().includes(q)) : all;
  if (!S.selCust || !custById(S.selCust)) S.selCust = list[0]?.c.id || null;
  $("custCount").textContent = S.customers.length ? String(S.customers.length) : "";
  const tot = rollup(S.invoices);
  $("custTotals").textContent = S.customers.length ? `${S.contracts.length} contracts · Open AR ${fmt(tot.open)} · Overdue ${fmt(tot.overdue)}` : "";
  $("custRows").innerHTML = list.length ? list.map(({ c, r, nk }) => `
    <button class="citem" data-cust="${c.id}" aria-current="${c.id === S.selCust}">
      <span class="crow"><b>${esc(c.name)}</b><span class="num">${fmt(r.open)}</span></span>
      <span class="crow meta"><span>${nk} contract${nk === 1 ? "" : "s"} · ${r.count} invoice${r.count === 1 ? "" : "s"}</span>${r.overdue > 0 ? `<span class="chip c-bad">${fmt(r.overdue)} overdue</span>` : r.open > 0 ? `<span class="chip c-neutral">Current</span>` : `<span class="chip c-ok">Settled</span>`}</span>
    </button>`).join("") : `<div class="empty">${S.customers.length ? "No customers match." : "No customers yet."}</div>`;
  renderCustomerDetail();
}

export function invStatus(i, use) {
  const ap = use.applied[i.id] || 0, rs = use.reserved[i.id] || 0, open = i.amount - ap;
  return open <= 0 ? ["Paid", "c-ok"] : ap > 0 ? ["Part paid", "c-accent"] : rs > 0 ? ["Proposed", "c-warn"] : ["Open", "c-neutral"];
}

export function invTable(invs, ctrId) {
  const use = invoiceUse();
  if (!invs.length) return `<div class="empty">No invoices on this ${ctrId ? "contract" : "customer"} yet.</div>`;
  return `<div class="tablewrap"><table><thead><tr><th>Invoice</th><th>Dates</th><th class="num">Amount</th><th class="num">Open</th><th>Status</th></tr></thead><tbody>${
    invs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(i => { const ap = use.applied[i.id] || 0, open = i.amount - ap; const st = invStatus(i, use);
      const d = new Date(i.due), late = open > 0 && !isNaN(d) && d < today;
      return `<tr><td><span class="mono">${esc(i.number)}</span>${i.desc ? `<span class="desc">${esc(i.desc)}</span>` : ""}</td>
        <td><span class="desc" style="color:var(--fg)">${esc(i.date || "—")}</span><span class="due ${late ? "late" : ""}">${late ? "Overdue · " : "Due "}${esc(i.due || "—")}</span></td>
        <td class="num">${fmt(i.amount)}</td><td class="num">${fmt(open)}</td><td><span class="chip ${st[1]}">${st[0]}</span></td></tr>`; }).join("")}</tbody></table></div>`;
}

export function meterRow(label, a, b, color) {
  const pct = b > 0 ? Math.max(0, Math.min(100, a / b * 100)) : 0;
  return `<div><div class="lbl"><span>${label}</span><span><span class="num">${fmt(a)}</span> of ${fmt(b)}${b > 0 ? ` · ${pct.toFixed(0)}%` : ""}</span></div>
    <div class="meter"><i style="width:${pct}%;background:${color}"></i></div></div>`;
}

export function renderCustomerDetail() {
  const el = $("custDetail"); const f = S.form;
  if (f && f.kind === "customer" && !f.id) { el.innerHTML = formHtml("customer", { terms: 30 }, "New customer", "Create customer"); return; }
  const c = custById(S.selCust);
  if (!c) { el.innerHTML = `<div class="panel empty">Add a customer to start building its contracts and invoices, or load the sample data with Load sample data on the Cash application tab.</div>`; return; }
  const invs = S.invoices.filter(i => i.customerId === c.id);
  const ctrs = S.contracts.filter(k => k.customerId === c.id).sort((a, b) => String(b.start).localeCompare(String(a.start)));
  const r = rollup(invs);
  const value = ctrs.reduce((s, k) => s + (k.value || 0), 0);
  const head = f && f.kind === "customer" && f.id === c.id
    ? formHtml("customer", { ...c, aliases: (c.aliases || []).join(", "), creditLimit: c.creditLimit ? (c.creditLimit / 100).toFixed(2) : "" }, "Edit customer", "Save changes")
    : `<div class="panel chead">
      <div class="ch-top"><div><h3 class="cname">${esc(c.name)}</h3>${c.parent ? `<div class="meta">Part of ${esc(c.parent)}</div>` : ""}</div>
        <div class="actions"><button class="btn small" data-cact="editcust">Edit</button><button class="btn small primary" data-cact="newctr">New contract</button></div></div>
      <div class="facts">
        <span><span class="k">Terms</span> Net ${esc(c.terms || 0)}</span>
        <span><span class="k">Credit limit</span> <span class="mono">${c.creditLimit ? fmt(c.creditLimit) : "Not set"}</span></span>
        ${c.aliases?.length ? `<span><span class="k">Pays as</span> ${c.aliases.map(a => `<span class="ref" style="margin:0">${esc(a)}</span>`).join(" ")}</span>` : ""}
      </div>
      ${c.notes ? `<p class="cnotes">${esc(c.notes)}</p>` : ""}
      ${c.creditLimit ? `<div style="margin-top:12px;max-width:420px">${meterRow("Credit used (open AR)", r.open, c.creditLimit, r.open > c.creditLimit ? "var(--bad)" : r.open > c.creditLimit * .8 ? "var(--warn)" : "var(--accent)")}</div>` : ""}
      <div class="cstats">
        <div><div class="k">Contract value</div><div class="v">${fmt(value)}</div></div>
        <div><div class="k">Billed</div><div class="v">${fmt(r.billed)}</div></div>
        <div><div class="k">Collected</div><div class="v">${fmt(r.collected)}</div></div>
        <div><div class="k">Open AR</div><div class="v">${fmt(r.open)}</div></div>
        <div><div class="k">Overdue</div><div class="v" style="color:${r.overdue > 0 ? "var(--bad)" : "inherit"}">${fmt(r.overdue)}</div></div>
      </div></div>`;
  const newCtr = f && f.kind === "contract" && !f.id ? formHtml("contract", { billing: "Monthly", terms: c.terms || 30, start: isoToday() }, `New contract for ${c.name}`, "Create contract") : "";
  const ctrHtml = ctrs.map(k => {
    if (f && f.kind === "contract" && f.id === k.id) return formHtml("contract", { ...k, value: k.value ? (k.value / 100).toFixed(2) : "" }, `Edit ${k.number}`, "Save contract");
    const ki = invs.filter(i => i.contractId === k.id); const kr = rollup(ki); const st = ctrStatus(k);
    const invForm = f && f.kind === "invoice" && f.parentId === k.id
      ? `<div style="padding:12px 14px;border-bottom:1px solid var(--line)">${formHtml("invoice", { number: nextInvoiceNumber(), date: isoToday() }, `New invoice on ${k.number}`, "Create invoice")}</div>` : "";
    return `<section class="panel ctr" aria-label="Contract ${esc(k.number)}">
      <header><div class="ctr-title"><span class="mono">${esc(k.number)}</span><b>${esc(k.title)}</b>
          <span class="meta">${esc(k.billing)} · ${esc(k.start || "?")} to ${esc(k.end || "open-ended")} · Net ${esc(k.terms || c.terms || 0)}${k.discPct ? ` · ${esc(k.discPct)}% discount within ${esc(k.discDays || 0)} days` : ""}</span>
          ${k.notes ? `<span class="meta">${esc(k.notes)}</span>` : ""}</div>
        <div class="actions"><span class="chip ${st[1]}">${st[0]}</span><button class="btn small" data-cact="editctr" data-id="${k.id}">Edit</button><button class="btn small" data-cact="newinv" data-id="${k.id}">Add invoice</button></div></header>
      <div class="ctr-bars">${meterRow("Billed against contract value", kr.billed, k.value || 0, "var(--accent)")}${meterRow("Collected of billed", kr.collected, kr.billed, "var(--ok)")}</div>
      ${invForm}${invTable(ki, k.id)}</section>`;
  }).join("");
  const loose = invs.filter(i => !i.contractId || !ctrById(i.contractId));
  const looseHtml = loose.length ? `<section class="panel ctr"><header><div class="ctr-title"><b>Invoices without a contract</b><span class="meta">One-off or imported invoices. Edit the contract list to link future billing.</span></div></header>${invTable(loose, null)}</section>` : "";
  el.innerHTML = head + newCtr + (ctrs.length || newCtr ? ctrHtml : `<div class="panel empty">No contracts yet for this customer. Use New contract to add one.</div>`) + looseHtml;
}

export function submitForm(form) {
  const kind = form.dataset.form, fd = Object.fromEntries(new FormData(form).entries()), f = S.form || {};
  const err = msg => { const e = form.querySelector("#ferr"); if (e) e.textContent = msg; };
  const t = s => String(s ?? "").trim();
  if (kind === "customer") {
    if (!t(fd.name)) return err("Enter the customer name.");
    const vals = { name: t(fd.name), parent: t(fd.parent), terms: Number(fd.terms) || 0, creditLimit: fd.creditLimit ? cents(fd.creditLimit) : 0,
      aliases: t(fd.aliases).split(",").map(t).filter(Boolean), notes: t(fd.notes) };
    if (f.id) { const c = custById(f.id); Object.assign(c, vals); S.invoices.forEach(i => { if (i.customerId === c.id) i.customer = c.name; }); }
    else { const c = { id: uid("c"), ...vals }; S.customers.push(c); S.selCust = c.id; }
  } else if (kind === "contract") {
    if (!t(fd.number) || !t(fd.title)) return err("Enter a contract number and title.");
    const vals = { number: t(fd.number), title: t(fd.title), billing: fd.billing, value: fd.value ? cents(fd.value) : 0, start: fd.start, end: fd.end,
      terms: Number(fd.terms) || 0, discPct: Number(fd.discPct) || 0, discDays: Number(fd.discDays) || 0, notes: t(fd.notes) };
    if (S.contracts.some(k => k.id !== f.id && normTok(k.number) === normTok(vals.number))) return err(`Contract ${vals.number} already exists.`);
    if (f.id) Object.assign(ctrById(f.id), vals); else S.contracts.push({ id: uid("k"), customerId: S.selCust, ...vals });
  } else if (kind === "invoice") {
    const k = ctrById(f.parentId), c = custById(k?.customerId); if (!k || !c) return;
    const amount = cents(fd.amount);
    if (!t(fd.number)) return err("Enter an invoice number.");
    if (!(amount > 0)) return err("Enter an amount greater than zero.");
    if (S.invoices.some(i => normTok(i.number) === normTok(fd.number))) return err(`Invoice ${t(fd.number)} already exists.`);
    const date = fd.date || isoToday();
    S.invoices.push({ id: uid("i"), customerId: c.id, contractId: k.id, customer: c.name, number: t(fd.number), desc: t(fd.desc), date,
      due: fd.due || addDays(date, k.terms || c.terms || 30), amount, currency: "SGD" });
    S.isSample = false;
  }
  S.form = null; render();
}
