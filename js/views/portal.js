// Project team experience: Service Portal / Employee Center with the AR form (record producer),
// My requests list and the request ticket page (conversation with the AR team).
import { ctrById, custById, rollup } from "../ledger.js";
import { REQ_OPEN, me, reqById } from "../records.js";
import { RECORD_PRODUCER, ROLES, TABLES } from "../schema.js";
import { S } from "../state.js";
import { esc, fmt } from "../util.js";
import { custName, ctrNo, fieldHtml, icon, initials, reqChip, sn } from "./common.js";

const P = () => S.ui.portal;
const myReqs = () => S.requests.filter(r => r.requestedBy === me().id).sort((a, b) => String(b.updated || b.opened).localeCompare(String(a.updated || a.opened)));

export function portalView() {
  const p = P(), u = me();
  const page = p.page === "form" ? formPage() : p.page === "confirm" ? confirmPage() : p.page === "requests" ? requestsPage() : p.page === "ticket" ? ticketPage() : homePage();
  return `<div class="portal">
    <header class="pt-head"${sn("PT-01")}>
      <div class="pt-inner">
        <button type="button" class="pt-brand" data-pnav="home"><span class="pt-logo" aria-hidden="true">FS</span><span>Finance Services</span></button>
        <nav class="pt-nav" aria-label="Portal">
          <button type="button" data-pnav="home" aria-current="${p.page === "home"}">Home</button>
          <button type="button" data-pnav="form" aria-current="${p.page === "form"}">AR form</button>
          <button type="button" data-pnav="requests" aria-current="${p.page === "requests" || p.page === "ticket"}">My requests</button>
        </nav>
        <span class="pt-user"><span class="avatar" aria-hidden="true">${esc(initials(u.name))}</span><span class="pt-uname">${esc(u.name)}</span></span>
      </div>
    </header>
    <main class="pt-main">${page}</main>
  </div>`;
}

