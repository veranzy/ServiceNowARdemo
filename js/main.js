// Entry point: delegated event handling for the demo bar, workspace and portal, then boot.
import { startRouter } from "./router.js";
import { acctById, parseStatement, sampleCSV, saveUpload } from "./bsu.js";
import { exportCSV } from "./io.js";
import { act } from "./matching.js";
import { giroPurposesFor, giroContracts, custDetailsOf, itemCalc, targetContract, giroTarget, giroTypesFor, nextCycleDate, cancelInvoice, createRequest, linkContract, issueInvoice, journal, lineInvoice, me, needBillTo, portalComment, prefillBillTo, recById, requestAction, saveRecord, setupSchedule, validateARi } from "./records.js";
import { loadSample } from "./sample-data.js";
import { TABLES, clearHidden, fieldVisible } from "./schema.js";
import { $, S } from "./state.js";
import { cents, fmt, uid } from "./util.js";
import { render, setStatus, syncBarHeight, toast } from "./views/app.js";
import { refreshPicker } from "./views/finder.js";
import { colTotal, contractBox, custResults, formAlert, formSide, invSum, itemTotals } from "./views/portal.js";
import { listRows } from "./views/workspace.js";

const W = () => S.ui.ws, P = () => S.ui.portal;
const activeTab = () => W().tabs.find(t => t.key === W().active);

// ---------- workspace navigation ----------
function openTab(table, id) {
  if (S.ui.persona === "project") { if (table === "requests") { P().page = "ticket"; P().id = id; } return render(); }
  const key = `${table}:${id}`;
  if (!W().tabs.some(t => t.key === key)) W().tabs.push({ key, table, id });
  W().active = key;
  render(); window.scrollTo(0, 0);
}
function newTab(table, prefill) {
  const id = "new" + uid(""), key = `${table}:${id}`;
  const defaults = Object.fromEntries((TABLES[table]?.fields || []).filter(f => f.default !== undefined).map(f => [f.key, f.default]));   // e.g. Active = true
  W().tabs.push({ key, table, id, draft: {}, vals: { ...defaults, ...(prefill || {}) } });
  W().active = key; render(); window.scrollTo(0, 0);
}
function closeTab(key) {
  const w = W(), ix = w.tabs.findIndex(t => t.key === key); if (ix < 0) return;
  w.tabs.splice(ix, 1);
  if (w.active === key) w.active = w.tabs[ix - 1]?.key || w.tabs[ix]?.key || "main";
  render();
}
function showMain(main) { W().main = main; W().active = "main"; W().q = ""; if (main.kind === "list" && window.innerWidth < 760) W().lmOpen = false; render(); window.scrollTo(0, 0); }

/** Save pending form values on the active record tab. Returns true when there was nothing to save or it saved. */
function saveActive(tab, { quiet } = {}) {
  if (!tab.id.startsWith("new") && (!tab.vals || !Object.keys(tab.vals).length)) { tab.errors = {}; return true; }
  const res = saveRecord(tab.table, tab.id, tab.vals || {});
  if (res.errors) { tab.errors = res.errors; tab.msg = { kind: "err", text: "Fix the highlighted fields, then try again." }; return false; }
  tab.errors = {}; tab.vals = {}; tab.msg = null;
  if (tab.id.startsWith("new")) { const old = tab.key; tab.id = res.rec.id; tab.key = `${tab.table}:${res.rec.id}`; delete tab.draft; if (W().active === old) W().active = tab.key; }
  if (!quiet) toast(`${TABLES[tab.table].label} saved.`);
  return true;
}

