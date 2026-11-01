// Build-note registry. Every Build notes label has a stable ID so the owner can request a change with
// "<ID> - <change>" (e.g. "BSU-04 - add a column for currency"). docs/BUILD_NOTES.md lists every ID;
// regenerate it with `node tools/notes.mjs`. No DOM access here.
import { RECORD_PRODUCER, ROLES, SCOPE, TABLES } from "./schema.js";

/** Short code per table, used as the prefix of field IDs (e.g. INV.due_date) and record-page IDs. */
export const CODE = { requests: "REQ", invoices: "INV", deposits: "DEP", uploads: "BSU", bankAccounts: "BNK", allocations: "ALC", customers: "CUS", contracts: "CON", contacts: "BCT", documents: "DOC", schedules: "SCH", lines: "RQL" };
const T = Object.fromEntries(Object.entries(CODE).map(([k, c]) => [c, k]));

/** Screen elements that aren't a field, list, record page, related list or UI action. */
export const NOTES = {
  // workspace shell
  "WS-01": `Unified navigation header (Next Experience). Workspace "Receivables Workspace", role ${ROLES.ar.role}`,
  "WS-02": "Global search: AR request, invoice, Deposit ID and contract numbers, customer names",
  "WS-03": "Workspace sidebar: Home, Lists, BSU page, Cash application page",
  "WS-04": "List menu (sys_ux_list_menu_config): categories and lists with conditions",
  "WS-05": "Workspace tabs: landing / list tab plus one tab per opened record",
  "WS-06": "Landing page: single-score data visualisations, each linked to a list menu module",
  "WS-07": `Data visualisation: bar chart of ${TABLES.invoices.table}.amount_due grouped by days past due_date`,
  "WS-08": "Landing page list: new AR requests",
  "WS-09": "Landing page list: overdue invoices",
  // AR request record page extras
  "REQ-ACT": "Activity stream: comments (visible to requester) + work_notes (AR only) + field changes",
  "REQ-SETUP": "Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, department billing contact, documents filed, contract location, billing schedule",
  "REQ-LINKTO": "Choice used by Link to customer: create the new customer, or link the AR-i to an existing x_ar_customer (duplicate check)",
  "SCH-PER": "Billing periods of the schedule (computed list, or child table x_ar_billing_period in the build) with status Invoiced / Due / Upcoming",
  "REQ-ATT": `Attachments: sys_attachment on ${TABLES.requests.table} (added on the portal form)`,
  // cash application
  "CSH-01": `Cash application page (UI Builder custom page)`,
  "CSH-02": `Single-score cards over ${TABLES.deposits.table} / ${TABLES.allocations.table}`,
  "CSH-03": `List of ${TABLES.deposits.table} with match state; filter tabs To match / Matched / All`,
  "CSH-04": "Invoice finder (modal or side panel): ranked issued invoices + allocation preview before confirming",
  // BSU page
  "BSU-01": "BSU page (UI Builder custom page): checklist, upload form, recent uploads",
  "BSU-02": `Statement-day checklist: ${TABLES.bankAccounts.table} left-joined to ${TABLES.uploads.table} for the chosen statement_date`,
  "BSU-03": "Upload form: bank account, statement date, CSV file",
  "BSU-04": `CSV file kept as sys_attachment on ${TABLES.uploads.table}`,
  "BSU-05": "Bank template: column mapping per bank (config table x_ar_bank_template or system properties)",
  "BSU-06": "Preview before insert: deposits with Deposit IDs, skipped withdrawals, totals",
  "BSU-07": `Recent uploads: list of ${TABLES.uploads.table} ordered by uploaded_at desc`,
  // portal
  "PT-01": `Service Portal header (sp_header_footer), audience role ${ROLES.project.role}`,
  "PT-02": "Portal homepage: search + quick links widgets",
  "PT-03": `Quick link to catalog item: record producer "${RECORD_PRODUCER.name}"`,
  "PT-04": "Quick link to My Requests",
  "PT-05": `Record producer "${RECORD_PRODUCER.name}" on ${TABLES.requests.table}. Producer script: ${RECORD_PRODUCER.script}`,
  "PT-06": "Variable requested_by → opened_by (default: current user, read-only)",
  "PT-07": "Catalog client script (onChange contract): contract billing position via GlideAjax / Script Include",
  "PT-08": `Variable attachments → sys_attachment on the created ${TABLES.requests.table}`,
  "PT-09": `Submit → inserts ${TABLES.requests.table} (state New, assignment group AR team). Automation to be defined`,
  "PT-10": `My Requests widget: ${TABLES.requests.table} where opened_by = me (ACL: project team reads own records)`,
  "PT-11": "Ticket page: conversation widget (comments only; work notes hidden)",
  "PT-13": "Ticket fields widget: read-only summary of the request",
  "PT-14": "Service catalog category \"AR forms\": 16 record producers AR-i … AR-xvi (D9)",
  "PT-15": "Catalog item AR-i New AR request (active record producer)",
  "PT-16": "Catalog item placeholder AR-ii … AR-xvi (inactive until defined)",
  "PT-19": "Variable set Department & bill-to: shows the department's billing contact (x_ar_billing_contact) or asks for one (D11)",
  "PT-20": "Variable set Contract: contract reference, contract location and link/file reference",
  "PT-25": "Variable set Customer (D14): search x_ar_customer by name/UEN (type-ahead); Add as new customer reveals name, UEN, address (UI policy on new_customer)",
  "PT-26": "Variable set What to bill: request summary, PO, and multi-row variable set Billing lines (x_ar_request_line); totals by catalog client script",
  "PT-27": "Ticket page: billing lines with status per line (invoice number / billing schedule); payment status hidden",
  "PT-23": "Variable set Customer documents: on-file check via GlideAjax on x_ar_customer_document; attach only missing ones (D10)",
};

