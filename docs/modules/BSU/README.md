# BSU — Bank statement upload and cash application

**Status:** In prototype
**Persona(s):** AR team (workspace)
**Demo:** Workspace → left rail → **BSU** (upload icon) and **Cash application**. Lists: *Bank statements* group in the list menu.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Formerly two modules: BSU (upload) and CSH (cash application). Money in
is only ever a BSU deposit (D7); there is **no auto-matching, ever** (D5).

## Purpose

Every morning the AR team loads the previous day's bank statement for each company bank account so
that customer deposits are recorded in ServiceNow. Each deposit gets a **Deposit ID** and is stored in
the **Bank statements** table, where the AR team reviews it and matches it to invoices manually.

## User stories

- As an AR team member, I want to upload yesterday's CSV statement for a bank account, so that the
  day's customer deposits are recorded without retyping.
- As an AR team member, I want to preview which lines will be saved as deposits and which will be
  skipped, so that I know the file was read correctly before saving.
- As an AR team member, I want each deposit to carry a Deposit ID, so that I can refer to it when
  matching, querying the bank or talking to customers.
- As an AR team member, I want to see which department and account type a deposit belongs to, so that
  I route and match it correctly.

## Screens and flow

1. **BSU page**: choose the bank account (shows bank, account no., department, type), statement date
   (defaults to yesterday), then choose the CSV file. For the demo, *Use sample file* generates a file
   in that bank's layout; *Download sample* gives the CSV to try a real file upload.
2. **Preview**: deposits with their new Deposit IDs, payer, reference and amount; withdrawals listed as
   skipped; totals.
3. **Save to bank statements**: creates the upload record (`BSU…`) and one deposit record per credit.
4. **Afterwards**: deposits appear in *Bank statements → Unmatched deposits* and on the Cash
   application page, where the AR team matches them with *Find invoice*.

## ServiceNow mapping

| Item | Build |
|---|---|
| `x_ar_bank_account` | Bank account master (bank, account number, name, department, account type, currency). |
| `x_ar_bsu` | Upload header: bank account, statement date, file name, uploaded by/at, deposit count and total, skipped withdrawals. Number prefix `BSU`. CSV kept as `sys_attachment`. |
| `x_ar_bank_statement` | **Bank statements** table: one row per deposit, `deposit_id` as display value, reference to upload and bank account, value date, payer, reference, amount, match state. |
| Parsing | Scripted upload: UI action *Save to bank statements* on a custom workspace page calls Script Include `x_ar.BankStatementParser` with the bank's template (or one Data Source + Transform Map per bank). Templates in a small config table or system properties. |
| Deposit ID | Before-insert business rule: `DEP-` + bank code + last 4 of account + statement date + 3-digit sequence per upload. |
| Matching | No auto-match. Manual matching on the Cash application page (below) creates `x_ar_allocation` records. |

See `SERVICENOW_MAPPING.md` (generated) for full column lists.

## Cash application (manual matching)

The AR team matches each BSU deposit to one or more **issued** invoices ([CCI](../CCI/README.md)) by hand.

1. **Cash application page** (`CSH-01`): summary cards (`CSH-02`: to match, matched, amounts) and the
   deposits list (`CSH-03`) with filter tabs *To match / Matched / All*.
2. **Find invoice** opens the invoice finder (`CSH-04`): issued invoices ranked as a suggestion only (invoice
   number in the bank reference, amount fit, payer-name similarity), with an allocation preview. AR picks the
   invoices and amounts and clicks **Apply**, which creates accepted allocations.
3. **Remove match** clears the deposit's allocations.
4. Allocations update each invoice's amount due and payment status (Unpaid / Part paid / Paid / Overdue).
   Exceptions (short pay, over pay, multi-invoice) are labels on the match, not separate flows.

| Item | Build |
|---|---|
| Cash application page | UI Builder custom page over `x_ar_bank_statement` with match state filters. |
| Invoice finder | Modal or side panel; Script Include ranks `x_ar_invoice` where state = issued and amount due > 0. Suggestion only. |
| `x_ar_allocation` | Deposit, invoice, amount, status (accepted); business rule recalculates the invoice's `amount_due` / `payment_status` and the deposit's match state. |
| UI actions | Deposit: *Find invoice → Apply* (inserts allocations), *Remove match*. Related lists `RL-INV-ALC`, `RL-DEP-ALC`. |

## Bank CSV layouts (mock)

| Bank (alias) | Stands in for | Date format | Columns used |
|---|---|---|---|
| Marina Bank (MB) | Largest local bank | `31 Oct 2026` | Transaction Date, Transaction Description 1 (payer), Transaction Description 2 (reference), Debit Amount, Credit Amount |
| Orchard Bank (OB) | Second largest | `31/10/2026` | Transaction date, Description (payer), Remarks (reference), Withdrawals (SGD), Deposits (SGD) |
| Union Straits Bank (US) | Third largest | `2026-10-31` | Date, Description (payer), Reference, Deposit, Withdrawal |

## Out of scope / later

- Duplicate statement detection, opening/closing balance check, date continuity warnings.
- CAMT.053, MT940 or Excel formats; direct bank integration (host-to-host / API).
- Non-SGD accounts.
