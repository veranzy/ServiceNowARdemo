// Excel templates for AR forms (AR-ii #15, AR-x #14): read the uploaded workbook into rows that become tasks on submit,
// give a sample file and a blank template. Demo only: SheetJS (vendor/) is loaded on first use. In ServiceNow this is an
// import set / data source on the attachment, transformed into the task table by the record producer's flow.
import { cents } from "./util.js";

let lib = null;
/** Load SheetJS once (vendored, no CDN). */
export function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return lib ||= new Promise((ok, bad) => {
    const s = document.createElement("script"); s.src = "vendor/xlsx-0.18.5/xlsx.full.min.js";
    s.onload = () => ok(window.XLSX); s.onerror = () => { lib = null; bad(new Error("The Excel reader didn't load.")); };
    document.head.appendChild(s);
  });
}

const money = v => v === "" || v == null ? 0 : typeof v === "number" ? Math.round(v * 100) : cents(String(v).replace(/[$,\s]|SGD/gi, ""));
const txt = v => v == null ? "" : String(v).trim();

/** Template per form: header row (client's wording), how to find each column, sample rows, and the row → task mapping. */
export const TEMPLATES = {
  // #15: AR2 Excel. Each row with a value becomes an AR2 task (AR-ii decision 6)
  "AR-ii": {
    file: "AR2_refund_template.xlsx",
    headers: ["S/N", "Collection reference No. (e.g. Reciept No.)", "Refund Reason", "Amount ($)", "Case Reference No. (if applicable)", "Name of Payee", "If amount for refund is not in SGD (if applicable)"],
    cols: { sn: /^s\/?\s*n/i, collectionRef: /collection reference/i, reason: /refund reason/i, amount: /^amount/i, caseRef: /case reference/i, payee: /name of payee/i, nonSgd: /not in sgd/i },
    need: ["collectionRef", "amount", "payee"],
    sample: [
      [1, "QR123456789", "Extra payment with same file ref. No.", 70, "", "Peter Lim", ""],
      [2, "RCP-2026-004512", "Duplicate payment", 150.5, "", "Harbourline Logistics Pte Ltd", ""],
      [3, "QR123456902", "Overpayment", 42, "IB/2026/004417", "Tan Mei Ling", "USD 31.20"]
    ],
    row: r => ({ collectionRef: txt(r.collectionRef), reason: txt(r.reason), amount: money(r.amount), caseRef: txt(r.caseRef), payee: txt(r.payee), nonSgd: txt(r.nonSgd) }),
    keep: x => x.collectionRef || x.payee || x.amount
  },
  // #14: AR10 Excel (payment request and journal request columns). The task keeps payee and amount (AR-x decision 3)
  "AR-x": {
    file: "AR10_refund_template.xlsx",
    headers: ["S/N", "Collection reference no. (e.g., receipt no./ Deposit ID/ Invoice No.)", "Case report no. (Applicable for Seized monies/ Cash bail/ FUPO)", "Refund reason (select from drop down)",
      "To debit from Deposit a/c (select from drop down", "Name of Beneficiary /Vendor", "NRIC/UEN No.", "Amount (SGD)", "If amount for refund is not in SGD (if applicable)",
      "To debit from Deposit a/c (select from dropdown)", "Account Code", "Cost Centre", "Amount (SGD)"],
    cols: { sn: /^s\/?\s*n/i, payee: /name of beneficiary/i, amount: /^amount \(sgd\)/i },
    need: ["payee", "amount"],
    sample: [
      [1, "RCP-2026-003311", "", "Payment to beneficiary/ vendor – Please compete payment request columns", "Digital Security Deposit/Misc - 1111111/22222222", "Peter Lim", "S1234567D", 250, "", "", "", "", ""],
      [2, "DEP-201126-NETS", "", "Payment to beneficiary/ vendor – Please compete payment request columns", "Digital Security Deposit/Misc - 1111111/22222222", "Kallang Events Pte Ltd", "201912345K", 1200, "", "", "", "", ""],
      [3, "INV-09912", "SM-2026-0081", "Forfeiture to state – Please complete journal request columns", "", "", "", "", "", "Electricity Seized Monies – 12334242/234211", "4300", "ENE-100", 2300]
    ],
    // payment rows carry the beneficiary and the first Amount (SGD); journal rows have no payee and use the second Amount (SGD)
    row: r => ({ payee: txt(r.payee), amount: money(txt(r.amount[0]) ? r.amount[0] : r.amount[1]) }),
    keep: x => x.payee || x.amount,
    multi: ["amount"]
  }
};

/** Parse a workbook (ArrayBuffer) for a form. Returns { rows } or { error }. */
export async function readTemplate(form, buf) {
  const t = TEMPLATES[form], X = await loadXlsx();
  const wb = X.read(buf, { type: "array" }), ws = wb.Sheets[wb.SheetNames[0]];
  const grid = X.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
  return parseGrid(form, grid);
}
/** Rows from a grid (array of arrays): find the header row, map the columns, keep rows with a value. */
export function parseGrid(form, grid) {
  const t = TEMPLATES[form];
  const hi = grid.findIndex(r => t.need.every(k => r.some(c => t.cols[k].test(txt(c)))));
  if (hi < 0) return { error: `This file doesn't have the template columns (${t.need.map(k => t.headers.find(h => t.cols[k].test(h))).join(", ")}). Use the template.` };
  const head = grid[hi].map(txt), at = {};
  for (const [k, re] of Object.entries(t.cols)) { const ix = head.map((h, i) => re.test(h) ? i : -1).filter(i => i >= 0); at[k] = t.multi?.includes(k) ? ix : ix[0]; }
  const rows = grid.slice(hi + 1).map(r => {
    const raw = Object.fromEntries(Object.entries(at).map(([k, i]) => [k, Array.isArray(i) ? i.map(j => r[j]) : i === undefined ? "" : r[i]]));
    return t.row(raw);
  }).filter(t.keep);
  return rows.length ? { rows } : { error: "The file has the template columns but no rows filled in." };
}
/** The sample file's rows, already processed (no library needed). */
export const sampleRows = form => parseGrid(form, [TEMPLATES[form].headers, ...TEMPLATES[form].sample]).rows;
/** Download the blank template (header row and the sample rows) as .xlsx. */
export async function downloadTemplate(form) {
  const t = TEMPLATES[form], X = await loadXlsx();
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([t.headers, ...t.sample]), "Template");
  X.writeFile(wb, t.file);
}
