// AR team experience: a ServiceNow configurable workspace (UI Builder) — unified header, left rail,
// list menu, tabbed records, landing page, list pages and record pages with UI actions and activity stream.
import { ctrById, ctrStatus, custById, rollup } from "../ledger.js";
import { REQ_OPEN, displayOf, me, recById, userById } from "../records.js";
import { ROLES, TABLES } from "../schema.js";
import { S } from "../state.js";
import { DAY, esc, fmt, today } from "../util.js";
import { acctById, acctLabel, yesterday } from "../bsu.js";
import { BANKS } from "../schema.js";
import { acctType, bsuPage } from "./bsu.js";
import { cashPage } from "./cash.js";
import { custName, ctrNo, daysLabel, fieldHtml, icon, initials, invChip, invMoney, meterRow, payChip, payMoney, refLink, relatedTable, reqChip, sn } from "./common.js";

const W = () => S.ui.ws;
const mine = r => r.assignedTo === me()?.id;

// ---------- list definitions (list layouts + filters, i.e. list menu modules) ----------
export const LISTS = {
  requests: {
    filters: {
      open: ["Open requests", r => REQ_OPEN.includes(r.state)],
      new: ["New, unassigned", r => r.state === "new" && !r.assignedTo],
      mine: ["Assigned to me", r => mine(r) && REQ_OPEN.includes(r.state)],
      awaiting: ["Awaiting info", r => r.state === "awaiting_info"],
      all: ["All", () => true]
    },
    cols: [["Number", r => refLink("requests", r.id, r.number), "", "number"], ["What should be invoiced", r => esc(r.title), "wrap", "title"], ["Customer", r => esc(custName(r.customerId)), "", "customerId"],
      ["Amount", r => fmt(r.amount), "num", "amount"], ["State", r => reqChip(r), "", "state"], ["Assigned to", r => esc(userById(r.assignedTo)?.name || "—"), "", "assignedTo"],
      ["Requested by", r => esc(userById(r.requestedBy)?.name || "—"), "", "requestedBy"], ["Opened", r => esc(r.opened), "", "opened"]],
    sort: (a, b) => String(b.opened).localeCompare(String(a.opened)),
    text: r => [r.number, r.title, custName(r.customerId), userById(r.requestedBy)?.name].join(" ")
  },
  invoices: {
    filters: {
      draft: ["Drafts", i => i.state === "draft"],
      open: ["Issued, unpaid", i => i.state === "issued" && invMoney(i).open > 0],
      overdue: ["Overdue", i => invMoney(i).late],
      all: ["All", () => true]
    },
    cols: [["Number", i => refLink("invoices", i.id, i.number), "", "number"], ["Customer", i => esc(i.customer), "", "customerId"], ["Contract", i => esc(ctrNo(i.contractId)), "", "contractId"],
      ["Description", i => esc(i.desc), "wrap", "desc"], ["Amount", i => fmt(i.amount), "num", "amount"], ["Amount due", i => fmt(invMoney(i).open), "num", null],
      ["Due", i => `${esc(i.due || "—")}${invMoney(i).late ? `<span class="desc bad">${esc(daysLabel(i.due))}</span>` : ""}`, "", "due"], ["Status", i => invChip(i), "", "state"]],
    sort: (a, b) => String(b.number).localeCompare(String(a.number)),
    text: i => [i.number, i.customer, i.desc, ctrNo(i.contractId)].join(" ")
  },
  payments: {
    filters: {
      unapplied: ["Deposits to match", p => payMoney(p).unapplied > 0],
      all: ["All deposits", () => true]
    },
    cols: [["Deposit ID", p => refLink("payments", p.id, p.number), "", "number"], ["Value date", p => esc(p.date), "", "date"], ["Bank account", p => esc(acctLabel(acctById(p.bankAccountId))), "", "bankAccountId"],
      ["Payer", p => esc(p.payer), "", "payer"], ["Reference", p => `<span class="mono small">${esc(p.reference || "—")}</span>`, "wrap", "reference"], ["Amount", p => fmt(p.amount), "num", "amount"],
      ["Unmatched", p => fmt(payMoney(p).unapplied), "num", null], ["Match", p => payChip(p), "", null]],
    sort: (a, b) => String(b.date).localeCompare(String(a.date)) || String(a.number).localeCompare(String(b.number)),
    text: p => [p.number, p.payer, p.reference, acctLabel(acctById(p.bankAccountId))].join(" ")
  },
  uploads: {
    filters: { all: ["Statement uploads", () => true] },
    cols: [["Upload", u => refLink("uploads", u.id, u.number), "", "number"], ["Bank account", u => esc(acctLabel(acctById(u.bankAccountId))), "", "bankAccountId"], ["Department", u => esc(acctById(u.bankAccountId)?.department || "—"), "", null],
      ["Statement date", u => esc(u.statementDate), "", "statementDate"], ["Deposits", u => String(u.depositCount), "num", "depositCount"], ["Total", u => fmt(u.depositTotal), "num", "depositTotal"],
      ["Uploaded", u => `${esc(u.uploadedAt)}<span class="desc">${esc(userById(u.uploadedBy)?.name || "")}</span>`, "", "uploadedAt"]],
    sort: (a, b) => String(b.statementDate).localeCompare(String(a.statementDate)) || String(b.number).localeCompare(String(a.number)),
    text: u => [u.number, acctLabel(acctById(u.bankAccountId)), u.fileName].join(" ")
  },
  bankAccounts: {
    filters: { all: ["Bank accounts", () => true] },
    cols: [["Account", a => refLink("bankAccounts", a.id, `${BANKS[a.bank].name} · ${a.number}`), "", "number"], ["Name", a => esc(a.name), "", "name"], ["Department", a => esc(a.department), "", "department"],
      ["Type", a => esc(acctType(a)), "", "accountType"], ["Last statement", a => esc(S.uploads.filter(u => u.bankAccountId === a.id).map(u => u.statementDate).sort().pop() || "—"), "", null]],
    sort: (a, b) => a.bank.localeCompare(b.bank) || a.number.localeCompare(b.number),
    text: a => [BANKS[a.bank].name, a.number, a.name, a.department].join(" "),
    newable: true
  },
  customers: {
    filters: { all: ["Customers", () => true] },
    cols: [["Name", c => refLink("customers", c.id, c.name), "", "name"], ["Parent group", c => esc(c.parent || "—"), "", "parent"], ["Terms", c => `Net ${esc(c.terms)}`, "", "terms"],
      ["Open AR", c => fmt(rollup(issuedOf(c.id)).open), "num", null], ["Overdue", c => { const o = rollup(issuedOf(c.id)).overdue; return o ? `<span class="bad">${fmt(o)}</span>` : fmt(0); }, "num", null]],
    sort: (a, b) => a.name.localeCompare(b.name),
    text: c => [c.name, c.parent, ...(c.aliases || [])].join(" "),
    newable: true
  },
  contracts: {
    filters: { all: ["Contracts", () => true], active: ["Active", k => ctrStatus(k)[0] === "Active"] },
    cols: [["Number", k => refLink("contracts", k.id, k.number), "", "number"], ["Title", k => esc(k.title), "wrap", "title"], ["Customer", k => esc(custName(k.customerId)), "", "customerId"],
      ["Billing", k => esc(k.billing), "", "billing"], ["Value", k => fmt(k.value || 0), "num", "value"], ["End", k => esc(k.end || "—"), "", "end"], ["Status", k => { const s = ctrStatus(k); return `<span class="chip ${s[1]}">${s[0]}</span>`; }, "", null]],
    sort: (a, b) => a.number.localeCompare(b.number),
    text: k => [k.number, k.title, custName(k.customerId)].join(" "),
    newable: true
  }
};
const issuedOf = custId => S.invoices.filter(i => i.customerId === custId && i.state === "issued");

