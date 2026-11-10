// AR team experience: a ServiceNow configurable workspace (UI Builder) — unified header, left rail,
// list menu, tabbed records, landing page, list pages and record pages with UI actions and activity stream.
import { ctrById, ctrStatus, custById, rollup } from "../ledger.js";
import { DOC_LABEL, GIRO_PURPOSE, LINE_TYPE, REQ_OPEN, ccEmails, contactFor, activeGiroCase, giroBlock, giroCases, giroLabel, ctrLabel, displayOf, historyOf, isShell, freqLabel, lineStatus, lineValue, linesLabel, me, nextBilling, periodDates, periodsDue, recById, reqLines, schedulePeriods, setupStatus, userById } from "../records.js";
import { CODE } from "../notes.js";
import { ROLES, TABLES, fieldVisible } from "../schema.js";
import { S } from "../state.js";
import { DAY, esc, fmt, nameSim, today } from "../util.js";
import { acctById, acctLabel, yesterday } from "../bsu.js";
import { BANKS } from "../schema.js";
import { acctType, bsuPage } from "./bsu.js";
import { cashPage } from "./cash.js";
import { reqCustName, custName, ctrNo, daysLabel, fieldHtml, icon, initials, invChip, invMoney, meterRow, depositChip, depositMoney, refLink, relatedTable, reqChip, sn } from "./common.js";

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
      setup: ["Customer setup pending", r => REQ_OPEN.includes(r.state) && r.form !== "AR-ix" && (!!r.newCustomer || !setupStatus(r).docsDone)],
      giro: ["AR-ix GIRO requests (open)", r => r.form === "AR-ix" && REQ_OPEN.includes(r.state)],
      giroall: ["All AR-ix GIRO cases", r => r.form === "AR-ix"],
      all: ["All", () => true]
    },
    cols: [["Number", r => refLink("requests", r.id, r.number), "", "number"], ["Form", r => `${esc(r.form || "AR-i")}<span class="desc">${esc(linesLabel(r))}</span>`, "", "form"], ["Request", r => esc(r.title), "wrap", "title"], ["Customer", r => `${esc(reqCustName(r))}${r.newCustomer ? ` <span class="chip c-warn">New</span>` : ""}`, "", "customerId"], ["Department", r => esc(r.department || "—"), "", "department"],
      ["Value", r => fmt(r.amount), "num", "amount"], ["State", r => reqChip(r), "", "state"], ["Assigned to", r => esc(userById(r.assignedTo)?.name || "—"), "", "assignedTo"],
      ["Requested by", r => esc(userById(r.requestedBy)?.name || "—"), "", "requestedBy"], ["Opened", r => esc(r.opened), "", "opened"]],
    sort: (a, b) => String(b.opened).localeCompare(String(a.opened)),
    text: r => [r.number, r.form, linesLabel(r), r.title, reqCustName(r), r.department, userById(r.requestedBy)?.name].join(" ")
  },
  invoices: {
    filters: {
      draft: ["Drafts", i => i.state === "draft"],
      open: ["Issued, unpaid", i => i.state === "issued" && invMoney(i).open > 0],
      overdue: ["Overdue", i => invMoney(i).late],
      all: ["All", () => true]
    },
    cols: [["Number", i => refLink("invoices", i.id, i.number), "", "number"], ["Customer", i => esc(i.customer), "", "customerId"], ["Contract", i => esc(ctrNo(i.contractId)), "", "contractId"],
      ["Description", i => esc(i.desc), "wrap", "desc"], ["Amount", i => fmt(i.amount), "num", "amount"], ["Amount due", i => fmt(invMoney(i).open), "num", "=INV.amount_due"],
      ["Due", i => `${esc(i.due || "—")}${invMoney(i).late ? `<span class="desc bad">${esc(daysLabel(i.due))}</span>` : ""}`, "", "due"], ["Status", i => invChip(i), "", "=INV.payment_status"]],
    sort: (a, b) => String(b.number).localeCompare(String(a.number)),
    text: i => [i.number, i.customer, i.desc, ctrNo(i.contractId)].join(" ")
  },
  deposits: {
    filters: {
      unapplied: ["BSU deposits to match", p => depositMoney(p).unapplied > 0],
      all: ["All BSU deposits", () => true]
    },
    cols: [["Deposit ID", p => refLink("deposits", p.id, p.number), "", "number"], ["Value date", p => esc(p.date), "", "date"], ["Bank account", p => esc(acctLabel(acctById(p.bankAccountId))), "", "bankAccountId"],
      ["Payer", p => esc(p.payer), "", "payer"], ["Reference", p => `<span class="mono small">${esc(p.reference || "—")}</span>`, "wrap", "reference"], ["Amount", p => fmt(p.amount), "num", "amount"],
      ["Unmatched", p => fmt(depositMoney(p).unapplied), "num", "=DEP.unmatched_amount"], ["Match", p => depositChip(p), "", "=DEP.match_state"]],
    sort: (a, b) => String(b.date).localeCompare(String(a.date)) || String(a.number).localeCompare(String(b.number)),
    text: p => [p.number, p.payer, p.reference, acctLabel(acctById(p.bankAccountId))].join(" ")
  },
  uploads: {
    filters: { all: ["Statement uploads", () => true] },
    cols: [["Upload", u => refLink("uploads", u.id, u.number), "", "number"], ["Bank account", u => esc(acctLabel(acctById(u.bankAccountId))), "", "bankAccountId"], ["Department", u => esc(acctById(u.bankAccountId)?.department || "—"), "", "=BSU.department"],
      ["Statement date", u => esc(u.statementDate), "", "statementDate"], ["Deposits", u => String(u.depositCount), "num", "depositCount"], ["Total", u => fmt(u.depositTotal), "num", "depositTotal"],
      ["Uploaded", u => `${esc(u.uploadedAt)}<span class="desc">${esc(userById(u.uploadedBy)?.name || "")}</span>`, "", "uploadedAt"]],
    sort: (a, b) => String(b.statementDate).localeCompare(String(a.statementDate)) || String(b.number).localeCompare(String(a.number)),
    text: u => [u.number, acctLabel(acctById(u.bankAccountId)), u.fileName].join(" ")
  },
  bankAccounts: {
    filters: { all: ["Bank accounts", () => true] },
    cols: [["Account", a => refLink("bankAccounts", a.id, `${BANKS[a.bank].name} · ${a.number}`), "", "number"], ["Name", a => esc(a.name), "", "name"], ["Department", a => esc(a.department), "", "department"],
      ["Type", a => esc(acctType(a)), "", "accountType"], ["Last statement", a => esc(S.uploads.filter(u => u.bankAccountId === a.id).map(u => u.statementDate).sort().pop() || "—"), "", "=BNK.last_statement"]],
    sort: (a, b) => a.bank.localeCompare(b.bank) || a.number.localeCompare(b.number),
    text: a => [BANKS[a.bank].name, a.number, a.name, a.department].join(" "),
    newable: true
  },
  schedules: {
    filters: {
      due: ["Billing periods due", x => periodsDue(x).length > 0],
      active: ["Active schedules", x => !!nextBilling(x)],
      all: ["All schedules", () => true]
    },
    cols: [["Number", x => refLink("schedules", x.id, x.number), "", "number"], ["Customer", x => esc(custName(x.customerId)), "", "customerId"], ["What is billed", x => esc(x.desc), "wrap", "desc"],
      ["Department", x => esc(x.department), "", "department"], ["Frequency", x => esc(freqLabel(x.frequency)), "", "frequency"], ["Amount", x => fmt(x.amount), "num", "amount"],
      ["Next billing", x => esc(nextBilling(x) || "Ended"), "", "=SCH.next_billing_date"], ["Due", x => { const n = periodsDue(x).length; return n ? `<span class="chip c-warn">${n} due</span>` : `<span class="chip c-ok">Up to date</span>`; }, "", "=SCH.periods_due"]],
    sort: (a, b) => String(nextBilling(a) || "9").localeCompare(String(nextBilling(b) || "9")),
    text: x => [x.number, custName(x.customerId), x.desc, x.department].join(" ")
  },
  contacts: {
    filters: { all: ["Billing contacts", () => true] },
    cols: [["Customer", c => esc(custName(c.customerId)), "", "customerId"], ["Department", c => esc(c.department), "", "department"], ["Bill-to person", c => refLink("contacts", c.id, c.name), "", "name"],
      ["Email", c => esc(c.email), "", "email"], ["Phone", c => esc(c.phone || "—"), "", "phone"]],
    sort: (a, b) => custName(a.customerId).localeCompare(custName(b.customerId)) || a.department.localeCompare(b.department),
    text: c => [custName(c.customerId), c.department, c.name, c.email].join(" "),
    newable: true
  },
  documents: {
    filters: { all: ["Customer documents", () => true] },
    cols: [["Number", d => refLink("documents", d.id, d.number), "", "number"], ["Customer", d => esc(custName(d.customerId)), "", "customerId"], ["Type", d => esc(DOC_LABEL[d.docType]), "", "docType"],
      ["File", d => `${icon("clip", 13)} ${esc(d.fileName)}`, "wrap", "fileName"], ["For", d => esc(d.contractId ? ctrNo(d.contractId) : d.department || "—"), "", null], ["Received", d => esc(d.received), "", "received"]],
    sort: (a, b) => custName(a.customerId).localeCompare(custName(b.customerId)) || a.docType.localeCompare(b.docType),
    text: d => [d.number, custName(d.customerId), DOC_LABEL[d.docType], d.fileName].join(" ")
  },
  customers: {
    filters: { all: ["Customers", () => true] },
    cols: [["Name", c => refLink("customers", c.id, c.name), "", "name"], ["Parent group", c => esc(c.parent || "—"), "", "parent"], ["Terms", c => `Net ${esc(c.terms)}`, "", "terms"],
      ["Open AR", c => fmt(rollup(issuedOf(c.id)).open), "num", "=CUS.open_ar"], ["Overdue", c => { const o = rollup(issuedOf(c.id)).overdue; return o ? `<span class="bad">${fmt(o)}</span>` : fmt(0); }, "num", "=CUS.overdue"]],
    sort: (a, b) => a.name.localeCompare(b.name),
    text: c => [c.name, c.parent, ...(c.aliases || [])].join(" "),
    newable: true
  },
  contracts: {
    filters: { all: ["Contracts", () => true], active: ["Active", k => !isShell(k) && ctrStatus(k)[0] === "Active"], shell: ["No-contract shells", k => isShell(k)], giro: ["Contracts with GIRO active", k => k.giroStatus === "active"] },
    cols: [["Number", k => refLink("contracts", k.id, k.number), "", "number"], ["Type", k => ctrTypeChip(k), "", "contractType"], ["Title", k => esc(k.title), "wrap", "title"], ["Customer", k => esc(custName(k.customerId)), "", "customerId"], ["Department", k => esc(k.department || "—"), "", "department"],
      ["Bill-to", k => esc(k.billToName || "—"), "", "billToName"], ["Value", k => isShell(k) ? "—" : fmt(k.value || 0), "num", "value"], ["Lines", k => String(S.lines.filter(l => l.contractId === k.id).length), "num", "=CON.line_count"], ["Status", k => ctrStatusChip(k), "", "=CON.status"]],
    sort: (a, b) => custName(a.customerId).localeCompare(custName(b.customerId)) || (isShell(a) - isShell(b)) || a.number.localeCompare(b.number),
    text: k => [k.number, k.title, custName(k.customerId), k.department, k.billToName, isShell(k) ? "no contract shell" : ""].join(" "),
    newable: true
  }
};
const giroChip = k => { const c = activeGiroCase(k); return c ? `<span class="chip c-ok">GIRO active</span> ${refLink("requests", c.id, c.number)}` : `<span class="chip c-neutral">Not active</span>`; };
const giroCaseChip = r => { const k = r.contractId ? ctrById(r.contractId) : null, cur = activeGiroCase(k);
  if (r.state === "rejected") return `<span class="chip c-bad">Rejected</span>`;
  if (r.state !== "completed") return r.contractId ? `<span class="chip c-neutral">Open</span>` : `<span class="chip c-warn">Contract to link</span>`;
  return r.giroType === "remove" ? `<span class="chip c-neutral">Removed GIRO</span>` : cur?.id === r.id ? `<span class="chip c-ok">Active</span>` : `<span class="chip c-neutral">Ended</span>`; };
