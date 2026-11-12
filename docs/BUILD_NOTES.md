# Build note IDs

Every element of the prototype that maps to a ServiceNow build item carries a small purple **ID tag**
(on by default; *Show IDs* in the demo bar hides them). Developers can switch on *ServiceNow notes*
to label every element with its full ServiceNow reference. Hover a tag to see its ServiceNow note;
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
| `WS-13` | Record tabs in the resizable pane (Horizon Record page template): Details (form) first, then related items, then one tab per related list; extra tabs move to the More menu |
| `WS-14` | Contextual side bar (Horizon pattern): vertical icon tabs on the right of the record tab, open by default, collapsible and resizable; holds Customer setup, Activity stream and Attachments for AR requests |
| `WS-15` | Form record presence: avatars of users viewing the record (out-of-box on the Horizon Record page template) |
| `WS-17` | Record history tab (out-of-box on the Record page template): sys_audit / sys_history_line for the record. Turn on Audit in the dictionary of every x_ar table; shows when, who, field, old and new value |
| `WS-16` | List page template (Horizon): list menu on the left, list on the right; the menu selection drives the list. Menu can be hidden |
| `CON-GIRO` | Tab GIRO history on the contract: related list x_ar_request where contract = this contract and ar_form = AR-ix; GIRO column: Active (= contract.giro_case), Ended, Removed GIRO, Open, Rejected |
| `SCH-PER` | Billing periods of the schedule (computed list, or child table x_ar_billing_period in the build) with status Invoiced / Due / Upcoming |

## AR request record

