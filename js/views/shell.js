// Page shell: status banner and tab switching.
import { $, S } from "../state.js";
import { esc } from "../util.js";
import { render } from "./cash.js";

export function setView(v) {
  S.view = v;
  $("cashView").hidden = v !== "cash"; $("custView").hidden = v !== "customers";
  $("tabCash").setAttribute("aria-selected", v === "cash"); $("tabCust").setAttribute("aria-selected", v === "customers");
  render();
}

export function setStatus(kind, text, withStop) {
  const el = $("status"); el.hidden = false; el.className = "notice" + (kind === "run" ? " run" : kind === "err" ? " err" : "");
  el.innerHTML = (kind === "run" ? `<span class="spin" aria-hidden="true"></span>` : "") + `<span class="grow">${esc(text)}</span>` +
    (withStop ? `<button class="btn small" id="stopBtn">Stop</button>` : `<button class="btn small" id="dismissBtn" aria-label="Dismiss">Dismiss</button>`);
}
