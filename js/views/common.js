// Shared view helpers: state chips, form fields from the schema, related lists, icons, build-note attributes.
import { ctrById, custById, invoiceUse } from "../ledger.js";
import { REQ_STATE, displayOf, recById, userById } from "../records.js";
import { CODE, noteText } from "../notes.js";
import { BANKS, TABLES } from "../schema.js";
import { S } from "../state.js";
import { DAY, esc, fmt, today } from "../util.js";

/** Build-notes attributes for a registered note ID (js/notes.js); the overlay shows "[ID] text" when Build notes is on. */
export const sn = id => {
  const text = noteText(id);
  if (text === null) console.warn(`Unregistered build note ID: ${id}`);
  return ` data-snid="${esc(id)}" data-sn="${esc(text ?? "")}"${S.ui.notes ? ` title="${esc(`${id}: ${text ?? ""}`)}"` : ""}`;
};

const REQ_CHIP = { new: "c-accent", in_progress: "c-neutral", awaiting_info: "c-warn", invoiced: "c-ok", rejected: "c-bad" };
export const reqChip = r => `<span class="chip ${REQ_CHIP[r.state] || "c-neutral"}">${esc(REQ_STATE[r.state] || r.state)}</span>`;

export function invMoney(i) {
  const use = invoiceUse();
  const applied = use.applied[i.id] || 0, reserved = use.reserved[i.id] || 0;
  const open = i.state === "cancelled" ? 0 : i.amount - applied;
  const late = i.state === "issued" && open > 0 && i.due && new Date(i.due) < today;
  const pay = i.state !== "issued" ? null : open <= 0 ? "Paid" : applied > 0 ? "Part paid" : "Unpaid";
  return { applied, reserved, open, late, pay };
}
export function invChip(i) {
  if (i.state === "draft") return `<span class="chip c-neutral">Draft</span>`;
  if (i.state === "cancelled") return `<span class="chip c-neutral strike">Cancelled</span>`;
  const m = invMoney(i);
  if (m.pay === "Paid") return `<span class="chip c-ok">Paid</span>`;
  if (m.late) return `<span class="chip c-bad">Overdue</span>`;
  if (m.pay === "Part paid") return `<span class="chip c-accent">Part paid</span>`;
  return `<span class="chip c-warn">Issued · unpaid</span>`;
}
export function depositMoney(p) {
  const m = S.matches[p.id];
  const applied = m && m.status === "accepted" ? m.allocations.reduce((s, a) => s + a.amount, 0) : 0;
  const state = applied <= 0 ? "Unmatched" : applied >= p.amount ? "Matched" : "Part matched";
  return { applied, unapplied: p.amount - applied, state };
}
export const depositChip = p => { const s = depositMoney(p).state; return `<span class="chip ${s === "Matched" ? "c-ok" : s === "Part matched" ? "c-accent" : "c-warn"}">${s}</span>`; };

export function daysLabel(iso) {
  if (!iso) return "—";
  const d = Math.round((today - new Date(iso + "T00:00:00")) / DAY);
  return d > 0 ? `${d} day${d === 1 ? "" : "s"} overdue` : d === 0 ? "Due today" : `Due in ${-d} day${d === -1 ? "" : "s"}`;
}

/** Link that opens a record (workspace tab or portal page, decided by the click handler). */
export function refLink(table, id, label) {
  if (!id) return `<span class="muted">—</span>`;
  const rec = recById(table, id);
  return `<button type="button" class="linkish" data-open="${table}:${id}">${esc(label ?? displayOf(table, rec))}</button>`;
}

function refOptions(f, rec, formVals) {
  if (f.ref === "bankAccounts") return S.bankAccounts.map(a => [a.id, `${BANKS[a.bank].name} · ${a.number} · ${a.name}`]);
  if (f.ref === "users") return S.users.filter(u => !f.refFilter || u.team === f.refFilter).map(u => [u.id, u.name]);
  if (f.ref === "contracts") {
    const cust = formVals?.customerId ?? rec.customerId;
    return S.contracts.filter(k => !cust || k.customerId === cust).map(k => [k.id, `${k.number} · ${k.title}`]);
  }
  return (S[f.ref] || []).map(r => [r.id, displayOf(f.ref, r)]);
}

