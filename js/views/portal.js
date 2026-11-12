// Project team experience: Service Portal / Employee Center with the AR forms catalogue (AR-i … AR-xvi),
// AR-i New AR request (record producer), My requests list and the ticket page (conversation with AR).
import { ctrById, custById, rollup } from "../ledger.js";
import { DOC_LABEL, GIRO_PURPOSE, LINE_TYPE, REQ_OPEN, activeGiroCase, billingMode, canViewReq, draftLine, draftPro, itemCalc, reqItems, giroOnContractOf, ccEmails, contactFor, giroLabel, ctrLabel, docsOnFile, freqLabel, isShell, lineStatus, lineValue, linesLabel, linesSummary, me, needBillTo, periodDates, reqById, reqLines, shellFor, targetContract, validateARi } from "../records.js";
import { AR_FORMS, CONTRACT_OPTIONS, DOC_TYPES, GST_RATE, ROLES, TABLES, fieldVisible } from "../schema.js";
import { S } from "../state.js";
import { esc, fmt, nameSim } from "../util.js";
import { custName, ctrNo, fieldHtml, icon, initials, reqChip, reqCustName, sn } from "./common.js";

const P = () => S.ui.portal;
const myReqs = () => S.requests.filter(r => canViewReq(r)).sort((a, b) => String(b.updated || b.opened).localeCompare(String(a.updated || a.opened)));

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
        ${mine.length ? `<ul class="mini">${mine.slice(0, 4).map(r => `<li><button type="button" class="mini-row" data-ticket="${r.id}"><span><b class="mono">${esc(r.number)}</b> ${esc(r.title)}<span class="desc">${esc(reqCustName(r))} · ${esc(r.form || "AR-i")} · ${esc(linesLabel(r))} · SGD ${fmt(r.amount)}</span></span>${reqChip(r)}</button></li>`).join("")}</ul>` : `<p class="empty small">You haven't submitted any requests yet.</p>`}
      </section>
    </div>`;
}

export function contractBox(d) {
  const k = ctrById(d.contractId); if (!k || isShell(k)) return "";
  const r = rollup(S.invoices.filter(i => i.contractId === k.id && i.state === "issued"));
  const pending = S.requests.filter(x => x.contractId === k.id && REQ_OPEN.includes(x.state)).reduce((s, x) => s + x.amount, 0);
  const left = (k.value || 0) - r.billed - pending;
  return `<div class="pt-info ctr-box"${sn("PT-07")}>
    <b>${esc(k.number)} · ${esc(k.title)}</b>
    <dl><div><dt>Contract value</dt><dd class="mono">${fmt(k.value || 0)}</dd></div><div><dt>Invoiced so far</dt><dd class="mono">${fmt(r.billed)}</dd></div>
      <div><dt>Requested, not yet invoiced</dt><dd class="mono">${fmt(pending)}</dd></div><div><dt>Remaining to bill</dt><dd class="mono${left < 0 ? " bad" : ""}">${fmt(left)}</dd></div>
      <div><dt>Billing</dt><dd>${esc(k.billing)} · Net ${esc(k.terms)}</dd></div></dl>
    ${(() => { const amt = d.id ? d.amount || 0 : lineValue(draftLine(d), draftPro(d)); return amt && left - amt < 0 && k.value ? `<p class="bad small">This request takes billing over the contract value by SGD ${fmt(amt - left)}. AR may ask for a change order.</p>` : ""; })()}
  </div>`;
}

function catalogPage() {
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <span>AR forms</span></nav>
    <section${sn("PT-14")}>
      <h1 class="pt-h1">AR forms</h1>
      <p class="pt-lead">Choose the form for what you need from Accounts Receivable. Each form creates a case for the AR team.</p>
      <div class="pt-forms">${AR_FORMS.map(f => f.active
        ? `<button type="button" class="pt-form-tile on" data-pnav="form" data-form="${f.code}"${sn("PT-15")}><span class="ft-code">${esc(f.code)}</span><b>${esc(f.name)}</b><span>${esc(f.desc)}</span></button>`
        : `<div class="pt-form-tile off" aria-disabled="true"${sn("PT-16")}><span class="ft-code">${esc(f.code)}</span><b>${esc(f.name)}</b><span>${esc(f.desc)}</span></div>`).join("")}</div>
    </section>
  </div>`;
}

const reqField = k => TABLES.requests.fields.find(f => f.key === k);
/** Finance coding variables (request level, all optional). */
export const FIN_KEYS = ["costCenter", "agentName", "agencyType", "vag", "subBu", "typeOfBilling", "docBulk"];
/** AR-i customer details (D23), in form order after name / UEN / address. */
const CUST_KEYS = ["agencyType", "vag", "subBu", "pocName", "pocEmail"];
/** Finance coding fields that sit in Invoice details. */
const INV_KEYS = ["costCenter", "agentName"];
const finText = r => FIN_KEYS.filter(k => (Array.isArray(r[k]) ? r[k].length : r[k]) && fieldVisible("requests", reqField(k), r)).map(k => { const fl = reqField(k); return `${fl.label}: ${Array.isArray(r[k]) ? `${r[k].length} file(s)` : (fl.choices?.find(c => c[0] === r[k]) || [, r[k]])[1]}`; }).join(" · ");

function docRow(t, d, onFile) {
  const key = { contract: "docContract", acra: "docAcra", billing_form: "docBillingForm" }[t];
  const f = reqField(key), err = P().errors?.[key], have = t === "contract" && d.contractOption !== "existing" ? null : onFile[t];
  // Signed contract / PO: only offered (optional) for a new contract; an existing one shows On file or Not needed
  const elsewhere = t === "contract" && d.contractOption !== "new";
  let status, ctl = "";
  if (have) status = `<span class="chip c-ok">On file</span> <span class="desc">${esc(have.fileName)} · received ${esc(have.received)}</span>`;
  else if (d[key]) status = `<span class="chip c-accent">Attached</span> <span class="desc">${esc(d[key])}</span>`;
  else if (elsewhere) status = `<span class="chip c-neutral">Not needed</span> <span class="desc">${d.contractOption === "none" ? "No contract required" : !d.contractOption ? "Choose the contract first" : "Not on file for this contract"}</span>`;
  else status = t === "contract" ? `<span class="chip c-neutral">Optional</span> <span class="desc">Attach the signed contract / PO if you have it</span>` : `<span class="chip c-warn">Needed</span>`;
  if (!have && !elsewhere) ctl = `<label class="btn small" for="pfDoc-${key}">${icon("clip", 14)} ${d[key] ? "Replace" : "Attach"}</label><input type="file" id="pfDoc-${key}" name="${key}" hidden>${d[key] ? ` <button type="button" class="linkish small" data-undoc="${key}">Remove</button>` : ""}`;
  return `<div class="docrow${err ? " has-err" : ""}"${sn(`REQ.${f.name}`)}><div><b>${esc(DOC_LABEL[t])}</b>${t === "billing_form" && d.department ? `<span class="desc">for ${esc(d.department)}</span>` : ""}<div>${status}</div>${err ? `<span class="ferr">${esc(err)}</span>` : ""}</div><div class="docctl">${ctl}</div></div>`;
}


