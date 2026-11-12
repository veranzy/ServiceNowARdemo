# GIR — AR-ix GIRO authorisation

**Status:** In prototype
**Persona(s):** Project team (portal: AR-ix form); AR team (workspace: AR-ix case, contract GIRO status)
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → Project team · Portal → AR forms → AR-ix

## Purpose

Let project teams ask AR to **add or remove GIRO** (direct debit) on a contract, for rental, carpark or
other charges. The AR-ix case **is** the GIRO record: once approved and linked, the contract shows
*GIRO active* with that case. The contract's AR-ix cases are its GIRO history.

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | What is "directbankauth" | **GIRO** (direct debit authorisation). | 2026-11-10 |
| 2 | Case | AR-ix is a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-ix`), worked in the workspace like AR-i. | 2026-11-10 |
| 3 | Contract | The requester picks the customer, then an **existing contract**, or says it is **not listed** and gives the contract / tenancy agreement / reference number. An existing contract links the case at submit. Otherwise the AR officer **processes the contract's AR-i first**, then links the case manually with **Link contract**. | 2026-11-10 |
| 4 | Form order | **Contract first** (it prefills the applicant), then GIRO details. One invoice reference number field. | 2026-11-10 |
| 5 | Applicant | Applicant name / entity, email and mobile are **prefilled from the contract's bill-to** (D16) and can be changed. Name and email mandatory. | 2026-11-10 |
| 6 | Where GIRO is recorded | ~~New table GIRO authorisation~~ (2026-11-10, **replaced 2026-11-11**). The design is **contract › AR-ix case**: the contract has **GIRO status** (Active / Not active) and **Active GIRO case** (reference to the approved AR-ix case). No separate GIRO table (D21). | 2026-11-11 |
| 9 | One GIRO per contract | A contract has **at most one active GIRO** at any time. *Add GIRO* on a contract with GIRO active is **blocked** (portal and workspace); the requester submits *Remove GIRO* first. Replacing instead of blocking is an open question ([issue #2](https://github.com/veranzy/ServiceNowARdemo/issues/2)). | 2026-11-11 |
| 10 | Remove GIRO | Ends whatever GIRO is active on the contract (purpose and car plate are recorded on the case but not matched). | 2026-11-11 |
| 7 | Carpark | **One vehicle per form**: car plate, parking start and end dates. | 2026-11-10 |
| 8 | General information | Section 1 is the shared General information variable set (D19): requester name, department, email (SSO, read-only), CC list. | 2026-11-10 |

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
| Portal | My requests and the ticket page show cases the user raised **or is CC'd on** (watch list); CC'd cases are tagged *CC*. Ticket page block `PT-35`. |
| ACL | CC'd users (watch list) read the case and its comments; only the requester and AR edit. |

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

## Open questions

1. What is the invoice reference number used for, and is it mandatory? (Owner)
2. ~~Should Remove GIRO pick the specific GIRO authorisation?~~ No longer applies: only one GIRO can be active per contract (decision 9).
3. Is the amount per month (recurring deduction) or a cap? (Owner)
4. Does the AR officer need to verify the signed GIRO form (attachment check) before activating? (Owner)
5. Should CC'd people be able to comment, or only view? Prototype: they can comment. (Owner)
6. Should a new *Add GIRO* **replace** the active GIRO instead of being blocked? (Owner; [GitHub issue #2](https://github.com/veranzy/ServiceNowARdemo/issues/2))

## Change log

| Date | Change |
|---|---|
| 2026-11-10 | Module created: AR-ix form, GIRO authorisation table, Link contract / Activate GIRO / Remove GIRO, case state Completed, CC visibility on the portal. New IDs `PT-30`–`PT-35`, `REQ-GIRO`, `REQ-LINKCTR`, `UA-REQ-linkctr`, `UA-REQ-giroadd`, `UA-REQ-giroremove`, `UA-GIR-save`, `RL-CON-GIR`, `RL-REQ-GIR`, `GIR.*`, `LST/RP/HDR/FRM-GIR`, new `REQ.*` fields above. |
| 2026-11-10 | Demo data: contract TR-TA-2025-14 with two active GIRO authorisations and one removed, from completed cases ARQ0001011–ARQ0001014; *Active GIRO* widget on the contract ribbon. New portal submissions now start at ARQ0001015. |
| 2026-11-11 | **Owner change: contract › AR-ix, no GIRO table.** GIRO is a contract status (`CON.giro_status`, `CON.giro_case`) set when the AR-ix case is approved and linked; at most one active GIRO per contract, a second Add is blocked (decisions 6, 9, 10; D21 replaces D20's GIRO table). **Retired IDs:** the whole `x_ar_giro_authorisation` table (`GIR.*`, `LST-GIR`, `RP-GIR`, `HDR-GIR`, `FRM-GIR`), `UA-GIR-save`, `RL-CON-GIR`, `RL-REQ-GIR`, `REQ.giro_authorisation`. New IDs: `CON.giro_status`, `CON.giro_case`, `CON-GIRO`, `REQ-GIROHIST`. Demo data reworked (TR-TA-2025-14 history ARQ0001011–ARQ0001014, HL-2026-01 from ARQ0001015). Open question 6 (replace vs block) logged as GitHub issue #2. |
| 2026-11-12 | AR-i now shows the contract's GIRO status read-only with a reminder to raise AR-ix (ARF decision 16, D22). |
