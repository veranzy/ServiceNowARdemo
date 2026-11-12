# ServiceNow build mapping

Generated from `js/schema.js` by `node tools/mapping.mjs`. Edit the schema, not this file's table sections.
Every screen element in the prototype carries the same references (turn on **Build notes** in the demo bar).

Scope: `x_ar` is a placeholder for the real application scope (for example `x_1234_ar`).
All tables are **custom tables in the scoped app**. No CSM, Contract Management or core_company tables are used.

## Personas and roles

| Persona | Role | Experience | Access |
|---|---|---|---|
| Accounts receivable team | `x_ar.ar_team` | Receivables Workspace (UI Builder, configurable workspace) | Read/write all AR tables; works AR request cases, issues invoices, uploads bank statements (BSU), matches BSU deposits to invoices. |
| Company project team | `x_ar.project_team` | Service Portal / Employee Center | Submit AR forms (record producers AR-i … AR-xvi) and read/comment on their own AR requests. Read customers, contracts, billing contacts and which customer documents are on file. No workspace access. |

## Tables

### Customer — `x_ar_customer`

Custom customer master (not core_company / customer_account). Documents and per-department billing contacts hang off the customer (D10, D11).

| Column | Label | Type | Notes |
|---|---|---|---|
| `name` | Customer name | String | Mandatory |
| `uen` | UEN (company registration no.) | String |  |
| `parent_group` | Parent group | String |  |
| `registered_address` | Registered address | String (1000) |  |
| `agency_type` | Agency type | Choice | Choices: M, SB, PV. Master data replicated from the AR-i that set the customer up (Link to customer, D23) |
| `vag` | V@G | Choice | Choices: Yes (`yes`), No (`no`). Shown when Agency type is SB, PV (UI policy) |
| `vag_sub_bu` | V@G sub-BU | String | Shown when V@G = Yes (UI policy) |
| `poc_name` | POC name | String |  |
| `poc_email` | POC email | String |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `credit_limit` | Credit limit | Currency |  |
| `bank_names` | Names seen on bank statements | String (1000) | Comma-separated. Used to rank invoices in the invoice finder. |
| `notes` | Notes for AR | String (4000) |  |

### Contract — `x_ar_contract`

