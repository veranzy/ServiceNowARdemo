# AR-ii — Refund request

**Status:** In prototype
**Persona(s):** Project team (portal), AR team (workspace)
**Demo:** portal → AR forms → **AR-ii Refund request** (`#/portal/form/AR-ii`); workspace → AR requests → **All AR-ii**
(demo case ARQ0001017) and **Open AR2 tasks**.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Requirements: [issue #13](https://github.com/veranzy/ServiceNowARdemo/issues/13) (form), [issue #15](https://github.com/veranzy/ServiceNowARdemo/issues/15) (Excel upload).

## Purpose

The project team asks Accounts Receivable for refunds with an Excel template. The form lists the refund reasons
(up to 5 rows, a summary on the case) and takes the AR2 Excel. The submission is one AR request case; **each filled
Excel row becomes an AR2 task** that AR works on its own (decision 6, amends decision 5).

## User stories

- As a project team member, I want to list my refunds by reason, with the number of cases for each, and attach the Excel template, so that AR can process them.
- As a project team member, I want to say why a request is urgent, so that AR can prioritise it.
- As an AR officer, I want one task per Excel row (payee, amount, reason, references), so that each refund can be assigned and closed separately.

## Screens and flow

**Portal form** (`PT-65`), sections:

1. **General information** (shared variable set, D19).
2. **Reason for Refund** (section title assumed, open question 4):
   - Help text above the table (client wording): *Select the reason for refund. If there are multiple refunds with different reason, click on "Add More". Select "Others" only if reason cannot be found in dropdown list. Volume should at least be 1, max is 5.*
   - Multi-row set (`PT-66`), **1 to 5 rows** (decision 3), button **Add More** (`UA-PT-addrefund`). Stored on the case as a summary (`x_ar_refund_reason`, decision 7), no tasks. Columns:
     | Column | Type | Mandatory | Help |
     |---|---|---|---|
     | Reason for Refund | Choice: A, B, C, Others (decision 2) | Yes | — |
     | No. of cases registered | Whole number, at least 1 | Yes | To indicate the volume of cases with the same refund reason |
   - **Please provide an explanation on why this is an urgent request.** Free text, optional, always shown (decision 4). Help: *To explain why this request is urgent*.
3. **Supporting documents** (`PT-67`):
   - **Excel template** (`PT-69`): *Upload Excel* (.xlsx), *Use sample file* (demo only), *Download template*. The file is
     read on the form: "*n* rows read. They become *n* AR2 tasks when you submit." A file without the template columns
     shows an error. Optional (open question 5).
   - Other supporting documents: attachments, optional.

**AR2 Excel template** (#15, client wording, header row found by name; empty rows skipped):

| S/N | Collection reference No. (e.g. Reciept No.) | Refund Reason | Amount ($) | Case Reference No. (if applicable) | Name of Payee | If amount for refund is not in SGD (if applicable) |
|---|---|---|---|---|---|---|

Submit → confirmation page → **My requests** ticket page shows the AR2 tasks (payee, amount, reason) with their state (`PT-68`).

**Workspace:**

- List **All AR-ii** (`LST-REQ-AR2`) under AR requests; list **Open AR2 tasks** (`LST-RFT`, tasks Open or Work in progress).
- Case page (`REQ-FV-AR2`): header (no customer or contract), ribbon *AR2 tasks closed* (x of y), *Cases registered*
  (from the reason rows) and *Excel total*; Details: Case, 1. General information, 2. Reason for Refund (the urgent
  explanation), 3. Supporting documents; tabs **AR2 tasks** (`RL-REQ-RFT`, the Excel columns) and **Reason for Refund**
  (`RL-REQ-RFR`). Case actions as every form: Assign to me, Save, State dropdown (AR-00).
- AR2 task page (`RP-RFT`): Number, AR request, S/N and the Excel columns (read-only); **State** and **Assigned to**
  editable; Save (`UA-RFT-save`).

## ServiceNow mapping

- Record producer **AR-ii Refund request** on `x_ar_request` (`ar_form = AR-ii`); variable `urgent_explanation`
  (`REQ.urgent_explanation`); multi-row variable set with `refund_reason`, `cases_registered`.
- Table **`x_ar_refund_reason`** (`RFR.*`): `ar_request`, `row_number`, `refund_reason`, `cases_registered` (the form's rows).
- Table **`x_ar_refund_task`** (extends Task, number prefix RFT): `ar_request`, `row_number` (S/N), `collection_reference`,
  `refund_reason`, `amount`, `case_reference`, `payee_name`, `amount_not_sgd`, `state`, `assigned_to` (`RFT.*`).
- Excel processing: after submit, the producer's flow loads the attached AR2 Excel through an import set (data source of
  type File on the attachment; transform map into `x_ar_refund_task`, one task per filled row, state Open, assignment
  group Accounts Receivable). The blank template is attached to the catalog item.
- Generated detail: `SERVICENOW_MAPPING.md` (Portal → record producer AR-ii; table `x_ar_refund_task`) and
  `docs/BUILD_NOTES.md` (IDs above).

## Out of scope / later

- The real Reason for Refund list (open question 1), and whether the Excel's Refund Reason becomes a dropdown.
- Any link between closing the AR2 tasks and closing the case (open question 2).
- What happens to the money (refund payment, link to AR10, BSU): not defined yet.
