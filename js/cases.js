// AR form cases from data/AR_form.csv (UIX decision 13). One row per case, AR-i and AR-ix together; headers are the
// x_ar_request field names (like an import set). Reference columns hold display values: customer name, contract
// number, user name. `attachments` (not a field) lists portal attachments separated by ";".
// Each row goes through the same record-producer logic as a portal submission (createRequest), so a CSV case and a
// portal case open on the same reusable Record page.
import { parseCSV } from "./io.js";
import { createRequest, itemCalc, caseRecurring, generateInvoice, termsDays, draftDate, journal, nextCycleDate, nextNumber, periodAmounts, periodDates, runDailyInvoiceCheck } from "./records.js";
import { allocate } from "./matching.js";
import { depositId } from "./bsu.js";
import { TEMPLATES, sampleRows } from "./excel.js";
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
/** CCI decision 23 (demo): PT-43 rows for two CSV cases (the CSV holds no multi-row data). [case, amount w/o GST, GST, account code, cost center] */
const DEMO_LINES = { ARQ0001001: [[12000, "yes", "4300-ENG", "ENG-DES"], [6000, "yes", "4300-ENG", ""]], ARQ0001009: [[4500, "yes", "4200-RNT", "FAC-RTL"], [300, "no", "4200-SVC", ""]] };

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
      S.invoices.push({ id: uid("i"), number: nextNumber("invoices"), state: "issued", customerId: c?.id, contractId: sch.contractId, requestId: sch.requestId || null,
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

/** AR-iii decision 23 (demo, replaces decision 21's set): Collections cases with their own bank lines, to show how hard
 *  matching to BSU deposits can be. Each case's first work note names its scenario. Matching stays manual (D5): only the
 *  "already matched" and "part matched" situations carry allocations, made as AR would make them. */
function collectionCases() {
  const users = { pm1: S.users.find(u => u.id === "u_pm1"), pm2: S.users.find(u => u.id === "u_pm2") };
  const cc = d => S.costCentres.find(c => c.department === d && c.active)?.id || null, ac = code => S.accountCodes.find(a => a.code === code)?.id || null;
  const acct = num => S.bankAccounts.find(a => a.number === num);
  const MB = acct("072-104521-6"), OB = acct("601-337204-001"), USD = acct("451-302-118-7"), OPS = acct("451-302-990-2");   // AR-iii, AR-iv, AR-v accounts; Operating (wrong account)
  const t = isoToday(), ago = n => addDays(t, -n), $ = x => Math.round(x * 100);
  // one statement upload per account per day: reuse the day's upload when it exists, else add one (RITM)
  const stmt = (a, date) => {
    let up = S.uploads.find(u => u.bankAccountId === a.id && u.statementDate === date);
    if (!up) { up = { id: uid("u"), number: nextNumber("uploads"), bankAccountId: a.id, statementDate: date, fileName: `${a.bank}_${a.number.replace(/\D/g, "")}_${date.replace(/-/g, "")}.csv`,
      uploadedBy: "u_ar2", uploadedAt: addDays(date, 1) + " 09:05", depositCount: 0, depositTotal: 0, skippedCount: 0 }; S.uploads.push(up); }
    return up;
  };
  const line = (a, days, txnId, payer, reference, amount) => {
    const date = ago(days), up = stmt(a, date), pm = S.paymentModes.find(m => m.bankAccountId === a.id && m.name === txnId);
    const d = { id: uid("p"), number: depositId(a, date, txnId), txnId, paymentModeId: pm?.id || null, bankAccountId: a.id, uploadId: up.id, date, payer, amount: $(amount), reference, bankRef: "", currency: "SGD" };
    S.deposits.push(d); up.depositCount++; up.depositTotal += d.amount; return d;
  };
  const gi = (u, dept, sub) => ({ form: "COL", requesterName: u.name, requesterEmail: u.email, department: dept, deptSubBu: sub, ccList: "", colOrigin: "manual", attachments: ["collection_report.pdf"] });
  const tx = (...r) => r.map(([collectionType, amount]) => ({ collectionType, amount: $(amount) }));

  // Bank lines (statement day = days ago)
  const L = {
    netsA: line(MB, 7, "GIRO", "NETS SETTLEMENT", "MID 4410023 STL 0417", 1842.50),
    ccA: line(MB, 6, "GIRO", "CC SETTLEMENT VISA MC", "MERCH 88120045 BATCH 0418", 2315.00),
    ezA: line(MB, 6, "GIRO", "EZ-LINK CASHCARD STL", "TID 30017781", 410.20),
    netsB: line(MB, 4, "GIRO", "NETS SETTLEMENT", "MID 4410551 STL 0421", 1760.00),
    ccC: line(MB, 8, "GIRO", "CC SETTLEMENT VISA MC", "MERCH 88120061 BATCH 0415", 2946.00),
    ibgD: line(OB, 3, "IBG", "LIM BROS CONTRACTORS PTE", "RDS-RCV-2026-118", 5065.00),
    fastE: line(OB, 2, "FAST", "GREENCYCLE PTE LTD", "ENV-W-0457/0461", 2240.00),
    ttF1: line(USD, 6, "TT", "TAN WEI MING", "BAIL IB/2026/004417", 5000.00),
    fastF2: line(USD, 5, "FAST", "CASH BAIL", "", 5000.00),
    ttSM: line(USD, 9, "TT", "SEIZED MONIES SM", "SM-2026-0081 SM-2026-0082", 2715.00),
    ttRS: line(USD, 3, "TT", "RESTITUTION RS", "RS-2026-0019", 750.00),
    fastRS: line(USD, 3, "FAST", "RESTITUTION RS", "RS-2026-0020", 320.00),
    opsH: line(OPS, 4, "FAST", "NETS SETTLEMENT", "MID 4410388 STL 0421", 655.40)
  };
  const cases = [
    // [vals, by, opened days ago, state, assigned, scenario work note, allocations [line, amount or null]]
    [{ ...gi(users.pm2, "Facilities", "Carparks"), colType: "AR-iii", colDate: ago(8), colTx: tx(["NETS", 1842.50], ["Credit Card", 2315.00], ["Cashcard", 410.20]) }, users.pm2, 8, "work_in_progress", "u_ar1",
      `Scenario: split and part matched. One day's takings (SGD 4,567.70) settle as three bank lines on different days: NETS ${L.netsA.number} (T+1), credit card ${L.ccA.number} and cashcard ${L.ezA.number} (T+2). NETS is matched; the card and cashcard lines are still open.`, [[L.netsA, null]]],
    [{ ...gi(users.pm1, "Healthcare", "Clinics"), colType: "AR-iii", colDate: ago(5), colTx: tx(["NETS", 620.00]) }, users.pm1, 5, "new", null,
      `Scenario: combined. NETS settles per merchant, not per counter: bank line ${L.netsB.number} (SGD 1,760.00) pays this case (SGD 620.00) and the Hospitals counter's case together. Allocate 620.00 here and 1,140.00 there.`, []],
    [{ ...gi(users.pm2, "Healthcare", "Hospitals"), colType: "AR-iii", colDate: ago(5), colTx: tx(["NETS", 1140.00]) }, users.pm2, 5, "new", null,
      `Scenario: combined. Paid by the same NETS line ${L.netsB.number} as the Clinics counter's case; no line has exactly SGD 1,140.00.`, []],
    [{ ...gi(users.pm1, "Facilities", "Retail Leasing"), colType: "AR-iii", colDate: ago(10), colTx: tx(["Credit Card", 3000.00]) }, users.pm1, 10, "work_in_progress", "u_ar2",
      `Scenario: bank fees. Card takings SGD 3,000.00 settle net of the bank's commission (1.8% MDR, SGD 54.00): line ${L.ccC.number} is SGD 2,946.00. Matching leaves 54.00 open on the case (fee treatment to decide).`, []],
    [{ ...gi(users.pm2, "Infrastructure", "Roads"), colType: "AR-iv", colDate: ago(4), colRef: "RDS-RCV-2026-118",
       colAlloc: [{ desc: "Road closure permit recovery", amount: $(4200.00), costCentre: cc("Infrastructure"), accountCode: ac("4300") }, { desc: "Damaged signage recovery", amount: $(865.05), costCentre: cc("Infrastructure"), accountCode: "other", accountCodeOther: "4390 Misc recoveries" }] }, users.pm2, 4, "work_in_progress", "u_ar1",
      `Scenario: rounding difference. The payer quoted our Reference Number, but paid SGD 5,065.00 (line ${L.ibgD.number}) against SGD 5,065.05: 5 cents short.`, []],
    [{ ...gi(users.pm1, "Environmental", "Waste"), colType: "AR-iv", colDate: ago(4), colRef: "ENV-W-0457",
       colAlloc: [{ desc: "Bin rental recovery, week 1", amount: $(1280.00), costCentre: cc("Environmental"), accountCode: ac("4200") }] }, users.pm1, 4, "new", null,
      `Scenario: two days banked together. Line ${L.fastE.number} (SGD 2,240.00, reference ENV-W-0457/0461) is bigger than this case (SGD 1,280.00): it also pays ENV-W-0461.`, []],
    [{ ...gi(users.pm1, "Environmental", "Waste"), colType: "AR-iv", colDate: ago(3), colRef: "ENV-W-0461",
       colAlloc: [{ desc: "Bin rental recovery, week 2", amount: $(960.00), costCentre: cc("Environmental"), accountCode: ac("4200") }] }, users.pm1, 3, "new", null,
      `Scenario: two days banked together. Paid by the same line ${L.fastE.number} as ENV-W-0457.`, []],
    [{ ...gi(users.pm2, "Marine", "Port Works"), colType: "AR-v", colCategory: "cash_bail", ar5Date: ago(7), ar5Receipt: "G56-771204", bailAmount: $(5000.00), bailorName: "Tan Wei Ming",
       ibCase: "IB/2026/004417", caseStatus: "pending", accusedName: "Lim Ah Kow", ar5Refund: "no" }, users.pm2, 7, "work_in_progress", "u_ar1",
      `Scenario: look-alike. Two Cash Bail cases of SGD 5,000.00 each. Line ${L.ttF1.number} quotes this case's IB number; line ${L.fastF2.number} says only "CASH BAIL". Check the IB number and the bailor before matching.`, []],
    [{ ...gi(users.pm1, "Marine", "Offshore"), colType: "AR-v", colCategory: "cash_bail", ar5Date: ago(6), ar5Receipt: "G56-771260", bailAmount: $(5000.00), bailorName: "Nur Aisyah Binte Rahman",
       ibCase: "IB/2026/004502", caseStatus: "pending", accusedName: "Ong Kah Huat", ar5Refund: "no" }, users.pm1, 6, "new", null,
      `Scenario: look-alike, no reference. The likely line is ${L.fastF2.number} (SGD 5,000.00, reference "CASH BAIL" only), but ${L.ttF1.number} has the same amount. Ask the requester for the bank-in slip.`, []],
    [{ ...gi(users.pm1, "Marine", "Offshore"), colType: "AR-v", colCategory: "seized", ar5Date: ago(10), ar5Forfeit: "yes", ar5CourtOrder: "yes", ar5Invest: "no", ar5RefundS: "no",
       ar5Lines: [{ caseNumber: "SM-2026-0081", amount: $(2300.00), caseStatus: "pending" }, { caseNumber: "SM-2026-0082", amount: $(415.00), caseStatus: "case_closed" }] }, users.pm1, 10, "closed_complete", "u_ar2",
      `Scenario: already matched. One TT line ${L.ttSM.number} quotes both case numbers and equals the case total (SGD 2,715.00).`, [[L.ttSM, null]]],
    [{ ...gi(users.pm2, "Marine", "Dredging"), colType: "AR-v", colCategory: "restitution", ar5Date: ago(4), ar5CourtOrder: "yes", colRemarks: "Second restitution amount received after the court hearing.",
       ar5Lines: [{ caseNumber: "RS-2026-0019", amount: $(750.00), caseStatus: "pending" }, { caseNumber: "RS-2026-0020", amount: $(320.00), caseStatus: "case_closed" }] }, users.pm2, 4, "work_in_progress", "u_ar1",
      `Scenario: matched across two Deposit IDs. The two case lines were paid the same day by TT (${L.ttRS.number}) and FAST (${L.fastRS.number}), so they sit under two Deposit IDs.`, [[L.ttRS, null], [L.fastRS, null]]],
    [{ ...gi(users.pm2, "Rail", "Signalling"), colType: "AR-iii", colDate: ago(5), colTx: tx(["NETS FlashPay", 655.40]) }, users.pm2, 5, "awaiting_requestor_info", "u_ar2",
      `Scenario: wrong bank account. The settlement ${L.opsH.number} landed in the Operating account (${OPS.number}), not the AR collections account that receives AR-iii money, so it ranks lower in Suggested matches. Asked the requester to check the terminal's settlement account.`, []]
  ];
  const label = v => TABLES.requests.fields.find(f => f.key === "state").choices.find(x => x[0] === v)?.[1] || v;
  for (const [vals, by, days, state, ar, note, allocs] of cases) {
    const opened = ago(days), r = createRequest(vals, { requestedBy: by?.id, opened }), at = opened + "T09:00:00";
    if (ar) { r.assignedTo = ar; r.state = "work_in_progress"; journal(r, "system", `Assigned to ${S.users.find(u => u.id === ar).name}.`, ar); }
    journal(r, "work_note", note, ar || "u_ar1");
    for (const [d, amt] of allocs) { allocate(d.id, r.id, amt, "Matched by AR."); journal(r, "work_note", `BSU deposit ${d.number} (${d.payer}, SGD ${(d.amount / 100).toFixed(2)}) matched to this case.`, ar); }
    if (state !== r.state) { r.state = state; journal(r, "system", `State changed to ${label(state)}.`, ar || by?.id); }
    if (state === "awaiting_requestor_info") { r.substate = "awaiting_input"; journal(r, "comment", "The NETS settlement for this terminal reached the Operating account. Please confirm the terminal's settlement account with the bank.", ar); }
    r.activity.forEach(e => { e.at = at; }); r.updated = opened;
    S.history.push({ table: "requests", id: r.id, at, by: by?.id, kind: "created" });
  }
}

/** AR-ii (#13, #15) and AR-x (#14), demo: one case each, made from the sample Excel. AR has started on the first task.
 *  The AR-x case has one payee typed on the form with a different amount from the Excel, so AR's check shows a No. */
function refundCases() {
  const pm = S.users.find(u => u.id === "u_pm1"), pm2 = S.users.find(u => u.id === "u_pm2"); if (!pm || !pm2) return;
  const make = (vals, by, days, taskTable) => {
    const opened = addDays(isoToday(), -days), at = opened + "T10:00:00";
    const r = createRequest({ requesterName: by.name, requesterEmail: by.email, ccList: "", attachments: [], xlRows: sampleRows(vals.form), xlFile: TEMPLATES[vals.form].file, ...vals }, { requestedBy: by.id, opened });
    r.assignedTo = "u_ar1"; r.state = "work_in_progress"; journal(r, "system", "Assigned to " + (S.users.find(u => u.id === "u_ar1")?.name || "AR") + ".", "u_ar1");
    const t1 = S[taskTable].find(x => x.requestId === r.id && x.seq === 1); if (t1) Object.assign(t1, { state: "work_in_progress", assignedTo: "u_ar1" });
    r.activity.forEach(e => { e.at = at; }); r.updated = opened;
    S.history.push({ table: "requests", id: r.id, at, by: by.id, kind: "created" });
  };
  make({ form: "AR-ii", department: "Facilities", deptSubBu: "Property Management", urgentReason: "Tenants are waiting for the deposit refunds before the end of the month.",
    refundReasons: [{ reason: "A", casesCount: 2 }, { reason: "others", casesCount: 1 }] }, pm, 2, "refundTasks");
  make({ form: "AR-x", department: "Marine", deptSubBu: "Offshore", ar10Expedited: "yes", urgentReason: "Court order deadline on Friday.", colRemarks: "Row 3 is the forfeiture journal for SM-2026-0081.", ar10Ack: true,
    ar10Payees: [{ payee: "Peter Lim", amount: 25000 }, { payee: "Kallang Events Pte Ltd", amount: 100000 }] }, pm2, 1, "ar10Tasks");
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
  for (const [num, rows] of Object.entries(DEMO_LINES)) {
    const r = S.requests.find(x => x.number === num); if (!r) continue;
    r.needItems = "yes";
    rows.forEach(([amt, gstApplicable, accountCode, costCenter], i) => S.lines.push({ id: uid("l"), number: nextNumber("lines"), requestId: r.id, contractId: r.contractId || null,
      ...itemCalc({ seq: i + 1, amount: cents(amt), lpiRate: 0, accountCode, costCenter, gstApplicable }) }));
  }
  collectionCases();   // AR-iii decision 23 (replaces the decision 21 set)
  refundCases();       // AR-ii (#13)
  scheduleHistory();
  for (const num of CLOSED_RECURRING) {
    const r = S.requests.find(x => x.number === num);
    if (!r || !caseRecurring(r) || !r.contractId) continue;
    const k = S.contracts.find(x => x.id === r.contractId), next = nextCycleDate(k) || addWorkingDays(isoToday(), 3);
    const second = addMonths(next, -1), first = addMonths(next, -2), at = first + "T10:00:00";
    // CCI decision 23: AR linked the case and pressed Generate invoice for the 1st invoice, then issued it
    r.linkCustomer ||= r.customerId; r.linkContract ||= r.contractId;
    const res = generateInvoice(r);
    if (res?.opened) Object.assign(res.opened, { state: "issued", date: first, periodDate: first, approvalDate: addDays(first, -3), due: addDays(first, 30) });
    r.state = "closed_complete"; journal(r, "system", "State changed to Closed complete.", r.assignedTo);
    const sch = { id: uid("s"), number: nextNumber("schedules"), customerId: r.customerId, contractId: r.contractId, department: r.department, desc: r.title, frequency: "monthly",
      amount: r.perPeriod || 0, firstDate: second, lastDate: k?.end || "", firstAmount: 0, lastAmount: 0, requestId: r.id };
    S.schedules.push(sch);
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