Custom contract table (not ast_contract). GIRO is a contract status set from the approved AR-ix case (D21). Middle of the billing hierarchy customer › contract › billing lines › invoices (D15). Holds the bill-to person (D16) and billing terms. A no-contract shell (contract_type = shell, one per customer + department) holds billing that has no contract.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Contract number | String | Mandatory |
| `contract_type` | Record type | Choice | Choices: Contract (`contract`), No-contract shell (`shell`). Mandatory. Contract, or the customer's no-contract shell (D15) |
| `contract_category` | Contract type | Choice | Choices: Recurring (`recurring`), Ad-hoc (`ad_hoc`). Recurring or Ad-hoc |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Owning department; a shell is unique per customer + department |
| `reference_number` | Contract reference number | String |  |
| `po_number` | Contract PO number | String |  |
| `short_description` | Title | String | Mandatory |
| `billing_type` | Billing | Choice | Choices: Monthly, Milestone, Annual, Time & materials, Per PO |
| `contract_value` | Contract value | Currency |  |
| `start_date` | Start | Date |  |
| `end_date` | End | Date |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `discount_percent` | Early-settlement discount % | Decimal |  |
| `discount_days` | Discount if paid within (days) | Integer |  |
| `lpi_applicable` | LPI applicable | True/False | Late payment interest is charged on overdue invoices under this contract |
| `lpi_min_rate` | Minimum LPI rate (%) | Decimal | Mandatory when LPI applicable. % per annum; must not exceed the LPI rate |
| `lpi_rate` | LPI rate (%) | Decimal | Mandatory when LPI applicable. % per annum |
| `contract_location` | Where the signed contract is kept | Choice | Choices: Attached to this form (`attached`), Already with AR (`on_file`), Document repository link (`repository`), Physical file (`physical`) |
| `contract_location_ref` | Link or file location | String |  |
| `billing_cycle` | Contract billing cycle | Choice | Choices: 1st of the month (`first`), 15th of the month (`fifteenth`), Others (`others`) |
| `billing_cycle_other` | Suggested billing cycle | String | Shown when Contract billing cycle = Others (UI policy) |
| `preferred_invoice_date` | Preferred invoice billing date | Date |  |
| `payment_terms_choice` | Payment terms | Choice | Choices: 30 days (`30`), Others (`others`). 30 days sets terms (days) = 30 |
| `payment_terms_other` | Other payment terms | String | Shown when Payment terms = Others (UI policy) |
| `proration` | Proration | Choice | Choices: Yes (`yes`), No (`no`). Yes: the first and last period of each recurring billing schedule use the proration amounts |
| `proration_first` | Proration for 1st month | Currency | Shown when Proration = Yes (UI policy) |
| `proration_last` | Proration for last month | Currency | Shown when Proration = Yes (UI policy) |
| `type_of_billing` | Type of billing | Choice | Choices: A, B, C, D, E |
| `bulk_supporting_docs` | Supporting documents (bulk upload) | Attachment | Shown when Type of billing is C, D, E (UI policy) |
| `giro_status` | GIRO status | Choice | Choices: Active (`active`), Not active (`none`). Read-only on form. Set by Activate GIRO / Remove GIRO on an AR-ix case. At most one active GIRO per contract (D21) |
| `giro_case` | Active GIRO case | Reference | → `x_ar_request`. Read-only on form. The approved AR-ix case whose GIRO is active; empty when GIRO is not active |
| `bill_to_name` | Bill-to person | String |  |
| `bill_to_email` | Bill-to email | String |  |
| `bill_to_phone` | Bill-to phone | String |  |
| `bill_to_address` | Billing address | String (1000) |  |
| `notes` | Notes | String (4000) |  |

### AR request — `x_ar_request` (extends `task`)

