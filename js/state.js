// Single in-memory app state shared by every module, plus a DOM lookup helper.
export const S = {
  // data (tables)
  users: [], customers: [], contracts: [], requests: [], invoices: [], payments: [], matches: {},
  // cash application UI
  pick: {}, filter: "all", target: "pay", busy: false, isSample: false, importText: "", importOpen: false, status: null,
  // shell
  ui: {
    persona: "ar",          // "ar" → workspace, "project" → portal
    notes: false,           // Build notes overlay
    toast: null,
    ws: { main: { kind: "home" }, tabs: [], active: "main", listMenu: false, q: "", composer: {} },
    portal: { page: "home", id: null, draft: null, errors: {} }
  }
};

export const $ = id => document.getElementById(id);