function homePage() {
  const mine = myReqs(), open = mine.filter(r => REQ_OPEN.includes(r.state)), waiting = mine.filter(r => r.state === "awaiting_info");
  return `<section class="pt-hero"${sn("PT-02")}>
      <div class="pt-inner"><h1>Finance Services</h1><p>Request customer invoices from Accounts Receivable and follow them through to issue.</p>
        <form class="pt-search" id="ptSearch" role="search">${icon("search", 18)}<input id="ptQ" type="search" placeholder="Find one of your requests by number or customer" aria-label="Search your requests"></form></div>
    </section>
    <div class="pt-inner pt-body">
      ${waiting.length ? `<div class="pt-alert" role="status"><b>${waiting.length} request${waiting.length === 1 ? " needs" : "s need"} your reply.</b> Accounts Receivable has asked for more information. ${waiting.map(r => `<button type="button" class="linkish" data-ticket="${r.id}">${esc(r.number)}</button>`).join(", ")}</div>` : ""}
      <div class="pt-tiles">
        <button type="button" class="pt-tile primary" data-pnav="form"${sn("PT-03")}>${icon("doc", 26)}<b>AR form</b><span>Ask AR to invoice a customer for a milestone, monthly fee or other billable work.</span></button>
        <button type="button" class="pt-tile" data-pnav="requests"${sn("PT-04")}>${icon("inbox", 26)}<b>My requests</b><span>${open.length} open · ${mine.length} in total</span></button>
      </div>
      <section class="pt-card">
        <header><h2>Recent requests</h2><button type="button" class="linkish small" data-pnav="requests">View all</button></header>
        ${mine.length ? `<ul class="mini">${mine.slice(0, 4).map(r => `<li><button type="button" class="mini-row" data-ticket="${r.id}"><span><b class="mono">${esc(r.number)}</b> ${esc(r.title)}<span class="desc">${esc(custName(r.customerId))} · SGD ${fmt(r.amount)}</span></span>${reqChip(r)}</button></li>`).join("")}</ul>` : `<p class="empty small">You haven't submitted any requests yet.</p>`}
      </section>
    </div>`;
}

export function contractBox(d) {
  const k = ctrById(d.contractId); if (!k) return "";
  const r = rollup(S.invoices.filter(i => i.contractId === k.id && i.state === "issued"));
  const pending = S.requests.filter(x => x.contractId === k.id && REQ_OPEN.includes(x.state)).reduce((s, x) => s + x.amount, 0);
  const left = (k.value || 0) - r.billed - pending;
  return `<div class="pt-info"${sn("PT-07")}>
    <b>${esc(k.number)} · ${esc(k.title)}</b>
    <dl><div><dt>Contract value</dt><dd class="mono">${fmt(k.value || 0)}</dd></div><div><dt>Invoiced so far</dt><dd class="mono">${fmt(r.billed)}</dd></div>
      <div><dt>Requested, not yet invoiced</dt><dd class="mono">${fmt(pending)}</dd></div><div><dt>Remaining to bill</dt><dd class="mono${left < 0 ? " bad" : ""}">${fmt(left)}</dd></div>
      <div><dt>Billing</dt><dd>${esc(k.billing)} · Net ${esc(k.terms)}</dd></div></dl>
    ${d.amount && left - d.amount < 0 && k.value ? `<p class="bad small">This request takes billing over the contract value by SGD ${fmt(d.amount - left)}. AR may ask for a change order.</p>` : ""}
  </div>`;
}

function formPage() {
  const p = P();
  if (!p.draft) p.draft = { billingType: "", attachments: [] };
  const d = p.draft, def = TABLES.requests;
  const fields = RECORD_PRODUCER.variables.map(k => def.fields.find(f => f.key === k));
  const f = k => fieldHtml("requests", fields.find(x => x.key === k), d, { prefix: "pf", errors: p.errors, vals: d });
  const nErr = Object.keys(p.errors || {}).length;
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <span>AR form</span></nav>
    <div class="pt-item">
      <form class="pt-form pt-card" id="arForm" novalidate${sn("PT-05")}>
        <h1>AR form</h1>
        <p class="pt-lead">Ask Accounts Receivable to invoice a customer. AR checks the request against the contract, then creates and issues the invoice. You can follow progress under My requests.</p>
        <div id="pfAlert">${formAlert(nErr)}</div>
        <div class="fgrid">
          <label class="ffield"${sn("PT-06")}><span class="flabel">Requested by</span><div class="fro">${esc(me().name)}</div></label>
          ${f("customerId")}${f("contractId")}
        </div>
        ${contractBox(d)}
        <div class="fgrid">${f("billingType")}${f("amount")}${f("title")}${f("periodStart")}${f("periodEnd")}${f("invoiceDate")}${f("poNumber")}${f("details")}</div>
        <div class="ffield wide"${sn("PT-08")}><span class="flabel">Supporting documents</span>
          <label class="btn small" for="pfAttach">${icon("clip", 15)} Add attachment</label><input type="file" id="pfAttach" multiple hidden>
          ${d.attachments?.length ? `<ul class="attlist">${d.attachments.map((a, ix) => `<li>${esc(a)} <button type="button" class="linkish small" data-unattach="${ix}">Remove</button></li>`).join("")}</ul>` : `<span class="fhelp">For example the customer's acceptance email, timesheet or PO.</span>`}
        </div>
      </form>
      <aside class="pt-side" id="pfSide">${formSide(d)}</aside>
    </div>
  </div>`;
}

export const formAlert = n => n ? `<div class="pt-alert err" role="alert">Please fix ${n} field${n === 1 ? "" : "s"} below.</div>` : "";

export function formSide(d) {
  const fields = RECORD_PRODUCER.variables.map(k => TABLES.requests.fields.find(f => f.key === k));
  const missing = fields.filter(x => x.mandatory && (d[x.key] === undefined || d[x.key] === "" || d[x.key] === null || (x.type === "Currency" && !(d[x.key] > 0))));
  return `<div class="pt-card sticky">
    <h2>Submit request</h2>
    <p class="small muted">Goes to the Accounts Receivable team as a case. You'll get updates on My requests.</p>
    ${missing.length ? `<p class="small"><b>Required information</b><br>${missing.map(x => esc(x.label)).join(", ")}</p>` : `<p class="small ok-t">All required information provided.</p>`}
    <button type="submit" form="arForm" class="btn primary block"${sn("PT-09")}>Submit</button>
  </div>`;
}

function confirmPage() {
  const r = reqById(P().id); if (!r) return homePage();
  return `<div class="pt-inner pt-body"><section class="pt-card pt-done" role="status">
    <h1>Request submitted</h1>
    <p>Your request <b class="mono">${esc(r.number)}</b> for <b>SGD ${fmt(r.amount)}</b> to ${esc(custName(r.customerId))} has been sent to Accounts Receivable.</p>
    <p class="muted small">Automation after submission (assignment, notifications, approvals) is still to be defined and will be added here.</p>
    <div class="row"><button type="button" class="btn primary" data-ticket="${r.id}">View request</button><button type="button" class="btn" data-pnav="form">Submit another</button></div>
  </section></div>`;
}

function requestsPage() {
  const rows = myReqs();
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <span>My requests</span></nav>
    <section class="pt-card"${sn("PT-10")}>
      <header><h1 class="h2">My requests</h1><button type="button" class="btn primary small" data-pnav="form">New AR form</button></header>
      ${rows.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Number</th><th>What should be invoiced</th><th>Customer</th><th class="num">Amount</th><th>State</th><th>Updated</th></tr></thead><tbody>
        ${rows.map(r => `<tr data-ticket="${r.id}" tabindex="0"><td><button type="button" class="linkish mono" data-ticket="${r.id}">${esc(r.number)}</button></td><td class="wrap">${esc(r.title)}</td><td>${esc(custName(r.customerId))}</td><td class="num">${fmt(r.amount)}</td><td>${reqChip(r)}</td><td>${esc(r.updated || r.opened)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">No requests yet. Use the AR form to ask Accounts Receivable for an invoice.</p>`}
    </section>
  </div>`;
}

function ticketPage() {
  const r = reqById(P().id); if (!r || r.requestedBy !== me().id) return requestsPage();
  const inv = S.invoices.find(i => i.id === r.invoiceId && i.state === "issued");
  const feed = r.activity.filter(e => e.kind !== "work_note").slice().reverse();
  const open = r.state !== "rejected" && r.state !== "invoiced";
  const kv = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="requests">My requests</button> › <span>${esc(r.number)}</span></nav>
    <div class="pt-ticket">
      <section class="pt-card"${sn("PT-11")}>
        <header class="tk-head"><div><span class="mono muted">${esc(r.number)}</span><h1 class="h2">${esc(r.title)}</h1></div>${reqChip(r)}</header>
        ${r.state === "awaiting_info" ? `<div class="pt-alert" role="status"><b>Accounts Receivable needs more information.</b> Reply below. Your reply sends the request back to AR.</div>` : ""}
        ${inv ? `<div class="pt-alert ok" role="status"${sn("PT-12")}><b>Invoice ${esc(inv.number)} issued</b> on ${esc(inv.date)} for SGD ${fmt(inv.amount)}, due ${esc(inv.due)}.</div>` : ""}
        ${r.state === "rejected" ? `<div class="pt-alert err" role="status"><b>This request was rejected.</b> See the reason below. Submit a new AR form if needed.</div>` : ""}
        ${open ? `<div class="composer"><label class="flabel" for="ptReply">Add a comment</label><textarea id="ptReply" rows="3" placeholder="Message to Accounts Receivable"></textarea><div class="row"><span class="hint">Accounts Receivable sees your comment on the case.</span><button type="button" class="btn primary small" data-preply="${r.id}">Send</button></div></div>` : ""}
        <ol class="feed">${feed.map(e => { const u = S.users.find(x => x.id === e.by); const ar = u?.team === "ar";
          return `<li class="fe k-${e.kind}${ar ? " from-ar" : ""}"><span class="avatar sm" aria-hidden="true">${esc(ar ? "AR" : initials(u?.name))}</span><div><div class="fe-h"><b>${esc(e.kind === "system" ? "Update" : ar ? `${u.name}, Accounts Receivable` : u?.name || "")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
      </section>
      <aside class="pt-card"${sn("PT-13")}>
        <h2>Details</h2>
        <dl class="kvlist">${kv("Customer", esc(custName(r.customerId)))}${kv("Contract", esc(ctrNo(r.contractId)))}${kv("Billing type", esc(r.billingType))}${kv("Amount", `<span class="mono">SGD ${fmt(r.amount)}</span>`)}
          ${r.periodStart || r.periodEnd ? kv("Service period", `${esc(r.periodStart || "?")} to ${esc(r.periodEnd || "?")}`) : ""}${r.poNumber ? kv("Customer PO", esc(r.poNumber)) : ""}${kv("Submitted", esc(r.opened))}</dl>
        ${r.details ? `<p class="small">${esc(r.details)}</p>` : ""}
        ${r.attachments?.length ? `<h3 class="small">Attachments</h3><ul class="attlist">${r.attachments.map(a => `<li>${icon("clip", 14)} ${esc(a)}</li>`).join("")}</ul>` : ""}
      </aside>
    </div>
  </div>`;
}
