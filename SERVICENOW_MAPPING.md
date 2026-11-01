# ServiceNow build mapping

Generated from `js/schema.js` by `node tools/mapping.mjs`. Edit the schema, not this file's table sections.
Every screen element in the prototype carries the same references (turn on **Build notes** in the demo bar).

Scope: `x_ar` is a placeholder for the real application scope (for example `x_1234_ar`).
All tables are **custom tables in the scoped app**. No CSM, Contract Management or core_company tables are used.

## Personas and roles

| Persona | Role | Experience | Access |
|---|---|---|---|
| Accounts receivable team | `x_ar.ar_team` | Receivables Workspace (UI Builder, configurable workspace) | Read/write all AR tables; works AR request cases, issues invoices, applies payments. |
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
| `bank_names` | Names seen on bank statements | String (1000) | Comma-separated. Used by auto-match. |
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

### Payment — `x_ar_payment`

Incoming customer payment from the bank statement. Bank statement loading is a later requirement; today via CSV import. Number prefix: `PAY`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `payer_name` | Payer (as on statement) | String | Read-only on form |
| `received_date` | Received | Date | Read-only on form |
| `amount` | Amount | Currency | Read-only on form |
| `bank_reference` | Bank reference / remittance | String | Read-only on form |
| `match_state` | Match state | Choice | Calculated: Unmatched / Proposed / Applied, from allocations |
| `unapplied_amount` | Unapplied amount | Currency | Calculated: amount − accepted allocations |

### Allocation — `x_ar_allocation`

Applies part or all of a payment to an invoice. Proposed by auto-match or created manually from the invoice finder.

| Column | Label | Type | Notes |
|---|---|---|---|
| `payment` | Payment | Reference | → `x_ar_payment` |
| `invoice` | Invoice | Reference | → `x_ar_invoice` |
| `amount` | Amount | Currency |  |
| `state` | State | Choice | Choices: Proposed (`proposed`), Accepted (`accepted`), Rejected (`rejected`) |
| `method` | Method | Choice | Choices: Auto (`rule`), Manual (`manual`) |
| `confidence` | Confidence | Decimal |  |
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
- **Cash application** custom page: auto-match proposals, accept/reject, invoice finder with allocation preview (modal or side panel), payments CSV import as an interim for bank statement loading.

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | `assigned_to` = current user; New → In progress |
| AR request | Create invoice | Insert draft `x_ar_invoice` from request fields (customer, contract, description, amount, invoice date, due = date + terms); link `ar_request`; work note |
| AR request | Request info | Requires an additional comment; state → Awaiting info |
| AR request | Reject | Requires an additional comment; state → Rejected |
| Invoice | Issue invoice | Draft → Issued; BR sets the AR request to Invoiced and posts a requester-visible comment |
| Invoice | Cancel invoice | Only when no accepted allocations; removes pending proposals; request back to In progress |
| Payment | Accept / Reject proposal | Allocation state → Accepted / Rejected |
| Payment | Find invoice → Apply | Creates accepted allocations; exception = short pay / over pay / multi-invoice |
| Cash application | Run auto-match | Script Include `x_ar.AutoMatch` (rules below), or a scheduled flow after bank statement load |

### Auto-match rules (current prototype)

1. Reference contains invoice number(s) (tolerates letter O for zero, missing prefix) and amount equals their combined open balance → proposed, confidence 0.99.
2. No usable reference, and exactly one issued invoice for a customer whose name, parent group or bank-statement names match the payer has exactly that open amount → proposed, confidence 0.90.
3. Otherwise unmatched; AR uses the invoice finder (ranked by reference, amount fit and name similarity).

Only **issued** invoices receive payments.

## Automation

To be defined by the owner (placeholder). Candidates seen in the prototype:
- On AR request insert: assignment to AR team group, notification to the group.
- On state change: notifications to the requester (Awaiting info, Invoiced, Rejected).
- On bank statement load: run auto-match.

## Open questions

1. Should the project team see payment status of their invoices on the portal (currently only number, issue date and due date)?
2. Approval step before *Issue invoice* (e.g. AR manager above a threshold)?
3. Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format?
4. Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in?
5. Multi-currency: SGD only, or currency per contract?
6. Bank statement load: file format (MT940, CAMT.053, CSV) and frequency.
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
