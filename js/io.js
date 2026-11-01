// CSV parsing (used by BSU) and CSV export of deposit matches.
import { invById } from "./ledger.js";
import { S } from "./state.js";

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

export function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["deposit_id","value_date","payer","bank_reference","deposit_amount","invoice_number","customer","allocated_amount","match_state","exception","note"].join(",")];
  for (const p of S.payments) { const m = S.matches[p.id];
    if (!m || !m.allocations.length) { lines.push([q(p.number), q(p.date), q(p.payer), q(p.reference), (p.amount/100).toFixed(2), "", "", "0.00", "unmatched", "", ""].join(",")); continue; }
    for (const a of m.allocations) { const i = invById(a.invoiceId) || {};
      lines.push([q(p.number), q(p.date), q(p.payer), q(p.reference), (p.amount/100).toFixed(2), q(i.number), q(i.customer), (a.amount/100).toFixed(2), "matched", q(m.exception), q(m.reason)].join(",")); } }
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `deposit-matches-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