Case raised by the project team through an AR form record producer (AR-i … AR-xvi). Extends Task for assignment, SLAs and the activity stream. Number prefix: `ARQ`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `state` | State | Choice | Choices: New (`new`), In progress (`in_progress`), Awaiting info (`awaiting_info`), Billed (`invoiced`), Completed (`completed`), Rejected (`rejected`). Read-only on form |
| `opened_by` | Requested by | Reference | → `sys_user`. Read-only on form |
| `ar_form` | AR form | Choice | Choices: AR-i New AR request (`AR-i`), AR-ii To be defined (`AR-ii`), AR-iii To be defined (`AR-iii`), AR-iv To be defined (`AR-iv`), AR-v To be defined (`AR-v`), AR-vi To be defined (`AR-vi`), AR-vii To be defined (`AR-vii`), AR-viii To be defined (`AR-viii`), AR-ix GIRO authorisation (`AR-ix`), AR-x To be defined (`AR-x`), AR-xi To be defined (`AR-xi`), AR-xii To be defined (`AR-xii`), AR-xiii To be defined (`AR-xiii`), AR-xiv To be defined (`AR-xiv`), AR-xv To be defined (`AR-xv`), AR-xvi To be defined (`AR-xvi`). Read-only on form |
| `requester_name` | Requester name | String | General information (all AR forms). Mandatory on the form; defaults to the signed-in user's name. Default: gs.getUser().getFullName() |
| `requester_email` | Email | String | Read-only on form. General information (all AR forms). From ServiceNow SSO (sys_user.email); always read-only. Default: gs.getUser().getEmail() |
| `department_sub_bu` | Sub-BU | Choice | Choices: Civil & Structural (`ENG-1`), M&E Services (`ENG-2`), Geotechnical (`ENG-3`), Port Works (`MAR-1`), Offshore (`MAR-2`), Dredging (`MAR-3`), Data & AI (`DIG-1`), Platforms (`DIG-2`), Cyber (`DIG-3`), Roads (`INF-1`), Water (`INF-2`), Urban Systems (`INF-3`), Power Grid (`ENE-1`), Solar (`ENE-2`), Gas (`ENE-3`), Property Management (`FAC-1`), Carparks (`FAC-2`), Retail Leasing (`FAC-3`), Warehousing (`LOG-1`), Cold Chain (`LOG-2`), Freight (`LOG-3`), Hospitals (`HEA-1`), Clinics (`HEA-2`), Med Tech (`HEA-3`), Waste (`ENV-1`), Air & Noise (`ENV-2`), Ecology (`ENV-3`), Signalling (`RAI-1`), Rolling Stock (`RAI-2`), Track Works (`RAI-3`), Strategy (`ADV-1`), Transactions (`ADV-2`), Risk (`ADV-3`). General information (all AR forms). Sub-BUs of the chosen department (mock list) |
| `cc_list` | CC list | String (1000) | General information (all AR forms). Emails separated by commas; these people can view the case on the portal (Watch list) |
| `department` | Requesting department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory. Tooltip: "Auto-populated from the requester's department. Change it only if you are requesting for another department.". Default: Requester's department (sys_user.department via the variable's default value) |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory unless New customer is ticked |
| `new_customer` | New customer | True/False |  |
| `new_customer_name` | New customer name | String | Mandatory when New customer |
| `new_customer_uen` | UEN (company registration no.) | String |  |
| `new_customer_address` | Registered address | String (1000) |  |
| `contract_option` | Contract | Choice | Choices: Existing contract (`existing`), New contract (`new`), No contract required (`none`). Mandatory. Billing is contract level: every billing line sits under a contract, or under the customer's no-contract shell (D15) |
| `contract` | Contract | Reference | → `x_ar_contract`, filtered by customer. Existing contract; for a new contract or No contract required, set by Link to customer |
| `new_contract_type` | Contract type | Choice | Choices: Recurring (`recurring`), Ad-hoc (`ad_hoc`). Mandatory for a new contract |
| `new_contract_number` | Contract number | String | Mandatory for a new contract |
| `new_contract_ref` | Contract reference number | String | Optional for a new contract (AR-ix: the reference to link) |
| `new_contract_po` | Contract PO number | String | Optional |
| `new_contract_title` | Contract title | String | Mandatory for a new contract |
| `new_contract_start` | Contract start date | Date | Mandatory for a new contract |
| `new_contract_end` | Contract end date | Date |  |
| `new_contract_value` | Contract value (SGD) | Currency | Mandatory for a new contract |
| `new_contract_billing_cycle` | Contract billing cycle | Choice | Choices: 1st of the month (`first`), 15th of the month (`fifteenth`), Others (`others`). Optional |
| `new_contract_billing_cycle_other` | Suggested billing cycle | String | Shown when Contract billing cycle = Others (UI policy). Mandatory when the billing cycle is Others |
| `new_contract_invoice_date` | Preferred invoice billing date | Date | Optional |
| `new_contract_payment_terms` | Payment terms | Choice | Choices: 30 days (`30`), Others (`others`). Default 30 days |
| `new_contract_payment_terms_other` | Other payment terms | String | Shown when Payment terms = Others (UI policy). Mandatory when payment terms is Others |
| `new_contract_proration` | Proration | Choice | Choices: Yes (`yes`), No (`no`). Default No |
| `new_contract_proration_first` | Proration for 1st month | Currency | Shown when Proration = Yes (UI policy). Mandatory when proration is Yes |
| `new_contract_proration_last` | Proration for last month | Currency | Shown when Proration = Yes (UI policy). Mandatory when proration is Yes |
| `bill_to_name` | Bill-to person | String | Mandatory when the contract (or shell) has no bill-to person yet; Link to customer writes it to the contract |
| `bill_to_email` | Bill-to email | String |  |
| `bill_to_phone` | Bill-to phone | String |  |
| `bill_to_address` | Billing address | String (1000) |  |
| `contract_location` | Where is the signed contract kept? | Choice | Choices: Attached to this form (`attached`), Already with AR (`on_file`), Document repository link (`repository`), Physical file (`physical`). Mandatory for a new contract, or an existing one with no location recorded |
| `contract_location_ref` | Link or file location | String | Mandatory for repository link or physical file |
| `short_description` | Invoice description | String | Mandatory. What the invoice is for; becomes the case's short description and the billing line's description |
| `attention_name` | Attention to name | String | Optional. Prefilled from the contract's bill-to person |
| `attention_email` | Attention to email | String | Optional; must be a valid email. Prefilled from the contract's bill-to email |
| `amount_per_period` | Amount billed per period | Currency | Mandatory. Before GST. Recurring contract: billed every period; ad-hoc or no contract: one invoice of this amount |
| `preferred_invoice_date` | Preferred invoice date | Date | Recurring contract: mandatory, the first invoice; invoices then follow monthly until the contract end date |
| `billing_line_items_required` | Require billing line item? | Choice | Choices: Yes (`yes`), No (`no`). Yes shows the billing line items table (multi-row variable set) |
| `amount` | Request value | Currency | Read-only on form. Calculated: one-off lines + recurring amount × number of periods |
| `po_number` | Customer PO number | String |  |
| `customer_poc_name` | POC name | String | AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in and replicated to the customer by Link to customer |
| `customer_poc_email` | POC email | String | AR-i customer details; must be a valid email. Same rule as POC name |
| `cost_center` | Cost center | String | Optional, free text. To be filled by GA. Tooltip: "To be filled by GA" |
| `account_code` | Account code | String | Optional, free text |
| `agent_name` | Name of agent to be billed | String | Optional, free text |
| `agency_type` | Agency type | Choice | Choices: M, SB, PV. AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master |
| `vag` | V@G | Choice | Choices: Yes (`yes`), No (`no`). Shown when Agency type is SB, PV (UI policy). AR-i customer details, optional. Found customer: read-only from the customer master |
| `sub_bu` | V@G sub-BU | String | Shown when V@G = Yes (UI policy). Optional, free text |
| `type_of_billing` | Type of billing | Choice | Choices: A, B, C, D, E. Contract level: entered for a new contract (copied to the contract by Link to customer); read-only copy of the contract's value for an existing one |
| `bulk_supporting_docs` | Supporting documents (bulk upload) | Attachment | Shown when Type of billing is C, D, E (UI policy). Optional; several files at once |
| `invoice_breakdown` | Invoice breakdown | String (4000) | Optional, free text: how the invoice should be broken down |
| `giro_on_contract` | GIRO on this contract | Choice | Choices: Yes (`yes`), No (`no`). Read-only on form. Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21). Tooltip: "GIRO is set by an AR-ix (GIRO authorisation). Raise an AR-ix if this contract needs GIRO." |
| `giro_applicant_name` | Applicant name / entity | String | AR-ix. Mandatory on the form; prefilled from the contract's bill-to |
| `giro_applicant_email` | Applicant email | String | AR-ix. Mandatory on the form; prefilled from the contract's bill-to |
| `giro_applicant_mobile` | Applicant mobile | String | AR-ix. Prefilled from the contract's bill-to phone |
| `giro_invoice_ref` | Invoice reference number | String | AR-ix. Optional; requirement to be confirmed |
| `giro_purpose` | Purpose | Choice | Choices: Rental (`rental`), Carpark (`carpark`), Others (`others`). AR-ix. Mandatory on the form |
| `giro_purpose_other` | Other purpose | String | Shown when Purpose = Others (UI policy). AR-ix. Mandatory when Purpose = Others |
| `giro_type` | Type | Choice | Choices: Add GIRO (`add`), Remove GIRO (`remove`). AR-ix. Mandatory on the form |
| `giro_start_date` | Effective start date | Date | Shown when Purpose = Rental (UI policy). AR-ix rental. Mandatory for Add GIRO |
| `giro_end_date` | Effective end date | Date | Shown when Purpose = Rental (UI policy). AR-ix rental. Optional; on or after the start date |
| `giro_location` | Location | String | Shown when Purpose = Rental (UI policy). AR-ix rental. Mandatory |
| `giro_carplate` | Car plate | String | Shown when Purpose = Carpark (UI policy). AR-ix carpark. Mandatory; one vehicle per form |
| `giro_parking_start` | Parking start date | Date | Shown when Purpose = Carpark (UI policy). AR-ix carpark. Mandatory for Add GIRO |
| `giro_parking_end` | Parking end date | Date | Shown when Purpose = Carpark (UI policy). AR-ix carpark. Optional; on or after the start date |
| `giro_amount` | Amount | Currency | AR-ix, all purposes. Mandatory for Add GIRO |
| `doc_contract_po` | Signed contract / PO | Attachment | Only when not already on file for the customer |
| `doc_acra` | Company registration (ACRA / UEN) | Attachment | Only when not already on file |
| `doc_billing_form` | Billing contact & address form | Attachment | Only when not already on file for this department |
| `description` | Additional details | String (4000) |  |
| `assigned_to` | Assigned to | Reference | → `sys_user` (users with x_ar.ar_team) |
| `opened_at` | Opened | Date | Read-only on form |
| `comments` / `work_notes` | Additional comments / Work notes | Journal (inherited from task) | Comments visible on portal; work notes AR team only |

