# CCI — Customers, contracts and invoices

**Status:** In prototype (customer and contract detail still being written up)
**Persona(s):** AR team (workspace); the project team only reads this data through the AR forms (D22)
**Demo:** AR team · Workspace → Lists → Customers / Contracts / Invoices → open a record

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md) (numbers carried over from the old MDM
module), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), [CHANGELOG.md](CHANGELOG.md).
Formerly two modules: MDM (customers and contracts) and INV (invoicing).

## Purpose

Billing runs customer › contract (Contract category Contract or No contract) › billing lines ›
invoices (D15). AR maintains customers and contracts in the workspace; forms
only read them (D22). The contract holds the billing terms that apply to its invoices: contract type,
billing cycle, payment terms, proration, type of billing, late payment interest (LPI), GIRO status and
the bill-to person (D16, D24). The app is the **system of record for invoices** (D2): the 1st invoice of an AR-i
comes from Closed complete, later recurring invoices from the daily job on the contract's billing schedule;
AR issues them, and BSU deposits are matched to issued
invoices ([BSU](../BSU/README.md)).

## User stories

- As an AR team member, I want one customer record with its contracts, invoices,
  billing contacts and documents, so that I see the whole relationship in one place.
- As an AR team member, I want every contract (Contract or No contract) to carry its billing terms and
  bill-to person, so that invoices under it are raised consistently.
- As an AR team member, I want to create, issue and cancel invoices with a clear state, so that the app
  is the reliable record of what was billed.
- As an AR team member, I want each invoice's amount due and payment status worked out from matched
  deposits, so that I can chase what is overdue.

## Screens and flow

