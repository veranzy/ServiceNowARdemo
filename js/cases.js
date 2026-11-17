// AR form cases from data/AR_form.csv (UIX decision 13). One row per case, AR-i and AR-ix together; headers are the
// x_ar_request field names (like an import set). Reference columns hold display values: customer name, contract
// number, user name. `attachments` (not a field) lists portal attachments separated by ";".
// Each row goes through the same record-producer logic as a portal submission (createRequest), so a CSV case and a
// portal case open on the same reusable Record page.
import { parseCSV } from "./io.js";
import { createRequest, termsDays, draftDate, firstInvoices, journal, nextCycleDate, nextNumber, periodAmounts, periodDates, runDailyInvoiceCheck } from "./records.js";
import { TABLES } from "./schema.js";
import { S } from "./state.js";
import { addDays, cents, isoToday, uid } from "./util.js";

export const CASES_CSV = "data/AR_form.csv";
/** Demo setup: contracts on which AR has already set GIRO by hand from a completed AR-ix case (AR-ix decision 11). */
const GIRO_SET_BY_AR = [["HL-2026-01", "ARQ0001007"]];
/** Demo setup (CCI decisions 8–9): recurring AR-i cases already closed complete, on a contract billed on a fixed cycle day.
 *  Closing generated the 1st invoice from the AR-i (two cycle days ago; AR reviewed it, set an earlier approval date and issued
 *  it); AR then created the billing schedule on the contract from the 2nd invoice (last cycle day, drafted by the daily job and
 *  issued); the 3rd invoice is drafted by the daily job once its date is 5 working days away. */
const CLOSED_RECURRING = ["ARQ0001009"];

const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"), day = d.getDate(); d.setMonth(d.getMonth() + n); if (d.getDate() !== day) d.setDate(0); return ymd(d); };
function addWorkingDays(iso, n) { const d = new Date(iso + "T00:00:00"); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; } return ymd(d); }

/** Demo history for the sample billing schedules: every period whose draft date has passed was drafted by the daily job and
 *  issued by AR, so the daily check only picks up new work. */
function scheduleHistory() {
  const t = isoToday();
  for (const sch of S.schedules) {
    const dates = periodDates(sch.frequency, sch.firstDate, sch.lastDate), amounts = periodAmounts(sch, dates);
    dates.forEach((date, ix) => {
      if (draftDate(date) > t || S.invoices.some(i => i.scheduleId === sch.id && i.periodDate === date && i.state !== "cancelled")) return;
      const k = S.contracts.find(x => x.id === sch.contractId), c = S.customers.find(x => x.id === (sch.customerId || k?.customerId));
      const label = new Date(date + "T00:00:00").toLocaleDateString("en-SG", { month: "short", year: "numeric" });
      S.invoices.push({ id: uid("i"), number: nextNumber("invoices"), state: "issued", customerId: c?.id, contractId: sch.contractId, requestId: sch.requestId || null, lineId: sch.lineId || null,
        scheduleId: sch.id, periodDate: date, customer: c?.name || "", desc: `${sch.desc} – ${label}`, amount: amounts[ix] ?? sch.amount, date, approvalDate: draftDate(date), due: addDays(date, termsDays(k)), currency: "SGD" });
    });
  }
}

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
      else if (f.ref === "groups") v = S.groups.find(g => g.name === raw)?.id || "g_ar";
      else if (f.type === "Reference") v = raw ? user(raw) : null;
      vals[f.key] = v;
    }
    const by = user(c.opened_by), opened = c.opened_at || undefined;
    const r = createRequest(vals, { number: c.number || undefined, requestedBy: by || undefined, opened });
    const at = (r.opened || "") + "T09:00:00";
    r.activity.forEach(e => { e.at = at; });
    const ar = user(c.assigned_to);
    if (ar) { r.assignedTo = ar; r.state = "work_in_progress"; journal(r, "system", `Assigned to ${S.users.find(u => u.id === ar).name}.`, ar); }
    if (c.state && c.state !== r.state) { r.state = c.state; journal(r, "system", `State changed to ${TABLES.requests.fields.find(f => f.key === "state").choices.find(x => x[0] === c.state)?.[1] || c.state}.`, ar || by); }
    r.activity.forEach(e => { e.at = at; }); r.updated = r.opened;
    S.history.push({ table: "requests", id: r.id, at, by: r.requestedBy, kind: "created" });
    n++;
  }
  scheduleHistory();
  for (const num of CLOSED_RECURRING) {
    const r = S.requests.find(x => x.number === num), l = r && S.lines.find(x => x.requestId === r.id && x.lineType === "recurring");
    if (!l) continue;
    const k = S.contracts.find(x => x.id === r.contractId), next = nextCycleDate(k) || addWorkingDays(isoToday(), 3);
    const second = addMonths(next, -1), first = addMonths(next, -2), at = first + "T10:00:00";
    l.startDate = first;
    r.state = "closed_complete"; journal(r, "system", "State changed to Closed complete.", r.assignedTo);
    for (const inv of [].concat(firstInvoices(r) || [])) if (inv?.id) Object.assign(inv, { state: "issued", approvalDate: addDays(first, -3), due: addDays(first, 30) });
    const sch = { id: uid("s"), number: nextNumber("schedules"), customerId: r.customerId, contractId: r.contractId, department: r.department, desc: l.desc, frequency: "monthly",
      amount: l.amount, firstDate: second, lastDate: l.endDate, firstAmount: 0, lastAmount: 0, requestId: r.id, lineId: l.id };
    S.schedules.push(sch); l.scheduleId = sch.id;
    journal(r, "work_note", `Billing schedule ${sch.number} set up on the contract for the 2nd invoice onwards.`, r.assignedTo);
    r.opened = addDays(first, -10); r.activity.forEach(e => { e.at = at; }); r.updated = first;
  }
  scheduleHistory();         // the 2nd invoice: drafted by the daily job and issued by AR
  runDailyInvoiceCheck();   // mock data: the drafts last night's daily invoice check would have created
  // D31: closed demo cases were linked by AR (Link section) before they were closed
  for (const r of S.requests) if (r.state === "closed_complete") { if (r.form !== "AR-ix") r.linkCustomer ||= r.customerId || null; r.linkContract ||= r.contractId || null; }
  for (const [ctr, num] of GIRO_SET_BY_AR) {
    const k = S.contracts.find(x => x.number === ctr), r = S.requests.find(x => x.number === num);
    if (k && r) Object.assign(k, { giroStatus: "active", giroCaseId: r.id });
  }
  return n;
}
