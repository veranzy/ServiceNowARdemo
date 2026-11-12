# AR-ix — GIRO authorisation

**Status:** In prototype
**Persona(s):** Project team (portal: AR-ix form); AR team (workspace: AR-ix case, contract GIRO status)
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → Project team · Portal → AR forms → AR-ix

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md) (numbers carried over from the old GIR
module), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), [CHANGELOG.md](CHANGELOG.md).
Shared form parts (General information, My requests, CC on the portal): [AR-00](../AR-00/README.md).

## Purpose

Let project teams ask AR to **add or remove GIRO** (direct debit) on a contract, for rental, carpark or
other charges. The AR-ix case **is** the GIRO record: once approved and linked, the contract shows
*GIRO active* with that case. The contract's AR-ix cases are its GIRO history.

## Form (record producer "AR-ix GIRO authorisation")

Fields are free text unless stated. `*` = mandatory.

1. **General information** (all AR forms, D19): Requester name*, Email (SSO, read-only), Requesting department*, CC list (emails, comma-separated; these people can view the case on the portal).
2. **Contract and applicant**
   - Customer* (search; if AR doesn't have it, type its name).
   - Which contract is the GIRO for?* **Existing contract** (choice of the customer's contracts; shows the contract's GIRO status and active case) or **Not listed / new** → Contract / tenancy agreement / reference number*.
   - Validation: *Add GIRO* on a contract with GIRO active, or *Remove GIRO* on a contract without, is rejected on the contract field (decision 9).
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

- List menu *GIRO*: AR-ix GIRO requests (open), All AR-ix GIRO cases, Contracts with GIRO active.
- AR-ix case: Details tab (General information, Contract and applicant, GIRO details); ribbon (GIRO, amount, contract and its GIRO status); tab **GIRO history** (AR-ix cases on the same contract).
- Side panel **GIRO setup** (`REQ-GIRO`): contract linked? (if not: *Process the AR-i that sets up this contract first, then link it*, with a contract picker that lists the matching reference first) → the contract's GIRO status and active case → Activate / Remove GIRO, or why it is blocked.
- UI actions:
  - **Link contract** (while contract is empty) → sets contract and customer; New → In progress.
  - **Activate GIRO** (type Add) → contract *GIRO status* = Active, *Active GIRO case* = this case; case → **Completed**; requester-visible comment. Blocked if the contract already has GIRO active.
  - **Remove GIRO** (type Remove) → contract *GIRO status* = Not active, *Active GIRO case* cleared; system note on the case that was active; case → Completed. Blocked if GIRO is not active.
  - Request info, Reject, Assign to me as for AR-i.
- Contract record: header *GIRO* (Active + case link, or Not active), ribbon widget, section **GIRO** on the form, tab **GIRO history** (`CON-GIRO`) with each case marked Active / Ended / Removed GIRO / Open / Rejected.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "AR-ix GIRO authorisation" on `x_ar_request` (`PT-31`); variable sets General information (`PT-30`), Contract and applicant (`PT-32`), GIRO details (`PT-33`). UI policies per purpose and type; catalog client script on contract change prefills the applicant and shows active GIRO (`PT-34`, GlideAjax). Producer script sets `ar_form`, `short_description`, `watch_list` from `cc_list`. |
| Case fields | `x_ar_request`: `requester_name`, `requester_email`, `cc_list`, `giro_applicant_name/_email/_mobile`, `giro_invoice_ref`, `giro_purpose`, `giro_purpose_other`, `giro_type`, `giro_start_date`, `giro_end_date`, `giro_location`, `giro_carplate`, `giro_parking_start`, `giro_parking_end`, `giro_amount`. New state **Completed** (`completed`). |
| Contract fields | `x_ar_contract.giro_status` (Choice: Active / Not active, read-only) and `x_ar_contract.giro_case` (Reference → `x_ar_request`, read-only), set only by the UI actions. Audit on, so Record history shows every change. |
| Business rule | Before update on `x_ar_contract`: abort if `giro_status` changes to Active while another case is already active (one GIRO per contract). |
| UI actions | `UA-REQ-linkctr`, `UA-REQ-giroadd`, `UA-REQ-giroremove` (condition: `ar_form = AR-ix`, state open). |
| Related list | `CON-GIRO` / `REQ-GIROHIST`: `x_ar_request` where `contract` = the contract and `ar_form = AR-ix`. |
| Portal | Ticket page block `PT-35` (GIRO request summary and outcome). My requests, CC visibility and the ticket page itself: [AR-00](../AR-00/README.md). |

## Demo data

- **TR-TA-2025-14** (Tanjong Retail Group, Facilities, retail unit tenancy): the worked example. GIRO **Active** from **ARQ0001013**.
  - ARQ0001011 Add GIRO rental SGD 4,500 (completed; later *Ended*).
  - ARQ0001012 Remove GIRO rental (completed): rent revised.
  - ARQ0001013 Add GIRO rental SGD 4,800 (completed; **active**).
  - ARQ0001014 Add GIRO carpark SJK 7720 R (open, **blocked**: GIRO already active).
- **HL-2026-01** (Harbourline): GIRO active from ARQ0001015, for a Remove GIRO demo.
- **ARQ0001009** (ready to activate on NB-2026-05) and **ARQ0001010** (contract not on file; Link contract first) are open AR-ix cases. New portal submissions start at ARQ0001016.

## Out of scope / later

- Notifications to the applicant or CC list.
- GIRO bank forms / bank confirmation, deduction schedules and posting GIRO collections (deposits still come only from BSU, D7).
- Linking GIRO to invoices (with the AR request → invoice mapping, later).
