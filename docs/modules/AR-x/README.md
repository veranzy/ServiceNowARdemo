# AR-x — Refund (payment / journal) (AR10)

**Status:** In prototype
**Persona(s):** Project team (portal), AR team (workspace)
**Demo:** portal → AR forms → **AR-x Refund (payment / journal)** (`#/portal/form/AR-x`); workspace → AR requests →
**All AR-x** (demo case ARQ0001023) and **Open AR10 tasks**. The AR-v Collections form's "Please raise a AR10" link opens it.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Requirement: [issue #14](https://github.com/veranzy/ServiceNowARdemo/issues/14).

## Purpose

A refund made either as a **payment** to a beneficiary / vendor, or as a **journal** (forfeiture to state,
reclassification). The requester lists the payees and amounts and uploads the AR10 Excel template. The submission is one
AR request case; **each filled Excel row becomes an AR10 task**, and AR checks the tasks against the payee rows typed on
the form. ("Also refund – need to check with users": the purpose is still to be confirmed, open question 1.)

## User stories

- As a project team member, I want to list the payees and amounts and attach the AR10 Excel, so that AR can pay or journal them.
- As a project team member, I want to mark a request as expedited and say why.
- As an AR officer, I want one task per Excel row and a check of each row against the payees on the form, so that I spot differences before paying.

## Screens and flow

**Portal form** (`PT-70`), sections (titles assumed, open question 3):

1. **General information** (shared variable set, D19).
2. **Payee and amount** (`PT-71`): multi-row set, 1 to 99 rows, *+ Add row* (`UA-PT-addpayee`), footer *Total Amount*.
   | Column | Type | Mandatory |
   |---|---|---|
   | Name of Beneficiary /Vendor | String | Yes |
   | Amount (SGD) | Currency, > 0 | Yes |
3. **Expedited** (`PT-72`): *Expedited* Yes / No, default No. **Yes** shows *Please provide an explanation on why this is an
   urgent request.* (help: To explain why this request is urgent), **mandatory** (decision 4).
4. **Remarks**: free text, optional.
5. **Acknowledgement**: checkbox *I confirm the information above is correct.* (placeholder wording), **optional** (decision 5).
6. **Supporting documents**: **Excel template** (`PT-69`, shared with AR-ii: Upload Excel, Use sample file, Download
   template, "*n* rows read") and other attachments.

**AR10 Excel template** (#14, client wording). The template has a payment request block and a journal request block:

| S/N | Collection reference no. (e.g., receipt no./ Deposit ID/ Invoice No.) | Case report no. (Applicable for Seized monies/ Cash bail/ FUPO) | Refund reason (select from drop down) | To debit from Deposit a/c (select from drop down | Name of Beneficiary /Vendor | NRIC/UEN No. | Amount (SGD) | If amount for refund is not in SGD (if applicable) | To debit from Deposit a/c (select from dropdown) | Account Code | Cost Centre | Amount (SGD) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Refund reasons in the template: *Payment to beneficiary/ vendor* (payment columns), *Forfeiture to state* and
*Reclassification* (journal columns). Processing (decision 3): each row with a payee or an amount becomes a task; the task
keeps **Name of Beneficiary /Vendor** and **Amount (SGD)** (payment amount, or the journal amount when the payment amount
is empty; journal rows have no payee).

**Workspace:**

- List **All AR-x** (`LST-REQ-AR10`); list **Open AR10 tasks** (`LST-PYT`).
- Case page (`REQ-FV-AR10`): header (no customer or contract); ribbon *AR10 tasks closed*, *On the form* (Excel rows
  matching a payee row, x of y) and *Form total* with the Excel total; Details: Case (Request value = the form's Total
  Amount), 1. General information, 3. Expedited, 4. Remarks, 5. Acknowledgement, 6. Supporting documents; tabs
  **AR10 tasks** (`RL-REQ-PYT`, with *On the form* Yes / No, `PYT.on_form`) and **Payee and amount** (`RL-REQ-PYR`, with
  *In the Excel* Yes / No, `PYR.in_excel`). The check compares payee (case and spaces ignored) and amount; it changes nothing.
- AR10 task page (`RP-PYT`): S/N, payee, amount (read-only); **State**, **Assigned to**; Save (`UA-PYT-save`).
- Ticket page (`PT-73`): the AR10 tasks with their state.

## ServiceNow mapping

- Record producer **AR-x Refund (payment / journal)** on `x_ar_request` (`ar_form = AR-x`); variables `expedited`,
  `urgent_explanation` (UI policy: shown and mandatory when expedited = yes), `remarks`, `acknowledgement`; multi-row set
  to `x_ar_ar10_payee` (`PYR.*`).
- Table **`x_ar_ar10_task`** (extends Task, prefix PYT): `ar_request`, `row_number`, `payee_name`, `amount`, `state`,
  `assigned_to` (`PYT.*`); calculated *On the form*.
- Excel processing: import set on the attachment (data source type File, transform map into `x_ar_ar10_task`), run by
  the producer's flow. Generated detail: `SERVICENOW_MAPPING.md`, `docs/BUILD_NOTES.md`.

## Out of scope / later

- Keeping the other Excel columns on the task (collection reference, case report no., refund reason, debit account,
  NRIC/UEN, account code, cost centre): open question 4.
- Paying or journalling from the task (payment file, GL journal), and any link to BSU deposits.