1. **Customer record** → header (customer name from `core_company`, UEN), tabs **AR requests**,
   **Contracts**, **Invoices**, **Billing contacts**, **Customer documents**, all shown (decision 4; Billing
   hierarchy removed, issue #6).
2. **Contract record** → **Contract ID**, **Contract category** (Contract / No contract), contract type
   (Recurring / Ad-hoc), department, bill-to; form sections *Billing terms*, *Late payment interest (LPI)*,
   *GIRO* (status and active AR-ix case, updated by AR by hand from the AR-ix case); all tabs shown: **Billing
   lines**, **GIRO history** (`CON-GIRO`), **Billing schedules**, **Invoices**, **AR requests**. Action
   **New billing schedule**. List menu → Master data → filter *No contract* (decisions 5, 8).
3. **Invoice record** → state Draft / Issued / Cancelled; amount, amount due, payment status (Unpaid /
   Part paid / Paid / Overdue, calculated); allocations related list (`RL-INV-ALC`). UI actions **Issue
   invoice** (Draft → Issued; AR closes the AR request by hand, AR-00 decision 4) and
   **Cancel invoice** (overflow menu; only when nothing is allocated; the line opens again).
4. Invoices are created by **Closed complete** on an AR-i (the 1st invoice, decision 8) and by the **daily
   invoice check** on a billing schedule (2nd invoice onwards, D12 amended, decision 7), always as drafts.
   *Issue invoice* needs the **Approval date** (decision 9).

## ServiceNow mapping (summary)

| Item | Build |
|---|---|
| `x_ar_customer` | Custom table; `company` → `core_company` (display, mandatory, unique; D26), UEN, address, agency type, V@G, V@G sub-BU, POC name / email (replicated from AR-i by Link to customer, D23). |
| `x_ar_contract` | Fields `contract_type` (record type: contract / shell), `contract_category` (contract type: recurring / ad-hoc), `reference_number`, `po_number`, `department`, `contract_owners` (**Contract owner**, List → `sys_user`, project team users, several; decision 10), `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`, `billing_cycle` (+ `_other`), `preferred_invoice_date`, `payment_terms_choice` (+ `payment_terms_other`; `terms` days = 30 unless Others), `proration`, `proration_first`, `proration_last`, `type_of_billing`, `bulk_supporting_docs`, LPI fields (below), `giro_status`, `giro_case` (AR-ix). Shell unique per customer + department (business rule). |
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

## Customer, contract and billing schedule records (decisions 4–7)

- **Customer record:** tabs Details, AR requests, Contracts, Invoices, Billing contacts, Customer documents, Record history, all shown (no More menu). No Billing hierarchy (removed, [issue #6](https://github.com/veranzy/ServiceNowARdemo/issues/6)); billing schedules are not listed on the customer.
- **Contract record:** all tabs shown: Details, Billing lines, GIRO history, Billing schedules, Invoices, AR requests, Record history. Top of the form:
  - **Contract ID** (`contract_id`, String, read-only, auto-number CTR0001001 …, on every record).
  - **Contract category** (`contract_type`, Choice, mandatory): `contract` Contract / `shell` No contract. A customer can have several No contract records (D15 amended); a No contract record needs a department.
  - Contract type (`contract_category`: Recurring / Ad-hoc), **Contract number** (`number`: mandatory for Contract; for No contract optional, shows the Contract ID when empty).
  - Contracts list: columns Contract ID, Number, Contract category, Title, Customer, Department, Bill-to, Value, Lines, Status; filter *No contract*.
- **Billing schedule** (`x_ar_billing_schedule`): **Contract** mandatory; Customer read-only, set from the contract (before-insert/update business rule). Billing periods list has no action column.
- **Daily invoice check** (scheduled job `JOB-DAILYINV`, daily): for each schedule period with no live invoice whose invoice date is 5 working days (Mon–Fri) away or less, insert a draft `x_ar_invoice` (schedule, period, contract, customer, AR request, request line) and add a work note on the AR-i case. AR issues drafts with *Issue invoice*. The demo shows the result as mock data only (no button).
- Forecast logic, public holidays and invoice PDF: open questions 11–13.

## 1st invoice, approval date and billing schedule (decisions 8–9)

1. AR-i case set to **Closed complete** (State dropdown + Save) → a business rule inserts the **1st invoice** as a **draft** for each billing line without one (one-off: its only invoice; recurring: the first period), linked to the case, line, contract and customer, with a work note. Closing is blocked with *Link to customer before Closed complete: the 1st invoice needs the customer and contract.* until both are linked.
2. The 1st invoice is **always reviewed by hand**. Its **Invoice date** is suggested from the AR-i's indicated start (recurring: line start; one-off: preferred invoice date; else today) and kept even if earlier than today. AR sets the separate **Approval date** (`approval_date`, manual; may be earlier or later than the invoice date).
3. *Issue invoice* is blocked on **every** invoice until the Approval date is set (*Set the Approval date before issuing.*). The button saves the form first.
4. Recurring AR-i: AR opens the contract → **New billing schedule** (`UA-CON-newschedule`): contract, customer, department, Monthly and last billing date (contract end) prefilled; **first billing date** defaults to the next cycle day of the contract **billing cycle** (1st or 15th of the month) and is the **2nd invoice's** date. On a 1st / 15th contract the first billing date must be on that day; for *Others* AR picks it. AR picks the AR-i case in **From AR request** (`source_request`; qualifier: AR-i cases with a recurring line on the contract; `source_line` set from it).
5. The daily job drafts each later period 5 working days ahead; the drafts appear on the case's **Invoices** tab and the contract's Invoices tab, and AR issues them (Approval date first).
6. Recurring AR-i cases show a read-only **Billing schedule** tab: the case contract's schedules (one schedule per contract or several: open question 16, issue #7).
7. *Create invoice* and *Set up billing schedule* on billing lines are retired.

**Demo data:** **ARQ0001009** (AR-i, Tanjong Retail Group, recurring contract TR-TA-2025-14, billing cycle 1st of the month, monthly rent SGD 4,800) is Closed complete: 1st invoice two cycle days back (issued; approval date earlier than the invoice date), billing schedule from the 2nd invoice (last cycle day, issued), 3rd invoice drafted by the daily job once it is 5 working days away. ARQ0001001 (one-off) shows the 1st invoice being generated when AR sets Closed complete. ARQ0001002 is a new customer, not linked. Sample schedule SCH0001001 has its past periods already issued.

## Master data rules (decision 12)

- Master data is never deleted. Customers, billing contacts, bank accounts, cost centres and account codes have
  **Active** (default Yes). Lists have *All*, *Active* and *Inactive* tabs.
- Inactive records are not offered in reference fields (reference qualifier `active=true^ORsys_id=<current>`),
  the BSU upload form or the AR-ix customer search. AR-i's customer search is unchanged (portal form locked).
- Contracts have no flag: their status comes from the start and end dates.
- Cost centres and account codes open by code (`#/ws/costCentres/CC-ENG-100`) and list the AR4 allocations using
  them (`RL-CCT-CAL`, `RL-ACT-CAL`). Customer documents can be added by hand (*New*, D31).

## Invoice block (decision 13)

Invoices are made by the system (the AR-i's 1st invoice on Closed complete; later periods by the daily job from
the billing schedule). The record page: header, ribbon (Amount, Amount due, Due), Details, Allocations, **Invoice
preview**, Record history; actions *Issue invoice* (approval date required) and *Cancel invoice*. The preview is
the invoice document as the PDF would show it; ServiceNow: an HTML template rendered with PDF Generation
Utilities on Issue and attached to the invoice (`INV-PDF`, `UA-INV-pdf`). Template wording is a draft.