function uiAction(name) {
  const tab = activeTab(); if (!tab) return;
  tab.msg = null;
  if (name === "save") { saveActive(tab); return render(); }
  if (name === "post") {
    const c = W().composer[tab.id] || { kind: "work_note", text: "" };
    if (!c.text.trim()) { tab.msg = { kind: "err", text: "Write something in the activity composer first." }; return render(); }
    journal(recById("requests", tab.id), c.kind, c.text.trim()); W().composer[tab.id] = { kind: c.kind, text: "" };
    toast(c.kind === "comment" ? "Comment posted. The requester can see it on the portal." : "Work note posted."); return render();
  }
  if (!saveActive(tab, { quiet: true })) return render();
  if (tab.table === "requests") {
    const res = requestAction(tab.id, name);
    if (typeof res === "string") { tab.msg = { kind: "err", text: res }; return render(); }
    toast(name === "assign" ? "Assigned to you." : "Done.");
  }
  if (tab.table === "invoices") {
    if (name === "issue" && !saveActive(tab, { quiet: true })) return render();   // the form (e.g. Approval date) is saved first, as a ServiceNow UI action would
    const err = name === "issue" ? issueInvoice(tab.id) : name === "cancel" ? cancelInvoice(tab.id) : null;
    if (err) { tab.msg = { kind: "err", text: err }; return render(); }
    toast(name === "issue" ? "Invoice issued." : "Invoice cancelled.");
  }
  render();
}

function wsSearch(q) {
  q = q.trim().toLowerCase(); if (!q) return;
  for (const t of ["requests", "invoices", "deposits", "contracts", "schedules", "lines", "uploads", "documents"]) {
    const hit = S[t].find(r => String(r.number || "").toLowerCase() === q) || S[t].find(r => String(r.number || "").toLowerCase().includes(q));
    if (hit) return openTab(t, hit.id);
  }
  const c = S.customers.find(x => x.name.toLowerCase().includes(q)); if (c) return openTab("customers", c.id);
  toast(`No record matches "${q}".`);
}

// ---------- form value capture ----------
function coerce(table, key, el) {
  const f = TABLES[table].fields.find(x => x.key === key); if (!f) return el.value;
  if (el.type === "checkbox") return el.checked;
  if (el.type === "file") return el.files?.[0]?.name || "";
  if (f.type === "Currency") return el.value === "" ? 0 : cents(el.value);
  if (f.type === "Integer" || f.type === "Decimal") return el.value === "" ? 0 : Number(el.value);
  if (key === "aliases") return el.value.split(",").map(s => s.trim()).filter(Boolean);
  if (f.type === "Reference") return el.value || null;
  if (f.type === "List") return [...el.selectedOptions].map(o => o.value);   // multi-select (e.g. Contract owner)
  return el.value;
}

/** Portal form: clear a field's error in place and refresh the alert + submit sidebar without re-rendering. */
function portalFieldUpdated(el) {
  const errs = P().errors;
  if (errs[el.name]) {
    delete errs[el.name];
    const lab = el.closest(".ffield"); lab?.classList.remove("has-err"); lab?.querySelector(".ferr")?.remove(); el.removeAttribute("aria-invalid");
    const a = $("pfAlert"); if (a) a.innerHTML = formAlert(Object.keys(errs).length);
  }
  // refresh the summary but keep the Submit button node, so a click that caused this change (blur) still submits
  const info = document.querySelector("#pfSide .side-info");
  if (info) { const tmp = document.createElement("div"); tmp.innerHTML = formSide(P().draft); info.replaceWith(tmp.querySelector(".side-info")); }
  else { const side = $("pfSide"); if (side) side.innerHTML = formSide(P().draft); }
}

