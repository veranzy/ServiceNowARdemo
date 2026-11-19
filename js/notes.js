// Build-note registry. Every Build notes label has a stable ID so the owner can request a change with
// "<ID> - <change>" (e.g. "BSU-04 - add a column for currency"). docs/BUILD_NOTES.md lists every ID;
// regenerate it with `node tools/notes.mjs`. No DOM access here.
import { RECORD_PRODUCER, RECORD_PRODUCER_ARIX, ROLES, SCOPE, TABLES } from "./schema.js";

/** Short code per table, used as the prefix of field IDs (e.g. INV.due_date) and record-page IDs. */
export const CODE = { requests: "REQ", invoices: "INV", deposits: "DEP", uploads: "BSU", bankAccounts: "BNK", allocations: "ALC", companies: "CMP", customers: "CUS", contracts: "CON", contacts: "BCT", documents: "DOC", schedules: "SCH", lines: "RQL", items: "RQI", colTx: "CTX", colAlloc: "CAL", ar5Lines: "C5L", costCentres: "CCT", accountCodes: "ACT", paymentModes: "PMD" };
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
  "WS-13": "Record tabs in the resizable pane (Horizon Record page template): Details (form) first, then related items, then one tab per related list; extra tabs move to the More menu, except on customer and contract records, which show every tab (CCI 2026-11-16)",
  "WS-14": "Contextual side bar (Horizon pattern): vertical icon tabs on the right of the record tab, open by default, collapsible and resizable; holds Customer setup, Activity stream and Attachments for AR requests",
  "WS-15": "Form record presence: avatars of users viewing the record (out-of-box on the Horizon Record page template)",
  "WS-17": "Record history tab (out-of-box on the Record page template): sys_audit / sys_history_line for the record. Turn on Audit in the dictionary of every x_ar table; shows when, who, field, old and new value",
  "WS-16": "List page template (Horizon): list menu on the left, list on the right; the menu selection drives the list. Menu can be hidden",
  // AR request record page extras
  "REQ-ACT": "Activity stream: comments (visible to requester) + work_notes (AR only) + field changes",
  "REQ-SETUP": "RETIRED 2026-11-17 (D31): AR-i Customer setup panel removed with Link to customer. Was: Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, contract / no-contract shell, bill-to on the contract, documents filed, billing lines done",
  "CUS-TREE": "RETIRED 2026-11-16 (CCI): Billing hierarchy tab removed from the customer record; usage and purpose to revisit (GitHub issue #6)",
  "REQ-GIRO": "GIRO setup panel (AR-ix case, contextual side bar): contract set? (for No contract required: the customer's no-contract shell for the department, set as Contract on the case); the contract's GIRO status and active case; reminder to update GIRO status and Active GIRO case on the contract record, then set State = Closed complete (AR-ix decision 11, AR-00 2026-11-16)",
  "REQ-GIROHIST": "Tab GIRO history on the AR-ix case: the AR-ix cases on the same contract (related list x_ar_request where contract = this case's contract and ar_form = AR-ix)",
  "REQ-FV-ARI": "Form view ar_i on x_ar_request (view rule: ar_form = AR-i), used by the workspace Details tab (UIX decision 12): sections Case, 1. General information, 2. Customer, 3. Contract and bill-to, 4. Invoice details, 5. Customer documents, 6. Others, in the AR-i portal order; every field of each section on the form, empty when not answered; editable while the case is open",
  "REQ-FV-COL": "Form view collections on x_ar_request (view rule: ar_form = COL), Details tab: sections Case (with Request value, the amount to collect, D29), 1. General information, 2. Collection type; ribbon Collection type, Request value, BSU deposits matched (sum of accepted allocations with request = this case)",
  "LST-REQ-COL": "Workspace list All Collections (D30): x_ar_request, condition ar_form = COL; default columns as the other AR form lists",
  "REQ-FV-ARIX": "Form view ar_ix on x_ar_request (view rule: ar_form = AR-ix), used by the workspace Details tab (UIX decision 12): sections Case, 1. General information, 2. Select Customer, 3. Select Contract, 4. GIRO details, 5. Attachments (attachment list), in the AR-ix portal order (section 6 Others removed 2026-11-17, AR-ix decision 23); every field shown, empty when not answered; editable while the case is open",
  "LST-REQ-ARI": "Workspace list All AR-i (UIX decision 15, amended 2026-11-16): x_ar_request, condition ar_form = AR-i (every state, open and closed); list view ar_i_all with its own columns (for now: number, ar_form, short_description, customer, department, amount, state, assigned_to, opened_by, opened_at); list menu category AR requests",
  "LST-REQ-ARIX": "Workspace list All AR-ix (UIX decision 15, amended 2026-11-16): x_ar_request, condition ar_form = AR-ix (every state); list view ar_ix_all with its own columns (for now the same as All AR-i); list menu category AR requests",
  "CON-GIRO": "Tab GIRO history on the contract (and on no-contract shells): related list x_ar_request where contract = this contract and ar_form = AR-ix; columns AR-ix case, Type of request, Purpose of GIRO/DDA request, Amount, Requested by, Updated, GIRO (Active = contract.giro_case, Completed, Open, Contract to link, Rejected)",
  "REQ-LINKCTR": "RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Contract to link picker in the AR-ix GIRO setup panel (Link contract retired)",
  "REQ-LINKCO": "RETIRED 2026-11-17 (D31): Company (core_company) for the new customer; mandatory when Link to customer creates a new x_ar_customer. Lists companies with no customer yet, closest name first (D26)",
  "REQ-LINKTO": "RETIRED 2026-11-17 (D31): Choice used by Link to customer: create the new customer, or link the AR-i to an existing x_ar_customer (duplicate check)",
  "SCH-PER": "Billing periods of the schedule (computed list, or child table x_ar_billing_period in the build) with status Invoiced / Due / Upcoming; no action column (drafts come from JOB-DAILYINV)",
  "JOB-DAILYINV": "Scheduled job Daily invoice check (daily, D12 amended 2026-11-16): for each x_ar_billing_schedule period with no non-cancelled invoice and invoice date within 5 working days (Mon–Fri) of today, insert a draft x_ar_invoice (billing_schedule, billing_period, contract, customer, ar_request and request_line from the schedule) and add a work note on the AR-i case. Issuing stays manual (Issue invoice). Demo: shown as mock data only (the draft on ARQ0001009); no demo button",
  "REQ-ATT": `Attachments: sys_attachment on ${TABLES.requests.table} (added on the portal form)`,
  // cash application: page retired 2026-11-18 (BSU decision 21)
  "CSH-01": `RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Cash application page (UI Builder custom page)`,
  "CSH-02": `RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Single-score cards over ${TABLES.deposits.table} / ${TABLES.allocations.table}`,
  "CSH-03": `RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: List of ${TABLES.deposits.table} with match state; filter tabs To match / Matched / All`,
  "CSH-04": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Invoice finder (modal or side panel): ranked issued invoices and open Collections cases (ar_form = COL: AR-iii, AR-iv, AR-v; D29, D30) + allocation preview before confirming",
  "INV-PDF": "Invoice document (CCI decision 13): HTML template rendered with PDF Generation Utilities (sn_pdfgeneratorutils) when AR issues the invoice and attached to the invoice; the workspace tab shows the same template as a preview (DRAFT / CANCELLED watermark when not issued). Template wording is a draft",
  "BSU-08": "Preview tag No payment mode (BSU decision 18): the line's transaction ID matches no active payment mode of the bank account; it is saved with the fallback Deposit ID UNK-<DDMMYY>-XX",
  "CSH-06": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Finder tag Account receives AR-… (BSU decision 13): the deposit's bank account lists the case's collection type in collection_types; adds to the ranking score, never hides other candidates",
  "CSH-05": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Collection case tag in the invoice finder and preview (D29): the candidate is an open x_ar_request with ar_form = COL (tag shows its collection_type, D30) and Request value (amount) not yet matched; its allocation sets request instead of invoice",
  // BSU decision 21: matching on the standard workspace record pages (manual only, D5)
  "RL-DEP-SUG": `Suggested matches tab on ${TABLES.deposits.table} (BSU decision 21): workspace data resource (script) listing up to 10 issued invoices with amount due and open Collections cases (ar_form = COL) not yet on this deposit, ranked by: invoice / case number or reference cited in the bank reference, amount fit (exact or within 3%), payer-name similarity, and the bank account's collection types. Column Why suggested shows the signals. A suggestion only: nothing is matched until AR presses Match (D5)`,
  "ALC-DELTA": `Summary line on the Allocations tabs (deposit, invoice, Collections case; BSU decision 22): Amount (the record's own fixed amount: deposit amount, invoice amount, case Request value), Allocation value (sum of its ${TABLES.allocations.table} amounts), Delta (Amount − Allocation value): on a deposit the money to refund or apply elsewhere, on an invoice / case the amount still to collect or offset. Calculated, not stored`,
  "RL-INV-SUG": `Suggested BSU deposits tab on ${TABLES.invoices.table} (BSU decision 21): up to 10 ${TABLES.deposits.table} records with an unmatched amount, ranked with the same signals; only for issued invoices with amount due. Match on a row allocates (D5: manual)`,
  "RL-REQ-SUG": `Suggested BSU deposits tab on Collections cases (${TABLES.requests.table}, ar_form = COL; BSU decision 21, D29): as RL-INV-SUG, against the case's Request value still to match`,
  // BSU page
  "BSU-01": `BSU upload form (BSU decision 16): opened by New on the Statement uploads list (the BSU rail item opens that list of upload RITMs); upload form, preview, save opens the new RITM`,
  "BSU-02": `RETIRED 2026-11-18 (BSU decision 16): statement-day checklist; upload completeness tracking to be decided`,
  "BSU-03": "Upload form = catalog item 'Bank statement upload' rendered in the workspace (D32): variables bank account, statement date, CSV attachment; submit creates the RITM",
  "BSU-04": `CSV file kept as sys_attachment on ${TABLES.uploads.table}`,
  "BSU-05": "Bank template: column mapping per bank (config table x_ar_bank_template or system properties)",
  "BSU-06": "Preview before insert: deposits with Deposit IDs, skipped withdrawals, totals",
  "BSU-07": `RETIRED 2026-11-18 (BSU decision 16): recent uploads card; the Statement uploads list replaces it`,
  // portal
  "PT-01": `Service Portal header (sp_header_footer), audience role ${ROLES.project.role}`,
  "PT-02": "Portal homepage: search + quick links widgets",
  "PT-03": `Quick link to catalog item: record producer "${RECORD_PRODUCER.name}"`,
  "PT-04": "Quick link to My Requests",
  "PT-05": `Record producer "${RECORD_PRODUCER.name}" on ${TABLES.requests.table}. Producer script: ${RECORD_PRODUCER.script}`,
  "PT-06": "RETIRED 2026-11-10: replaced by the General information variable set (PT-30, REQ.requester_name / REQ.requester_email)",
  "PT-38": "RETIRED 2026-11-12: Customer point of contact block; POC name / email are now part of the customer details (PT-39)",
  "PT-39": "AR-i Customer section, found customer (D23): read-only customer details in this order: name, UEN, address (from x_ar_customer), agency type, V@G, V@G sub-BU, POC name, POC email (copied from x_ar_customer into the request variables by a catalog client script; variables read-only via UI policy). New customer: the same fields are editable; AR copies them to the customer by hand (D23 as amended by D31)",
  "PT-36": "AR-i GIRO subsection inside Contract (D22): 'Is there an existing DDA?' read-only Yes / No (variable giro_on_contract) from the chosen contract's giro_status (GlideAjax), plus the active AR-ix case number when Yes. Greyed out with a tooltip for a new contract or no-contract billing: raise an AR-ix once AR has set up the contract",
  "PT-40": "AR-i new contract variables, in order: new_contract_type (Recurring / Ad-hoc), new_contract_number, new_contract_ref, new_contract_po, new_contract_title, start / end dates, new_contract_value, bill-to person / email / phone, new_contract_billing_cycle (+ suggested billing cycle when Others), new_contract_invoice_date, new_contract_payment_terms (+ other terms when Others), new_contract_proration (+ 1st / last month amounts when Yes) (type_of_billing moved to section 2, AR-i decision 43). AR creates x_ar_contract from them by hand, then links it with Link Contract Reference (D31)",
  "PT-41": "AR-i existing contract: every contract detail read-only from x_ar_contract, in the same order as a new contract (catalog client script / read-only HTML widget)",
  "PT-37": "AR-i variable set Invoice details (AR-i decisions 31–33): short_description (invoice description), attention_name / attention_email (prefilled from the contract bill-to), amount_per_period (before GST), preferred_invoice_date_choice (label 'Preferred invoice date': Per Billing Cycle / Expedited, optional; only for a one-invoice request, UI policy hides and clears it for a recurring contract) and preferred_invoice_date_justification (shown when Expedited, optional), po_number (Customer PO number, optional; UI policy shows it only when agency_type = SB and vag = Yes, AR-i decision 42), billing_line_items_required (Yes / No → multi-row variable set PT-43). Catalog client script shows the billing summary: recurring contract → monthly to the contract end date (with contract proration); otherwise one invoice. The producer script creates one x_ar_request_line from these",
  "PT-30": "Variable set General information (D19), first section of every AR form record producer: requester_name (default current user's name), requester_email (from SSO, read-only), department, cc_list (emails; copied to the case watch_list so they can view it on the portal)",
  "PT-31": `Record producer "${RECORD_PRODUCER_ARIX.name}" on ${TABLES.requests.table}. Producer script: ${RECORD_PRODUCER_ARIX.script}`,
  "PT-32": "AR-ix variable set Select Contract (AR-ix decision 12): Existing contract, New contract (no reference asked here since 2026-11-17, decision 25: the GIRO details reference giro_reference is used) or No contract required (producer script sets contract = the customer's no-contract shell for the department when it exists). Existing contract reference qualifier (decision 22, E8.5): the customer's contracts, not No contract, where contract.department = the form's Department OR the requester is in contract.contract_owners; a Department change clears a contract that no longer qualifies (catalog client script)",
  "PT-33": "AR-ix variable set GIRO details (decisions 14, 15 amended, 18–21): Type of request first, choices filtered by the contract (catalog client script: new / no contract → Add GIRO; existing contract → Add GIRO when giro_status is Not active, Remove GIRO only when Active), with the owner's help text. Contract / tenancy agreement / reference (optional): Remove GIRO after Type; Add GIRO right after Purpose, hidden when Purpose = Carpark (decision 24). Remove GIRO: reference, Effective end date (mandatory), nothing more. Add GIRO (UI policies): purpose (placeholder \"-- Choose the purpose --\", no default; choices by contract option, decision 25: No contract required → Carpark, Others; existing or new contract → Rental, Others; a contract change clears a purpose that no longer fits), reference, other purpose, Effective start date (mandatory); Customer name / email / mobile (prefilled from the contract's or shell's bill-to); remarks; rental → location (mandatory), amount; carpark → car plate, location (mandatory), amount; others → nothing more. Attachments is a separate section (PT-46)",
  "PT-34": "Info message on AR-ix: the chosen contract's (or no-contract shell's) GIRO status and active case (GlideAjax read of x_ar_contract.giro_status / giro_case). Active → the form offers only Remove GIRO (decision 14)",
  "PT-35": "Ticket page block for AR-ix: GIRO request summary and its outcome (contract to be linked / with AR / completed / GIRO active when the contract's giro_case is this case)",
  "PT-44": "AR-ix variable set Select Customer (AR-ix decisions 12, 17): customer search showing the customer name only; existing customers only (no new customer on AR-ix, E8.1), with the hint PT-48",
  "PT-45": "AR-ix info message for No contract required: the customer's no-contract shell for the department (x_ar_contract, contract_type = shell) the GIRO goes on, or that AR links it once the shell is set up",
  "PT-46": "AR-ix section Attachments (decision 16, modelled on AR-i Customer documents): supporting documents (sc_attachment on the case), optional, for Add and Remove GIRO",
  "PT-47": "RETIRED 2026-11-17 (AR-ix decision 23, E8.14): variable set Others with Form number (giro_form_number, also retired)",
  "PT-49": "Collections record producer (AR-iii module, D30): one form for AR-iii, AR-iv and AR-v. Catalogue items AR-iii, AR-iv, AR-v open it with collection_type preset. Sections: General information (PT-30), 2. Collection type (PT-50); the rest to be defined",
  "PT-50": "Collections variable set Collection type (D30): collection_type (Choice AR-iii / AR-iv / AR-v, labels to be given), mandatory, preset from the catalogue item",
  "PT-51": "Collections variable set 3. Collection Details (#9 §7–9, AR-iii decision 19): fields of the selected type. AR-iii: Collection Date*. AR-iv: Collection Date, Reference Number (no Requesting Department Cost Centre). AR-v: Category* first, Date of Collection (every category), then: Cash Bail: G56 Receipt Number, Bail Amount Received, Bailor Name, IB Case Number / WEU Number, Case Status (Case Pending / Case Closed), Accused Name, Refund required? (one bailor / accused set per case); Seized Monies: Case lines, then Forfeit, Court order, invest radio, Refund required?; Restitution: Case lines, then Court order (UI policies on collection_type and ar5_category)",
  "PT-52": "Collections AR-iii multi-row variable set Total number of collections for the day (#9 §7, AR-iii decision 19): Collection Type* (Choice), Transaction Amount* (> 0, two decimals); 1 to 99 rows; duplicates allowed (owner). Producer script copies rows to x_ar_collection_tx",
  "PT-53": "Collections AR-iv multi-row variable set Amount for Each Account Code (#9 §8): Description*, Amount* (> 0, two decimals), Cost Centre* (active, Requesting Department), Account Code* (active); 1 to 10 rows. Producer script copies rows to x_ar_collection_allocation; the allocation total becomes amount (Request value)",
  "PT-54": "Collections AR-v supporting-document guidance by category (#9 §9): Cash Bail: G56, Bailor identity document, Bail Bond Form, Bank-in slip or receipt; Seized Monies and Restitution: G56, Case Property List, Bank-in slip or receipt (UI policy / rich-text label per category)",
  "PT-55": "Collections section 4. Supporting Documents (#9 §10): multiple attachments, optional (sc_attachment on the case); file size and type rules documented for the build, not checked in the demo (owner)",
  "PT-56": "Collections AR-iii Total Amount: calculated sum of Transaction Amount across rows (catalog client script; multi-row set footer); stored as amount on the case (AR-iii decision 19)",
  "PT-59": "Collections AR-v Seized Monies and Restitution multi-row variable set Case lines (AR-iii decision 19): Case Number, Amount, Case Status (choices by category); 0 to 99 rows. Producer script copies rows to x_ar_collection_case_line; the lines' total is the case's amount",
  "PT-60": "Collections AR-v: message shown when Refund required? = Yes (AR-iii decision 19): 'Please raise a AR10' with a link to the AR10 catalogue item (rich-text label / UI policy on ar5_refund_required)",
  "PT-61": "Collections AR-v Case lines Total Amount: calculated sum of Amount across rows (catalog client script; multi-row set footer)",
  "PT-57": "Collections AR-iv allocation total: calculated sum of Amount across rows (catalog client script); stored as amount on the case",
  "PT-48": "AR-ix Select Customer hint (decision 17, E8.1): Customer not found? Submit an AR-i to set up the customer first. Shown under the customer search instead of the AR-i add-as-new-customer button (UA-PT-newcust stays on AR-i)",
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
  "PT-20": "Variable set Contract and bill-to (D15): contract_option (existing / new / no contract required), contract or new-contract variables, bill-to. UI policies per option. Always shown; until a customer is selected it shows only the hint 'Select a customer above to see the contract options.' (AR-i decision 40)",
  "PT-42": "RETIRED 2026-11-19 (AR-i decision 42: Others section removed; agent removed, cost center moved to the billing line items, Customer PO number to Invoice details). Was: AR-i variable set Others (after Customer documents; final placement to be decided by the owner): cost_center, agent_name, po_number. All optional (invoice_breakdown and account_code removed, AR-i decision 39)",
  "PT-62": "AR-i variable set 2. Type of billing (AR-i decision 43), right after General information: type_of_billing (General, Rental, Carpark, Courses, 5, 6). UI policy: 5 or 6 hides the Customer and Contract and bill-to variable sets (no customer or contract on the request); Customer documents and Invoice details stay. Stored on the request; AR copies it to the contract by hand (D31)",
  "PT-63": "AR-i popup (AR-i decision 43): when the chosen existing contract's type_of_billing differs from the requester's choice, a catalog client script (onChange contract, GlideAjax) replaces the value with the contract's and shows a modal (spModal.alert) titled Type of billing changed",
  "PT-43": "AR-i multi-row variable set Billing line items (x_ar_request_item), shown when billing_line_items_required = Yes: item_number (row number 1, 2, 3…, read-only; the producer script sets it in row order), amount_excl_gst*, gst_amount and total_amount (calculated by catalog client script at the GST rate, read-only), gst_applicable (GST Yes / No, default Yes; No sets gst_amount 0, AR-i decision 43), late_payment_interest (rate %), account_code, cost_center (right of account_code, optional, tooltip To be filled by GA; AR-i decision 42). At least one row when Yes",
  "PT-28": "No contract required: info message (UI policy on contract_option = none). AR creates the customer's no-contract shell for the department by hand if needed (x_ar_contract, contract_type = shell) and links it with Link Contract Reference, which files the lines under it (D31)",
  "PT-25": "Variable set Customer (D14): search x_ar_customer by name/UEN (type-ahead); Add as new customer reveals name, UEN, address (UI policy on new_customer)",
  "PT-26": "RETIRED 2026-11-12: What to bill variable set with the Billing lines multi-row variable set; replaced by Invoice details (PT-37). One billing line is now created from the invoice details",
  "PT-27": "Ticket page: billing lines with status per line (invoice number / billing schedule); payment status hidden",
  "PT-29": "RETIRED 2026-11-19 (AR-i decision 42: Others section removed; agent removed, cost center moved to the billing line items, Customer PO number to Invoice details). Was: Finance coding variables (all optional): cost_center (tooltip: to be filled by GA), agent_name. Now in the Others section (PT-42); type of billing and the bulk upload are on the contract (PT-40)",
  "PT-23": "Variable set Customer documents: on-file check via GlideAjax on x_ar_customer_document; attach only missing ones (D10)",
};