### Invoice — `x_ar_invoice`

System of record for customer invoices. Created by the AR team from an AR request, then issued. Number prefix: `INV`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `state` | State | Choice | Choices: Draft (`draft`), Issued (`issued`), Cancelled (`cancelled`). Read-only on form |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `contract` | Contract | Reference | → `x_ar_contract`, filtered by customer |
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `request_line` | Billing line | Reference | → `x_ar_request_line`. Read-only on form |
| `billing_schedule` | Billing schedule | Reference | → `x_ar_billing_schedule`. Read-only on form |
| `billing_period` | Billing period | Date | Read-only on form |
| `short_description` | Description | String | Mandatory |
| `amount` | Amount | Currency | Mandatory |
| `invoice_date` | Invoice date | Date |  |
| `due_date` | Due date | Date | Defaults to invoice date + contract payment terms |
| `amount_due` | Amount due | Currency | Calculated: amount − accepted allocations (business rule on allocation insert/update) |
| `payment_status` | Payment status | Choice | Calculated: Unpaid / Part paid / Paid, set with amount_due |

### Bank account — `x_ar_bank_account`

Company bank accounts that statements are uploaded for. Department and account type classify every deposit on the account.

| Column | Label | Type | Notes |
|---|---|---|---|
| `bank` | Bank | Choice | Choices: Marina Bank (`MB`), Orchard Bank (`OB`), Union Straits Bank (`US`). Mandatory. Mock aliases for Singapore's three largest banks; each has its own CSV layout |
| `account_number` | Account number | String | Mandatory |
| `account_name` | Account name | String | Mandatory |
| `department` | Department | Choice | Choices: Finance, Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory |
| `account_type` | Account type | Choice | Choices: Revenue account (`revenue`), Deposit account (`deposit`), Operating account (`operating`). Mandatory |
| `currency` | Currency | String | Read-only on form |

