# GIR — AR-ix GIRO authorisation

**Status:** In prototype
**Persona(s):** Project team (portal: AR-ix form); AR team (workspace: case, GIRO authorisations)
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → Project team · Portal → AR forms → AR-ix

## Purpose

Let project teams ask AR to **add or remove GIRO** (direct debit) on a contract, for rental, carpark or
other charges, and keep a history of GIRO authorisations per contract.

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | What is "directbankauth" | **GIRO** (direct debit authorisation). | 2026-11-10 |
| 2 | Case | AR-ix is a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-ix`), worked in the workspace like AR-i. | 2026-11-10 |
| 3 | Contract | The requester picks the customer, then an **existing contract**, or says it is **not listed** and gives the contract / tenancy agreement / reference number. An existing contract links the case at submit. Otherwise the AR officer **processes the contract's AR-i first**, then links the case manually with **Link contract**. | 2026-11-10 |
| 4 | Form order | **Contract first** (it prefills the applicant), then GIRO details. One invoice reference number field. | 2026-11-10 |
| 5 | Applicant | Applicant name / entity, email and mobile are **prefilled from the contract's bill-to** (D16) and can be changed. Name and email mandatory. | 2026-11-10 |
| 6 | Where GIRO is recorded | New table **GIRO authorisation** (`x_ar_giro_authorisation`), one record per authorisation, linked to contract and customer, status Active / Removed. Keeps the add / remove history (D20). | 2026-11-10 |
| 7 | Carpark | **One vehicle per form**: car plate, parking start and end dates. | 2026-11-10 |
| 8 | General information | Section 1 is the shared General information variable set (D19): requester name, department, email (SSO, read-only), CC list. | 2026-11-10 |

## Form (record producer "AR-ix GIRO authorisation")

Fields are free text unless stated. `*` = mandatory.

1. **General information** (all AR forms, D19): Requester name*, Email (SSO, read-only), Requesting department*, CC list (emails, comma-separated; these people can view the case on the portal).
2. **Contract and applicant**
   - Customer* (search; if AR doesn't have it, type its name).
   - Which contract is the GIRO for?* **Existing contract** (choice of the customer's contracts; shows active GIRO on it) or **Not listed / new** → Contract / tenancy agreement / reference number*.
   - Applicant name / entity*, Applicant email*, Applicant mobile (prefilled from the contract's bill-to).
   - Invoice reference number (optional; requirement to be confirmed).
3. **GIRO details**
   - Purpose* (Rental / Carpark / Others); Other purpose* when Others.
   - Type* (Add GIRO / Remove GIRO).
   - Rental only: Location*, Effective start date (* for Add), Effective end date.
   - Carpark only: Car plate*, Parking start date (* for Add), Parking end date.
   - Amount (Currency; * for Add), all purposes.
   - Supporting documents (attachments), Additional details.
   - End dates must be on or after start dates. Fields hidden by a choice are cleared.

## Workspace (AR team)

- Case list: *GIRO › AR-ix GIRO requests (open)*. Case Details tab: General information, Contract and applicant, GIRO details. Ribbon: GIRO, amount, contract (or *Not linked*).
- Side panel **GIRO setup** (`REQ-GIRO`): contract linked? (if not: *Process the AR-i that sets up this contract first, then link it*, with a contract picker that lists the matching reference first) → Activate / Remove GIRO and what it will create or end.
- UI actions:
  - **Link contract** (while contract is empty) → sets contract and customer; New → In progress.
  - **Activate GIRO** (type Add) → inserts an Active GIRO authorisation with the case's details; case → **Completed**; requester-visible comment.
  - **Remove GIRO** (type Remove) → sets the matching Active GIRO authorisations on the contract (same purpose; same car plate for carpark) to Removed; case → Completed. Error if none match.
  - Request info, Reject, Assign to me as for AR-i.
- Contract record: tab **GIRO authorisations**. Master data menu: *GIRO › Active GIRO / All GIRO authorisations*. Record history on every GIRO record.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "AR-ix GIRO authorisation" on `x_ar_request` (`PT-31`); variable sets General information (`PT-30`), Contract and applicant (`PT-32`), GIRO details (`PT-33`). UI policies per purpose and type; catalog client script on contract change prefills the applicant and shows active GIRO (`PT-34`, GlideAjax). Producer script sets `ar_form`, `short_description`, `watch_list` from `cc_list`. |
| Case fields | `x_ar_request`: `requester_name`, `requester_email`, `cc_list`, `giro_applicant_name/_email/_mobile`, `giro_invoice_ref`, `giro_purpose`, `giro_purpose_other`, `giro_type`, `giro_start_date`, `giro_end_date`, `giro_location`, `giro_carplate`, `giro_parking_start`, `giro_parking_end`, `giro_amount`, `giro_authorisation`. New state **Completed** (`completed`). |
| Table | `x_ar_giro_authorisation` (prefix GIR): status, customer, contract, purpose, purpose other, applicant name/email/mobile, invoice ref, amount, rental start/end/location, carplate, parking start/end, activated on, removed on, add request, remove request. Audit on. |
| UI actions | `UA-REQ-linkctr`, `UA-REQ-giroadd`, `UA-REQ-giroremove` (condition: `ar_form = AR-ix`, state open). |
| Portal | My requests and the ticket page show cases the user raised **or is CC'd on** (watch list); CC'd cases are tagged *CC*. Ticket page block `PT-35`. |
| ACL | CC'd users (watch list) read the case and its comments; only the requester and AR edit. |

## Demo data

- **TR-TA-2025-14** (Tanjong Retail Group, Facilities, retail unit tenancy): the worked example of a contract with active GIRO.
  - GIR0001002 **Active** rental, #01-23, 3 Jurong Gateway Road, SGD 4,800 (from ARQ0001011).
  - GIR0001003 **Removed** carpark SGL 1188 C (added by ARQ0001012, removed by ARQ0001013 when the vehicle changed).
  - GIR0001004 **Active** carpark SJK 7720 R, SGD 150 (from ARQ0001014).
  - Contract ribbon shows *Active GIRO 2*; each GIRO record and case has its Record history.
- **GIR0001001**: active rental GIRO on HL-2026-01 (Harbourline), for a Remove GIRO demo.
- **ARQ0001009** (ready to activate) and **ARQ0001010** (contract not on file; Link contract first) are open AR-ix cases.

## Out of scope / later

- Notifications to the applicant or CC list.
- GIRO bank forms / bank confirmation, deduction schedules and posting GIRO collections (deposits still come only from BSU, D7).
- Linking GIRO to invoices (with the AR request → invoice mapping, later).

## Open questions

1. What is the invoice reference number used for, and is it mandatory? (Owner)
2. Should Remove GIRO pick the specific GIRO authorisation (list of active ones) instead of matching by purpose / car plate? (Owner)
3. Is the amount per month (recurring deduction) or a cap? (Owner)
4. Does the AR officer need to verify the signed GIRO form (attachment check) before activating? (Owner)
5. Should CC'd people be able to comment, or only view? Prototype: they can comment. (Owner)

## Change log

| Date | Change |
|---|---|
| 2026-11-10 | Module created: AR-ix form, GIRO authorisation table, Link contract / Activate GIRO / Remove GIRO, case state Completed, CC visibility on the portal. New IDs `PT-30`–`PT-35`, `REQ-GIRO`, `REQ-LINKCTR`, `UA-REQ-linkctr`, `UA-REQ-giroadd`, `UA-REQ-giroremove`, `UA-GIR-save`, `RL-CON-GIR`, `RL-REQ-GIR`, `GIR.*`, `LST/RP/HDR/FRM-GIR`, new `REQ.*` fields above. |
| 2026-11-10 | Demo data: contract TR-TA-2025-14 with two active GIRO authorisations and one removed, from completed cases ARQ0001011–ARQ0001014; *Active GIRO* widget on the contract ribbon. New portal submissions now start at ARQ0001015. |