/** AR-i contract step changed: drop a prefilled bill-to (it belonged to the previous choice) and prefill again. */
function contractChanged(d) {
  if (d.form === "COL") {                           // Collections: no contract step. AC-10: cost centres follow the requesting department
    const ok = id => S.costCentres.some(c => c.id === id && c.department === d.department);
    if (d.colCostCentre && !ok(d.colCostCentre)) d.colCostCentre = "";
    for (const r of d.colAlloc || []) if (r.costCentre && !ok(r.costCentre)) r.costCentre = "";
    return;
  }
  if (d.form === "AR-ix") {
    // AR-ix: the applicant is prefilled from the contract's bill-to (cleared again when the contract changes)
    if (d.applicantPrefilled) { Object.assign(d, { applicantName: "", applicantEmail: "", applicantMobile: "" }); delete d.applicantPrefilled; }
    // AR-ix decision 22 (E8.5): a department change can take the chosen contract out of the requester's list
    if (d.contractOption === "existing" && d.contractId && !giroContracts(d).some(k => k.id === d.contractId)) d.contractId = "";
    if (d.contractOption === "existing" && !giroContracts(d).length) d.contractOption = "";
    // AR-ix decision 25: the contract option limits the purpose (no contract → Carpark / Others; existing or new → Rental / Others)
    if (d.giroPurpose && !giroPurposesFor(d).includes(d.giroPurpose)) d.giroPurpose = "";
    const k = giroTarget(d);
    // AR-ix decision 14: the contract decides the type (Add only, or Remove only when GIRO is active)
    const types = giroTypesFor(d); d.giroType = types.length === 1 ? types[0] : "";
    if (k?.billToName && !d.applicantName && !d.applicantEmail) Object.assign(d, { applicantName: k.billToName, applicantEmail: k.billToEmail || "", applicantMobile: k.billToPhone || "", applicantPrefilled: true });
    const now = validateARi(d); for (const key of Object.keys(P().errors)) if (!now[key]) delete P().errors[key];
    return;
  }
  if (d.billToPrefilled) { Object.assign(d, { billToName: "", billToEmail: "", billToPhone: "", billToAddress: "" }); delete d.billToPrefilled; }
  prefillBillTo(d);
  // Invoice details: attention to defaults to the contract's (or shell's) bill-to person
  if (d.attnPrefilled) { Object.assign(d, { attnName: "", attnEmail: "" }); delete d.attnPrefilled; }
  const tk = d.contractOption === "existing" ? S.contracts.find(x => x.id === d.contractId) : d.contractOption === "none" ? targetContract(d) : null;
  if (tk?.billToName && !d.attnName && !d.attnEmail) Object.assign(d, { attnName: tk.billToName, attnEmail: tk.billToEmail || "", attnPrefilled: true });
  const now = validateARi(d); for (const k of Object.keys(P().errors)) if (!now[k]) delete P().errors[k];
}
const resetContract = d => { Object.assign(d, { contractOption: "", contractId: null }); contractChanged(d); };

