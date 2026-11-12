# CCI — Customers, contracts and invoices

**Status:** In prototype (customer and contract detail still being written up)
**Persona(s):** AR team (workspace); the project team only reads this data through the AR forms (D22)
**Demo:** AR team · Workspace → Lists → Customers / Contracts / Invoices → open a record

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md) (numbers carried over from the old MDM
module), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), [CHANGELOG.md](CHANGELOG.md).
Formerly two modules: MDM (customers and contracts) and INV (invoicing).

## Purpose

Customers, contracts and invoices are the billing hierarchy customer › contract (or no-contract
shell) › billing lines › invoices (D15). AR maintains customers and contracts in the workspace; forms
only read them (D22). The contract holds the billing terms that apply to its invoices: contract type,
billing cycle, payment terms, proration, type of billing, late payment interest (LPI), GIRO status and
the bill-to person (D16, D24). The app is the **system of record for invoices** (D2): AR creates them
from AR-i billing lines or billing schedule periods, issues them, and BSU deposits are matched to issued
invoices ([BSU](../BSU/README.md)).

## User stories

- As an AR team member, I want one customer record with its contracts, billing hierarchy, invoices,
  billing contacts and documents, so that I see the whole relationship in one place.
- As an AR team member, I want every contract (or the no-contract shell) to carry its billing terms and
  bill-to person, so that invoices under it are raised consistently.
- As an AR team member, I want to create, issue and cancel invoices with a clear state, so that the app
  is the reliable record of what was billed.
- As an AR team member, I want each invoice's amount due and payment status worked out from matched
  deposits, so that I can chase what is overdue.

## Screens and flow

1. **Customer record** → header (customer name from `core_company`, UEN), **Billing hierarchy** tab
   (`CUS-TREE`: customer › contract / shell › billing lines › invoices or schedule; requests not yet
   linked shown as *Not filed*), then related lists **AR requests**, **Contracts** (type, bill-to, lines,
   billed), **Invoices**, **Billing contacts**, **Customer documents**, **Billing schedules**.
2. **Contract record** → record type (Contract / No-contract shell), contract type (Recurring / Ad-hoc),
   department, bill-to; form sections *Billing terms*, *Late payment interest (LPI)*, *GIRO* (status and
   active AR-ix case, set only by AR-ix actions); related lists **Billing lines**, **Billing schedules**,
   **Invoices**, **AR requests**, tab **GIRO history** (`CON-GIRO`). List menu → Master data →
   *No-contract shells*.
3. **Invoice record** → state Draft / Issued / Cancelled; amount, amount due, payment status (Unpaid /
   Part paid / Paid / Overdue, calculated); allocations related list (`RL-INV-ALC`). UI actions **Issue
   invoice** (Draft → Issued; the AR request becomes Billed when every line is invoiced or scheduled) and
   **Cancel invoice** (overflow menu; only when nothing is allocated; the line opens again).
4. Invoices are created only by *Create invoice* on an AR-i billing line or *Raise invoice* on a billing
   period ([AR-i](../AR-i/README.md)); never automatically (D12).

## ServiceNow mapping (summary)

| Item | Build |
|---|---|
| `x_ar_customer` | Custom table; `company` → `core_company` (display, mandatory, unique; D26), UEN, address, agency type, V@G, V@G sub-BU, POC name / email (replicated from AR-i by Link to customer, D23). |
| `x_ar_contract` | Fields `contract_type` (record type: contract / shell), `contract_category` (contract type: recurring / ad-hoc), `reference_number`, `po_number`, `department`, `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`, `billing_cycle` (+ `_other`), `preferred_invoice_date`, `payment_terms_choice` (+ `payment_terms_other`; `terms` days = 30 unless Others), `proration`, `proration_first`, `proration_last`, `type_of_billing`, `bulk_supporting_docs`, LPI fields (below), `giro_status`, `giro_case` (AR-ix). Shell unique per customer + department (business rule). |
| `x_ar_billing_contact` | Customer + department → the department's usual bill-to person; used to prefill the bill-to on a new contract or shell. Unique per customer + department. |
| `x_ar_customer_document` | Customer documents: type (contract / PO, ACRA, billing form), file (`sys_attachment`), contract (optional), department (billing form), source AR request. |
| `x_ar_invoice` | Number prefix `INV`; `state` draft / issued / cancelled; customer, contract, AR request, billing line, billing schedule + period; `due_date` = invoice date + contract payment terms; `amount_due` and `payment_status` calculated from accepted allocations (business rule on allocation insert / update). Only issued invoices receive deposits. |
| UI actions | Invoice: *Issue invoice*, *Cancel invoice*. Customer: *Add billing contact* (overflow). |

Full column lists: `SERVICENOW_MAPPING.md` (generated from `js/schema.js`).

## Customer and company (core_company)

| ID | Column | Label | Type | Rule |
|---|---|---|---|---|
| `CUS.company` | `company` | Company | Reference → `core_company` | Mandatory. Display field of `x_ar_customer`. Unique: one customer per company (before-insert/update business rule or unique index). |
| `CUS.company.name` | `company.name` | Customer name | Dot-walk (read-only) | Shown on the customer form, lists and every reference to a customer. Not a column on `x_ar_customer`. |
| `REQ-LINKCO` | (UI) | Company (core_company) for the new customer | Choice on *Link to customer* | Mandatory when Link to customer creates a new customer. Lists `core_company` records that have no customer yet, closest name to the requested name first. |

ServiceNow build: reference qualifier on `company` to exclude companies already used by another customer;
lists and the customer search on AR-i search `company.name`. The app only reads `core_company`.

## Late payment interest (LPI) on the contract

| ID | Column | Label | Type | Rule |
|---|---|---|---|---|
| `CON.lpi_applicable` | `lpi_applicable` | LPI applicable | True/False | Default false. |
| `CON.lpi_min_rate` | `lpi_min_rate` | Minimum LPI rate (%) | Decimal | Mandatory when LPI applicable; must not exceed the LPI rate. |
| `CON.lpi_rate` | `lpi_rate` | LPI rate (%) | Decimal | Mandatory when LPI applicable. |

ServiceNow build:
- Three columns on `x_ar_contract`; form section *Late payment interest (LPI)* on the contract record
  page, after the contract terms and before *Bill-to*.
- UI policy: when `lpi_applicable` is true, make both rates mandatory (the prototype keeps them
  visible either way; hiding them when false is an option for the build).
- Data policy or before-update business rule: reject `lpi_min_rate > lpi_rate`.
- Write access: `x_ar.ar_team` (same ACL as the rest of the contract).

The prototype records the terms only. Nothing calculates or charges interest yet.
