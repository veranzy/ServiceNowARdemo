# BSU — Bank statement upload

**Status:** In prototype
**Persona(s):** AR team (workspace)
**Demo:** Workspace → left rail → **BSU** (upload icon). Lists: *Bank statements* group in the list menu.

## Purpose

Every morning the AR team loads the previous day's bank statement for each company bank account so
that customer deposits are recorded in ServiceNow. Each deposit gets a **Deposit ID** and is stored in
the **Bank statements** table, where the AR team reviews it and matches it to invoices manually.

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | File formats | CSV bank export only. Each bank has its own column layout; the upload uses the template of the account's bank. | 2026-11-01 |
| 2 | What happens after upload | Deposits are saved to the **Bank statements** table for later manual review and matching. **No auto-matching, ever** (see D5). | 2026-11-01 |
| 3 | Which lines | **Deposits (credits) only.** Withdrawals in the file are skipped and counted. | 2026-11-01 |
| 4 | Banks | Mock aliases for Singapore's three largest banks: **Marina Bank**, **Orchard Bank**, **Union Straits Bank**, each with a different CSV layout. | 2026-11-01 |
| 5 | Upload cadence | One upload per bank account per day, for the **previous day** (statement date defaults to yesterday). | 2026-11-01 |
| 6 | Deposit ID | Each deposit is tagged `DEP-<bank code><last 4 of account>-<YYMMDD>-<NNN>`, e.g. `DEP-MB4521-261031-001`. | 2026-11-01 |
| 7 | Bank accounts | Bank account master with bank, account number, name, **department** and **account type** (Revenue, Deposit, Operating). | 2026-11-01 |
| 8 | Controls | Keep it simple for now: no duplicate, balance or continuity checks. | 2026-11-01 |

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
| Matching | No auto-match. Manual matching from the Cash application page creates `x_ar_allocation` records. |

See `SERVICENOW_MAPPING.md` (generated) for full column lists.

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

## Open questions

1. Should the department and account type of the bank account drive anything (e.g. only *Revenue*
   accounts feed cash application; *Deposit* accounts go to a different team)?
2. What happens to deposits that are not customer receipts (e.g. interest, refunds): mark as
   *Not AR* on the deposit, or exclude at upload?
3. Who may upload: any AR team member, or a named few?
4. Should an upload be deletable/re-uploadable if the wrong file was used?

## Change log

| Date | Change |
|---|---|
| 2026-11-01 | Module specified from owner's answers; first prototype built. Auto-match removed app-wide. |
