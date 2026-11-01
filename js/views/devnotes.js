// ServiceNow notes (developer view): one interactive card per element with a build-note ID, drawn on a
// separate layer above the page so no container can clip it. Cards start collapsed (one line), expand on
// click to show the full note, and can be dismissed (× ; "Restore" in the demo bar brings them back).
import { S } from "../state.js";
import { esc } from "../util.js";

let layer = null, frame = 0;
const ui = () => S.ui;

function ensureLayer() {
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "snLayer";
  layer.setAttribute("aria-label", "ServiceNow notes");
  document.body.appendChild(layer);
  layer.addEventListener("click", e => {
    const x = e.target.closest("[data-sndismiss]"), card = e.target.closest(".snc");
    if (!card) return;
    e.stopPropagation(); e.preventDefault();
    const id = card.dataset.for;
    if (x) { ui().devDismissed.add(id); ui().devOpen.delete(id); document.dispatchEvent(new CustomEvent("sn:dismissed")); }
    else if (ui().devOpen.has(id)) ui().devOpen.delete(id); else ui().devOpen.add(id);
    schedule();
  }, true);
  return layer;
}

function draw() {
  frame = 0;
  const L = ensureLayer();
  if (!ui().dev) { L.innerHTML = ""; L.hidden = true; return; }
  L.hidden = false;
  const seen = new Set(), vw = document.documentElement.clientWidth, sx = window.scrollX, sy = window.scrollY;
  const html = [];
  for (const el of document.querySelectorAll("#app [data-snid]")) {
    const id = el.dataset.snid;
    if (ui().devDismissed.has(id)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    const key = `${id}@${Math.round(r.left)},${Math.round(r.top)}`;
    if (seen.has(key)) continue; seen.add(key);
    const open = ui().devOpen.has(id), compact = el.tagName === "BUTTON";
    const w = open ? Math.min(380, vw - 8) : compact ? Math.min(160, vw - 8) : Math.min(260, vw - 8);
    const left = Math.max(4, Math.min(r.left + sx, sx + vw - w - 4));
    html.push(`<div class="snc${open ? " open" : ""}" data-for="${esc(id)}" style="left:${left}px;top:${r.top + sy - 2}px;max-width:${w}px" title="${open ? "Click to collapse" : "Click to expand"}">
      <span class="snc-t"><b>[${esc(id)}]</b>${compact && !open ? "" : ` ${esc(el.dataset.sn || "")}`}</span>
      <button type="button" class="snc-x" data-sndismiss aria-label="Dismiss note ${esc(id)}">×</button></div>`);
  }
  L.innerHTML = html.join("");
}

export function schedule() { if (!frame) frame = requestAnimationFrame(draw); }

export function initDevNotes() {
  ui().devOpen ||= new Set();
  ui().devDismissed ||= new Set();
  const app = document.getElementById("app");
  new MutationObserver(schedule).observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-snid", "hidden", "open", "class"] });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("toggle", schedule, true);
  schedule();
}
