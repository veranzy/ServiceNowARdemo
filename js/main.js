// Entry point: delegated event handling for the demo bar, workspace and portal, then boot.
import { acctById, parseStatement, sampleCSV, saveUpload } from "./bsu.js";
import { exportCSV } from "./io.js";
import { act } from "./matching.js";
import { applyGiro, cancelInvoice, createRequest, linkContract, issueInvoice, journal, lineInvoice, linkCustomer, me, needBillTo, needLocation, portalComment, prefillBillTo, raiseInvoice, recById, requestAction, saveRecord, setupSchedule, validateARi } from "./records.js";
import { loadSample } from "./sample-data.js";
import { TABLES, clearHidden, fieldVisible } from "./schema.js";
import { $, S } from "./state.js";
import { cents, uid } from "./util.js";
import { render, setStatus, toast } from "./views/app.js";
import { initDevNotes } from "./views/devnotes.js";
import { refreshPicker } from "./views/finder.js";
import { contractBox, custResults, formAlert, formSide, lineSum, linesTotals } from "./views/portal.js";
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
  W().tabs.push({ key, table, id, draft: {}, vals: prefill ? { ...prefill } : {} });
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
  if (tab.table === "requests" && name === "linkctr") {
    const err = linkContract(tab.id, tab.linkCtr || null); tab.linkCtr = null;
    if (err) { tab.msg = { kind: "err", text: err }; return render(); }
    toast("GIRO request linked to the contract."); return render();
  }
  if (tab.table === "requests" && (name === "giroadd" || name === "giroremove")) {
    const err = applyGiro(tab.id);
    if (err) { tab.msg = { kind: "err", text: err }; return render(); }
    toast(name === "giroadd" ? "GIRO activated on the contract. Case completed." : "GIRO removed from the contract. Case completed."); return render();
  }
  if (tab.table === "requests" && name === "link") {
    const err = linkCustomer(tab.id, tab.linkTo || null); tab.linkTo = null;
    if (err) { tab.msg = { kind: "err", text: err }; return render(); }
    toast("Linked to the customer: billing contact and documents filed on the customer record."); return render();
  }
  if (tab.table === "requests") {
    const text = W().composer[tab.id]?.kind === "comment" ? W().composer[tab.id].text : "";
    const res = requestAction(tab.id, name, text);
    if (typeof res === "string") { tab.msg = { kind: "err", text: res + (name === "info" || name === "reject" ? " (Switch the composer to Additional comment.)" : "") }; return render(); }
    toast({ assign: "Assigned to you.", info: "Sent to the requester. State is now Awaiting info.", reject: "Request rejected." }[name] || "Done.");
  }
  if (tab.table === "invoices") {
    const err = name === "issue" ? issueInvoice(tab.id) : name === "cancel" ? cancelInvoice(tab.id) : null;
    if (err) { tab.msg = { kind: "err", text: err }; return render(); }
    toast(name === "issue" ? "Invoice issued. The AR request is now Invoiced." : "Invoice cancelled.");
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
  const side = $("pfSide"); if (side) side.innerHTML = formSide(P().draft);
}

/** AR-i contract step changed: drop a prefilled bill-to (it belonged to the previous choice) and prefill again. */
function contractChanged(d) {
  if (d.form === "AR-ix") {
    // AR-ix: the applicant is prefilled from the contract's bill-to (cleared again when the contract changes)
    if (d.applicantPrefilled) { Object.assign(d, { applicantName: "", applicantEmail: "", applicantMobile: "" }); delete d.applicantPrefilled; }
    const k = d.contractOption === "existing" && d.contractId ? S.contracts.find(x => x.id === d.contractId) : null;
    if (k?.billToName && !d.applicantName && !d.applicantEmail) Object.assign(d, { applicantName: k.billToName, applicantEmail: k.billToEmail || "", applicantMobile: k.billToPhone || "", applicantPrefilled: true });
    const now = validateARi(d); for (const key of Object.keys(P().errors)) if (!now[key]) delete P().errors[key];
    return;
  }
  if (d.billToPrefilled) { Object.assign(d, { billToName: "", billToEmail: "", billToPhone: "", billToAddress: "" }); delete d.billToPrefilled; }
  d.updateBillTo = false; prefillBillTo(d);
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
    return render();
  }
}

/** Billing line typed into: refresh its summary, the totals, contract box and sidebar in place. */
function lineUpdated(el, i) {
  const d = P().draft, swap = (id, html) => { const n = $(id) || document.querySelector(id); if (n) n.outerHTML = html; };
  portalFieldUpdated(el);
  swap(`pfLineSum-${i}`, lineSum(d.lines[i], i)); swap("pfTotals", linesTotals(d));
  const box = document.querySelector(".pt-info.ctr-box"); if (box) box.outerHTML = contractBox(d);
}

