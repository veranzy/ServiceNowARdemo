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

## AR request record

| ID | ServiceNow |
|---|---|
| `REQ-ACT` | Activity stream: comments (visible to requester) + work_notes (AR only) + field changes |
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
| `PT-03` | Quick link to catalog item: record producer "AR form" |
| `PT-04` | Quick link to My Requests |
| `PT-05` | Record producer "AR form" on x_ar_request. Producer script: current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; |
| `PT-06` | Variable requested_by → opened_by (default: current user, read-only) |
| `PT-07` | Catalog client script (onChange contract): contract billing position via GlideAjax / Script Include |
| `PT-08` | Variable attachments → sys_attachment on the created x_ar_request |
| `PT-09` | Submit → inserts x_ar_request (state New, assignment group AR team). Automation to be defined |
| `PT-10` | My Requests widget: x_ar_request where opened_by = me (ACL: project team reads own records) |
| `PT-11` | Ticket page: conversation widget (comments only; work notes hidden) |
| `PT-12` | Invoice reference shown to requester (number, issue and due date; payment status hidden) |
| `PT-13` | Ticket fields widget: read-only summary of the request |

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
| `REQ.customer` | x_ar_request.customer · Reference → x_ar_customer · mandatory |
| `REQ.contract` | x_ar_request.contract · Reference → x_ar_contract |
| `REQ.billing_type` | x_ar_request.billing_type · Choice · mandatory |
| `REQ.short_description` | x_ar_request.short_description · String · mandatory |
| `REQ.amount` | x_ar_request.amount · Currency · mandatory |
| `REQ.requested_invoice_date` | x_ar_request.requested_invoice_date · Date |
| `REQ.period_start` | x_ar_request.period_start · Date |
| `REQ.period_end` | x_ar_request.period_end · Date |
| `REQ.po_number` | x_ar_request.po_number · String |
| `REQ.description` | x_ar_request.description · String (4000) |
| `REQ.assigned_to` | x_ar_request.assigned_to · Reference → sys_user |
| `REQ.invoice` | x_ar_request.invoice · Reference → x_ar_invoice · read-only |
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
| `CUS.parent_group` | x_ar_customer.parent_group · String |
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
| `CON.notes` | x_ar_contract.notes · String (4000) |

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
| `BNK.last_statement` | Calculated: latest x_ar_bsu.statement_date for the account |

## Related lists

| ID | ServiceNow |
|---|---|
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

