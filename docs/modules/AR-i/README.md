# AR-i — New AR request

**Status:** In prototype
**Persona(s):** Project team (portal) submits; AR team (workspace) processes
**Demo:** Portal → *AR forms* → **AR-i New AR request**. Workspace → the AR request record
(*Customer setup* panel, Billing lines), billing schedule records, list menu *Recurring billing*.

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
- **Contract and bill-to** (decisions 11–13, 27–30): *Existing contract* (all details read-only, then its
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
1. AR request record → **Customer setup** panel: checklist (customer linked, contract / shell, bill-to on
   the contract, documents filed, billing lines done).
   - UI action **Link to customer**: links an existing customer, or creates the customer (choosing its
     `core_company`, CCI) from the new customer details; links the existing contract, creates the new
     contract, or finds / creates the department's no-contract shell, and sets it on every billing line;
     writes the bill-to to the contract (and the department default contact if there is none); files the
     documents on the customer. Lines can only be billed once they have a contract.
   - **Billing lines** related list: per line **Create invoice** (one-off → draft invoice) or **Set up
     billing schedule** (recurring → schedule over the line's date range). The request is **Billed** when
     every one-off line has an issued invoice and every recurring line has a schedule.
2. Billing schedule record → periods with status (Due / Upcoming / Invoiced) and **Raise invoice** (never
   automatic, D12).
3. List menu → *Recurring billing*: Billing schedules, Billing periods due.

## ServiceNow mapping

| Item | Build |
|---|---|
| AR-i | Record producer on `x_ar_request` (`PT-05`, `PT-15`) with variable sets General information (AR-00), Customer, Contract and bill-to (with GIRO), Invoice details (multi-row billing line items), Customer documents, Others. UI policies show / hide by *New customer* and `contract_option`. Catalog client scripts read documents on file and the contract's bill-to (GlideAjax). |
| `x_ar_request` | Fields: `ar_form`, `department`, new-customer fields, `contract_option` (existing / new / none), `contract`, new-contract fields (`new_contract_type`, `_number`, `_ref`, `_po`, `_title`, `_start`, `_end`, `_value`, `_billing_cycle`, `_billing_cycle_other`, `_invoice_date`, `_payment_terms`, `_payment_terms_other`, `_proration`, `_proration_first`, `_proration_last`), `type_of_billing` + `bulk_supporting_docs` (new contract; read-only copy for an existing one), bill-to fields (written to the contract). `amount` is the calculated request value (sum of lines). |
| `x_ar_request` invoice details | `short_description` (invoice description), `attention_name`, `attention_email`, `amount_per_period` (Currency, before GST), `preferred_invoice_date_choice` (label *Preferred invoice date*; Choice: Per Billing Cycle / Expedited; UI policy shows it only for a one-invoice request; optional, no default), `preferred_invoice_date_justification` (label *Provide Justification for expedited or Off billing cycle request*; String 1000; shown when Expedited; optional), `billing_line_items_required` (Yes / No). Producer script creates one `x_ar_request_line` (recurring when the contract's `contract_category` is recurring, end = contract end, start to be decided: open question 25; else one-off) and `amount` = its value; it clears `preferred_invoice_date_choice` for a recurring contract. |
| `x_ar_request_line` | Billing lines: request, **contract** (set at submit for an existing contract, else by Link to customer), line type (one-off / recurring), description, amount, preferred invoice date (one-off), frequency + from / to dates (recurring), invoice (one-off, once created), billing schedule (recurring, once set up). |
| `x_ar_request_item` | Billing line items (multi-row variable set, copied to this table by the producer script): `ar_request`, `item_number` (Integer, read-only: 1, 2, 3… in row order, set by the producer script), `amount_excl_gst`, `gst_amount` (= amount × `x_ar.gst_rate`, 9), `total_amount`, `late_payment_interest` (rate %), `account_code`. Related list *Billing line items* on the AR request. |
| `x_ar_billing_schedule` | Customer, contract, department, description, frequency, amount per period, first / last billing date, source AR request; periods computed (or a child table `x_ar_billing_period` in the build). |
| Contract fields written by AR-i | The new-contract and bill-to fields land on `x_ar_contract` through *Link to customer*; the contract table itself is specified in [CCI](../CCI/README.md). |
| UI actions | *Link to customer* on AR request; *Create invoice* / *Set up billing schedule* on each billing line; *Raise invoice* on billing period. |

## Out of scope / later

- Automatic invoice creation from schedules (decision 7 says AR raises each).
- Document expiry / re-validation (e.g. ACRA profile older than 12 months).
- AR request → invoice field mapping (finance coding, billing line items, attention to; decision 36).
