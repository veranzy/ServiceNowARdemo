// Project team experience: Service Portal / Employee Center with the AR forms catalogue (AR-i … AR-xvi),
// AR-i New AR request (record producer), My requests list and the ticket page (conversation with AR).
import { ctrById, custById, rollup } from "../ledger.js";
import { DOC_LABEL, REQ_OPEN, REQ_TYPE, contactFor, docsOnFile, freqLabel, me, reqById, validateARi } from "../records.js";
import { AR_FORMS, DOC_TYPES, RECORD_PRODUCER, REQUEST_TYPES, ROLES, TABLES } from "../schema.js";
import { S } from "../state.js";
import { esc, fmt, nameSim } from "../util.js";
import { custName, ctrNo, fieldHtml, icon, initials, reqChip, reqCustName, sn } from "./common.js";

const P = () => S.ui.portal;
const myReqs = () => S.requests.filter(r => r.requestedBy === me().id).sort((a, b) => String(b.updated || b.opened).localeCompare(String(a.updated || a.opened)));

export function portalView() {
  const p = P(), u = me();
  const page = p.page === "forms" ? catalogPage() : p.page === "form" ? formPage() : p.page === "confirm" ? confirmPage() : p.page === "requests" ? requestsPage() : p.page === "ticket" ? ticketPage() : homePage();
  return `<div class="portal">
    <header class="pt-head"${sn("PT-01")}>
      <div class="pt-inner">
        <button type="button" class="pt-brand" data-pnav="home"><span class="pt-logo" aria-hidden="true">FS</span><span>Finance Services</span></button>
        <nav class="pt-nav" aria-label="Portal">
          <button type="button" data-pnav="home" aria-current="${p.page === "home"}">Home</button>
          <button type="button" data-pnav="forms" aria-current="${p.page === "forms" || p.page === "form"}">AR forms</button>
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
        <button type="button" class="pt-tile primary" data-pnav="forms"${sn("PT-03")}>${icon("doc", 26)}<b>AR forms</b><span>16 forms for Accounts Receivable. Start with AR-i New AR request for first, ad-hoc or recurring billing.</span></button>
        <button type="button" class="pt-tile" data-pnav="requests"${sn("PT-04")}>${icon("inbox", 26)}<b>My requests</b><span>${open.length} open · ${mine.length} in total</span></button>
      </div>
      <section class="pt-card">
        <header><h2>Recent requests</h2><button type="button" class="linkish small" data-pnav="requests">View all</button></header>
        ${mine.length ? `<ul class="mini">${mine.slice(0, 4).map(r => `<li><button type="button" class="mini-row" data-ticket="${r.id}"><span><b class="mono">${esc(r.number)}</b> ${esc(r.title)}<span class="desc">${esc(reqCustName(r))} · ${esc(r.form || "AR-i")} ${esc(REQ_TYPE[r.requestType] || "")} · SGD ${fmt(r.amount)}</span></span>${reqChip(r)}</button></li>`).join("")}</ul>` : `<p class="empty small">You haven't submitted any requests yet.</p>`}
      </section>
    </div>`;
}

export function contractBox(d) {
  const k = ctrById(d.contractId); if (!k) return "";
  const r = rollup(S.invoices.filter(i => i.contractId === k.id && i.state === "issued"));
  const pending = S.requests.filter(x => x.contractId === k.id && REQ_OPEN.includes(x.state)).reduce((s, x) => s + x.amount, 0);
  const left = (k.value || 0) - r.billed - pending;
  return `<div class="pt-info ctr-box"${sn("PT-07")}>
    <b>${esc(k.number)} · ${esc(k.title)}</b>
    <dl><div><dt>Contract value</dt><dd class="mono">${fmt(k.value || 0)}</dd></div><div><dt>Invoiced so far</dt><dd class="mono">${fmt(r.billed)}</dd></div>
      <div><dt>Requested, not yet invoiced</dt><dd class="mono">${fmt(pending)}</dd></div><div><dt>Remaining to bill</dt><dd class="mono${left < 0 ? " bad" : ""}">${fmt(left)}</dd></div>
      <div><dt>Billing</dt><dd>${esc(k.billing)} · Net ${esc(k.terms)}</dd></div></dl>
    ${d.amount && left - d.amount < 0 && k.value ? `<p class="bad small">This request takes billing over the contract value by SGD ${fmt(d.amount - left)}. AR may ask for a change order.</p>` : ""}
  </div>`;
}

function catalogPage() {
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <span>AR forms</span></nav>
    <section${sn("PT-14")}>
      <h1 class="pt-h1">AR forms</h1>
      <p class="pt-lead">Choose the form for what you need from Accounts Receivable. Each form creates a case for the AR team.</p>
      <div class="pt-forms">${AR_FORMS.map(f => f.active
        ? `<button type="button" class="pt-form-tile on" data-pnav="form"${sn("PT-15")}><span class="ft-code">${esc(f.code)}</span><b>${esc(f.name)}</b><span>${esc(f.desc)}</span></button>`
        : `<div class="pt-form-tile off" aria-disabled="true"${sn("PT-16")}><span class="ft-code">${esc(f.code)}</span><b>${esc(f.name)}</b><span>${esc(f.desc)}</span></div>`).join("")}</div>
    </section>
  </div>`;
}