const ctrTypeChip = k => isShell(k) ? `<span class="chip c-warn">No contract</span>` : `<span class="chip c-neutral">Contract</span>`;
const ctrStatusChip = k => { const s = isShell(k) ? ["Open", "c-ok"] : ctrStatus(k); return `<span class="chip ${s[1]}">${s[0]}</span>`; };
const issuedOf = custId => S.invoices.filter(i => i.customerId === custId && i.state === "issued");

const MENU = [
  ["AR requests", [["requests", "open"], ["requests", "new"], ["requests", "setup"], ["requests", "mine"], ["requests", "awaiting"], ["requests", "all"]]],
  ["Recurring billing", [["schedules", "due"], ["schedules", "active"], ["schedules", "all"]]],
  ["Invoices", [["invoices", "draft"], ["invoices", "open"], ["invoices", "overdue"], ["invoices", "all"]]],
  ["Bank statements", [["uploads", "all"], ["deposits", "unapplied"], ["deposits", "all"], ["bankAccounts", "all"]]],
  ["GIRO", [["requests", "giro"], ["requests", "giroall"], ["contracts", "giro"]]],
  ["Master data", [["customers", "all"], ["contracts", "all"], ["contracts", "shell"], ["contacts", "all"], ["documents", "all"]]]
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
  const railActive = k => w.active === "main" && (k === "list" ? m.kind === "list" : m.kind === k);
  const counts = { new: S.requests.filter(LISTS.requests.filters.new[1]).length };
  return `<div class="ws">
    <header class="ws-head"${sn("WS-01")}>
      <div class="ws-brand"><span class="ws-logo" aria-hidden="true">AR</span><span>Receivables Workspace</span></div>
      <form class="ws-search" role="search" id="wsSearch"${sn("WS-02")}>${icon("search", 16)}<input id="wsQ" type="search" placeholder="Search number or customer" aria-label="Search records" autocomplete="off"></form>
      <div class="ws-user"><span class="ws-bell" title="${counts.new} new AR requests">${icon("bell", 18)}${counts.new ? `<b>${counts.new}</b>` : ""}</span><span class="avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="ws-uname">${esc(u.name)}</span></div>
    </header>
    <div class="ws-body">
      <nav class="ws-rail" aria-label="Workspace navigation"${sn("WS-03")}>
        ${rail.map(([k, l, ic]) => `<button type="button" data-rail="${k}" title="${l}" aria-label="${l}" aria-current="${railActive(k)}">${icon(ic, 20)}</button>`).join("")}
      </nav>
      <main class="ws-main">
        <div class="ws-tabs" role="tablist" aria-label="Open tabs"${sn("WS-05")}>
          <button type="button" role="tab" class="ws-tab primary" data-tab="main" aria-selected="${w.active === "main"}">${esc(mainLabel())}</button>
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
  const unappliedPays = S.deposits.filter(p => depositMoney(p).unapplied > 0);
  const cards = [
    ["New AR requests", S.requests.filter(f.new[1]).length, "Unassigned cases from the portal", "list", "requests:new"],
    ["Assigned to me", S.requests.filter(f.mine[1]).length, "Open cases you own", "list", "requests:mine"],
    ["Awaiting info", S.requests.filter(f.awaiting[1]).length, "Waiting on the project team", "list", "requests:awaiting"],
    ["Customer setup pending", S.requests.filter(f.setup[1]).length, "AR-i to link to the customer master", "list", "requests:setup"],
    ["Billing periods due", S.schedules.reduce((n, x) => n + periodsDue(x).length, 0), "Recurring invoices to raise", "list", "schedules:due"],
    ["Draft invoices", S.invoices.filter(fi.draft[1]).length, "Created, not yet issued", "list", "invoices:draft"],
    ["Overdue", `SGD ${fmt(overdue.reduce((s, i) => s + invMoney(i).open, 0))}`, `${overdue.length} invoices past due`, "list", "invoices:overdue"],
    ["BSU deposits to match", `SGD ${fmt(unappliedPays.reduce((s, p) => s + depositMoney(p).unapplied, 0))}`, `${unappliedPays.length} deposits from bank statements`, "cash", ""],
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
    <section class="kpis"${sn("WS-06")}>
      ${cards.map(([k, v, n, kind, target]) => `<button type="button" class="kpi" ${kind === "list" ? `data-list="${target}"` : `data-rail="${kind}"`}><span class="k">${esc(k)}</span><span class="v">${esc(String(v))}</span><span class="n">${esc(n)}</span></button>`).join("")}
    </section>
    <div class="home-grid">
      <section class="card"${sn("WS-07")}>
        <header><h2>Receivables aging</h2><span class="muted small">Amount due, SGD</span></header>
        <div class="aging">${buckets.map(([l, v], ix) => `<div class="ag-row"><span class="ag-l">${l}</span><span class="ag-bar"><i style="width:${(v / max * 100).toFixed(1)}%;background:${ix === 0 ? "var(--accent)" : ix === 1 ? "var(--warn)" : "var(--bad)"}"></i></span><span class="ag-v num">${fmt(v)}</span></div>`).join("")}</div>
      </section>
      <section class="card"${sn("WS-08")}>
        <header><h2>New AR requests</h2><button type="button" class="linkish small" data-list="requests:new">View all</button></header>
        ${newReqs.length ? `<ul class="mini">${newReqs.map(r => `<li><button type="button" class="mini-row" data-open="requests:${r.id}"><span><b class="mono">${esc(r.number)}</b> ${esc(r.title)}<span class="desc">${esc(custName(r.customerId))} · from ${esc(userById(r.requestedBy)?.name || "")} · ${esc(r.opened)}</span></span><span class="num">${fmt(r.amount)}</span></button></li>`).join("")}</ul>` : `<p class="empty small">No new requests.</p>`}
      </section>
      <section class="card wide"${sn("WS-09")}>
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

function listMenu() {
  const m = W().main;
  return `<aside class="lp-menu" aria-label="Lists"${sn("WS-04")}>
    <div class="lm-head"><b>Lists</b><button type="button" class="iconbtn lm-close" data-lmtoggle aria-label="Hide lists">${icon("panel", 16)}</button></div>
    ${MENU.map(([g, items]) => `<div class="lm-group"><h3>${esc(g)}</h3>${items.map(([t, f]) => {
      const n = S[t].filter(LISTS[t].filters[f][1]).length, on = m.table === t && m.filter === f;
      return `<button type="button" class="lm-item" data-list="${t}:${f}" aria-current="${on}"><span>${esc(LISTS[t].filters[f][0])}</span><span class="count">${n}</span></button>`; }).join("")}</div>`).join("")}
  </aside>`;
}

function listPage(table, filter) {
  const open = W().lmOpen ?? (window.innerWidth >= 760);
  return `<div class="lp${open ? "" : " lm-closed"}"${sn("WS-16")}>${open ? listMenu() : ""}${listView(table, filter, open)}</div>`;
}

function listView(table, filter, menuOpen) {
  const def = LISTS[table], t = TABLES[table];
  const { rows, html } = listRows(table, filter);
  return `<div class="page">
    <div class="pagehead"><div class="ph-l">${menuOpen ? "" : `<button type="button" class="btn small" data-lmtoggle>${icon("list", 15)} Lists</button>`}<div><h1 class="pt">${esc(t.plural)}</h1><p class="psub">${esc(def.filters[filter][0])} · <span id="listCount">${rows.length}</span> record${rows.length === 1 ? "" : "s"}</p></div></div>
      ${def.newable ? `<button type="button" class="btn primary" data-new="${table}"${sn(`UA-${CODE[table]}-new`)}>New</button>` : ""}</div>
    <div class="listbar">
      <div class="seg" role="group" aria-label="Filter">${Object.entries(def.filters).map(([k, [l]]) => `<button type="button" data-list="${table}:${k}" aria-pressed="${k === filter}">${esc(l)}</button>`).join("")}</div>
      <label class="listq">${icon("search", 15)}<input type="search" id="listQ" value="${esc(W().q)}" placeholder="Search in list" aria-label="Search in list"></label>
    </div>
    <div class="panel"${sn(`LST-${CODE[table]}`)}><div class="tablewrap"><table class="list"><thead><tr>${def.cols.map(c => `<th class="${c[2]}"${c[3] ? sn(c[3].startsWith("=") ? c[3].slice(1) : `${CODE[table]}.${t.fields.find(f => f.key === c[3])?.name}`) : ""}>${esc(c[0])}</th>`).join("")}</tr></thead>
      <tbody id="listBody">${html}</tbody></table></div></div>
  </div>`;
}

// ---------- record pages ----------
const has = k => r => !!r[k], not = k => r => !r[k], isIx = r => r.form === "AR-ix";
const LAYOUT = {
  requests: [["AR form", ["form", "title", "amount"]],
    ["General information", ["requesterName", "requesterEmail", "department", "ccList"]],
    // AR-i
    ["Customer", ["customerId"], r => !isIx(r) && !r.newCustomer], ["New customer (to verify)", ["newCustName", "newCustUen", "newCustAddress"], r => !isIx(r) && r.newCustomer],
    ["Contract", ["contractOption", "contractId", "contractLocation", "contractLocationRef"], r => !isIx(r)],
    ["New contract (to create)", ["newCtrRef", "newCtrTitle", "newCtrStart", "newCtrEnd", "newCtrValue"], r => !isIx(r) && r.contractOption === "new"],
    ["Customer PO", ["poNumber"], r => !isIx(r)],
    ["Finance coding", ["costCenter", "accountCode", "billingTypeCode", "vag", "subBu", "typeOfBilling"], r => !isIx(r)],
    ["Bill-to for the contract (from the request)", ["billToName", "billToEmail", "billToPhone", "billToAddress"], r => !isIx(r) && r.billToName],
    ["Documents supplied", ["docContract", "docAcra", "docBillingForm"], r => !isIx(r) && (r.docContract || r.docAcra || r.docBillingForm)],
    // AR-ix (GIR module)
    ["Customer not at AR yet", ["newCustName"], r => isIx(r) && r.newCustomer],
    ["Contract and applicant", ["customerId", "contractId", "newCtrRef", "applicantName", "applicantEmail", "applicantMobile", "giroInvoiceRef"], isIx],
    ["GIRO details", ["giroPurpose", "giroPurposeOther", "giroType", "giroLocation", "giroStart", "giroEnd", "carplate", "parkStart", "parkEnd", "giroAmount"], isIx],
    ["Case", ["state", "requestedBy", "assignedTo", "opened", "details"]]],
  lines: [["Billing line", ["number", "requestId", "contractId", "lineType", "desc", "amount", "invoiceDate", "frequency", "startDate", "endDate", "invoiceId", "scheduleId"]]],
  invoices: [["Invoice", ["customerId", "contractId", "desc", "amount", "date", "due"]], ["Source", ["state", "requestId", "lineId", "scheduleId", "periodDate"]]],
  deposits: [["Deposit", ["number", "bankAccountId", "uploadId", "date", "amount", "bankRef", "payer", "reference"]]],
  uploads: [["Statement upload", ["number", "bankAccountId", "statementDate", "fileName", "uploadedBy", "uploadedAt", "depositCount", "depositTotal", "skippedCount"]]],
  bankAccounts: [["Bank account", ["bank", "number", "name", "department", "accountType", "currency"]]],
  customers: [["Customer", ["name", "uen", "parent", "address", "terms", "creditLimit", "aliases", "notes"]]],
  contracts: [["Contract", ["number", "contractType", "customerId", "department", "title", "billing", "value", "start", "end", "terms", "discPct", "discDays", "contractLocation", "contractLocationRef", "notes"]],
    ["Late payment interest (LPI)", ["lpiApplicable", "lpiMinRate", "lpiRate"]],
    ["GIRO", ["giroStatus", "giroCaseId"], k => !isShell(k)],
    ["Bill-to", ["billToName", "billToEmail", "billToPhone", "billToAddress"]]],
  contacts: [["Billing contact", ["customerId", "department", "name", "email", "phone", "address", "requestId"]]],
  documents: [["Customer document", ["number", "customerId", "docType", "fileName", "contractId", "department", "requestId", "received"]]],
  schedules: [["Billing schedule", ["number", "customerId", "contractId", "department", "desc", "frequency", "amount", "firstDate", "lastDate", "requestId"]]],
};
/** Fields AR can't edit on the workspace form (set by the portal or by UI actions). */
const RO = { requests: ["form", "newCustomer", "newCustName", "newCustUen", "newCustAddress", "billToName", "billToEmail", "billToPhone", "billToAddress", "contractOption", "newCtrRef", "newCtrTitle", "newCtrStart", "newCtrEnd", "newCtrValue", "giroType"], lines: ["lineType"] };

function editable(table, rec) {
  if (table === "requests") return REQ_OPEN.includes(rec.state);
  if (table === "invoices") return rec.state === "draft";
  if (table === "deposits" || table === "uploads" || table === "documents") return false;
  if (table === "lines") { const r = recById("requests", rec.requestId); return !!r && REQ_OPEN.includes(r.state) && lineStatus(rec) === "open"; }
  return true;
}

function action(table, label, act, opts = {}) {
  return { ovf: !!opts.ovf, html: `<button type="button" class="btn${opts.primary ? " primary" : ""}${opts.danger ? " bad" : ""}" data-ui="${act}"${sn(`UA-${CODE[table]}-${opts.id || act}`)}>${esc(label)}</button>` };
}
const btn = (html, ovf = false) => ({ html, ovf });

function headerFields(table, rec) {
  const hf = (k, v) => `<div class="hf"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  if (table === "requests") return [hf("State", reqChip(rec)), hf("Form", `${esc(rec.form || "AR-i")} · ${esc(linesLabel(rec))}`), hf("Customer", rec.customerId ? refLink("customers", rec.customerId) : `${esc(rec.newCustName || "—")} <span class="chip c-warn">New</span>`),
    hf("Contract", rec.contractId ? refLink("contracts", rec.contractId) : rec.contractOption === "new" ? `${esc(rec.newCtrRef || "—")} <span class="chip c-warn">${isIx(rec) ? "Not linked" : "New"}</span>` : rec.contractOption === "none" ? `<span class="chip c-warn">No contract</span>` : "—"), hf("Department", esc(rec.department || "—")),
    hf("Assigned to", esc(userById(rec.assignedTo)?.name || "Unassigned")), hf("Requested by", esc(userById(rec.requestedBy)?.name || "—")), hf("Opened", esc(rec.opened))];
  if (table === "invoices") return [hf("Status", invChip(rec)), hf("Customer", refLink("customers", rec.customerId)), hf("Contract", refLink("contracts", rec.contractId)), hf("AR request", refLink("requests", rec.requestId)), hf("Invoice date", esc(rec.date || "—"))];
  if (table === "deposits") { const a = acctById(rec.bankAccountId); return [hf("Match", depositChip(rec)), hf("Value date", esc(rec.date)), hf("Bank account", refLink("bankAccounts", rec.bankAccountId)), hf("Department", esc(a?.department || "—")), hf("Account type", esc(a ? acctType(a) : "—"))]; }
  if (table === "uploads") return [hf("Bank account", refLink("bankAccounts", rec.bankAccountId)), hf("Statement date", esc(rec.statementDate)), hf("Deposits", String(rec.depositCount)), hf("Total", `<span class="mono">SGD ${fmt(rec.depositTotal)}</span>`), hf("Uploaded by", esc(userById(rec.uploadedBy)?.name || "—"))];
  if (table === "bankAccounts") { const ups = S.uploads.filter(u => u.bankAccountId === rec.id); return [hf("Bank", esc(BANKS[rec.bank]?.name || "—")), hf("Department", esc(rec.department || "—")), hf("Type", esc(acctType(rec))), hf("Uploads", String(ups.length)), hf("Last statement", esc(ups.map(u => u.statementDate).sort().pop() || "—"))]; }
  if (table === "customers") return [hf("UEN", esc(rec.uen || "—")), hf("Parent group", esc(rec.parent || "—")), hf("Payment terms", `Net ${esc(rec.terms)}`), hf("Credit limit", rec.creditLimit ? `<span class="mono">${fmt(rec.creditLimit)}</span>` : "Not set")];
  if (table === "contracts") { const r = rollup(S.invoices.filter(i => i.contractId === rec.id && i.state === "issued"));
    return [hf("Type", ctrTypeChip(rec)), hf("Status", ctrStatusChip(rec)), hf("Customer", refLink("customers", rec.customerId)), hf("Department", esc(rec.department || "—")), hf("Bill-to", esc(rec.billToName || "Not set")), ...(isShell(rec) ? [] : [hf("GIRO", giroChip(rec))])]; }
  if (table === "schedules") return [hf("Customer", refLink("customers", rec.customerId)), hf("Contract", refLink("contracts", rec.contractId)), hf("Frequency", esc(freqLabel(rec.frequency))), hf("Department", esc(rec.department))];
  if (table === "lines") return [hf("Type", esc(LINE_TYPE[rec.lineType])), hf("Status", lineChip(rec)), hf("AR request", refLink("requests", rec.requestId)), hf("Contract", rec.contractId ? refLink("contracts", rec.contractId) : "Set by Link to customer")];
  if (table === "contacts") return [hf("Customer", refLink("customers", rec.customerId)), hf("Department", esc(rec.department)), hf("Email", esc(rec.email || "—"))];
  if (table === "documents") return [hf("Customer", refLink("customers", rec.customerId)), hf("Type", esc(DOC_LABEL[rec.docType])), hf("Received", esc(rec.received)), hf("From request", refLink("requests", rec.requestId))];
  return [];
}