/** UI actions per table: "UA-<CODE>-<action>". */
export const UI_ACTIONS = {
  "UA-PT-addcase": "Collections AR-v Seized Monies / Restitution: + Add row in Case lines (multi-row set, max 99)",
  "UA-PT-addcol": "Collections AR-iii: + Add row in Total number of collections for the day (multi-row set, max 99)",
  "UA-PT-addalloc": "Collections AR-iv: + Add row in Amount for Each Account Code (multi-row set, max 10)",
  "UA-REQ-assign": "Assign to me → assigned_to = current user (assignment_group kept, default Accounts Receivable); New → Work in progress. One of only two case actions with Save (AR-00, 2026-11-16)",
  "UA-REQ-info": "RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Request info. AR sets State = Awaiting requestor information (optional Substate) and posts an additional comment",
  "UA-REQ-reject": "RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Reject. AR sets State = Closed incomplete or Cancelled and posts an additional comment",
  "UA-REQ-linkctr": "RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Link contract (AR-ix). AR sets Contract on the case and Saves; a before-update business rule sets customer from the contract",
  "UA-REQ-giroadd": "RETIRED 2026-11-12 (AR-ix decision 11): Activate GIRO. AR now updates GIRO on the contract record and uses Complete (UA-REQ-girocomplete)",
  "UA-REQ-giroremove": "RETIRED 2026-11-12 (AR-ix decision 11): Remove GIRO. AR now updates GIRO on the contract record and uses Complete (UA-REQ-girocomplete)",
  "UA-REQ-girocomplete": "RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Complete (AR-ix). AR sets State = Closed complete",
  "UA-REQ-link": "RETIRED 2026-11-17 (D31): AR sets up customers, contracts and documents by hand and links the case with Link Customer Reference / Link Contract Reference. Was: Link to customer → creates or links x_ar_customer; links the existing contract, creates the new contract, or finds/creates the department's no-contract shell; sets contract on every billing line; writes the bill-to to the contract (and the department default contact if none); files documents to x_ar_customer_document (D10, D15, D16)",
  "UA-SCH-raise": "RETIRED 2026-11-16 (D12 amended): Raise invoice. Draft invoices now come from the daily scheduled job JOB-DAILYINV",
  "UA-SCH-save": "Save (update)",
  "UA-BCT-save": "Save (update)", "UA-BCT-new": "New (list action)", "UA-BCT-insert": "Submit (insert); several contacts per customer and department allowed (CCI decision 15, D11 amended)",
  "UA-CUS-newcontact": "Add billing contact → new billing contact form with customer prefilled",
  "UA-RQL-invoice": "RETIRED 2026-11-16 (CCI decision 8): Create invoice on a one-off line. The 1st invoice is generated when the AR-i case is set to Closed complete",
  "UA-RQL-schedule": "RETIRED 2026-11-16 (CCI decision 8): Set up billing schedule on a recurring line. AR creates the schedule on the contract (New billing schedule) and picks the AR-i case",
  "UA-RQL-save": "Save (update, while the line is open)",
  "UA-PT-newcust": "Portal: Add as new customer (sets new_customer = true, copies the search text into the name)",
  "UA-PT-additem": "Portal: Add item (row in the Billing line items multi-row variable set); Remove deletes a row",
  "UA-PT-addline": "RETIRED 2026-11-12: Add one-off / recurring line; the request has one billing event from the invoice details (PT-37)",
  "UA-REQ-post": "Post work note / additional comment to the activity stream",
  "UA-REQ-save": "Save (update). On x_ar_request also: state change journalled (system note); substate cleared unless state = Awaiting requestor information; AR-ix contract change sets customer from the contract; AR-i set to Closed complete generates the 1st invoice as a draft for each line without one (blocked until customer and contract are linked; CCI decision 8)",
  "UA-INV-issue": "Issue invoice (saves the form first) → state = Issued; blocked until approval_date is set (every invoice, CCI decision 9); posts a comment to the requester on the linked AR request",
  "UA-INV-cancel": "Cancel invoice → only when no BSU deposit is matched",
  "UA-INV-save": "Save (update, draft only)",
  "UA-DEP-match": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Match to invoice → opens the invoice finder for this deposit",
  "UA-DEP-find": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Find invoice → opens the invoice finder",
  "UA-DEP-confirm": `RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Confirm match → inserts ${TABLES.allocations.table} records (manual), with invoice or, for a Collections case, request set (D29)`,
  "UA-DEP-remove": "Remove match (header action on the deposit, shown when it has allocations) → deletes the deposit's allocations",
  "UA-SUG-match": `Match (row action on Suggested matches / Suggested BSU deposits, BSU decisions 21–22) → opens the New allocation form with the deposit and the invoice / case filled and Allocation value prefilled with the smaller of the deposit's unmatched amount and the target's amount due; AR confirms or changes it and saves (UA-ALC-insert). Exception set from what is left (Exact, Short pay, Overpayment, Multi-invoice)`,
  "UA-DEP-newalloc": `New on the deposit's Allocations tab (BSU decision 21) → New allocation form with BSU deposit prefilled; AR picks an invoice or a Collection case and may change the amount`,
  "UA-INV-newalloc": `New on the invoice's Allocations tab (BSU decision 21) → New allocation form with Invoice prefilled; AR picks the BSU deposit`,
  "UA-REQ-newalloc": `New on the Collections case's BSU deposits matched tab (BSU decision 21, D29) → New allocation form with Collection case prefilled; AR picks the BSU deposit`,
  "UA-ALC-insert": `Submit (insert) of ${TABLES.allocations.table} (BSU decision 21): exactly one of invoice or request; amount empty = default (smaller of deposit unmatched and target due); blocked above either; returns to the record it was opened from`,
  "UA-DEP-export": "RETIRED 2026-11-18 (BSU decision 21: matching moved to standard record tabs). Was: Export matches to CSV",
  "UA-BSU-new": "New (list action on Statement uploads): opens the upload form (catalog item Bank statement upload)",
  "UA-BSU-save": `Save to bank statements → submits the catalog item: creates the RITM (${TABLES.uploads.table}, one per bank account per day); a flow parses the CSV with the bank's template, inserts one ${TABLES.deposits.table} row per deposit referencing the RITM, and closes the RITM complete`,
  "UA-BSU-sample": "Demo only: generate a sample CSV in the bank's layout",
  "UA-BNK-upload": "Upload statement → opens the BSU page for this account",
  "UA-CUS-save": "Save (update)", "UA-CON-save": "Save (update)", "UA-BNK-save": "Save (update)",
  "UA-CUS-new": "New (list action)", "UA-CON-new": "New (list action)", "UA-CCT-new": "New (list action)", "UA-INV-pdf": "Print or save as PDF: opens the invoice document for printing (in ServiceNow: download the generated PDF attachment)", "UA-BNK-newmode": "New payment mode (on the bank account): opens a new payment mode with the bank account filled in", "UA-PMD-new": "New (list action)", "UA-PMD-insert": "Submit (insert)", "UA-PMD-save": "Save (update)", "UA-RQL-newrel": "New billing line on the contract's Billing lines tab (#10 E10.7): AR copies the AR-i line; contract filled in", "UA-INV-newrel": "New invoice on the contract's Invoices tab (#10 E10.10, CCI decision 14): draft invoice with customer and contract filled in", "UA-BCT-newrel": "Add billing contact on the customer's Billing contacts tab", "UA-INV-insert": "Submit (insert)", "UA-RQL-insert": "Submit (insert)", "UA-DOC-new": "New (list action): AR files a customer document by hand (D31)", "UA-DOC-insert": "Submit (insert)", "UA-DOC-save": "Save (update)", "UA-ACT-new": "New (list action)", "UA-CCT-save": "Save (update)", "UA-CCT-insert": "Submit (insert)", "UA-ACT-save": "Save (update)", "UA-ACT-insert": "Submit (insert)", "UA-BNK-new": "New (list action)",
  "UA-CUS-insert": "Submit (insert)", "UA-CON-insert": "Submit (insert)", "UA-SCH-insert": "Submit (insert) of a billing schedule created from the contract (CCI decision 8)", "UA-BNK-insert": "Submit (insert)",
  "UA-CON-newschedule": "New billing schedule (contract record, CCI decision 8) → new x_ar_billing_schedule form with contract (and customer) prefilled; AR sets the 2nd invoice's date as first billing date and picks the AR-i case (source_request)",
  "UA-CUS-newcontract": "New contract → new contract form with customer prefilled"
};