/** UI actions per table: "UA-<CODE>-<action>". */
export const UI_ACTIONS = {
  "UA-REQ-assign": "Assign to me → assigned_to = current user, state = In progress",
  "UA-REQ-info": "Request info → state = Awaiting info; requires an additional comment (visible on portal)",
  "UA-REQ-reject": "Reject → state = Rejected; requires an additional comment",
  "UA-REQ-link": "Link to customer → creates or links x_ar_customer, upserts x_ar_billing_contact for the department, files documents to x_ar_customer_document, records contract location (D10, D11)",
  "UA-SCH-raise": "Raise invoice → inserts a draft x_ar_invoice for the period (billing_schedule + billing_period set); never automatic (D12)",
  "UA-SCH-save": "Save (update)",
  "UA-BCT-save": "Save (update)", "UA-BCT-new": "New (list action)", "UA-BCT-insert": "Submit (insert); unique per customer + department",
  "UA-CUS-newcontact": "Add billing contact → new billing contact form with customer prefilled",
  "UA-RQL-invoice": "Create invoice (one-off line) → inserts draft x_ar_invoice for the line (request_line set)",
  "UA-RQL-schedule": "Set up billing schedule (recurring line) → inserts x_ar_billing_schedule over the line's date range; comment to requester (D12, D13)",
  "UA-RQL-save": "Save (update, while the line is open)",
  "UA-PT-newcust": "Portal: Add as new customer (sets new_customer = true, copies the search text into the name)",
  "UA-PT-addline": "Portal: Add one-off / recurring line (multi-row variable set)",
  "UA-REQ-post": "Post work note / additional comment to the activity stream",
  "UA-REQ-save": "Save (update)",
  "UA-INV-issue": "Issue invoice → state = Issued; BR sets AR request to Invoiced and posts a comment to the requester",
  "UA-INV-cancel": "Cancel invoice → only when no BSU deposit is matched",
  "UA-INV-save": "Save (update, draft only)",
  "UA-DEP-match": "Match to invoice → opens the invoice finder for this deposit",
  "UA-DEP-find": "Find invoice → opens the invoice finder",
  "UA-DEP-confirm": `Confirm match → inserts ${TABLES.allocations.table} records (manual)`,
  "UA-DEP-remove": "Remove match → deletes the deposit's allocations",
  "UA-DEP-export": "Export matches to CSV",
  "UA-BSU-save": `Save to bank statements → inserts ${TABLES.uploads.table} + one ${TABLES.deposits.table} row per deposit`,
  "UA-BSU-sample": "Demo only: generate a sample CSV in the bank's layout",
  "UA-BNK-upload": "Upload statement → opens the BSU page for this account",
  "UA-CUS-save": "Save (update)", "UA-CON-save": "Save (update)", "UA-BNK-save": "Save (update)",
  "UA-CUS-new": "New (list action)", "UA-CON-new": "New (list action)", "UA-BNK-new": "New (list action)",
  "UA-CUS-insert": "Submit (insert)", "UA-CON-insert": "Submit (insert)", "UA-BNK-insert": "Submit (insert)",
  "UA-CUS-newcontract": "New contract → new contract form with customer prefilled"
};