/** Customer step (D14): search AR's customers; pick one, or add as new when not found. */
export function custResults(d) {
  const q = String(d.custQ || "").trim().toLowerCase();
  if (!q) return `<div id="pfCustResults"><p class="pt-hint">Start typing the company name or UEN. If AR doesn't have the customer yet, you can add it as a new customer.</p></div>`;
  const hits = S.customers.map(c => ({ c, sc: Math.max(nameSim(q, c.name), c.name.toLowerCase().includes(q) ? 1 : 0, (c.uen || "").toLowerCase().includes(q) ? 1 : 0, ...(c.aliases || []).map(a => a.toLowerCase().includes(q) ? .8 : 0)) }))
    .filter(x => x.sc >= .5).sort((a, b) => b.sc - a.sc).slice(0, 6);
  return `<div id="pfCustResults">
    ${hits.length ? `<ul class="custhits" aria-label="Matching customers">${hits.map(({ c }) => `<li><button type="button" class="custhit" data-pickcust="${c.id}"><b>${esc(c.name)}</b><span class="desc">${esc(c.uen ? `UEN ${c.uen}` : "")}${c.parent ? ` · ${esc(c.parent)}` : ""}</span></button></li>`).join("")}</ul>` : `<p class="pt-hint">No customer at AR matches "${esc(d.custQ)}".</p>`}
    <button type="button" class="btn small" data-newcust${sn("UA-PT-newcust")}>+ Add "${esc(d.custQ)}" as a new customer</button>
  </div>`;
}

function customerStep(d, e, f, o = {}) {
  const show = k => fieldVisible("requests", reqField(k), d);
  if (d.customerId && !d.newCustomer) {
    const c = custById(d.customerId);
    if (!o.details) return `<div class="custpick"><div><span class="desc">Customer</span><b>${esc(c?.name)}</b><span class="desc">${esc(c?.uen ? `UEN ${c.uen}` : "")}</span></div><button type="button" class="linkish small" data-custclear>Change</button></div>`;
    // AR-i: every customer field read-only, from the customer master (D22, D23)
    const ro = (id, label, v) => `<div class="ffield${id === "CUS.registered_address" ? " wide" : ""}"${sn(id)}><span class="flabel">${esc(label)}</span><div class="fro">${v ? esc(v) : `<span class="muted">Not on file</span>`}</div></div>`;
    const lab = k => { const fl = reqField(k); return fl.choices ? (fl.choices.find(x => x[0] === d[k]) || [, d[k]])[1] : d[k]; };
    return `<div class="custpick"><div><span class="chip c-ok">Found</span> <span class="desc">Customer details come from AR's customer record and can't be changed here.</span></div><button type="button" class="linkish small" data-custclear>Change customer</button></div>
      <div class="fgrid custro"${sn("PT-39")}>${ro("CUS.company.name", "Customer name", c?.name)}${ro("CUS.uen", "Customer UEN", c?.uen)}${ro("CUS.registered_address", "Address", c?.address)}
        ${CUST_KEYS.filter(show).map(k => ro(`REQ.${reqField(k).name}`, reqField(k).label, lab(k))).join("")}</div>`;
  }
  if (d.newCustomer) return `<div class="custpick new"><div><span class="chip c-warn">New customer</span> <span class="desc">${esc(o.newLabel || "AR will verify and create it. This makes it a first request.")}</span></div><button type="button" class="linkish small" data-custclear>Search existing customers instead</button></div>
    <div class="fgrid">${f("newCustName", { mandatory: true, help: null, label: o.details ? "Customer name" : undefined })}${o.newFields === false ? "" : `${f("newCustUen", { label: "Customer UEN" })}${f("newCustAddress", { label: "Address" })}`}
      ${o.details ? CUST_KEYS.filter(show).map(k => f(k, { help: k === "subBu" ? "Free text" : k === "pocEmail" ? "Optional" : null })).join("") : ""}</div>`;
  return `<label class="ffield wide${e.customerId ? " has-err" : ""}" for="pfCustQ"${sn("REQ.customer")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Find the customer</span>
      <input type="search" id="pfCustQ" value="${esc(d.custQ || "")}" placeholder="Company name or UEN" autocomplete="off"${e.customerId ? ` aria-invalid="true"` : ""}>${e.customerId ? `<span class="ferr">${esc(e.customerId)}</span>` : ""}</label>
    ${custResults(d)}`;
}