/** Related lists: "RL-<PARENT>-<CHILD>" with the reference field that links them. */
export const RELATED = {
  "RL-REQ-RQL": "ar_request", "RL-REQ-RQI": "ar_request", "RL-REQ-INV": "ar_request", "RL-REQ-SCH": "contract (the case's contract; read-only on the case)",
  "RL-CUS-BCT": "customer", "RL-CUS-DOC": "customer", "RL-CUS-SCH": "customer", "RL-SCH-INV": "billing_schedule",
  "RL-CUS-CON": "customer", "RL-CUS-INV": "customer", "RL-CUS-REQ": "customer",
  "RL-CON-INV": "contract", "RL-CON-REQ": "contract", "RL-CON-RQL": "contract", "RL-CON-SCH": "contract",
  "RL-INV-ALC": "invoice", "RL-DEP-ALC": "deposit", "RL-REQ-ALC": "request", "RL-REQ-CTX": "ar_request", "RL-REQ-CAL": "ar_request", "RL-REQ-C5L": "ar_request", "RL-CCT-CAL": "cost_centre", "RL-INV-RQL": "invoice", "RL-BNK-PMD": "bank_account", "RL-ACT-CAL": "account_code",
  "RL-BSU-DEP": "bsu", "RL-BNK-BSU": "bank_account", "RL-BNK-DEP": "bank_account"
};

