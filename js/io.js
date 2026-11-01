// CSV import (invoices or payments) and CSV export of matches.
import { findOrCreateContract, findOrCreateCustomer, invById } from "./ledger.js";
import { $, S } from "./state.js";
import { addDays, cents, uid } from "./util.js";
import { render } from "./views/cash.js";

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

export const COLS = {
  inv: { customer: ["customer","client","account","bill to","name"], number: ["invoice","inv","number","doc"], date: ["invoice date","date","issued"], due: ["due"], amount: ["open","balance","amount","total"], currency: ["currency","ccy","cur"], contract: ["contract","agreement","po"], desc: ["description","desc","item","line"] },
  pay: { payer: ["payer","remitter","from","customer","name","description"], date: ["date","value date","received"], amount: ["amount","credit","received","value"], reference: ["reference","ref","memo","remittance","narrative","details"], currency: ["currency","ccy","cur"] }
};

export function mapHeader(head, spec) {
  const h = head.map(x => x.trim().toLowerCase()); const out = {}; const used = new Set();
  for (const [k, keys] of Object.entries(spec)) {
    for (const key of keys) { const idx = h.findIndex((x, j) => !used.has(j) && (x === key || x.includes(key))); if (idx >= 0) { out[k] = idx; used.add(idx); break; } }
  }
  return out;
}

export function importCSV() {
  const text = $("importText").value; const rows = parseCSV(text);
  if (rows.length < 2) { $("importMsg").textContent = "Need a header row and at least one data row."; return; }
  const t = S.target, spec = COLS[t], map = mapHeader(rows[0], spec);
  const need = t === "inv" ? ["customer","number","amount"] : ["payer","amount"];
  const miss = need.filter(k => map[k] === undefined);
  if (miss.length) { $("importMsg").textContent = `Couldn't find column${miss.length > 1 ? "s" : ""}: ${miss.join(", ")}. Rename the header and try again.`; return; }
  const get = (r, k) => map[k] === undefined ? "" : (r[map[k]] ?? "").trim();
  if (S.isSample) { S.customers = []; S.contracts = []; S.invoices = []; S.payments = []; S.matches = {}; S.pick = {}; S.isSample = false; S.selCust = null; }
  const nCust = S.customers.length, nCtr = S.contracts.length;
  const recs = t === "inv"
    ? rows.slice(1).filter(r => get(r, "number") && cents(get(r, "amount")) > 0).map(r => {
        const c = findOrCreateCustomer(get(r, "customer")), k = findOrCreateContract(c, get(r, "contract"));
        return { id: uid("i"), customerId: c?.id, contractId: k?.id, customer: c ? c.name : get(r, "customer"), number: get(r, "number"), desc: get(r, "desc"),
          date: get(r, "date"), due: get(r, "due") || addDays(get(r, "date"), k?.terms || c?.terms || 30) || get(r, "date"), amount: cents(get(r, "amount")), currency: get(r, "currency") || "SGD" }; })
    : rows.slice(1).map(r => ({ id: uid("p"), payer: get(r, "payer"), date: get(r, "date"), amount: cents(get(r, "amount")), reference: get(r, "reference"), currency: get(r, "currency") || "SGD" }))
        .filter(x => x.amount > 0);
  if (t === "inv") { if ($("replaceChk").checked) { S.invoices = []; S.matches = {}; } S.invoices.push(...recs); }
  else { if ($("replaceChk").checked) { S.payments = []; S.matches = {}; } S.payments.push(...recs); }
  const extra = t === "inv" && (S.customers.length > nCust || S.contracts.length > nCtr) ? ` Created ${S.customers.length - nCust} customer${S.customers.length - nCust === 1 ? "" : "s"} and ${S.contracts.length - nCtr} contract${S.contracts.length - nCtr === 1 ? "" : "s"}; review them under Customers & contracts.` : "";
  $("importMsg").textContent = `Imported ${recs.length} ${t === "inv" ? "invoices" : "payments"}.${extra}`;
  $("importText").value = ""; render();
}

export function setTarget(t) {
  S.target = t; $("tgtInv").setAttribute("aria-pressed", t === "inv"); $("tgtPay").setAttribute("aria-pressed", t === "pay");
  $("importHint").textContent = t === "inv"
    ? "Columns: customer, invoice, invoice date, due date, amount (open balance), currency, and optionally contract and description. Customers and contracts are linked by name and number, and created if new."
    : "Columns: payer, date, amount, reference (memo or remittance text), currency. Bank statement exports work if they have these.";
}

export async function exportCSV() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["payment_payer","payment_date","payment_amount","payment_reference","invoice_number","customer","allocated_amount","status","method","confidence","exception","reason"].join(",")];
  for (const p of S.payments) { const m = S.matches[p.id];
    if (!m || !m.allocations.length) { lines.push([q(p.payer), q(p.date), (p.amount/100).toFixed(2), q(p.reference), "", "", "0.00", q(m?.status || "unmatched"), q(m?.method || ""), "", q(m?.exception || ""), q(m?.reason || "")].join(",")); continue; }
    for (const a of m.allocations) { const i = invById(a.invoiceId) || {};
      lines.push([q(p.payer), q(p.date), (p.amount/100).toFixed(2), q(p.reference), q(i.number), q(i.customer), (a.amount/100).toFixed(2), q(m.status), q(m.method), m.confidence.toFixed(2), q(m.exception), q(m.reason)].join(",")); } }
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `cash-application-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