### Statement upload — `x_ar_bsu`

Bank statement upload (BSU): one record per bank account per statement day. The CSV is kept as an attachment. Number prefix: `BSU`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `bank_account` | Bank account | Reference | → `x_ar_bank_account`. Read-only on form |
| `statement_date` | Statement date | Date | Read-only on form |
| `file_name` | File | String | Read-only on form |
| `uploaded_by` | Uploaded by | Reference | → `sys_user`. Read-only on form |
| `uploaded_at` | Uploaded | String | Read-only on form |
| `deposit_count` | Deposits | Integer | Read-only on form |
| `deposit_total` | Deposit total | Currency | Read-only on form |
| `withdrawals_skipped` | Withdrawals skipped | Integer | Read-only on form |

### Bank statements (BSU deposits) — `x_ar_bank_statement`

The only record of money received (D7): one row per deposit (credit) loaded by BSU from the daily CSV statement. There is no separate payments table. Matched to invoices manually; no auto-matching (D5). Number prefix: `DEP`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `deposit_id` | Deposit ID | String | Read-only on form. Set by before-insert business rule |
| `bank_account` | Bank account | Reference | → `x_ar_bank_account`. Read-only on form |
| `bsu` | Statement upload | Reference | → `x_ar_bsu`. Read-only on form |
| `value_date` | Value date | Date | Read-only on form |
| `amount` | Amount | Currency | Read-only on form |
| `payer_name` | Payer (as on statement) | String | Read-only on form |
| `bank_reference` | Reference / remittance | String | Read-only on form |
| `bank_transaction_ref` | Bank transaction ref | String | Read-only on form |
| `match_state` | Match state | Choice | Calculated: Unmatched / Part matched / Matched, from accepted allocations |
| `unmatched_amount` | Unmatched amount | Currency | Calculated: amount − accepted allocations |

