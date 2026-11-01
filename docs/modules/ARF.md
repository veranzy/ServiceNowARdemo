# ARF — AR forms (portal catalogue) and AR-i New AR request

**Status:** In prototype
**Persona(s):** Project team (portal) submits; AR team (workspace) processes
**Demo:** Portal → *AR forms* (16 tiles) → **AR-i New AR request**. Workspace → the AR request record
(*Customer setup* panel), customer record (billing contacts, documents, billing schedules), list menu
*Recurring billing*.

## Purpose

The project team asks Accounts Receivable for billing through a catalogue of **16 AR forms, AR-i to
AR-xvi**. AR-i is the starting point for a customer relationship: it captures the first billing, an
ad-hoc billing or a recurring billing, plus the customer's documents and the department's bill-to
person. AR links the request to the customer master (or creates/updates it) and files the documents on
the customer, so the project team gives them **once**. Recurring billing is set up once from AR-i and
then run by AR in the workspace.

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | AR forms | 16 forms numbered in Roman numerals **AR-i … AR-xvi**. Only AR-i is detailed; AR-ii … AR-xvi are placeholders ("To be defined"). | 2026-11-02 |
| 2 | AR-i request types | **1st AR request**, **Ad-hoc AR**, **Recurring AR**. | 2026-11-02 |
| 3 | Customer on AR-i | Pick an existing customer, or tick **New customer** and enter name, UEN, registered address. AR verifies, then links or creates the customer record. | 2026-11-02 |
| 4 | Documents given once | Stored on the **customer**, not the request: **Signed contract / PO**, **Company registration (ACRA / UEN)**, **Billing contact & address form**. AR-i shows what is already on file and only asks for what's missing. | 2026-11-02 |
| 5 | Where contracts are | AR-i asks where the signed contract is kept: attached to this form, already with AR, document repository link, or physical file. AR records it on the contract (`contract_location`). | 2026-11-02 |
| 6 | Departments | **11 operational departments.** A customer can be billed differently per department: each department may bill a **different person** at the same company → **billing contact per customer per department**. | 2026-11-02 |
| 7 | Recurring billing | AR-i (Recurring) is submitted **once**. AR sets up a **billing schedule** (frequency, amount per period, first and last billing date). The workspace lists periods due and AR clicks **Raise invoice** for each (draft invoice). No automatic invoice creation. | 2026-11-02 |

Assumption to confirm: "where their contracts are" means the storage location of the signed contract
(decision 5).

## User stories

- As a project manager, I want one form to ask AR to bill a new customer, so that AR has the customer,
  contract and bill-to details in one go.
- As a project manager, I want to see which customer documents AR already has, so that I don't send
  them again.
- As a project manager, I want to submit a recurring billing once, so that I don't raise a form every
  month.
- As an AR team member, I want to link an AR-i to the customer master with one action, filing its
  documents and the department's billing contact, so that later requests reuse them.
- As an AR team member, I want a list of recurring billing periods that are due, so that I raise each
  invoice on time.

## Screens and flow

**Portal**
1. *AR forms* catalogue: 16 tiles. AR-i is active; AR-ii … AR-xvi show "To be defined".
2. AR-i form, in sections:
   - **Request type**: 1st AR request / Ad-hoc AR / Recurring AR.
   - **Customer**: existing customer, or New customer (name, UEN, registered address).
   - **Department and bill-to**: requesting department (11). If the customer has no billing contact for
     that department, or "Update bill-to" is ticked: contact name, email, phone, billing address.
   - **Contract**: existing contract (optional), contract location and link/reference.
   - **Billing**: what to invoice, amount, preferred invoice date, service period, PO number. For
     Recurring: frequency, amount per period, first and last billing date.
   - **Documents**: checklist of the three customer documents showing *On file* or *Needed*; upload
     only what's needed.
3. My requests / ticket page as before.

**Workspace**
1. AR request record → **Customer setup** panel: checklist (customer linked, billing contact for the
   department, documents filed, contract location recorded, billing schedule for Recurring).
   - UI action **Link to customer**: links an existing customer, or creates the customer from the new
     customer details; upserts the department billing contact; files the documents on the customer;
     records the contract location.
   - UI action **Set up billing schedule** (Recurring only): creates the schedule.
2. Customer record → related lists **Billing contacts** (per department), **Customer documents**,
   **Billing schedules**.
3. Billing schedule record → periods with status (Due / Upcoming / Invoiced) and **Raise invoice**.
4. List menu → *Recurring billing*: Billing schedules, Billing periods due.

## ServiceNow mapping

| Item | Build |
|---|---|
| Portal catalogue | Service catalog category "AR forms" with 16 record producers (AR-i … AR-xvi); AR-ii … AR-xvi inactive until defined. |
| AR-i | Record producer on `x_ar_request` with variable sets: Request type, Customer, Department & bill-to, Contract, Billing, Recurring, Documents. UI policies show/hide sections by request type and *New customer*. Catalog client script reads documents on file (GlideAjax). |
| `x_ar_request` | New fields: `ar_form`, `request_type`, `department`, new-customer fields, bill-to fields, `contract_location`, `contract_location_ref`, recurring fields. |
| `x_ar_billing_contact` | Customer + department → contact name, email, phone, billing address. Unique per customer + department. |
| `x_ar_customer_document` | Customer documents: type (contract/PO, ACRA, billing form), file (sys_attachment), contract (optional), department (billing form), source AR request. |
| `x_ar_billing_schedule` | Customer, contract, department, description, frequency, amount per period, first/last billing date, source AR request; periods computed (or a child table `x_ar_billing_period` in the build). |
| UI actions | *Link to customer*, *Set up billing schedule* on AR request; *Raise invoice* on billing period. |

## Out of scope / later

- AR-ii … AR-xvi content.
- Automation after submission (assignment, notifications) — still to be defined by the owner.
- Automatic invoice creation from schedules (decision 7 says AR raises each).
- Document expiry / re-validation (e.g. ACRA profile older than 12 months).

## Open questions

1. Confirm decision 5's reading of "where their contracts are".
2. Is a billing contact needed per department for every customer, or only when it differs from the
   customer's default?
3. Should an Ad-hoc AR for a customer with no contract be allowed?
4. Who maintains the list of 11 departments (fixed choice list vs. a department table)?

## Change log

| Date | Change |
|---|---|
| 2026-11-02 | Module specified from owner's answers; AR forms catalogue and AR-i built. |
