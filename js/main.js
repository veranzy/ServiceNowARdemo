// Entry point: delegated event handling for the demo bar, workspace and portal, then boot.
import { acctById, parseStatement, sampleCSV, saveUpload } from "./bsu.js";
import { exportCSV } from "./io.js";
import { act } from "./matching.js";
import { cancelInvoice, createRequest, issueInvoice, journal, me, portalComment, recById, requestAction, saveRecord, validate } from "./records.js";
import { loadSample } from "./sample-data.js";
import { TABLES } from "./schema.js";
import { $, S } from "./state.js";
import { cents, uid } from "./util.js";
import { render, setStatus, toast } from "./views/app.js";
import { refreshPicker } from "./views/finder.js";
import { contractBox, formAlert, formSide } from "./views/portal.js";
import { listRows } from "./views/workspace.js";

const W = () => S.ui.ws, P = () => S.ui.portal;
const activeTab = () => W().tabs.find(t => t.key === W().active);

// ---------- workspace navigation ----------
function openTab(table, id) {
  if (S.ui.persona === "project") { if (table === "requests") { P().page = "ticket"; P().id = id; } return render(); }
  const key = `${table}:${id}`;
  if (!W().tabs.some(t => t.key === key)) W().tabs.push({ key, table, id });
  W().active = key;
  if (window.innerWidth < 900) W().listMenu = false;
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
function showMain(main) { W().main = main; W().active = "main"; W().q = ""; if (window.innerWidth < 900) W().listMenu = false; render(); window.scrollTo(0, 0); }

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
    const text = W().composer[tab.id]?.kind === "comment" ? W().composer[tab.id].text : "";
    const res = requestAction(tab.id, name, text);
    if (typeof res === "string") { tab.msg = { kind: "err", text: res + (name === "info" || name === "reject" ? " (Switch the composer to Additional comment.)" : "") }; return render(); }
    if (res?.opened) { toast(`Draft invoice ${res.opened.number} created.`); return openTab("invoices", res.opened.id); }
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
  for (const t of ["requests", "invoices", "deposits", "contracts"]) {
    const hit = S[t].find(r => String(r.number || "").toLowerCase() === q) || S[t].find(r => String(r.number || "").toLowerCase().includes(q));
    if (hit) return openTab(t, hit.id);
  }
  const c = S.customers.find(x => x.name.toLowerCase().includes(q)); if (c) return openTab("customers", c.id);
  toast(`No record matches "${q}".`);
}

// ---------- form value capture ----------
function coerce(table, key, el) {
  const f = TABLES[table].fields.find(x => x.key === key); if (!f) return el.value;
  if (f.type === "Currency") return el.value === "" ? 0 : cents(el.value);
  if (f.type === "Integer" || f.type === "Decimal") return el.value === "" ? 0 : Number(el.value);
  if (key === "aliases") return el.value.split(",").map(s => s.trim()).filter(Boolean);
  if (f.type === "Reference") return el.value || null;
  return el.value;
}
const BILLING_MAP = { Monthly: "Monthly fee", Milestone: "Milestone", "Time & materials": "Time & materials" };

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
  if (d.pnav) { P().page = d.pnav; P().errors = {}; render(); return window.scrollTo(0, 0); }
  if (d.ticket) { P().page = "ticket"; P().id = d.ticket; render(); return window.scrollTo(0, 0); }
  if (d.preply) { const err = portalComment(d.preply, $("ptReply")?.value); if (err) return toast(err); toast("Comment sent to Accounts Receivable."); return render(); }
  if (d.unattach !== undefined) { P().draft.attachments.splice(+d.unattach, 1); return render(); }
  // workspace navigation
  if (d.rail) {
    if (d.rail === "list") { W().listMenu = !W().listMenu; if (W().main.kind !== "list") W().main = { kind: "list", table: "requests", filter: "open" }; W().active = "main"; return render(); }
    if (d.rail === "closelists") { W().listMenu = false; return render(); }
    W().listMenu = false; return showMain({ kind: d.rail });
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
  if (d.matchdep) { S.pick[d.matchdep] = { open: true, q: "", sel: [], note: "" }; S.filter = "open"; showMain({ kind: "cash" }); return document.querySelector(`[data-pickopen="${d.matchdep}"]`)?.scrollIntoView({ block: "start" }); }
  if (t.id === "exportBtn") return exportCSV();
  if (t.id === "dismissBtn") { setStatus(); return render(); }
  if (d.f) { S.filter = d.f; return render(); }
  if (d.act) return act(d.id, d.act);
  if (d.pickopen) { const pid = d.pickopen; if (S.pick[pid]?.open) delete S.pick[pid]; else S.pick[pid] = { open: true, q: "", sel: [], note: "" }; render(); return S.pick[pid] && $("pkq-" + pid)?.focus(); }
  if (d.apply) return act(d.apply, "manual", { ids: S.pick[d.apply]?.sel || [], note: S.pick[d.apply]?.note });
  if (d.pickclear) { S.pick[d.pickclear].sel = []; return refreshPicker(d.pickclear); }
});

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const tr = e.target.closest("tr[data-open], tr[data-ticket]"); if (!tr || e.target !== tr) return;
  e.preventDefault(); tr.click();
});