/** Horizon record ribbon: collapsible row of widgets (metrics) under the header. */
function ribbon(table, rec, tab) {
  const w = (k, v, n, extra = "") => `<div class="rw"><span class="rw-k">${esc(k)}</span><span class="rw-v">${v}</span>${n ? `<span class="rw-n">${n}</span>` : ""}${extra}</div>`;
  const bar = (a, b, color = "var(--accent)") => { const p = b > 0 ? Math.max(0, Math.min(100, a / b * 100)) : 0; return `<div class="meter"><i style="width:${p}%;background:${color}"></i></div>`; };
  let ws = [];
  if (table === "requests" && isIx(rec)) {
    const k = rec.contractId ? ctrById(rec.contractId) : null, cur = activeGiroCase(k);
    ws = [w("GIRO", esc(giroLabel(rec)), esc(rec.carplate || rec.giroLocation || rec.giroPurposeOther || "")), w("Amount", rec.giroAmount ? `SGD ${fmt(rec.giroAmount)}` : "—"),
      w("Contract", k ? esc(k.number) : `<span class="bad">Not linked</span>`, k ? (cur ? `GIRO active from ${esc(cur.number)}${cur.id === rec.id ? " (this case)" : ""}` : "GIRO not active") : `Reference given: ${esc(rec.newCtrRef || "—")}`)];
  } else if (table === "requests") {
    const ls = reqLines(rec), done = ls.filter(l => ["invoiced", "scheduled"].includes(lineStatus(l))).length;
    const st = setupStatus(rec), checks = [st.linked, st.contractDone, st.billToOk, st.docsDone], ok = checks.filter(Boolean).length;
    ws = [w("Request value", `SGD ${fmt(rec.amount)}`, esc(linesLabel(rec))), w("Billing lines done", `${done} of ${ls.length}`, done === ls.length && ls.length ? "Every line invoiced or scheduled" : "Invoice or schedule each line", bar(done, ls.length, "var(--ok)")),
      w("Customer setup", `${ok} of ${checks.length}`, ok === checks.length ? "Customer, contract, bill-to, documents" : "See Customer setup in the side panel", bar(ok, checks.length))];
  } else if (table === "invoices") { const m = invMoney(rec);
    ws = [w("Amount", `SGD ${fmt(rec.amount)}`), w("Amount due", `SGD ${fmt(m.open)}`, m.applied ? `SGD ${fmt(m.applied)} matched from BSU deposits` : "", bar(m.applied, rec.amount, "var(--ok)")),
      w("Due", esc(rec.due || "—"), rec.state === "issued" && m.open > 0 ? `<span class="${m.late ? "bad" : ""}">${esc(daysLabel(rec.due))}</span>` : "")];
  } else if (table === "deposits") { const m = depositMoney(rec);
    ws = [w("Amount", `SGD ${fmt(rec.amount)}`), w("Matched", `SGD ${fmt(m.applied)}`, "", bar(m.applied, rec.amount, "var(--ok)")), w("Unmatched", `<span class="${m.unapplied ? "bad" : ""}">SGD ${fmt(m.unapplied)}</span>`)];
  } else if (table === "customers") { const r = rollup(issuedOf(rec.id));
    ws = [w("Open AR", `SGD ${fmt(r.open)}`), w("Overdue", `<span class="${r.overdue ? "bad" : ""}">SGD ${fmt(r.overdue)}</span>`), w("Contracts", String(S.contracts.filter(k => k.customerId === rec.id && !isShell(k)).length), `${S.contracts.filter(k => k.customerId === rec.id && isShell(k)).length} no-contract shell(s)`),
      w("Open AR requests", String(S.requests.filter(r => r.customerId === rec.id && REQ_OPEN.includes(r.state)).length))];
  } else if (table === "contracts") { const r = rollup(S.invoices.filter(i => i.contractId === rec.id && i.state === "issued"));
    ws = [...(isShell(rec) ? [] : [w("Billed of contract value", `SGD ${fmt(r.billed)}`, `of SGD ${fmt(rec.value || 0)}`, bar(r.billed, rec.value || 0))]), w("Collected of billed", `SGD ${fmt(r.collected)}`, "", bar(r.collected, r.billed, "var(--ok)")),
      w("Billing lines", String(S.lines.filter(l => l.contractId === rec.id).length)), ...(isShell(rec) ? [] : (() => { const c = activeGiroCase(rec); return [w("GIRO", c ? `<span class="ok-t">Active</span>` : "Not active", c ? `${esc(c.number)} · ${esc(giroLabel(c))}${c.giroAmount ? ` · SGD ${fmt(c.giroAmount)}` : ""}` : "No approved AR-ix case active")]; })())];
  } else if (table === "schedules") { const per = periodDates(rec.frequency, rec.firstDate, rec.lastDate), inv = S.invoices.filter(i => i.scheduleId === rec.id && i.state !== "cancelled").length, due = periodsDue(rec).length;
    ws = [w("Amount per period", `SGD ${fmt(rec.amount)}`), w("Next billing", esc(nextBilling(rec) || "Ended")), w("Periods due", due ? `<span class="chip c-warn">${due} due</span>` : `<span class="chip c-ok">Up to date</span>`),
      w("Invoiced", `${inv} of ${per.length}`, "", bar(inv, per.length, "var(--ok)"))];
  } else if (table === "lines") ws = [w("Line value", `SGD ${fmt(lineValue(rec))}`, rec.lineType === "recurring" ? `${periodDates(rec.frequency, rec.startDate, rec.endDate).length} × SGD ${fmt(rec.amount)}` : "")];
  if (!ws.length) return "";
  const open = !tab.ribbonClosed;
  return `<section class="ribbon${open ? "" : " closed"}"${sn("WS-12")}>
    <button type="button" class="iconbtn rb-tog" data-ribbon aria-expanded="${open}" aria-label="${open ? "Collapse" : "Expand"} ribbon">${icon("chev", 16)}</button>
    ${open ? `<div class="rb-row">${ws.join("")}</div>` : `<span class="muted small">Ribbon: ${ws.length} widgets</span>`}
  </section>`;
}

