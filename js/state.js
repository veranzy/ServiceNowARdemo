// Single in-memory app state shared by every module, plus a DOM lookup helper.

export const S = { customers: [], contracts: [], invoices: [], payments: [], matches: {}, pick: {}, filter: "all", target: "inv", busy: false, isSample: false,
  view: "customers", selCust: null, custQ: "", form: null };

export const $ = id => document.getElementById(id);
