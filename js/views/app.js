// Top-level render: the demo control bar (not part of the ServiceNow product) and the active persona's UI.
import { auditTick, me } from "../records.js";
import { ROLES } from "../schema.js";
import { $, S } from "../state.js";
import { esc } from "../util.js";
import { portalView } from "./portal.js";
import { workspaceView } from "./workspace.js";

let toastTimer = null;

export function setStatus(kind, text) { S.status = text ? { kind, text } : null; }

export function toast(text) {
  S.ui.toast = text;
  const el = $("toast"); if (el) { el.textContent = text; el.hidden = false; }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.ui.toast = null; const t = $("toast"); if (t) t.hidden = true; }, 3800);
}

function demoBar() {
  const p = S.ui.persona, u = me();
  return `<div class="demobar" role="region" aria-label="Demo controls">
    <span class="db-tag">Prototype</span>
    <div class="seg db-seg" role="group" aria-label="View as">
      <button type="button" data-persona="ar" aria-pressed="${p === "ar"}">AR team · Workspace</button>
      <button type="button" data-persona="project" aria-pressed="${p === "project"}">Project team · Portal</button>
    </div>
    <span class="db-who">Signed in as <b>${esc(u?.name || "")}</b> <span class="db-role mono">${esc(ROLES[p].role)}</span></span>
    <span class="sp"></span>
    <label class="switch" title="Purple ID tags for change requests: write '<ID> - <change>'"><input type="checkbox" id="notesToggle"${S.ui.notes ? " checked" : ""}><span>Show IDs</span></label>
    <label class="switch" title="Developer view: every element labelled with its ServiceNow table, field, UI action or widget"><input type="checkbox" id="devToggle"${S.ui.dev ? " checked" : ""}><span>ServiceNow notes</span></label>
    ${S.ui.dev && S.ui.devDismissed.size ? `<button type="button" class="btn small ghost" id="devRestore">Restore ${S.ui.devDismissed.size} dismissed note${S.ui.devDismissed.size === 1 ? "" : "s"}</button>` : ""}
    ${S.ui.dev ? `<span class="db-hint">Click a note to expand · × to dismiss</span>` : S.ui.notes ? `<span class="db-hint">Alt/Option+click an element to copy its ID</span>` : ""}
    <button type="button" class="btn small ghost" id="resetDemo">Reset demo</button>
  </div>`;
}

export function render() {
  auditTick();
  const root = $("app");
  // keep window scroll stable across re-renders
  const y = window.scrollY, focusId = document.activeElement?.id;
  document.body.classList.toggle("sn-notes", S.ui.notes);
  document.body.classList.toggle("sn-dev", S.ui.dev);
  document.body.dataset.persona = S.ui.persona;
  root.innerHTML = demoBar() + (S.ui.persona === "ar" ? workspaceView() : portalView()) +
    `<div class="toast" id="toast" role="status" aria-live="polite"${S.ui.toast ? "" : " hidden"}>${esc(S.ui.toast || "")}</div>`;
  window.scrollTo(0, y);
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}