const MENU = [
  ["AR requests", [["requests", "open"], ["requests", "new"], ["requests", "mine"], ["requests", "awaiting"], ["requests", "all"]]],
  ["Invoices", [["invoices", "draft"], ["invoices", "open"], ["invoices", "overdue"], ["invoices", "all"]]],
  ["Bank statements", [["uploads", "all"], ["payments", "unapplied"], ["payments", "all"], ["bankAccounts", "all"]]],
  ["Master data", [["customers", "all"], ["contracts", "all"]]]
];

// ---------- shell ----------
function mainLabel() {
  const m = W().main;
  if (m.kind === "home") return "Home";
  if (m.kind === "cash") return "Cash application";
  if (m.kind === "bsu") return "Bank statement upload";
  return `${TABLES[m.table].plural}: ${LISTS[m.table].filters[m.filter][0]}`;
}

function tabLabel(t) {
  if (t.id.startsWith("new")) return `New ${TABLES[t.table].label.toLowerCase()}`;
  return displayOf(t.table, recById(t.table, t.id)) || TABLES[t.table].label;
}

export function workspaceView() {
  const w = W(), m = w.main, u = me();
  const rail = [["home", "Home", "home"], ["list", "Lists", "list"], ["bsu", "Bank statement upload (BSU)", "upload"], ["cash", "Cash application", "cash"]];
  const railActive = k => k === "list" ? (w.listMenu || m.kind === "list") : m.kind === k && !w.listMenu;
  const counts = { new: S.requests.filter(LISTS.requests.filters.new[1]).length };
  return `<div class="ws">
    <header class="ws-head"${sn("Unified navigation header (Next Experience). Workspace: Receivables Workspace, role " + ROLES.ar.role)}>
      <div class="ws-brand"><span class="ws-logo" aria-hidden="true">AR</span><span>Receivables Workspace</span></div>
      <form class="ws-search" role="search" id="wsSearch"${sn("Global search: AR request, invoice, payment, contract numbers and customer names")}>${icon("search", 16)}<input id="wsQ" type="search" placeholder="Search number or customer" aria-label="Search records" autocomplete="off"></form>
      <div class="ws-user"><span class="ws-bell" title="${counts.new} new AR requests">${icon("bell", 18)}${counts.new ? `<b>${counts.new}</b>` : ""}</span><span class="avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="ws-uname">${esc(u.name)}</span></div>
    </header>
    <div class="ws-body">
      <nav class="ws-rail" aria-label="Workspace navigation"${sn("Workspace sidebar (Home / List / custom page)")}>
        ${rail.map(([k, l, ic]) => `<button type="button" data-rail="${k}" title="${l}" aria-label="${l}" aria-current="${railActive(k)}">${icon(ic, 20)}</button>`).join("")}
      </nav>
      ${w.listMenu ? `<aside class="ws-listmenu" aria-label="Lists"${sn("List menu: sys_ux_list_menu_config → categories and lists with conditions")}>
        <div class="lm-head"><b>Lists</b><button type="button" class="iconbtn" data-rail="closelists" aria-label="Close lists">${icon("close", 16)}</button></div>
        ${MENU.map(([g, items]) => `<div class="lm-group"><h3>${esc(g)}</h3>${items.map(([t, f]) => {
          const n = S[t].filter(LISTS[t].filters[f][1]).length;
          const on = m.kind === "list" && m.table === t && m.filter === f;
          return `<button type="button" class="lm-item" data-list="${t}:${f}" aria-current="${on}"><span>${esc(LISTS[t].filters[f][0])}</span><span class="count">${n}</span></button>`; }).join("")}</div>`).join("")}
      </aside>` : ""}
      <main class="ws-main">
        <div class="ws-tabs" role="tablist" aria-label="Open tabs"${sn("Workspace tabs: landing / list tab plus one tab per opened record")}>
          <button type="button" role="tab" class="ws-tab" data-tab="main" aria-selected="${w.active === "main"}">${esc(mainLabel())}</button>
          ${w.tabs.map(t => `<span class="ws-tab rec${w.active === t.key ? " on" : ""}"><button type="button" role="tab" data-tab="${esc(t.key)}" aria-selected="${w.active === t.key}"><span class="tt">${esc(TABLES[t.table].label)}</span> ${esc(tabLabel(t))}</button><button type="button" class="x" data-closetab="${esc(t.key)}" aria-label="Close ${esc(tabLabel(t))}">${icon("close", 14)}</button></span>`).join("")}
        </div>
        <div class="ws-content">${w.active === "main" ? mainContent() : recordPage(w.tabs.find(t => t.key === w.active))}</div>
      </main>
    </div>
  </div>`;
}