const reqField = k => TABLES.requests.fields.find(f => f.key === k);

function docRow(t, d, onFile) {
  const key = { contract: "docContract", acra: "docAcra", billing_form: "docBillingForm" }[t];
  const f = reqField(key), err = P().errors?.[key], have = onFile[t];
  const elsewhere = t === "contract" && d.contractLocation && d.contractLocation !== "attached";
  let status, ctl = "";
  if (have) status = `<span class="chip c-ok">On file</span> <span class="desc">${esc(have.fileName)} · received ${esc(have.received)}</span>`;
  else if (d[key]) status = `<span class="chip c-accent">Attached</span> <span class="desc">${esc(d[key])}</span>`;
  else if (elsewhere) status = `<span class="chip c-neutral">Not needed</span> <span class="desc">Kept elsewhere (see contract location)</span>`;
  else status = `<span class="chip c-warn">Needed</span>`;
  if (!have && !elsewhere) ctl = `<label class="btn small" for="pfDoc-${key}">${icon("clip", 14)} ${d[key] ? "Replace" : "Attach"}</label><input type="file" id="pfDoc-${key}" name="${key}" hidden>${d[key] ? ` <button type="button" class="linkish small" data-undoc="${key}">Remove</button>` : ""}`;
  return `<div class="docrow${err ? " has-err" : ""}"${sn(`REQ.${f.name}`)}><div><b>${esc(DOC_LABEL[t])}</b>${t === "billing_form" && d.department ? `<span class="desc">for ${esc(d.department)}</span>` : ""}<div>${status}</div>${err ? `<span class="ferr">${esc(err)}</span>` : ""}</div><div class="docctl">${ctl}</div></div>`;
}

