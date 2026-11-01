// Entry point: wires DOM events and boots the app with sample data.
import { exportCSV, importCSV, setTarget } from "./io.js";
import { act, runMatching } from "./matching.js";
import { loadSample } from "./sample-data.js";
import { $, S } from "./state.js";
import { render } from "./views/cash.js";
import { renderCustomers, submitForm } from "./views/customers.js";
import { refreshPicker } from "./views/finder.js";
import { setView } from "./views/shell.js";

$("runBtn").onclick = runMatching;
$("sampleBtn").onclick = loadSample;
$("clearBtn").onclick = () => { S.customers = []; S.contracts = []; S.selCust = null; S.form = null; S.invoices = []; S.payments = []; S.matches = {}; S.pick = {}; S.isSample = false; $("status").hidden = true; render(); };
$("acceptHighBtn").onclick = () => { for (const m of Object.values(S.matches)) if (m?.status === "proposed" && m.confidence >= .95) m.status = "accepted"; render(); };
$("exportBtn").onclick = exportCSV;
$("importToggle").onclick = () => { const p = $("importPanel"); p.hidden = !p.hidden; $("importToggle").setAttribute("aria-expanded", String(!p.hidden)); };
$("tgtInv").onclick = () => setTarget("inv"); $("tgtPay").onclick = () => setTarget("pay");
$("importBtn").onclick = importCSV;
$("fileIn").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $("importText").value = String(r.result); }; r.readAsText(f); e.target.value = ""; };
$("status").addEventListener("click", e => { if (e.target.id === "dismissBtn") $("status").hidden = true; });
document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { S.filter = b.dataset.f; document.querySelectorAll("[data-f]").forEach(x => x.setAttribute("aria-pressed", x === b)); render(); });
$("payList").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (b) { act(b.dataset.id, b.dataset.act); return; }
  const o = e.target.closest("[data-pickopen]");
  if (o) { const pid = o.dataset.pickopen; const pk = S.pick[pid];
    if (pk && pk.open) delete S.pick[pid]; else S.pick[pid] = { open: true, q: "", sel: [], note: "" };
    render(); if (S.pick[pid]) document.getElementById("pkq-" + pid)?.focus(); return; }
  const a = e.target.closest("[data-apply]");
  if (a) { const pid = a.dataset.apply; act(pid, "manual", { ids: S.pick[pid]?.sel || [], note: S.pick[pid]?.note }); return; }
  const c = e.target.closest("[data-pickclear]");
  if (c) { const pid = c.dataset.pickclear; S.pick[pid].sel = []; refreshPicker(pid); }
});
$("payList").addEventListener("change", e => {
  const cb = e.target.closest("[data-pick]"); if (!cb) return;
  const pk = S.pick[cb.dataset.pick]; if (!pk) return;
  pk.sel = cb.checked ? [...pk.sel.filter(x => x !== cb.value), cb.value] : pk.sel.filter(x => x !== cb.value);
  cb.closest(".cand")?.classList.toggle("on", cb.checked);
  refreshPicker(cb.dataset.pick, "preview");
});
document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => setView(b.dataset.view));
$("newCustBtn").onclick = () => { S.form = { kind: "customer" }; render(); $("f-customer-name")?.focus(); };
$("custQ").addEventListener("input", e => { S.custQ = e.target.value; renderCustomers(); });
$("invBody").addEventListener("click", e => { const b = e.target.closest("[data-gocust]"); if (b && b.dataset.gocust) { S.selCust = b.dataset.gocust; S.form = null; setView("customers"); window.scrollTo({ top: 0 }); } });
$("custRows").addEventListener("click", e => { const b = e.target.closest("[data-cust]"); if (b) { S.selCust = b.dataset.cust; S.form = null; renderCustomers(); } });
$("custDetail").addEventListener("click", e => {
  const b = e.target.closest("[data-cact]"); if (!b) return;
  const a = b.dataset.cact, id = b.dataset.id;
  if (a === "cancel") S.form = null;
  if (a === "editcust") S.form = { kind: "customer", id: S.selCust };
  if (a === "newctr") S.form = { kind: "contract" };
  if (a === "editctr") S.form = { kind: "contract", id };
  if (a === "newinv") S.form = { kind: "invoice", parentId: id };
  renderCustomers();
  if (S.form) $("custDetail").querySelector(".eform input, .eform select")?.focus();
});
$("custDetail").addEventListener("submit", e => { const f = e.target.closest("[data-form]"); if (f) { e.preventDefault(); submitForm(f); } });
$("payList").addEventListener("input", e => {
  const q = e.target.closest("[data-pickq]"); if (q && S.pick[q.dataset.pickq]) { S.pick[q.dataset.pickq].q = q.value; refreshPicker(q.dataset.pickq, "list"); return; }
  const n = e.target.closest("[data-picknote]"); if (n && S.pick[n.dataset.picknote]) S.pick[n.dataset.picknote].note = n.value;
});

// boot
setTarget("inv");
loadSample();
render();
