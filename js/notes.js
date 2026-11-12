// Build-note registry. Every Build notes label has a stable ID so the owner can request a change with
// "<ID> - <change>" (e.g. "BSU-04 - add a column for currency"). docs/BUILD_NOTES.md lists every ID;
// regenerate it with `node tools/notes.mjs`. No DOM access here.
import { RECORD_PRODUCER, RECORD_PRODUCER_ARIX, ROLES, SCOPE, TABLES } from "./schema.js";

/** Short code per table, used as the prefix of field IDs (e.g. INV.due_date) and record-page IDs. */
export const CODE = { requests: "REQ", invoices: "INV", deposits: "DEP", uploads: "BSU", bankAccounts: "BNK", allocations: "ALC", companies: "CMP", customers: "CUS", contracts: "CON", contacts: "BCT", documents: "DOC", schedules: "SCH", lines: "RQL", items: "RQI" };
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
  "WS-11": "Record header UI action bar (Horizon Record page template): primary UI actions as buttons, the rest in the overflow menu. Visible vs overflow is set per UI action in the workspace action configuration",
  "WS-12": "Record ribbon (Horizon Record page template): collapsible row of up to 12 widgets with key metrics; configured per table in UI Builder (data resources over the record and its related tables)",
  "WS-13": "Record tabs in the resizable pane (Horizon Record page template): Details (form) first, then related items, then one tab per related list; extra tabs move to the More menu",
  "WS-14": "Contextual side bar (Horizon pattern): vertical icon tabs on the right of the record tab, open by default, collapsible and resizable; holds Customer setup, Activity stream and Attachments for AR requests",
  "WS-15": "Form record presence: avatars of users viewing the record (out-of-box on the Horizon Record page template)",
  "WS-17": "Record history tab (out-of-box on the Record page template): sys_audit / sys_history_line for the record. Turn on Audit in the dictionary of every x_ar table; shows when, who, field, old and new value",
  "WS-16": "List page template (Horizon): list menu on the left, list on the right; the menu selection drives the list. Menu can be hidden",
  // AR request record page extras
  "REQ-ACT": "Activity stream: comments (visible to requester) + work_notes (AR only) + field changes",
  "REQ-SETUP": "Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, contract / no-contract shell, bill-to on the contract, documents filed, contract location, billing lines done",
  "CUS-TREE": "Billing hierarchy on the customer record (D15): customer › contract / no-contract shell (x_ar_contract) › billing lines (x_ar_request_line.contract) › invoices / billing schedule. UI Builder component over related lists, or a hierarchical list",
  "REQ-GIRO": "GIRO setup panel (AR-ix case, contextual side bar): contract linked? the contract's GIRO status and active case; then Activate GIRO / Remove GIRO, or why it is blocked (one active GIRO per contract, D21)",
  "REQ-GIROHIST": "Tab GIRO history on the AR-ix case: the AR-ix cases on the same contract (related list x_ar_request where contract = this case's contract and ar_form = AR-ix)",
  "CON-GIRO": "Tab GIRO history on the contract: related list x_ar_request where contract = this contract and ar_form = AR-ix; GIRO column: Active (= contract.giro_case), Ended, Removed GIRO, Open, Rejected",
  "REQ-LINKCTR": "Contract to link (AR-ix): reference to x_ar_contract, matching contract number listed first. Used by Link contract; for a contract not on file AR processes its AR-i first",
  "REQ-LINKCO": "Company (core_company) for the new customer; mandatory when Link to customer creates a new x_ar_customer. Lists companies with no customer yet, closest name first (D26)",
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
  "PT-06": "RETIRED 2026-11-10: replaced by the General information variable set (PT-30, REQ.requester_name / REQ.requester_email)",
  "PT-38": "RETIRED 2026-11-12: Customer point of contact block; POC name / email are now part of the customer details (PT-39)",
  "PT-39": "AR-i Customer section, found customer (D23): read-only customer details in this order: name, UEN, address (from x_ar_customer), agency type, V@G, V@G sub-BU, POC name, POC email (copied from x_ar_customer into the request variables by a catalog client script; variables read-only via UI policy). New customer: the same fields are editable and Link to customer replicates them to the customer",
  "PT-36": "AR-i GIRO subsection inside Contract (D22): 'Is there an existing DDA?' read-only Yes / No (variable giro_on_contract) from the chosen contract's giro_status (GlideAjax), plus the active AR-ix case number when Yes. Greyed out with a tooltip for a new contract or no-contract billing: raise an AR-ix once AR has set up the contract",
  "PT-40": "AR-i new contract variables, in order: new_contract_type (Recurring / Ad-hoc), new_contract_number, new_contract_ref, new_contract_po, new_contract_title, start / end dates, new_contract_value, bill-to person / email / phone, new_contract_billing_cycle (+ suggested billing cycle when Others), new_contract_invoice_date, new_contract_payment_terms (+ other terms when Others), new_contract_proration (+ 1st / last month amounts when Yes), type_of_billing (+ bulk upload when C / D / E). Link to customer creates x_ar_contract from them",
  "PT-41": "AR-i existing contract: every contract detail read-only from x_ar_contract, in the same order as a new contract (catalog client script / read-only HTML widget)",
  "PT-37": "AR-i variable set Invoice details (ARF decisions 31–33): short_description (invoice description), attention_name / attention_email (prefilled from the contract bill-to), amount_per_period (before GST), preferred_invoice_date (mandatory for a recurring contract: first invoice), billing_line_items_required (Yes / No → multi-row variable set PT-43). Catalog client script shows the billing summary: recurring contract → monthly to the contract end date (with contract proration); otherwise one invoice. The producer script creates one x_ar_request_line from these",
  "PT-30": "Variable set General information (D19), first section of every AR form record producer: requester_name (default current user's name), requester_email (from SSO, read-only), department, cc_list (emails; copied to the case watch_list so they can view it on the portal)",
  "PT-31": `Record producer "${RECORD_PRODUCER_ARIX.name}" on ${TABLES.requests.table}. Producer script: ${RECORD_PRODUCER_ARIX.script}`,
  "PT-32": "AR-ix variable set Contract and applicant: customer search, existing contract (reference qualifier: customer's contracts, not shells) or 'not listed' with a reference number; applicant name / email / mobile prefilled from the contract's bill-to (catalog client script onChange contract); invoice reference number",
  "PT-33": "AR-ix variable set GIRO details: purpose (Rental / Carpark / Others), other purpose, type (Add / Remove GIRO); UI policies: rental → location, effective start/end; carpark → car plate, parking start/end; amount (mandatory for Add); supporting documents (attachments)",
  "PT-34": "Info message on AR-ix: the chosen contract's GIRO status and active case (GlideAjax read of x_ar_contract.giro_status / giro_case). Add GIRO on a contract with GIRO active is blocked (onSubmit / validation)",
  "PT-35": "Ticket page block for AR-ix: GIRO request summary and its outcome (contract to be linked / with AR / active / removed)",
  "PT-07": "Catalog client script (onChange contract): contract billing position via GlideAjax / Script Include",
  "PT-08": `Variable attachments → sys_attachment on the created ${TABLES.requests.table}`,
  "PT-09": `Submit → inserts ${TABLES.requests.table} (state New, assignment group AR team). Automation to be defined`,
  "PT-10": `My Requests widget: ${TABLES.requests.table} where opened_by = me (ACL: project team reads own records)`,
  "PT-11": "Ticket page: conversation widget (comments only; work notes hidden)",
  "PT-13": "Ticket fields widget: read-only summary of the request",
  "PT-14": "Service catalog category \"AR forms\": 16 record producers AR-i … AR-xvi (D9)",
  "PT-15": "Catalog item AR-i New AR request (active record producer)",
  "PT-16": "Catalog item placeholder AR-ii … AR-xvi (inactive until defined)",
  "PT-19": "Bill-to (inside the Contract variable set, D16): shows the contract's / shell's bill-to (x_ar_contract.bill_to_*) or asks for one (new contract, or a shell without one), prefilled from the department's x_ar_billing_contact. An existing contract's bill-to is read-only (PT-41); AR changes it in the workspace (D22)",
  "PT-20": "Variable set Contract and bill-to (D15): contract_option (existing / new / no contract required), contract or new-contract variables, contract location, bill-to. UI policies per option",
  "PT-42": "AR-i variable set Others (after Customer documents; final placement to be decided by the owner): invoice_breakdown, cost_center, account_code, agent_name, po_number. All optional",
  "PT-43": "AR-i multi-row variable set Billing line items (x_ar_request_item), shown when billing_line_items_required = Yes: billing_item_number*, amount_excl_gst*, gst_amount and total_amount (calculated by catalog client script at the GST rate, read-only), late_payment_interest (rate %), account_code. At least one row when Yes",
  "PT-28": "No contract required: info message (UI policy on contract_option = none). Link to customer files the lines under the customer's no-contract shell for the department (x_ar_contract, contract_type = shell)",
  "PT-25": "Variable set Customer (D14): search x_ar_customer by name/UEN (type-ahead); Add as new customer reveals name, UEN, address (UI policy on new_customer)",
  "PT-26": "RETIRED 2026-11-12: What to bill variable set with the Billing lines multi-row variable set; replaced by Invoice details (PT-37). One billing line is now created from the invoice details",
  "PT-27": "Ticket page: billing lines with status per line (invoice number / billing schedule); payment status hidden",
  "PT-29": "Finance coding variables (all optional): cost_center (tooltip: to be filled by GA), account_code, agent_name. Now in the Others section (PT-42); type of billing and the bulk upload are on the contract (PT-40)",
  "PT-23": "Variable set Customer documents: on-file check via GlideAjax on x_ar_customer_document; attach only missing ones (D10)",
};