function actionsFor(table, rec, isNew, canEdit) {
  const a = [];
  if (isNew) return [action(table, "Save", "save", { primary: true, id: "insert" })];
  if (table === "requests") {
    if (REQ_OPEN.includes(rec.state)) {
      const st = setupStatus(rec);
      if (!mine(rec)) a.push(action(table, "Assign to me", "assign"));
      if (isIx(rec)) {
        if (!rec.contractId) a.push(action(table, "Link contract", "linkctr", { primary: true }));
        else a.push(rec.giroType === "remove" ? action(table, "Remove GIRO", "giroremove", { primary: true }) : action(table, "Activate GIRO", "giroadd", { primary: true }));
      } else if (setupPending(rec, st)) a.push(action(table, rec.newCustomer ? "Create customer & link" : "Link to customer", "link", { primary: true }));
      /* billing is done per line in the Billing lines list once the request is linked to a customer */
      a.push(action(table, "Request info", "info", { ovf: true }));
      a.push(action(table, "Reject", "reject", { danger: true, ovf: true }));
    }

  }
  if (table === "invoices") {
    if (rec.state === "draft") a.push(action(table, "Issue invoice", "issue", { primary: true }));
    if (rec.state !== "cancelled") a.push(action(table, "Cancel invoice", "cancel", { danger: true, ovf: true }));
  }
  if (table === "deposits" && depositMoney(rec).unapplied > 0) a.push(btn(`<button type="button" class="btn primary" data-matchdep="${rec.id}"${sn("UA-DEP-match")}>Match to invoice</button>`));
  if (table === "uploads") a.push(btn(`<button type="button" class="btn" data-rail="bsu">Upload another</button>`));
  if (table === "bankAccounts") a.push(btn(`<button type="button" class="btn" data-bsu-acct="${rec.id}"${sn("UA-BNK-upload")}>Upload statement</button>`));
  if (table === "lines") { const r = recById("requests", rec.requestId), ok = r && REQ_OPEN.includes(r.state) && r.customerId && !r.newCustomer && rec.contractId;
    if (ok && lineStatus(rec) === "open") a.push(btn(rec.lineType === "recurring" ? `<button type="button" class="btn primary" data-lineact="schedule:${rec.id}"${sn("UA-RQL-schedule")}>Set up billing schedule</button>` : `<button type="button" class="btn primary" data-lineact="invoice:${rec.id}"${sn("UA-RQL-invoice")}>Create invoice</button>`)); }
  if (table === "customers") { a.push(btn(`<button type="button" class="btn" data-new="contracts" data-prefill-customer="${rec.id}"${sn("UA-CUS-newcontract")}>New contract</button>`));
    a.push(btn(`<button type="button" class="btn" data-new="contacts" data-prefill-customer="${rec.id}"${sn("UA-CUS-newcontact")}>Add billing contact</button>`, true)); }
  if (canEdit) a.splice(Math.min(a.filter(x => !x.ovf).length, a.length), 0, action(table, "Save", "save"));
  return a;
}