/** Calculated list columns: "<CODE>.<name>". */
export const CALC_COLS = {
  "INV.amount_due": "Calculated: amount − matched BSU deposits",
  "INV.payment_status": "Calculated: Unpaid / Part paid / Paid / Overdue",
  "DEP.unmatched_amount": "Calculated: amount − allocations",
  "DEP.match_state": "Calculated: Unmatched / Part matched / Matched",
  "CUS.open_ar": "RETIRED 2026-11-18 (CCI decision 20): Open AR column on the Customers list. Was: calculated sum of amount_due on issued invoices",
  "CUS.overdue": "Calculated: amount_due on issued invoices past due_date",
  "CON.status": "Calculated: Active / Not started / Ended from start and end dates (shells: Open)",
  "CON.line_count": "Calculated: number of billing lines filed under the contract",
  "BSU.department": `Dot-walk: bank_account.department`,
  "RQL.line_value": "Calculated: one-off amount, or recurring amount × number of periods",
  "RQL.periods": "Calculated: number of billing dates between From and To at the frequency",
  "SCH.next_billing_date": "Calculated: first period on or after today without an invoice",
  "SCH.periods_due": "Calculated: periods up to today without an invoice",
  "BNK.last_statement": `Calculated: latest ${TABLES.uploads.table}.statement_date for the account`,
  "INV.aging": "Calculated (#10 E10.11): Current / 1–30 / 31–60 / 61–90 / 90+ days past the due date, for issued invoices with an amount due",
  "PMD.deposit_id_pattern": "Calculated for display: <prefix>-DDMMYY-<suffix> (BSU decision 18)",
  "PMD.bank_name": "Dot-walk: bank_account.bank (Bank name)",
  "PMD.bank_account_name": "Dot-walk: bank_account.account_name (Bank account name)"
};

