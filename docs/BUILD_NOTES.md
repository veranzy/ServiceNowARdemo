# Build note IDs

Every element of the prototype that maps to a ServiceNow build item carries a small purple **ID tag**
(off by default; tick *Show IDs* in the demo bar to show them). Hover a tag to see its ServiceNow note;
Alt/Option+click the element to copy its ID. To request a change, write `<ID> - <change>`, for example
`BSU-03 - add a field for the statement's closing balance` or `INV.due_date - default to end of next month`.

ID patterns:

| Pattern | Meaning | Example |
|---|---|---|
| `<TABLE>.<column>` | A field (form, portal variable or list column) | `REQ.po_number` |
| `LST-<TABLE>` / `RP-` / `HDR-` / `FRM-` | List, record page, record header, form view | `RP-INV` |
| `RL-<PARENT>-<CHILD>` | Related list on a record page | `RL-CUS-INV` |
| `UA-<TABLE>-<action>` | UI action (button) | `UA-REQ-invoice` |
| `WS-`, `PT-`, `BSU-`, `CSH-` + number | Workspace, portal, BSU page, cash application elements | `PT-07` |

Table codes: REQ AR request, INV invoice, DEP BSU deposit, BSU statement upload, BNK bank account,
ALC allocation, CUS customer, CON contract.

Generated from `js/notes.js` and `js/schema.js` by `node tools/notes.mjs`.

## Workspace

| ID | ServiceNow |
|---|---|
| `WS-01` | Unified navigation header (Next Experience). Workspace "Receivables Workspace", role x_ar.ar_team |
| `WS-02` | Global search: AR request, invoice, Deposit ID and contract numbers, customer names |
| `WS-03` | Workspace sidebar: Home, Lists, BSU page, Cash application page |
| `WS-04` | List menu (sys_ux_list_menu_config): categories and lists with conditions |
| `WS-05` | Workspace tabs: landing / list tab plus one tab per opened record |
| `WS-06` | Landing page: single-score data visualisations, each linked to a list menu module |
| `WS-07` | Data visualisation: bar chart of x_ar_invoice.amount_due grouped by days past due_date |
| `WS-08` | Landing page list: new AR requests |
| `WS-09` | Landing page list: overdue invoices |
| `WS-11` | Record header UI action bar (Horizon Record page template): primary UI actions as buttons, the rest in the overflow menu. Visible vs overflow is set per UI action in the workspace action configuration |
| `WS-12` | Record ribbon (Horizon Record page template): collapsible row of up to 12 widgets with key metrics; configured per table in UI Builder (data resources over the record and its related tables) |
| `WS-13` | Record tabs in the resizable pane (Horizon Record page template): Details (form) first, then related items, then one tab per related list; extra tabs move to the More menu, except on customer and contract records, which show every tab (CCI 2026-11-16) |
| `WS-14` | Contextual side bar (Horizon pattern): vertical icon tabs on the right of the record tab, open by default, collapsible and resizable; holds Customer setup, Activity stream and Attachments for AR requests |
| `WS-15` | Form record presence: avatars of users viewing the record (out-of-box on the Horizon Record page template) |
| `WS-17` | Record history tab (out-of-box on the Record page template): sys_audit / sys_history_line for the record. Turn on Audit in the dictionary of every x_ar table; shows when, who, field, old and new value |
| `WS-16` | List page template (Horizon): list menu on the left, list on the right; the menu selection drives the list. Menu can be hidden |
| `LST-REQ-COL` | Workspace list All Collections (D30): x_ar_request, condition ar_form = COL; default columns as the other AR form lists |
| `LST-REQ-ARI` | Workspace list All AR-i (UIX decision 15, amended 2026-11-16): x_ar_request, condition ar_form = AR-i (every state, open and closed); list view ar_i_all with its own columns (for now: number, ar_form, short_description, customer, department, amount, state, assigned_to, opened_by, opened_at); list menu category AR requests |
| `LST-REQ-ARIX` | Workspace list All AR-ix (UIX decision 15, amended 2026-11-16): x_ar_request, condition ar_form = AR-ix (every state); list view ar_ix_all with its own columns (for now the same as All AR-i); list menu category AR requests |
| `CON-GIRO` | Tab GIRO history on the contract (and on no-contract shells): related list x_ar_request where contract = this contract and ar_form = AR-ix; columns AR-ix case, Type of request, Purpose of GIRO/DDA request, Amount, Requested by, Updated, GIRO (Active = contract.giro_case, Completed, Open, Contract to link, Rejected) |
| `SCH-PER` | Billing periods of the schedule (computed list, or child table x_ar_billing_period in the build) with status Invoiced / Due / Upcoming; no action column (drafts come from JOB-DAILYINV) |
| `JOB-DAILYINV` | Scheduled job Daily invoice check (daily, D12 amended 2026-11-16): for each x_ar_billing_schedule period with no non-cancelled invoice and invoice date within 5 working days (Mon–Fri) of today, insert a draft x_ar_invoice (billing_schedule, billing_period, contract, customer, ar_request and request_line from the schedule) and add a work note on the AR-i case. Issuing stays manual (Issue invoice). Demo: shown as mock data only (the draft on ARQ0001009); no demo button |
| `INV-PDF` | Invoice document (CCI decision 13): HTML template rendered with PDF Generation Utilities (sn_pdfgeneratorutils) when AR issues the invoice and attached to the invoice; the workspace tab shows the same template as a preview (DRAFT / CANCELLED watermark when not issued). Template wording is a draft |

## AR request record

