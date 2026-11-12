# AR-ix — GIRO authorisation

**Status:** In prototype
**Persona(s):** Project team (portal: AR-ix form); AR team (workspace: AR-ix case, contract GIRO status)
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → Project team · Portal → AR forms → AR-ix

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md) (numbers carried over from the old GIR
module), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), [CHANGELOG.md](CHANGELOG.md).
Shared form parts (General information, My requests, CC on the portal): [AR-00](../AR-00/README.md).

## Purpose

Let project teams ask AR to **add or remove GIRO** (direct debit) on a contract, for rental, carpark or
other charges. The AR-ix form is **a request**: it never changes the contract by itself. The AR officer
updates the contract's *GIRO status* and *Active GIRO case* by hand on the contract record, linking it to
the AR-ix case, then completes the case (decision 11). The contract's AR-ix cases are its GIRO history.
Automating the contract update is for the next major release ([issue #4](https://github.com/veranzy/ServiceNowARdemo/issues/4)).

## Form (record producer "AR-ix GIRO authorisation")

Fields are free text unless stated. `*` = mandatory.

1. **General information** (all AR forms, D19): Requester name*, Email (SSO, read-only), Requesting department*, CC list (emails, comma-separated; these people can view the case on the portal).
2. **Select Customer** (decision 12)
   - Customer* (search; shows the customer name only). If AR doesn't have it: **add as new customer** (name only); AR sets it up when it processes the contract's AR-i.
3. **Select Contract** (decision 12)
   - Which contract is the GIRO for?* **Existing contract** (choice of the customer's contracts; shows the contract's GIRO status and active case), **New contract** → Contract / tenancy agreement / reference number*, or **No contract required** → the customer's no-contract shell for the requesting department (linked at submit when it exists; otherwise AR links it). New customers see New contract and No contract required only.
4. **GIRO details** (decisions 14, 15)
   - **Type of request*** (field `giro_type`, formerly labelled Type) first, set by the contract: new contract or no contract → *Add GIRO* only; existing contract → *Add GIRO* if it has no GIRO, *Remove GIRO* only if GIRO is active. Help text (owner's wording): "remove-ask payee to contact their bank to terminate, new-please inform payee to make payment until giro is up, officer will contact applicant to complete giro application form and to mail the bank endorsed completed form back".
   - **Remove GIRO:** no further fields in this section.
   - **Add GIRO:** Purpose of GIRO/DDA request* (field `giro_purpose`, formerly Purpose: Rental / Carpark / Others); Other purpose* when Others. Applicant name / entity*, Applicant email*, Applicant mobile (prefilled from the contract's or shell's bill-to). Remarks.
     - Rental: Location*, Tenancy agreement, Effective start date*, Effective end date, Amount.
     - Carpark: Car plate* (one vehicle per form), Parking start date*, Parking end date, Amount.
     - Others: Contract reference number, Invoice reference number (open question 1), Amount, Remarks.
   - Amount is free text, optional, no linkages (decision 13). End dates must be on or after start dates. Fields hidden by a choice are cleared.
5. **Attachments** (decision 16, as AR-i): Supporting documents, optional. Add and Remove GIRO.
6. **Others** (decision 16, as AR-i, hint *Optional. Where these fields finally go is still to be decided.*): Form number, optional, to be verified (open question 8). Every type and purpose.

## Workspace (AR team)

- List menu *GIRO*: AR-ix GIRO requests (open), All AR-ix GIRO cases, Contracts with GIRO active.
- AR-ix case: Details tab (General information, Customer and contract, GIRO details, Others); ribbon (GIRO, amount, contract and its GIRO status); tab **GIRO history** (AR-ix cases on the same contract).
- Side panel **GIRO setup** (`REQ-GIRO`): contract linked? (if not: for a new contract *process the AR-i that sets up this contract first, then link it*; for No contract required, link the customer's no-contract shell; the picker lists the matching reference, the customer and the department first) → the contract's GIRO status and active case → reminder: *Update GIRO on the contract*, then Complete.
- UI actions:
  - **Link contract** (while contract is empty) → sets contract and customer; New → In progress.
  - **Complete** (`UA-REQ-girocomplete`, any open AR-ix case; primary once the contract is linked) → case **Completed** with a system note. **No check** on the contract (decision 11).
  - ~~Activate GIRO~~ / ~~Remove GIRO~~: retired 2026-11-12.
  - Request info, Reject, Assign to me as for AR-i.
- **Updating GIRO (manual, decision 11):** on the contract record AR sets **GIRO status** (Active / Not active) and **Active GIRO case** (choice of the Add GIRO AR-ix cases on that contract). Active needs a case; Not active clears it. Record history (audit) keeps every change; the GIRO history tab lists the cases.
- Contract record: header *GIRO* (Active + case link, or Not active), ribbon widget, section **GIRO** on the form, tab **GIRO history** (`CON-GIRO`) with each case marked Active / Completed / Open / Contract to link / Rejected. GIRO also shows on no-contract shells.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "AR-ix GIRO authorisation" on `x_ar_request` (`PT-31`); variable sets General information (`PT-30`), Select Customer (`PT-44`), Select Contract (`PT-32`, no-contract message `PT-45`), GIRO details (`PT-33`), Attachments (`PT-46`), Others (`PT-47`). UI policies per type and purpose; catalog client script on contract change filters the Type choices, prefills the applicant and shows active GIRO (`PT-34`, GlideAjax). Producer script sets `ar_form`, `short_description`, `watch_list` from `cc_list`, and for No contract required `contract` = the customer's no-contract shell for the department when it exists. |
| Case fields | `x_ar_request`: `requester_name`, `requester_email`, `cc_list`, `giro_type`, `giro_purpose`, `giro_purpose_other`, `giro_applicant_name/_email/_mobile`, `giro_remarks`, `giro_location`, `giro_tenancy_agreement`, `giro_start_date`, `giro_end_date`, `giro_contract_ref`, `giro_invoice_ref`, `giro_others_remarks`, `giro_form_number`, `giro_carplate`, `giro_parking_start`, `giro_parking_end`, `giro_amount` (String, free text). New state **Completed** (`completed`). |
| Contract fields | `x_ar_contract.giro_status` (Choice: Active / Not active) and `x_ar_contract.giro_case` (Reference → `x_ar_request`, reference qualifier `ar_form = AR-ix`, `giro_type = add`, `contract = current`), **editable by `x_ar.ar_team`** (decision 11). Audit on, so Record history shows every change. |
| UI policy / business rule | `giro_case` mandatory when `giro_status` = Active; before update: clear `giro_case` when `giro_status` = Not active. One active GIRO per contract is guaranteed by the single `giro_case` field. |
| UI actions | `UA-REQ-linkctr`, `UA-REQ-girocomplete` (condition: `ar_form = AR-ix`, state open). Retired: `UA-REQ-giroadd`, `UA-REQ-giroremove`. |
| Related list | `CON-GIRO` / `REQ-GIROHIST`: `x_ar_request` where `contract` = the contract and `ar_form = AR-ix`. |
| Portal | Ticket page block `PT-35` (GIRO request summary and outcome). My requests, CC visibility and the ticket page itself: [AR-00](../AR-00/README.md). |

## Demo data

- AR-ix cases come from `data/AR_form.csv` (UIX decision 13): ARQ0001004 Add rental on TR-TA-2025-14, ARQ0001005 Add carpark on a new contract, ARQ0001006 Add others with no contract, ARQ0001007 completed Add rental on **HL-2026-01** (GIRO active from it, set as AR would by hand), ARQ0001008 Remove GIRO on HL-2026-01.
- Workspace case page: Details tab is the AR-ix form view (`REQ-FV-ARIX`), sections as on the portal. New portal cases continue the numbering (ARQ0001009 onwards).

## Out of scope / later

- Automatic contract update from the AR-ix case (next major release, [issue #4](https://github.com/veranzy/ServiceNowARdemo/issues/4)).
- Notifications to the applicant or CC list.
- GIRO bank forms / bank confirmation, deduction schedules and posting GIRO collections (deposits still come only from BSU, D7).
- Linking GIRO to invoices (with the AR request → invoice mapping, later).