/** Contract step (D15, D16): existing contract, new contract, or No contract required (the customer's no-contract shell). Bill-to sits under it. */
function contractStep(d, e, f) {
  const opts = CONTRACT_OPTIONS.filter(([k]) => k !== "existing" || (!d.newCustomer && S.contracts.some(c => c.customerId === d.customerId && !isShell(c))));
  const ctrs = d.customerId && !d.newCustomer ? S.contracts.filter(k => k.customerId === d.customerId && !isShell(k)) : [];
  const tgt = targetContract(d), shell = d.contractOption === "none" && d.customerId && !d.newCustomer ? shellFor(d.customerId, d.department) : null;
  const optErr = e.contractOption;
  let body = "";
  if (d.contractOption === "existing") body = `<div class="fgrid"><label class="ffield wide${e.contractId ? " has-err" : ""}" for="pf-contractId"${sn("REQ.contract")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Contract</span>
      <select id="pf-contractId" name="contractId"${e.contractId ? ` aria-invalid="true"` : ""}><option value="">-- Choose the contract --</option>${ctrs.map(k => `<option value="${k.id}"${k.id === d.contractId ? " selected" : ""}>${esc(k.number)} · ${esc(k.title)}${k.department ? ` (${esc(k.department)})` : ""}</option>`).join("")}</select>
      ${e.contractId ? `<span class="ferr">${esc(e.contractId)}</span>` : ""}</label></div>
      ${d.contractId ? `<p class="pt-hint">Contract details come from AR's contract record and can't be changed here.</p>${contractRo(ctrById(d.contractId))}` : ""}${contractBox(d)}`;
  else if (d.contractOption === "new") {
    const show = k => fieldVisible("requests", reqField(k), d);
    const fl = (k, o = {}) => show(k) ? f(k, { help: null, ...o }) : "";
    body = `<p class="pt-hint">AR creates the contract under ${esc(d.newCustomer ? d.newCustName || "the new customer" : custName(d.customerId))} from these details when it links the request.</p>
      <div class="fgrid"${sn("PT-40")}>${fl("newCtrType", { mandatory: true })}${fl("newCtrNumber", { mandatory: true })}${fl("newCtrRef")}${fl("newCtrPo")}${fl("newCtrTitle", { mandatory: true })}
        ${fl("newCtrStart", { mandatory: true })}${fl("newCtrEnd")}${fl("newCtrValue", { mandatory: true })}
        ${f("billToName", { mandatory: true, help: d.billToPrefilled ? `Prefilled from the ${d.department} department's usual bill-to person` : null, label: "Contract bill-to person" })}${f("billToEmail", { mandatory: true, label: "Contract bill-to email" })}${f("billToPhone", { label: "Contract bill-to phone number" })}
        ${fl("newCtrCycle")}${fl("newCtrCycleOther", { mandatory: true })}${fl("newCtrInvDate")}${fl("newCtrTerms")}${fl("newCtrTermsOther", { mandatory: true })}
        ${fl("newCtrProrate")}${fl("newCtrProFirst", { mandatory: true })}${fl("newCtrProLast", { mandatory: true })}
        ${f("typeOfBilling", { help: null })}</div>
      ${["C", "D", "E"].includes(d.typeOfBilling) ? `<div class="ffield wide"${sn("REQ.bulk_supporting_docs")}><span class="flabel">Supporting documents (bulk upload)</span>
        <div><label class="btn small" for="pfBulk">${icon("clip", 15)} Upload files</label><input type="file" id="pfBulk" multiple hidden></div>
        ${d.docBulk?.length ? `<ul class="attlist">${d.docBulk.map((a, ix) => `<li>${esc(a)} <button type="button" class="linkish small" data-unbulk="${ix}">Remove</button></li>`).join("")}</ul>` : ""}</div>` : ""}`;
  }
  else if (d.contractOption === "none") body = `<div class="pt-info"${sn("PT-28")}><b>No contract required</b><p class="small">AR files this billing under ${shell ? `the customer's no-contract shell <b class="mono">${esc(shell.number)}</b>` : `a new no-contract shell for ${esc(d.department || "your department")}`}, so the customer › contract › billing lines › invoices hierarchy stays complete.</p></div>`;
  const bt = d.contractOption !== "none" ? "" : `<div class="pbill"${sn("PT-19")}><h3 class="small">Bill-to person${tgt ? ` on ${esc(tgt.number)}` : " for the no-contract shell"}</h3>
      ${tgt?.billToName ? `<div class="pt-info"><b>Invoices under this shell go to</b><p class="small">${esc(tgt.billToName)} · ${esc(tgt.billToEmail)}${tgt.billToPhone ? ` · ${esc(tgt.billToPhone)}` : ""}</p></div>`
        : `<p class="pt-hint">${d.billToPrefilled ? `Prefilled from the ${esc(d.department)} department's usual bill-to person.` : "Tell AR who to bill."}</p><div class="fgrid">${f("billToName", { mandatory: true, help: null })}${f("billToEmail", { mandatory: true })}${f("billToPhone")}</div>`}</div>`;
  return `<div class="ffield wide${optErr ? " has-err" : ""}"${sn("REQ.contract_option")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Which contract does this bill under?</span>
      <div class="optcards" role="group" aria-label="Contract">${opts.map(([k, l]) => `<button type="button" class="optcard" data-ctropt="${k}" aria-pressed="${d.contractOption === k}">${esc(l)}<span>${k === "existing" ? `${ctrs.length} on file` : k === "new" ? "AR creates it" : "Ad-hoc billing"}</span></button>`).join("")}</div>
      ${optErr ? `<span class="ferr">${esc(optErr)}</span>` : ""}</div>
    ${body}${bt}${d.contractOption ? giroSub(d) : ""}`;
}

/** Existing contract: every contract detail read-only, in the owner's order (D22). */
function contractRo(k) {
  const F = key => TABLES.contracts.fields.find(x => x.key === key);
  const val = key => { const f = F(key), v = k[key]; if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "";
    return f.type === "Currency" ? `SGD ${fmt(v)}` : f.choices ? (f.choices.find(c => c[0] === v) || [, v])[1] : Array.isArray(v) ? `${v.length} file(s): ${v.join(", ")}` : v; };
  const vis = key => fieldVisible("contracts", F(key), k);
  const ro = (key, label) => vis(key) ? `<div class="ffield${["title", "bulkDocs"].includes(key) ? " wide" : ""}"${sn(`CON.${F(key).name}`)}><span class="flabel">${esc(label || F(key).label)}</span><div class="fro">${val(key) ? esc(val(key)) : `<span class="muted">Not on file</span>`}</div></div>` : "";
  return `<div class="fgrid custro"${sn("PT-41")}>${ro("category")}${ro("number", "Contract number")}${ro("reference")}${ro("poNumber")}${ro("title", "Contract title")}${ro("start", "Contract start date")}${ro("end", "Contract end date")}${ro("value", "Contract value (SGD)")}
    ${ro("billToName", "Contract bill-to person")}${ro("billToEmail", "Contract bill-to email")}${ro("billToPhone", "Contract bill-to phone number")}${ro("billingCycle")}${ro("billingCycleOther")}${ro("invoiceDate")}${ro("paymentTerms")}${ro("paymentTermsOther")}
    ${ro("prorate")}${ro("prorateFirst")}${ro("prorateLast")}${ro("typeOfBilling")}${ro("bulkDocs")}</div>`;
}

/** AR-i Invoice details summary (AR-i decision 31): what AR will bill from the contract type and the amount per period. */
export function invSum(d) {
  const bm = billingMode(d), l = draftLine(d), pro = draftPro(d);
  let txt;
  if (!d.contractOption) txt = "Choose the contract first: a recurring contract is billed every period, anything else as one invoice.";
  else if (!bm.recurring) txt = `${bm.category ? "" : "The contract type isn't on file, so "}${bm.category ? "One invoice" : "this is billed as one invoice"}${d.perPeriod > 0 ? ` of SGD ${fmt(d.perPeriod)} (before GST)` : ""}${d.invoiceTiming === "expedited" ? ", <b>expedited</b>" : d.invoiceTiming === "per_cycle" ? ", raised per the billing cycle" : ""}.`;
  else {
    // AR-i decision 38: no invoice date on the form for a recurring contract; AR sets the schedule up in the workspace
    const pr = pro && (pro.firstAmount || pro.lastAmount);
    txt = !l.endDate ? "Recurring contract: the invoices run until the contract end date, which isn't set yet."
      : `Recurring contract: monthly invoices${d.perPeriod > 0 ? ` of SGD ${fmt(d.perPeriod)} (before GST)` : ""} until the contract ends on ${esc(l.endDate)}${pr ? `, first and last month per the contract proration` : ""}. Submit once; AR sets up the billing schedule and raises each invoice.`;
  }
  return `<p class="lsum" id="pfInvSum">${txt}</p>`;
}
const itemField = k => TABLES.items.fields.find(f => f.key === k);
/** Billing line items (multi-row variable set, AR-i decision 32). GST and total are calculated. */
function itemsTable(d, e) {
  const items = d.items || [];
  const inp = (i, k, it) => { const f = itemField(k), err = e[`item:${i}:${k}`], v = it[k];
    const ctl = f.type === "Currency" ? `<input type="number" step="0.01" min="0" inputmode="decimal" id="pi${i}-${k}" name="item:${i}:${k}" value="${v ? (v / 100).toFixed(2) : ""}"${err ? ` aria-invalid="true"` : ""} aria-label="${esc(f.label)}, item ${i + 1}">`
      : f.type === "Decimal" ? `<input type="number" step="0.01" min="0" id="pi${i}-${k}" name="item:${i}:${k}" value="${v ? esc(v) : ""}" aria-label="${esc(f.label)}, item ${i + 1}">`
      : `<input type="text" id="pi${i}-${k}" name="item:${i}:${k}" value="${esc(v || "")}"${err ? ` aria-invalid="true"` : ""} aria-label="${esc(f.label)}, item ${i + 1}">`;
    return `<td data-label="${esc(f.label)}"${sn(`RQI.${f.name}`)}>${ctl}${err ? `<span class="ferr">${esc(err)}</span>` : ""}</td>`; };
  return `<div class="ffield wide${e.items ? " has-err" : ""}"${sn("PT-43")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Billing line items</span>
    <div class="tablewrap"><table class="list mrvs" id="pfItems"><thead><tr><th>Item</th><th class="num">Amount (w/o GST)</th><th class="num">GST amount (${GST_RATE}%)</th><th class="num">Total amount</th><th>Late payment interest (%)</th><th>Account code</th><th><span class="sr">Remove</span></th></tr></thead>
    <tbody>${items.map((it, i) => { const c = itemCalc(it); return `<tr><td class="mono" data-label="Item number" id="pfItemNo-${i}"${sn("RQI.item_number")}>${i + 1}</td>${inp(i, "amount", it)}<td class="num mono" data-label="GST amount" id="pfItemGst-${i}"${sn("RQI.gst_amount")}>${fmt(c.gst)}</td><td class="num mono" data-label="Total amount" id="pfItemTot-${i}"${sn("RQI.total_amount")}>${fmt(c.total)}</td>${inp(i, "lpiRate", it)}${inp(i, "accountCode", it)}<td><button type="button" class="linkish small" data-iremove="${i}" aria-label="Remove item ${i + 1}">Remove</button></td></tr>`; }).join("")}</tbody>
    ${itemTotals(d)}</table></div>
    ${e.items ? `<span class="ferr">${esc(e.items)}</span>` : ""}
    <div class="row start"><button type="button" class="btn small" data-iadd${sn("UA-PT-additem")}>+ Add item</button><span class="fhelp">GST and total are calculated at ${GST_RATE}%. Late payment interest is a rate in % (to be confirmed).</span></div></div>`;
}
export function itemTotals(d) {
  const t = (d.items || []).reduce((a, it) => { const c = itemCalc(it); return { amount: a.amount + c.amount, gst: a.gst + c.gst, total: a.total + c.total }; }, { amount: 0, gst: 0, total: 0 });
  return `<tfoot id="pfItemTotals"><tr><th scope="row">Total</th><td class="num mono" data-label="Amount (w/o GST)">${fmt(t.amount)}</td><td class="num mono" data-label="GST">${fmt(t.gst)}</td><td class="num mono" data-label="Total"><b>${fmt(t.total)}</b></td><td colspan="3"></td></tr></tfoot>`;
}

/** AR-i GIRO subsection inside Contract (D22): existing DDA? read-only, from the contract's GIRO status (set only by an AR-ix). */
function giroSub(d) {
  const v = giroOnContractOf(d), k = d.contractOption === "existing" && d.contractId ? ctrById(d.contractId) : null, cur = activeGiroCase(k);
  const grey = d.contractOption !== "existing";
  const tip = grey ? "This contract isn't set up yet. Once AR has created it, raise an AR-ix (GIRO authorisation) if it needs GIRO." : "GIRO (DDA) is set by an AR-ix (GIRO authorisation). Raise an AR-ix if this contract needs GIRO.";
  return `<div class="psub${grey ? " greyed" : ""}"${sn("PT-36")} title="${esc(tip)}"><h3 class="small">GIRO</h3>
    <div class="fgrid"><div class="ffield"${sn("REQ.giro_on_contract")}><span class="flabel">Is there an existing DDA? <span class="ftip" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}">i</span></span>
      <div class="seg giro-ro" role="group" aria-label="Existing DDA (read-only)"><button type="button" disabled aria-pressed="${v === "yes"}">Yes</button><button type="button" disabled aria-pressed="${v === "no" && !grey}">No</button></div></div>
      ${cur ? `<div class="ffield"><span class="flabel">AR-ix case</span><div class="fro mono">${esc(cur.number)}</div><span class="fhelp">${esc(giroLabel(cur))}</span></div>` : ""}</div>
    <p class="fhelp">${grey ? "Not available for a new contract or no-contract billing. After AR sets up the contract, raise an AR-ix if it needs GIRO." : cur ? "" : "No DDA on this contract. Raise an AR-ix (GIRO authorisation) from AR forms if it needs GIRO."}</p>
  </div>`;
}

/** Variable set "General information" (D19): first section of every AR form. */
function generalInfo(d, e, f) {
  return `<fieldset class="psec"${sn("PT-30")}><legend>1. General information</legend>
    <div class="fgrid">${f("requesterName", { mandatory: true, help: null })}
      <div class="ffield"${sn("REQ.requester_email")}><span class="flabel">Email</span><div class="fro">${esc(me().email || "")}</div><span class="fhelp">From your sign-in (SSO); can't be changed.</span></div>
      ${f("department")}${f("deptSubBu", { help: d.department ? null : "Choose the department first" })}${f("ccList", { help: "Emails separated by commas. These people can view this case on the portal." })}</div>
  </fieldset>`;
}

function formPage() {
  const p = P(), code = p.formCode || "AR-i";
  if (!p.draft || p.draft.form !== code) {
    const gen = { form: code, requesterName: me().name, requesterEmail: me().email || "", ccList: "", department: me().department || "", newCustomer: false, custQ: "", attachments: [] };
    p.draft = code === "AR-ix" ? { ...gen, contractOption: "", giroPurpose: "", giroType: "add" }
      : { ...gen, needItems: "no", items: [] };
    p.errors = {};
  }
  if (code === "AR-ix") return giroFormPage();
  const d = p.draft, e = p.errors || {};
  const f = (k, o = {}) => fieldHtml("requests", reqField(k), d, { prefix: "pf", errors: e, vals: d, ...o });
  const onFile = d.newCustomer ? {} : docsOnFile(d.customerId, d.contractId, d.department);
  const nErr = Object.keys(e).length;
  const haveCust = d.newCustomer || d.customerId;
  let sec = 2; const n = () => ++sec;
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="forms">AR forms</button> › <span>AR-i</span></nav>
    <div class="pt-item">
      <form class="pt-form pt-card" id="arForm" novalidate${sn("PT-05")}>
        <div><span class="ft-code">AR-i</span><h1>New AR request</h1></div>
        <p class="pt-lead">Ask Accounts Receivable to bill a customer. Billing is contract level: choose the contract (or No contract required), then the invoice details. A recurring contract is billed every month until it ends, so you only submit once.</p>
        <div id="pfAlert">${formAlert(nErr)}</div>

        ${generalInfo(d, e, f)}

        <fieldset class="psec"${sn("PT-25")}><legend>2. Customer</legend>
          ${customerStep(d, e, f, { details: true })}
        </fieldset>

        <fieldset class="psec"${sn("PT-20")}><legend>${n()}. Contract and bill-to</legend>
          ${haveCust ? contractStep(d, e, f) : `<p class="pt-hint">Select a customer above to see the contract options.</p>`}
        </fieldset>

        <fieldset class="psec"${sn("PT-37")}><legend>${n()}. Invoice details</legend>
          ${(() => { const bm = billingMode(d), k = targetContract(d); return d.contractOption ? `<p class="pt-hint">Billed under ${d.contractOption === "new" ? `new contract ${esc(d.newCtrNumber || "")}` : k ? esc(ctrLabel(k)) : d.contractOption === "none" ? "the no-contract shell" : "the chosen contract"}: ${bm.recurring ? "<b>recurring contract</b>, so the amount below is billed every month until the contract ends" : "<b>one invoice</b>"}.</p>` : ""; })()}
          <div class="fgrid">${f("title", { help: null })}${f("attnName", { help: d.attnPrefilled ? "Prefilled from the contract's bill-to person" : null })}${f("attnEmail", { help: null })}
            ${f("perPeriod", { label: billingMode(d).recurring ? "Amount billed per period (SGD, before GST)" : "Amount billed (SGD, before GST)", help: null })}
            ${billingMode(d).recurring ? "" : `${f("invoiceTiming", { help: null })}${d.invoiceTiming === "expedited" ? f("expediteReason", { help: null }) : ""}`}
            ${f("needItems", { help: null })}</div>
          ${invSum(d)}
          ${d.needItems === "yes" ? itemsTable(d, e) : ""}
        </fieldset>

        <fieldset class="psec"${sn("PT-23")}><legend>${n()}. Customer documents</legend>
          <p class="pt-hint">${d.newCustomer ? "New customer: AR needs all three documents." : d.customerId ? "Documents AR already holds for this customer are marked On file." : "Find the customer to see which documents AR already holds."}</p>
          <div class="docs">${DOC_TYPES.map(([t]) => docRow(t, d, onFile)).join("")}</div>
          <div class="ffield wide"${sn("PT-08")}><span class="flabel">Other supporting documents</span>
            <div><label class="btn small" for="pfAttach">${icon("clip", 15)} Add attachment</label><input type="file" id="pfAttach" multiple hidden></div>
            ${d.attachments?.length ? `<ul class="attlist">${d.attachments.map((a, ix) => `<li>${esc(a)} <button type="button" class="linkish small" data-unattach="${ix}">Remove</button></li>`).join("")}</ul>` : `<span class="fhelp">For example the customer's acceptance email or timesheet.</span>`}
          </div>
          <div class="fgrid">${f("details")}</div>
        </fieldset>

        <fieldset class="psec"${sn("PT-42")}><legend>${n()}. Others</legend>
          <p class="pt-hint">Optional. Where these fields finally go is still to be decided.</p>
          <div class="fgrid"${sn("PT-29")}>${INV_KEYS.map(k => f(k, { help: null })).join("")}${f("poNumber")}</div>
        </fieldset>
      </form>
      <aside class="pt-side" id="pfSide">${formSide(d)}</aside>
    </div>
  </div>`;
}

/** AR-ix GIRO authorisation (AR-ix module). Contract first (prefills the applicant), then the GIRO details. */
function giroFormPage() {
  const p = P(), d = p.draft, e = p.errors || {};
  const f = (k, o = {}) => fieldHtml("requests", reqField(k), d, { prefix: "pf", errors: e, vals: d, ...o });
  const nErr = Object.keys(e).length, haveCust = d.newCustomer || d.customerId;
  const ctrs = d.customerId && !d.newCustomer ? S.contracts.filter(k => k.customerId === d.customerId && !isShell(k)) : [];
  const opts = [["existing", "Existing contract", `${ctrs.length} on file`], ["new", "Not listed / new", "AR links it later"]].filter(([k]) => k !== "existing" || ctrs.length);
  const k = d.contractId ? ctrById(d.contractId) : null;
  const cur = activeGiroCase(k);
  const show = key => fieldVisible("requests", reqField(key), d);
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="forms">AR forms</button> › <span>AR-ix</span></nav>
    <div class="pt-item">
      <form class="pt-form pt-card" id="arForm" novalidate${sn("PT-31")}>
        <div><span class="ft-code">AR-ix</span><h1>GIRO authorisation</h1></div>
        <p class="pt-lead">Add or remove GIRO (direct debit) on a contract for rental, carpark or other charges. Choose the contract first; the applicant details come from it.</p>
        <div id="pfAlert">${formAlert(nErr)}</div>

        ${generalInfo(d, e, f)}

        <fieldset class="psec"${sn("PT-32")}><legend>2. Contract and applicant</legend>
          ${customerStep(d, e, f, { newLabel: "AR doesn't have this customer yet. AR will set it up when it processes the contract's AR-i.", newFields: false })}
          ${haveCust ? `<div class="ffield wide${e.contractOption ? " has-err" : ""}"${sn("REQ.contract_option")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Which contract is the GIRO for?</span>
            <div class="optcards" role="group" aria-label="Contract">${opts.map(([key, l, sub]) => `<button type="button" class="optcard" data-ctropt="${key}" aria-pressed="${d.contractOption === key}">${esc(l)}<span>${esc(sub)}</span></button>`).join("")}</div>
            ${e.contractOption ? `<span class="ferr">${esc(e.contractOption)}</span>` : ""}</div>
          ${d.contractOption === "existing" ? `<div class="fgrid"><label class="ffield wide${e.contractId ? " has-err" : ""}" for="pf-contractId"${sn("REQ.contract")}><span class="flabel"><i class="req" aria-hidden="true">*</i>Contract</span>
            <select id="pf-contractId" name="contractId"${e.contractId ? ` aria-invalid="true"` : ""}><option value="">-- Choose the contract --</option>${ctrs.map(c => `<option value="${c.id}"${c.id === d.contractId ? " selected" : ""}>${esc(c.number)} · ${esc(c.title)}</option>`).join("")}</select>
            ${e.contractId ? `<span class="ferr">${esc(e.contractId)}</span>` : ""}</label></div>
            ${k ? `<div class="pt-info"${sn("PT-34")}><b>GIRO on ${esc(k.number)}: ${cur ? "Active" : "Not active"}</b><p class="small">${cur ? `From ${esc(cur.number)} · ${esc(giroLabel(cur))}${cur.carplate ? ` ${esc(cur.carplate)}` : cur.giroLocation ? ` · ${esc(cur.giroLocation)}` : ""}${cur.giroAmount ? ` · SGD ${fmt(cur.giroAmount)}` : ""}. A contract can have only one active GIRO: to change it, submit Remove GIRO first.` : "You can add GIRO to this contract."}</p></div>` : ""}` : ""}
          ${d.contractOption === "new" ? `<p class="pt-hint">AR links the GIRO to the contract once the contract is set up (AR processes its AR-i first).</p><div class="fgrid">${f("newCtrRef", { mandatory: true, label: "Contract / tenancy agreement / reference number", help: null })}</div>` : ""}` : ""}
          ${d.contractOption ? `<h3 class="small">Applicant</h3>${d.applicantPrefilled ? `<p class="pt-hint">Prefilled from the bill-to on ${esc(k?.number || "the contract")}. Change it if the GIRO applicant is different.</p>` : ""}
          <div class="fgrid">${f("applicantName", { mandatory: true, help: null })}${f("applicantEmail", { mandatory: true, help: null })}${f("applicantMobile", { help: null })}${f("giroInvoiceRef", { help: "Optional for now" })}</div>` : ""}
        </fieldset>

        <fieldset class="psec"${sn("PT-33")}><legend>3. GIRO details</legend>
          <div class="fgrid">${f("giroPurpose", { mandatory: true, help: null })}${show("giroPurposeOther") ? f("giroPurposeOther", { mandatory: true, help: null }) : ""}${f("giroType", { mandatory: true, help: null })}</div>
          ${d.giroPurpose === "rental" ? `<h3 class="small">Rental</h3><div class="fgrid">${f("giroLocation", { mandatory: true, help: null })}${f("giroStart", { mandatory: d.giroType === "add", help: null })}${f("giroEnd", { help: null })}</div>` : ""}
          ${d.giroPurpose === "carpark" ? `<h3 class="small">Carpark</h3><div class="fgrid">${f("carplate", { mandatory: true, help: "One vehicle per form" })}${f("parkStart", { mandatory: d.giroType === "add", help: null })}${f("parkEnd", { help: null })}</div>` : ""}
          <div class="fgrid">${f("giroAmount", { mandatory: d.giroType === "add", help: d.giroType === "remove" ? "Optional when removing GIRO" : null })}</div>
          <div class="ffield wide"${sn("PT-08")}><span class="flabel">Supporting documents</span>
            <div><label class="btn small" for="pfAttach">${icon("clip", 15)} Add attachment</label><input type="file" id="pfAttach" multiple hidden></div>
            ${d.attachments?.length ? `<ul class="attlist">${d.attachments.map((a, ix) => `<li>${esc(a)} <button type="button" class="linkish small" data-unattach="${ix}">Remove</button></li>`).join("")}</ul>` : `<span class="fhelp">For example the signed GIRO form or the tenancy agreement.</span>`}
          </div>
          <div class="fgrid">${f("details")}</div>
        </fieldset>
      </form>
      <aside class="pt-side" id="pfSide">${formSide(d)}</aside>
    </div>
  </div>`;
}

const ctrSummary = d => d.contractOption === "existing" ? (d.contractId ? `Contract ${ctrById(d.contractId)?.number}` : "Existing contract (choose one)")
  : d.contractOption === "new" ? `New contract ${d.newCtrNumber || ""}`.trim() : d.contractOption === "none" ? "No contract required" : d.contractId ? ctrLabel(ctrById(d.contractId)) : "Contract not chosen yet";
export const formAlert = n => n ? `<div class="pt-alert err" role="alert">Please fix ${n} field${n === 1 ? "" : "s"} below.</div>` : "";

export function formSide(d) {
  if (d.form === "AR-ix") {
    const labels = [...new Set(Object.keys(validateARi(d)).map(k => k === "newCtrRef" ? "Contract reference number" : reqField(k)?.label).filter(Boolean))];
    return `<div class="pt-card sticky"><div class="side-info">
      <span class="ft-code">AR-ix</span><h2>Submit request</h2>
      <p class="small muted">Goes to the Accounts Receivable team as a case. You and the people on the CC list can follow it on My requests.</p>
      <p class="small"><b>${esc(d.newCustomer ? `${d.newCustName || "Customer"} (not at AR yet)` : d.customerId ? custName(d.customerId) : "No customer yet")}</b><br>${esc(d.contractOption === "existing" ? (d.contractId ? `Contract ${ctrById(d.contractId)?.number}` : "Choose the contract") : d.contractOption === "new" ? `Contract ${d.newCtrRef || "(reference to enter)"} · AR links it` : "Contract not chosen yet")}<br>${esc(d.giroPurpose ? giroLabel(d) : "GIRO details to fill in")}${d.giroAmount ? ` · SGD ${fmt(d.giroAmount)}` : ""}</p>
      ${labels.length ? `<p class="small"><b>Still needed</b><br>${labels.map(esc).join(", ")}</p>` : `<p class="small ok-t">All required information provided.</p>`}
      </div><button type="submit" form="arForm" class="btn primary block"${sn("PT-09")}>Submit</button>
    </div>`;
  }
  const keys = Object.keys(validateARi(d));
  const labels = [...new Set(keys.map(k => k.startsWith("item:") || k === "items" ? "Billing line items" : reqField(k)?.label).filter(Boolean))];
  const l = draftLine(d), val = lineValue(l, draftPro(d));
  return `<div class="pt-card sticky"><div class="side-info">
    <span class="ft-code">AR-i</span>
    <h2>Submit request</h2>
    <p class="small muted">Goes to the Accounts Receivable team as a case. You'll get updates on My requests.</p>
    <p class="small"><b>${esc(d.newCustomer ? `${d.newCustName || "New customer"} (new)` : d.customerId ? custName(d.customerId) : "No customer yet")}</b><br>${esc(ctrSummary(d))}<br>${esc(l.lineType === "recurring" ? "Recurring, monthly" : "One invoice")} · SGD ${fmt(val)}</p>
    ${labels.length ? `<p class="small"><b>Still needed</b><br>${labels.map(esc).join(", ")}</p>` : `<p class="small ok-t">All required information provided.</p>`}
    </div><button type="submit" form="arForm" class="btn primary block"${sn("PT-09")}>Submit</button>
  </div>`;
}

function confirmPage() {
  const r = reqById(P().id); if (!r) return homePage();
  if (r.form === "AR-ix") return `<div class="pt-inner pt-body"><section class="pt-card pt-done" role="status">
    <h1>Request submitted</h1>
    <p>Your AR-ix request <b class="mono">${esc(r.number)}</b> (${esc(giroLabel(r))}) for ${esc(reqCustName(r))} has been sent to Accounts Receivable.</p>
    ${r.contractId ? "" : `<p class="small">Contract <b>${esc(r.newCtrRef)}</b> isn't on file yet. AR sets it up from its AR-i, then links this GIRO request to it.</p>`}
    ${ccEmails(r.ccList).length ? `<p class="small">CC: ${esc(ccEmails(r.ccList).join(", "))} can view this case.</p>` : ""}
    <div class="row"><button type="button" class="btn primary" data-ticket="${r.id}">View request</button><button type="button" class="btn" data-pnav="forms">Back to AR forms</button></div>
  </section></div>`;
  return `<div class="pt-inner pt-body"><section class="pt-card pt-done" role="status">
    <h1>Request submitted</h1>
    <p>Your ${esc(r.form)} request <b class="mono">${esc(r.number)}</b> (${esc(linesLabel(r))}, request value <b>SGD ${fmt(r.amount)}</b>) for ${esc(reqCustName(r))} has been sent to Accounts Receivable.</p>
    ${reqLines(r).some(l => l.lineType === "recurring") ? `<p class="small">Recurring contract: AR sets up a billing schedule and raises each monthly invoice. You don't need to submit this form again.</p>` : ""}
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
      ${rows.length ? `<div class="tablewrap"><table class="list"><thead><tr><th>Number</th><th>Form</th><th>Request</th><th>Customer</th><th class="num">Amount</th><th>State</th><th>Updated</th></tr></thead><tbody>
        ${rows.map(r => `<tr data-ticket="${r.id}" tabindex="0"><td><button type="button" class="linkish mono" data-ticket="${r.id}">${esc(r.number)}</button>${r.requestedBy !== me().id ? ` <span class="chip c-neutral" title="You are on the CC list">CC</span>` : ""}</td><td>${esc(r.form || "AR-i")}<span class="desc">${esc(linesLabel(r))}</span></td><td class="wrap">${esc(r.title)}</td><td>${esc(reqCustName(r))}</td><td class="num">${fmt(r.amount)}</td><td>${reqChip(r)}</td><td>${esc(r.updated || r.opened)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="empty">No requests yet. Use AR-i to ask Accounts Receivable to bill a customer.</p>`}
    </section>
  </div>`;
}

function ticketPage() {
  const r = reqById(P().id); if (!r || !canViewReq(r)) return requestsPage();
  const lines = reqLines(r);
  const feed = r.activity.filter(e => e.kind !== "work_note").slice().reverse();
  const open = REQ_OPEN.includes(r.state);
  const giro = r.form === "AR-ix", cur = giro && r.contractId ? activeGiroCase(ctrById(r.contractId)) : null;
  const kv = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  return `<div class="pt-inner pt-body">
    <nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkish" data-pnav="home">Home</button> › <button type="button" class="linkish" data-pnav="requests">My requests</button> › <span>${esc(r.number)}</span></nav>
    <div class="pt-ticket">
      <section class="pt-card"${sn("PT-11")}>
        <header class="tk-head"><div><span class="mono muted">${esc(r.number)}</span><h1 class="h2">${esc(r.title)}</h1></div>${reqChip(r)}</header>
        ${r.state === "awaiting_info" ? `<div class="pt-alert" role="status"><b>Accounts Receivable needs more information.</b> Reply below. Your reply sends the request back to AR.</div>` : ""}
        ${giro ? `<div class="tklines"${sn("PT-35")}><h2 class="small">GIRO</h2><ul><li><div><b>${esc(giroLabel(r))}</b><span class="desc">${esc([r.carplate, r.giroLocation, r.giroAmount ? `SGD ${fmt(r.giroAmount)}` : "", r.giroStart || r.parkStart ? `from ${r.giroStart || r.parkStart}` : ""].filter(Boolean).join(" · "))}</span></div>
          <div class="tkst">${r.state === "completed" ? (r.giroType === "remove" ? `<span class="chip c-ok">GIRO removed</span><span class="desc">on ${esc(ctrNo(r.contractId))}</span>` : cur?.id === r.id ? `<span class="chip c-ok">GIRO active</span><span class="desc">on ${esc(ctrNo(r.contractId))}</span>` : `<span class="chip c-neutral">Ended</span><span class="desc">GIRO on ${esc(ctrNo(r.contractId))} later removed</span>`) : r.state === "rejected" ? `<span class="chip c-bad">Rejected</span>` : r.contractId ? `<span class="chip c-neutral">With AR</span>` : `<span class="chip c-warn">Contract to be linked</span><span class="desc">${esc(r.newCtrRef || "")}</span>`}</div></li></ul></div>` : `<div class="tklines"${sn("PT-27")}><h2 class="small">Billing</h2><ul>${lines.map(l => { const inv = l.invoiceId ? S.invoices.find(i => i.id === l.invoiceId) : null, sch = l.scheduleId ? S.schedules.find(x => x.id === l.scheduleId) : null, st = lineStatus(l);
          return `<li><div><b>${esc(l.desc)}</b><span class="desc">${l.lineType === "recurring" ? `${esc(freqLabel(l.frequency).toLowerCase())} SGD ${fmt(l.amount)} · ${esc(l.startDate)} to ${esc(l.endDate)}` : `One-off SGD ${fmt(l.amount)}`}</span></div>
            <div class="tkst">${st === "invoiced" ? `<span class="chip c-ok">Invoiced</span><span class="desc">${esc(inv.number)} · issued ${esc(inv.date)} · due ${esc(inv.due)}</span>` : st === "scheduled" ? `<span class="chip c-ok">Scheduled</span><span class="desc">${esc(sch.number)} · AR raises each invoice</span>` : st === "draft" ? `<span class="chip c-accent">Being invoiced</span>` : `<span class="chip c-neutral">With AR</span>`}</div></li>`; }).join("")}</ul></div>`}
        ${r.state === "rejected" ? `<div class="pt-alert err" role="status"><b>This request was rejected.</b> See the reason below. Submit a new AR form if needed.</div>` : ""}
        ${open ? `<div class="composer"><label class="flabel" for="ptReply">Add a comment</label><textarea id="ptReply" rows="3" placeholder="Message to Accounts Receivable"></textarea><div class="row"><span class="hint">Accounts Receivable sees your comment on the case.</span><button type="button" class="btn primary small" data-preply="${r.id}">Send</button></div></div>` : ""}
        <ol class="feed">${feed.map(e => { const u = S.users.find(x => x.id === e.by); const ar = u?.team === "ar";
          return `<li class="fe k-${e.kind}${ar ? " from-ar" : ""}"><span class="avatar sm" aria-hidden="true">${esc(ar ? "AR" : initials(u?.name))}</span><div><div class="fe-h"><b>${esc(e.kind === "system" ? "Update" : ar ? `${u.name}, Accounts Receivable` : u?.name || "")}</b><span class="muted">${esc(e.at.slice(0, 16).replace("T", " "))}</span></div><p>${esc(e.text)}</p></div></li>`; }).join("")}</ol>
      </section>
      <aside class="pt-card"${sn("PT-13")}>
        <h2>Details</h2>
        <dl class="kvlist">${kv("Form", esc(r.form || "AR-i"))}${kv("Requester", esc(r.requesterName || ""))}${ccEmails(r.ccList).length ? kv("CC", esc(ccEmails(r.ccList).join(", "))) : ""}${kv("Customer", esc(reqCustName(r)))}${r.pocName || r.pocEmail ? kv("Customer POC", esc([r.pocName, r.pocEmail].filter(Boolean).join(" · "))) : ""}${kv("Department", esc([r.department || "—", reqField("deptSubBu").choices.find(c => c[0] === r.deptSubBu)?.[1]].filter(Boolean).join(" · ")))}${kv("Contract", esc(r.contractId ? ctrLabel(ctrById(r.contractId)) : giro ? `${r.newCtrRef || "—"} (to be linked)` : ctrSummary(r)))}
          ${giro ? `${kv("Applicant", esc([r.applicantName, r.applicantEmail, r.applicantMobile].filter(Boolean).join(" · ")))}${r.giroInvoiceRef ? kv("Invoice reference", esc(r.giroInvoiceRef)) : ""}${kv("GIRO", esc(giroLabel(r)))}${r.giroAmount ? kv("Amount", `<span class="mono">SGD ${fmt(r.giroAmount)}</span>`) : ""}`
          : `${kv("Billing", esc(linesLabel(r)))}${r.attnName || r.attnEmail ? kv("Attention to", esc([r.attnName, r.attnEmail].filter(Boolean).join(" · "))) : ""}${r.perPeriod ? kv("Amount per period", `<span class="mono">SGD ${fmt(r.perPeriod)}</span> before GST`) : ""}${r.invoiceTiming ? kv("Preferred invoice date", `${esc(reqField("invoiceTiming").choices.find(c => c[0] === r.invoiceTiming)?.[1] || r.invoiceTiming)}${r.expediteReason ? `<br><span class="small">${esc(r.expediteReason)}</span>` : ""}`) : ""}${reqItems(r).length ? kv("Billing line items", reqItems(r).map(it => `Item ${esc(it.seq)}: SGD ${fmt(it.total)} incl. GST`).join("<br>")) : ""}${r.giroOnContract ? kv("GIRO on contract", r.giroOnContract === "yes" ? "Yes" : "No") : ""}${finText(r) ? kv("Finance coding", esc(finText(r))) : ""}${kv("Request value", `<span class="mono">SGD ${fmt(r.amount)}</span>`)}`}
${r.poNumber ? kv("Customer PO", esc(r.poNumber)) : ""}${kv("Submitted", esc(r.opened))}</dl>
        ${r.details ? `<p class="small">${esc(r.details)}</p>` : ""}
        ${(() => { const docs = [["docContract", "Contract / PO"], ["docAcra", "ACRA"], ["docBillingForm", "Billing form"]].filter(([k]) => r[k]).map(([k, l]) => `${l}: ${r[k]}`).concat(r.attachments || []);
          return docs.length ? `<h3 class="small">Attachments</h3><ul class="attlist">${docs.map(a => `<li>${icon("clip", 14)} ${esc(a)}</li>`).join("")}</ul>` : ""; })()}
      </aside>
    </div>
  </div>`;
}