/** Related lists: "RL-<PARENT>-<CHILD>" with the reference field that links them. */
export const RELATED = {
  "RL-REQ-RQL": "ar_request",
  "RL-CUS-BCT": "customer", "RL-CUS-DOC": "customer", "RL-CUS-SCH": "customer", "RL-SCH-INV": "billing_schedule",
  "RL-CUS-CON": "customer", "RL-CUS-INV": "customer", "RL-CUS-REQ": "customer",
  "RL-CON-INV": "contract", "RL-CON-REQ": "contract",
  "RL-INV-ALC": "invoice", "RL-DEP-ALC": "deposit",
  "RL-BSU-DEP": "bsu", "RL-BNK-BSU": "bank_account", "RL-BNK-DEP": "bank_account"
};

/** Calculated list columns: "<CODE>.<name>". */
export const CALC_COLS = {
  "INV.amount_due": "Calculated: amount − matched BSU deposits",
  "INV.payment_status": "Calculated: Unpaid / Part paid / Paid / Overdue",
  "DEP.unmatched_amount": "Calculated: amount − allocations",
  "DEP.match_state": "Calculated: Unmatched / Part matched / Matched",
  "CUS.open_ar": "Calculated: sum of amount_due on issued invoices",
  "CUS.overdue": "Calculated: amount_due on issued invoices past due_date",
  "CON.status": "Calculated: Active / Not started / Ended from start and end dates",
  "BSU.department": `Dot-walk: bank_account.department`,
  "RQL.line_value": "Calculated: one-off amount, or recurring amount × number of periods",
  "RQL.periods": "Calculated: number of billing dates between From and To at the frequency",
  "SCH.next_billing_date": "Calculated: first period on or after today without an invoice",
  "SCH.periods_due": "Calculated: periods up to today without an invoice",
  "BNK.last_statement": `Calculated: latest ${TABLES.uploads.table}.statement_date for the account`
};

function fieldText(table, f) {
  const ref = f.ref ? ` → ${f.ref === "users" ? "sys_user" : TABLES[f.ref].table}` : "";
  return `${TABLES[table].table}.${f.name} · ${f.type}${ref}${f.mandatory ? " · mandatory" : ""}${f.readonly ? " · read-only" : ""}${f.help ? ` · ${f.help}` : ""}`;
}

/** Text for any note ID; null when the ID is unknown. */
export function noteText(id) {
  if (NOTES[id]) return NOTES[id];
  if (UI_ACTIONS[id]) return `UI action: ${UI_ACTIONS[id]}`;
  if (CALC_COLS[id]) return CALC_COLS[id];
  let m;
  if ((m = id.match(/^RL-([A-Z]+)-([A-Z]+)$/)) && RELATED[id]) return `Related list: ${TABLES[T[m[2]]].table} where ${RELATED[id]} = this ${TABLES[T[m[1]]].label.toLowerCase()}`;
  if ((m = id.match(/^(RP|HDR|FRM|LST)-([A-Z]+)$/)) && T[m[2]]) {
    const t = TABLES[T[m[2]]];
    return { RP: `Record page (UI Builder) · ${t.table}${t.extends ? ` extends ${t.extends}` : ""}`, HDR: `Record header: highlighted values of ${t.table}`,
      FRM: `Form view: ${t.table} (Default view)`, LST: `List: ${t.table} · list view layout + list menu condition` }[m[1]];
  }
  if ((m = id.match(/^([A-Z]+)\.([a-z_]+)$/)) && T[m[1]]) {
    const f = TABLES[T[m[1]]].fields.find(x => x.name === m[2]);
    if (f) return fieldText(T[m[1]], f);
  }
  return null;
}

/** Every known ID, for docs/BUILD_NOTES.md. */
export function allNotes() {
  const out = [];
  const add = (id, area) => out.push({ id, area, text: noteText(id) });
  for (const id of Object.keys(NOTES)) add(id, id.startsWith("PT") ? "Portal" : id.startsWith("BSU") ? "BSU page" : id.startsWith("CSH") ? "Cash application" : id.startsWith("REQ") ? "AR request record" : "Workspace");
  for (const [key, code] of Object.entries(CODE)) {
    const label = TABLES[key].label;
    for (const p of ["LST", "RP", "HDR", "FRM"]) if (!(key === "allocations")) add(`${p}-${code}`, label);
    for (const f of TABLES[key].fields) add(`${code}.${f.name}`, `${label} fields`);
  }
  for (const id of Object.keys(CALC_COLS)) add(id, "Calculated columns");
  for (const id of Object.keys(RELATED)) add(id, "Related lists");
  for (const id of Object.keys(UI_ACTIONS)) add(id, "UI actions");
  return out;
}

export { SCOPE };
