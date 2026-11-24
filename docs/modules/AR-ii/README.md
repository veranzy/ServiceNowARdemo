# AR-ii — Refund request

**Status:** In prototype
**Persona(s):** Project team (portal), AR team (workspace)
**Demo:** portal → AR forms → **AR-ii Refund request** (`#/portal/form/AR-ii`); workspace → AR requests → **All AR-ii**
(demo case ARQ0001017) and **Open AR2 tasks**.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Requirement: [issue #13](https://github.com/veranzy/ServiceNowARdemo/issues/13).

## Purpose

The project team asks Accounts Receivable for refunds with an Excel template. One form can hold several refund
reasons (up to 5 rows). The submission is one AR request case; **each row becomes an AR2 task** that AR works on its own.

## User stories

- As a project team member, I want to list my refunds by reason, with the number of cases for each, and attach the Excel template, so that AR can process them.
- As a project team member, I want to say why a request is urgent, so that AR can prioritise it.
- As an AR officer, I want one task per refund reason, so that each one can be assigned and closed separately.

## Screens and flow

**Portal form** (`PT-65`), sections:

1. **General information** (shared variable set, D19).
2. **Reason for Refund** (section title assumed, open question 4):
   - Help text above the table (client wording): *Select the reason for refund. If there are multiple refunds with different reason, click on "Add More". Select "Others" only if reason cannot be found in dropdown list. Volume should at least be 1, max is 5.*
   - Multi-row set (`PT-66`), **1 to 5 rows** (decision 3), button **Add More** (`UA-PT-addrefund`). Columns:
     | Column | Type | Mandatory | Help |
     |---|---|---|---|
     | Reason for Refund | Choice: A, B, C, Others (decision 2) | Yes | — |
     | No. of cases registered | Whole number, at least 1 | Yes | To indicate the volume of cases with the same refund reason |
   - **Please provide an explanation on why this is an urgent request.** Free text, optional, always shown (decision 4). Help: *To explain why this request is urgent*.
3. **Supporting documents** (`PT-67`): attachments (the Excel template), optional.

Submit → confirmation page → **My requests** ticket page shows the AR2 tasks with their state (`PT-68`).

**Workspace:**

- List **All AR-ii** (`LST-REQ-AR2`) under AR requests; list **Open AR2 tasks** (`LST-RFT`, tasks Open or Work in progress).
- Case page (`REQ-FV-AR2`): header (no customer or contract), ribbon *AR2 tasks closed* (x of y) and *Cases registered*;
  Details: Case, 1. General information, 2. Reason for Refund (the urgent explanation), 3. Supporting documents;
  tab **AR2 tasks** (`RL-REQ-RFT`). Case actions as every form: Assign to me, Save, State dropdown (AR-00).
- AR2 task page (`RP-RFT`): Number, AR request, Row, Reason for Refund, No. of cases registered (read-only, from the form);
  **State** and **Assigned to** editable; Save (`UA-RFT-save`).

## ServiceNow mapping

- Record producer **AR-ii Refund request** on `x_ar_request` (`ar_form = AR-ii`); variable `urgent_explanation`
  (`REQ.urgent_explanation`); multi-row variable set with `refund_reason`, `cases_registered`.
- Table **`x_ar_refund_task`** (extends Task, number prefix RFT): `ar_request`, `row_number`, `refund_reason`,
  `cases_registered`, `state`, `assigned_to` (`RFT.*`). The producer script creates one task per row, state Open,
  assignment group Accounts Receivable.
- Generated detail: `SERVICENOW_MAPPING.md` (Portal → record producer AR-ii; table `x_ar_refund_task`) and
  `docs/BUILD_NOTES.md` (IDs above).

## Out of scope / later

- The real Reason for Refund list (open question 1).
- Any link between closing the AR2 tasks and closing the case (open question 2).
- What happens to the money (refund payment, link to AR10, BSU): not defined yet.