function formPage() {
  const p = P();
  if (!p.draft) p.draft = { form: "AR-i", requestType: "", department: me().department || "", newCustomer: false, attachments: [] };
  const d = p.draft, e = p.errors || {};
  const f = (k, o = {}) => fieldHtml("requests", reqField(k), d, { prefix: "pf", errors: e, vals: d, ...o });
  const rec = d.requestType === "recurring";
  const contact = !d.newCustomer && d.customerId && d.department ? contactFor(d.customerId, d.department) : null;
  const needBillTo = d.newCustomer || !contact || d.updateBillTo;
  const onFile = d.newCustomer ? {} : docsOnFile(d.customerId, d.contractId, d.department);
  const nErr = Object.keys(e).length;
  const typeCards = REQUEST_TYPES.map(([k, l]) => `<label class="tcard${d.requestType === k ? " on" : ""}" for="pf-requestType-${k}"><input type="radio" id="pf-requestType-${k}" name="requestType" value="${k}"${d.requestType === k ? " checked" : ""}>
    <b>${esc(l)}</b><span>${{ first: "First billing for a new customer or a new contract. Customer documents are needed if AR doesn't have them yet.", adhoc: "One-off billing for an existing customer, e.g. a milestone or extra work.", recurring: "Billing that repeats, e.g. a monthly fee. Submit once; AR raises each invoice from a billing schedule." }[k]}</span></label>`).join("");
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="forms">AR forms</button> › <span>AR-i</span></nav>
    <div class="pt-item">
      <form class="pt-form pt-card" id="arForm" novalidate${sn("PT-05")}>
        <div><span class="ft-code">AR-i</span><h1>New AR request</h1></div>
        <p class="pt-lead">Ask Accounts Receivable to bill a customer: the first billing, an ad-hoc billing, or a recurring billing. Customer documents are kept by AR, so you only send what they don't have yet.</p>
        <div id="pfAlert">${formAlert(nErr)}</div>

        <fieldset class="psec"${sn("PT-17")}><legend>1. Request type</legend>
          <div class="tcards${e.requestType ? " has-err" : ""}" role="radiogroup" aria-label="Request type"${sn("REQ.request_type")}>${typeCards}</div>${e.requestType ? `<span class="ferr">${esc(e.requestType)}</span>` : ""}
        </fieldset>

        <fieldset class="psec"${sn("PT-18")}><legend>2. Customer</legend>
          <div class="fgrid">
            <label class="ffield"${sn("PT-06")}><span class="flabel">Requested by</span><div class="fro">${esc(me().name)}</div></label>
            ${f("newCustomer", { help: "Tick if AR has never billed this customer before." })}
            ${d.newCustomer ? `${f("newCustName", { mandatory: true, help: null })}${f("newCustUen")}${f("newCustAddress")}` : f("customerId", { mandatory: true, help: null })}
          </div>
          ${similarHint(d)}
        </fieldset>

        <fieldset class="psec"${sn("PT-19")}><legend>3. Department and bill-to person</legend>
          <div class="fgrid">${f("department")}<div></div></div>
          ${contact && !d.updateBillTo ? `<div class="pt-info"><b>Invoices from ${esc(d.department)} to this customer go to</b><p class="small">${esc(contact.name)} · ${esc(contact.email)}${contact.phone ? ` · ${esc(contact.phone)}` : ""}<br>${esc(contact.address)}</p></div>` : ""}
          ${contact ? `<div class="fgrid">${f("updateBillTo", { label: `Change the ${d.department} bill-to person for this customer` })}</div>` : d.department && (d.customerId || d.newCustomer) ? `<p class="pt-hint">${d.newCustomer ? "New customer" : "AR has no billing contact for " + esc(d.department) + " at this customer yet"}: tell us who to bill.</p>` : ""}
          ${needBillTo ? `<div class="fgrid">${f("billToName", { mandatory: true, help: null })}${f("billToEmail", { mandatory: true })}${f("billToPhone")}${f("billToAddress")}</div>` : ""}
        </fieldset>

        <fieldset class="psec"${sn("PT-20")}><legend>4. Contract</legend>
          <div class="fgrid">${d.newCustomer ? "" : f("contractId", { help: "Optional for ad-hoc work." })}${f("contractLocation")}
            ${["repository", "physical"].includes(d.contractLocation) ? f("contractLocationRef", { mandatory: true, label: d.contractLocation === "repository" ? "Link to the contract" : "Where the physical file is", help: null }) : ""}</div>
          ${contractBox(d)}
        </fieldset>

        <fieldset class="psec"${sn(rec ? "PT-22" : "PT-21")}><legend>5. ${rec ? "Recurring billing" : "Billing"}</legend>
          <div class="fgrid">
            ${rec ? "" : f("billingType")}
            ${f("amount", { label: rec ? "Amount per billing period" : "Amount", help: null })}
            ${f("title", { label: rec ? "What is billed each period" : "What should be invoiced" })}
            ${rec ? `${f("frequency", { mandatory: true, help: null })}${f("firstBillDate", { mandatory: true, help: null })}${f("lastBillDate", { help: "Leave blank to bill until the contract ends." })}`
              : `${f("invoiceDate")}${f("periodStart")}${f("periodEnd")}`}
            ${f("poNumber")}
          </div>
          ${recurringHint(d)}
        </fieldset>

        <fieldset class="psec"${sn("PT-23")}><legend>6. Customer documents</legend>
          <p class="pt-hint">${d.newCustomer ? "New customer: AR needs all three documents." : d.customerId ? "Documents AR already holds for this customer are marked On file." : "Choose the customer to see which documents AR already holds."}</p>
          <div class="docs">${DOC_TYPES.map(([t]) => docRow(t, d, onFile)).join("")}</div>
          <div class="ffield wide"${sn("PT-08")}><span class="flabel">Other supporting documents</span>
            <div><label class="btn small" for="pfAttach">${icon("clip", 15)} Add attachment</label><input type="file" id="pfAttach" multiple hidden></div>
            ${d.attachments?.length ? `<ul class="attlist">${d.attachments.map((a, ix) => `<li>${esc(a)} <button type="button" class="linkish small" data-unattach="${ix}">Remove</button></li>`).join("")}</ul>` : `<span class="fhelp">For example the customer's acceptance email or timesheet.</span>`}
          </div>
          <div class="fgrid">${f("details")}</div>
        </fieldset>
      </form>
      <aside class="pt-side" id="pfSide">${formSide(d)}</aside>
    </div>
  </div>`;
}

export function similarHint(d) {
  const similar = d.newCustomer && d.newCustName?.length > 3 ? S.customers.filter(c => nameSim(d.newCustName, c.name) >= .5).slice(0, 3) : [];
  return `<div id="pfSimilar">${similar.length ? `<p class="pt-hint">Similar existing customers: ${similar.map(c => `<b>${esc(c.name)}</b>`).join(", ")}. If it's one of these, untick New customer and choose it.</p>` : ""}</div>`;
}
export function recurringHint(d) {
  const ok = d.requestType === "recurring" && d.frequency && d.amount > 0 && d.firstBillDate;
  return `<div id="pfRecHint">${ok ? `<p class="pt-hint">AR will set up a billing schedule: ${esc(freqLabel(d.frequency).toLowerCase())} invoices of SGD ${fmt(d.amount)} from ${esc(d.firstBillDate)}${d.lastBillDate ? ` to ${esc(d.lastBillDate)}` : " until the contract ends"}. You don't need to submit another form for these.</p>` : ""}</div>`;
}

export const formAlert = n => n ? `<div class="pt-alert err" role="alert">Please fix ${n} field${n === 1 ? "" : "s"} below.</div>` : "";

export function formSide(d) {
  const missing = Object.keys(validateARi(d)).map(k => reqField(k)?.label).filter(Boolean);
  return `<div class="pt-card sticky">
    <span class="ft-code">AR-i</span>
    <h2>Submit request</h2>
    <p class="small muted">Goes to the Accounts Receivable team as a case. You'll get updates on My requests.</p>
    ${missing.length ? `<p class="small"><b>Still needed</b><br>${[...new Set(missing)].map(esc).join(", ")}</p>` : `<p class="small ok-t">All required information provided.</p>`}
    <button type="submit" form="arForm" class="btn primary block"${sn("PT-09")}>Submit</button>
  </div>`;
}

function confirmPage() {
  const r = reqById(P().id); if (!r) return homePage();
  return `<div class="pt-inner pt-body"><section class="pt-card pt-done" role="status">
    <h1>Request submitted</h1>
    <p>Your ${esc(r.form)} (${esc(REQ_TYPE[r.requestType])}) <b class="mono">${esc(r.number)}</b> for <b>SGD ${fmt(r.amount)}</b>${r.requestType === "recurring" ? ` ${esc(freqLabel(r.frequency).toLowerCase())}` : ""} to ${esc(reqCustName(r))} has been sent to Accounts Receivable.</p>
    ${r.requestType === "recurring" ? `<p class="small">AR will set up a billing schedule and raise each invoice. You don't need to submit this form again for this billing.</p>` : ""}
    <p class="muted small">Automation after submission (assignment, notifications, approvals) is still to be defined and will be added here.</p>
    <div class="row"><button type="button" class="btn primary" data-ticket="${r.id}">View request</button><button type="button" class="btn" data-pnav="forms">Back to AR forms</button></div>
  </section></div>`;
}

function requestsPage() {
  const rows = myReqs();
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <span>My requests</span></nav>
    <section class="pt-card"${sn("PT-10")}>
      <header><h1 class="h2">My requests</h1><button type="button" class="btn primary small" data-pnav="forms">AR forms</button></header>
      ${rows.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Number</th><th>Form</th><th>What should be invoiced</th><th>Customer</th><th class="num">Amount</th><th>State</th><th>Updated</th></tr></thead><tbody>
        ${rows.map(r => `<tr data-ticket="${r.id}" tabindex="0"><td><button type="button" class="linkish mono" data-ticket="${r.id}">${esc(r.number)}</button></td><td>${esc(r.form || "AR-i")}<span class="desc">${esc(REQ_TYPE[r.requestType] || "")}</span></td><td class="wrap">${esc(r.title)}</td><td>${esc(reqCustName(r))}</td><td class="num">${fmt(r.amount)}</td><td>${reqChip(r)}</td><td>${esc(r.updated || r.opened)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">No requests yet. Use AR-i to ask Accounts Receivable to bill a customer.</p>`}
    </section>
  </div>`;
}

function ticketPage() {
  const r = reqById(P().id); if (!r || r.requestedBy !== me().id) return requestsPage();
  const inv = S.invoices.find(i => i.id === r.invoiceId && i.state === "issued");
  const feed = r.activity.filter(e => e.kind !== "work_note").slice().reverse();
  const open = r.state !== "rejected" && r.state !== "invoiced" && r.state !== "scheduled";
  const sch = r.scheduleId ? S.schedules.find(x => x.id === r.scheduleId) : null;
  const kv = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="requests">My requests</button> › <span>${esc(r.number)}</span></nav>
    <div class="pt-ticket">
      <section class="pt-card"${sn("PT-11")}>
        <header class="tk-head"><div><span class="mono muted">${esc(r.number)}</span><h1 class="h2">${esc(r.title)}</h1></div>${reqChip(r)}</header>
        ${r.state === "awaiting_info" ? `<div class="pt-alert" role="status"><b>Accounts Receivable needs more information.</b> Reply below. Your reply sends the request back to AR.</div>` : ""}
        ${inv ? `<div class="pt-alert ok" role="status"${sn("PT-12")}><b>Invoice ${esc(inv.number)} issued</b> on ${esc(inv.date)} for SGD ${fmt(inv.amount)}, due ${esc(inv.due)}.</div>` : ""}
        ${sch ? `<div class="pt-alert ok" role="status"${sn("PT-24")}><b>Recurring billing set up (${esc(sch.number)})</b>: ${esc(freqLabel(sch.frequency).toLowerCase())} SGD ${fmt(sch.amount)} from ${esc(sch.firstDate)}. AR raises each invoice; no further forms needed.</div>` : ""}
        ${r.state === "rejected" ? `<div class="pt-alert err" role="status"><b>This request was rejected.</b> See the reason below. Submit a new AR form if needed.</div>` : ""}
        ${open ? `<div class="composer"><label class="flabel" for="ptReply">Add a comment</label><textarea id="ptReply" rows="3" placeholder="Message to Accounts Receivable"></textarea><div class="row"><span class="hint">Accounts Receivable sees your comment on the case.</span><button type="button" class="btn primary small" data-preply="${r.id}">Send</button></div></div>` : ""}
        <ol class="feed">${feed.map(e => { const u = S.users.find(x => x.id === e.by); const ar = u?.team === "ar";
          return `<li class="fe k-${e.kind}${ar ? " from-ar" : ""}"><span class="avatar sm" aria-hidden="true">${esc(ar ? "AR" : initials(u?.name))}</span><div><div class="fe-h"><b>${esc(e.kind === "system" ? "Update" : ar ? `${u.name}, Accounts Receivable` : u?.name || "")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
      </section>
      <aside class="pt-card"${sn("PT-13")}>
        <h2>Details</h2>
        <dl class="kvlist">${kv("Form", `${esc(r.form || "AR-i")} · ${esc(REQ_TYPE[r.requestType] || "")}`)}${kv("Customer", esc(reqCustName(r)))}${kv("Department", esc(r.department || "—"))}${kv("Contract", esc(ctrNo(r.contractId)))}
          ${r.requestType === "recurring" ? kv("Billing", `${esc(freqLabel(r.frequency))} from ${esc(r.firstBillDate || "?")}${r.lastBillDate ? ` to ${esc(r.lastBillDate)}` : ""}`) : kv("Billing type", esc(r.billingType || "—"))}${kv(r.requestType === "recurring" ? "Amount per period" : "Amount", `<span class="mono">SGD ${fmt(r.amount)}</span>`)}
          ${r.periodStart || r.periodEnd ? kv("Service period", `${esc(r.periodStart || "?")} to ${esc(r.periodEnd || "?")}`) : ""}${r.poNumber ? kv("Customer PO", esc(r.poNumber)) : ""}${kv("Submitted", esc(r.opened))}</dl>
        ${r.details ? `<p class="small">${esc(r.details)}</p>` : ""}
        ${(() => { const docs = [["docContract", "Contract / PO"], ["docAcra", "ACRA"], ["docBillingForm", "Billing form"]].filter(([k]) => r[k]).map(([k, l]) => `${l}: ${r[k]}`).concat(r.attachments || []);
          return docs.length ? `<h3 class="small">Attachments</h3><ul class="attlist">${docs.map(a => `<li>${icon("clip", 14)} ${esc(a)}</li>`).join("")}</ul>` : ""; })()}
      </aside>
    </div>
  </div>`;
}