// ---------- events ----------
// Build notes: Alt/Option+click an outlined element copies "<ID> - " so the owner can paste a change request.
document.addEventListener("click", e => {
  if (!(S.ui.notes || S.ui.dev) || !e.altKey) return;
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
  if (t.id === "devRestore") { S.ui.devDismissed.clear(); return render(); }
  if (t.id === "resetDemo") { loadSample(); toast("Demo data reset."); return render(); }
  // portal
  if (d.pnav) { if (d.pnav === "form") P().formCode = d.form || "AR-i"; P().page = d.pnav; if (d.pnav !== "form") P().errors = {}; render(); return window.scrollTo(0, 0); }
  if (d.ticket) { P().page = "ticket"; P().id = d.ticket; render(); return window.scrollTo(0, 0); }
  if (d.preply) { const err = portalComment(d.preply, $("ptReply")?.value); if (err) return toast(err); toast("Comment sent to Accounts Receivable."); return render(); }
  if (d.undoc) { P().draft[d.undoc] = ""; return render(); }
  // AR-i customer step (D14)
  if (d.pickcust) { Object.assign(P().draft, { customerId: d.pickcust, newCustomer: false }); resetContract(P().draft); delete P().errors.customerId; return render(); }
  if (d.newcust !== undefined) { const dr = P().draft; Object.assign(dr, { newCustomer: true, newCustName: dr.custQ || "", customerId: null }); resetContract(dr); delete P().errors.customerId; render(); return $("pf-newCustUen")?.focus(); }
  if (d.custclear !== undefined) { Object.assign(P().draft, { customerId: null, newCustomer: false }); resetContract(P().draft); render(); return $("pfCustQ")?.focus(); }
  // AR-i contract step (D15)
  if (d.ctropt) { const dr = P().draft; dr.contractOption = d.ctropt; if (d.ctropt !== "existing") dr.contractId = null; contractChanged(dr); delete P().errors.contractOption; render();
    return (d.ctropt === "existing" ? $("pf-contractId") : d.ctropt === "new" ? $("pf-newCtrRef") : null)?.focus(); }
  // AR-i billing lines (D13)
  if (d.ladd) { P().draft.lines.push({ lineType: d.ladd, desc: "", amount: 0, invoiceDate: "", frequency: "monthly", startDate: "", endDate: "" }); delete P().errors.lines; render(); return $(`pl${P().draft.lines.length - 1}-desc`)?.focus(); }
  if (d.lremove !== undefined) { P().draft.lines.splice(+d.lremove, 1); P().errors = Object.fromEntries(Object.entries(P().errors).filter(([k]) => !k.startsWith("line:"))); return render(); }
  if (d.ltype) { const [i, type] = d.ltype.split(":"), l = P().draft.lines[+i]; l.lineType = type; if (type === "recurring" && !l.frequency) l.frequency = "monthly";
    P().errors = Object.fromEntries(Object.entries(P().errors).filter(([k]) => !k.startsWith(`line:${i}:`))); return render(); }
  if (d.unattach !== undefined) { P().draft.attachments.splice(+d.unattach, 1); return render(); }
  // workspace navigation
  if (d.rail) {
    if (d.rail === "list") { if (W().main.kind === "list") { W().active = "main"; return render(); } return showMain({ kind: "list", table: "requests", filter: "open" }); }
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
  if (d.tab) { W().active = d.tab; render(); return window.scrollTo(0, 0); }
  if (d.closetab) return closeTab(d.closetab);
  if (d.new) return newTab(d.new, d.prefillCustomer ? { customerId: d.prefillCustomer } : null);
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
  if (d.raise) { const [sid, date] = d.raise.split("|"); const res = raiseInvoice(sid, date); if (typeof res === "string") return toast(res); toast(`Draft invoice ${res.opened.number} raised for ${date}.`); return openTab("invoices", res.opened.id); }
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
  if (el.id === "devToggle") { S.ui.dev = el.checked; return render(); }
  if (el.dataset.linkctr) { const tab = W().tabs.find(x => x.key === el.dataset.linkctr); if (tab) tab.linkCtr = el.value || null; return; }
  if (el.dataset.linkto) { const tab = W().tabs.find(x => x.key === el.dataset.linkto); if (tab) tab.linkTo = el.value || null; return; }
  if (el.id === "bsuAcct") { Object.assign(S.bsu, { acctId: el.value, text: "", fileName: "", parsed: null, error: "" }); return render(); }
  if (el.id === "bsuDate") { S.bsu.date = el.value; parseCurrent(); return render(); }
  if (el.id === "bsuFile") { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.bsu.text = String(r.result); S.bsu.fileName = f.name; parseCurrent(); render(); }; r.readAsText(f); el.value = ""; return; }
  if (el.id === "pfAttach") { P().draft.attachments.push(...[...el.files].map(f => f.name)); return render(); }
  const cb = el.closest("[data-pick]");
  if (cb) { const pk = S.pick[cb.dataset.pick]; if (!pk) return;
    pk.sel = cb.checked ? [...pk.sel.filter(x => x !== cb.value), cb.value] : pk.sel.filter(x => x !== cb.value);
    cb.closest(".cand")?.classList.toggle("on", cb.checked); return refreshPicker(cb.dataset.pick, "preview"); }
  // portal AR form: billing line fields
  if (el.closest("#arForm") && el.name?.startsWith("line:")) {
    const d = P().draft, [, i, k] = el.name.split(":"); d.lines[+i][k] = coerce("lines", k, el);
    if (el.tagName === "SELECT") return render();
    return lineUpdated(el, +i);
  }
  // portal AR form: dependent fields re-render
  if (el.closest("#arForm") && el.name) {
    const d = P().draft; d[el.name] = coerce("requests", el.name, el);
    if (el.name === "customerId" && d.contractId && S.contracts.find(k => k.id === d.contractId)?.customerId !== d.customerId) d.contractId = null;
    if (el.name === "contractId" && d.contractId) { const k = S.contracts.find(x => x.id === d.contractId); if (k && !d.customerId) d.customerId = k.customerId; }
    if (el.name === "contractLocation" && !["repository", "physical"].includes(d.contractLocation)) d.contractLocationRef = "";
    if (el.name === "contractId" || el.name === "department") contractChanged(d);
    clearHidden("requests", d);
    if (el.tagName === "SELECT" || ["checkbox", "radio", "file"].includes(el.type)) { const now = validateARi(d); for (const k of Object.keys(P().errors)) if (!now[k]) delete P().errors[k]; return render(); }
    return portalFieldUpdated(el);
  }
  // workspace record form: refilter dependent references
  const rf = el.closest("[data-rform]");
  if (rf && el.name) {
    const tab = W().tabs.find(x => x.key === rf.dataset.rform); if (!tab) return;
    (tab.vals ||= {})[el.name] = coerce(tab.table, el.name, el);
    if (el.name === "customerId") { const cur = tab.vals.contractId ?? recById(tab.table, tab.id)?.contractId; if (cur && S.contracts.find(k => k.id === cur)?.customerId !== tab.vals.customerId) tab.vals.contractId = null; render(); }
    // UI policy: a parent of showIf fields changed → blank the now-hidden children and redraw
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
  if (el.closest("#arForm") && el.name?.startsWith("line:") && el.tagName !== "SELECT") { const [, i, k] = el.name.split(":"); P().draft.lines[+i][k] = coerce("lines", k, el); return lineUpdated(el, +i); }
  if (el.closest("#arForm") && el.name && el.tagName !== "SELECT") { P().draft[el.name] = coerce("requests", el.name, el); return portalFieldUpdated(el); }
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
    if (d.form === "AR-ix") {
      const { custQ, applicantPrefilled, ...vals } = d;
      if (vals.contractOption !== "new") vals.newCtrRef = ""; if (vals.contractOption !== "existing") vals.contractId = null;
      if (vals.newCustomer) vals.customerId = null; else vals.newCustName = "";
      const r = createRequest(vals); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
      render(); return window.scrollTo(0, 0);
    }
    const { custQ, billToPrefilled, ...vals } = d;
    if (!needBillTo(vals)) Object.assign(vals, { billToName: "", billToEmail: "", billToPhone: "", billToAddress: "", updateBillTo: false });
    if (vals.contractOption !== "new") Object.assign(vals, { newCtrRef: "", newCtrTitle: "", newCtrStart: "", newCtrEnd: "", newCtrValue: 0 });
    if (vals.contractOption !== "existing") vals.contractId = null;
    if (!needLocation(vals)) Object.assign(vals, { contractLocation: "", contractLocationRef: "" });
    if (vals.newCustomer) vals.customerId = null; else { vals.newCustName = ""; vals.newCustUen = ""; vals.newCustAddress = ""; }
    const r = createRequest(vals); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
    render(); return window.scrollTo(0, 0);
  }
});

// boot
loadSample();
initDevNotes();
document.addEventListener("sn:dismissed", () => render());
