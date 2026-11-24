// Single in-memory app state shared by every module, plus a DOM lookup helper.
export const S = {
  // data (tables)
  users: [], groups: [{ id: "g_ar", name: "Accounts Receivable" }], companies: [], customers: [], contracts: [], requests: [], invoices: [], deposits: [], matches: {}, bankAccounts: [], uploads: [], contacts: [], documents: [], schedules: [], lines: [], items: [], colTx: [], ar5Lines: [], refundTasks: [], refundReasons: [], ar10Payees: [], ar10Tasks: [], colAlloc: [], costCentres: [], accountCodes: [], paymentModes: [], history: [],
  // cash application UI
  pick: {}, filter: "open", status: null,
  // BSU upload page draft
  bsu: { acctId: null, date: "", text: "", fileName: "", parsed: null, error: "" },
  // shell
  ui: {
    persona: "ar",          // "ar" → workspace, "project" → portal
    notes: false,           // ID tags (off by default; "Show IDs" in the demo bar)
    toast: null,
    ws: { main: { kind: "home" }, tabs: [], active: "main", lmOpen: null, side: { open: true, w: 380 }, q: "", composer: {} },
    portal: { page: "home", id: null, draft: null, errors: {} }
  }
};

export const $ = id => document.getElementById(id);
