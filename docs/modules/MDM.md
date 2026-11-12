# MDM — Master data: customers and contracts

**Status:** In prototype (spec started 2026-11-04; customer and contract detail still to be written up)
**Persona(s):** AR team (workspace)
**Demo:** AR team · Workspace → Lists → Contracts → open a contract

## Purpose

Customers and contracts are the top of the billing hierarchy customer › contract (or no-contract
shell) › billing lines › invoices (D15). AR maintains them in the workspace. The contract holds the
billing terms that apply to its invoices: payment terms, early-settlement discount, late payment
interest (LPI) and the bill-to person (D16).

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Does the contract record whether late payment interest applies? | Yes: three fields on the contract, in a *Late payment interest (LPI)* form section. | 2026-11-04 |
| 2 | Where does the customer name come from? | From the platform `core_company` table (D26). `x_ar_customer.company` (Reference, mandatory, display field) → `core_company`; name dot-walked from `company.name`, not stored. Only the name comes from `core_company`; UEN, address and other details stay on `x_ar_customer`. | 2026-11-12 |
| 3 | Who creates the customer record for a new customer on AR-i? | AR-i only records the customer details on the request (transaction data). The processing officer creates the `x_ar_customer` record with *Link to customer* and must choose its `core_company` record. | 2026-11-12 |

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

## Open questions

| # | Question | Owner |
|---|---|---|
| 1 | Are the rates per annum (assumed) or per month? | Owner |
| 2 | What does *minimum LPI rate* mean: a floor under the LPI rate (assumed: min ≤ rate), or a minimum interest amount per invoice? | Owner |
| 3 | Should LPI be calculated and invoiced by the app (an LPI invoice or a line on the next invoice), or only recorded for reference? If calculated: from the due date or after a grace period, simple or compound? | Owner |
| 4 | Should a no-contract shell be able to carry LPI, or only real contracts? | Owner |
| 5 | If the requested company is not in `core_company` yet, who creates it: AR from *Link to customer*, or another team (the prototype only lets AR pick an existing company)? Should AR-i search `core_company` too? | Owner |

## Change log

| Date | Change |
|---|---|
| 2026-11-04 | Spec created. Contract: *Late payment interest (LPI)* section with `CON.lpi_applicable`, `CON.lpi_min_rate`, `CON.lpi_rate`; rates mandatory when LPI applicable, minimum must not exceed the rate. Sample contract `HL-2026-01` set to LPI applicable, minimum 5 %, rate 8 %. New IDs: `CON.lpi_applicable`, `CON.lpi_min_rate`, `CON.lpi_rate`. |
| 2026-11-12 | Customer name dot-walked from `core_company` (D26, decisions 2–3). New table entry `core_company` (`CMP.name`, reference only). New IDs: `CUS.company`, `CUS.company.name`, `REQ-LINKCO`. Retired ID: `CUS.name` (→ `CUS.company.name`). Link to customer now requires the company for a new customer. |
