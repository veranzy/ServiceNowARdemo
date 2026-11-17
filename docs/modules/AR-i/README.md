# AR-i — New AR request

**Status:** In prototype
**Persona(s):** Project team (portal) submits; AR team (workspace) processes
**Demo:** Portal → *AR forms* → **AR-i New AR request**. Workspace → the AR request record
(Link section, Billing lines), billing schedule records, list menu *Recurring billing*.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md) (numbers carried over from the old ARF
module), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), [CHANGELOG.md](CHANGELOG.md).
Shared form parts (catalogue, General information, My requests, ticket page, the D22 context table):
[AR-00](../AR-00/README.md). Customer, contract and invoice records: [CCI](../CCI/README.md).

## Purpose

AR-i is the general billing request. The project team finds the customer (or adds it when AR doesn't
have it yet, which is the usual "first request"), chooses the contract (existing, new, or no contract
required) and describes **one billing event**: an invoice description, the amount per period and the
preferred invoice date, with optional billing line items (D13 amended, D25). A recurring contract is
billed monthly to the contract end; anything else is one invoice. AR links the request to the customer
master (or creates / updates it) and files the documents on the customer, so the project team gives
them **once**. Recurring billing becomes a billing schedule that AR runs in the workspace.

AR-i never changes master data by itself (D22, see [AR-00 → Context](../AR-00/README.md)).

## User stories

- As a project manager, I want one form to ask AR to bill a new customer, so that AR has the customer,
  contract and bill-to details in one go.
- As a project manager, I want to see which customer documents AR already has, so that I don't send
  them again.
- As a project manager, I want to search for the customer and only fill in company details when AR
  doesn't have it, so that I don't retype known customers.
- As a project manager, I want to bill under an existing contract, register a new one, or say no contract
  is needed, so that every charge is filed in the right place.
- As an AR team member, I want to link an AR-i to the customer master with one action, filing its
  documents and the department's billing contact, so that later requests reuse them.
- As an AR team member, I want a list of recurring billing periods that are due, so that I raise each
  invoice on time.
- As an AR team member, I want every billing line and invoice to sit under a contract or the customer's
  no-contract shell, so that I can trace any invoice back through contract to customer.

## Screens and flow

**Portal: the AR-i form** (after General information, AR-00)
- **Customer** (decisions 9, 24–25): search AR's customers by name or UEN. A found customer's details are
  read-only (name, UEN, address, agency type, V@G, V@G sub-BU, POC name and email); *Add as new customer*
  lets the requester type them.
