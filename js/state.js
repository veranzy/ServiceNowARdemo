// Single in-memory app state shared by every module, plus a DOM lookup helper.
export const S = {
  // data (tables)
  users: [], companies: [], customers: [], contracts: [], requests: [], invoices: [], deposits: [], matches: {}, bankAccounts: [], uploads: [], contacts: [], documents: [], schedules: [], lines: [], items: [], history: [],
  // cash application UI
  pick: {}, filter: "open", status: null,
  // BSU upload page draft
  bsu: { acctId: null, date: "", text: "", fileName: "", parsed: null, error: "" },
  // shell
  ui: {
    persona: "ar",          // "ar" → workspace, "project" → portal
    notes: false,           // ID tags (off by default; "Show IDs" in the demo bar)
    dev: false,             // ServiceNow notes: developer cards ("ServiceNow notes" in the demo bar)
    devOpen: new Set(),     // expanded note cards (by ID)
    devDismissed: new Set(), // dismissed note cards (by ID)
    toast: null,
    ws: { main: { kind: "home" }, tabs: [], active: "main", lmOpen: null, side: { open: true, w: 380 }, q: "", composer: {} },
    portal: { page: "home", id: null, draft: null, errors: {} }
  }
};

export const $ = id => document.getElementById(id);