### Allocation — `x_ar_allocation`

Applies part or all of a BSU deposit to an invoice. Always created manually by the AR team from the invoice finder (no auto-matching, D5).

| Column | Label | Type | Notes |
|---|---|---|---|
| `deposit` | BSU deposit | Reference | → `x_ar_bank_statement` |
| `invoice` | Invoice | Reference | → `x_ar_invoice` |
| `amount` | Amount | Currency |  |
| `state` | State | Choice | Choices: Applied (`accepted`), Removed (`removed`) |
| `exception` | Exception | Choice | Choices: Exact (`none`), Multi-invoice (`multi_invoice`), Short pay (`short_pay`), Overpayment (`over_pay`), Partial (`partial`), Discount taken (`discount`) |
| `reason` | Reason | String (1000) |  |

## Portal (project team)

- **Record producer "AR-i New AR request"** on `x_ar_request`. Variables: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`, `customer`, `new_customer`, `new_customer_name`, `new_customer_uen`, `new_customer_address`, `contract_option`, `contract`, `new_contract_type`, `new_contract_number`, `new_contract_ref`, `new_contract_po`, `new_contract_title`, `new_contract_start`, `new_contract_end`, `new_contract_value`, `new_contract_billing_cycle`, `new_contract_billing_cycle_other`, `new_contract_invoice_date`, `new_contract_payment_terms`, `new_contract_payment_terms_other`, `new_contract_proration`, `new_contract_proration_first`, `new_contract_proration_last`, `contract_location`, `contract_location_ref`, `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`, `short_description`, `attention_name`, `attention_email`, `amount_per_period`, `preferred_invoice_date`, `billing_line_items_required`, `po_number`, `customer_poc_name`, `customer_poc_email`, `invoice_breakdown`, `cost_center`, `account_code`, `agent_name`, `agency_type`, `vag`, `sub_bu`, `type_of_billing`, `bulk_supporting_docs`, `giro_on_contract`, `doc_contract_po`, `doc_acra`, `doc_billing_form`, `description`, plus attachments.
  - Producer script: `current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; creates one x_ar_request_line from the invoice details (recurring when the contract type is Recurring, else one-off, D13 as amended); copies the billing line items multi-row variable set to x_ar_request_item`
  - Catalog client script on contract change: show contract value, invoiced to date, requested-not-invoiced and remaining (GlideAjax to a Script Include). Warn when the request exceeds the remaining value.
  - Contract reference qualifier: contracts of the selected customer.
- **Variable set "General information"** (D19), first section of every AR form: `requester_name` (default: current user's name), `requester_email` (from SSO, read-only), `department`, `cc_list` (emails; the producer script adds them to the case `watch_list` so they can view it on the portal).
- **Record producer "AR-ix GIRO authorisation"** on `x_ar_request` (GIR module). Variables: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`, `customer`, `new_customer`, `new_customer_name`, `contract_option`, `contract`, `new_contract_ref`, `giro_applicant_name`, `giro_applicant_email`, `giro_applicant_mobile`, `giro_invoice_ref`, `giro_purpose`, `giro_purpose_other`, `giro_type`, `giro_start_date`, `giro_end_date`, `giro_location`, `giro_carplate`, `giro_parking_start`, `giro_parking_end`, `giro_amount`, `description`, plus attachments.
  - Producer script: `current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>;`
  - Catalog client script on contract change: prefill applicant name / email / mobile from the contract's bill-to; show active GIRO on the contract.
  - UI policies: Other purpose when Purpose = Others; location and effective start/end for Rental; car plate and parking start/end for Carpark; amount and start date mandatory for Add GIRO.