function mainContent() {
  const m = W().main;
  if (m.kind === "cash") return cashPage();
  if (m.kind === "bsu") return bsuPage();
  if (m.kind === "list") return listPage(m.table, m.filter);
  return homePage();
}

// ---------- landing page ----------
function homePage() {
  const u = me();
  const f = LISTS.requests.filters, fi = LISTS.invoices.filters;
  const overdue = S.invoices.filter(fi.overdue[1]);
  const unappliedPays = S.payments.filter(p => payMoney(p).unapplied > 0);
  const cards = [
    ["New AR requests", S.requests.filter(f.new[1]).length, "Unassigned cases from the portal", "list", "requests:new"],
    ["Assigned to me", S.requests.filter(f.mine[1]).length, "Open cases you own", "list", "requests:mine"],
    ["Awaiting info", S.requests.filter(f.awaiting[1]).length, "Waiting on the project team", "list", "requests:awaiting"],
    ["Draft invoices", S.invoices.filter(fi.draft[1]).length, "Created, not yet issued", "list", "invoices:draft"],
    ["Overdue", `SGD ${fmt(overdue.reduce((s, i) => s + invMoney(i).open, 0))}`, `${overdue.length} invoices past due`, "list", "invoices:overdue"],
    ["Deposits to match", `SGD ${fmt(unappliedPays.reduce((s, p) => s + payMoney(p).unapplied, 0))}`, `${unappliedPays.length} deposits`, "cash", ""],
    [`Statements for ${yesterday()}`, `${S.bankAccounts.filter(a => S.uploads.some(u => u.bankAccountId === a.id && u.statementDate === yesterday())).length} of ${S.bankAccounts.length}`, "Bank accounts uploaded (BSU)", "bsu", ""]
  ];
  // aging of issued, open invoices
  const buckets = [["Current", 0], ["1–30", 0], ["31–60", 0], ["61–90", 0], ["90+", 0]];
  for (const i of S.invoices) { if (i.state !== "issued") continue; const o = invMoney(i).open; if (o <= 0) continue;
    const d = Math.round((today - new Date(i.due + "T00:00:00")) / DAY);
    buckets[d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4][1] += o; }
  const max = Math.max(1, ...buckets.map(b => b[1]));
  const newReqs = S.requests.filter(r => r.state === "new").sort(LISTS.requests.sort).slice(0, 5);
  const hr = new Date().getHours();
  return `<div class="page">
    <div class="pagehead"><div><h1 class="pt">Good ${hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening"}, ${esc(u.name.split(" ")[0])}</h1><p class="psub">Receivables at a glance. Select a card to open the list behind it.</p></div></div>
    <section class="kpis"${sn("Landing page: single-score data visualisations, each linked to a list menu module")}>
      ${cards.map(([k, v, n, kind, target]) => `<button type="button" class="kpi" ${kind === "list" ? `data-list="${target}"` : `data-rail="${kind}"`}><span class="k">${esc(k)}</span><span class="v">${esc(String(v))}</span><span class="n">${esc(n)}</span></button>`).join("")}
    </section>
    <div class="home-grid">
      <section class="card"${sn("Data visualisation: bar chart of x_ar_invoice.amount_due grouped by days past due_date")}>
        <header><h2>Receivables aging</h2><span class="muted small">Amount due, SGD</span></header>
        <div class="aging">${buckets.map(([l, v], ix) => `<div class="ag-row"><span class="ag-l">${l}</span><span class="ag-bar"><i style="width:${(v / max * 100).toFixed(1)}%;background:${ix === 0 ? "var(--accent)" : ix === 1 ? "var(--warn)" : "var(--bad)"}"></i></span><span class="ag-v num">${fmt(v)}</span></div>`).join("")}</div>
      </section>
      <section class="card">
        <header><h2>New AR requests</h2><button type="button" class="linkish small" data-list="requests:new">View all</button></header>
        ${newReqs.length ? `<ul class="mini">${newReqs.map(r => `<li><button type="button" class="mini-row" data-open="requests:${r.id}"><span><b class="mono">${esc(r.number)}</b> ${esc(r.title)}<span class="desc">${esc(custName(r.customerId))} · from ${esc(userById(r.requestedBy)?.name || "")} · ${esc(r.opened)}</span></span><span class="num">${fmt(r.amount)}</span></button></li>`).join("")}</ul>` : `<p class="empty small">No new requests.</p>`}
      </section>
      <section class="card wide">
        <header><h2>Overdue invoices</h2><button type="button" class="linkish small" data-list="invoices:overdue">View all</button></header>
        ${overdue.length ? `<ul class="mini">${overdue.sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 6).map(i => `<li><button type="button" class="mini-row" data-open="invoices:${i.id}"><span><b class="mono">${esc(i.number)}</b> ${esc(i.customer)}<span class="desc bad">${esc(daysLabel(i.due))}</span></span><span class="num">${fmt(invMoney(i).open)}</span></button></li>`).join("")}</ul>` : `<p class="empty small">Nothing overdue.</p>`}
      </section>
    </div>
  </div>`;
}

