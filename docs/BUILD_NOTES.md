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
| `SCH-PER` | Billing periods of the schedule (computed list, or child table x_ar_billing_period in the build) with status Invoiced / Due / Upcoming |

## AR request record

| ID | ServiceNow |
|---|---|
| `REQ-ACT` | Activity stream: comments (visible to requester) + work_notes (AR only) + field changes |
| `REQ-SETUP` | Customer setup panel (UI Builder component on the AR request record page): checklist of customer link, department billing contact, documents filed, contract location, billing schedule |
| `REQ-LINKTO` | Choice used by Link to customer: create the new customer, or link the AR-i to an existing x_ar_customer (duplicate check) |
| `REQ-ATT` | Attachments: sys_attachment on x_ar_request (added on the portal form) |

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
| `PT-05` | Record producer "AR-i New AR request" on x_ar_request. Producer script: current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; |
| `PT-06` | Variable requested_by → opened_by (default: current user, read-only) |
| `PT-07` | Catalog client script (onChange contract): contract billing position via GlideAjax / Script Include |
| `PT-08` | Variable attachments → sys_attachment on the created x_ar_request |
| `PT-09` | Submit → inserts x_ar_request (state New, assignment group AR team). Automation to be defined |
| `PT-10` | My Requests widget: x_ar_request where opened_by = me (ACL: project team reads own records) |
| `PT-11` | Ticket page: conversation widget (comments only; work notes hidden) |
| `PT-12` | Invoice reference shown to requester (number, issue and due date; payment status hidden) |
| `PT-13` | Ticket fields widget: read-only summary of the request |
| `PT-14` | Service catalog category "AR forms": 16 record producers AR-i … AR-xvi (D9) |
| `PT-15` | Catalog item AR-i New AR request (active record producer) |
| `PT-16` | Catalog item placeholder AR-ii … AR-xvi (inactive until defined) |
| `PT-17` | Variable set Request type: 1st AR request / Ad-hoc AR / Recurring AR (UI policies show sections by type) |
| `PT-18` | Variable set Customer: existing customer reference, or New customer with name, UEN, address (UI policy on new_customer) |
| `PT-19` | Variable set Department & bill-to: shows the department's billing contact (x_ar_billing_contact) or asks for one (D11) |
| `PT-20` | Variable set Contract: contract reference, contract location and link/file reference |
| `PT-21` | Variable set Billing (1st / ad-hoc): billing type, amount, dates, PO |
| `PT-22` | Variable set Recurring billing: frequency, amount per period, first/last billing date (D12) |
| `PT-23` | Variable set Customer documents: on-file check via GlideAjax on x_ar_customer_document; attach only missing ones (D10) |
| `PT-24` | Ticket notice: billing schedule set up for a Recurring AR-i |

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
| `REQ.request_type` | x_ar_request.request_type · Choice · mandatory |
| `REQ.department` | x_ar_request.department · Choice · mandatory |
| `REQ.customer` | x_ar_request.customer · Reference → x_ar_customer · Mandatory unless New customer is ticked |
| `REQ.new_customer` | x_ar_request.new_customer · True/False |
| `REQ.new_customer_name` | x_ar_request.new_customer_name · String · Mandatory when New customer |
| `REQ.new_customer_uen` | x_ar_request.new_customer_uen · String |
| `REQ.new_customer_address` | x_ar_request.new_customer_address · String (1000) |
| `REQ.update_bill_to` | x_ar_request.update_bill_to · True/False |
| `REQ.bill_to_name` | x_ar_request.bill_to_name · String · Mandatory when the department has no billing contact for this customer |
| `REQ.bill_to_email` | x_ar_request.bill_to_email · String |
| `REQ.bill_to_phone` | x_ar_request.bill_to_phone · String |
| `REQ.bill_to_address` | x_ar_request.bill_to_address · String (1000) |
| `REQ.contract` | x_ar_request.contract · Reference → x_ar_contract |
| `REQ.contract_location` | x_ar_request.contract_location · Choice · mandatory |
| `REQ.contract_location_ref` | x_ar_request.contract_location_ref · String · Mandatory for repository link or physical file |
| `REQ.billing_type` | x_ar_request.billing_type · Choice |
| `REQ.short_description` | x_ar_request.short_description · String · mandatory |
| `REQ.amount` | x_ar_request.amount · Currency · mandatory · For Recurring AR: amount per billing period |
| `REQ.requested_invoice_date` | x_ar_request.requested_invoice_date · Date |
| `REQ.period_start` | x_ar_request.period_start · Date |
| `REQ.period_end` | x_ar_request.period_end · Date |
| `REQ.po_number` | x_ar_request.po_number · String |
| `REQ.frequency` | x_ar_request.frequency · Choice · Recurring AR only |
| `REQ.first_billing_date` | x_ar_request.first_billing_date · Date · Recurring AR only |
| `REQ.last_billing_date` | x_ar_request.last_billing_date · Date · Recurring AR; blank = until the contract ends |
| `REQ.doc_contract_po` | x_ar_request.doc_contract_po · Attachment · Only when not already on file for the customer |
| `REQ.doc_acra` | x_ar_request.doc_acra · Attachment · Only when not already on file |
| `REQ.doc_billing_form` | x_ar_request.doc_billing_form · Attachment · Only when not already on file for this department |
| `REQ.description` | x_ar_request.description · String (4000) |
| `REQ.assigned_to` | x_ar_request.assigned_to · Reference → sys_user |
| `REQ.invoice` | x_ar_request.invoice · Reference → x_ar_invoice · read-only |
| `REQ.billing_schedule` | x_ar_request.billing_schedule · Reference → x_ar_billing_schedule · read-only |
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
| `CUS.name` | x_ar_customer.name · String · mandatory |
| `CUS.uen` | x_ar_customer.uen · String |
| `CUS.parent_group` | x_ar_customer.parent_group · String |
| `CUS.registered_address` | x_ar_customer.registered_address · String (1000) |
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
| `CON.customer` | x_ar_contract.customer · Reference → x_ar_customer · mandatory |
| `CON.short_description` | x_ar_contract.short_description · String · mandatory |
| `CON.billing_type` | x_ar_contract.billing_type · Choice |
| `CON.contract_value` | x_ar_contract.contract_value · Currency |
| `CON.start_date` | x_ar_contract.start_date · Date |
| `CON.end_date` | x_ar_contract.end_date · Date |
| `CON.payment_terms` | x_ar_contract.payment_terms · Integer |
| `CON.discount_percent` | x_ar_contract.discount_percent · Decimal |
| `CON.discount_days` | x_ar_contract.discount_days · Integer |
| `CON.contract_location` | x_ar_contract.contract_location · Choice |
| `CON.contract_location_ref` | x_ar_contract.contract_location_ref · String |
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
| `SCH.last_billing_date` | x_ar_billing_schedule.last_billing_date · Date · Blank = until the contract ends |
| `SCH.source_request` | x_ar_billing_schedule.source_request · Reference → x_ar_request · read-only |