- **My requests**: list widget on `x_ar_request` where `opened_by = me` **or the user's email is on the CC list** (`watch_list` contains me); CC'd cases are marked *CC*.
- **Ticket page**: standard ticket conversation (comments only), field summary, attachments; requester can comment. Business rule: requester comment while *Awaiting info* sets state to *In progress*.
- ACLs: `x_ar.project_team` create on `x_ar_request` (via producer), read own records; read `x_ar_customer` and `x_ar_contract` for reference selection; read invoice number/date/due of their own request's invoice. No workspace access.

## Workspace (AR team)

- Configurable workspace **Receivables Workspace** (UI Builder), role `x_ar.ar_team`.
- Layout follows the **Horizon Design System** workspace templates (see `docs/modules/UIX.md`): unified navigation header, app navigation on the left, workspace tabs (primary tab + closable record tabs).
- **Landing page**: greeting header and a grid of single-score cards (new requests, assigned to me, awaiting info, customer setup pending, billing periods due, draft invoices, overdue amount, BSU deposits to match, statements uploaded for yesterday), aging bar chart, new requests list, overdue invoices list.
- **List page** (Horizon list page template): **list menu** on the left, list on the right. Menu: AR requests (Open, New unassigned, Customer setup pending, Assigned to me, Awaiting info, All); Recurring billing (Billing periods due, Active schedules, All); Invoices (Drafts, Issued unpaid, Overdue, All); Bank statements (Statement uploads, BSU deposits to match, All BSU deposits, Bank accounts); Master data (Customers, Contracts, No-contract shells, Billing contacts, Customer documents).
- **Record pages** (Horizon Record page template): header (record name, description, label-value pairs, form record presence, **UI action bar** with overflow menu) › **ribbon** of metric widgets (collapsible) › **resizable pane** with record tabs (Details first, then related items, then one tab per related list; extra tabs in a More menu) and the **contextual side bar** (vertical icon tabs). AR request side bar: Customer setup, Activity stream, Attachments (side bar tools for other records: open, GitHub issue #1). Last tab on every record: **Record history** (sys_audit; turn Audit on for every `x_ar_` table). Theme: the default workspace theme.
- **BSU (bank statement upload)** custom page: daily checklist of bank accounts for the statement date, upload form (bank account, statement date, CSV), preview of deposits with Deposit IDs, *Save to bank statements*, recent uploads. See `docs/modules/BSU.md`.
- **Cash application** custom page: deposits from the Bank statements table with match state; **manual matching only** through the invoice finder with allocation preview (modal or side panel).

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | `assigned_to` = current user; New → In progress |
| AR request | Link to customer | Creates or links `x_ar_customer`; links / creates the contract or no-contract shell and sets it on every billing line; writes the bill-to to the contract; files documents; records contract location (D10, D15, D16) |
| AR request | Request info (overflow menu) | Requires an additional comment; state → Awaiting info |
| AR request | Reject (overflow menu) | Requires an additional comment; state → Rejected |
| Billing line | Create invoice | One-off line: insert draft `x_ar_invoice` (customer, line's contract, description, amount, invoice date, due = date + terms); links `request_line` |
| Billing line | Set up billing schedule | Recurring line: insert `x_ar_billing_schedule` over the line's date range; comment to requester (D12) |
| Billing schedule | Raise invoice | Draft invoice for one billing period; never automatic (D12) |
| AR request (AR-ix) | Link contract | Shown while `contract` is empty: sets contract and customer from the chosen contract. For a contract not on file, AR processes its AR-i first (GIR module) |
| AR request (AR-ix) | Activate GIRO | Type Add: contract `giro_status` = Active and `giro_case` = this case; case → Completed. Blocked if the contract already has GIRO active (one per contract, D21) |
| AR request (AR-ix) | Remove GIRO | Type Remove: contract `giro_status` = Not active, `giro_case` cleared; case → Completed. Blocked if GIRO is not active |
| Invoice | Issue invoice | Draft → Issued; posts a requester-visible comment; BR sets the AR request to Billed when every line is invoiced or scheduled |
| Invoice | Cancel invoice (overflow menu) | Only when no allocations; the line becomes open again and the request goes back to In progress |
| Deposit | Match to invoice / Find invoice → Apply | Inserts `x_ar_allocation` records (manual); exception = short pay / over pay / multi-invoice |
| Deposit | Remove match | Removes the deposit's allocations |
| BSU page | Save to bank statements | Inserts `x_ar_bsu` + one `x_ar_bank_statement` row per deposit; withdrawals skipped |
| Bank account | Upload statement | Opens the BSU page for that account |

### Matching (manual only)

There is **no auto-matching** (decision D5). The invoice finder ranks issued invoices for a deposit by
invoice number in the bank reference, amount fit and payer-name similarity (customer name, parent group,
bank-statement names), purely as a suggestion. The AR team always chooses and applies the allocation.
Only **issued** invoices receive deposits.

## Bank statement upload (BSU)

- One upload per bank account per statement day (previous day), CSV only, deposits (credits) only.
- Deposit ID: `DEP-<bank code><last 4 of account>-<YYMMDD>-<NNN>` (before-insert business rule).
- Parsing: Script Include `x_ar.BankStatementParser` with one column template per bank (or one Data Source + Transform Map per bank).

| Bank (mock alias) | Code | Date format | Header columns |
|---|---|---|---|
| Marina Bank | MB | `D MMM YYYY` | Transaction Date, Value Date, Transaction Description 1, Transaction Description 2, Debit Amount, Credit Amount, Client Reference |
| Orchard Bank | OB | `DD/MM/YYYY` | Transaction date, Value date, Description, Remarks, Withdrawals (SGD), Deposits (SGD) |
| Union Straits Bank | US | `YYYY-MM-DD` | Date, Description, Reference, Deposit, Withdrawal, Ledger Balance |

## Automation

To be defined by the owner (placeholder). Candidates seen in the prototype:
- On AR request insert: assignment to AR team group, notification to the group.
- On state change: notifications to the requester (Awaiting info, Invoiced, Rejected).
- Reminder if a bank account has no upload for yesterday by a cut-off time (optional; controls kept out for now).

## Open questions

1. Should the project team see payment status of their invoices on the portal (currently only number, issue date and due date)?
2. Approval step before *Issue invoice* (e.g. AR manager above a threshold)?
3. Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format?
4. Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in?
5. Multi-currency: SGD only, or currency per contract?
6. BSU: who may upload statements, and can a wrong upload be deleted and redone? (see docs/modules/BSU.md)
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
