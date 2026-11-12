// AR form cases from data/AR_form.csv (UIX decision 13). One row per case, AR-i and AR-ix together; headers are the
// x_ar_request field names (like an import set). Reference columns hold display values: customer name, contract
// number, user name. `attachments` (not a field) lists portal attachments separated by ";".
// Each row goes through the same record-producer logic as a portal submission (createRequest), so a CSV case and a
// portal case open on the same reusable Record page.
import { parseCSV } from "./io.js";
import { createRequest, journal } from "./records.js";
import { TABLES } from "./schema.js";
import { S } from "./state.js";
import { cents } from "./util.js";

export const CASES_CSV = "data/AR_form.csv";
/** Demo setup: contracts on which AR has already set GIRO by hand from a completed AR-ix case (AR-ix decision 11). */
const GIRO_SET_BY_AR = [["HL-2026-01", "ARQ0001007"]];

let cached = null;
/** Fetch the CSV once per page load and add its cases to S.requests (after the sample master data is loaded). */
export async function loadCases() {
  try {
    if (cached === null) { const res = await fetch(CASES_CSV, { cache: "no-store" }); cached = res.ok ? await res.text() : ""; }
  } catch { cached = ""; }
  return addCases(cached);
}

/** Build cases from CSV text. Returns the number of cases added. */
export function addCases(text) {
  const rows = parseCSV(text || ""); if (rows.length < 2) return 0;
  const head = rows[0].map(h => h.trim()), byName = Object.fromEntries(TABLES.requests.fields.map(f => [f.name, f]));
  const user = v => S.users.find(u => u.name === v || u.email === v)?.id || null;
  let n = 0;
  for (const row of rows.slice(1)) {
    const c = Object.fromEntries(head.map((h, i) => [h, (row[i] ?? "").trim()]));
    const vals = { attachments: c.attachments ? c.attachments.split(";").map(s => s.trim()).filter(Boolean) : [] };
    for (const [name, raw] of Object.entries(c)) {
      const f = byName[name]; if (!f || ["number", "state", "opened_by", "assigned_to", "opened_at"].includes(name)) continue;
      let v = raw;
      if (f.type === "Currency") v = raw === "" ? 0 : cents(raw);
      else if (f.type === "True/False") v = raw.toLowerCase() === "true";
      else if (f.key === "customerId") v = S.customers.find(x => x.name === raw)?.id || null;
      else if (f.key === "contractId") v = S.contracts.find(x => x.number === raw)?.id || null;
      else if (f.type === "Reference") v = raw ? user(raw) : null;
      vals[f.key] = v;
    }
    const by = user(c.opened_by), opened = c.opened_at || undefined;
    const r = createRequest(vals, { number: c.number || undefined, requestedBy: by || undefined, opened });
    const at = (r.opened || "") + "T09:00:00";
    r.activity.forEach(e => { e.at = at; });
    const ar = user(c.assigned_to);
    if (ar) { r.assignedTo = ar; r.state = "in_progress"; journal(r, "system", `Assigned to ${S.users.find(u => u.id === ar).name}.`, ar); }
    if (c.state && c.state !== r.state) { r.state = c.state; journal(r, "system", `State changed to ${TABLES.requests.fields.find(f => f.key === "state").choices.find(x => x[0] === c.state)?.[1] || c.state}.`, ar || by); }
    r.activity.forEach(e => { e.at = at; }); r.updated = r.opened;
    S.history.push({ table: "requests", id: r.id, at, by: r.requestedBy, kind: "created" });
    n++;
  }
  for (const [ctr, num] of GIRO_SET_BY_AR) {
    const k = S.contracts.find(x => x.number === ctr), r = S.requests.find(x => x.number === num);
    if (k && r) Object.assign(k, { giroStatus: "active", giroCaseId: r.id });
  }
  return n;
}