// ---------- BSU ----------
function parseCurrent() {
  const b = S.bsu, a = acctById(b.acctId); if (!a || !b.text) { b.parsed = null; return; }
  const r = parseStatement(b.text, a, b.date);
  if (r.error) { b.error = r.error; b.parsed = null; } else { b.error = ""; b.parsed = r; }
}
function bsuAction(name) {
  const b = S.bsu, a = acctById(b.acctId);
  if (!a) return;
  const fname = `${a.bank}_${a.number.replace(/\D/g, "")}_${b.date.replace(/-/g, "")}.csv`;
  if (name === "sample") { b.text = sampleCSV(a, b.date); b.fileName = fname + " (sample)"; parseCurrent(); return render(); }
  if (name === "download") {
    const url = URL.createObjectURL(new Blob([sampleCSV(a, b.date)], { type: "text/csv" }));
    const l = document.createElement("a"); l.href = url; l.download = fname; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  if (name === "discard") { Object.assign(b, { text: "", fileName: "", parsed: null, error: "" }); return render(); }
  if (name === "save" && b.parsed) {
    const up = saveUpload(a, b.date, b.fileName.replace(" (sample)", ""), b.parsed);
    Object.assign(b, { text: "", fileName: "", parsed: null, error: "" });
    toast(`${up.number} saved: ${up.depositCount} deposit${up.depositCount === 1 ? "" : "s"} added to bank statements.`);
    return openTab("uploads", up.id);   // BSU decision 16: open the new RITM
  }
}

/** AR-i invoice details typed into: refresh the billing summary and contract box in place. */
function invUpdated() {
  const d = P().draft; if (!d || d.form === "AR-ix" || d.form === "COL") return;
  const swap = (id, html) => { const n = $(id); if (n) n.outerHTML = html; };
  swap("pfInvSum", invSum(d));
  const box = document.querySelector(".pt-info.ctr-box"); if (box) box.outerHTML = contractBox(d);
}
/** Collections row typed into: refresh the total in place and clear the cell's error. */
function colRowUpdated(el, t) {
  const d = P().draft, tf = $(`pfTot-${t}`); if (tf) tf.outerHTML = colTotal(d, t);
  if (P().errors[el.name]) { delete P().errors[el.name]; el.removeAttribute("aria-invalid"); el.closest("td")?.querySelector(".ferr")?.remove(); const a = $("pfAlert"); if (a) a.innerHTML = formAlert(Object.keys(P().errors).length); }
  portalFieldUpdated(el);
}
/** Billing line item typed into: recalculate its GST / total and the table totals in place. */
function itemUpdated(el, i) {
  const d = P().draft, k = el.name.split(":")[2], c = itemCalc(d.items[i]);
  const g = $(`pfItemGst-${i}`), t = $(`pfItemTot-${i}`); if (g) g.textContent = fmt(c.gst); if (t) t.textContent = fmt(c.total);
  const tf = $("pfItemTotals"); if (tf) tf.outerHTML = itemTotals(d);
  const key = `item:${i}:${k}`;
  if (P().errors[key]) { delete P().errors[key]; el.removeAttribute("aria-invalid"); el.closest("td")?.querySelector(".ferr")?.remove(); const a = $("pfAlert"); if (a) a.innerHTML = formAlert(Object.keys(P().errors).length); }
  portalFieldUpdated(el);
}

// ---------- events ----------
// Build notes: Alt/Option+click an outlined element copies "<ID> - " so the owner can paste a change request.
document.addEventListener("click", e => {
  if (!S.ui.notes || !e.altKey) return;
  const n = e.target.closest("[data-snid]"); if (!n) return;
  e.preventDefault(); e.stopPropagation();
  const id = n.dataset.snid;
  navigator.clipboard?.writeText(`${id} - `).then(() => toast(`Copied ${id}. Paste it with your change.`), () => toast(`Build note ID: ${id}`)) ?? toast(`Build note ID: ${id}`);
}, true);

document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-open], [data-ticket], tr[data-open]");
  if (!t) return;
  const d = t.dataset;
  if (d.persona) { S.ui.persona = d.persona; return render(); }
  if (t.id === "resetDemo") { loadSample(); toast("Demo data reset."); return render(); }
  // portal
  if (d.pnav) { if (d.pnav === "form") P().formCode = d.form || "AR-i"; P().page = d.pnav; if (d.pnav !== "form") P().errors = {}; render(); return window.scrollTo(0, 0); }
  if (d.ticket) { P().page = "ticket"; P().id = d.ticket; render(); return window.scrollTo(0, 0); }
  if (d.preply) { const err = portalComment(d.preply, $("ptReply")?.value); if (err) return toast(err); toast("Comment sent to Accounts Receivable."); return render(); }
  if (d.undoc) { P().draft[d.undoc] = ""; return render(); }
  // AR-i customer step (D14)
  if (d.pickcust) { Object.assign(P().draft, { customerId: d.pickcust, newCustomer: false }, P().draft.form === "AR-i" ? custDetailsOf(S.customers.find(c => c.id === d.pickcust)) : {}); resetContract(P().draft); delete P().errors.customerId; return render(); }
  if (d.newcust !== undefined) { const dr = P().draft; Object.assign(dr, { newCustomer: true, newCustName: dr.custQ || "", customerId: null }, dr.form === "AR-i" ? custDetailsOf(null) : {}); resetContract(dr); delete P().errors.customerId; render(); return $("pf-newCustUen")?.focus(); }
  if (d.custclear !== undefined) { Object.assign(P().draft, { customerId: null, newCustomer: false }, P().draft.form === "AR-i" ? custDetailsOf(null) : {}); resetContract(P().draft); render(); return $("pfCustQ")?.focus(); }
  // AR-i contract step (D15)
  if (d.ctropt) { const dr = P().draft; dr.contractOption = d.ctropt; if (d.ctropt !== "existing") dr.contractId = null;
    if (d.ctropt === "new" && dr.form !== "AR-ix") { dr.newCtrTerms ||= "30"; dr.newCtrProrate ||= "no"; }
    contractChanged(dr); delete P().errors.contractOption; render();
    return (d.ctropt === "existing" ? $("pf-contractId") : d.ctropt === "new" ? (dr.form === "AR-ix" ? null : $("pf-newCtrType")) : null)?.focus(); }
  // AR-i billing line items (multi-row variable set, AR-i decision 32)
  // Collections multi-row sets (#9: AR3 collections, AR4 allocations)
  if (d.cradd !== undefined) { const dr = P().draft, k = d.cradd; (dr[k] ||= []).push(k === "colTx" ? { collectionType: "", transactions: 0 } : { desc: "", amount: 0, costCentre: "", accountCode: "" }); delete P().errors[k]; render(); return $(`cr-${k}-${dr[k].length - 1}-${k === "colTx" ? "collectionType" : "desc"}`)?.focus(); }
  if (d.crdel !== undefined) { const [k, i] = d.crdel.split(":"); P().draft[k].splice(+i, 1); P().errors = Object.fromEntries(Object.entries(P().errors).filter(([x]) => !x.startsWith(`crow:${k}:`))); return render(); }
  if (d.iadd !== undefined) { const it = P().draft.items ||= []; it.push({ amount: 0, lpiRate: 0, accountCode: "" }); delete P().errors.items; render(); return $(`pi${it.length - 1}-itemNo`)?.focus(); }
  if (d.iremove !== undefined) { P().draft.items.splice(+d.iremove, 1); P().errors = Object.fromEntries(Object.entries(P().errors).filter(([k]) => !k.startsWith("item:"))); return render(); }
  if (d.unattach !== undefined) { P().draft.attachments.splice(+d.unattach, 1); return render(); }
  if (d.unbulk !== undefined) { P().draft.docBulk.splice(+d.unbulk, 1); return render(); }
  // workspace navigation
  if (d.rail) {
    if (d.rail === "list") { if (W().main.kind === "list") { W().active = "main"; return render(); } return showMain({ kind: "list", table: "requests", filter: "all_ari" }); }
    if (d.rail === "bsu") return showMain({ kind: "list", table: "uploads", filter: "all" });   // BSU decision 16: the BSU page is the list of upload RITMs
    return showMain({ kind: d.rail });
  }
  // Horizon list page: list menu beside the list
  if (d.lmtoggle !== undefined) { const open = W().lmOpen ?? (window.innerWidth >= 760); W().lmOpen = !open; return render(); }
  // Horizon record page: record tabs, ribbon, contextual side bar
  if (d.rtab) { const tab = activeTab(); if (tab) { tab.sub = d.rtab; render(); document.querySelector(`[data-rtab="${CSS.escape(d.rtab)}"]`)?.focus({ preventScroll: true }); } return; }
  if (d.ribbon !== undefined) { const tab = activeTab(); if (tab) tab.ribbonClosed = !tab.ribbonClosed; return render(); }
  if (d.stab) { const tab = activeTab(); if (tab) { const sp = W().side, same = tab.side === d.stab || (!tab.side && t.getAttribute("aria-selected") === "true"); if (sp.open && same) sp.open = false; else { sp.open = true; tab.side = d.stab; } } return render(); }
  if (d.stoggle !== undefined) { W().side.open = !W().side.open; return render();
  }
  if (d.list) { const [table, filter] = d.list.split(":"); return showMain({ kind: "list", table, filter }); }
  if (d.open) { const [table, id] = d.open.split(":"); return openTab(table, id); }
  if (d.printinv) {   // CCI decision 13: print the invoice preview (browser print → Save as PDF)
    const doc = $(`invdoc-${d.printinv}`); if (!doc) return;
    const w = window.open("", "_blank", "width=820,height=1000"); if (!w) return toast("Allow pop-ups to print the invoice.");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${document.title}</title><link rel="stylesheet" href="${new URL("css/styles.css", location.href)}"></head><body class="invprint">${doc.outerHTML}</body></html>`);
    w.document.close(); w.onload = () => w.print(); return;
  }
  if (d.tab) { W().active = d.tab; render(); return window.scrollTo(0, 0); }
  if (d.closetab) return closeTab(d.closetab);
  if (d.new && d.prefillContract) {   // New billing schedule (CCI decisions 8–9): contract, customer, monthly, first billing date on the next cycle day
    const k = S.contracts.find(x => x.id === d.prefillContract);
    return newTab(d.new, { contractId: k?.id, customerId: k?.customerId, department: k?.department || "", frequency: "monthly", firstDate: nextCycleDate(k), lastDate: k?.end || "" });
  }
  if (d.new === "uploads") return showMain({ kind: "bsu" });   // New upload RITM: the upload form (BSU decision 16)
  if (d.new) return newTab(d.new, d.prefillCustomer ? { customerId: d.prefillCustomer } : d.prefillAccount ? { bankAccountId: d.prefillAccount } : null);
  if (d.ui) return uiAction(d.ui);
  if (d.ckind) { const tab = activeTab(); const c = W().composer[tab.id] ||= { kind: "work_note", text: "" }; c.kind = d.ckind; c.text = $("composer-" + tab.id)?.value || c.text; return render(); }
  // BSU
  if (d.bsuAcct) { Object.assign(S.bsu, { acctId: d.bsuAcct, text: "", fileName: "", parsed: null, error: "" }); return showMain({ kind: "bsu" }); }
  if (d.bsu) return bsuAction(d.bsu);
  // cash application
  if (d.lineact) {
    const [what, lid] = d.lineact.split(":"), res = what === "schedule" ? setupSchedule(lid) : lineInvoice(lid);
    if (typeof res === "string") return toast(res);
    toast(what === "schedule" ? `Billing schedule ${res.opened.number} set up. The requester can see it on the portal.` : `Draft invoice ${res.opened.number} created for this line.`);
    return openTab(what === "schedule" ? "schedules" : "invoices", res.opened.id);
  }
  if (d.matchdep) { S.pick[d.matchdep] = { open: true, q: "", sel: [], note: "" }; S.filter = "open"; showMain({ kind: "cash" }); return document.querySelector(`[data-pickopen="${d.matchdep}"]`)?.scrollIntoView({ block: "start" }); }
  if (t.id === "exportBtn") return exportCSV();
  if (t.id === "dismissBtn") { setStatus(); return render(); }
  if (d.f) { S.filter = d.f; return render(); }
  if (d.act) return act(d.id, d.act);
  if (d.pickopen) { const pid = d.pickopen; if (S.pick[pid]?.open) delete S.pick[pid]; else S.pick[pid] = { open: true, q: "", sel: [], note: "" }; render(); return S.pick[pid] && $("pkq-" + pid)?.focus(); }
  if (d.apply) return act(d.apply, "manual", { ids: S.pick[d.apply]?.sel || [], note: S.pick[d.apply]?.note });
  if (d.pickclear) { S.pick[d.pickclear].sel = []; return refreshPicker(d.pickclear); }
});

// Horizon resizable pane: drag the handle between record tabs and the contextual side bar
let drag = null;
document.addEventListener("pointerdown", e => {
  const h = e.target.closest("[data-resize]"); if (!h) return;
  const pane = h.closest(".rpane"); drag = { pane, x: e.clientX, w: W().side.w }; h.setPointerCapture?.(e.pointerId); e.preventDefault();
});
document.addEventListener("pointermove", e => {
  if (!drag) return;
  const max = Math.max(300, drag.pane.clientWidth - 360), w = Math.max(300, Math.min(max, drag.w + (drag.x - e.clientX)));
  W().side.w = Math.round(w); drag.pane.style.setProperty("--side-w", `${W().side.w}px`);
});
document.addEventListener("pointerup", () => { drag = null; });

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const tr = e.target.closest("tr[data-open], tr[data-ticket]"); if (!tr || e.target !== tr) return;
  e.preventDefault(); tr.click();
});

document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "notesToggle") { S.ui.notes = el.checked; return render(); }
  if (el.dataset.linkctr) { const tab = W().tabs.find(x => x.key === el.dataset.linkctr); if (tab) tab.linkCtr = el.value || null; return; }
  if (el.id === "bsuAcct") { Object.assign(S.bsu, { acctId: el.value, text: "", fileName: "", parsed: null, error: "" }); return render(); }
  if (el.id === "bsuDate") { S.bsu.date = el.value; parseCurrent(); return render(); }
  if (el.id === "bsuFile") { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.bsu.text = String(r.result); S.bsu.fileName = f.name; parseCurrent(); render(); }; r.readAsText(f); el.value = ""; return; }
  if (el.id === "pfAttach") { P().draft.attachments.push(...[...el.files].map(f => f.name)); return render(); }
  if (el.id === "pfBulk") { const d = P().draft; d.docBulk = [...(d.docBulk || []), ...[...el.files].map(f => f.name)]; return render(); }
  const cb = el.closest("[data-pick]");
  if (cb) { const pk = S.pick[cb.dataset.pick]; if (!pk) return;
    pk.sel = cb.checked ? [...pk.sel.filter(x => x !== cb.value), cb.value] : pk.sel.filter(x => x !== cb.value);
    cb.closest(".cand")?.classList.toggle("on", cb.checked); return refreshPicker(cb.dataset.pick, "preview"); }
  // portal AR form: billing line item fields
  if (el.closest("#arForm") && el.name?.startsWith("item:")) { const [, i, k] = el.name.split(":"); P().draft.items[+i][k] = coerce("items", k, el); return itemUpdated(el, +i); }
  if (el.closest("#arForm") && el.name?.startsWith("crow:")) { const [, t, i, k] = el.name.split(":"); P().draft[t][+i][k] = t && TABLES[t].fields.find(x => x.key === k)?.type === "Integer" ? (el.value === "" ? 0 : Math.trunc(+el.value)) : coerce(t, k, el); return colRowUpdated(el, t); }
  // portal AR form: dependent fields re-render
  if (el.closest("#arForm") && el.name) {
    const d = P().draft; d[el.name] = coerce("requests", el.name, el);
    if (el.name === "customerId" && d.contractId && S.contracts.find(k => k.id === d.contractId)?.customerId !== d.customerId) d.contractId = null;
    if (el.name === "contractId" && d.contractId) { const k = S.contracts.find(x => x.id === d.contractId); if (k && !d.customerId) d.customerId = k.customerId; }
    if (el.name === "department" && d.deptSubBu && !d.deptSubBu.startsWith(String(d.department).slice(0, 3).toUpperCase())) d.deptSubBu = "";
    if (el.name === "contractId" || el.name === "department") contractChanged(d);
    if (el.name === "needItems" && d.needItems === "yes" && !(d.items || []).length) d.items = [{ amount: 0, lpiRate: 0, accountCode: "" }];
    clearHidden("requests", d);
    if (el.tagName === "SELECT" || ["checkbox", "radio", "file"].includes(el.type)) { const now = validateARi(d); for (const k of Object.keys(P().errors)) if (!now[k]) delete P().errors[k]; return render(); }
    portalFieldUpdated(el); return invUpdated();
  }
  // workspace record form: refilter dependent references
  const rf = el.closest("[data-rform]");
  if (rf && el.name) {
    const tab = W().tabs.find(x => x.key === rf.dataset.rform); if (!tab) return;
    (tab.vals ||= {})[el.name] = coerce(tab.table, el.name, el);
    if (el.name === "linkCustomer") { const cur = tab.vals.linkContract ?? recById(tab.table, tab.id)?.linkContract; if (cur && S.contracts.find(k => k.id === cur)?.customerId !== tab.vals.linkCustomer) tab.vals.linkContract = null; render(); }
    if (el.name === "customerId") { const cur = tab.vals.contractId ?? recById(tab.table, tab.id)?.contractId; if (cur && S.contracts.find(k => k.id === cur)?.customerId !== tab.vals.customerId) tab.vals.contractId = null; render(); }
    // UI policy: a parent of showIf fields changed → blank the now-hidden children and redraw
    if (TABLES[tab.table].fields.some(f => f.choiceDependsOn === el.name)) {
      for (const f of TABLES[tab.table].fields.filter(x => x.choiceDependsOn === el.name)) { const cur = tab.vals[f.key] ?? recById(tab.table, tab.id)?.[f.key]; if (cur && !f.choices.some(c => c[0] === cur && c[2] === el.value)) tab.vals[f.key] = ""; }
      render();
    }
    if (TABLES[tab.table].fields.some(f => f.showIf?.key === el.name)) {
      const merged = { ...(tab.id.startsWith("new") ? {} : recById(tab.table, tab.id)), ...tab.vals };
      for (const k of clearHidden(tab.table, merged)) tab.vals[k] = "";
      for (const f of TABLES[tab.table].fields) if (f.showIf && !fieldVisible(tab.table, f, merged) && recById(tab.table, tab.id)?.[f.key]) tab.vals[f.key] = "";
      render();
    }
  }
});

document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "listQ") { W().q = el.value; const m = W().main; const { rows, html } = listRows(m.table, m.filter); $("listBody").innerHTML = html; $("listCount").textContent = rows.length; return; }
  if (el.dataset.composer) { const c = W().composer[el.dataset.composer] ||= { kind: "work_note", text: "" }; c.text = el.value; return; }
  if (el.dataset.pickq && S.pick[el.dataset.pickq]) { S.pick[el.dataset.pickq].q = el.value; return refreshPicker(el.dataset.pickq, "list"); }
  if (el.dataset.picknote && S.pick[el.dataset.picknote]) { S.pick[el.dataset.picknote].note = el.value; return; }
  if (el.id === "pfCustQ") { P().draft.custQ = el.value; const n = $("pfCustResults"); if (n) n.outerHTML = custResults(P().draft); return; }
  if (el.closest("#arForm") && el.name?.startsWith("item:")) { const [, i, k] = el.name.split(":"); P().draft.items[+i][k] = coerce("items", k, el); return itemUpdated(el, +i); }
  if (el.closest("#arForm") && el.name?.startsWith("crow:")) { const [, t, i, k] = el.name.split(":"); P().draft[t][+i][k] = t && TABLES[t].fields.find(x => x.key === k)?.type === "Integer" ? (el.value === "" ? 0 : Math.trunc(+el.value)) : coerce(t, k, el); return colRowUpdated(el, t); }
  if (el.closest("#arForm") && el.name && el.tagName !== "SELECT") { P().draft[el.name] = coerce("requests", el.name, el); portalFieldUpdated(el); return invUpdated(); }
  const rf = el.closest("[data-rform]");
  if (rf && el.name && el.tagName !== "SELECT") { const tab = W().tabs.find(x => x.key === rf.dataset.rform); if (tab) (tab.vals ||= {})[el.name] = coerce(tab.table, el.name, el); }
});

document.addEventListener("submit", e => {
  const f = e.target; e.preventDefault();
  if (f.id === "wsSearch") return wsSearch($("wsQ").value);
  if (f.id === "ptSearch") {
    const q = $("ptQ").value.trim().toLowerCase(); if (!q) return;
    const hit = S.requests.filter(r => r.requestedBy === me().id).find(r => [r.number, r.title, S.customers.find(c => c.id === r.customerId)?.name].join(" ").toLowerCase().includes(q));
    if (hit) { P().page = "ticket"; P().id = hit.id; return render(); }
    return toast(`None of your requests match "${q}".`);
  }
  if (f.id === "arForm") {
    const d = P().draft, errors = validateARi(d);
    if (Object.keys(errors).length) { P().errors = errors; render(); return (document.querySelector("#arForm [aria-invalid], #arForm .has-err input, #arForm .has-err .btn"))?.focus(); }
    if (d.form === "COL") {                       // Collections (D30): the tile is not stored on the case
      const { custQ, tile, ...vals } = d;
      const r = createRequest(vals); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
      render(); return window.scrollTo(0, 0);
    }
    if (d.form === "AR-ix") {
      const { custQ, applicantPrefilled, ...vals } = d;
      vals.newCtrRef = ""; if (vals.contractOption !== "existing") vals.contractId = null;   // AR-ix decision 25: no new-contract reference on AR-ix
      if (vals.newCustomer) vals.customerId = null; else vals.newCustName = "";
      const r = createRequest(vals); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
      render(); return window.scrollTo(0, 0);
    }
    const { custQ, billToPrefilled, attnPrefilled, ...vals } = d;
    if (vals.needItems !== "yes") vals.items = [];
    if (!needBillTo(vals)) Object.assign(vals, { billToName: "", billToEmail: "", billToPhone: "", billToAddress: "" });
    if (vals.contractOption !== "new") Object.assign(vals, { newCtrType: "", newCtrNumber: "", newCtrRef: "", newCtrPo: "", newCtrTitle: "", newCtrStart: "", newCtrEnd: "", newCtrValue: 0, newCtrCycle: "", newCtrCycleOther: "",
      newCtrInvDate: "", newCtrTerms: "", newCtrTermsOther: "", newCtrProrate: "", newCtrProFirst: 0, newCtrProLast: 0, typeOfBilling: "", docBulk: [] });
    if (vals.contractOption !== "existing") vals.contractId = null;
    if (vals.newCustomer) vals.customerId = null; else { vals.newCustName = ""; vals.newCustUen = ""; vals.newCustAddress = ""; }
    const r = createRequest(vals); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
    render(); return window.scrollTo(0, 0);
  }
});

// boot: read the URL first (the first render rewrites nothing until the router starts), then route once the CSV cases are in
const initialHash = location.hash;
loadSample().then(() => startRouter(render, toast, initialHash));
window.addEventListener("resize", syncBarHeight);
