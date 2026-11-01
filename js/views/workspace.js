// AR team experience: a ServiceNow configurable workspace (UI Builder) — unified header, left rail,
// list menu, tabbed records, landing page, list pages and record pages with UI actions and activity stream.
import { ctrById, ctrStatus, custById, rollup } from "../ledger.js";
import { DOC_LABEL, LINE_TYPE, REQ_OPEN, contactFor, displayOf, freqLabel, lineStatus, lineValue, linesLabel, me, nextBilling, periodDates, periodsDue, recById, reqLines, schedulePeriods, setupStatus, userById } from "../records.js";
import { CODE } from "../notes.js";
import { ROLES, TABLES } from "../schema.js";
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
      setup: ["Customer setup pending", r => REQ_OPEN.includes(r.state) && (!!r.newCustomer || !setupStatus(r).docsDone)],
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
    filters: { all: ["Contracts", () => true], active: ["Active", k => ctrStatus(k)[0] === "Active"] },
    cols: [["Number", k => refLink("contracts", k.id, k.number), "", "number"], ["Title", k => esc(k.title), "wrap", "title"], ["Customer", k => esc(custName(k.customerId)), "", "customerId"],
      ["Billing", k => esc(k.billing), "", "billing"], ["Value", k => fmt(k.value || 0), "num", "value"], ["End", k => esc(k.end || "—"), "", "end"], ["Status", k => { const s = ctrStatus(k); return `<span class="chip ${s[1]}">${s[0]}</span>`; }, "", "=CON.status"]],
    sort: (a, b) => a.number.localeCompare(b.number),
    text: k => [k.number, k.title, custName(k.customerId)].join(" "),
    newable: true
  }
};
const issuedOf = custId => S.invoices.filter(i => i.customerId === custId && i.state === "issued");

