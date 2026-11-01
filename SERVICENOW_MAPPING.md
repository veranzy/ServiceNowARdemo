# ServiceNow build mapping

Generated from `js/schema.js` by `node tools/mapping.mjs`. Edit the schema, not this file's table sections.
Every screen element in the prototype carries the same references (turn on **Build notes** in the demo bar).

Scope: `x_ar` is a placeholder for the real application scope (for example `x_1234_ar`).
All tables are **custom tables in the scoped app**. No CSM, Contract Management or core_company tables are used.

## Personas and roles

| Persona | Role | Experience | Access |
|---|---|---|---|
| Accounts receivable team | `x_ar.ar_team` | Receivables Workspace (UI Builder, configurable workspace) | Read/write all AR tables; works AR request cases, issues invoices, uploads bank statements (BSU), matches deposits to invoices. |
| Company project team | `x_ar.project_team` | Service Portal / Employee Center | Submit the AR form (record producer) and read/comment on their own AR requests. Read customer and contract reference data only. No workspace access. |

## Tables

### Customer — `x_ar_customer`

Custom customer master (not core_company / customer_account).

| Column | Label | Type | Notes |
|---|---|---|---|
| `name` | Customer name | String | Mandatory |
| `parent_group` | Parent group | String |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `credit_limit` | Credit limit | Currency |  |
| `bank_names` | Names seen on bank statements | String (1000) | Comma-separated. Used to rank invoices in the invoice finder. |
| `notes` | Notes for AR | String (4000) |  |

### Contract — `x_ar_contract`

Custom contract table (not ast_contract). Holds billing terms the AR team invoices against.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Contract number | String | Mandatory |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `short_description` | Title | String | Mandatory |
| `billing_type` | Billing | Choice | Choices: Monthly, Milestone, Annual, Time & materials, Per PO |
| `contract_value` | Contract value | Currency |  |
| `start_date` | Start | Date |  |
| `end_date` | End | Date |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `discount_percent` | Early-settlement discount % | Decimal |  |
| `discount_days` | Discount if paid within (days) | Integer |  |
| `notes` | Notes | String (4000) |  |

### AR request — `x_ar_request` (extends `task`)

Case raised by the project team through the AR form record producer. Extends Task for assignment, SLAs and the activity stream. Number prefix: `ARQ`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `state` | State | Choice | Choices: New (`new`), In progress (`in_progress`), Awaiting info (`awaiting_info`), Invoiced (`invoiced`), Rejected (`rejected`). Read-only on form |
| `opened_by` | Requested by | Reference | → `sys_user`. Read-only on form |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `contract` | Contract | Reference | → `x_ar_contract`, filtered by customer |
| `billing_type` | Billing type | Choice | Choices: Milestone, Monthly fee, Time & materials, Other. Mandatory |
| `short_description` | What should be invoiced | String | Mandatory |
| `amount` | Amount | Currency | Mandatory |
| `requested_invoice_date` | Preferred invoice date | Date |  |
| `period_start` | Service period from | Date |  |
| `period_end` | Service period to | Date |  |
| `po_number` | Customer PO number | String |  |
| `description` | Additional details | String (4000) |  |
| `assigned_to` | Assigned to | Reference | → `sys_user` (users with x_ar.ar_team) |
| `invoice` | Invoice | Reference | → `x_ar_invoice`. Read-only on form |
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
| `department` | Department | Choice | Choices: Finance, Projects – Engineering, Projects – Digital, Projects – Marine. Mandatory |
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

### Bank statements — `x_ar_bank_statement`

Bank statements table: one row per deposit (credit) loaded by BSU from the daily CSV statement. Matched to invoices manually; no auto-matching (D5). Number prefix: `DEP`.

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

Applies part or all of a deposit to an invoice. Always created manually by the AR team from the invoice finder (no auto-matching, D5).

| Column | Label | Type | Notes |
|---|---|---|---|
| `deposit` | Deposit | Reference | → `x_ar_bank_statement` |
| `invoice` | Invoice | Reference | → `x_ar_invoice` |
| `amount` | Amount | Currency |  |
| `state` | State | Choice | Choices: Applied (`accepted`), Removed (`removed`) |
| `exception` | Exception | Choice | Choices: Exact (`none`), Multi-invoice (`multi_invoice`), Short pay (`short_pay`), Overpayment (`over_pay`), Partial (`partial`), Discount taken (`discount`) |
| `reason` | Reason | String (1000) |  |

## Portal (project team)

- **Record producer "AR form"** on `x_ar_request`. Variables: `customer`, `contract`, `billing_type`, `short_description`, `amount`, `requested_invoice_date`, `period_start`, `period_end`, `po_number`, `description`, plus attachments.
  - Producer script: `current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>;`
  - Catalog client script on contract change: show contract value, invoiced to date, requested-not-invoiced and remaining (GlideAjax to a Script Include). Warn when the request exceeds the remaining value.
  - Contract reference qualifier: contracts of the selected customer.
- **My requests**: list widget on `x_ar_request` where `opened_by = me`.
- **Ticket page**: standard ticket conversation (comments only), field summary, attachments; requester can comment. Business rule: requester comment while *Awaiting info* sets state to *In progress*.
- ACLs: `x_ar.project_team` create on `x_ar_request` (via producer), read own records; read `x_ar_customer` and `x_ar_contract` for reference selection; read invoice number/date/due of their own request's invoice. No workspace access.

## Workspace (AR team)

- Configurable workspace **Receivables Workspace** (UI Builder), role `x_ar.ar_team`.
- **Landing page**: single-score cards (new requests, assigned to me, awaiting info, draft invoices, overdue amount, unapplied cash), aging bar chart, new requests list, overdue invoices list.
- **List menu**: AR requests (Open, New unassigned, Assigned to me, Awaiting info, All); Invoices (Drafts, Issued unpaid, Overdue, All); Payments (Unapplied, All); Master data (Customers, Contracts).
- **Record pages** with header highlighted values, form sections, related lists, activity stream on AR requests.
- **BSU (bank statement upload)** custom page: daily checklist of bank accounts for the statement date, upload form (bank account, statement date, CSV), preview of deposits with Deposit IDs, *Save to bank statements*, recent uploads. See `docs/modules/BSU.md`.
- **Cash application** custom page: deposits from the Bank statements table with match state; **manual matching only** through the invoice finder with allocation preview (modal or side panel).

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | `assigned_to` = current user; New → In progress |
| AR request | Create invoice | Insert draft `x_ar_invoice` from request fields (customer, contract, description, amount, invoice date, due = date + terms); link `ar_request`; work note |
| AR request | Request info | Requires an additional comment; state → Awaiting info |
| AR request | Reject | Requires an additional comment; state → Rejected |
| Invoice | Issue invoice | Draft → Issued; BR sets the AR request to Invoiced and posts a requester-visible comment |
| Invoice | Cancel invoice | Only when no allocations; request back to In progress |
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
