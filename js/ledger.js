// Read-side ledger logic over customers, contracts, invoices and payment allocations.
import { S } from "./state.js";
import { nameSim, nameToks, normTok, today, uid } from "./util.js";

export function invoiceUse() {
  const applied = {}, reserved = {};
  for (const [pid, m] of Object.entries(S.matches)) {
    if (!m || m.status === "rejected") continue;
    for (const a of m.allocations) {
      const tgt = m.status === "accepted" ? applied : reserved;
      tgt[a.invoiceId] = (tgt[a.invoiceId] || 0) + a.amount;
    }
  }
  return { applied, reserved };
}

export const invById = id => S.invoices.find(i => i.id === id);

export function invoiceState(i) {
  const { applied, reserved } = invoiceUse();
  const holders = Object.entries(S.matches).filter(([, mm]) => mm && mm.status === "proposed" && mm.allocations.some(a => a.invoiceId === i.id))
    .map(([pid]) => S.payments.find(x => x.id === pid)?.payer).filter(Boolean);
  return { applied: applied[i.id] || 0, reserved: reserved[i.id] || 0, open: i.amount - (applied[i.id] || 0) - (reserved[i.id] || 0), holders };
}

export const custById = id => S.customers.find(c => c.id === id);

export const ctrById = id => S.contracts.find(k => k.id === id);

export const custNames = c => c ? [c.name, c.parent, ...(c.aliases || [])].filter(Boolean) : [];

export function payerSim(payer, inv) { return Math.max(nameSim(payer, inv.customer), ...custNames(custById(inv.customerId)).map(n => nameSim(payer, n))); }

export function findOrCreateCustomer(name) {
  const n = String(name || "").trim(); if (!n) return null;
  const key = nameToks(n).join(" ");
  let c = S.customers.find(x => custNames(x).some(y => nameToks(y).join(" ") === key));
  if (!c) { c = { id: uid("c"), name: n, parent: "", aliases: [], terms: 30, creditLimit: 0, notes: "" }; S.customers.push(c); }
  return c;
}

export function findOrCreateContract(c, number) {
  const n = String(number || "").trim(); if (!c || !n) return null;
  let k = S.contracts.find(x => x.customerId === c.id && normTok(x.number) === normTok(n));
  if (!k) { k = { id: uid("k"), customerId: c.id, number: n, title: "Imported contract", start: "", end: "", value: 0, billing: "Milestone", terms: c.terms || 30, discPct: 0, discDays: 0, notes: "" }; S.contracts.push(k); }
  return k;
}

export function rollup(invs) {
  const { applied, reserved } = invoiceUse();
  const r = { billed: 0, collected: 0, open: 0, overdue: 0, proposed: 0, count: invs.length };
  for (const i of invs) { const ap = applied[i.id] || 0, op = i.amount - ap, d = new Date(i.due);
    r.billed += i.amount; r.collected += ap; r.open += op; r.proposed += reserved[i.id] || 0;
    if (op > 0 && !isNaN(d) && d < today) r.overdue += op; }
  return r;
}

export function ctrStatus(k) {
  const s = new Date(k.start), e = new Date(k.end);
  if (!isNaN(s) && today < s) return ["Not started", "c-neutral"];
  if (!isNaN(e) && today > e) return ["Ended", "c-neutral"];
  return ["Active", "c-ok"];
}

export function nextInvoiceNumber() {
  let max = 0, prefix = "INV-";
  for (const i of S.invoices) { const m = String(i.number).match(/^(.*?)(\d+)$/); if (m && +m[2] > max) { max = +m[2]; prefix = m[1]; } }
  return prefix + String(max + 1).padStart(5, "0");
}