/** Horizon record header UI action bar: visible buttons, the rest in an overflow menu. */
function actionBar(items) {
  const vis = items.filter(x => !x.ovf), more = items.filter(x => x.ovf);
  return `<div class="rh-actions"${sn("WS-11")}>${vis.map(x => x.html).join("")}
    ${more.length ? `<details class="ovf"><summary class="btn" aria-label="More actions">${icon("dots", 16)}<span class="sr">More actions</span></summary><div class="ovf-menu" role="menu">${more.map(x => x.html).join("")}</div></details>` : ""}</div>`;
}

const LINE_CHIP = { open: ["Open", "c-neutral"], draft: ["Invoice draft", "c-accent"], invoiced: ["Invoiced", "c-ok"], scheduled: ["Scheduled", "c-ok"] };
const lineChip = l => { const [lab, c] = LINE_CHIP[lineStatus(l)]; return `<span class="chip ${c}">${lab}</span>`; };

/** Link to customer is needed while the customer, bill-to, documents or contract location aren't on the customer master yet. */
function setupPending(r, st = setupStatus(r)) {
  if (r.form === "AR-ix") return !r.contractId;
  if (!st.linked || !st.contractDone) return true;
  if (r.billToName && !st.billToOk) return true;
  if (!st.docsDone) return true;
  return st.location === false;
}

function setupPanel(r, tab) {
  if (!r.form) return "";
  const st = setupStatus(r), lines = reqLines(r), doneLines = lines.filter(l => ["invoiced", "scheduled"].includes(lineStatus(l))).length;
  const item = (ok, label, detail) => `<li class="${ok === true ? "ok" : ok === false ? "todo" : "na"}"><span class="tick" aria-hidden="true">${ok === true ? "✓" : ok === false ? "!" : "–"}</span><div><b>${label}</b>${detail ? `<span class="desc">${detail}</span>` : ""}</div></li>`;
  const similar = r.newCustomer ? S.customers.filter(c => nameSim(r.newCustName || "", c.name) >= .5) : [];
  const ctr = st.ctr;
  const ctrText = r.contractOption === "new" ? `new contract ${esc(r.newCtrRef || "")}` : r.contractOption === "none" ? `the ${esc(r.department)} no-contract shell` : "the contract";
  return `<section class="setup"${sn("REQ-SETUP")}>
    <header><h2>Customer setup</h2><span class="muted small">${esc(r.form || "AR-i")}${r.newCustomer ? " · new customer (first request)" : ""}</span></header>
    <ul class="checklist">
      ${item(st.linked, st.linked ? `Customer: ${esc(custName(r.customerId))}` : `New customer to verify: ${esc(r.newCustName)}`, st.linked ? "" : `UEN ${esc(r.newCustUen || "not given")}. Link to customer creates it, or pick an existing customer below.`)}
      ${item(st.contractDone, st.contractDone ? `${isShell(ctr) ? "No-contract shell" : "Contract"}: ${esc(ctr.number)}` : `Contract: ${ctrText}`, st.contractDone ? `${isShell(ctr) ? "No contract required; " : ""}all billing lines are filed under it` : r.contractOption === "new" ? `Link to customer creates ${esc(r.newCtrRef)} · ${esc(r.newCtrTitle || "")} and files the billing lines under it` : r.contractOption === "none" ? "Link to customer files the billing lines under the customer's no-contract shell for the department (created if needed)" : "Link to customer files the billing lines under the contract")}
      ${item(st.billToOk ? true : false, `Bill-to on ${ctr ? esc(ctr.number) : "the contract"}`, st.billToOk ? `${esc(ctr.billToName)} · ${esc(ctr.billToEmail)}` : r.billToName ? `Will be ${ctr?.billToName ? "updated" : "set"} from this request: ${esc(r.billToName)} · ${esc(r.billToEmail)}` : "No bill-to on the contract and none on the request. Ask the requester.")}
      ${st.docsGiven.length ? item(st.docsDone, "Documents filed on the customer", st.docsGiven.map(t => `${esc(DOC_LABEL[t])}${st.filed.includes(t) ? " ✓" : ""}`).join(" · ")) : item(null, "Documents", "All already on file; nothing new supplied")}
      ${ctr && !isShell(ctr) ? item(st.location !== false, `Contract location on ${esc(ctr.number)}`, ctr.contractLocation ? esc(ctr.contractLocationRef || ctr.contractLocation) : "Will be recorded from this request") : ""}
      ${item(lines.length && doneLines === lines.length, `Billing lines ${doneLines} of ${lines.length} done`, `${lines.length && doneLines === lines.length ? "Every line is invoiced or scheduled" : st.contractDone ? "Create the invoice or billing schedule for each line" : "Available once the request is linked"} · <button type="button" class="linkish" data-rtab="RL-REQ-RQL">Open billing lines</button>`)}
    </ul>
    ${r.newCustomer && REQ_OPEN.includes(r.state) ? `<label class="ffield linkto"${sn("REQ-LINKTO")}><span class="flabel">Link to an existing customer instead (optional)</span>
      <select id="linkTo-${r.id}" data-linkto="${esc(tab.key)}"><option value="">Create new customer "${esc(r.newCustName)}"</option>${S.customers.slice().sort((a, b) => nameSim(r.newCustName, b.name) - nameSim(r.newCustName, a.name)).map(c => `<option value="${c.id}"${tab.linkTo === c.id ? " selected" : ""}>${esc(c.name)}${similar.includes(c) ? " (similar)" : ""}</option>`).join("")}</select></label>` : ""}
  </section>`;
}

function attachments(rec) {
  const docs = [["docContract", "Signed contract / PO"], ["docAcra", "ACRA"], ["docBillingForm", "Billing form"]].filter(([k]) => rec[k]).map(([k, l]) => `${rec[k]} (${l})`).concat(rec.attachments || []);
  return `<section class="att"${sn("REQ-ATT")}><header><h2>Attachments</h2></header>${docs.length ? `<ul>${docs.map(a => `<li>${icon("clip", 15)} ${esc(a)}</li>`).join("")}</ul>` : `<p class="empty small">No attachments.</p>`}</section>`;
}