| ID | ServiceNow |
|---|---|
| `REQ-ACT` | Activity stream: comments (visible to requester) + work_notes (AR only) + field changes |
| `REQ-SETUP` | RETIRED 2026-11-17 (D31): AR-i Customer setup panel removed with Link to customer. Was: Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, contract / no-contract shell, bill-to on the contract, documents filed, billing lines done |
| `REQ-GIRO` | GIRO setup panel (AR-ix case, contextual side bar): contract set? (for No contract required: the customer's no-contract shell for the department, set as Contract on the case); the contract's GIRO status and active case; reminder to update GIRO status and Active GIRO case on the contract record, then set State = Closed complete (AR-ix decision 11, AR-00 2026-11-16) |
| `REQ-GIROHIST` | Tab GIRO history on the AR-ix case: the AR-ix cases on the same contract (related list x_ar_request where contract = this case's contract and ar_form = AR-ix) |
| `REQ-FV-ARI` | Form view ar_i on x_ar_request (view rule: ar_form = AR-i), used by the workspace Details tab (UIX decision 12): sections Case, 1. General information, 2. Customer, 3. Contract and bill-to, 4. Invoice details, 5. Customer documents, 6. Others, in the AR-i portal order; every field of each section on the form, empty when not answered; editable while the case is open |
| `REQ-FV-COL` | Form view collections on x_ar_request (view rule: ar_form = COL), Details tab: sections Case (with Request value, the amount to collect, D29), 1. General information, 2. Collection type; ribbon Collection type, Request value, BSU deposits matched (sum of accepted allocations with request = this case) |
| `REQ-FV-ARIX` | Form view ar_ix on x_ar_request (view rule: ar_form = AR-ix), used by the workspace Details tab (UIX decision 12): sections Case, 1. General information, 2. Select Customer, 3. Select Contract, 4. GIRO details, 5. Attachments (attachment list), in the AR-ix portal order (section 6 Others removed 2026-11-17, AR-ix decision 23); every field shown, empty when not answered; editable while the case is open |
| `REQ-LINKCTR` | RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Contract to link picker in the AR-ix GIRO setup panel (Link contract retired) |
| `REQ-LINKCO` | RETIRED 2026-11-17 (D31): Company (core_company) for the new customer; mandatory when Link to customer creates a new x_ar_customer. Lists companies with no customer yet, closest name first (D26) |
| `REQ-LINKTO` | RETIRED 2026-11-17 (D31): Choice used by Link to customer: create the new customer, or link the AR-i to an existing x_ar_customer (duplicate check) |
| `REQ-ATT` | Attachments: sys_attachment on x_ar_request (added on the portal form) |

## Customer record

| ID | ServiceNow |
|---|---|
| `CUS-TREE` | RETIRED 2026-11-16 (CCI): Billing hierarchy tab removed from the customer record; usage and purpose to revisit (GitHub issue #6) |

## Cash application

| ID | ServiceNow |
|---|---|
| `CSH-01` | Cash application page (UI Builder custom page) |
| `CSH-02` | Single-score cards over x_ar_bank_statement / x_ar_allocation |
| `CSH-03` | List of x_ar_bank_statement with match state; filter tabs To match / Matched / All |
| `CSH-04` | Invoice finder (modal or side panel): ranked issued invoices and open Collections cases (ar_form = COL: AR-iii, AR-iv, AR-v; D29, D30) + allocation preview before confirming |
| `CSH-06` | Finder tag Account receives AR-… (BSU decision 13): the deposit's bank account lists the case's collection type in collection_types; adds to the ranking score, never hides other candidates |
| `CSH-05` | Collection case tag in the invoice finder and preview (D29): the candidate is an open x_ar_request with ar_form = COL (tag shows its collection_type, D30) and Request value (amount) not yet matched; its allocation sets request instead of invoice |

## BSU page

| ID | ServiceNow |
|---|---|
| `BSU-08` | Preview tag No payment mode (BSU decision 18): the line's transaction ID matches no active payment mode of the bank account; it is saved with the fallback Deposit ID UNK-<DDMMYY>-XX |
| `BSU-01` | BSU upload form (BSU decision 16): opened by New on the Statement uploads list (the BSU rail item opens that list of upload RITMs); upload form, preview, save opens the new RITM |
| `BSU-02` | RETIRED 2026-11-18 (BSU decision 16): statement-day checklist; upload completeness tracking to be decided |
| `BSU-03` | Upload form = catalog item 'Bank statement upload' rendered in the workspace (D32): variables bank account, statement date, CSV attachment; submit creates the RITM |
| `BSU-04` | CSV file kept as sys_attachment on sc_req_item |
| `BSU-05` | Bank template: column mapping per bank (config table x_ar_bank_template or system properties) |
| `BSU-06` | Preview before insert: deposits with Deposit IDs, skipped withdrawals, totals |
| `BSU-07` | RETIRED 2026-11-18 (BSU decision 16): recent uploads card; the Statement uploads list replaces it |

## Portal

| ID | ServiceNow |
|---|---|
| `PT-01` | Service Portal header (sp_header_footer), audience role x_ar.project_team |
| `PT-02` | Portal homepage: search + quick links widgets |
| `PT-03` | Quick link to catalog item: record producer "AR-i New AR request" |
| `PT-04` | Quick link to My Requests |
| `PT-05` | Record producer "AR-i New AR request" on x_ar_request. Producer script: current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; creates one x_ar_request_line from the invoice details (recurring when the contract type is Recurring, else one-off, D13 as amended); copies the billing line items multi-row variable set to x_ar_request_item |
| `PT-06` | RETIRED 2026-11-10: replaced by the General information variable set (PT-30, REQ.requester_name / REQ.requester_email) |
| `PT-38` | RETIRED 2026-11-12: Customer point of contact block; POC name / email are now part of the customer details (PT-39) |
| `PT-39` | AR-i Customer section, found customer (D23): read-only customer details in this order: name, UEN, address (from x_ar_customer), agency type, V@G, V@G sub-BU, POC name, POC email (copied from x_ar_customer into the request variables by a catalog client script; variables read-only via UI policy). New customer: the same fields are editable; AR copies them to the customer by hand (D23 as amended by D31) |
| `PT-36` | AR-i GIRO subsection inside Contract (D22): 'Is there an existing DDA?' read-only Yes / No (variable giro_on_contract) from the chosen contract's giro_status (GlideAjax), plus the active AR-ix case number when Yes. Greyed out with a tooltip for a new contract or no-contract billing: raise an AR-ix once AR has set up the contract |
| `PT-40` | AR-i new contract variables, in order: new_contract_type (Recurring / Ad-hoc), new_contract_number, new_contract_ref, new_contract_po, new_contract_title, start / end dates, new_contract_value, bill-to person / email / phone, new_contract_billing_cycle (+ suggested billing cycle when Others), new_contract_invoice_date, new_contract_payment_terms (+ other terms when Others), new_contract_proration (+ 1st / last month amounts when Yes), type_of_billing (+ bulk upload when C / D / E). AR creates x_ar_contract from them by hand, then links it with Link Contract Reference (D31) |
| `PT-41` | AR-i existing contract: every contract detail read-only from x_ar_contract, in the same order as a new contract (catalog client script / read-only HTML widget) |
| `PT-37` | AR-i variable set Invoice details (AR-i decisions 31–33): short_description (invoice description), attention_name / attention_email (prefilled from the contract bill-to), amount_per_period (before GST), preferred_invoice_date_choice (label 'Preferred invoice date': Per Billing Cycle / Expedited, optional; only for a one-invoice request, UI policy hides and clears it for a recurring contract) and preferred_invoice_date_justification (shown when Expedited, optional), billing_line_items_required (Yes / No → multi-row variable set PT-43). Catalog client script shows the billing summary: recurring contract → monthly to the contract end date (with contract proration); otherwise one invoice. The producer script creates one x_ar_request_line from these |
| `PT-30` | Variable set General information (D19), first section of every AR form record producer: requester_name (default current user's name), requester_email (from SSO, read-only), department, cc_list (emails; copied to the case watch_list so they can view it on the portal) |
| `PT-31` | Record producer "AR-ix GIRO authorisation" on x_ar_request. Producer script: current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>; contract_option = none → current.contract = the customer's no-contract shell for the department, if it exists; |
| `PT-32` | AR-ix variable set Select Contract (AR-ix decision 12): Existing contract, New contract (no reference asked here since 2026-11-17, decision 25: the GIRO details reference giro_reference is used) or No contract required (producer script sets contract = the customer's no-contract shell for the department when it exists). Existing contract reference qualifier (decision 22, E8.5): the customer's contracts, not No contract, where contract.department = the form's Department OR the requester is in contract.contract_owners; a Department change clears a contract that no longer qualifies (catalog client script) |
| `PT-33` | AR-ix variable set GIRO details (decisions 14, 15 amended, 18–21): Type of request first, choices filtered by the contract (catalog client script: new / no contract → Add GIRO; existing contract → Add GIRO when giro_status is Not active, Remove GIRO only when Active), with the owner's help text. Contract / tenancy agreement / reference (optional): Remove GIRO after Type; Add GIRO right after Purpose, hidden when Purpose = Carpark (decision 24). Remove GIRO: reference, Effective end date (mandatory), nothing more. Add GIRO (UI policies): purpose (placeholder "-- Choose the purpose --", no default; choices by contract option, decision 25: No contract required → Carpark, Others; existing or new contract → Rental, Others; a contract change clears a purpose that no longer fits), reference, other purpose, Effective start date (mandatory); Customer name / email / mobile (prefilled from the contract's or shell's bill-to); remarks; rental → location (mandatory), amount; carpark → car plate, location (mandatory), amount; others → nothing more. Attachments is a separate section (PT-46) |
| `PT-34` | Info message on AR-ix: the chosen contract's (or no-contract shell's) GIRO status and active case (GlideAjax read of x_ar_contract.giro_status / giro_case). Active → the form offers only Remove GIRO (decision 14) |
| `PT-35` | Ticket page block for AR-ix: GIRO request summary and its outcome (contract to be linked / with AR / completed / GIRO active when the contract's giro_case is this case) |
| `PT-44` | AR-ix variable set Select Customer (AR-ix decisions 12, 17): customer search showing the customer name only; existing customers only (no new customer on AR-ix, E8.1), with the hint PT-48 |
| `PT-45` | AR-ix info message for No contract required: the customer's no-contract shell for the department (x_ar_contract, contract_type = shell) the GIRO goes on, or that AR links it once the shell is set up |
| `PT-46` | AR-ix section Attachments (decision 16, modelled on AR-i Customer documents): supporting documents (sc_attachment on the case), optional, for Add and Remove GIRO |
| `PT-47` | RETIRED 2026-11-17 (AR-ix decision 23, E8.14): variable set Others with Form number (giro_form_number, also retired) |
| `PT-49` | Collections record producer (AR-iii module, D30): one form for AR-iii, AR-iv and AR-v. Catalogue items AR-iii, AR-iv, AR-v open it with collection_type preset. Sections: General information (PT-30), 2. Collection type (PT-50); the rest to be defined |
| `PT-50` | Collections variable set Collection type (D30): collection_type (Choice AR-iii / AR-iv / AR-v, labels to be given), mandatory, preset from the catalogue item |
| `PT-51` | Collections variable set 3. Collection Details (#9 §7–9): fields of the selected type. AR-iii: Collection Date*. AR-iv: Collection Date, Reference Number, Requesting Department Cost Centre*. AR-v: Category* first, then that category's fields only (UI policies on collection_type and ar5_category); AR-v fields optional until confirmed (AR-iii decision 14) |
| `PT-52` | Collections AR-iii multi-row variable set Total number of collections for the day (#9 §7): Collection Type* (Choice), Number of Transactions* (positive whole number); 1 to 99 rows; duplicates allowed (owner). Producer script copies rows to x_ar_collection_tx |
| `PT-53` | Collections AR-iv multi-row variable set Amount for Each Account Code (#9 §8): Description*, Amount* (> 0, two decimals), Cost Centre* (active, Requesting Department), Account Code* (active); 1 to 10 rows. Producer script copies rows to x_ar_collection_allocation; the allocation total becomes amount (Request value) |
| `PT-54` | Collections AR-v supporting-document guidance by category (#9 §9): Cash Bail: G56, Bailor identity document, Bail Bond Form, Bank-in slip or receipt; Seized Monies and Restitution: G56, Case Property List, Bank-in slip or receipt (UI policy / rich-text label per category) |
| `PT-55` | Collections section 4. Supporting Documents (#9 §10): multiple attachments, optional (sc_attachment on the case); file size and type rules documented for the build, not checked in the demo (owner) |
| `PT-56` | Collections AR-iii total: calculated sum of Number of Transactions across rows (catalog client script; shown in the multi-row set footer) |
| `PT-57` | Collections AR-iv allocation total: calculated sum of Amount across rows (catalog client script); stored as amount on the case |
| `PT-48` | AR-ix Select Customer hint (decision 17, E8.1): Customer not found? Submit an AR-i to set up the customer first. Shown under the customer search instead of the AR-i add-as-new-customer button (UA-PT-newcust stays on AR-i) |
| `PT-07` | Catalog client script (onChange contract): contract billing position via GlideAjax / Script Include |
| `PT-08` | Variable attachments → sys_attachment on the created x_ar_request |
| `PT-09` | Submit → inserts x_ar_request (state New, assignment group AR team). Automation to be defined |
| `PT-10` | My Requests widget: x_ar_request where opened_by = me (ACL: project team reads own records) |
| `PT-11` | Ticket page: conversation widget (comments only; work notes hidden) |
| `PT-13` | Ticket fields widget: read-only summary of the request |
| `PT-14` | Service catalog category "AR forms": 16 record producers AR-i … AR-xvi (D9) |
| `PT-15` | Catalog item AR-i New AR request (active record producer) |
| `PT-16` | Catalog item placeholder AR-ii … AR-xvi (inactive until defined) |
| `PT-19` | Bill-to (inside the Contract variable set, D16): shows the contract's / shell's bill-to (x_ar_contract.bill_to_*) or asks for one (new contract, or a shell without one), prefilled from the department's x_ar_billing_contact. An existing contract's bill-to is read-only (PT-41); AR changes it in the workspace (D22) |
| `PT-20` | Variable set Contract and bill-to (D15): contract_option (existing / new / no contract required), contract or new-contract variables, bill-to. UI policies per option. Always shown; until a customer is selected it shows only the hint 'Select a customer above to see the contract options.' (AR-i decision 40) |
| `PT-42` | AR-i variable set Others (after Customer documents; final placement to be decided by the owner): cost_center, agent_name, po_number. All optional (invoice_breakdown and account_code removed, AR-i decision 39) |
| `PT-43` | AR-i multi-row variable set Billing line items (x_ar_request_item), shown when billing_line_items_required = Yes: item_number (row number 1, 2, 3…, read-only; the producer script sets it in row order), amount_excl_gst*, gst_amount and total_amount (calculated by catalog client script at the GST rate, read-only), late_payment_interest (rate %), account_code. At least one row when Yes |
| `PT-28` | No contract required: info message (UI policy on contract_option = none). AR creates the customer's no-contract shell for the department by hand if needed (x_ar_contract, contract_type = shell) and links it with Link Contract Reference, which files the lines under it (D31) |
| `PT-25` | Variable set Customer (D14): search x_ar_customer by name/UEN (type-ahead); Add as new customer reveals name, UEN, address (UI policy on new_customer) |
| `PT-26` | RETIRED 2026-11-12: What to bill variable set with the Billing lines multi-row variable set; replaced by Invoice details (PT-37). One billing line is now created from the invoice details |
| `PT-27` | Ticket page: billing lines with status per line (invoice number / billing schedule); payment status hidden |
| `PT-29` | Finance coding variables (all optional): cost_center (tooltip: to be filled by GA), agent_name. Now in the Others section (PT-42); type of billing and the bulk upload are on the contract (PT-40) |
| `PT-23` | Variable set Customer documents: on-file check via GlideAjax on x_ar_customer_document; attach only missing ones (D10) |

## AR request

| ID | ServiceNow |
|---|---|
| `LST-REQ` | List: x_ar_request · list view layout + list menu condition |
| `RP-REQ` | Record page (UI Builder) · x_ar_request extends task |
| `HDR-REQ` | Record header: highlighted values of x_ar_request |
| `FRM-REQ` | Form view: x_ar_request (Default view) |

## AR request fields

| ID | ServiceNow |
|---|---|
| `REQ.number` | x_ar_request.number · String · read-only |
| `REQ.state` | x_ar_request.state · Choice · mandatory · Set by AR with the dropdown on the case and Save (AR-00 decision, 2026-11-16). Assign to me moves New to Work in progress; a portal reply moves Awaiting requestor information to Work in progress |
| `REQ.substate` | x_ar_request.substate · Choice · Only for Awaiting requestor information; optional; cleared when the state changes. AR only (not shown on the portal) |
| `REQ.opened_by` | x_ar_request.opened_by · Reference → sys_user · read-only |
| `REQ.ar_form` | x_ar_request.ar_form · Choice · read-only · Collections cases: COL, with the type in collection_type (D30) |
| `REQ.submission_origin` | x_ar_request.submission_origin · Choice · read-only · Collections (#9 §6). System-managed: Manual for portal submissions; system-generated cases are a later phase (AR-iii decision 10) |
| `REQ.collection_type` | x_ar_request.collection_type · Choice · Collections form (AR-iii module, D30). Mandatory; first question after General information, preselected from the catalogue tile. Choice labels are the codes until the owner gives the wording |
| `REQ.collection_date` | x_ar_request.collection_date · Date · AR-iii: mandatory. AR-iv: optional (#9 §7, §8) |
| `REQ.collection_reference` | x_ar_request.collection_reference · String · AR-iv. Optional (#9 §8) |
| `REQ.requesting_cost_centre` | x_ar_request.requesting_cost_centre · Reference → x_ar_cost_centre · AR-iv. Mandatory. Reference qualifier: active cost centres of the Requesting Department (#9 §8, AC-10) |
| `REQ.ar5_category` | x_ar_request.ar5_category · Choice · AR-v. Chosen first; shows only that category's fields and document guidance (#9 §9). Mandatory |
| `REQ.date_of_collection` | x_ar_request.date_of_collection · Date · AR-v, every category. Optional until confirmed |
| `REQ.g56_receipt_number` | x_ar_request.g56_receipt_number · String · AR-v, every category. Optional until confirmed |
| `REQ.bail_amount` | x_ar_request.bail_amount · Currency · AR-v Cash Bail. Sets the Request value |
| `REQ.bailor_name` | x_ar_request.bailor_name · String |
| `REQ.bailor_nric` | x_ar_request.bailor_nric · String · Protected: masked on display (last 4 shown); validation rule to be approved (#9 §9.4) |
| `REQ.bailor_address` | x_ar_request.bailor_address · String (1000) |
| `REQ.ib_case_number` | x_ar_request.ib_case_number · String |
| `REQ.case_number` | x_ar_request.case_number · String |
| `REQ.case_status` | x_ar_request.case_status · Choice · AR-v. Choices depend on the category (#9 §9; subject to final business confirmation) |
| `REQ.accused_name` | x_ar_request.accused_name · String |
| `REQ.accused_id_number` | x_ar_request.accused_id_number · String · Protected: masked on display (last 4 shown) |
| `REQ.ar5_amount` | x_ar_request.ar5_amount · Currency · AR-v Seized Monies and Restitution. Sets the Request value |
| `REQ.ar5_currency` | x_ar_request.ar5_currency · Choice · Controlled list (default list; master list to be decided) |
| `REQ.ar5_to_be_invested` | x_ar_request.ar5_to_be_invested · Choice · Yes / No radio buttons (#9 §9.4), where applicable |
| `REQ.ar5_currency_banked` | x_ar_request.ar5_currency_banked · Choice · AR-v Restitution (#9 §9.3). Read as a currency choice; to confirm (AR-iii open question 10) |
| `REQ.requester_name` | x_ar_request.requester_name · String · General information (all AR forms). Mandatory on the form; defaults to the signed-in user's name |
| `REQ.requester_email` | x_ar_request.requester_email · String · read-only · General information (all AR forms). From ServiceNow SSO (sys_user.email); always read-only |
| `REQ.department_sub_bu` | x_ar_request.department_sub_bu · Choice · General information (all AR forms). Sub-BUs of the chosen department (mock list) |
| `REQ.cc_list` | x_ar_request.cc_list · String (1000) · General information (all AR forms). Emails separated by commas; these people can view the case on the portal (Watch list) |
| `REQ.department` | x_ar_request.department · Choice · mandatory |
| `REQ.customer` | x_ar_request.customer · Reference → x_ar_customer · Mandatory unless New customer is ticked |
| `REQ.new_customer` | x_ar_request.new_customer · True/False |
| `REQ.new_customer_name` | x_ar_request.new_customer_name · String · Mandatory when New customer |
| `REQ.new_customer_uen` | x_ar_request.new_customer_uen · String |
| `REQ.new_customer_address` | x_ar_request.new_customer_address · String (1000) |
| `REQ.contract_option` | x_ar_request.contract_option · Choice · mandatory · Billing is contract level: every billing line sits under a contract, or under the customer's no-contract shell (D15) |
| `REQ.link_customer` | x_ar_request.link_customer · Reference → x_ar_customer · AR-i, workspace Link section (D31). x_ar_customer, display value UEN (reference auto-complete shows UEN and name). Saving sets the case's customer. Mandatory before Closed complete |
| `REQ.link_contract` | x_ar_request.link_contract · Reference → x_ar_contract · AR-i and AR-ix, workspace Link section (D31). x_ar_contract, display value Contract ID (CTR…). Reference qualifier: contracts of the linked customer (AR-i) or of the case's customer (AR-ix). Saving sets the case's contract (AR-i: also every billing line's contract). AR-i: mandatory before Closed complete |
| `REQ.contract` | x_ar_request.contract · Reference → x_ar_contract · Existing contract; otherwise set when AR saves Link Contract Reference (D31). Read-only in the workspace |
| `REQ.new_contract_type` | x_ar_request.new_contract_type · Choice · Mandatory for a new contract |
| `REQ.new_contract_number` | x_ar_request.new_contract_number · String · Mandatory for a new contract |
| `REQ.new_contract_ref` | x_ar_request.new_contract_ref · String · AR-i, optional for a new contract. Not on AR-ix (AR-ix decision 25: the GIRO reference giro_reference is used instead) |
| `REQ.new_contract_po` | x_ar_request.new_contract_po · String · Optional |
| `REQ.new_contract_title` | x_ar_request.new_contract_title · String · Mandatory for a new contract |
| `REQ.new_contract_start` | x_ar_request.new_contract_start · Date · Mandatory for a new contract |
| `REQ.new_contract_end` | x_ar_request.new_contract_end · Date |
| `REQ.new_contract_value` | x_ar_request.new_contract_value · Currency · Mandatory for a new contract |
| `REQ.new_contract_billing_cycle` | x_ar_request.new_contract_billing_cycle · Choice · Optional |
| `REQ.new_contract_billing_cycle_other` | x_ar_request.new_contract_billing_cycle_other · String · Mandatory when the billing cycle is Others |
| `REQ.new_contract_invoice_date` | x_ar_request.new_contract_invoice_date · Date · Optional |
| `REQ.new_contract_payment_terms` | x_ar_request.new_contract_payment_terms · Choice · Default 30 days |
| `REQ.new_contract_payment_terms_other` | x_ar_request.new_contract_payment_terms_other · String · Mandatory when payment terms is Others |
| `REQ.new_contract_proration` | x_ar_request.new_contract_proration · Choice · Default No |
| `REQ.new_contract_proration_first` | x_ar_request.new_contract_proration_first · Currency · Mandatory when proration is Yes |
| `REQ.new_contract_proration_last` | x_ar_request.new_contract_proration_last · Currency · Mandatory when proration is Yes |
| `REQ.bill_to_name` | x_ar_request.bill_to_name · String · Mandatory when the contract (or shell) has no bill-to person yet; AR copies it to the contract by hand (D16 as amended by D31) |
| `REQ.bill_to_email` | x_ar_request.bill_to_email · String |
| `REQ.bill_to_phone` | x_ar_request.bill_to_phone · String |
| `REQ.bill_to_address` | x_ar_request.bill_to_address · String (1000) |
| `REQ.short_description` | x_ar_request.short_description · String · mandatory · What the invoice is for; becomes the case's short description and the billing line's description |
| `REQ.attention_name` | x_ar_request.attention_name · String · Optional. Prefilled from the contract's bill-to person |
| `REQ.attention_email` | x_ar_request.attention_email · String · Optional; must be a valid email. Prefilled from the contract's bill-to email |
| `REQ.amount_per_period` | x_ar_request.amount_per_period · Currency · mandatory · Before GST. Recurring contract: billed every period; ad-hoc or no contract: one invoice of this amount |
| `REQ.preferred_invoice_date_choice` | x_ar_request.preferred_invoice_date_choice · Choice · One-invoice requests only (ad-hoc contract, no contract, or contract type not on file); hidden and cleared for a recurring contract. Optional (AR-i decision 38) |
| `REQ.preferred_invoice_date_justification` | x_ar_request.preferred_invoice_date_justification · String (1000) · Shown when Expedited; optional |
| `REQ.billing_line_items_required` | x_ar_request.billing_line_items_required · Choice · Yes shows the billing line items table (multi-row variable set) |
| `REQ.amount` | x_ar_request.amount · Currency · read-only · AR-i: calculated, one-off lines + recurring amount × number of periods. Collections (AR-iii, AR-iv, AR-v): the amount to collect; BSU deposits are matched against it on Cash application (D29) |
| `REQ.po_number` | x_ar_request.po_number · String |
| `REQ.customer_poc_name` | x_ar_request.customer_poc_name · String · AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in; AR copies it to the customer by hand (D23 as amended by D31) |
| `REQ.customer_poc_email` | x_ar_request.customer_poc_email · String · AR-i customer details; must be a valid email. Same rule as POC name |
| `REQ.cost_center` | x_ar_request.cost_center · String · Optional, free text. To be filled by GA |
| `REQ.agent_name` | x_ar_request.agent_name · String · Optional, free text |
| `REQ.agency_type` | x_ar_request.agency_type · Choice · AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master |
| `REQ.vag` | x_ar_request.vag · Choice · AR-i customer details, optional. Found customer: read-only from the customer master |
| `REQ.sub_bu` | x_ar_request.sub_bu · String · Optional, free text |
| `REQ.type_of_billing` | x_ar_request.type_of_billing · Choice · Contract level: entered for a new contract (AR copies it to the contract by hand, D31); read-only copy of the contract's value for an existing one |
| `REQ.bulk_supporting_docs` | x_ar_request.bulk_supporting_docs · Attachment · Optional; several files at once |
| `REQ.giro_on_contract` | x_ar_request.giro_on_contract · Choice · read-only · Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21) |
| `REQ.giro_type` | x_ar_request.giro_type · Choice · AR-ix. Mandatory. New contract or no contract: Add GIRO only. Existing contract: Add GIRO when GIRO is not active, Remove GIRO only when it is (catalog client script filters the choices) |
| `REQ.giro_reference` | x_ar_request.giro_reference · String · AR-ix, Add and Remove GIRO. Optional. Add GIRO: right after Purpose of GIRO/DDA request, hidden when Purpose = Carpark; Remove GIRO: after Type of request (UI policy; AR-ix decisions 19, 24; E8.9–E8.12) |
| `REQ.giro_purpose` | x_ar_request.giro_purpose · Choice · AR-ix Add GIRO. Mandatory. Choices by contract (catalog client script, AR-ix decision 25): No contract required → Carpark, Others; existing or new contract → Rental, Others |
| `REQ.giro_purpose_other` | x_ar_request.giro_purpose_other · String · AR-ix. Mandatory when Purpose = Others |
| `REQ.giro_applicant_name` | x_ar_request.giro_applicant_name · String · AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6) |
| `REQ.giro_applicant_email` | x_ar_request.giro_applicant_email · String · AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6) |
| `REQ.giro_applicant_mobile` | x_ar_request.giro_applicant_mobile · String · AR-ix Add GIRO. Prefilled from the contract's bill-to phone (label: AR-ix decision 20, E8.6) |
| `REQ.giro_remarks` | x_ar_request.giro_remarks · String (1000) · AR-ix Add GIRO, all purposes. Optional |
| `REQ.giro_location` | x_ar_request.giro_location · String · AR-ix Rental and Carpark. Mandatory (AR-ix decision 21, E8.15) |
| `REQ.giro_start_date` | x_ar_request.giro_start_date · Date · AR-ix Add GIRO, every purpose. Mandatory (AR-ix decision 18, E8.7) |
| `REQ.giro_end_date` | x_ar_request.giro_end_date · Date · AR-ix Remove GIRO. Mandatory; the only Remove GIRO detail (AR-ix decision 18, E8.8) |
| `REQ.giro_carplate` | x_ar_request.giro_carplate · String · AR-ix carpark. Mandatory; one vehicle per form |
| `REQ.giro_amount` | x_ar_request.giro_amount · String · AR-ix Rental and Carpark. Optional free text; not used by any other field or calculation (AR-ix decisions 13, 21; E8.13, E8.15) |
| `REQ.doc_contract_po` | x_ar_request.doc_contract_po · Attachment · Optional, offered for a new contract only |
| `REQ.doc_acra` | x_ar_request.doc_acra · Attachment · Only when not already on file |
| `REQ.doc_billing_form` | x_ar_request.doc_billing_form · Attachment · Only when not already on file for this department |
| `REQ.description` | x_ar_request.description · String (4000) |
| `REQ.assignment_group` | x_ar_request.assignment_group · Reference → sys_user_group · Platform sys_user_group. One group for now: Accounts Receivable, set on every new case (record producer script) |
| `REQ.assigned_to` | x_ar_request.assigned_to · Reference → sys_user · Reference qualifier: members of the assignment group |
| `REQ.opened_at` | x_ar_request.opened_at · Date · read-only |

## Invoice

| ID | ServiceNow |
|---|---|
| `LST-INV` | List: x_ar_invoice · list view layout + list menu condition |
| `RP-INV` | Record page (UI Builder) · x_ar_invoice |
| `HDR-INV` | Record header: highlighted values of x_ar_invoice |
| `FRM-INV` | Form view: x_ar_invoice (Default view) |

## Invoice fields

| ID | ServiceNow |
|---|---|
| `INV.number` | x_ar_invoice.number · String · read-only |
| `INV.state` | x_ar_invoice.state · Choice · read-only |
| `INV.customer` | x_ar_invoice.customer · Reference → x_ar_customer · mandatory |
| `INV.contract` | x_ar_invoice.contract · Reference → x_ar_contract |
| `INV.ar_request` | x_ar_invoice.ar_request · Reference → x_ar_request · read-only |
| `INV.request_line` | x_ar_invoice.request_line · Reference → x_ar_request_line · read-only |
| `INV.billing_schedule` | x_ar_invoice.billing_schedule · Reference → x_ar_billing_schedule · read-only |
| `INV.billing_period` | x_ar_invoice.billing_period · Date · read-only |
| `INV.short_description` | x_ar_invoice.short_description · String · mandatory |
| `INV.amount` | x_ar_invoice.amount · Currency · mandatory |
| `INV.invoice_date` | x_ar_invoice.invoice_date · Date |
| `INV.approval_date` | x_ar_invoice.approval_date · Date · Set manually by the AR team (CCI decision 8) |
| `INV.due_date` | x_ar_invoice.due_date · Date · Defaults to invoice date + contract payment terms |

## BSU deposit

| ID | ServiceNow |
|---|---|
| `LST-DEP` | List: x_ar_bank_statement · list view layout + list menu condition |
| `RP-DEP` | Record page (UI Builder) · x_ar_bank_statement |
| `HDR-DEP` | Record header: highlighted values of x_ar_bank_statement |
| `FRM-DEP` | Form view: x_ar_bank_statement (Default view) |

## BSU deposit fields

| ID | ServiceNow |
|---|---|
| `DEP.deposit_id` | x_ar_bank_statement.deposit_id · String · read-only · Set by before-insert business rule (BSU decision 18): the payment mode's prefix, the deposit (value) date as DDMMYY and the payment mode's suffix. Not unique: deposits of one payment mode on one day share it. No matching payment mode: UNK-<DDMMYY>-XX |
| `DEP.bank_account` | x_ar_bank_statement.bank_account · Reference → x_ar_bank_account · read-only |
| `DEP.bsu` | x_ar_bank_statement.bsu · Reference → sc_req_item · read-only |
| `DEP.value_date` | x_ar_bank_statement.value_date · Date · read-only |
| `DEP.amount` | x_ar_bank_statement.amount · Currency · read-only |
| `DEP.payer_name` | x_ar_bank_statement.payer_name · String · read-only |
| `DEP.bank_reference` | x_ar_bank_statement.bank_reference · String · read-only |
| `DEP.bank_transaction_ref` | x_ar_bank_statement.bank_transaction_ref · String · read-only |
| `DEP.transaction_id` | x_ar_bank_statement.transaction_id · String · read-only · From the bank's transaction-code column (BSU decisions 18–19); matched to a payment mode of the bank account |
| `DEP.payment_mode` | x_ar_bank_statement.payment_mode · Reference → x_ar_payment_mode · read-only · Payment mode equal to the statement line's transaction code (BSU decision 19); empty when none matched (fallback Deposit ID) |

## Statement upload

| ID | ServiceNow |
|---|---|
| `LST-BSU` | List: sc_req_item · list view layout + list menu condition |
| `RP-BSU` | Record page (UI Builder) · sc_req_item |
| `HDR-BSU` | Record header: highlighted values of sc_req_item |
| `FRM-BSU` | Form view: sc_req_item (Default view) |

## Statement upload fields

| ID | ServiceNow |
|---|---|
| `BSU.number` | sc_req_item.number · String · read-only |
| `BSU.bank_account` | sc_req_item.bank_account · Reference → x_ar_bank_account · read-only |
| `BSU.statement_date` | sc_req_item.statement_date · Date · read-only |
| `BSU.file_name` | sc_req_item.file_name · String · read-only |
| `BSU.uploaded_by` | sc_req_item.uploaded_by · Reference → sys_user · read-only |
| `BSU.uploaded_at` | sc_req_item.uploaded_at · String · read-only |
| `BSU.deposit_count` | sc_req_item.deposit_count · Integer · read-only |
| `BSU.deposit_total` | sc_req_item.deposit_total · Currency · read-only |
| `BSU.withdrawals_skipped` | sc_req_item.withdrawals_skipped · Integer · read-only |

## Bank account

| ID | ServiceNow |
|---|---|
| `LST-BNK` | List: x_ar_bank_account · list view layout + list menu condition |
| `RP-BNK` | Record page (UI Builder) · x_ar_bank_account |
| `HDR-BNK` | Record header: highlighted values of x_ar_bank_account |
| `FRM-BNK` | Form view: x_ar_bank_account (Default view) |

## Bank account fields

| ID | ServiceNow |
|---|---|
| `BNK.bank` | x_ar_bank_account.bank · Choice · mandatory · BSU decision 17: shown apart from the bank account number. Mock aliases for Singapore's three largest banks; each has its own CSV layout |
| `BNK.account_number` | x_ar_bank_account.account_number · String · mandatory |
| `BNK.account_name` | x_ar_bank_account.account_name · String · mandatory · Describes the sub-account type under the department, so the department understands it (e.g. Project deposits, Retention and deposits) (BSU decision 17) |
| `BNK.department` | x_ar_bank_account.department · Choice · mandatory |
| `BNK.account_type` | x_ar_bank_account.account_type · Choice · mandatory |
| `BNK.currency` | x_ar_bank_account.currency · String · read-only |
| `BNK.collection_types` | x_ar_bank_account.collection_types · List · Collections forms whose money arrives in this account (BSU decision 13). The invoice finder ranks open Collections cases of these types first; it never hides the others |
| `BNK.active` | x_ar_bank_account.active · True/False · Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields |

## Allocation fields

| ID | ServiceNow |
|---|---|
| `ALC.deposit` | x_ar_allocation.deposit · Reference → x_ar_bank_statement |
| `ALC.invoice` | x_ar_allocation.invoice · Reference → x_ar_invoice |
| `ALC.request` | x_ar_allocation.request · Reference → x_ar_request · Set instead of Invoice when the deposit is matched to a Collections case (reference qualifier: ar_form = COL, the Collections form for AR-iii, AR-iv, AR-v; D29, D30) |
| `ALC.amount` | x_ar_allocation.amount · Currency |
| `ALC.state` | x_ar_allocation.state · Choice |
| `ALC.exception` | x_ar_allocation.exception · Choice |
| `ALC.reason` | x_ar_allocation.reason · String (1000) |
| `CAL.ar_request` | x_ar_collection_allocation.ar_request · Reference → x_ar_request · read-only |
| `CAL.row_number` | x_ar_collection_allocation.row_number · Integer · read-only |
| `CAL.description` | x_ar_collection_allocation.description · String · mandatory |
| `CAL.amount` | x_ar_collection_allocation.amount · Currency · mandatory · Positive, at most two decimals |
| `CAL.cost_centre` | x_ar_collection_allocation.cost_centre · Reference → x_ar_cost_centre · mandatory · Reference qualifier: active cost centres of the Requesting Department |
| `CAL.account_code` | x_ar_collection_allocation.account_code · Reference → x_ar_account_code · mandatory · Reference qualifier: active account codes. GST / recovery rule check to be approved (AR-iii open question 11) |

## Company

| ID | ServiceNow |
|---|---|
| `LST-CMP` | List: core_company · list view layout + list menu condition |
| `RP-CMP` | Record page (UI Builder) · core_company |
| `HDR-CMP` | Record header: highlighted values of core_company |
| `FRM-CMP` | Form view: core_company (Default view) |

## Company fields

| ID | ServiceNow |
|---|---|
| `CMP.name` | core_company.name · String · mandatory |

## Customer

| ID | ServiceNow |
|---|---|
| `LST-CUS` | List: x_ar_customer · list view layout + list menu condition |
| `RP-CUS` | Record page (UI Builder) · x_ar_customer |
| `HDR-CUS` | Record header: highlighted values of x_ar_customer |
| `FRM-CUS` | Form view: x_ar_customer (Default view) |

## Customer fields

| ID | ServiceNow |
|---|---|
| `CUS.company` | x_ar_customer.company · Reference → core_company · mandatory · The core_company record for this customer. One customer per company. Display field of the table |
| `CUS.company.name` | x_ar_customer.company.name · String · read-only · Dot-walked from company.name (core_company); not a column on this table (D26) |
| `CUS.uen` | x_ar_customer.uen · String |
| `CUS.parent_group` | x_ar_customer.parent_group · String |
| `CUS.registered_address` | x_ar_customer.registered_address · String (1000) |
| `CUS.agency_type` | x_ar_customer.agency_type · Choice · Master data; AR copies it by hand from the AR-i that set the customer up (D23 as amended by D31) |
| `CUS.vag` | x_ar_customer.vag · Choice |
| `CUS.vag_sub_bu` | x_ar_customer.vag_sub_bu · String |
| `CUS.poc_name` | x_ar_customer.poc_name · String |
| `CUS.poc_email` | x_ar_customer.poc_email · String |
| `CUS.bank_names` | x_ar_customer.bank_names · String (1000) · Comma-separated. Used to rank invoices in the invoice finder. |
| `CUS.notes` | x_ar_customer.notes · String (4000) |
| `CUS.active` | x_ar_customer.active · True/False · Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields |

## Contract

| ID | ServiceNow |
|---|---|
| `LST-CON` | List: x_ar_contract · list view layout + list menu condition |
| `RP-CON` | Record page (UI Builder) · x_ar_contract |
| `HDR-CON` | Record header: highlighted values of x_ar_contract |
| `FRM-CON` | Form view: x_ar_contract (Default view) |

## Contract fields

| ID | ServiceNow |
|---|---|
| `CON.contract_id` | x_ar_contract.contract_id · String · read-only · System contract ID, auto-numbered for every record, Contract or No contract (CCI, 2026-11-16) |
| `CON.contract_type` | x_ar_contract.contract_type · Choice · mandatory · Contract or No contract (D15 amended 2026-11-16: a customer can have several No contract records) |
| `CON.number` | x_ar_contract.number · String · The customer's contract number. Mandatory when Contract category = Contract |
| `CON.contract_category` | x_ar_contract.contract_category · Choice · Recurring or Ad-hoc |
| `CON.customer` | x_ar_contract.customer · Reference → x_ar_customer · mandatory |
| `CON.department` | x_ar_contract.department · Choice · Owning department |
| `CON.contract_owners` | x_ar_contract.contract_owners · List → sys_user · Project team users who can pick this contract on an AR-ix even when it belongs to another department (List of sys_user, several owners; CCI decision 10, E8.5) |
| `CON.reference_number` | x_ar_contract.reference_number · String |
| `CON.po_number` | x_ar_contract.po_number · String |
| `CON.short_description` | x_ar_contract.short_description · String · mandatory |
| `CON.billing_type` | x_ar_contract.billing_type · Choice |
| `CON.contract_value` | x_ar_contract.contract_value · Currency |
| `CON.start_date` | x_ar_contract.start_date · Date |
| `CON.end_date` | x_ar_contract.end_date · Date |
| `CON.payment_terms` | x_ar_contract.payment_terms · Integer |
| `CON.lpi_applicable` | x_ar_contract.lpi_applicable · True/False · Late payment interest is charged on overdue invoices under this contract |
| `CON.lpi_min_rate` | x_ar_contract.lpi_min_rate · Decimal · Mandatory when LPI applicable. % per annum; must not exceed the LPI rate |
| `CON.lpi_rate` | x_ar_contract.lpi_rate · Decimal · Mandatory when LPI applicable. % per annum |
| `CON.billing_cycle` | x_ar_contract.billing_cycle · Choice |
| `CON.billing_cycle_other` | x_ar_contract.billing_cycle_other · String |
| `CON.preferred_invoice_date` | x_ar_contract.preferred_invoice_date · Date |
| `CON.payment_terms_choice` | x_ar_contract.payment_terms_choice · Choice · 30 days sets terms (days) = 30 |
| `CON.payment_terms_other` | x_ar_contract.payment_terms_other · String |
| `CON.proration` | x_ar_contract.proration · Choice · Yes: the first and last period of each recurring billing schedule use the proration amounts |
| `CON.proration_first` | x_ar_contract.proration_first · Currency |
| `CON.proration_last` | x_ar_contract.proration_last · Currency |
| `CON.type_of_billing` | x_ar_contract.type_of_billing · Choice |
| `CON.bulk_supporting_docs` | x_ar_contract.bulk_supporting_docs · Attachment |
| `CON.giro_status` | x_ar_contract.giro_status · Choice · Updated by AR on the contract from the AR-ix case (manual, AR-ix decision 11). At most one active GIRO per contract (D21) |
| `CON.giro_case` | x_ar_contract.giro_case · Reference → x_ar_request · AR links the AR-ix case whose GIRO is active (reference qualifier: ar_form = AR-ix, giro_type = Add GIRO and contract = this contract). Mandatory when GIRO status is Active; cleared when Not active |
| `CON.bill_to_name` | x_ar_contract.bill_to_name · String |
| `CON.bill_to_email` | x_ar_contract.bill_to_email · String |
| `CON.bill_to_phone` | x_ar_contract.bill_to_phone · String |
| `CON.bill_to_address` | x_ar_contract.bill_to_address · String (1000) |
| `CON.notes` | x_ar_contract.notes · String (4000) |

## Billing contact

| ID | ServiceNow |
|---|---|
| `LST-BCT` | List: x_ar_billing_contact · list view layout + list menu condition |
| `RP-BCT` | Record page (UI Builder) · x_ar_billing_contact |
| `HDR-BCT` | Record header: highlighted values of x_ar_billing_contact |
| `FRM-BCT` | Form view: x_ar_billing_contact (Default view) |

## Billing contact fields

| ID | ServiceNow |
|---|---|
| `BCT.customer` | x_ar_billing_contact.customer · Reference → x_ar_customer · mandatory |
| `BCT.requestor` | x_ar_billing_contact.requestor · Reference → sys_user · Project-team user who gave this contact (#10 E10.1, CCI decision 15) |
| `BCT.department` | x_ar_billing_contact.department · Choice · mandatory |
| `BCT.contact_name` | x_ar_billing_contact.contact_name · String · mandatory |
| `BCT.email` | x_ar_billing_contact.email · String · mandatory |
| `BCT.phone` | x_ar_billing_contact.phone · String |
| `BCT.billing_address` | x_ar_billing_contact.billing_address · String (1000) |
| `BCT.source_request` | x_ar_billing_contact.source_request · Reference → x_ar_request · read-only |
| `BCT.active` | x_ar_billing_contact.active · True/False · Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields |

## Customer document

| ID | ServiceNow |
|---|---|
| `LST-DOC` | List: x_ar_customer_document · list view layout + list menu condition |
| `RP-DOC` | Record page (UI Builder) · x_ar_customer_document |
| `HDR-DOC` | Record header: highlighted values of x_ar_customer_document |
| `FRM-DOC` | Form view: x_ar_customer_document (Default view) |

## Customer document fields

| ID | ServiceNow |
|---|---|
| `DOC.number` | x_ar_customer_document.number · String · read-only |
| `DOC.customer` | x_ar_customer_document.customer · Reference → x_ar_customer · read-only |
| `DOC.requestor` | x_ar_customer_document.requestor · Reference → sys_user · Project-team user who gave this document (#10 E10.2, CCI decision 15) |
| `DOC.document_type` | x_ar_customer_document.document_type · Choice · read-only |
| `DOC.file_name` | x_ar_customer_document.file_name · String · read-only |
| `DOC.contract` | x_ar_customer_document.contract · Reference → x_ar_contract · read-only · For signed contract / PO |
| `DOC.department` | x_ar_customer_document.department · Choice · read-only · For billing contact & address forms |
| `DOC.source_request` | x_ar_customer_document.source_request · Reference → x_ar_request · read-only |
| `DOC.received_on` | x_ar_customer_document.received_on · Date · read-only |

## Billing schedule

| ID | ServiceNow |
|---|---|
| `LST-SCH` | List: x_ar_billing_schedule · list view layout + list menu condition |
| `RP-SCH` | Record page (UI Builder) · x_ar_billing_schedule |
| `HDR-SCH` | Record header: highlighted values of x_ar_billing_schedule |
| `FRM-SCH` | Form view: x_ar_billing_schedule (Default view) |

## Billing schedule fields

| ID | ServiceNow |
|---|---|
| `SCH.number` | x_ar_billing_schedule.number · String · read-only |
| `SCH.contract` | x_ar_billing_schedule.contract · Reference → x_ar_contract · mandatory |
| `SCH.customer` | x_ar_billing_schedule.customer · Reference → x_ar_customer · read-only · From the contract |
| `SCH.department` | x_ar_billing_schedule.department · Choice · mandatory |
| `SCH.short_description` | x_ar_billing_schedule.short_description · String · mandatory |
| `SCH.frequency` | x_ar_billing_schedule.frequency · Choice · mandatory |
| `SCH.amount` | x_ar_billing_schedule.amount · Currency · mandatory |
| `SCH.first_billing_date` | x_ar_billing_schedule.first_billing_date · Date · mandatory |
| `SCH.last_billing_date` | x_ar_billing_schedule.last_billing_date · Date · mandatory |
| `SCH.first_period_amount` | x_ar_billing_schedule.first_period_amount · Currency · Empty = amount per period |
| `SCH.last_period_amount` | x_ar_billing_schedule.last_period_amount · Currency · Empty = amount per period |
| `SCH.source_request` | x_ar_billing_schedule.source_request · Reference → x_ar_request · AR picks the recurring AR-i case (reference qualifier: AR-i cases with a recurring line on this contract). Invoices from this schedule are linked to that case (CCI decision 8) |
| `SCH.source_line` | x_ar_billing_schedule.source_line · Reference → x_ar_request_line · read-only · Set from the AR request's recurring line |

## Billing line

| ID | ServiceNow |
|---|---|
| `LST-RQL` | List: x_ar_request_line · list view layout + list menu condition |
| `RP-RQL` | Record page (UI Builder) · x_ar_request_line |
| `HDR-RQL` | Record header: highlighted values of x_ar_request_line |
| `FRM-RQL` | Form view: x_ar_request_line (Default view) |

## Billing line fields

| ID | ServiceNow |
|---|---|
| `RQL.number` | x_ar_request_line.number · String · read-only |
| `RQL.ar_request` | x_ar_request_line.ar_request · Reference → x_ar_request · read-only |
| `RQL.contract` | x_ar_request_line.contract · Reference → x_ar_contract · read-only · Billing lines are contract level (D15). Existing contract at submit; otherwise set when AR saves Link Contract Reference on the case (D31) |
| `RQL.line_type` | x_ar_request_line.line_type · Choice · mandatory |
| `RQL.short_description` | x_ar_request_line.short_description · String · mandatory |
| `RQL.amount` | x_ar_request_line.amount · Currency · mandatory · Recurring: amount per period |
| `RQL.preferred_invoice_date` | x_ar_request_line.preferred_invoice_date · Date · One-off only |
| `RQL.frequency` | x_ar_request_line.frequency · Choice · Recurring only; Monthly by default (decision 10) |
| `RQL.start_date` | x_ar_request_line.start_date · Date · Recurring only: first billing date |
| `RQL.end_date` | x_ar_request_line.end_date · Date · Recurring only: last billing date |
| `RQL.remarks` | x_ar_request_line.remarks · String · Recurring only, optional |
| `RQL.invoice` | x_ar_request_line.invoice · Reference → x_ar_invoice · read-only |
| `RQL.billing_schedule` | x_ar_request_line.billing_schedule · Reference → x_ar_billing_schedule · read-only |

## Billing line item

| ID | ServiceNow |
|---|---|
| `LST-RQI` | List: x_ar_request_item · list view layout + list menu condition |
| `RP-RQI` | Record page (UI Builder) · x_ar_request_item |
| `HDR-RQI` | Record header: highlighted values of x_ar_request_item |
| `FRM-RQI` | Form view: x_ar_request_item (Default view) |

## Billing line item fields

| ID | ServiceNow |
|---|---|
| `RQI.ar_request` | x_ar_request_item.ar_request · Reference → x_ar_request · read-only |
| `RQI.item_number` | x_ar_request_item.item_number · Integer · read-only · System number 1, 2, 3… in row order within the AR request; set by the producer script, never typed (AR-i decision 37) |
| `RQI.amount_excl_gst` | x_ar_request_item.amount_excl_gst · Currency · mandatory |
| `RQI.gst_amount` | x_ar_request_item.gst_amount · Currency · read-only · Calculated: amount × GST rate (9%), rounded to the cent |
| `RQI.total_amount` | x_ar_request_item.total_amount · Currency · read-only · Calculated: amount + GST |
| `RQI.late_payment_interest` | x_ar_request_item.late_payment_interest · Decimal · Rate % (to be confirmed with the users) |
| `RQI.account_code` | x_ar_request_item.account_code · String |

## Collection

| ID | ServiceNow |
|---|---|
| `LST-CTX` | List: x_ar_collection_tx · list view layout + list menu condition |
| `RP-CTX` | Record page (UI Builder) · x_ar_collection_tx |
| `HDR-CTX` | Record header: highlighted values of x_ar_collection_tx |
| `FRM-CTX` | Form view: x_ar_collection_tx (Default view) |

## Collection fields

| ID | ServiceNow |
|---|---|
| `CTX.ar_request` | x_ar_collection_tx.ar_request · Reference → x_ar_request · read-only |
| `CTX.row_number` | x_ar_collection_tx.row_number · Integer · read-only |
| `CTX.collection_type` | x_ar_collection_tx.collection_type · Choice · mandatory |
| `CTX.number_of_transactions` | x_ar_collection_tx.number_of_transactions · Integer · mandatory · Positive whole number |

## Allocation

| ID | ServiceNow |
|---|---|
| `LST-CAL` | List: x_ar_collection_allocation · list view layout + list menu condition |
| `RP-CAL` | Record page (UI Builder) · x_ar_collection_allocation |
| `HDR-CAL` | Record header: highlighted values of x_ar_collection_allocation |
| `FRM-CAL` | Form view: x_ar_collection_allocation (Default view) |

## Cost centre

| ID | ServiceNow |
|---|---|
| `LST-CCT` | List: x_ar_cost_centre · list view layout + list menu condition |
| `RP-CCT` | Record page (UI Builder) · x_ar_cost_centre |
| `HDR-CCT` | Record header: highlighted values of x_ar_cost_centre |
| `FRM-CCT` | Form view: x_ar_cost_centre (Default view) |

## Cost centre fields

| ID | ServiceNow |
|---|---|
| `CCT.code` | x_ar_cost_centre.code · String · mandatory |
| `CCT.name` | x_ar_cost_centre.name · String · mandatory |
| `CCT.department` | x_ar_cost_centre.department · Choice · mandatory |
| `CCT.active` | x_ar_cost_centre.active · True/False · Inactive records are not offered in forms (CCI decision 12) |

## Account code

| ID | ServiceNow |
|---|---|
| `LST-ACT` | List: x_ar_account_code · list view layout + list menu condition |
| `RP-ACT` | Record page (UI Builder) · x_ar_account_code |
| `HDR-ACT` | Record header: highlighted values of x_ar_account_code |
| `FRM-ACT` | Form view: x_ar_account_code (Default view) |

## Account code fields

| ID | ServiceNow |
|---|---|
| `ACT.code` | x_ar_account_code.code · String · mandatory |
| `ACT.description` | x_ar_account_code.description · String · mandatory |
| `ACT.gst_treatment` | x_ar_account_code.gst_treatment · Choice |
| `ACT.active` | x_ar_account_code.active · True/False · Inactive records are not offered in forms (CCI decision 12) |

## Payment mode

| ID | ServiceNow |
|---|---|
| `LST-PMD` | List: x_ar_payment_mode · list view layout + list menu condition |
| `RP-PMD` | Record page (UI Builder) · x_ar_payment_mode |
| `HDR-PMD` | Record header: highlighted values of x_ar_payment_mode |
| `FRM-PMD` | Form view: x_ar_payment_mode (Default view) |

## Payment mode fields

| ID | ServiceNow |
|---|---|
| `PMD.bank_account` | x_ar_payment_mode.bank_account · Reference → x_ar_bank_account · mandatory |
| `PMD.name` | x_ar_payment_mode.name · String · mandatory · The code in the bank statement's transaction column for this payment mode, e.g. GIRO, FAST, CHQ, TT; a statement line matches it exactly, not case-sensitive (BSU decision 19) |
| `PMD.prefix` | x_ar_payment_mode.prefix · String · mandatory · Start of the Deposit ID, e.g. AAA |
| `PMD.suffix` | x_ar_payment_mode.suffix · String · mandatory · End of the Deposit ID |
| `PMD.account_code` | x_ar_payment_mode.account_code · Reference → x_ar_account_code · Optional. Active account codes (CCI decision 11). Purpose to be confirmed (BSU open question 11) |
| `PMD.cost_centre` | x_ar_payment_mode.cost_centre · Reference → x_ar_cost_centre · Optional. Active cost centres (CCI decision 11). Purpose to be confirmed (BSU open question 11) |
| `PMD.active` | x_ar_payment_mode.active · True/False · Inactive payment modes are not used for new uploads (CCI decision 12) |

## Calculated columns

| ID | ServiceNow |
|---|---|
| `INV.amount_due` | Calculated: amount − matched BSU deposits |
| `INV.payment_status` | Calculated: Unpaid / Part paid / Paid / Overdue |
| `DEP.unmatched_amount` | Calculated: amount − allocations |
| `DEP.match_state` | Calculated: Unmatched / Part matched / Matched |
| `CUS.open_ar` | Calculated: sum of amount_due on issued invoices |
| `CUS.overdue` | Calculated: amount_due on issued invoices past due_date |
| `CON.status` | Calculated: Active / Not started / Ended from start and end dates (shells: Open) |
| `CON.line_count` | Calculated: number of billing lines filed under the contract |
| `BSU.department` | Dot-walk: bank_account.department |
| `RQL.line_value` | Calculated: one-off amount, or recurring amount × number of periods |
| `RQL.periods` | Calculated: number of billing dates between From and To at the frequency |
| `SCH.next_billing_date` | Calculated: first period on or after today without an invoice |
| `SCH.periods_due` | Calculated: periods up to today without an invoice |
| `BNK.last_statement` | Calculated: latest sc_req_item.statement_date for the account |
| `INV.aging` | Calculated (#10 E10.11): Current / 1–30 / 31–60 / 61–90 / 90+ days past the due date, for issued invoices with an amount due |
| `PMD.deposit_id_pattern` | Calculated for display: <prefix>-DDMMYY-<suffix> (BSU decision 18) |
| `PMD.bank_name` | Dot-walk: bank_account.bank (Bank name) |
| `PMD.bank_account_name` | Dot-walk: bank_account.account_name (Bank account name) |

## Related lists

| ID | ServiceNow |
|---|---|
| `RL-REQ-RQL` | Related list: x_ar_request_line where ar_request = this ar request |
| `RL-REQ-RQI` | Related list: x_ar_request_item where ar_request = this ar request |
| `RL-REQ-INV` | Related list: x_ar_invoice where ar_request = this ar request |
| `RL-REQ-SCH` | Related list: x_ar_billing_schedule where contract (the case's contract; read-only on the case) = this ar request |
| `RL-CUS-BCT` | Related list: x_ar_billing_contact where customer = this customer |
| `RL-CUS-DOC` | Related list: x_ar_customer_document where customer = this customer |
| `RL-CUS-SCH` | Related list: x_ar_billing_schedule where customer = this customer |
| `RL-SCH-INV` | Related list: x_ar_invoice where billing_schedule = this billing schedule |
| `RL-CUS-CON` | Related list: x_ar_contract where customer = this customer |
| `RL-CUS-INV` | Related list: x_ar_invoice where customer = this customer |
| `RL-CUS-REQ` | Related list: x_ar_request where customer = this customer |
| `RL-CON-INV` | Related list: x_ar_invoice where contract = this contract |
| `RL-CON-REQ` | Related list: x_ar_request where contract = this contract |
| `RL-CON-RQL` | Related list: x_ar_request_line where contract = this contract |
| `RL-CON-SCH` | Related list: x_ar_billing_schedule where contract = this contract |
| `RL-INV-ALC` | Related list: x_ar_allocation where invoice = this invoice |
| `RL-DEP-ALC` | Related list: x_ar_allocation where deposit = this bsu deposit |
| `RL-REQ-ALC` | Related list: x_ar_allocation where request = this ar request |
| `RL-REQ-CTX` | Related list: x_ar_collection_tx where ar_request = this ar request |
| `RL-REQ-CAL` | Related list: x_ar_collection_allocation where ar_request = this ar request |
| `RL-CCT-CAL` | Related list: x_ar_collection_allocation where cost_centre = this cost centre |
| `RL-INV-RQL` | Related list: x_ar_request_line where invoice = this invoice |
| `RL-BNK-PMD` | Related list: x_ar_payment_mode where bank_account = this bank account |
| `RL-ACT-CAL` | Related list: x_ar_collection_allocation where account_code = this account code |
| `RL-BSU-DEP` | Related list: x_ar_bank_statement where bsu = this statement upload |
| `RL-BNK-BSU` | Related list: sc_req_item where bank_account = this bank account |
| `RL-BNK-DEP` | Related list: x_ar_bank_statement where bank_account = this bank account |

## UI actions

| ID | ServiceNow |
|---|---|
| `UA-PT-addcol` | UI action: Collections AR-iii: + Add row in Total number of collections for the day (multi-row set, max 99) |
| `UA-PT-addalloc` | UI action: Collections AR-iv: + Add row in Amount for Each Account Code (multi-row set, max 10) |
| `UA-REQ-assign` | UI action: Assign to me → assigned_to = current user (assignment_group kept, default Accounts Receivable); New → Work in progress. One of only two case actions with Save (AR-00, 2026-11-16) |
| `UA-REQ-info` | UI action: RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Request info. AR sets State = Awaiting requestor information (optional Substate) and posts an additional comment |
| `UA-REQ-reject` | UI action: RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Reject. AR sets State = Closed incomplete or Cancelled and posts an additional comment |
| `UA-REQ-linkctr` | UI action: RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Link contract (AR-ix). AR sets Contract on the case and Saves; a before-update business rule sets customer from the contract |
| `UA-REQ-giroadd` | UI action: RETIRED 2026-11-12 (AR-ix decision 11): Activate GIRO. AR now updates GIRO on the contract record and uses Complete (UA-REQ-girocomplete) |
| `UA-REQ-giroremove` | UI action: RETIRED 2026-11-12 (AR-ix decision 11): Remove GIRO. AR now updates GIRO on the contract record and uses Complete (UA-REQ-girocomplete) |
| `UA-REQ-girocomplete` | UI action: RETIRED 2026-11-16 (AR-00: case actions are Assign to me and Save; state via the State dropdown): Complete (AR-ix). AR sets State = Closed complete |
| `UA-REQ-link` | UI action: RETIRED 2026-11-17 (D31): AR sets up customers, contracts and documents by hand and links the case with Link Customer Reference / Link Contract Reference. Was: Link to customer → creates or links x_ar_customer; links the existing contract, creates the new contract, or finds/creates the department's no-contract shell; sets contract on every billing line; writes the bill-to to the contract (and the department default contact if none); files documents to x_ar_customer_document (D10, D15, D16) |
| `UA-SCH-raise` | UI action: RETIRED 2026-11-16 (D12 amended): Raise invoice. Draft invoices now come from the daily scheduled job JOB-DAILYINV |
| `UA-SCH-save` | UI action: Save (update) |
| `UA-BCT-save` | UI action: Save (update) |
| `UA-BCT-new` | UI action: New (list action) |
| `UA-BCT-insert` | UI action: Submit (insert); several contacts per customer and department allowed (CCI decision 15, D11 amended) |
| `UA-CUS-newcontact` | UI action: Add billing contact → new billing contact form with customer prefilled |
| `UA-RQL-invoice` | UI action: RETIRED 2026-11-16 (CCI decision 8): Create invoice on a one-off line. The 1st invoice is generated when the AR-i case is set to Closed complete |
| `UA-RQL-schedule` | UI action: RETIRED 2026-11-16 (CCI decision 8): Set up billing schedule on a recurring line. AR creates the schedule on the contract (New billing schedule) and picks the AR-i case |
| `UA-RQL-save` | UI action: Save (update, while the line is open) |
| `UA-PT-newcust` | UI action: Portal: Add as new customer (sets new_customer = true, copies the search text into the name) |
| `UA-PT-additem` | UI action: Portal: Add item (row in the Billing line items multi-row variable set); Remove deletes a row |
| `UA-PT-addline` | UI action: RETIRED 2026-11-12: Add one-off / recurring line; the request has one billing event from the invoice details (PT-37) |
| `UA-REQ-post` | UI action: Post work note / additional comment to the activity stream |
| `UA-REQ-save` | UI action: Save (update). On x_ar_request also: state change journalled (system note); substate cleared unless state = Awaiting requestor information; AR-ix contract change sets customer from the contract; AR-i set to Closed complete generates the 1st invoice as a draft for each line without one (blocked until customer and contract are linked; CCI decision 8) |
| `UA-INV-issue` | UI action: Issue invoice (saves the form first) → state = Issued; blocked until approval_date is set (every invoice, CCI decision 9); posts a comment to the requester on the linked AR request |
| `UA-INV-cancel` | UI action: Cancel invoice → only when no BSU deposit is matched |
| `UA-INV-save` | UI action: Save (update, draft only) |
| `UA-DEP-match` | UI action: Match to invoice → opens the invoice finder for this deposit |
| `UA-DEP-find` | UI action: Find invoice → opens the invoice finder |
| `UA-DEP-confirm` | UI action: Confirm match → inserts x_ar_allocation records (manual), with invoice or, for a Collections case, request set (D29) |
| `UA-DEP-remove` | UI action: Remove match → deletes the deposit's allocations |
| `UA-DEP-export` | UI action: Export matches to CSV |
| `UA-BSU-new` | UI action: New (list action on Statement uploads): opens the upload form (catalog item Bank statement upload) |
| `UA-BSU-save` | UI action: Save to bank statements → submits the catalog item: creates the RITM (sc_req_item, one per bank account per day); a flow parses the CSV with the bank's template, inserts one x_ar_bank_statement row per deposit referencing the RITM, and closes the RITM complete |
| `UA-BSU-sample` | UI action: Demo only: generate a sample CSV in the bank's layout |
| `UA-BNK-upload` | UI action: Upload statement → opens the BSU page for this account |
| `UA-CUS-save` | UI action: Save (update) |
| `UA-CON-save` | UI action: Save (update) |
| `UA-BNK-save` | UI action: Save (update) |
| `UA-CUS-new` | UI action: New (list action) |
| `UA-CON-new` | UI action: New (list action) |
| `UA-CCT-new` | UI action: New (list action) |
| `UA-INV-pdf` | UI action: Print or save as PDF: opens the invoice document for printing (in ServiceNow: download the generated PDF attachment) |
| `UA-BNK-newmode` | UI action: New payment mode (on the bank account): opens a new payment mode with the bank account filled in |
| `UA-PMD-new` | UI action: New (list action) |
| `UA-PMD-insert` | UI action: Submit (insert) |
| `UA-PMD-save` | UI action: Save (update) |
| `UA-RQL-newrel` | UI action: New billing line on the contract's Billing lines tab (#10 E10.7): AR copies the AR-i line; contract filled in |
| `UA-INV-newrel` | UI action: New invoice on the contract's Invoices tab (#10 E10.10, CCI decision 14): draft invoice with customer and contract filled in |
| `UA-BCT-newrel` | UI action: Add billing contact on the customer's Billing contacts tab |
| `UA-INV-insert` | UI action: Submit (insert) |
| `UA-RQL-insert` | UI action: Submit (insert) |
| `UA-DOC-new` | UI action: New (list action): AR files a customer document by hand (D31) |
| `UA-DOC-insert` | UI action: Submit (insert) |
| `UA-DOC-save` | UI action: Save (update) |
| `UA-ACT-new` | UI action: New (list action) |
| `UA-CCT-save` | UI action: Save (update) |
| `UA-CCT-insert` | UI action: Submit (insert) |
| `UA-ACT-save` | UI action: Save (update) |
| `UA-ACT-insert` | UI action: Submit (insert) |
| `UA-BNK-new` | UI action: New (list action) |
| `UA-CUS-insert` | UI action: Submit (insert) |
| `UA-CON-insert` | UI action: Submit (insert) |
| `UA-SCH-insert` | UI action: Submit (insert) of a billing schedule created from the contract (CCI decision 8) |
| `UA-BNK-insert` | UI action: Submit (insert) |
| `UA-CON-newschedule` | UI action: New billing schedule (contract record, CCI decision 8) → new x_ar_billing_schedule form with contract (and customer) prefilled; AR sets the 2nd invoice's date as first billing date and picks the AR-i case (source_request) |
| `UA-CUS-newcontract` | UI action: New contract → new contract form with customer prefilled |