## Calculated columns

| ID | ServiceNow |
|---|---|
| `INV.amount_due` | Calculated: amount − matched BSU deposits |
| `INV.payment_status` | Calculated: Unpaid / Part paid / Paid / Overdue |
| `DEP.unmatched_amount` | Calculated: amount − allocations |
| `DEP.match_state` | Calculated: Unmatched / Part matched / Matched |
| `CUS.open_ar` | Calculated: sum of amount_due on issued invoices |
| `CUS.overdue` | Calculated: amount_due on issued invoices past due_date |
| `CON.status` | Calculated: Active / Not started / Ended from start and end dates |
| `BSU.department` | Dot-walk: bank_account.department |
| `SCH.next_billing_date` | Calculated: first period on or after today without an invoice |
| `SCH.periods_due` | Calculated: periods up to today without an invoice |
| `BNK.last_statement` | Calculated: latest x_ar_bsu.statement_date for the account |

## Related lists

| ID | ServiceNow |
|---|---|
| `RL-CUS-BCT` | Related list: x_ar_billing_contact where customer = this customer |
| `RL-CUS-DOC` | Related list: x_ar_customer_document where customer = this customer |
| `RL-CUS-SCH` | Related list: x_ar_billing_schedule where customer = this customer |
| `RL-SCH-INV` | Related list: x_ar_invoice where billing_schedule = this billing schedule |
| `RL-CUS-CON` | Related list: x_ar_contract where customer = this customer |
| `RL-CUS-INV` | Related list: x_ar_invoice where customer = this customer |
| `RL-CUS-REQ` | Related list: x_ar_request where customer = this customer |
| `RL-CON-INV` | Related list: x_ar_invoice where contract = this contract |
| `RL-CON-REQ` | Related list: x_ar_request where contract = this contract |
| `RL-INV-ALC` | Related list: x_ar_allocation where invoice = this invoice |
| `RL-DEP-ALC` | Related list: x_ar_allocation where deposit = this bsu deposit |
| `RL-BSU-DEP` | Related list: x_ar_bank_statement where bsu = this statement upload |
| `RL-BNK-BSU` | Related list: x_ar_bsu where bank_account = this bank account |
| `RL-BNK-DEP` | Related list: x_ar_bank_statement where bank_account = this bank account |

## UI actions

| ID | ServiceNow |
|---|---|
| `UA-REQ-assign` | UI action: Assign to me → assigned_to = current user, state = In progress |
| `UA-REQ-invoice` | UI action: Create invoice → inserts draft x_ar_invoice from request fields, links ar_request |
| `UA-REQ-info` | UI action: Request info → state = Awaiting info; requires an additional comment (visible on portal) |
| `UA-REQ-reject` | UI action: Reject → state = Rejected; requires an additional comment |
| `UA-REQ-link` | UI action: Link to customer → creates or links x_ar_customer, upserts x_ar_billing_contact for the department, files documents to x_ar_customer_document, records contract location (D10, D11) |
| `UA-REQ-schedule` | UI action: Set up billing schedule (Recurring AR-i) → inserts x_ar_billing_schedule; state = Billing scheduled; comment to requester (D12) |
| `UA-SCH-raise` | UI action: Raise invoice → inserts a draft x_ar_invoice for the period (billing_schedule + billing_period set); never automatic (D12) |
| `UA-SCH-save` | UI action: Save (update) |
| `UA-BCT-save` | UI action: Save (update) |
| `UA-BCT-new` | UI action: New (list action) |
| `UA-BCT-insert` | UI action: Submit (insert); unique per customer + department |
| `UA-CUS-newcontact` | UI action: Add billing contact → new billing contact form with customer prefilled |
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