document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "notesToggle") { S.ui.notes = el.checked; return render(); }
  if (el.id === "bsuAcct") { Object.assign(S.bsu, { acctId: el.value, text: "", fileName: "", parsed: null, error: "" }); return render(); }
  if (el.id === "bsuDate") { S.bsu.date = el.value; parseCurrent(); return render(); }
  if (el.id === "bsuFile") { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { S.bsu.text = String(r.result); S.bsu.fileName = f.name; parseCurrent(); render(); }; r.readAsText(f); el.value = ""; return; }
  if (el.id === "pfAttach") { P().draft.attachments.push(...[...el.files].map(f => f.name)); return render(); }
  const cb = el.closest("[data-pick]");
  if (cb) { const pk = S.pick[cb.dataset.pick]; if (!pk) return;
    pk.sel = cb.checked ? [...pk.sel.filter(x => x !== cb.value), cb.value] : pk.sel.filter(x => x !== cb.value);
    cb.closest(".cand")?.classList.toggle("on", cb.checked); return refreshPicker(cb.dataset.pick, "preview"); }
  // portal AR form: dependent fields re-render
  if (el.closest("#arForm") && el.name) {
    const d = P().draft; d[el.name] = coerce("requests", el.name, el);
    if (el.name === "customerId" && d.contractId && S.contracts.find(k => k.id === d.contractId)?.customerId !== d.customerId) d.contractId = null;
    if (el.name === "contractId" && d.contractId) { const k = S.contracts.find(x => x.id === d.contractId); if (k && !d.billingType) d.billingType = BILLING_MAP[k.billing] || "Other"; if (k && !d.customerId) d.customerId = k.customerId; }
    if (el.tagName === "SELECT") { const now = validate("requests", d); for (const k of Object.keys(P().errors)) if (!now[k]) delete P().errors[k]; return render(); }
    portalFieldUpdated(el);
    if (el.name === "amount") { const box = document.querySelector(".pt-info"); if (box) box.outerHTML = contractBox(d); }
    return;
  }
  // workspace record form: refilter dependent references
  const rf = el.closest("[data-rform]");
  if (rf && el.name) {
    const tab = W().tabs.find(x => x.key === rf.dataset.rform); if (!tab) return;
    (tab.vals ||= {})[el.name] = coerce(tab.table, el.name, el);
    if (el.name === "customerId") { const cur = tab.vals.contractId ?? recById(tab.table, tab.id)?.contractId; if (cur && S.contracts.find(k => k.id === cur)?.customerId !== tab.vals.customerId) tab.vals.contractId = null; render(); }
  }
});

document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "listQ") { W().q = el.value; const m = W().main; const { rows, html } = listRows(m.table, m.filter); $("listBody").innerHTML = html; $("listCount").textContent = rows.length; return; }
  if (el.dataset.composer) { const c = W().composer[el.dataset.composer] ||= { kind: "work_note", text: "" }; c.text = el.value; return; }
  if (el.dataset.pickq && S.pick[el.dataset.pickq]) { S.pick[el.dataset.pickq].q = el.value; return refreshPicker(el.dataset.pickq, "list"); }
  if (el.dataset.picknote && S.pick[el.dataset.picknote]) { S.pick[el.dataset.picknote].note = el.value; return; }
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
    const d = P().draft, errors = validate("requests", d);
    if (Object.keys(errors).length) { P().errors = errors; render(); return document.querySelector("#arForm [aria-invalid]")?.focus(); }
    const r = createRequest({ ...d }); P().draft = null; P().errors = {}; P().page = "confirm"; P().id = r.id;
    render(); return window.scrollTo(0, 0);
  }
});

// boot
loadSample();