/** UI actions per table: "UA-<CODE>-<action>". */
export const UI_ACTIONS = {
  "UA-REQ-assign": "Assign to me → assigned_to = current user, state = In progress",
  "UA-REQ-info": "Request info → state = Awaiting info; requires an additional comment (visible on portal)",
  "UA-REQ-reject": "Reject → state = Rejected; requires an additional comment",
  "UA-REQ-linkctr": "Link contract (AR-ix, shown while contract is empty) → sets contract and customer from the chosen x_ar_contract; New → In progress",
  "UA-REQ-giroadd": "Activate GIRO (AR-ix, type Add) → contract.giro_status = Active, contract.giro_case = this case; case → Completed with a requester-visible comment. Blocked when the contract already has GIRO active (D21)",
  "UA-REQ-giroremove": "Remove GIRO (AR-ix, type Remove) → contract.giro_status = Not active, contract.giro_case cleared; system note on the case that was active; case → Completed. Blocked when GIRO is not active",
  "UA-REQ-link": "Link to customer → creates or links x_ar_customer; links the existing contract, creates the new contract, or finds/creates the department's no-contract shell; sets contract on every billing line; writes the bill-to to the contract (and the department default contact if none); files documents to x_ar_customer_document; records contract location (D10, D15, D16)",
  "UA-SCH-raise": "Raise invoice → inserts a draft x_ar_invoice for the period (billing_schedule + billing_period set); never automatic (D12)",
  "UA-SCH-save": "Save (update)",
  "UA-BCT-save": "Save (update)", "UA-BCT-new": "New (list action)", "UA-BCT-insert": "Submit (insert); unique per customer + department",
  "UA-CUS-newcontact": "Add billing contact → new billing contact form with customer prefilled",
  "UA-RQL-invoice": "Create invoice (one-off line) → inserts draft x_ar_invoice for the line (request_line set)",
  "UA-RQL-schedule": "Set up billing schedule (recurring line) → inserts x_ar_billing_schedule over the line's date range; comment to requester (D12, D13)",
  "UA-RQL-save": "Save (update, while the line is open)",
  "UA-PT-newcust": "Portal: Add as new customer (sets new_customer = true, copies the search text into the name)",
  "UA-PT-additem": "Portal: Add item (row in the Billing line items multi-row variable set); Remove deletes a row",
  "UA-PT-addline": "RETIRED 2026-11-12: Add one-off / recurring line; the request has one billing event from the invoice details (PT-37)",
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
  "RL-REQ-RQL": "ar_request", "RL-REQ-RQI": "ar_request",
  "RL-CUS-BCT": "customer", "RL-CUS-DOC": "customer", "RL-CUS-SCH": "customer", "RL-SCH-INV": "billing_schedule",
  "RL-CUS-CON": "customer", "RL-CUS-INV": "customer", "RL-CUS-REQ": "customer",
  "RL-CON-INV": "contract", "RL-CON-REQ": "contract", "RL-CON-RQL": "contract", "RL-CON-SCH": "contract",
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
  "CON.status": "Calculated: Active / Not started / Ended from start and end dates (shells: Open)",
  "CON.line_count": "Calculated: number of billing lines filed under the contract",
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
  if ((m = id.match(/^([A-Z]+)\.([a-z_.]+)$/)) && T[m[1]]) {
    const f = TABLES[T[m[1]]].fields.find(x => x.name === m[2]);
    if (f) return fieldText(T[m[1]], f);
  }
  return null;
}

/** Every known ID, for docs/BUILD_NOTES.md. */
export function allNotes() {
  const out = [];
  const add = (id, area) => out.push({ id, area, text: noteText(id) });
  for (const id of Object.keys(NOTES)) add(id, id.startsWith("PT") ? "Portal" : id.startsWith("BSU") ? "BSU page" : id.startsWith("CSH") ? "Cash application" : id.startsWith("REQ") ? "AR request record" : id.startsWith("CUS") ? "Customer record" : "Workspace");
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
