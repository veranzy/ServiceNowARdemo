// Payments CSV import (bank statement / remittance export) and CSV export of matches.
// Bank statement loading is a later requirement; this CSV import stands in for it.
import { invById } from "./ledger.js";
import { S } from "./state.js";
import { cents, uid } from "./util.js";

export function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ""));
}

export const PAY_COLS = { payer: ["payer","remitter","from","customer","name","description"], date: ["date","value date","received"], amount: ["amount","credit","received","value"], reference: ["reference","ref","memo","remittance","narrative","details"], currency: ["currency","ccy","cur"] };

export function mapHeader(head, spec) {
  const h = head.map(x => x.trim().toLowerCase()); const out = {}; const used = new Set();
  for (const [k, keys] of Object.entries(spec)) {
    for (const key of keys) { const idx = h.findIndex((x, j) => !used.has(j) && (x === key || x.includes(key))); if (idx >= 0) { out[k] = idx; used.add(idx); break; } }
  }
  return out;
}

/** Returns a message for the viewer. */
export function importPayments(text, replace) {
  const rows = parseCSV(text);
  if (rows.length < 2) return { ok: false, msg: "Need a header row and at least one data row." };
  const map = mapHeader(rows[0], PAY_COLS);
  const miss = ["payer", "amount"].filter(k => map[k] === undefined);
  if (miss.length) return { ok: false, msg: `Couldn't find column${miss.length > 1 ? "s" : ""}: ${miss.join(", ")}. Rename the header and try again.` };
  const get = (r, k) => map[k] === undefined ? "" : (r[map[k]] ?? "").trim();
  if (replace) { S.payments = []; S.matches = {}; S.pick = {}; }
  let n = S.payments.reduce((mx, p) => Math.max(mx, +(String(p.number).replace(/\D/g, "")) || 0), 1000);
  const recs = rows.slice(1).map(r => ({ id: uid("p"), number: "PAY" + String(++n).padStart(7, "0"), payer: get(r, "payer"), date: get(r, "date"), amount: cents(get(r, "amount")), reference: get(r, "reference"), currency: get(r, "currency") || "SGD" }))
    .filter(x => x.amount > 0);
  S.payments.push(...recs);
  return { ok: true, msg: `Imported ${recs.length} payment${recs.length === 1 ? "" : "s"}.` };
}

export function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["payment_number","payment_payer","payment_date","payment_amount","payment_reference","invoice_number","customer","allocated_amount","status","method","confidence","exception","reason"].join(",")];
  for (const p of S.payments) { const m = S.matches[p.id];
    if (!m || !m.allocations.length) { lines.push([q(p.number), q(p.payer), q(p.date), (p.amount/100).toFixed(2), q(p.reference), "", "", "0.00", q(m?.status || "unmatched"), q(m?.method || ""), "", q(m?.exception || ""), q(m?.reason || "")].join(",")); continue; }
    for (const a of m.allocations) { const i = invById(a.invoiceId) || {};
      lines.push([q(p.number), q(p.payer), q(p.date), (p.amount/100).toFixed(2), q(p.reference), q(i.number), q(i.customer), (a.amount/100).toFixed(2), q(m.status), q(m.method), (m.confidence ?? 0).toFixed(2), q(m.exception), q(m.reason)].join(",")); } }
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `cash-application-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