// ---------- list page ----------
export function listRows(table, filter) {
  const def = LISTS[table], q = W().q.trim().toLowerCase();
  let rows = S[table].filter(def.filters[filter][1]);
  if (q) rows = rows.filter(r => def.text(r).toLowerCase().includes(q));
  rows = rows.slice().sort(def.sort);
  return { rows, html: rows.length ? rows.map(r => `<tr data-open="${table}:${r.id}" tabindex="0">${def.cols.map(c => `<td class="${c[2]}">${c[1](r)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${def.cols.length}" class="empty">No records match.</td></tr>` };
}

function listPage(table, filter) {
  const def = LISTS[table], t = TABLES[table];
  const { rows, html } = listRows(table, filter);
  return `<div class="page">
    <div class="pagehead"><div><h1 class="pt">${esc(t.plural)}</h1><p class="psub">${esc(def.filters[filter][0])} · <span id="listCount">${rows.length}</span> record${rows.length === 1 ? "" : "s"}</p></div>
      ${def.newable ? `<button type="button" class="btn primary" data-new="${table}"${sn(`UI action: New (${t.table})`)}>New</button>` : ""}</div>
    <div class="listbar">
      <div class="seg" role="group" aria-label="Filter">${Object.entries(def.filters).map(([k, [l]]) => `<button type="button" data-list="${table}:${k}" aria-pressed="${k === filter}">${esc(l)}</button>`).join("")}</div>
      <label class="listq">${icon("search", 15)}<input type="search" id="listQ" value="${esc(W().q)}" placeholder="Search in list" aria-label="Search in list"></label>
    </div>
    <div class="panel"${sn(`List: ${t.table} · list view layout + condition "${def.filters[filter][0]}"`)}><div class="tablewrap"><table class="list"><thead><tr>${def.cols.map(c => `<th class="${c[2]}"${c[3] ? sn(`${t.table}.${t.fields.find(f => f.key === c[3])?.name || c[3]}`) : sn("Calculated")}>${esc(c[0])}</th>`).join("")}</tr></thead>
      <tbody id="listBody">${html}</tbody></table></div></div>
  </div>`;
}

// ---------- record pages ----------
const LAYOUT = {
  requests: [["Request", ["customerId", "contractId", "billingType", "title", "amount", "invoiceDate", "periodStart", "periodEnd", "poNumber", "details"]], ["Case", ["state", "requestedBy", "assignedTo", "invoiceId", "opened"]]],
  invoices: [["Invoice", ["customerId", "contractId", "desc", "amount", "date", "due"]], ["Source", ["state", "requestId"]]],
  payments: [["Deposit", ["number", "bankAccountId", "uploadId", "date", "amount", "bankRef", "payer", "reference"]]],
  uploads: [["Statement upload", ["number", "bankAccountId", "statementDate", "fileName", "uploadedBy", "uploadedAt", "depositCount", "depositTotal", "skippedCount"]]],
  bankAccounts: [["Bank account", ["bank", "number", "name", "department", "accountType", "currency"]]],
  customers: [["Customer", ["name", "parent", "terms", "creditLimit", "aliases", "notes"]]],
  contracts: [["Contract", ["number", "customerId", "title", "billing", "value", "start", "end", "terms", "discPct", "discDays", "notes"]]]
};

function editable(table, rec) {
  if (table === "requests") return REQ_OPEN.includes(rec.state);
  if (table === "invoices") return rec.state === "draft";
  if (table === "payments" || table === "uploads") return false;
  return true;
}

function action(label, act, opts = {}) {
  return `<button type="button" class="btn${opts.primary ? " primary" : ""}${opts.danger ? " bad" : ""}" data-ui="${act}"${sn(opts.note || `UI action: ${label}`)}>${esc(label)}</button>`;
}

function headerFields(table, rec) {
  const hf = (k, v) => `<div class="hf"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  if (table === "requests") return [hf("State", reqChip(rec)), hf("Customer", refLink("customers", rec.customerId)), hf("Amount", `<span class="mono">SGD ${fmt(rec.amount)}</span>`),
    hf("Assigned to", esc(userById(rec.assignedTo)?.name || "Unassigned")), hf("Requested by", esc(userById(rec.requestedBy)?.name || "—")), hf("Opened", esc(rec.opened))];
  if (table === "invoices") { const m = invMoney(rec); return [hf("Status", invChip(rec)), hf("Amount", `<span class="mono">SGD ${fmt(rec.amount)}</span>`), hf("Amount due", `<span class="mono">SGD ${fmt(m.open)}</span>`),
    hf("Due", `${esc(rec.due || "—")}${rec.state === "issued" && m.open > 0 ? `<span class="desc${m.late ? " bad" : ""}">${esc(daysLabel(rec.due))}</span>` : ""}`), hf("Customer", refLink("customers", rec.customerId)), hf("AR request", refLink("requests", rec.requestId))]; }
  if (table === "payments") { const m = payMoney(rec), a = acctById(rec.bankAccountId); return [hf("Match", payChip(rec)), hf("Amount", `<span class="mono">SGD ${fmt(rec.amount)}</span>`), hf("Matched", `<span class="mono">${fmt(m.applied)}</span>`), hf("Unmatched", `<span class="mono${m.unapplied ? " bad" : ""}">${fmt(m.unapplied)}</span>`), hf("Value date", esc(rec.date)), hf("Department", esc(a?.department || "—")), hf("Account type", esc(a ? acctType(a) : "—"))]; }
  if (table === "uploads") return [hf("Bank account", refLink("bankAccounts", rec.bankAccountId)), hf("Statement date", esc(rec.statementDate)), hf("Deposits", String(rec.depositCount)), hf("Total", `<span class="mono">SGD ${fmt(rec.depositTotal)}</span>`), hf("Uploaded by", esc(userById(rec.uploadedBy)?.name || "—"))];
  if (table === "bankAccounts") { const ups = S.uploads.filter(u => u.bankAccountId === rec.id); return [hf("Bank", esc(BANKS[rec.bank]?.name || "—")), hf("Department", esc(rec.department || "—")), hf("Type", esc(acctType(rec))), hf("Uploads", String(ups.length)), hf("Last statement", esc(ups.map(u => u.statementDate).sort().pop() || "—"))]; }
  if (table === "customers") { const r = rollup(issuedOf(rec.id)); return [hf("Open AR", `<span class="mono">SGD ${fmt(r.open)}</span>`), hf("Overdue", `<span class="mono${r.overdue ? " bad" : ""}">${fmt(r.overdue)}</span>`),
    hf("Contracts", String(S.contracts.filter(k => k.customerId === rec.id).length)), hf("Credit limit", rec.creditLimit ? `<span class="mono">${fmt(rec.creditLimit)}</span>` : "Not set")]; }
  if (table === "contracts") { const r = rollup(S.invoices.filter(i => i.contractId === rec.id && i.state === "issued")); const s = ctrStatus(rec);
    return [hf("Status", `<span class="chip ${s[1]}">${s[0]}</span>`), hf("Customer", refLink("customers", rec.customerId)), hf("Value", `<span class="mono">${fmt(rec.value || 0)}</span>`), hf("Billed", `<span class="mono">${fmt(r.billed)}</span>`), hf("Collected", `<span class="mono">${fmt(r.collected)}</span>`)]; }
  return [];
}

function actionsFor(table, rec, isNew, canEdit) {
  const a = [];
  if (isNew) return action("Save", "save", { primary: true, note: "UI action: Submit (insert)" });
  if (table === "requests") {
    if (REQ_OPEN.includes(rec.state)) {
      if (!mine(rec)) a.push(action("Assign to me", "assign", { note: "UI action: Assign to me → assigned_to = current user, state = In progress" }));
      if (!rec.invoiceId) a.push(action("Create invoice", "invoice", { primary: true, note: "UI action: Create invoice → inserts draft x_ar_invoice from request fields, links ar_request" }));
      a.push(action("Request info", "info", { note: "UI action: Request info → state = Awaiting info; requires additional comment (visible on portal)" }));
      a.push(action("Reject", "reject", { danger: true, note: "UI action: Reject → state = Rejected; requires additional comment" }));
    }
    if (rec.invoiceId) a.push(`<button type="button" class="btn" data-open="invoices:${rec.invoiceId}">Open invoice</button>`);
  }
  if (table === "invoices") {
    if (rec.state === "draft") a.push(action("Issue invoice", "issue", { primary: true, note: "UI action: Issue → state = Issued; BR sets AR request to Invoiced and posts comment to requester" }));
    if (rec.state !== "cancelled") a.push(action("Cancel invoice", "cancel", { danger: true, note: "UI action: Cancel → only when no accepted allocations" }));
  }
  if (table === "payments" && payMoney(rec).unapplied > 0) a.push(`<button type="button" class="btn primary" data-matchdep="${rec.id}"${sn("UI action: Match → opens the invoice finder for this deposit")}>Match to invoice</button>`);
  if (table === "uploads") a.push(`<button type="button" class="btn" data-rail="bsu">Upload another</button>`);
  if (table === "bankAccounts") a.push(`<button type="button" class="btn" data-bsu-acct="${rec.id}">Upload statement</button>`);
  if (table === "customers") a.push(`<button type="button" class="btn" data-new="contracts" data-prefill-customer="${rec.id}">New contract</button>`);
  if (canEdit) a.push(action("Save", "save", { note: "UI action: Save (update)" }));
  return a.join("");
}

function activity(rec) {
  const c = W().composer[rec.id] || { kind: "work_note", text: "" };
  const open = REQ_OPEN.includes(rec.state);
  const items = rec.activity.slice().reverse();
  const kindLabel = { comment: "Additional comment · visible to requester", work_note: "Work note · AR team only", system: "System" };
  return `<aside class="rec-side">
    ${rec.attachments?.length ? `<section class="card att"${sn("sys_attachment on x_ar_request (attached on the portal form)")}><header><h2>Attachments</h2></header><ul>${rec.attachments.map(a => `<li>${icon("clip", 15)} ${esc(a)}</li>`).join("")}</ul></section>` : ""}
    <section class="card stream"${sn("Activity stream: comments (customer-visible journal) + work_notes (internal) + field changes")}>
      <header><h2>Activity</h2></header>
      ${open ? `<div class="composer">
        <div class="seg" role="group" aria-label="Entry type"><button type="button" data-ckind="work_note" aria-pressed="${c.kind === "work_note"}">Work note</button><button type="button" data-ckind="comment" aria-pressed="${c.kind === "comment"}">Additional comment</button></div>
        <textarea id="composer-${rec.id}" data-composer="${rec.id}" rows="3" placeholder="${c.kind === "comment" ? "Visible to the requester on the portal" : "Internal note for the AR team"}">${esc(c.text)}</textarea>
        <div class="row"><span class="hint">${c.kind === "comment" ? "The requester sees this on the portal." : "Only the AR team sees work notes."}</span><button type="button" class="btn small primary" data-ui="post">Post</button></div>
      </div>` : ""}
      <ol class="feed">${items.map(e => { const u = userById(e.by);
        return `<li class="fe k-${e.kind}"><span class="avatar sm" aria-hidden="true">${esc(initials(u?.name))}</span><div><div class="fe-h"><b>${esc(u?.name || "System")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><div class="fe-k">${kindLabel[e.kind]}</div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
    </section>
  </aside>`;
}

function related(table, rec) {
  if (table === "customers") {
    const ks = S.contracts.filter(k => k.customerId === rec.id), is = S.invoices.filter(i => i.customerId === rec.id), rs = S.requests.filter(r => r.customerId === rec.id);
    return relatedTable("Contracts", "contracts", ks, [["Number", k => refLink("contracts", k.id, k.number)], ["Title", k => esc(k.title), "wrap"], ["Billing", k => esc(k.billing)], ["Value", k => fmt(k.value || 0), "num"]], { via: "customer" }) +
      relatedTable("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { via: "customer" }) +
      relatedTable("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Amount", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { via: "customer" });
  }
  if (table === "contracts") {
    const is = S.invoices.filter(i => i.contractId === rec.id), rs = S.requests.filter(r => r.contractId === rec.id);
    const r = rollup(is.filter(i => i.state === "issued"));
    return `<section class="rel meters">${meterRow("Billed against contract value", r.billed, rec.value || 0, "var(--accent)")}${meterRow("Collected of billed", r.collected, r.billed, "var(--ok)")}</section>` +
      relatedTable("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { via: "contract" }) +
      relatedTable("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Amount", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { via: "contract" });
  }
  if (table === "uploads" || table === "bankAccounts") {
    const deps = S.payments.filter(p => table === "uploads" ? p.uploadId === rec.id : p.bankAccountId === rec.id).sort(LISTS.payments.sort);
    const ups = table === "bankAccounts" ? relatedTable("Statement uploads", "uploads", S.uploads.filter(u => u.bankAccountId === rec.id).sort(LISTS.uploads.sort),
      [["Upload", u => refLink("uploads", u.id, u.number)], ["Statement date", u => esc(u.statementDate)], ["Deposits", u => String(u.depositCount), "num"], ["Total", u => fmt(u.depositTotal), "num"]], { via: "bank_account" }) : "";
    return ups + relatedTable("Deposits", "payments", deps, [["Deposit ID", p => refLink("payments", p.id, p.number)], ["Payer", p => esc(p.payer)], ["Reference", p => `<span class="mono small">${esc(p.reference || "—")}</span>`, "wrap"], ["Amount", p => fmt(p.amount), "num"], ["Match", p => payChip(p)]], { via: table === "uploads" ? "bsu" : "bank_account" });
  }
  if (table === "invoices" || table === "payments") {
    const rows = [];
    for (const [pid, m] of Object.entries(S.matches)) { if (!m || m.status === "rejected") continue;
      for (const a of m.allocations) if ((table === "invoices" && a.invoiceId === rec.id) || (table === "payments" && pid === rec.id)) rows.push({ pid, a, m }); }
    const cols = table === "invoices"
      ? [["Deposit", x => refLink("payments", x.pid, recById("payments", x.pid)?.number)], ["Payer", x => esc(recById("payments", x.pid)?.payer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]]
      : [["Invoice", x => refLink("invoices", x.a.invoiceId)], ["Customer", x => esc(recById("invoices", x.a.invoiceId)?.customer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]];
    return relatedTable("Allocations", "allocations", rows, cols, { via: table === "invoices" ? "invoice" : "payment" });
  }
  return "";
}

function recordPage(tab) {
  if (!tab) return `<div class="page empty">This record is no longer available.</div>`;
  const { table, id } = tab, def = TABLES[table];
  const isNew = id.startsWith("new");
  const rec = isNew ? (tab.draft ||= {}) : recById(table, id);
  if (!rec) return `<div class="page empty">This record was removed.</div>`;
  const canEdit = isNew || editable(table, rec);
  const vals = tab.vals || null;
  const shown = vals ? { ...rec, ...vals } : rec;
  const sections = LAYOUT[table].map(([title, keys]) => `<fieldset class="fsec"><legend>${esc(title)}</legend><div class="fgrid">${keys.map(k => def.fields.find(f => f.key === k)).filter(Boolean).filter(f => !(isNew && f.readonly)).map(f => fieldHtml(table, f, shown, { prefix: `f-${tab.key}`, readonly: !canEdit, errors: tab.errors, vals: shown })).join("")}</div></fieldset>`).join("");
  const title = isNew ? `New ${def.label.toLowerCase()}` : displayOf(table, rec);
  const sub = table === "requests" ? rec.title : table === "invoices" ? rec.desc : table === "contracts" ? rec.title : table === "payments" ? `${rec.payer} · ${acctLabel(acctById(rec.bankAccountId))}`
    : table === "uploads" ? `${acctLabel(acctById(rec.bankAccountId))} · statement ${rec.statementDate}` : table === "bankAccounts" ? rec.name : rec.parent ? `Part of ${rec.parent}` : "";
  const twoCol = table === "requests" && !isNew;
  return `<div class="page rec">
    <div class="rec-head"${sn(`Record page (UI Builder default record page) · table ${def.table}${def.extends ? ` extends ${def.extends}` : ""}`)}>
      <div class="rh-top">
        <div class="rh-title"><span class="rh-table">${esc(def.label)}</span><h1>${esc(title)}</h1>${sub ? `<span class="rh-sub">${esc(sub)}</span>` : ""}</div>
        <div class="rh-actions">${actionsFor(table, rec, isNew, canEdit)}</div>
      </div>
      ${isNew ? "" : `<dl class="rh-fields"${sn("Record header: highlighted values")}>${headerFields(table, rec).join("")}</dl>`}
    </div>
    ${tab.msg ? `<div class="notice${tab.msg.kind === "err" ? " err" : " ok"}" role="alert"><span class="grow">${esc(tab.msg.text)}</span></div>` : ""}
    <div class="rec-body${twoCol ? " two" : ""}">
      <div class="rec-main">
        <form class="rform panel" data-rform="${esc(tab.key)}" novalidate${sn(`Form view: ${def.table} (Default view)`)}>${sections}</form>
        ${isNew ? "" : related(table, rec)}
      </div>
      ${twoCol ? activity(rec) : ""}
    </div>
  </div>`;
}