function readValue(table, f, rec) {
  const v = rec[f.key];
  if (f.type === "Reference") return f.ref === "users" ? esc(userById(v)?.name || "—") : refLink(f.ref, v);
  if (f.type === "Choice") return esc((f.choices.find(c => c[0] === v) || [, v || "—"])[1]);
  if (f.type === "Currency") return v ? `<span class="mono">SGD ${fmt(v)}</span>` : "—";
  if (f.key === "aliases") return (v || []).length ? v.map(a => `<span class="ref">${esc(a)}</span>`).join(" ") : "—";
  return esc(v === 0 ? "0" : v || "—");
}

/** One form field from the schema. ctx: {prefix, readonly, errors, vals}. */
export function fieldHtml(table, f, rec, ctx = {}) {
  const id = `${ctx.prefix || "fld"}-${f.key}`;
  const ro = ctx.readonly || f.readonly;
  const err = ctx.errors?.[f.key];
  const label = `<span class="flabel">${f.mandatory && !ro ? `<i class="req" aria-hidden="true">*</i>` : ""}${esc(f.label)}</span>`;
  let ctl;
  if (ro) ctl = `<div class="fro" id="${id}">${readValue(table, f, rec)}</div>`;
  else {
    const v = rec[f.key];
    const common = `id="${id}" name="${f.key}"${f.mandatory ? ` aria-required="true"` : ""}${err ? ` aria-invalid="true"` : ""}`;
    if (f.type === "Reference") ctl = `<select ${common}><option value="">-- None --</option>${refOptions(f, rec, ctx.vals).map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    else if (f.type === "Choice") ctl = `<select ${common}>${f.mandatory ? "" : `<option value="">-- None --</option>`}${f.choices.map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    else if (f.type.startsWith("String (")) ctl = `<textarea ${common} rows="3">${esc(f.key === "aliases" ? (v || []).join(", ") : v || "")}</textarea>`;
    else if (f.type === "Currency") ctl = `<div class="money-in"><span>SGD</span><input ${common} type="number" step="0.01" min="0" inputmode="decimal" value="${v ? (v / 100).toFixed(2) : ""}"></div>`;
    else if (f.type === "Date") ctl = `<input ${common} type="date" value="${esc(v || "")}">`;
    else if (f.type === "Integer" || f.type === "Decimal") ctl = `<input ${common} type="number" step="${f.type === "Decimal" ? "0.1" : "1"}" value="${esc(v ?? "")}">`;
    else ctl = `<input ${common} type="text" value="${esc(f.key === "aliases" ? (v || []).join(", ") : v || "")}">`;
  }
  return `<label class="ffield${f.wide ? " wide" : ""}${err ? " has-err" : ""}" for="${id}"${sn(`${CODE[table]}.${f.name}`)}>${label}${ctl}${f.help && !ro ? `<span class="fhelp">${esc(f.help)}</span>` : ""}${err ? `<span class="ferr">${esc(err)}</span>` : ""}</label>`;
}

/** Compact related list table. cols: [label, fn(rec) → html, className?] */
export function relatedTable(title, table, rows, cols, opts = {}) {
  const t = TABLES[table];
  return `<section class="rel"${opts.id ? sn(opts.id) : ""}>
    <header><h3>${esc(title)} <span class="count">${rows.length}</span></h3>${opts.actions || ""}</header>
    ${rows.length ? `<div class="tablewrap"><table><thead><tr>${cols.map(c => `<th class="${c[2] || ""}">${esc(c[0])}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c[2] || ""}">${c[1](r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : `<p class="empty small">No ${esc(t.plural.toLowerCase())}.</p>`}
  </section>`;
}

export function meterRow(label, a, b, color) {
  const pct = b > 0 ? Math.max(0, Math.min(100, a / b * 100)) : 0;
  return `<div class="meterrow"><div class="lbl"><span>${esc(label)}</span><span><span class="num">${fmt(a)}</span> of ${fmt(b)}${b > 0 ? ` · ${pct.toFixed(0)}%` : ""}</span></div>
    <div class="meter"><i style="width:${pct}%;background:${color}"></i></div></div>`;
}

export const custName = id => custById(id)?.name || "—";
export const ctrNo = id => ctrById(id)?.number || "—";

const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v4.5h16V15"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
  clip: '<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.5-7.5"/>'
};
export const icon = (name, size = 18) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
export const initials = name => String(name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