- **Contract and bill-to** (decisions 11–13, 27–30, 40; always shown, with the hint *Select a customer above to
  see the contract options.* until a customer is selected): *Existing contract* (all details read-only, then its
  billing position), *New contract* (the decision 27 fields, contract type first) or *No contract required*
  (files under the department's no-contract shell; bill-to asked only if the shell has none). Ends with the
  **GIRO** subsection (existing DDA, read-only; greyed for new / no contract).
- **Invoice details** (decisions 31–33, 37–38): invoice description, attention to name / email (prefilled
  from the contract bill-to), amount billed per period (before GST); for a **one-invoice request** only,
  **Preferred invoice date** as a choice (Per Billing Cycle / Expedited → *Provide Justification for
  expedited or Off billing cycle request*; both optional); *Require billing
  line item?* → billing line items table (system item number 1, 2, 3…, amount w/o GST, GST and total
  calculated at 9%, late payment interest %, account code). A summary shows how AR will bill: monthly
  invoices to the contract end date (with proration) or one invoice. A recurring contract asks no timing or
  date: AR decides the schedule start in the workspace (open question 25).
- **Customer documents** (decisions 4, 35): checklist of the three customer documents showing *On file* or
  *Needed*; upload only what's needed. The signed contract / PO is optional, offered for a new contract only.
- **Others** (decisions 34, 39, optional): cost center, name of agent to be billed, customer PO number.
- Ticket page block: the billing line and its invoice or billing schedule.

**Workspace**
1. AR request record → Details, section **Link** right after Case (D31, decision 41):
   - **Link Customer Reference** (`link_customer`, x_ar_customer shown by UEN) and **Link Contract Reference**
     (`link_contract`, x_ar_contract shown by Contract ID, contracts of the linked customer). Saving sets the case's
     customer and contract and every billing line's contract. The form sections keep the requester's answers, read-only.
   - AR first sets up master data **by hand** (D22): creates the customer (with its `core_company`) or contract or
     No contract record, copies the bill-to to the contract and the customer details to the customer, files the
     documents. *Link to customer* and the *Customer setup* panel are retired.
   - Ribbon *Customer setup*: links done, 0–2. List *Customer setup pending*: open AR-i cases not yet linked.
   - **Billing lines** related list: read-only (CCI decision 8).
   - **State = Closed complete** (dropdown + Save, AR-00 decision 4) generates the **1st invoice** as a draft from
     the AR-i (one-off: its only invoice; recurring: the first period), blocked until both Link fields are set. AR reviews it,
     sets the **Approval date** and issues it (CCI decisions 8–9).
   - Recurring cases: read-only **Billing schedule** tab (the contract's schedules) and an **Invoices** tab with every
     invoice linked to the case.
2. Recurring: AR creates the **billing schedule on the contract** (*New billing schedule*) for the 2nd invoice
   onwards, on the contract billing cycle day, and picks this case; a daily job drafts each period 5 working days
   ahead (D12 amended, CCI decisions 7–9). Periods show Due / Upcoming / Invoiced.
3. List menu → *AR requests*: All AR-i (UIX decision 15); *Recurring billing*: Billing schedules, Billing periods due.

## ServiceNow mapping

| Item | Build |
|---|---|
| AR-i | Record producer on `x_ar_request` (`PT-05`, `PT-15`) with variable sets General information (AR-00), Customer, Contract and bill-to (with GIRO), Invoice details (multi-row billing line items), Customer documents, Others. UI policies show / hide by *New customer* and `contract_option`. Catalog client scripts read documents on file and the contract's bill-to (GlideAjax). |
| `x_ar_request` | Fields: `ar_form`, `department`, new-customer fields, `contract_option` (existing / new / none), `contract`, new-contract fields (`new_contract_type`, `_number`, `_ref`, `_po`, `_title`, `_start`, `_end`, `_value`, `_billing_cycle`, `_billing_cycle_other`, `_invoice_date`, `_payment_terms`, `_payment_terms_other`, `_proration`, `_proration_first`, `_proration_last`), `type_of_billing` + `bulk_supporting_docs` (new contract; read-only copy for an existing one), bill-to fields (written to the contract). `amount` is the calculated request value (sum of lines). |
| `x_ar_request` invoice details | `short_description` (invoice description), `attention_name`, `attention_email`, `amount_per_period` (Currency, before GST), `preferred_invoice_date_choice` (label *Preferred invoice date*; Choice: Per Billing Cycle / Expedited; UI policy shows it only for a one-invoice request; optional, no default), `preferred_invoice_date_justification` (label *Provide Justification for expedited or Off billing cycle request*; String 1000; shown when Expedited; optional), `billing_line_items_required` (Yes / No). Producer script creates one `x_ar_request_line` (recurring when the contract's `contract_category` is recurring, end = contract end, start to be decided: open question 25; else one-off) and `amount` = its value; it clears `preferred_invoice_date_choice` for a recurring contract. |
| `x_ar_request_line` | Billing lines: request, **contract** (set at submit for an existing contract; set when AR saves Link Contract Reference, D31), line type (one-off / recurring), description, amount, preferred invoice date (one-off), frequency + from / to dates (recurring), invoice (one-off, once created), billing schedule (recurring, once set up). |
| `x_ar_request_item` | Billing line items (multi-row variable set, copied to this table by the producer script): `ar_request`, `item_number` (Integer, read-only: 1, 2, 3… in row order, set by the producer script), `amount_excl_gst`, `gst_amount` (= amount × `x_ar.gst_rate`, 9), `total_amount`, `late_payment_interest` (rate %), `account_code`. Related list *Billing line items* on the AR request. |
| `x_ar_billing_schedule` | Customer, contract, department, description, frequency, amount per period, first / last billing date, source AR request; periods computed (or a child table `x_ar_billing_period` in the build). |
| Contract fields from AR-i | AR copies the new-contract and bill-to fields to `x_ar_contract` **by hand** (D31); the contract table itself is specified in [CCI](../CCI/README.md). |
| Link section (D31) | `x_ar_request.link_customer` (Reference x_ar_customer, display UEN, auto-complete columns UEN + name) and `link_contract` (Reference x_ar_contract, display Contract ID; reference qualifier `customer` = `link_customer`). Before-update business rule: `link_customer` changed → `customer` = it; `link_contract` changed → `contract` = it and every `x_ar_request_line.contract` of the case; journal entries. Data policy: both mandatory for State = Closed complete; contract must belong to the linked customer. `customer` / `contract` read-only on the workspace form. |
| UI actions | *Assign to me* and *Save* on the AR request (AR-00 decision 4). Closed complete → business rule creates the 1st invoice (CCI decision 8). Retired: *Link to customer* (D31), *Create invoice*, *Set up billing schedule*, *Raise invoice*. |

## Out of scope / later

- Automatic invoice creation from schedules (decision 7 says AR raises each).
- Document expiry / re-validation (e.g. ACRA profile older than 12 months).
- AR request → invoice field mapping (finance coding, billing line items, attention to; decision 36).