| ID | ServiceNow |
|---|---|
| `REQ-ACT` | Activity stream: comments (visible to requester) + work_notes (AR only) + field changes |
| `REQ-SETUP` | Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, contract / no-contract shell, bill-to on the contract, documents filed, billing lines done |
| `REQ-GIRO` | GIRO setup panel (AR-ix case, contextual side bar): contract linked? the contract's GIRO status and active case; then Activate GIRO / Remove GIRO, or why it is blocked (one active GIRO per contract, D21) |
| `REQ-GIROHIST` | Tab GIRO history on the AR-ix case: the AR-ix cases on the same contract (related list x_ar_request where contract = this case's contract and ar_form = AR-ix) |
| `REQ-LINKCTR` | Contract to link (AR-ix): reference to x_ar_contract, matching contract number listed first. Used by Link contract; for a contract not on file AR processes its AR-i first |
| `REQ-LINKCO` | Company (core_company) for the new customer; mandatory when Link to customer creates a new x_ar_customer. Lists companies with no customer yet, closest name first (D26) |
| `REQ-LINKTO` | Choice used by Link to customer: create the new customer, or link the AR-i to an existing x_ar_customer (duplicate check) |
| `REQ-ATT` | Attachments: sys_attachment on x_ar_request (added on the portal form) |

## Customer record

| ID | ServiceNow |
|---|---|
| `CUS-TREE` | Billing hierarchy on the customer record (D15): customer › contract / no-contract shell (x_ar_contract) › billing lines (x_ar_request_line.contract) › invoices / billing schedule. UI Builder component over related lists, or a hierarchical list |

## Cash application

| ID | ServiceNow |
|---|---|
| `CSH-01` | Cash application page (UI Builder custom page) |
| `CSH-02` | Single-score cards over x_ar_bank_statement / x_ar_allocation |
| `CSH-03` | List of x_ar_bank_statement with match state; filter tabs To match / Matched / All |
| `CSH-04` | Invoice finder (modal or side panel): ranked issued invoices + allocation preview before confirming |

## BSU page

| ID | ServiceNow |
|---|---|
| `BSU-01` | BSU page (UI Builder custom page): checklist, upload form, recent uploads |
| `BSU-02` | Statement-day checklist: x_ar_bank_account left-joined to x_ar_bsu for the chosen statement_date |
| `BSU-03` | Upload form: bank account, statement date, CSV file |
| `BSU-04` | CSV file kept as sys_attachment on x_ar_bsu |
| `BSU-05` | Bank template: column mapping per bank (config table x_ar_bank_template or system properties) |
| `BSU-06` | Preview before insert: deposits with Deposit IDs, skipped withdrawals, totals |
| `BSU-07` | Recent uploads: list of x_ar_bsu ordered by uploaded_at desc |

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
| `PT-39` | AR-i Customer section, found customer (D23): read-only customer details in this order: name, UEN, address (from x_ar_customer), agency type, V@G, V@G sub-BU, POC name, POC email (copied from x_ar_customer into the request variables by a catalog client script; variables read-only via UI policy). New customer: the same fields are editable and Link to customer replicates them to the customer |
| `PT-36` | AR-i GIRO subsection inside Contract (D22): 'Is there an existing DDA?' read-only Yes / No (variable giro_on_contract) from the chosen contract's giro_status (GlideAjax), plus the active AR-ix case number when Yes. Greyed out with a tooltip for a new contract or no-contract billing: raise an AR-ix once AR has set up the contract |
| `PT-40` | AR-i new contract variables, in order: new_contract_type (Recurring / Ad-hoc), new_contract_number, new_contract_ref, new_contract_po, new_contract_title, start / end dates, new_contract_value, bill-to person / email / phone, new_contract_billing_cycle (+ suggested billing cycle when Others), new_contract_invoice_date, new_contract_payment_terms (+ other terms when Others), new_contract_proration (+ 1st / last month amounts when Yes), type_of_billing (+ bulk upload when C / D / E). Link to customer creates x_ar_contract from them |
| `PT-41` | AR-i existing contract: every contract detail read-only from x_ar_contract, in the same order as a new contract (catalog client script / read-only HTML widget) |
| `PT-37` | AR-i variable set Invoice details (AR-i decisions 31–33): short_description (invoice description), attention_name / attention_email (prefilled from the contract bill-to), amount_per_period (before GST), preferred_invoice_date_choice (label 'Preferred invoice date': Per Billing Cycle / Expedited, optional; only for a one-invoice request, UI policy hides and clears it for a recurring contract) and preferred_invoice_date_justification (shown when Expedited, optional), billing_line_items_required (Yes / No → multi-row variable set PT-43). Catalog client script shows the billing summary: recurring contract → monthly to the contract end date (with contract proration); otherwise one invoice. The producer script creates one x_ar_request_line from these |
| `PT-30` | Variable set General information (D19), first section of every AR form record producer: requester_name (default current user's name), requester_email (from SSO, read-only), department, cc_list (emails; copied to the case watch_list so they can view it on the portal) |
| `PT-31` | Record producer "AR-ix GIRO authorisation" on x_ar_request. Producer script: current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>; |
| `PT-32` | AR-ix variable set Contract and applicant: customer search, existing contract (reference qualifier: customer's contracts, not shells) or 'not listed' with a reference number; applicant name / email / mobile prefilled from the contract's bill-to (catalog client script onChange contract); invoice reference number |
| `PT-33` | AR-ix variable set GIRO details: purpose (Rental / Carpark / Others), other purpose, type (Add / Remove GIRO); UI policies: rental → location, effective start/end; carpark → car plate, parking start/end; amount (mandatory for Add); supporting documents (attachments) |
| `PT-34` | Info message on AR-ix: the chosen contract's GIRO status and active case (GlideAjax read of x_ar_contract.giro_status / giro_case). Add GIRO on a contract with GIRO active is blocked (onSubmit / validation) |
| `PT-35` | Ticket page block for AR-ix: GIRO request summary and its outcome (contract to be linked / with AR / active / removed) |
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
| `PT-20` | Variable set Contract and bill-to (D15): contract_option (existing / new / no contract required), contract or new-contract variables, bill-to. UI policies per option |
| `PT-42` | AR-i variable set Others (after Customer documents; final placement to be decided by the owner): cost_center, agent_name, po_number. All optional (invoice_breakdown and account_code removed, AR-i decision 39) |
| `PT-43` | AR-i multi-row variable set Billing line items (x_ar_request_item), shown when billing_line_items_required = Yes: item_number (row number 1, 2, 3…, read-only; the producer script sets it in row order), amount_excl_gst*, gst_amount and total_amount (calculated by catalog client script at the GST rate, read-only), late_payment_interest (rate %), account_code. At least one row when Yes |
| `PT-28` | No contract required: info message (UI policy on contract_option = none). Link to customer files the lines under the customer's no-contract shell for the department (x_ar_contract, contract_type = shell) |
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
| `REQ.state` | x_ar_request.state · Choice · read-only |
| `REQ.opened_by` | x_ar_request.opened_by · Reference → sys_user · read-only |
| `REQ.ar_form` | x_ar_request.ar_form · Choice · read-only |
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
| `REQ.contract` | x_ar_request.contract · Reference → x_ar_contract · Existing contract; for a new contract or No contract required, set by Link to customer |
| `REQ.new_contract_type` | x_ar_request.new_contract_type · Choice · Mandatory for a new contract |
| `REQ.new_contract_number` | x_ar_request.new_contract_number · String · Mandatory for a new contract |
| `REQ.new_contract_ref` | x_ar_request.new_contract_ref · String · Optional for a new contract (AR-ix: the reference to link) |
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
| `REQ.bill_to_name` | x_ar_request.bill_to_name · String · Mandatory when the contract (or shell) has no bill-to person yet; Link to customer writes it to the contract |
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
| `REQ.amount` | x_ar_request.amount · Currency · read-only · Calculated: one-off lines + recurring amount × number of periods |
| `REQ.po_number` | x_ar_request.po_number · String |
| `REQ.customer_poc_name` | x_ar_request.customer_poc_name · String · AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in and replicated to the customer by Link to customer |
| `REQ.customer_poc_email` | x_ar_request.customer_poc_email · String · AR-i customer details; must be a valid email. Same rule as POC name |
| `REQ.cost_center` | x_ar_request.cost_center · String · Optional, free text. To be filled by GA |
| `REQ.agent_name` | x_ar_request.agent_name · String · Optional, free text |
| `REQ.agency_type` | x_ar_request.agency_type · Choice · AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master |
| `REQ.vag` | x_ar_request.vag · Choice · AR-i customer details, optional. Found customer: read-only from the customer master |
| `REQ.sub_bu` | x_ar_request.sub_bu · String · Optional, free text |
| `REQ.type_of_billing` | x_ar_request.type_of_billing · Choice · Contract level: entered for a new contract (copied to the contract by Link to customer); read-only copy of the contract's value for an existing one |
| `REQ.bulk_supporting_docs` | x_ar_request.bulk_supporting_docs · Attachment · Optional; several files at once |
| `REQ.giro_on_contract` | x_ar_request.giro_on_contract · Choice · read-only · Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21) |
| `REQ.giro_applicant_name` | x_ar_request.giro_applicant_name · String · AR-ix. Mandatory on the form; prefilled from the contract's bill-to |
| `REQ.giro_applicant_email` | x_ar_request.giro_applicant_email · String · AR-ix. Mandatory on the form; prefilled from the contract's bill-to |
| `REQ.giro_applicant_mobile` | x_ar_request.giro_applicant_mobile · String · AR-ix. Prefilled from the contract's bill-to phone |
| `REQ.giro_invoice_ref` | x_ar_request.giro_invoice_ref · String · AR-ix. Optional; requirement to be confirmed |
| `REQ.giro_purpose` | x_ar_request.giro_purpose · Choice · AR-ix. Mandatory on the form |
| `REQ.giro_purpose_other` | x_ar_request.giro_purpose_other · String · AR-ix. Mandatory when Purpose = Others |
| `REQ.giro_type` | x_ar_request.giro_type · Choice · AR-ix. Mandatory on the form |
| `REQ.giro_start_date` | x_ar_request.giro_start_date · Date · AR-ix rental. Mandatory for Add GIRO |
| `REQ.giro_end_date` | x_ar_request.giro_end_date · Date · AR-ix rental. Optional; on or after the start date |
| `REQ.giro_location` | x_ar_request.giro_location · String · AR-ix rental. Mandatory |
| `REQ.giro_carplate` | x_ar_request.giro_carplate · String · AR-ix carpark. Mandatory; one vehicle per form |
| `REQ.giro_parking_start` | x_ar_request.giro_parking_start · Date · AR-ix carpark. Mandatory for Add GIRO |
| `REQ.giro_parking_end` | x_ar_request.giro_parking_end · Date · AR-ix carpark. Optional; on or after the start date |
| `REQ.giro_amount` | x_ar_request.giro_amount · Currency · AR-ix, all purposes. Mandatory for Add GIRO |
| `REQ.doc_contract_po` | x_ar_request.doc_contract_po · Attachment · Optional, offered for a new contract only |
| `REQ.doc_acra` | x_ar_request.doc_acra · Attachment · Only when not already on file |
| `REQ.doc_billing_form` | x_ar_request.doc_billing_form · Attachment · Only when not already on file for this department |
| `REQ.description` | x_ar_request.description · String (4000) |
| `REQ.assigned_to` | x_ar_request.assigned_to · Reference → sys_user |
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
| `DEP.deposit_id` | x_ar_bank_statement.deposit_id · String · read-only · Set by before-insert business rule |
| `DEP.bank_account` | x_ar_bank_statement.bank_account · Reference → x_ar_bank_account · read-only |
| `DEP.bsu` | x_ar_bank_statement.bsu · Reference → x_ar_bsu · read-only |
| `DEP.value_date` | x_ar_bank_statement.value_date · Date · read-only |
| `DEP.amount` | x_ar_bank_statement.amount · Currency · read-only |
| `DEP.payer_name` | x_ar_bank_statement.payer_name · String · read-only |
| `DEP.bank_reference` | x_ar_bank_statement.bank_reference · String · read-only |
| `DEP.bank_transaction_ref` | x_ar_bank_statement.bank_transaction_ref · String · read-only |

## Statement upload

| ID | ServiceNow |
|---|---|
| `LST-BSU` | List: x_ar_bsu · list view layout + list menu condition |
| `RP-BSU` | Record page (UI Builder) · x_ar_bsu |
| `HDR-BSU` | Record header: highlighted values of x_ar_bsu |
| `FRM-BSU` | Form view: x_ar_bsu (Default view) |

## Statement upload fields

| ID | ServiceNow |
|---|---|
| `BSU.number` | x_ar_bsu.number · String · read-only |
| `BSU.bank_account` | x_ar_bsu.bank_account · Reference → x_ar_bank_account · read-only |
| `BSU.statement_date` | x_ar_bsu.statement_date · Date · read-only |
| `BSU.file_name` | x_ar_bsu.file_name · String · read-only |
| `BSU.uploaded_by` | x_ar_bsu.uploaded_by · Reference → sys_user · read-only |
| `BSU.uploaded_at` | x_ar_bsu.uploaded_at · String · read-only |
| `BSU.deposit_count` | x_ar_bsu.deposit_count · Integer · read-only |
| `BSU.deposit_total` | x_ar_bsu.deposit_total · Currency · read-only |
| `BSU.withdrawals_skipped` | x_ar_bsu.withdrawals_skipped · Integer · read-only |

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
| `BNK.bank` | x_ar_bank_account.bank · Choice · mandatory · Mock aliases for Singapore's three largest banks; each has its own CSV layout |
| `BNK.account_number` | x_ar_bank_account.account_number · String · mandatory |
| `BNK.account_name` | x_ar_bank_account.account_name · String · mandatory |
| `BNK.department` | x_ar_bank_account.department · Choice · mandatory |
| `BNK.account_type` | x_ar_bank_account.account_type · Choice · mandatory |
| `BNK.currency` | x_ar_bank_account.currency · String · read-only |

## Allocation fields

| ID | ServiceNow |
|---|---|
| `ALC.deposit` | x_ar_allocation.deposit · Reference → x_ar_bank_statement |
| `ALC.invoice` | x_ar_allocation.invoice · Reference → x_ar_invoice |
| `ALC.amount` | x_ar_allocation.amount · Currency |
| `ALC.state` | x_ar_allocation.state · Choice |
| `ALC.exception` | x_ar_allocation.exception · Choice |
| `ALC.reason` | x_ar_allocation.reason · String (1000) |

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
| `CUS.agency_type` | x_ar_customer.agency_type · Choice · Master data replicated from the AR-i that set the customer up (Link to customer, D23) |
| `CUS.vag` | x_ar_customer.vag · Choice |
| `CUS.vag_sub_bu` | x_ar_customer.vag_sub_bu · String |
| `CUS.poc_name` | x_ar_customer.poc_name · String |
| `CUS.poc_email` | x_ar_customer.poc_email · String |
| `CUS.payment_terms` | x_ar_customer.payment_terms · Integer |
| `CUS.credit_limit` | x_ar_customer.credit_limit · Currency |
| `CUS.bank_names` | x_ar_customer.bank_names · String (1000) · Comma-separated. Used to rank invoices in the invoice finder. |
| `CUS.notes` | x_ar_customer.notes · String (4000) |

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
| `CON.number` | x_ar_contract.number · String · mandatory |
| `CON.contract_type` | x_ar_contract.contract_type · Choice · mandatory · Contract, or the customer's no-contract shell (D15) |
| `CON.contract_category` | x_ar_contract.contract_category · Choice · Recurring or Ad-hoc |
| `CON.customer` | x_ar_contract.customer · Reference → x_ar_customer · mandatory |
| `CON.department` | x_ar_contract.department · Choice · Owning department; a shell is unique per customer + department |
| `CON.reference_number` | x_ar_contract.reference_number · String |
| `CON.po_number` | x_ar_contract.po_number · String |
| `CON.short_description` | x_ar_contract.short_description · String · mandatory |
| `CON.billing_type` | x_ar_contract.billing_type · Choice |
| `CON.contract_value` | x_ar_contract.contract_value · Currency |
| `CON.start_date` | x_ar_contract.start_date · Date |
| `CON.end_date` | x_ar_contract.end_date · Date |
| `CON.payment_terms` | x_ar_contract.payment_terms · Integer |
| `CON.discount_percent` | x_ar_contract.discount_percent · Decimal |
| `CON.discount_days` | x_ar_contract.discount_days · Integer |
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
| `CON.giro_status` | x_ar_contract.giro_status · Choice · read-only · Set by Activate GIRO / Remove GIRO on an AR-ix case. At most one active GIRO per contract (D21) |
| `CON.giro_case` | x_ar_contract.giro_case · Reference → x_ar_request · read-only · The approved AR-ix case whose GIRO is active; empty when GIRO is not active |
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
| `BCT.department` | x_ar_billing_contact.department · Choice · mandatory |
| `BCT.contact_name` | x_ar_billing_contact.contact_name · String · mandatory |
| `BCT.email` | x_ar_billing_contact.email · String · mandatory |
| `BCT.phone` | x_ar_billing_contact.phone · String |
| `BCT.billing_address` | x_ar_billing_contact.billing_address · String (1000) |
| `BCT.source_request` | x_ar_billing_contact.source_request · Reference → x_ar_request · read-only |

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
| `SCH.customer` | x_ar_billing_schedule.customer · Reference → x_ar_customer · mandatory |
| `SCH.contract` | x_ar_billing_schedule.contract · Reference → x_ar_contract |
| `SCH.department` | x_ar_billing_schedule.department · Choice · mandatory |
| `SCH.short_description` | x_ar_billing_schedule.short_description · String · mandatory |
| `SCH.frequency` | x_ar_billing_schedule.frequency · Choice · mandatory |
| `SCH.amount` | x_ar_billing_schedule.amount · Currency · mandatory |
| `SCH.first_billing_date` | x_ar_billing_schedule.first_billing_date · Date · mandatory |
| `SCH.last_billing_date` | x_ar_billing_schedule.last_billing_date · Date · mandatory |
| `SCH.first_period_amount` | x_ar_billing_schedule.first_period_amount · Currency · Empty = amount per period |
| `SCH.last_period_amount` | x_ar_billing_schedule.last_period_amount · Currency · Empty = amount per period |
| `SCH.source_request` | x_ar_billing_schedule.source_request · Reference → x_ar_request · read-only |
| `SCH.source_line` | x_ar_billing_schedule.source_line · Reference → x_ar_request_line · read-only |

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
| `RQL.contract` | x_ar_request_line.contract · Reference → x_ar_contract · read-only · Billing lines are contract level (D15). Existing contract at submit; otherwise set by Link to customer |
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
| `BNK.last_statement` | Calculated: latest x_ar_bsu.statement_date for the account |

## Related lists

| ID | ServiceNow |
|---|---|
| `RL-REQ-RQL` | Related list: x_ar_request_line where ar_request = this ar request |
| `RL-REQ-RQI` | Related list: x_ar_request_item where ar_request = this ar request |
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
| `RL-BSU-DEP` | Related list: x_ar_bank_statement where bsu = this statement upload |
| `RL-BNK-BSU` | Related list: x_ar_bsu where bank_account = this bank account |
| `RL-BNK-DEP` | Related list: x_ar_bank_statement where bank_account = this bank account |

## UI actions

| ID | ServiceNow |
|---|---|
| `UA-REQ-assign` | UI action: Assign to me → assigned_to = current user, state = In progress |
| `UA-REQ-info` | UI action: Request info → state = Awaiting info; requires an additional comment (visible on portal) |
| `UA-REQ-reject` | UI action: Reject → state = Rejected; requires an additional comment |
| `UA-REQ-linkctr` | UI action: Link contract (AR-ix, shown while contract is empty) → sets contract and customer from the chosen x_ar_contract; New → In progress |
| `UA-REQ-giroadd` | UI action: Activate GIRO (AR-ix, type Add) → contract.giro_status = Active, contract.giro_case = this case; case → Completed with a requester-visible comment. Blocked when the contract already has GIRO active (D21) |
| `UA-REQ-giroremove` | UI action: Remove GIRO (AR-ix, type Remove) → contract.giro_status = Not active, contract.giro_case cleared; system note on the case that was active; case → Completed. Blocked when GIRO is not active |
| `UA-REQ-link` | UI action: Link to customer → creates or links x_ar_customer; links the existing contract, creates the new contract, or finds/creates the department's no-contract shell; sets contract on every billing line; writes the bill-to to the contract (and the department default contact if none); files documents to x_ar_customer_document (D10, D15, D16) |
| `UA-SCH-raise` | UI action: Raise invoice → inserts a draft x_ar_invoice for the period (billing_schedule + billing_period set); never automatic (D12) |
| `UA-SCH-save` | UI action: Save (update) |
| `UA-BCT-save` | UI action: Save (update) |
| `UA-BCT-new` | UI action: New (list action) |
| `UA-BCT-insert` | UI action: Submit (insert); unique per customer + department |
| `UA-CUS-newcontact` | UI action: Add billing contact → new billing contact form with customer prefilled |
| `UA-RQL-invoice` | UI action: Create invoice (one-off line) → inserts draft x_ar_invoice for the line (request_line set) |
| `UA-RQL-schedule` | UI action: Set up billing schedule (recurring line) → inserts x_ar_billing_schedule over the line's date range; comment to requester (D12, D13) |
| `UA-RQL-save` | UI action: Save (update, while the line is open) |
| `UA-PT-newcust` | UI action: Portal: Add as new customer (sets new_customer = true, copies the search text into the name) |
| `UA-PT-additem` | UI action: Portal: Add item (row in the Billing line items multi-row variable set); Remove deletes a row |
| `UA-PT-addline` | UI action: RETIRED 2026-11-12: Add one-off / recurring line; the request has one billing event from the invoice details (PT-37) |
| `UA-REQ-post` | UI action: Post work note / additional comment to the activity stream |
| `UA-REQ-save` | UI action: Save (update) |
| `UA-INV-issue` | UI action: Issue invoice → state = Issued; BR sets AR request to Invoiced and posts a comment to the requester |
| `UA-INV-cancel` | UI action: Cancel invoice → only when no BSU deposit is matched |
| `UA-INV-save` | UI action: Save (update, draft only) |
| `UA-DEP-match` | UI action: Match to invoice → opens the invoice finder for this deposit |
| `UA-DEP-find` | UI action: Find invoice → opens the invoice finder |
| `UA-DEP-confirm` | UI action: Confirm match → inserts x_ar_allocation records (manual) |
| `UA-DEP-remove` | UI action: Remove match → deletes the deposit's allocations |
| `UA-DEP-export` | UI action: Export matches to CSV |
| `UA-BSU-save` | UI action: Save to bank statements → inserts x_ar_bsu + one x_ar_bank_statement row per deposit |
| `UA-BSU-sample` | UI action: Demo only: generate a sample CSV in the bank's layout |
| `UA-BNK-upload` | UI action: Upload statement → opens the BSU page for this account |
| `UA-CUS-save` | UI action: Save (update) |
| `UA-CON-save` | UI action: Save (update) |
| `UA-BNK-save` | UI action: Save (update) |
| `UA-CUS-new` | UI action: New (list action) |
| `UA-CON-new` | UI action: New (list action) |
| `UA-BNK-new` | UI action: New (list action) |
| `UA-CUS-insert` | UI action: Submit (insert) |
| `UA-CON-insert` | UI action: Submit (insert) |
| `UA-BNK-insert` | UI action: Submit (insert) |
| `UA-CUS-newcontract` | UI action: New contract → new contract form with customer prefilled |