function fieldText(table, f) {
  const ref = f.ref ? ` → ${f.ref === "users" ? "sys_user" : f.ref === "groups" ? "sys_user_group" : TABLES[f.ref].table}` : "";
  return `${TABLES[table].table}.${f.name} · ${f.type}${ref}${f.mandatory ? " · mandatory" : ""}${f.readonly ? " · read-only" : ""}${f.help ? ` · ${f.help}` : ""}`;
}

/** Text for any note ID; null when the ID is unknown. */
export function noteText(id) {
  if (NOTES[id]) return NOTES[id];
  if (UI_ACTIONS[id]) return `UI action: ${UI_ACTIONS[id]}`;
  if (CALC_COLS[id]) return CALC_COLS[id];
  let m;
  if ((m = id.match(/^RL-([A-Z][A-Z0-9]*)-([A-Z][A-Z0-9]*)$/)) && RELATED[id]) return `Related list: ${TABLES[T[m[2]]].table} where ${RELATED[id]} = this ${TABLES[T[m[1]]].label.toLowerCase()}`;
  if ((m = id.match(/^(RP|HDR|FRM|LST)-([A-Z][A-Z0-9]*)$/)) && T[m[2]]) {
    const t = TABLES[T[m[2]]];
    return { RP: `Record page (UI Builder) · ${t.table}${t.extends ? ` extends ${t.extends}` : ""}`, HDR: `Record header: highlighted values of ${t.table}`,
      FRM: `Form view: ${t.table} (Default view)`, LST: `List: ${t.table} · list view layout + list menu condition` }[m[1]];
  }
  if ((m = id.match(/^([A-Z][A-Z0-9]*)\.([a-z0-9_.]+)$/)) && T[m[1]]) {   // column names may hold digits (e.g. g56_receipt_number)
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
    for (const p of ["LST", "RP", "HDR", "FRM"]) add(`${p}-${code}`, label);
    for (const f of TABLES[key].fields) add(`${code}.${f.name}`, `${label} fields`);
  }
  for (const id of Object.keys(CALC_COLS)) add(id, "Calculated columns");
  for (const id of Object.keys(RELATED)) add(id, "Related lists");
  for (const id of Object.keys(UI_ACTIONS)) add(id, "UI actions");
  return out;
}

export { SCOPE };
