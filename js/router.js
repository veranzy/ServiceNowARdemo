// Page URLs (UIX decision 14). Every screen has a short hash URL, so Back / Forward, refresh and shared links work.
// The router never changes how a screen behaves: it reads the URL into S.ui (applyRoute) and, after every render,
// writes the current screen back to the URL (syncUrl). Workspace tabs are not part of the URL: a record URL opens
// that record the way a click would.
//
//   #/ws                          workspace landing page
//   #/ws/list/<table>/<filter>    a list, e.g. #/ws/list/requests/open
//   #/ws/bsu   #/ws/cash          bank statement upload, cash application
//   #/ws/<table>/<key>            a record; key = its number (ARQ0001004, HL-2026-01) or, for customers, its name
//   #/portal                      portal home
//   #/portal/forms                AR forms catalogue
//   #/portal/form/<code>          an AR form, e.g. #/portal/form/AR-ix
//   #/portal/requests             My requests
//   #/portal/ticket/<number>      a ticket page (also used after submitting)
import { S } from "./state.js";

const keyOf = (table, r) => r.number || (table === "customers" ? r.name : r.id);
const findRec = (table, key) => (S[table] || []).find(r => keyOf(table, r) === key) || null;
const enc = s => encodeURIComponent(s).replace(/%2F/gi, "/");

let ready = false, applying = false;

/** The URL of the screen currently shown. */
export function routeOf() {
  const u = S.ui;
  if (u.persona === "project") {
    const p = u.portal, r = p.id ? S.requests.find(x => x.id === p.id) : null;
    if (p.page === "forms") return "#/portal/forms";
    if (p.page === "form") return `#/portal/form/${enc(p.formCode || "AR-i")}`;
    if (p.page === "requests") return "#/portal/requests";
    if ((p.page === "ticket" || p.page === "confirm") && r) return `#/portal/ticket/${enc(r.number)}`;
    return "#/portal";
  }
  const w = u.ws, tab = w.active !== "main" ? w.tabs.find(t => t.key === w.active) : null;
  if (tab) {
    const r = (S[tab.table] || []).find(x => x.id === tab.id);
    return r ? `#/ws/${tab.table}/${enc(keyOf(tab.table, r))}` : `#/ws/${tab.table}/new`;
  }
  const m = w.main;
  if (m.kind === "list") return `#/ws/list/${m.table}/${m.filter}`;
  if (m.kind === "bsu" || m.kind === "cash") return `#/ws/${m.kind}`;
  return "#/ws";
}

/** Put the screen named by a URL into S.ui. Returns a message when the URL can't be shown as asked. */
export function applyRoute(hash) {
  const parts = String(hash || "").replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [area, a, b, c] = parts;
  if (area === "portal") {
    S.ui.persona = "project";
    const p = S.ui.portal; p.errors = {};
    if (a === "forms" || a === "requests") { p.page = a; return null; }
    if (a === "form") { p.page = "form"; p.formCode = b === "AR-ix" ? "AR-ix" : "AR-i"; return null; }
    if (a === "ticket") {
      const r = findRec("requests", b);
      if (r) { p.page = "ticket"; p.id = r.id; return null; }
      p.page = "requests"; return `Request ${b || ""} isn't here. Cases raised during a demo last only until the page reloads.`;
    }
    p.page = "home"; return a ? "That page doesn't exist; showing the portal home." : null;
  }
  if (area !== "ws" && area !== undefined) { S.ui.persona = "ar"; S.ui.ws.main = { kind: "home" }; S.ui.ws.active = "main"; return "That page doesn't exist; showing the workspace home."; }
  S.ui.persona = area === "ws" ? "ar" : S.ui.persona;
  const w = S.ui.ws;
  if (!a) { if (area === "ws") { w.main = { kind: "home" }; w.active = "main"; } return null; }
  if (a === "bsu" || a === "cash") { w.main = { kind: a }; w.active = "main"; return null; }
  if (a === "list" && b) { w.main = { kind: "list", table: b, filter: c || "all" }; w.active = "main"; return null; }
  if (b && S[a] && b !== "new") {
    const r = findRec(a, b);
    if (r) {
      const key = `${a}:${r.id}`;
      if (!w.tabs.some(t => t.key === key)) w.tabs.push({ key, table: a, id: r.id });
      w.active = key; return null;
    }
    w.active = "main"; w.main = a === "requests" ? { kind: "list", table: "requests", filter: "open" } : { kind: "list", table: a, filter: "all" };
    return a === "requests" ? `Case ${b} isn't here. Cases raised during a demo last only until the page reloads.` : `Record ${b} wasn't found.`;
  }
  w.active = "main"; return b === "new" ? null : "That page doesn't exist; showing the workspace home.";
}

/** After a render: record the screen in the browser history (a new entry only when the screen changed). */
export function syncUrl() {
  if (!ready || applying) return;
  const h = routeOf();
  if (h !== location.hash) history.pushState(null, "", h);
}

/** Start routing once the data (including the CSV cases) is in. `draw` is render(), `say` shows a toast. */
export function startRouter(draw, say, initialHash) {
  const go = hash => {
    applying = true; const note = applyRoute(hash); draw(); applying = false;
    const h = routeOf();
    if (h !== location.hash) history.replaceState(null, "", h);
    if (note) say(note);
  };
  window.addEventListener("popstate", () => go(location.hash));
  ready = true;
  if (initialHash && initialHash !== "#" && initialHash !== "#/") go(initialHash);
  else history.replaceState(null, "", routeOf());
}
