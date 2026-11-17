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

**Context (client, [#8](https://github.com/veranzy/ServiceNowARdemo/issues/8) E8.4):** GIRO is removed at the end of
a contract or when the customer changes bank account details. For a bank change the project team raises an
AR-ix **Remove GIRO**, then a new AR-ix **Add GIRO** with the new details.

## Form (record producer "AR-ix GIRO authorisation")

Fields are free text unless stated. `*` = mandatory.

1. **General information** (all AR forms, D19): Requester name*, Email (SSO, read-only), Requesting department*, CC list (emails, comma-separated; these people can view the case on the portal).
2. **Select Customer** (decisions 12, 17)
   - Customer* (search; shows the customer name only). **Existing customers only**: no *add as new customer* on
     AR-ix (E8.1). Hint under the search: *Customer not found? Submit an AR-i to set up the customer first.* (`PT-48`).
3. **Select Contract** (decisions 12, 22; step retained, E8.12)
   - Which contract is the GIRO for?* **Existing contract**, **New contract** → Contract / tenancy agreement / reference number*,
     or **No contract required** → the customer's no-contract shell for the requesting department (linked at submit
     when it exists; otherwise AR links it).
   - **Existing contract list (decision 22, E8.5):** the customer's contracts (not No contract) whose **Department** is the
     form's *Department* (General information), **or** of which the requester is a **Contract owner** (CCI decision 10).
     Changing the Department clears a chosen contract that no longer qualifies. The contract's GIRO status and active
     case show under it (`PT-34`). AR-i is unchanged.
4. **GIRO details** (decisions 14, 15 amended, 18–21)
   - **Type of request*** first, set by the contract: new contract or no contract → *Add GIRO* only; existing contract →
     *Add GIRO* if it has no GIRO, *Remove GIRO* only if GIRO is active. Help text (owner's wording): "remove-ask payee to
     contact their bank to terminate, new-please inform payee to make payment until giro is up, officer will contact
     applicant to complete giro application form and to mail the bank endorsed completed form back".
   - **Contract / tenancy agreement / reference** (decisions 19, 24), optional, Add and Remove GIRO. Add GIRO: right
     after *Purpose of GIRO/DDA request*, so it appears or hides as the purpose changes; **hidden when Purpose = Carpark**
     (carpark has no contract or tenancy agreement, E8.10). Remove GIRO: after *Type of request*.
   - **Remove GIRO:** the reference, then **Effective end date*** (decision 18, E8.8). Nothing else.
   - **Add GIRO:** Purpose of GIRO/DDA request* (Rental / Carpark / Others); Contract / tenancy agreement / reference;
     Other purpose* when Others; **Effective start date*** (every purpose, no end date; decision 18, E8.7). Heading **Customer**: **Customer name***, **Customer
     email***, **Customer mobile** (decision 20, E8.6; prefilled from the contract's or shell's bill-to). Remarks.
     - Rental: Location*, Amount.
     - Carpark: Car plate* (one vehicle per form), Location*, Amount (decision 21, E8.15).
     - Others: nothing more (decision 21, E8.13).
   - Amount is free text, optional, no linkages (decision 13). Fields hidden by a choice are cleared.
5. **Attachments** (decision 16, as AR-i): Supporting documents, optional. Add and Remove GIRO.

Section 6 *Others* (Form number) was removed on 2026-11-17 (decision 23, E8.14).

## Workspace (AR team)

- List menu *AR requests*: All AR-ix (UIX decision 15, amended). List menu *GIRO*: All AR-ix GIRO cases, Contracts with GIRO active.
- AR-ix case: Details tab (General information, Select Customer, Select Contract, GIRO details, Attachments: the AR-ix form view `REQ-FV-ARIX`); ribbon (GIRO, amount, contract and its GIRO status); tab **GIRO history** (AR-ix cases on the same contract).
- Side panel **GIRO setup** (`REQ-GIRO`): contract set? (if not: for a new contract *process the AR-i that sets up this contract first, then set it as Contract on this case and Save*; for No contract required, the customer's no-contract shell for the department) → the contract's GIRO status and active case → reminder: *Update GIRO on the contract*, then set State to Closed complete.
- Case actions (AR-00 decision 4): **Assign to me** and **Save** only. AR sets **Contract** on the case and saves (the customer follows the contract; replaces *Link contract*), and closes the case with the **State dropdown** (Closed complete / Closed incomplete / Cancelled). *Link contract*, *Complete*, *Request info* and *Reject* are retired; ~~Activate GIRO~~ / ~~Remove GIRO~~ retired 2026-11-12.
- **Updating GIRO (manual, decision 11):** on the contract record AR sets **GIRO status** (Active / Not active) and **Active GIRO case** (choice of the Add GIRO AR-ix cases on that contract). Active needs a case; Not active clears it. Record history (audit) keeps every change; the GIRO history tab lists the cases.
- Contract record: header *GIRO* (Active + case link, or Not active), ribbon widget, section **GIRO** on the form, tab **GIRO history** (`CON-GIRO`) with each case marked Active / Open / Contract to link / or its closed state (Closed complete, Closed incomplete, Cancelled). GIRO also shows on no-contract shells.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "AR-ix GIRO authorisation" on `x_ar_request` (`PT-31`); variable sets General information (`PT-30`), Select Customer (`PT-44`), Select Contract (`PT-32`, no-contract message `PT-45`), GIRO details (`PT-33`), Attachments (`PT-46`); Others (`PT-47`) retired 2026-11-17. Customer search hint `PT-48` (no new customer). Reference qualifier on `contract` (Existing contract): `customer` = the chosen customer, `contract_type` = contract, and `department` = the form's department OR `contract_owners` contains the requester (decision 22). UI policies per type and purpose (`giro_reference` hidden for Carpark); catalog client script on contract or department change filters the Type choices, clears a contract that no longer qualifies, prefills the customer name / email / mobile and shows active GIRO (`PT-34`, GlideAjax). Producer script sets `ar_form`, `short_description`, `watch_list` from `cc_list`, and for No contract required `contract` = the customer's no-contract shell for the department when it exists. |
| Case fields | `x_ar_request`: `requester_name`, `requester_email`, `cc_list`, `giro_type`, `giro_reference`, `giro_purpose`, `giro_purpose_other`, `giro_applicant_name/_email/_mobile` (labels Customer name / email / mobile), `giro_remarks`, `giro_start_date` (Add), `giro_end_date` (Remove), `giro_carplate`, `giro_location`, `giro_amount` (String, free text). Retired 2026-11-17: `giro_tenancy_agreement`, `giro_parking_start`, `giro_parking_end`, `giro_contract_ref`, `giro_invoice_ref`, `giro_others_remarks`, `giro_form_number`. Case states: AR-00 decision 4. |
| Contract fields | `x_ar_contract.giro_status` (Choice: Active / Not active) and `x_ar_contract.giro_case` (Reference → `x_ar_request`, reference qualifier `ar_form = AR-ix`, `giro_type = add`, `contract = current`), **editable by `x_ar.ar_team`** (decision 11). Audit on, so Record history shows every change. |
| UI policy / business rule | `giro_case` mandatory when `giro_status` = Active; before update: clear `giro_case` when `giro_status` = Not active. One active GIRO per contract is guaranteed by the single `giro_case` field. |
| UI actions | Assign to me and Save only (AR-00 decision 4). Retired: `UA-REQ-giroadd`, `UA-REQ-giroremove` (2026-11-12), `UA-REQ-linkctr`, `UA-REQ-girocomplete` (2026-11-16). Before-update business rule: when `contract` changes on an AR-ix case, set `customer` from the contract. |
| Related list | `CON-GIRO` / `REQ-GIROHIST`: `x_ar_request` where `contract` = the contract and `ar_form = AR-ix`. |
| Portal | Ticket page block `PT-35` (GIRO request summary and outcome). My requests, CC visibility and the ticket page itself: [AR-00](../AR-00/README.md). |

## Demo data

- AR-ix cases come from `data/AR_form.csv` (UIX decision 13): ARQ0001004 Add rental on TR-TA-2025-14, ARQ0001005 Add carpark on a new contract, ARQ0001006 Add others with no contract, ARQ0001007 completed Add rental on **HL-2026-01** (GIRO active from it, set as AR would by hand), ARQ0001008 Remove GIRO on HL-2026-01 (effective end date).
- Contract owners (decision 22): Priya Nair (portal user, Digital) owns HL-2026-01 (Logistics) and TR-TA-2025-14 (Facilities), so with Department = Digital she still sees those; HL-2026-02 shows only with Department = Logistics.
- Workspace case page: Details tab is the AR-ix form view (`REQ-FV-ARIX`), sections as on the portal. New portal cases continue the numbering (ARQ0001010 onwards).

## Out of scope / later

- Automatic contract update from the AR-ix case (next major release, [issue #4](https://github.com/veranzy/ServiceNowARdemo/issues/4)).
- Notifications to the applicant or CC list.
- GIRO bank forms / bank confirmation, deduction schedules and posting GIRO collections (deposits still come only from BSU, D7).
- Linking GIRO to invoices (with the AR request → invoice mapping, later).