function activity(rec) {
  const c = W().composer[rec.id] || { kind: "work_note", text: "" };
  const open = REQ_OPEN.includes(rec.state);
  const items = rec.activity.slice().reverse();
  const kindLabel = { comment: "Additional comment · visible to requester", work_note: "Work note · AR team only", system: "System" };
  return `<section class="stream"${sn("REQ-ACT")}>
      <header><h2>Activity</h2></header>
      ${open ? `<div class="composer">
        <div class="seg" role="group" aria-label="Entry type"><button type="button" data-ckind="work_note" aria-pressed="${c.kind === "work_note"}">Work note</button><button type="button" data-ckind="comment" aria-pressed="${c.kind === "comment"}">Additional comment</button></div>
        <textarea id="composer-${rec.id}" data-composer="${rec.id}" rows="3" placeholder="${c.kind === "comment" ? "Visible to the requester on the portal" : "Internal note for the AR team"}">${esc(c.text)}</textarea>
        <div class="row"><span class="hint">${c.kind === "comment" ? "The requester sees this on the portal." : "Only the AR team sees work notes."}</span><button type="button" class="btn small primary" data-ui="post"${sn("UA-REQ-post")}>Post</button></div>
      </div>` : ""}
      <ol class="feed">${items.map(e => { const u = userById(e.by);
        return `<li class="fe k-${e.kind}"><span class="avatar sm" aria-hidden="true">${esc(initials(u?.name))}</span><div><div class="fe-h"><b>${esc(u?.name || "System")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><div class="fe-k">${kindLabel[e.kind]}</div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
    </section>`;
}

/** GIRO history: the AR-ix cases filed on a contract (D21). */
const giroHistory = (k, id) => sec(id, "GIRO history", giroCases(k).length, `<section class="rel"${sn(id)}><header><h3>GIRO history <span class="count">${giroCases(k).length}</span></h3><span class="muted small">AR-ix cases on ${esc(k.number)}; at most one GIRO active at a time</span></header>
  ${giroCases(k).length ? `<div class="tablewrap"><table><thead><tr><th>AR-ix case</th><th>Type</th><th>Purpose</th><th class="num">Amount</th><th>Requested by</th><th>Updated</th><th>GIRO</th></tr></thead><tbody>
  ${giroCases(k).map(r => `<tr><td>${refLink("requests", r.id, r.number)}</td><td>${esc(r.giroType === "remove" ? "Remove" : "Add")}</td><td>${esc(GIRO_PURPOSE[r.giroPurpose] || "")}<span class="desc">${esc(r.carplate || r.giroLocation || r.giroPurposeOther || "")}</span></td><td class="num">${r.giroAmount ? fmt(r.giroAmount) : "—"}</td><td>${esc(userById(r.requestedBy)?.name || "")}</td><td>${esc(r.updated || r.opened)}</td><td>${giroCaseChip(r)}</td></tr>`).join("")}
  </tbody></table></div>` : `<p class="empty small">No AR-ix cases on this contract yet.</p>`}</section>`);
const rt = (title, table, rows, cols, opts) => ({ key: opts.id, label: title, n: rows.length, html: relatedTable(title, table, rows, cols, opts) });
const sec = (key, label, n, html) => ({ key, label, n, html });

/** Record tabs after Details: related items and one tab per related list (Horizon record page). */
function related(table, rec) {
  if (table === "requests" && isIx(rec)) {
    return rec.contractId ? [giroHistory(ctrById(rec.contractId), "REQ-GIROHIST")] : [];
  }
  if (table === "requests") {
    const r = rec, ok = REQ_OPEN.includes(r.state) && r.customerId && !r.newCustomer && !!r.contractId;
    return [rt("Billing lines", "lines", reqLines(r), [
      ["Line", l => refLink("lines", l.id, l.number)], ["Type", l => esc(LINE_TYPE[l.lineType])], ["Description", l => esc(l.desc), "wrap"],
      ["Billing", l => l.lineType === "recurring" ? `${esc(freqLabel(l.frequency))} · ${esc(l.startDate)} to ${esc(l.endDate)}<span class="desc">${periodDates(l.frequency, l.startDate, l.endDate).length} invoices</span>` : esc(l.invoiceDate ? `around ${l.invoiceDate}` : "As soon as possible")],
      ["Amount", l => `${fmt(l.amount)}${l.lineType === "recurring" ? `<span class="desc">per period</span>` : ""}`, "num"], ["Value", l => fmt(lineValue(l)), "num"],
      ["Status", l => { const inv = l.invoiceId && S.invoices.find(i => i.id === l.invoiceId), sch = l.scheduleId && S.schedules.find(x => x.id === l.scheduleId);
        return `${lineChip(l)}${inv ? ` ${refLink("invoices", inv.id, inv.number)}` : ""}${sch ? ` ${refLink("schedules", sch.id, sch.number)}` : ""}`; }],
      ["", l => !ok || lineStatus(l) !== "open" ? "" : l.lineType === "recurring" ? `<button type="button" class="btn small primary" data-lineact="schedule:${l.id}"${sn("UA-RQL-schedule")}>Set up billing schedule</button>` : `<button type="button" class="btn small primary" data-lineact="invoice:${l.id}"${sn("UA-RQL-invoice")}>Create invoice</button>`]
    ], { id: "RL-REQ-RQL", actions: ok ? "" : `<span class="muted small">${REQ_OPEN.includes(r.state) ? "Link to customer files the lines under the contract; then bill each line" : ""}</span>` })];
  }
  if (table === "schedules") {
    const per = schedulePeriods(rec);
    return [sec("SCH-PER", "Billing periods", per.filter(p => !p.more).length, `<section class="rel"${sn("SCH-PER")}><header><h3>Billing periods <span class="count">${per.filter(p => !p.more).length}</span></h3><span class="muted small">Raise each invoice when its period is due (no automatic invoicing)</span></header>
      <div class="tablewrap"><table><thead><tr><th>Period</th><th>Status</th><th>Invoice</th><th class="num">Amount</th><th></th></tr></thead><tbody>
      ${per.map(p => p.more ? `<tr><td colspan="5" class="muted small">${p.remaining} more ${esc(freqLabel(rec.frequency).toLowerCase())} period${p.remaining === 1 ? "" : "s"} until ${esc(rec.lastDate)}.</td></tr>`
        : `<tr><td>${esc(p.date)}</td><td><span class="chip ${p.status === "Invoiced" ? "c-ok" : p.status === "Due" ? "c-warn" : "c-neutral"}">${p.status}</span></td><td>${p.inv ? `${refLink("invoices", p.inv.id, p.inv.number)} ${invChip(p.inv)}` : "—"}</td><td class="num">${fmt(rec.amount)}</td>
          <td>${p.inv ? "" : `<button type="button" class="btn small${p.status === "Due" ? " primary" : ""}" data-raise="${rec.id}|${p.date}"${sn("UA-SCH-raise")}>Raise invoice</button>`}</td></tr>`).join("")}
      </tbody></table></div></section>`),
      rt("Invoices", "invoices", S.invoices.filter(i => i.scheduleId === rec.id).sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Status", i => invChip(i)]], { id: "RL-SCH-INV" })];
  }
  if (table === "customers") {
    const ks = S.contracts.filter(k => k.customerId === rec.id), is = S.invoices.filter(i => i.customerId === rec.id), rs = S.requests.filter(r => r.customerId === rec.id);
    const extra = [rt("Billing contacts", "contacts", S.contacts.filter(c => c.customerId === rec.id).sort(LISTS.contacts.sort), [["Department", c => esc(c.department)], ["Bill-to person", c => refLink("contacts", c.id, c.name)], ["Email", c => esc(c.email)], ["Billing address", c => esc(c.address || "—"), "wrap"]], { id: "RL-CUS-BCT" }),
      rt("Customer documents", "documents", S.documents.filter(d => d.customerId === rec.id).sort(LISTS.documents.sort), [["Type", d => esc(DOC_LABEL[d.docType])], ["File", d => refLink("documents", d.id, d.fileName), "wrap"], ["For", d => esc(d.contractId ? ctrNo(d.contractId) : d.department || "—")], ["Received", d => esc(d.received)]], { id: "RL-CUS-DOC" }),
      rt("Billing schedules", "schedules", S.schedules.filter(x => x.customerId === rec.id), [["Number", x => refLink("schedules", x.id, x.number)], ["What is billed", x => esc(x.desc), "wrap"], ["Frequency", x => esc(freqLabel(x.frequency))], ["Next billing", x => esc(nextBilling(x) || "Ended")]], { id: "RL-CUS-SCH" })];
    return [sec("CUS-TREE", "Billing hierarchy", ks.length, hierarchy(rec)),
      rt("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Contract", r => r.contractId ? refLink("contracts", r.contractId) : r.contractOption === "new" ? `${esc(r.newCtrRef || "")} <span class="chip c-warn">New</span>` : "—"], ["Value", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { id: "RL-CUS-REQ" }),
      rt("Contracts", "contracts", ks.sort(LISTS.contracts.sort), [["Number", k => refLink("contracts", k.id, k.number)], ["Type", k => ctrTypeChip(k)], ["Title", k => esc(k.title), "wrap"], ["Bill-to", k => esc(k.billToName || "—")], ["Lines", k => String(S.lines.filter(l => l.contractId === k.id).length), "num"], ["Billed", k => fmt(rollup(S.invoices.filter(i => i.contractId === k.id && i.state === "issued")).billed), "num"]], { id: "RL-CUS-CON" }),
      rt("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Contract", i => esc(ctrNo(i.contractId))], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { id: "RL-CUS-INV" }), ...extra];
  }
  if (table === "contracts") {
    const is = S.invoices.filter(i => i.contractId === rec.id), rs = S.requests.filter(r => r.contractId === rec.id);
    const r = rollup(is.filter(i => i.state === "issued"));
    return [rt("Billing lines", "lines", S.lines.filter(l => l.contractId === rec.id), [["Line", l => refLink("lines", l.id, l.number)], ["AR request", l => refLink("requests", l.requestId)], ["Type", l => esc(LINE_TYPE[l.lineType])], ["Description", l => esc(l.desc), "wrap"], ["Value", l => fmt(lineValue(l)), "num"],
        ["Billed as", l => { const inv = l.invoiceId && S.invoices.find(i => i.id === l.invoiceId), sch = l.scheduleId && S.schedules.find(x => x.id === l.scheduleId); return `${lineChip(l)}${inv ? ` ${refLink("invoices", inv.id, inv.number)}` : ""}${sch ? ` ${refLink("schedules", sch.id, sch.number)}` : ""}`; }]], { id: "RL-CON-RQL" }),
      ...(isShell(rec) ? [] : [giroHistory(rec, "CON-GIRO")]),
      rt("Billing schedules", "schedules", S.schedules.filter(x => x.contractId === rec.id), [["Number", x => refLink("schedules", x.id, x.number)], ["What is billed", x => esc(x.desc), "wrap"], ["Frequency", x => esc(freqLabel(x.frequency))], ["Next billing", x => esc(nextBilling(x) || "Ended")]], { id: "RL-CON-SCH" }),
      rt("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { id: "RL-CON-INV" }),
      rt("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Amount", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { id: "RL-CON-REQ" })];
  }
  if (table === "uploads" || table === "bankAccounts") {
    const deps = S.deposits.filter(p => table === "uploads" ? p.uploadId === rec.id : p.bankAccountId === rec.id).sort(LISTS.deposits.sort);
    const ups = table === "bankAccounts" ? [rt("Statement uploads", "uploads", S.uploads.filter(u => u.bankAccountId === rec.id).sort(LISTS.uploads.sort),
      [["Upload", u => refLink("uploads", u.id, u.number)], ["Statement date", u => esc(u.statementDate)], ["Deposits", u => String(u.depositCount), "num"], ["Total", u => fmt(u.depositTotal), "num"]], { id: "RL-BNK-BSU" })] : [];
    return [...ups, rt("BSU deposits", "deposits", deps, [["Deposit ID", p => refLink("deposits", p.id, p.number)], ["Payer", p => esc(p.payer)], ["Reference", p => `<span class="mono small">${esc(p.reference || "—")}</span>`, "wrap"], ["Amount", p => fmt(p.amount), "num"], ["Match", p => depositChip(p)]], { id: table === "uploads" ? "RL-BSU-DEP" : "RL-BNK-DEP" })];
  }
  if (table === "invoices" || table === "deposits") {
    const rows = [];
    for (const [pid, m] of Object.entries(S.matches)) { if (!m || m.status === "rejected") continue;
      for (const a of m.allocations) if ((table === "invoices" && a.invoiceId === rec.id) || (table === "deposits" && pid === rec.id)) rows.push({ pid, a, m }); }
    const cols = table === "invoices"
      ? [["BSU deposit", x => refLink("deposits", x.pid, recById("deposits", x.pid)?.number)], ["Payer", x => esc(recById("deposits", x.pid)?.payer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]]
      : [["Invoice", x => refLink("invoices", x.a.invoiceId)], ["Customer", x => esc(recById("invoices", x.a.invoiceId)?.customer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]];
    return [rt("Allocations", "allocations", rows, cols, { id: table === "invoices" ? "RL-INV-ALC" : "RL-DEP-ALC" })];
  }
  return [];
}

/** Billing hierarchy on the customer (D15): customer › contract / shell › billing lines › invoices or schedule. Invoices not raised from a line are listed under their contract. */
function hierarchy(c) {
  const ks = S.contracts.filter(k => k.customerId === c.id).sort(LISTS.contracts.sort);
  const invLink = i => `${refLink("invoices", i.id, i.number)} ${invChip(i)}`;
  const node = k => {
    const ls = S.lines.filter(l => l.contractId === k.id), lineInv = new Set(ls.map(l => l.invoiceId).filter(Boolean)), schIds = new Set(ls.map(l => l.scheduleId).filter(Boolean));
    const loose = S.invoices.filter(i => i.contractId === k.id && !lineInv.has(i.id) && !(i.scheduleId && schIds.has(i.scheduleId)) && i.state !== "cancelled");
    const schOnly = S.schedules.filter(x => x.contractId === k.id && !schIds.has(x.id));
    const lineRow = l => { const inv = l.invoiceId && S.invoices.find(i => i.id === l.invoiceId), sch = l.scheduleId && S.schedules.find(x => x.id === l.scheduleId), sInv = sch ? S.invoices.filter(i => i.scheduleId === sch.id && i.state !== "cancelled") : [];
      return `<li><span class="hl">${refLink("lines", l.id, l.number)} ${esc(l.desc)} <span class="desc">${esc(LINE_TYPE[l.lineType])} · SGD ${fmt(lineValue(l))} · ${refLink("requests", l.requestId)}</span></span>
        ${inv || sch ? `<ul>${inv ? `<li>${invLink(inv)}</li>` : ""}${sch ? `<li>${refLink("schedules", sch.id, sch.number)} <span class="desc">${sInv.length} invoice${sInv.length === 1 ? "" : "s"} raised</span>${sInv.length ? `<ul>${sInv.map(i => `<li>${invLink(i)}</li>`).join("")}</ul>` : ""}</li>` : ""}</ul>` : ""}</li>`; };
    const other = [...schOnly.map(x => `<li>${refLink("schedules", x.id, x.number)} <span class="desc">${esc(x.desc)} (not from a billing line)</span></li>`), ...loose.map(i => `<li>${invLink(i)} <span class="desc">${esc(i.desc)} (not from a billing line)</span></li>`)];
    return `<li><span class="hl">${ctrTypeChip(k)} ${refLink("contracts", k.id, k.number)} ${esc(isShell(k) ? "" : k.title)}${k.department ? ` <span class="desc">${esc(k.department)}${k.billToName ? ` · bill to ${esc(k.billToName)}` : ""}</span>` : ""}</span>
      ${ls.length || other.length ? `<ul>${ls.map(lineRow).join("")}${other.join("")}</ul>` : `<ul><li class="muted small">Nothing billed yet</li></ul>`}</li>`;
  };
  const pending = S.requests.filter(r => r.customerId === c.id && !r.contractId && REQ_OPEN.includes(r.state));
  return `<section class="rel"${sn("CUS-TREE")}><header><h3>Billing hierarchy</h3><span class="muted small">Customer › contract or no-contract shell › billing lines › invoices</span></header>
    <ul class="htree"><li><span class="hl"><b>${esc(c.name)}</b></span><ul>${ks.map(node).join("")}${pending.map(r => `<li><span class="hl"><span class="chip c-warn">Not filed</span> ${refLink("requests", r.id)} <span class="desc">waiting for Link to customer</span></span></li>`).join("")}</ul></li></ul></section>`;
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
  const ro = RO[table] || [];
  const sections = LAYOUT[table].filter(([, , when]) => !when || isNew || when(shown)).map(([title, keys]) => `<fieldset class="fsec"><legend>${esc(title)}</legend><div class="fgrid">${keys.map(k => def.fields.find(f => f.key === k)).filter(Boolean).filter(f => !(isNew && f.readonly)).filter(f => fieldVisible(table, f, shown)).map(f => fieldHtml(table, f, shown, { prefix: `f-${tab.key}`, readonly: !canEdit || ro.includes(f.key), errors: tab.errors, vals: shown })).join("")}</div></fieldset>`).join("");
  const title = isNew ? `New ${def.label.toLowerCase()}` : displayOf(table, rec);
  const sub = table === "requests" ? rec.title : table === "invoices" ? rec.desc : table === "contracts" ? rec.title : table === "deposits" ? `${rec.payer} · ${acctLabel(acctById(rec.bankAccountId))}`
    : table === "uploads" ? `${acctLabel(acctById(rec.bankAccountId))} · statement ${rec.statementDate}` : table === "bankAccounts" ? rec.name
    : table === "schedules" ? rec.desc : table === "lines" ? rec.desc : table === "contacts" ? `${custName(rec.customerId)} · ${rec.department}` : table === "documents" ? `${custName(rec.customerId)} · ${DOC_LABEL[rec.docType]}` : rec.parent ? `Part of ${rec.parent}` : "";
  // Horizon record page: header (title, presence, UI action bar, label-value pairs) › ribbon › resizable pane (record tabs | contextual side bar)
  const tabs = [{ key: "details", label: "Details" }, ...(isNew ? [] : [...related(table, rec), historyTab(table, rec)])];
  const cur = tabs.find(x => x.key === tab.sub) || tabs[0];
  const form = `<form class="rform" data-rform="${esc(tab.key)}" novalidate${sn(`FRM-${CODE[table]}`)}>${sections}</form>`;
  const MAXT = window.innerWidth < 760 ? 2 : 5, shownT = tabs.slice(0, MAXT), moreT = tabs.slice(MAXT), curMore = moreT.includes(cur);
  const tabBtn = x => `<button type="button" role="tab" class="rtab" data-rtab="${esc(x.key)}" aria-selected="${x === cur}">${esc(x.label)}${x.n !== undefined ? ` <span class="count">${x.n}</span>` : ""}</button>`;
  const side = isNew ? [] : sidePanels(table, rec, tab);
  const sp = W().side, sOpen = sp.open && side.length, sCur = side.find(x => x.key === tab.side) || side.find(x => x.key === sideDefault(table, rec)) || side[0];
  return `<div class="page rec">
    <div class="rec-head"${sn(`RP-${CODE[table]}`)}>
      <div class="rh-top">
        <div class="rh-title"><span class="rh-table">${esc(def.label)}</span><h1>${esc(title)}</h1>${sub ? `<span class="rh-sub">${esc(sub)}</span>` : ""}</div>
        <div class="rh-right">${isNew ? "" : `<span class="presence"${sn("WS-15")} title="Viewing now: ${esc(me().name)} (you)"><span class="avatar sm" aria-label="Viewing now: ${esc(me().name)}">${esc(initials(me().name))}</span></span>`}${actionBar(actionsFor(table, rec, isNew, canEdit))}</div>
      </div>
      ${isNew ? "" : `<dl class="rh-fields"${sn(`HDR-${CODE[table]}`)}>${headerFields(table, rec).join("")}</dl>`}
    </div>
    ${isNew ? "" : ribbon(table, rec, tab)}
    ${tab.msg ? `<div class="notice${tab.msg.kind === "err" ? " err" : " ok"}" role="alert"><span class="grow">${esc(tab.msg.text)}</span></div>` : ""}
    <div class="rpane${side.length ? "" : " solo"}${sOpen ? "" : " side-closed"}" style="--side-w:${sp.w}px">
      <div class="rp-main">
        ${tabs.length > 1 ? `<div class="rtabs" role="tablist" aria-label="Record tabs"${sn("WS-13")}>${shownT.map(tabBtn).join("")}${moreT.length ? `<details class="ovf tabmore"><summary class="rtab${curMore ? " on" : ""}">${curMore ? esc(cur.label) : "More"} ${icon("chev", 14)}</summary><div class="ovf-menu" role="menu">${moreT.map(tabBtn).join("")}</div></details>` : ""}</div>` : ""}
        <div class="rtab-body">${cur.key === "details" ? form : cur.html}</div>
      </div>
      ${side.length ? `<div class="rp-resize" data-resize title="Drag to resize the side panel" aria-hidden="true"></div>
      <aside class="cside"${sn("WS-14")}>
        <div class="cs-tabs" role="tablist" aria-orientation="vertical" aria-label="Side panel">${side.map(x => `<button type="button" role="tab" class="cs-tab" data-stab="${x.key}" aria-selected="${sOpen && x === sCur}" title="${esc(x.label)}" aria-label="${esc(x.label)}">${icon(x.icon, 18)}${x.badge ? `<b>${x.badge}</b>` : ""}</button>`).join("")}
          <button type="button" class="cs-tab cs-toggle" data-stoggle title="${sOpen ? "Collapse" : "Expand"} side panel" aria-label="${sOpen ? "Collapse" : "Expand"} side panel">${icon("panel", 18)}</button></div>
        ${sOpen ? `<div class="cs-panel"><div class="cs-head"><h2>${esc(sCur.label)}</h2></div>${sCur.html}</div>` : ""}
      </aside>` : ""}
    </div>
  </div>`;
}

/** Record history tab (sys_audit / history set): one row per field change, newest first. */
function historyTab(table, rec) {
  const hs = historyOf(table, rec.id), def = TABLES[table];
  const val = (f, v) => { if (v === null || v === "" || v === undefined || (Array.isArray(v) && !v.length)) return `<span class="muted">(empty)</span>`;
    if (!f) return esc(String(v));
    if (f.type === "Reference") return esc(f.ref === "users" ? userById(v)?.name || v : displayOf(f.ref, recById(f.ref, v)) || v);
    if (f.type === "Choice") return esc((f.choices.find(c => c[0] === v) || [, v])[1]);
    if (f.type === "Currency") return `<span class="mono">SGD ${fmt(v)}</span>`;
    if (f.type === "True/False") return v ? "Yes" : "No";
    return esc(Array.isArray(v) ? v.join(", ") : String(v)); };
  const rows = hs.map(h => { const f = def.fields.find(x => x.key === h.field);
    return `<tr><td class="mono small">${esc(h.at.slice(0, 16).replace("T", " "))}</td><td>${esc(userById(h.by)?.name || "System")}</td>${h.kind === "created" ? `<td colspan="3"><b>Record created</b></td>` : `<td>${esc(f?.label || h.field)}</td><td class="wrap">${val(f, h.old)}</td><td class="wrap">${val(f, h.new)}</td>`}</tr>`; }).join("");
  return sec("WS-17", "Record history", hs.length, `<section class="rel"${sn("WS-17")}><header><h3>Record history</h3><span class="muted small">Field changes from the audit log, newest first</span></header>
    ${hs.length ? `<div class="tablewrap"><table><thead><tr><th>When</th><th>Who</th><th>Field</th><th>Old value</th><th>New value</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="empty small">No changes recorded for this record yet.</p>`}</section>`);
}

/** Contextual side bar tools (vertical icon tabs) per record. */
function sidePanels(table, rec, tab) {
  if (table !== "requests") return [];
  const out = [];
  if (isIx(rec)) out.push({ key: "setup", label: "GIRO setup", icon: "check", html: giroPanel(rec, tab), badge: REQ_OPEN.includes(rec.state) && !rec.contractId ? "!" : "" });
  else if (rec.form) out.push({ key: "setup", label: "Customer setup", icon: "check", html: setupPanel(rec, tab), badge: setupPending(rec) ? "!" : "" });
  out.push({ key: "activity", label: "Activity", icon: "chat", html: activity(rec) });
  out.push({ key: "attachments", label: "Attachments", icon: "clip", html: attachments(rec) });
  return out;
}
const sideDefault = (table, rec) => table === "requests" && rec.form && REQ_OPEN.includes(rec.state) && (isIx(rec) || setupPending(rec)) ? "setup" : "activity";

/** AR-ix side panel: link the contract (after its AR-i is processed if it is new), then activate or remove the GIRO. */
function giroPanel(r, tab) {
  const open = REQ_OPEN.includes(r.state), k = r.contractId ? ctrById(r.contractId) : null;
  const item = (ok, label, detail) => `<li class="${ok === true ? "ok" : ok === false ? "todo" : "na"}"><span class="tick" aria-hidden="true">${ok === true ? "✓" : ok === false ? "!" : "–"}</span><div><b>${label}</b>${detail ? `<span class="desc">${detail}</span>` : ""}</div></li>`;
  const ref = String(r.newCtrRef || "").trim().toLowerCase();
  const cands = S.contracts.filter(c => !isShell(c)).sort((a, b) => (b.number.toLowerCase() === ref) - (a.number.toLowerCase() === ref) || (b.customerId === r.customerId) - (a.customerId === r.customerId) || a.number.localeCompare(b.number));
  const done = r.state === "completed", cur = activeGiroCase(k), block = k && !done ? giroBlock(r, k) : "";
  return `<section class="setup"${sn("REQ-GIRO")}>
    <header><h2>GIRO setup</h2></header>
    <ul class="checklist">
      ${item(!!k, k ? `Contract: ${esc(k.number)}` : `Contract not linked: ${esc(r.newCtrRef || "no reference")}`, k ? `${esc(custName(k.customerId))} · ${esc(k.title)}` : "Process the AR-i that sets up this contract first, then link it below.")}
      ${k ? item(cur ? true : null, `GIRO on ${esc(k.number)}: ${cur ? "Active" : "Not active"}`, cur ? `From ${refLink("requests", cur.id, cur.number)}${cur.id === r.id ? " (this case)" : ""} · ${esc(giroLabel(cur))}` : "No AR-ix case is active on this contract") : ""}
      ${item(done ? true : k && !block ? false : null, r.giroType === "remove" ? "Remove GIRO" : "Activate GIRO", done ? (r.giroType === "remove" ? "GIRO removed from the contract" : cur?.id === r.id ? "This case is the contract's active GIRO" : "Activated; since ended by a later case") : !k ? "Available once the contract is linked" : block ? `<span class="bad">${esc(block)}</span>` : r.giroType === "remove" ? `Sets ${esc(k.number)} to GIRO not active (ends ${esc(cur.number)})` : `Sets ${esc(k.number)} to GIRO active with this case: ${esc(giroLabel(r))}${r.giroAmount ? `, SGD ${fmt(r.giroAmount)}` : ""}`)}
    </ul>
    ${open && !k ? `<label class="ffield linkto"${sn("REQ-LINKCTR")}><span class="flabel">Contract to link</span>
      <select id="linkCtr-${r.id}" data-linkctr="${esc(tab.key)}"><option value="">-- Choose the contract --</option>${cands.map(c => `<option value="${c.id}"${tab.linkCtr === c.id ? " selected" : ""}>${esc(c.number)} · ${esc(custName(c.customerId))}${c.number.toLowerCase() === ref ? " (matches the reference)" : ""}</option>`).join("")}</select>
      <span class="fhelp">Then use Link contract in the header.</span></label>` : ""}
  </section>`;
}

