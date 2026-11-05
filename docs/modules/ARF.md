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

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | AR forms | 16 forms numbered in Roman numerals **AR-i … AR-xvi**. Only AR-i is detailed; AR-ii … AR-xvi are placeholders ("To be defined"). | 2026-11-02 |
| 2 | ~~AR-i request types (1st / ad-hoc / recurring)~~ | **Superseded by 8 and 9.** "1st" and "recurring" are concepts, not choices on the form. | 2026-11-02 |
| 3 | Customer on AR-i | ~~Pick or tick New customer~~ → see decision 9. AR verifies, then links or creates the customer record. | 2026-11-02 |
| 4 | Documents given once | Stored on the **customer**, not the request: **Signed contract / PO**, **Company registration (ACRA / UEN)**, **Billing contact & address form**. AR-i shows what is already on file and only asks for what's missing. | 2026-11-02 |
| 5 | Where contracts are | AR-i asks where the signed contract is kept: attached to this form, already with AR, document repository link, or physical file. AR records it on the contract (`contract_location`). | 2026-11-02 |
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

Assumption to confirm: "where their contracts are" means the storage location of the signed contract
(decision 5).

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
   - **Contract and bill-to** (decisions 11–13): *Existing contract* (pick one; its billing position is
     shown), *New contract* (reference, title, start, end, value) or *No contract required* (files under
     the department's no-contract shell). Contract location is asked for a new contract, or an existing
     one with none recorded. Then the **bill-to person**: the contract's / shell's if it has one (tick to
     change it), otherwise entered, prefilled from the department's usual contact.
   - **What to bill** (after the contract): request summary, PO, then **billing lines**: *Add one-off* / *Add recurring*.
     One-off: description, amount, preferred invoice date. Recurring: description, amount per period,
     frequency (Monthly default), from and to dates; the line shows the number of invoices and total.
     A summary shows one-off total, recurring per period and total request value.
   - **Finance coding** (decision 15, optional): cost center, account code, billing type; V@G only for SB;
     then Sub-BU (V@G Yes) or Type of billing (V@G No).
   - **Documents**: checklist of the three customer documents showing *On file* or *Needed*; upload
     only what's needed. The signed contract is only needed for a new contract kept as an attachment.
3. My requests / ticket page shows the lines and, per line, the invoice or billing schedule.

**Workspace**
1. AR request record → **Customer setup** panel: checklist (customer linked, contract / shell, bill-to on
   the contract, documents filed, contract location recorded, billing lines done).
   - UI action **Link to customer**: links an existing customer, or creates the customer from the new
     customer details; links the existing contract, creates the new contract, or finds/creates the
     department's no-contract shell, and sets it on every billing line; writes the bill-to to the
     contract (and the department default contact if there is none); files the documents on the
     customer; records the contract location. Lines can only be billed once they have a contract.
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
| `x_ar_request` | Fields: `ar_form`, `department`, new-customer fields, `contract_option` (existing / new / none), `contract`, new-contract fields (`new_contract_ref`, `_title`, `_start`, `_end`, `_value`), bill-to fields (written to the contract), `contract_location`, `contract_location_ref`. `amount` is the calculated request value (sum of lines). |
| `x_ar_contract` | New fields `contract_type` (contract / shell), `department`, `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`. Shell unique per customer + department (business rule). |
| `x_ar_request_line` | Billing lines: request, **contract** (set at submit for an existing contract, else by Link to customer), line type (one-off / recurring), description, amount, preferred invoice date (one-off), frequency + from/to dates (recurring), invoice (one-off, once created), billing schedule (recurring, once set up). Portal: multi-row variable set. |
| `x_ar_billing_contact` | Customer + department → the department's usual bill-to person; used to prefill the bill-to on a new contract or shell. Unique per customer + department. |
| `x_ar_customer_document` | Customer documents: type (contract/PO, ACRA, billing form), file (sys_attachment), contract (optional), department (billing form), source AR request. |
| `x_ar_billing_schedule` | Customer, contract, department, description, frequency, amount per period, first/last billing date, source AR request; periods computed (or a child table `x_ar_billing_period` in the build). |
| UI actions | *Link to customer* on AR request; *Create invoice* / *Set up billing schedule* on each billing line; *Raise invoice* on billing period. |

## Out of scope / later

- AR-ii … AR-xvi content.
- Automation after submission (assignment, notifications) — still to be defined by the owner.
- Automatic invoice creation from schedules (decision 7 says AR raises each).
- Document expiry / re-validation (e.g. ACRA profile older than 12 months).

## Open questions

1. Confirm decision 5's reading of "where their contracts are".
2. Is a billing contact needed per department for every customer, or only when it differs from the
   customer's default?
3. ~~Can a request for a customer with no contract go straight to invoicing?~~ Answered by decision 12: yes, under the no-contract shell.
6. Should a no-contract request record a reason (ad-hoc service, contract pending, …)? Not asked for now.
7. Should AR be able to move a shell's billing lines onto a real contract later (e.g. when a contract is signed)?
5. Should a recurring line be able to change amount part-way (e.g. price step-up), or is that a second line with its own date range?
4. Who maintains the list of 11 departments (fixed choice list vs. a department table)?
8. Full names of billing types **M**, **SB** and **PV**, and what **V@G** stands for. (Owner)
9. Should cost center and account code be validated against a list (e.g. a cost center table or the
   finance system), or stay free text? (Owner)
10. Do the finance coding values need to flow onto the invoice (e.g. for GL posting)? (Owner) **Deferred (2026-11-06):** to be decided with the AR request → invoice field mapping, later.

## Change log

| Date | Change |
|---|---|
| 2026-11-02 | Module specified from owner's answers; AR forms catalogue and AR-i built. |
| 2026-11-02 | **PT-05**: request type removed; customer search-first with *Add as new customer* (decision 9); billing lines one-off / recurring with date range and Monthly default (decisions 8, 10). Retired IDs: `PT-17` (request type), `PT-21` and `PT-22` (billing / recurring variable sets → `PT-26`), `PT-18` (→ `PT-25` customer search), `REQ.request_type`, `REQ.billing_type`, `REQ.requested_invoice_date`, `REQ.period_start`, `REQ.period_end`, `REQ.frequency`, `REQ.first_billing_date`, `REQ.last_billing_date` (→ `RQL.*` line fields), `UA-REQ-invoice`, `UA-REQ-schedule` (→ `UA-RQL-invoice`, `UA-RQL-schedule`). |
| 2026-11-02 | **PT-05** (contract level): bill-to moved under the contract; contract chosen before billing lines as *Existing contract* / *New contract* / *No contract required*; no-contract shell per customer + department; billing lines carry the contract; customer billing hierarchy and contract related lists (decisions 11–14, D15, D16). New IDs: `PT-28`, `CUS-TREE`, `RL-CON-RQL`, `RL-CON-SCH`, `CON.line_count`, `REQ.contract_option`, `REQ.new_contract_*`, `CON.contract_type`, `CON.department`, `CON.bill_to_*`, `RQL.contract`. `PT-19` (bill-to) now sits inside `PT-20` (Contract and bill-to). No IDs retired. |
| 2026-11-04 | **REQ.department**: tooltip (ⓘ next to the label) on AR-i: *Auto-populated from the requester's department. Change it only if you are requesting for another department.* ServiceNow: variable **Tooltip** on the record producer variable; default value from the requester's department. Field stays editable. No new IDs. |
| 2026-11-06 | **AR-i finance coding** (decision 15): new request fields `REQ.cost_center`, `REQ.account_code`, `REQ.billing_type_code`, `REQ.vag`, `REQ.sub_bu`, `REQ.type_of_billing`; portal section `PT-29`; workspace Details section *Finance coding*. UI policies use a new schema `showIf` (also listed in the mapping doc). The column is `billing_type_code`, not `billing_type`, because `REQ.billing_type` was retired in PT-05 and IDs are never reused. |
| 2026-11-06 | Open question 10 (finance coding on the invoice) deferred by the owner: AR request → invoice field mapping will be done later. |