const MENU = [
  ["AR requests", [["requests", "open"], ["requests", "new"], ["requests", "setup"], ["requests", "mine"], ["requests", "awaiting"], ["requests", "all"]]],
  ["Recurring billing", [["schedules", "due"], ["schedules", "active"], ["schedules", "all"]]],
  ["Invoices", [["invoices", "draft"], ["invoices", "open"], ["invoices", "overdue"], ["invoices", "all"]]],
  ["Bank statements", [["uploads", "all"], ["deposits", "unapplied"], ["deposits", "all"], ["bankAccounts", "all"]]],
  ["Master data", [["customers", "all"], ["contracts", "all"], ["contacts", "all"], ["documents", "all"]]]
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
    <header class="ws-head"${sn("WS-01")}>
      <div class="ws-brand"><span class="ws-logo" aria-hidden="true">AR</span><span>Receivables Workspace</span></div>
      <form class="ws-search" role="search" id="wsSearch"${sn("WS-02")}>${icon("search", 16)}<input id="wsQ" type="search" placeholder="Search number or customer" aria-label="Search records" autocomplete="off"></form>
      <div class="ws-user"><span class="ws-bell" title="${counts.new} new AR requests">${icon("bell", 18)}${counts.new ? `<b>${counts.new}</b>` : ""}</span><span class="avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="ws-uname">${esc(u.name)}</span></div>
    </header>
    <div class="ws-body">
      <nav class="ws-rail" aria-label="Workspace navigation"${sn("WS-03")}>
        ${rail.map(([k, l, ic]) => `<button type="button" data-rail="${k}" title="${l}" aria-label="${l}" aria-current="${railActive(k)}">${icon(ic, 20)}</button>`).join("")}
      </nav>
      ${w.listMenu ? `<aside class="ws-listmenu" aria-label="Lists"${sn("WS-04")}>
        <div class="lm-head"><b>Lists</b><button type="button" class="iconbtn" data-rail="closelists" aria-label="Close lists">${icon("close", 16)}</button></div>
        ${MENU.map(([g, items]) => `<div class="lm-group"><h3>${esc(g)}</h3>${items.map(([t, f]) => {
          const n = S[t].filter(LISTS[t].filters[f][1]).length;
          const on = m.kind === "list" && m.table === t && m.filter === f;
          return `<button type="button" class="lm-item" data-list="${t}:${f}" aria-current="${on}"><span>${esc(LISTS[t].filters[f][0])}</span><span class="count">${n}</span></button>`; }).join("")}</div>`).join("")}
      </aside>` : ""}
      <main class="ws-main">
        <div class="ws-tabs" role="tablist" aria-label="Open tabs"${sn("WS-05")}>
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

function listPage(table, filter) {
  const def = LISTS[table], t = TABLES[table];
  const { rows, html } = listRows(table, filter);
  return `<div class="page">
    <div class="pagehead"><div><h1 class="pt">${esc(t.plural)}</h1><p class="psub">${esc(def.filters[filter][0])} · <span id="listCount">${rows.length}</span> record${rows.length === 1 ? "" : "s"}</p></div>
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
const has = k => r => !!r[k], not = k => r => !r[k];
const LAYOUT = {
  requests: [["AR form", ["form", "department", "title", "amount", "poNumber"]], ["Customer", ["customerId"], not("newCustomer")], ["New customer (to verify)", ["newCustName", "newCustUen", "newCustAddress"], has("newCustomer")],
    ["Bill-to (from the request)", ["billToName", "billToEmail", "billToPhone", "billToAddress"], has("billToName")], ["Contract", ["contractId", "contractLocation", "contractLocationRef"]],
    ["Documents supplied", ["docContract", "docAcra", "docBillingForm"], r => r.docContract || r.docAcra || r.docBillingForm],
    ["Case", ["state", "requestedBy", "assignedTo", "opened", "details"]]],
  lines: [["Billing line", ["number", "requestId", "lineType", "desc", "amount", "invoiceDate", "frequency", "startDate", "endDate", "invoiceId", "scheduleId"]]],
  invoices: [["Invoice", ["customerId", "contractId", "desc", "amount", "date", "due"]], ["Source", ["state", "requestId", "lineId", "scheduleId", "periodDate"]]],
  deposits: [["Deposit", ["number", "bankAccountId", "uploadId", "date", "amount", "bankRef", "payer", "reference"]]],
  uploads: [["Statement upload", ["number", "bankAccountId", "statementDate", "fileName", "uploadedBy", "uploadedAt", "depositCount", "depositTotal", "skippedCount"]]],
  bankAccounts: [["Bank account", ["bank", "number", "name", "department", "accountType", "currency"]]],
  customers: [["Customer", ["name", "uen", "parent", "address", "terms", "creditLimit", "aliases", "notes"]]],
  contracts: [["Contract", ["number", "customerId", "title", "billing", "value", "start", "end", "terms", "discPct", "discDays", "contractLocation", "contractLocationRef", "notes"]]],
  contacts: [["Billing contact", ["customerId", "department", "name", "email", "phone", "address", "requestId"]]],
  documents: [["Customer document", ["number", "customerId", "docType", "fileName", "contractId", "department", "requestId", "received"]]],
  schedules: [["Billing schedule", ["number", "customerId", "contractId", "department", "desc", "frequency", "amount", "firstDate", "lastDate", "requestId"]]]
};
/** Fields AR can't edit on the workspace form (set by the portal or by UI actions). */
const RO = { requests: ["form", "newCustomer", "newCustName", "newCustUen", "newCustAddress", "billToName", "billToEmail", "billToPhone", "billToAddress"], lines: ["lineType"] };

function editable(table, rec) {
  if (table === "requests") return REQ_OPEN.includes(rec.state);
  if (table === "invoices") return rec.state === "draft";
  if (table === "deposits" || table === "uploads" || table === "documents") return false;
  if (table === "lines") { const r = recById("requests", rec.requestId); return !!r && REQ_OPEN.includes(r.state) && lineStatus(rec) === "open"; }
  return true;
}

function action(table, label, act, opts = {}) {
  return `<button type="button" class="btn${opts.primary ? " primary" : ""}${opts.danger ? " bad" : ""}" data-ui="${act}"${sn(`UA-${CODE[table]}-${opts.id || act}`)}>${esc(label)}</button>`;
}

function headerFields(table, rec) {
  const hf = (k, v) => `<div class="hf"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  if (table === "requests") return [hf("State", reqChip(rec)), hf("Form", `${esc(rec.form || "AR-i")} · ${esc(linesLabel(rec))}`), hf("Customer", rec.customerId ? refLink("customers", rec.customerId) : `${esc(rec.newCustName || "—")} <span class="chip c-warn">New</span>`), hf("Department", esc(rec.department || "—")), hf("Request value", `<span class="mono">SGD ${fmt(rec.amount)}</span>`),
    hf("Assigned to", esc(userById(rec.assignedTo)?.name || "Unassigned")), hf("Requested by", esc(userById(rec.requestedBy)?.name || "—")), hf("Opened", esc(rec.opened))];
  if (table === "invoices") { const m = invMoney(rec); return [hf("Status", invChip(rec)), hf("Amount", `<span class="mono">SGD ${fmt(rec.amount)}</span>`), hf("Amount due", `<span class="mono">SGD ${fmt(m.open)}</span>`),
    hf("Due", `${esc(rec.due || "—")}${rec.state === "issued" && m.open > 0 ? `<span class="desc${m.late ? " bad" : ""}">${esc(daysLabel(rec.due))}</span>` : ""}`), hf("Customer", refLink("customers", rec.customerId)), hf("AR request", refLink("requests", rec.requestId))]; }
  if (table === "deposits") { const m = depositMoney(rec), a = acctById(rec.bankAccountId); return [hf("Match", depositChip(rec)), hf("Amount", `<span class="mono">SGD ${fmt(rec.amount)}</span>`), hf("Matched", `<span class="mono">${fmt(m.applied)}</span>`), hf("Unmatched", `<span class="mono${m.unapplied ? " bad" : ""}">${fmt(m.unapplied)}</span>`), hf("Value date", esc(rec.date)), hf("Department", esc(a?.department || "—")), hf("Account type", esc(a ? acctType(a) : "—"))]; }
  if (table === "uploads") return [hf("Bank account", refLink("bankAccounts", rec.bankAccountId)), hf("Statement date", esc(rec.statementDate)), hf("Deposits", String(rec.depositCount)), hf("Total", `<span class="mono">SGD ${fmt(rec.depositTotal)}</span>`), hf("Uploaded by", esc(userById(rec.uploadedBy)?.name || "—"))];
  if (table === "bankAccounts") { const ups = S.uploads.filter(u => u.bankAccountId === rec.id); return [hf("Bank", esc(BANKS[rec.bank]?.name || "—")), hf("Department", esc(rec.department || "—")), hf("Type", esc(acctType(rec))), hf("Uploads", String(ups.length)), hf("Last statement", esc(ups.map(u => u.statementDate).sort().pop() || "—"))]; }
  if (table === "customers") { const r = rollup(issuedOf(rec.id)); return [hf("Open AR", `<span class="mono">SGD ${fmt(r.open)}</span>`), hf("Overdue", `<span class="mono${r.overdue ? " bad" : ""}">${fmt(r.overdue)}</span>`),
    hf("Contracts", String(S.contracts.filter(k => k.customerId === rec.id).length)), hf("Credit limit", rec.creditLimit ? `<span class="mono">${fmt(rec.creditLimit)}</span>` : "Not set")]; }
  if (table === "contracts") { const r = rollup(S.invoices.filter(i => i.contractId === rec.id && i.state === "issued")); const s = ctrStatus(rec);
    return [hf("Status", `<span class="chip ${s[1]}">${s[0]}</span>`), hf("Customer", refLink("customers", rec.customerId)), hf("Value", `<span class="mono">${fmt(rec.value || 0)}</span>`), hf("Billed", `<span class="mono">${fmt(r.billed)}</span>`), hf("Collected", `<span class="mono">${fmt(r.collected)}</span>`)]; }
  if (table === "schedules") { const due = periodsDue(rec).length; return [hf("Customer", refLink("customers", rec.customerId)), hf("Frequency", esc(freqLabel(rec.frequency))), hf("Amount per period", `<span class="mono">SGD ${fmt(rec.amount)}</span>`),
    hf("Next billing", esc(nextBilling(rec) || "Ended")), hf("Periods due", due ? `<span class="chip c-warn">${due} due</span>` : `<span class="chip c-ok">Up to date</span>`), hf("Department", esc(rec.department))]; }
  if (table === "lines") { const st = lineStatus(rec); return [hf("Type", esc(LINE_TYPE[rec.lineType])), hf("Status", lineChip(rec)), hf("AR request", refLink("requests", rec.requestId)), hf("Line value", `<span class="mono">SGD ${fmt(lineValue(rec))}</span>`)]; }
  if (table === "contacts") return [hf("Customer", refLink("customers", rec.customerId)), hf("Department", esc(rec.department)), hf("Email", esc(rec.email || "—"))];
  if (table === "documents") return [hf("Customer", refLink("customers", rec.customerId)), hf("Type", esc(DOC_LABEL[rec.docType])), hf("Received", esc(rec.received)), hf("From request", refLink("requests", rec.requestId))];
  return [];
}

function actionsFor(table, rec, isNew, canEdit) {
  const a = [];
  if (isNew) return action(table, "Save", "save", { primary: true, id: "insert" });
  if (table === "requests") {
    if (REQ_OPEN.includes(rec.state)) {
      const st = setupStatus(rec);
      if (!mine(rec)) a.push(action(table, "Assign to me", "assign"));
      if (setupPending(rec, st)) a.push(action(table, rec.newCustomer ? "Create customer & link" : "Link to customer", "link", { primary: true }));
      /* billing is done per line in the Billing lines list once the request is linked to a customer */
      a.push(action(table, "Request info", "info"));
      a.push(action(table, "Reject", "reject", { danger: true }));
    }

  }
  if (table === "invoices") {
    if (rec.state === "draft") a.push(action(table, "Issue invoice", "issue", { primary: true }));
    if (rec.state !== "cancelled") a.push(action(table, "Cancel invoice", "cancel", { danger: true }));
  }
  if (table === "deposits" && depositMoney(rec).unapplied > 0) a.push(`<button type="button" class="btn primary" data-matchdep="${rec.id}"${sn("UA-DEP-match")}>Match to invoice</button>`);
  if (table === "uploads") a.push(`<button type="button" class="btn" data-rail="bsu">Upload another</button>`);
  if (table === "bankAccounts") a.push(`<button type="button" class="btn" data-bsu-acct="${rec.id}"${sn("UA-BNK-upload")}>Upload statement</button>`);
  if (table === "lines") { const r = recById("requests", rec.requestId), ok = r && REQ_OPEN.includes(r.state) && r.customerId && !r.newCustomer;
    if (ok && lineStatus(rec) === "open") a.push(rec.lineType === "recurring" ? `<button type="button" class="btn primary" data-lineact="schedule:${rec.id}"${sn("UA-RQL-schedule")}>Set up billing schedule</button>` : `<button type="button" class="btn primary" data-lineact="invoice:${rec.id}"${sn("UA-RQL-invoice")}>Create invoice</button>`); }
  if (table === "customers") { a.push(`<button type="button" class="btn" data-new="contracts" data-prefill-customer="${rec.id}"${sn("UA-CUS-newcontract")}>New contract</button>`);
    a.push(`<button type="button" class="btn" data-new="contacts" data-prefill-customer="${rec.id}"${sn("UA-CUS-newcontact")}>Add billing contact</button>`); }
  if (canEdit) a.push(action(table, "Save", "save"));
  return a.join("");
}

const LINE_CHIP = { open: ["Open", "c-neutral"], draft: ["Invoice draft", "c-accent"], invoiced: ["Invoiced", "c-ok"], scheduled: ["Scheduled", "c-ok"] };
const lineChip = l => { const [lab, c] = LINE_CHIP[lineStatus(l)]; return `<span class="chip ${c}">${lab}</span>`; };

/** Link to customer is needed while the customer, bill-to, documents or contract location aren't on the customer master yet. */
function setupPending(r, st = setupStatus(r)) {
  if (!st.linked) return true;
  if (r.billToName && !(st.contact && st.contact.name === r.billToName && st.contact.email === r.billToEmail)) return true;
  if (!st.docsDone) return true;
  return st.location === false;
}

function setupPanel(r, tab) {
  if (!r.form) return "";
  const st = setupStatus(r), lines = reqLines(r), doneLines = lines.filter(l => ["invoiced", "scheduled"].includes(lineStatus(l))).length;
  const item = (ok, label, detail) => `<li class="${ok === true ? "ok" : ok === false ? "todo" : "na"}"><span class="tick" aria-hidden="true">${ok === true ? "✓" : ok === false ? "!" : "–"}</span><div><b>${label}</b>${detail ? `<span class="desc">${detail}</span>` : ""}</div></li>`;
  const similar = r.newCustomer ? S.customers.filter(c => nameSim(r.newCustName || "", c.name) >= .5) : [];
  const contactOk = st.linked && st.contact && (!r.billToName || (st.contact.name === r.billToName && st.contact.email === r.billToEmail));
  const ctr = r.contractId ? S.contracts.find(k => k.id === r.contractId) : null;
  return `<section class="card setup"${sn("REQ-SETUP")}>
    <header><h2>Customer setup</h2><span class="muted small">${esc(r.form || "AR-i")}${r.newCustomer ? " · new customer (first request)" : ""}</span></header>
    <ul class="checklist">
      ${item(st.linked, st.linked ? `Customer: ${esc(custName(r.customerId))}` : `New customer to verify: ${esc(r.newCustName)}`, st.linked ? "" : `UEN ${esc(r.newCustUen || "not given")}. Link to customer creates it, or pick an existing customer below.`)}
      ${item(contactOk ? true : false, `${esc(r.department)} billing contact`, contactOk ? `${esc(st.contact.name)} · ${esc(st.contact.email)}` : r.billToName ? `Will be ${st.contact ? "updated" : "added"} from this request: ${esc(r.billToName)} · ${esc(r.billToEmail)}` : "No billing contact on file and none on the request. Ask the requester.")}
      ${st.docsGiven.length ? item(st.docsDone, "Documents filed on the customer", st.docsGiven.map(t => `${esc(DOC_LABEL[t])}${st.filed.includes(t) ? " ✓" : ""}`).join(" · ")) : item(null, "Documents", "All already on file; nothing new supplied")}
      ${ctr ? item(st.location !== false, `Contract location on ${esc(ctr.number)}`, ctr.contractLocation ? esc(ctr.contractLocationRef || ctr.contractLocation) : "Will be recorded from this request") : ""}
      ${item(lines.length && doneLines === lines.length, `Billing lines ${doneLines} of ${lines.length} done`, lines.length && doneLines === lines.length ? "Every line is invoiced or scheduled" : st.linked ? "Create the invoice or billing schedule for each line below" : "Available once the customer is linked")}
    </ul>
    ${r.newCustomer && REQ_OPEN.includes(r.state) ? `<label class="ffield linkto"${sn("REQ-LINKTO")}><span class="flabel">Link to an existing customer instead (optional)</span>
      <select id="linkTo-${r.id}" data-linkto="${esc(tab.key)}"><option value="">Create new customer "${esc(r.newCustName)}"</option>${S.customers.slice().sort((a, b) => nameSim(r.newCustName, b.name) - nameSim(r.newCustName, a.name)).map(c => `<option value="${c.id}"${tab.linkTo === c.id ? " selected" : ""}>${esc(c.name)}${similar.includes(c) ? " (similar)" : ""}</option>`).join("")}</select></label>` : ""}
  </section>`;
}

function activity(rec) {
  const c = W().composer[rec.id] || { kind: "work_note", text: "" };
  const open = REQ_OPEN.includes(rec.state);
  const items = rec.activity.slice().reverse();
  const kindLabel = { comment: "Additional comment · visible to requester", work_note: "Work note · AR team only", system: "System" };
  return `<aside class="rec-side">
    ${rec.attachments?.length ? `<section class="card att"${sn("REQ-ATT")}><header><h2>Attachments</h2></header><ul>${rec.attachments.map(a => `<li>${icon("clip", 15)} ${esc(a)}</li>`).join("")}</ul></section>` : ""}
    <section class="card stream"${sn("REQ-ACT")}>
      <header><h2>Activity</h2></header>
      ${open ? `<div class="composer">
        <div class="seg" role="group" aria-label="Entry type"><button type="button" data-ckind="work_note" aria-pressed="${c.kind === "work_note"}">Work note</button><button type="button" data-ckind="comment" aria-pressed="${c.kind === "comment"}">Additional comment</button></div>
        <textarea id="composer-${rec.id}" data-composer="${rec.id}" rows="3" placeholder="${c.kind === "comment" ? "Visible to the requester on the portal" : "Internal note for the AR team"}">${esc(c.text)}</textarea>
        <div class="row"><span class="hint">${c.kind === "comment" ? "The requester sees this on the portal." : "Only the AR team sees work notes."}</span><button type="button" class="btn small primary" data-ui="post"${sn("UA-REQ-post")}>Post</button></div>
      </div>` : ""}
      <ol class="feed">${items.map(e => { const u = userById(e.by);
        return `<li class="fe k-${e.kind}"><span class="avatar sm" aria-hidden="true">${esc(initials(u?.name))}</span><div><div class="fe-h"><b>${esc(u?.name || "System")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><div class="fe-k">${kindLabel[e.kind]}</div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
    </section>
  </aside>`;
}

function related(table, rec) {
  if (table === "requests") {
    const r = rec, ok = REQ_OPEN.includes(r.state) && r.customerId && !r.newCustomer;
    return relatedTable("Billing lines", "lines", reqLines(r), [
      ["Line", l => refLink("lines", l.id, l.number)], ["Type", l => esc(LINE_TYPE[l.lineType])], ["Description", l => esc(l.desc), "wrap"],
      ["Billing", l => l.lineType === "recurring" ? `${esc(freqLabel(l.frequency))} · ${esc(l.startDate)} to ${esc(l.endDate)}<span class="desc">${periodDates(l.frequency, l.startDate, l.endDate).length} invoices</span>` : esc(l.invoiceDate ? `around ${l.invoiceDate}` : "As soon as possible")],
      ["Amount", l => `${fmt(l.amount)}${l.lineType === "recurring" ? `<span class="desc">per period</span>` : ""}`, "num"], ["Value", l => fmt(lineValue(l)), "num"],
      ["Status", l => { const inv = l.invoiceId && S.invoices.find(i => i.id === l.invoiceId), sch = l.scheduleId && S.schedules.find(x => x.id === l.scheduleId);
        return `${lineChip(l)}${inv ? ` ${refLink("invoices", inv.id, inv.number)}` : ""}${sch ? ` ${refLink("schedules", sch.id, sch.number)}` : ""}`; }],
      ["", l => !ok || lineStatus(l) !== "open" ? "" : l.lineType === "recurring" ? `<button type="button" class="btn small primary" data-lineact="schedule:${l.id}"${sn("UA-RQL-schedule")}>Set up billing schedule</button>` : `<button type="button" class="btn small primary" data-lineact="invoice:${l.id}"${sn("UA-RQL-invoice")}>Create invoice</button>`]
    ], { id: "RL-REQ-RQL", actions: ok ? "" : `<span class="muted small">${REQ_OPEN.includes(r.state) ? "Link the request to a customer to bill the lines" : ""}</span>` });
  }
  if (table === "schedules") {
    const per = schedulePeriods(rec);
    return `<section class="rel"${sn("SCH-PER")}><header><h3>Billing periods <span class="count">${per.filter(p => !p.more).length}</span></h3><span class="muted small">Raise each invoice when its period is due (no automatic invoicing)</span></header>
      <div class="tablewrap"><table><thead><tr><th>Period</th><th>Status</th><th>Invoice</th><th class="num">Amount</th><th></th></tr></thead><tbody>
      ${per.map(p => p.more ? `<tr><td colspan="5" class="muted small">${p.remaining} more ${esc(freqLabel(rec.frequency).toLowerCase())} period${p.remaining === 1 ? "" : "s"} until ${esc(rec.lastDate)}.</td></tr>`
        : `<tr><td>${esc(p.date)}</td><td><span class="chip ${p.status === "Invoiced" ? "c-ok" : p.status === "Due" ? "c-warn" : "c-neutral"}">${p.status}</span></td><td>${p.inv ? `${refLink("invoices", p.inv.id, p.inv.number)} ${invChip(p.inv)}` : "—"}</td><td class="num">${fmt(rec.amount)}</td>
          <td>${p.inv ? "" : `<button type="button" class="btn small${p.status === "Due" ? " primary" : ""}" data-raise="${rec.id}|${p.date}"${sn("UA-SCH-raise")}>Raise invoice</button>`}</td></tr>`).join("")}
      </tbody></table></div></section>` +
      relatedTable("Invoices", "invoices", S.invoices.filter(i => i.scheduleId === rec.id).sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Status", i => invChip(i)]], { id: "RL-SCH-INV" });
  }
  if (table === "customers") {
    const ks = S.contracts.filter(k => k.customerId === rec.id), is = S.invoices.filter(i => i.customerId === rec.id), rs = S.requests.filter(r => r.customerId === rec.id);
    const extra = relatedTable("Billing contacts", "contacts", S.contacts.filter(c => c.customerId === rec.id).sort(LISTS.contacts.sort), [["Department", c => esc(c.department)], ["Bill-to person", c => refLink("contacts", c.id, c.name)], ["Email", c => esc(c.email)], ["Billing address", c => esc(c.address || "—"), "wrap"]], { id: "RL-CUS-BCT" }) +
      relatedTable("Customer documents", "documents", S.documents.filter(d => d.customerId === rec.id).sort(LISTS.documents.sort), [["Type", d => esc(DOC_LABEL[d.docType])], ["File", d => refLink("documents", d.id, d.fileName), "wrap"], ["For", d => esc(d.contractId ? ctrNo(d.contractId) : d.department || "—")], ["Received", d => esc(d.received)]], { id: "RL-CUS-DOC" }) +
      relatedTable("Billing schedules", "schedules", S.schedules.filter(x => x.customerId === rec.id), [["Number", x => refLink("schedules", x.id, x.number)], ["What is billed", x => esc(x.desc), "wrap"], ["Frequency", x => esc(freqLabel(x.frequency))], ["Next billing", x => esc(nextBilling(x) || "Ended")]], { id: "RL-CUS-SCH" });
    return extra + relatedTable("Contracts", "contracts", ks, [["Number", k => refLink("contracts", k.id, k.number)], ["Title", k => esc(k.title), "wrap"], ["Billing", k => esc(k.billing)], ["Value", k => fmt(k.value || 0), "num"]], { id: "RL-CUS-CON" }) +
      relatedTable("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { id: "RL-CUS-INV" }) +
      relatedTable("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Amount", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { id: "RL-CUS-REQ" });
  }
  if (table === "contracts") {
    const is = S.invoices.filter(i => i.contractId === rec.id), rs = S.requests.filter(r => r.contractId === rec.id);
    const r = rollup(is.filter(i => i.state === "issued"));
    return `<section class="rel meters">${meterRow("Billed against contract value", r.billed, rec.value || 0, "var(--accent)")}${meterRow("Collected of billed", r.collected, r.billed, "var(--ok)")}</section>` +
      relatedTable("Invoices", "invoices", is.sort(LISTS.invoices.sort), [["Number", i => refLink("invoices", i.id, i.number)], ["Description", i => esc(i.desc), "wrap"], ["Amount", i => fmt(i.amount), "num"], ["Due", i => esc(i.due || "—")], ["Status", i => invChip(i)]], { id: "RL-CON-INV" }) +
      relatedTable("AR requests", "requests", rs.sort(LISTS.requests.sort), [["Number", r => refLink("requests", r.id, r.number)], ["What", r => esc(r.title), "wrap"], ["Amount", r => fmt(r.amount), "num"], ["State", r => reqChip(r)]], { id: "RL-CON-REQ" });
  }
  if (table === "uploads" || table === "bankAccounts") {
    const deps = S.deposits.filter(p => table === "uploads" ? p.uploadId === rec.id : p.bankAccountId === rec.id).sort(LISTS.deposits.sort);
    const ups = table === "bankAccounts" ? relatedTable("Statement uploads", "uploads", S.uploads.filter(u => u.bankAccountId === rec.id).sort(LISTS.uploads.sort),
      [["Upload", u => refLink("uploads", u.id, u.number)], ["Statement date", u => esc(u.statementDate)], ["Deposits", u => String(u.depositCount), "num"], ["Total", u => fmt(u.depositTotal), "num"]], { id: "RL-BNK-BSU" }) : "";
    return ups + relatedTable("BSU deposits", "deposits", deps, [["Deposit ID", p => refLink("deposits", p.id, p.number)], ["Payer", p => esc(p.payer)], ["Reference", p => `<span class="mono small">${esc(p.reference || "—")}</span>`, "wrap"], ["Amount", p => fmt(p.amount), "num"], ["Match", p => depositChip(p)]], { id: table === "uploads" ? "RL-BSU-DEP" : "RL-BNK-DEP" });
  }
  if (table === "invoices" || table === "deposits") {
    const rows = [];
    for (const [pid, m] of Object.entries(S.matches)) { if (!m || m.status === "rejected") continue;
      for (const a of m.allocations) if ((table === "invoices" && a.invoiceId === rec.id) || (table === "deposits" && pid === rec.id)) rows.push({ pid, a, m }); }
    const cols = table === "invoices"
      ? [["BSU deposit", x => refLink("deposits", x.pid, recById("deposits", x.pid)?.number)], ["Payer", x => esc(recById("deposits", x.pid)?.payer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]]
      : [["Invoice", x => refLink("invoices", x.a.invoiceId)], ["Customer", x => esc(recById("invoices", x.a.invoiceId)?.customer || "")], ["Amount", x => fmt(x.a.amount), "num"], ["Note", x => esc(x.m.reason || ""), "wrap"]];
    return relatedTable("Allocations", "allocations", rows, cols, { id: table === "invoices" ? "RL-INV-ALC" : "RL-DEP-ALC" });
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
  const ro = RO[table] || [];
  const sections = LAYOUT[table].filter(([, , when]) => !when || isNew || when(shown)).map(([title, keys]) => `<fieldset class="fsec"><legend>${esc(title)}</legend><div class="fgrid">${keys.map(k => def.fields.find(f => f.key === k)).filter(Boolean).filter(f => !(isNew && f.readonly)).map(f => fieldHtml(table, f, shown, { prefix: `f-${tab.key}`, readonly: !canEdit || ro.includes(f.key), errors: tab.errors, vals: shown })).join("")}</div></fieldset>`).join("");
  const title = isNew ? `New ${def.label.toLowerCase()}` : displayOf(table, rec);
  const sub = table === "requests" ? rec.title : table === "invoices" ? rec.desc : table === "contracts" ? rec.title : table === "deposits" ? `${rec.payer} · ${acctLabel(acctById(rec.bankAccountId))}`
    : table === "uploads" ? `${acctLabel(acctById(rec.bankAccountId))} · statement ${rec.statementDate}` : table === "bankAccounts" ? rec.name
    : table === "schedules" ? rec.desc : table === "lines" ? rec.desc : table === "contacts" ? `${custName(rec.customerId)} · ${rec.department}` : table === "documents" ? `${custName(rec.customerId)} · ${DOC_LABEL[rec.docType]}` : rec.parent ? `Part of ${rec.parent}` : "";
  const twoCol = table === "requests" && !isNew;
  return `<div class="page rec">
    <div class="rec-head"${sn(`RP-${CODE[table]}`)}>
      <div class="rh-top">
        <div class="rh-title"><span class="rh-table">${esc(def.label)}</span><h1>${esc(title)}</h1>${sub ? `<span class="rh-sub">${esc(sub)}</span>` : ""}</div>
        <div class="rh-actions">${actionsFor(table, rec, isNew, canEdit)}</div>
      </div>
      ${isNew ? "" : `<dl class="rh-fields"${sn(`HDR-${CODE[table]}`)}>${headerFields(table, rec).join("")}</dl>`}
    </div>
    ${tab.msg ? `<div class="notice${tab.msg.kind === "err" ? " err" : " ok"}" role="alert"><span class="grow">${esc(tab.msg.text)}</span></div>` : ""}
    <div class="rec-body${twoCol ? " two" : ""}">
      <div class="rec-main">
        ${table === "requests" && !isNew ? setupPanel(rec, tab) + related(table, rec) : ""}
        <form class="rform panel" data-rform="${esc(tab.key)}" novalidate${sn(`FRM-${CODE[table]}`)}>${sections}</form>
        ${isNew || table === "requests" ? "" : related(table, rec)}
      </div>
      ${twoCol ? activity(rec) : ""}
    </div>
  </div>`;
}
