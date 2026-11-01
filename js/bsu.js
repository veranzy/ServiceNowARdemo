// BSU — Bank statement upload: parse a bank's CSV export (deposits only), tag Deposit IDs, save to the
// Bank statements table. ServiceNow: Script Include x_ar.BankStatementParser + before-insert BR for deposit_id.
import { parseCSV } from "./io.js";
import { me, nextNumber } from "./records.js";
import { BANKS } from "./schema.js";
import { S } from "./state.js";
import { cents, uid } from "./util.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const acctById = id => S.bankAccounts.find(a => a.id === id);
export const acctLabel = a => a ? `${BANKS[a.bank].name} · ${a.number}` : "—";
export const last4 = a => String(a.number).replace(/\D/g, "").slice(-4);

/** Format an ISO date the way the bank writes it. */
export function bankDate(bank, iso) {
  const [y, m, d] = iso.split("-");
  if (bank === "MB") return `${+d} ${MONTHS[+m - 1]} ${y}`;
  if (bank === "OB") return `${d}/${m}/${y}`;
  return iso;
}
/** Parse the bank's date text back to ISO; returns "" when unreadable. */
export function parseBankDate(bank, text) {
  const t = String(text || "").trim();
  let m;
  if (bank === "MB" && (m = t.match(/^(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})$/))) { const mo = MONTHS.findIndex(x => x.toLowerCase() === m[2].slice(0, 3).toLowerCase()); return mo < 0 ? "" : `${m[3]}-${String(mo + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  if (bank === "OB" && (m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return t;
  return "";
}

/** Deposit ID: DEP-<bank code><last 4 of account>-<YYMMDD>-<NNN>. */
export function depositId(acct, iso, seq) {
  return `DEP-${acct.bank}${last4(acct)}-${iso.slice(2).replace(/-/g, "")}-${String(seq).padStart(3, "0")}`;
}

/** Parse CSV text with the account's bank template. Deposits = rows with a credit amount > 0. */
export function parseStatement(text, acct, statementDate) {
  const bank = BANKS[acct.bank], rows = parseCSV(text || "");
  if (rows.length < 2) return { error: "The file has no data rows. Choose the CSV exported from internet banking." };
  // header row may be preceded by account info lines in real exports: find the first row containing the date column
  const hIx = rows.findIndex(r => r.some(c => c.trim().toLowerCase() === bank.cols.date.toLowerCase()));
  if (hIx < 0) return { error: `This doesn't look like a ${bank.name} export: no "${bank.cols.date}" column. Check you picked the right bank account.` };
  const head = rows[hIx].map(c => c.trim().toLowerCase());
  const col = k => bank.cols[k] ? head.indexOf(bank.cols[k].toLowerCase()) : -1;
  const ix = { date: col("date"), payer: col("payer"), reference: col("reference"), credit: col("credit"), debit: col("debit"), bankRef: col("bankRef") };
  const missing = ["payer", "credit"].filter(k => ix[k] < 0).map(k => `"${bank.cols[k]}"`);
  if (missing.length) return { error: `Missing column${missing.length > 1 ? "s" : ""} ${missing.join(", ")} for ${bank.name}.` };
  const deposits = [], skipped = [];
  let n = 0;
  for (const r of rows.slice(hIx + 1)) {
    const get = i => (i >= 0 ? (r[i] ?? "") : "").trim();
    const credit = cents(get(ix.credit)), debit = cents(get(ix.debit));
    const date = parseBankDate(acct.bank, get(ix.date)) || statementDate;
    if (credit > 0) deposits.push({ seq: ++n, date, payer: get(ix.payer), reference: get(ix.reference), amount: credit, bankRef: get(ix.bankRef) });
    else if (debit > 0) skipped.push({ date, payer: get(ix.payer), reference: get(ix.reference), amount: debit });
  }
  if (!deposits.length && !skipped.length) return { error: "No transactions found under the header row." };
  for (const d of deposits) d.depositId = depositId(acct, statementDate, d.seq);
  return { deposits, skipped, total: deposits.reduce((s, d) => s + d.amount, 0) };
}

/** Save a parsed statement: one BSU upload record + one Bank statements row per deposit. */
export function saveUpload(acct, statementDate, fileName, parsed) {
  const up = { id: uid("u"), number: nextNumber("uploads"), bankAccountId: acct.id, statementDate, fileName, uploadedBy: me().id,
    uploadedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace("T", " "),
    depositCount: parsed.deposits.length, depositTotal: parsed.total, skippedCount: parsed.skipped.length };
  S.uploads.push(up);
  for (const d of parsed.deposits)
    S.payments.push({ id: uid("p"), number: d.depositId, bankAccountId: acct.id, uploadId: up.id, date: d.date, payer: d.payer, reference: d.reference, amount: d.amount, bankRef: d.bankRef, currency: "SGD" });
  return up;
}

const csvCell = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const money = c => c ? (c / 100).toFixed(2) : "";

/** Demo: build a realistic CSV for the account and day in its bank's layout. */
export function sampleCSV(acct, iso) {
  const bank = BANKS[acct.bank];
  const open = S.invoices.filter(i => i.state === "issued").filter(i => !S.payments.some(p => (p.reference || "").includes(i.number.replace("INV-", ""))));
  const seed = [...(acct.number + iso)].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const pick = k => open.length ? open[(seed + k * 7) % open.length] : null;
  const custOf = i => S.customers.find(c => c.id === i.customerId);
  const lines = [];
  const a = pick(1), b = pick(2);
  if (a) lines.push({ payer: (custOf(a)?.aliases?.[0] || a.customer).toUpperCase().slice(0, 34), ref: `INV ${a.number.replace("INV-", "")}`, credit: a.amount });
  if (b && b !== a) lines.push({ payer: (custOf(b)?.name || b.customer).toUpperCase().replace(/ PTE LTD| SDN BHD/, "").slice(0, 34), ref: `PAYMENT ${b.number}`, credit: Math.round(b.amount / 2) });
  lines.push({ payer: "FAST PAYMENT", ref: `OTHR ${1000 + (seed % 9000)}`, credit: 50000 + (seed % 40) * 2500 });
  lines.push({ payer: "SERVICE CHARGE", ref: "CHG TT", debit: 1800 });
  if (acct.accountType !== "revenue") lines.push({ payer: "INTEREST CREDIT", ref: "INT", credit: 1234 + (seed % 500) });
  const d = bankDate(acct.bank, iso);
  const out = [];
  if (acct.bank === "MB") out.push(`Account Details For:,${acct.number}`, `Statement as at:,${d}`, "");
  out.push(bank.header.join(","));
  let bal = 2500000 + (seed % 100) * 1000;
  lines.forEach((l, n) => {
    bal += (l.credit || 0) - (l.debit || 0);
    const ref = `${acct.bank}${iso.replace(/-/g, "").slice(2)}${String(n + 1).padStart(4, "0")}`;
    const row = acct.bank === "MB" ? [d, d, l.payer, l.ref, money(l.debit), money(l.credit), ref]
      : acct.bank === "OB" ? [d, d, l.payer, l.ref, money(l.debit), money(l.credit)]
      : [d, l.payer, l.ref, money(l.credit), money(l.debit), (bal / 100).toFixed(2)];
    out.push(row.map(csvCell).join(","));
  });
  return out.join("\n");
}

export const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
