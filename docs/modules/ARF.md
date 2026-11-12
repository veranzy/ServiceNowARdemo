# ARF — AR forms (portal catalogue) and AR-i New AR request

**Status:** In prototype
**Persona(s):** Project team (portal) submits; AR team (workspace) processes
**Demo:** Portal → *AR forms* (16 tiles) → **AR-i New AR request**. Workspace → the AR request record
(*Customer setup* panel), customer record (billing contacts, documents, billing schedules), list menu
*Recurring billing*.

## Purpose

The project team asks Accounts Receivable for billing through a catalogue of **16 AR forms, AR-i to
AR-xvi**. AR-i is the general request: the project team finds the customer (or adds it when AR doesn't
have it yet, which is the usual "first request"), names the department's bill-to person, and lists
what to bill as **billing lines**. A line is either **one-off** or **recurring over a date range**; one
request can mix both (e.g. a set-up fee plus monthly support). AR links the request to the customer
master (or creates/updates it) and files the documents on the customer, so the project team gives them
**once**. Recurring lines become billing schedules that AR runs in the workspace.

## Context: AR forms and master data are separate on purpose (D22)

AR forms (AR-i, AR-ix, …) and customer / contract updates are **deliberately separate**. A form is a
request; it never changes customer or contract data by itself. AR changes the master data in the
workspace (Link to customer, Link contract, Activate / Remove GIRO). Each form only *reads* what the
master data says. This creates some scenarios the build must handle:

| Scenario | What happens |
|---|---|
| AR-i on a contract **with GIRO active** | AR-i shows GIRO = **Yes**, greyed out. It can't be changed on AR-i. |
| AR-i on a contract **without GIRO**, and the customer wants GIRO | AR-i shows GIRO = **No**, greyed out, with a tooltip: raise an **AR-ix**. The two forms are separate cases. |
| AR-i for a **new contract** or **no contract** | GIRO = No (a contract that doesn't exist yet can't have GIRO). After AR creates the contract from the AR-i, an AR-ix can add GIRO. |
| AR-ix for a contract **not on file yet** | AR processes the contract's **AR-i first**, then links the AR-ix to the new contract (GIR module). |
| GIRO changes **after** an AR-i is submitted | The AR-i keeps the value it had at submit (`giro_on_contract` is a snapshot); the contract shows the current status. |
| Bill-to or contract details change | Only through AR in the workspace (D16), never by editing a past form. |

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | AR forms | 16 forms numbered in Roman numerals **AR-i … AR-xvi**. Only AR-i is detailed; AR-ii … AR-xvi are placeholders ("To be defined"). | 2026-11-02 |
| 2 | ~~AR-i request types (1st / ad-hoc / recurring)~~ | **Superseded by 8 and 9.** "1st" and "recurring" are concepts, not choices on the form. | 2026-11-02 |
| 3 | Customer on AR-i | ~~Pick or tick New customer~~ → see decision 9. AR verifies, then links or creates the customer record. | 2026-11-02 |
| 4 | Documents given once | Stored on the **customer**, not the request: **Signed contract / PO**, **Company registration (ACRA / UEN)**, **Billing contact & address form**. AR-i shows what is already on file and only asks for what's missing. | 2026-11-02 |
| 5 | Where contracts are | ~~AR-i asks where the signed contract is kept: attached to this form, already with AR, document repository link, or physical file. AR records it on the contract (`contract_location`).~~ **Removed 2026-11-12** (decision 35): no contract location anywhere. | 2026-11-02 |
| 6 | Departments | **11 operational departments.** A customer can be billed differently per department: each department may bill a **different person** at the same company → **billing contact per customer per department**. | 2026-11-02 |
| 7 | Recurring billing | A recurring **line** is requested **once**. AR sets up a **billing schedule** for it. The workspace lists periods due and AR clicks **Raise invoice** for each (draft invoice). No automatic invoice creation. | 2026-11-02 |
| 8 | Billing structure | An AR request has **one or more billing lines**. Each line is **One-off** (description, amount, preferred invoice date) or **Recurring** (description, amount per period, **from–to date range**, frequency). One request can mix both. | 2026-11-02 |
| 9 | Finding the customer | **Search first, add if not found.** The project team searches AR's customers; if it isn't there, *Add as new customer* opens name, UEN and address. A new customer is what makes a request a "first request"; there is no separate choice. | 2026-11-02 |
| 10 | Recurring frequency | **Monthly by default**; quarterly, half-yearly and annually can be chosen per recurring line. | 2026-11-02 |
| 11 | Billing is contract level | Hierarchy **customer › contract › billing lines (one-off / recurring) › invoices**. On AR-i the requester chooses **Existing contract** (customer already has contracts), **New contract** (reference, title, start/end dates, value, where it is kept), or **No contract required**. Billing lines come after the contract. (D15) | 2026-11-02 |
| 12 | No contract required | The lines are filed under the customer's **no-contract shell**: a contract record with `contract_type = shell`, one per customer + department, created by *Link to customer* when it doesn't exist yet. So every billing line and invoice has a contract and the hierarchy holds in ServiceNow. (D15) | 2026-11-02 |
| 13 | Bill-to on the contract | The bill-to person sits **under the contract** (or shell), not the department. AR-i shows the contract's bill-to, or asks for one prefilled from the department's usual contact; *Change the bill-to person on this contract* updates it. Department billing contacts remain as the default used for prefill. (D16) | 2026-11-02 |
| 14 | Relationships on the customer | The customer record shows **AR requests** (customer ↔ AR case), **Contracts** (incl. shells) and a **Billing hierarchy** of contract › lines › invoices / schedules. The contract record lists its billing lines, schedules, invoices and AR requests. | 2026-11-02 |
| 15 | Finance coding on AR-i | Request level, **all optional**, codes only for now. **Cost center** (free text), **Account code** (free text), **Billing type** (M / SB / PV). If SB: **V@G** (Yes / No). If V@G = Yes: **Sub-BU** (1–5); if No: **Type of billing** (A–E). Hidden fields are cleared when the answer above them changes. Shown on the workspace Details tab (section *Finance coding*, editable by AR) and on the portal ticket. | 2026-11-06 |
| 16 | GIRO on AR-i | New section **GIRO** after the contract: **GIRO on this contract** Yes / No, **read-only and greyed out**, taken from the contract's GIRO status (set only by AR-ix, D21). Tooltip: raise an AR-ix if the contract needs GIRO. The value is stored on the request at submit. | 2026-11-12 |
| 17 | Department sub-BU | **Sub-BU** dropdown right after Department, in General information (all AR forms). Choices depend on the department (mock list of 3 per department until the client supplies the real one). Changing the department clears it. | 2026-11-12 |
| 18 | Finance coding logic (replaces part of 15) | **Type of billing** (A–E) shows for **every** billing type (M, SB, PV). For **SB and PV**, **V@G** (Yes / No) is also asked; V@G = Yes adds **Sub-BU (V@G)** as **free text** (was a 1–5 dropdown). New: **Name of agent to be billed** (free text). **Cost center** has a tooltip "To be filled by GA". All still optional. | 2026-11-12 |
| 19 | Bulk supporting documents | When Type of billing is **C, D or E**, a **Supporting documents (bulk upload)** field accepts several files at once. | 2026-11-12 |
| 20 | Recurring line options | Each recurring line gets optional **Remarks** and **Prorate first and last month** (Yes / No). If Yes: **First month amount** and **Last month amount** (mandatory). Line value = first + amount × (periods − 2) + last. The billing schedule keeps both amounts and *Raise invoice* uses them for the first and last period. | 2026-11-12 |
| 21 | Invoice breakdown | New section **Invoice breakdown**: free text, optional, after What to bill. | 2026-11-12 |
| 22 | Customer section | **Finance coding moves into section 2 Customer** (no longer its own section), and the section gets a **Customer point of contact**: POC name and POC email (both optional; email validated). AR-i sections: 1 General information, 2 Customer (customer, POC, finance coding), 3 Contract and bill-to, 4 GIRO, 5 What to bill, 6 Invoice breakdown, 7 Customer documents. | 2026-11-12 |
| 23 | Agency type | **Billing type** is renamed **Agency type** (same choices M / SB / PV, same rules; decisions 15 and 18 now read "agency type"). The column becomes `agency_type`. | 2026-11-12 |
| 24 | Customer section revamp | Section 2 Customer shows, in this order: **customer name, customer UEN, address, agency type (M / SB / PV), V@G (Yes / No, for SB and PV), V@G sub-BU (when V@G = Yes), POC name, POC email**. **Found customer: all of them read-only**, from the customer record. **New customer:** the requester types them. (Replaces decision 22's layout.) | 2026-11-12 |
| 25 | Where customer details live (D23) | They are **transaction data on the AR-i** (record producer variables → case fields) and are **replicated to the customer master** by *Link to customer* (new customer: all; existing customer: only fields still blank on the customer). The customer record gets *Agency type, V@G, V@G sub-BU, POC name, POC email*. | 2026-11-12 |
| 26 | Invoice details | The rest of finance coding (cost center, account code, name of agent to be billed, type of billing, bulk upload for C / D / E) moves into **Invoice details** (was *Invoice breakdown*), after the invoice breakdown text. Type of billing shows once the agency type is known. AR-i sections: 1 General information, 2 Customer, 3 Contract and bill-to, 4 GIRO, 5 What to bill, 6 Invoice details, 7 Customer documents. | 2026-11-12 |
| 27 | Contract details | **Existing contract** (existing customer): every contract detail is shown **read-only** from the contract record (D22); the requester can't change it, and the bill-to is not asked. **New contract**, in this order: **contract type** (Recurring / Ad-hoc, first field), contract number, contract reference number, contract PO number, contract title, contract start / end date, contract value (SGD), contract bill-to person, bill-to email, bill-to phone number, **contract billing cycle** (1st of the month / 15th of the month / Others → *Suggested billing cycle*), **preferred invoice billing date**, **payment terms** (30 days / Others → free text), **proration** (Yes / No → *Proration for 1st month* and *Proration for last month*), **type of billing** (A–E; C / D / E → bulk upload). Mandatory: type, number, title, start date, value, bill-to person and email, plus the "Others" text and both proration amounts when chosen. *No contract required* stays as the third option (D15). Link to customer copies all of it to the new contract. | 2026-11-12 |
| 28 | Proration | Moves from the billing line to the **contract** (replaces decision 20's line prorating; line remarks stay). When the contract has proration Yes, every recurring line under it uses the contract's 1st / last month amounts for its first and last period (line value, billing schedule, *Raise invoice*). | 2026-11-12 |
| 29 | Type of billing | Lives on the **contract only** (with the C / D / E bulk upload); removed from Invoice details (changes decision 26). For an existing contract the request keeps a read-only copy taken at submit. | 2026-11-12 |
| 30 | GIRO | No longer its own section: a **GIRO subsection inside Contract**: *Is there an existing DDA?* Yes / No, read-only, with the active AR-ix case number when Yes. For a new contract or *No contract required* it is **greyed out**, with a tooltip telling the project team to raise an AR-ix once AR has set up the contract. AR-i sections: 1 General information, 2 Customer, 3 Contract and bill-to (with GIRO), 4 What to bill, 5 Invoice details, 6 Customer documents. | 2026-11-12 |
| 31 | Invoice details replace billing lines | Section 4 *What to bill* (billing lines) is replaced by **Invoice details**: **invoice description**, **attention to name**, **attention to email**, **amount billed per period** (before GST), **preferred invoice date**, **Require billing line item?** (Yes / No). One request = one billing event (D13 amended): **Recurring contract** → billed monthly from the preferred invoice date (then mandatory, the first invoice) to the contract end date (a new recurring contract must have an end date), with contract proration; **Ad-hoc contract, No contract, or contract type not on file** → one invoice. Submit creates one `x_ar_request_line`, so the workspace flow (Link to customer, Create invoice / Set up billing schedule, Billed) is unchanged. Attention to name / email are optional and prefilled from the contract's bill-to. Replaces decisions 8 and 10 for the form. | 2026-11-12 |
| 32 | Billing line items | When *Require billing line item?* = Yes, a multi-row table: **billing item number*, amount (w/o GST)*, GST amount, total amount, late payment interest, account code**; at least one row. Saved as `x_ar_request_item` rows on the request. **No check** that the items add up to the amount billed per period. | 2026-11-12 |
| 33 | GST and LPI on items | GST amount = amount × 9% (calculated, read-only), total = amount + GST (D25). **Late payment interest is a rate (%)** for now; to be confirmed with the users (open question 20). | 2026-11-12 |
| 34 | Others section | Invoice breakdown, cost center, account code, name of agent to be billed and customer PO number move to a new last section **Others**; their final place is to be decided (open question 21). AR-i sections: 1 General information, 2 Customer, 3 Contract and bill-to, 4 Invoice details, 5 Customer documents, 6 Others. | 2026-11-12 |
| 35 | No contract location | **Contract location is removed everywhere**: the AR-i question *Where is the signed contract kept?* and its link / file location, the request fields, the contract fields, the setup checklist item and Link to customer's copy. The signed contract / PO document row stays: **optional, offered for a new contract only**; an existing contract shows it On file or Not needed; no contract: not needed. Replaces decision 5. | 2026-11-12 |
| 36 | Answers on invoice details | Account code stays both on each billing line item and in Others (Others kept as it is for now). Billing line items and attention to **will carry onto the invoice**, decided with the AR request → invoice mapping in the workspace. Contract **billing cycle is information only**: recurring invoices stay monthly from the preferred invoice date; *Suggested billing cycle* stays free text. Late payment interest parked as GitHub issue #3. Attention to stays optional for now. | 2026-11-12 |

## User stories

- As a project manager, I want one form to ask AR to bill a new customer, so that AR has the customer,
  contract and bill-to details in one go.
- As a project manager, I want to see which customer documents AR already has, so that I don't send
  them again.
- As a project manager, I want to put a one-off fee and a monthly charge with a start and end date in the
  same request, so that I describe the whole deal once.
- As a project manager, I want to search for the customer and only fill in company details when AR
  doesn't have it, so that I don't retype known customers.
- As an AR team member, I want to link an AR-i to the customer master with one action, filing its
  documents and the department's billing contact, so that later requests reuse them.
- As an AR team member, I want a list of recurring billing periods that are due, so that I raise each
  invoice on time.
- As a project manager, I want to bill under an existing contract, register a new one, or say no contract
  is needed, so that every charge is filed in the right place.
- As an AR team member, I want every billing line and invoice to sit under a contract or the customer's
  no-contract shell, so that I can trace any invoice back through contract to customer.

## Screens and flow

**Portal**
1. *AR forms* catalogue: 16 tiles. AR-i is active; AR-ii … AR-xvi show "To be defined".
2. AR-i form, in sections:
   - **Customer**: search AR's customers by name or UEN; pick one, or *Add as new customer* (name, UEN,
     registered address) when it isn't found.
   - **Contract and bill-to** (decisions 11–13, 27–30): *Existing contract* (pick one; all its details
     shown read-only, then its billing position), *New contract* (the decision 27 fields, contract type
     first) or *No contract required* (files under the department's no-contract shell; bill-to asked
     only if the shell has none). Ends with the **GIRO**
     subsection (existing DDA, read-only; greyed for new / no contract).
   - **Invoice details** (decisions 31–33): invoice description, attention to name / email (prefilled from
     the contract bill-to), amount billed per period (before GST), preferred invoice date (first invoice for a
     recurring contract), *Require billing line item?* → billing line items table (item number, amount w/o GST,
     GST and total calculated at 9%, late payment interest %, account code). A summary shows how AR will bill:
     monthly invoices to the contract end date (with proration) or one invoice.
   - **Documents** (below), then **Others** (decision 34, optional): invoice breakdown, cost center, account code,
     name of agent to be billed, customer PO number.
   - **Documents**: checklist of the three customer documents showing *On file* or *Needed*; upload
     only what's needed. The signed contract is only needed for a new contract kept as an attachment.
3. My requests / ticket page shows the lines and, per line, the invoice or billing schedule.

**Workspace**
1. AR request record → **Customer setup** panel: checklist (customer linked, contract / shell, bill-to on
   the contract, documents filed, billing lines done).
   - UI action **Link to customer**: links an existing customer, or creates the customer from the new
     customer details; links the existing contract, creates the new contract, or finds/creates the
     department's no-contract shell, and sets it on every billing line; writes the bill-to to the
     contract (and the department default contact if there is none); files the documents on the
     customer. Lines can only be billed once they have a contract.
   - **Billing lines** related list on the request: per line **Create invoice** (one-off → draft invoice)
     or **Set up billing schedule** (recurring → schedule over the line's date range). The request is
     **Billed** when every one-off line has an issued invoice and every recurring line has a schedule.
2. Customer record → **Billing hierarchy** (customer › contract / shell › billing lines › invoices or
   schedule; requests not yet linked shown as *Not filed*), then related lists **AR requests**,
   **Contracts** (type, bill-to, lines, billed), **Invoices**, **Billing contacts**, **Customer
   documents**, **Billing schedules**.
2a. Contract record → type (Contract / No-contract shell), department, bill-to; related lists **Billing
   lines**, **Billing schedules**, **Invoices**, **AR requests**. List menu → Master data → *No-contract shells*.
3. Billing schedule record → periods with status (Due / Upcoming / Invoiced) and **Raise invoice**.
4. List menu → *Recurring billing*: Billing schedules, Billing periods due.

## ServiceNow mapping

| Item | Build |
|---|---|
| Portal catalogue | Service catalog category "AR forms" with 16 record producers (AR-i … AR-xvi); AR-ii … AR-xvi inactive until defined. |
| AR-i | Record producer on `x_ar_request` with variable sets: Customer, Contract and bill-to, What to bill (multi-row billing lines), Documents. UI policies show/hide by *New customer* and `contract_option`. Catalog client scripts read documents on file and the contract's bill-to (GlideAjax). |
| `x_ar_request` | Fields: `ar_form`, `department`, new-customer fields, `contract_option` (existing / new / none), `contract`, new-contract fields (`new_contract_type`, `_number`, `_ref`, `_po`, `_title`, `_start`, `_end`, `_value`, `_billing_cycle`, `_billing_cycle_other`, `_invoice_date`, `_payment_terms`, `_payment_terms_other`, `_proration`, `_proration_first`, `_proration_last`), `type_of_billing` + `bulk_supporting_docs` (new contract; read-only copy for an existing one), bill-to fields (written to the contract). `amount` is the calculated request value (sum of lines). |
| `x_ar_contract` | New fields `contract_type` (record type: contract / shell), `contract_category` (contract type: recurring / ad-hoc), `reference_number`, `po_number`, `department`, `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`, `billing_cycle` (+ `_other`), `preferred_invoice_date`, `payment_terms_choice` (+ `payment_terms_other`; `terms` days = 30 unless Others), `proration`, `proration_first`, `proration_last`, `type_of_billing`, `bulk_supporting_docs`. Shell unique per customer + department (business rule). Workspace form section *Billing terms*. |
| `x_ar_request_line` | Billing lines: request, **contract** (set at submit for an existing contract, else by Link to customer), line type (one-off / recurring), description, amount, preferred invoice date (one-off), frequency + from/to dates (recurring), invoice (one-off, once created), billing schedule (recurring, once set up). Portal: multi-row variable set. |
| `x_ar_billing_contact` | Customer + department → the department's usual bill-to person; used to prefill the bill-to on a new contract or shell. Unique per customer + department. |
| `x_ar_customer_document` | Customer documents: type (contract/PO, ACRA, billing form), file (sys_attachment), contract (optional), department (billing form), source AR request. |
| `x_ar_billing_schedule` | Customer, contract, department, description, frequency, amount per period, first/last billing date, source AR request; periods computed (or a child table `x_ar_billing_period` in the build). |
| `x_ar_request` invoice details | `short_description` (invoice description), `attention_name`, `attention_email`, `amount_per_period` (Currency, before GST), `preferred_invoice_date`, `billing_line_items_required` (Yes / No). Producer script creates one `x_ar_request_line` (recurring when the contract's `contract_category` is recurring; start = preferred invoice date, end = contract end; else one-off) and `amount` = its value. |
| `x_ar_request_item` | Billing line items (multi-row variable set on AR-i, copied to this table by the producer script): `ar_request`, `billing_item_number`, `amount_excl_gst`, `gst_amount` (= amount × `x_ar.gst_rate`, 9), `total_amount`, `late_payment_interest` (rate %), `account_code`. Related list *Billing line items* on the AR request. |
| UI actions | *Link to customer* on AR request; *Create invoice* / *Set up billing schedule* on each billing line; *Raise invoice* on billing period. |

## Out of scope / later

- AR-ii … AR-xvi content.
- Automation after submission (assignment, notifications) — still to be defined by the owner.
- Automatic invoice creation from schedules (decision 7 says AR raises each).
- Document expiry / re-validation (e.g. ACRA profile older than 12 months).

## Open questions

1. ~~Confirm decision 5's reading of "where their contracts are".~~ No longer applies: contract location removed (decision 35).
2. Is a billing contact needed per department for every customer, or only when it differs from the
   customer's default?
3. ~~Can a request for a customer with no contract go straight to invoicing?~~ Answered by decision 12: yes, under the no-contract shell.
6. Should a no-contract request record a reason (ad-hoc service, contract pending, …)? Not asked for now.
7. Should AR be able to move a shell's billing lines onto a real contract later (e.g. when a contract is signed)?
5. Should a recurring line be able to change amount part-way (e.g. price step-up), or is that a second line with its own date range?
4. Who maintains the list of 11 departments (fixed choice list vs. a department table)?
8. Full names of agency types **M**, **SB** and **PV**, and what **V@G** stands for. (Owner)
9. Should cost center and account code be validated against a list (e.g. a cost center table or the
   finance system), or stay free text? (Owner)
10. Do the finance coding values need to flow onto the invoice (e.g. for GL posting)? (Owner) **Deferred (2026-11-06):** to be decided with the AR request → invoice field mapping, later.
11. Real list of sub-BUs per department (the prototype uses a mock list). (Owner)
12. Is Sub-BU (V@G) related to the department Sub-BU list, or always free text? (Owner)
15. Is the customer POC a different person from the bill-to person on the contract? (Owner)
16. If an existing customer's details are blank (e.g. no agency type on file), should the requester be allowed to fill them on AR-i, or must AR complete the customer first? Prototype: they stay read-only and blank. (Owner)
17. Does contract proration apply to **every** recurring line under the contract, or should a line be able to opt out? Prototype: every recurring line. (Owner)
18. Payment terms *Others* is free text, so the due date can't be calculated from it. Should Others ask for a number of days instead? Prototype: AR sets the days on the contract. (Owner)
19. Is the *preferred invoice billing date* a single date, or a day of the month (overlapping the billing cycle)? Prototype: a date. (Owner)
20. Late payment interest on a billing line item: a rate (%), as built, or an amount, or Yes / No? **Parked 2026-11-12** as [GitHub issue #3](https://github.com/veranzy/ServiceNowARdemo/issues/3); to be confirmed with the users. (Owner)
21. ~~Final place of the *Others* fields; keep account code in both places?~~ **Answered 2026-11-12:** keep the Others section as it is for now, with account code in both places (decision 36). Final placement may be revisited later.
22. ~~Should the billing line items and attention to flow onto the invoice?~~ **Answered 2026-11-12:** yes; how is decided with the AR request → invoice mapping in the workspace (decision 36, deferred to that work).
23. Are attention to name and email mandatory? Prototype: optional, prefilled from the contract bill-to. **Deferred 2026-11-12** by the owner (ignore for now). (Owner)
24. ~~Should the billing cycle set the invoice day?~~ **Answered 2026-11-12:** no; billing cycle is information only and *Suggested billing cycle* stays free text (decision 36).
13. Prorating: should the first / last month amounts be calculated from the dates (days in month) instead of typed in? (Owner)
14. Does the invoice breakdown need structure (e.g. lines with amounts), or is free text enough? (Owner)

## Change log

| Date | Change |
|---|---|
| 2026-11-02 | Module specified from owner's answers; AR forms catalogue and AR-i built. |
| 2026-11-02 | **PT-05**: request type removed; customer search-first with *Add as new customer* (decision 9); billing lines one-off / recurring with date range and Monthly default (decisions 8, 10). Retired IDs: `PT-17` (request type), `PT-21` and `PT-22` (billing / recurring variable sets → `PT-26`), `PT-18` (→ `PT-25` customer search), `REQ.request_type`, `REQ.billing_type`, `REQ.requested_invoice_date`, `REQ.period_start`, `REQ.period_end`, `REQ.frequency`, `REQ.first_billing_date`, `REQ.last_billing_date` (→ `RQL.*` line fields), `UA-REQ-invoice`, `UA-REQ-schedule` (→ `UA-RQL-invoice`, `UA-RQL-schedule`). |
| 2026-11-02 | **PT-05** (contract level): bill-to moved under the contract; contract chosen before billing lines as *Existing contract* / *New contract* / *No contract required*; no-contract shell per customer + department; billing lines carry the contract; customer billing hierarchy and contract related lists (decisions 11–14, D15, D16). New IDs: `PT-28`, `CUS-TREE`, `RL-CON-RQL`, `RL-CON-SCH`, `CON.line_count`, `REQ.contract_option`, `REQ.new_contract_*`, `CON.contract_type`, `CON.department`, `CON.bill_to_*`, `RQL.contract`. `PT-19` (bill-to) now sits inside `PT-20` (Contract and bill-to). No IDs retired. |
| 2026-11-04 | **REQ.department**: tooltip (ⓘ next to the label) on AR-i: *Auto-populated from the requester's department. Change it only if you are requesting for another department.* ServiceNow: variable **Tooltip** on the record producer variable; default value from the requester's department. Field stays editable. No new IDs. |
| 2026-11-06 | **AR-i finance coding** (decision 15): new request fields `REQ.cost_center`, `REQ.account_code`, `REQ.billing_type_code`, `REQ.vag`, `REQ.sub_bu`, `REQ.type_of_billing`; portal section `PT-29`; workspace Details section *Finance coding*. UI policies use a new schema `showIf` (also listed in the mapping doc). The column is `billing_type_code`, not `billing_type`, because `REQ.billing_type` was retired in PT-05 and IDs are never reused. |
| 2026-11-06 | Open question 10 (finance coding on the invoice) deferred by the owner: AR request → invoice field mapping will be done later. |
| 2026-11-10 | **General information** section (D19) added as section 1 of AR-i (and AR-ix): requester name, email (SSO, read-only), department, CC list; AR-i sections renumbered (Customer is now 2). New IDs `PT-30`, `REQ.requester_name`, `REQ.requester_email`, `REQ.cc_list`. **`PT-06` retired** (the read-only "Requested by" display; replaced by `REQ.requester_name`). Catalogue: AR-ix is now active (see the GIR module). Case state **Completed** added for non-billing forms. |
| 2026-11-12 | **Owner change request (11 items).** Context section added (AR forms and master data separate on purpose, D22). AR-i: GIRO section, read-only from the contract (decision 16, `PT-36`, `REQ.giro_on_contract`); department Sub-BU dropdown on all forms (17, `REQ.department_sub_bu`); finance coding: Type of billing for M / SB / PV, V@G for SB and PV, Sub-BU (V@G) now free text (`REQ.sub_bu` changed from Choice to String), agent name (`REQ.agent_name`), GA tooltip on cost center (18); bulk supporting documents for C / D / E (19, `REQ.bulk_supporting_docs`); recurring line remarks and prorating (20, `RQL.remarks`, `RQL.prorate`, `RQL.first_period_amount`, `RQL.last_period_amount`, `SCH.first_period_amount`, `SCH.last_period_amount`); Invoice breakdown section (21, `PT-37`, `REQ.invoice_breakdown`). AR-i sections are now: 1 General information, 2 Customer, 3 Contract and bill-to, 4 GIRO, 5 What to bill, 6 Invoice breakdown, 7 Finance coding, 8 Customer documents. Also fixed: clicking Submit straight after editing a text field didn't submit. No IDs retired. |
| 2026-11-12 | Finance coding merged into the Customer section; Customer POC name and email added (decision 22, `PT-38`, `REQ.customer_poc_name`, `REQ.customer_poc_email`). `PT-29` is now the finance coding block inside the Customer section (no longer a section of its own). No IDs retired. |
| 2026-11-12 | Billing type renamed **Agency type** (decision 23). New ID `REQ.agency_type`; **`REQ.billing_type_code` retired** (same field, renamed column). |
| 2026-11-12 | **Customer section revamp** (decisions 24–26, D23): found customer's details read-only in the owner's order; details stored on the request and replicated to the customer by Link to customer; new customer fields `CUS.agency_type`, `CUS.vag`, `CUS.vag_sub_bu`, `CUS.poc_name`, `CUS.poc_email`; `REQ.sub_bu` label now "V@G sub-BU". Finance coding block (`PT-29`) moved into **Invoice details** (`PT-37`, renamed from Invoice breakdown). New ID `PT-39` (customer details block). **`PT-38` retired** (separate POC block). |
| 2026-11-12 | **Contract details revamp** (decisions 27–30): existing contract read-only (`PT-41`); new contract fields in the owner's order (`PT-40`; new IDs `REQ.new_contract_type`, `REQ.new_contract_number`, `REQ.new_contract_po`, `REQ.new_contract_billing_cycle`, `REQ.new_contract_billing_cycle_other`, `REQ.new_contract_invoice_date`, `REQ.new_contract_payment_terms`, `REQ.new_contract_payment_terms_other`, `REQ.new_contract_proration`, `REQ.new_contract_proration_first`, `REQ.new_contract_proration_last`, `CON.contract_category`, `CON.reference_number`, `CON.po_number`, `CON.billing_cycle`, `CON.billing_cycle_other`, `CON.preferred_invoice_date`, `CON.payment_terms_choice`, `CON.payment_terms_other`, `CON.proration`, `CON.proration_first`, `CON.proration_last`, `CON.type_of_billing`, `CON.bulk_supporting_docs`); proration and type of billing moved to the contract; GIRO is a subsection of Contract (`PT-36`) with "existing DDA", greyed for new / no contract. `CON.contract_type` relabelled *Record type*. **Retired IDs:** `RQL.prorate`, `RQL.first_period_amount`, `RQL.last_period_amount` (line proration → contract), `REQ.update_bill_to` (existing contract's bill-to is read-only). |
| 2026-11-12 | **Invoice details revamp** (decisions 31–34, D13 amended, D25): billing lines removed from the form; Invoice details (`PT-37`, rewritten) with new IDs `REQ.attention_name`, `REQ.attention_email`, `REQ.amount_per_period`, `REQ.preferred_invoice_date`, `REQ.billing_line_items_required`; billing line items table `PT-43` → new table `x_ar_request_item` (`RQI.*`, related list `RL-REQ-RQI`, portal action `UA-PT-additem`); new section Others `PT-42` (invoice breakdown, finance coding `PT-29`, customer PO). `REQ.short_description` relabelled *Invoice description*. Sample contracts now all have a contract type (monthly → Recurring); Zephyr's sample request is one recurring line with two billing line items. **Retired IDs:** `PT-26` (What to bill variable set), `UA-PT-addline` (add one-off / recurring line). |
| 2026-11-12 | **REQ.contract_location** removed from the prototype (decision 35): **retired IDs** `REQ.contract_location`, `REQ.contract_location_ref`, `CON.contract_location`, `CON.contract_location_ref`. The signed contract / PO is optional for a new contract (was mandatory when "attached to this form"). **REQ.bulk_supporting_docs**: hint text under the Upload files button removed. Owner's answers to open questions 20–24 recorded (decision 36; LPI parked as GitHub issue #3). |
