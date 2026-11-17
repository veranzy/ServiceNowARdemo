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
the **Bank statements** table, where the AR team reviews it and matches it manually to invoices or to
**Collections** cases (money collected without an invoice, D28, D29). Each upload is an **RITM** (D32).

## User stories

- As an AR team member, I want to upload yesterday's CSV statement for a bank account, so that the
  day's customer deposits are recorded without retyping.
- As an AR team member, I want to preview which lines will be saved as deposits and which will be
  skipped, so that I know the file was read correctly before saving.
- As an AR team member, I want each deposit to carry a Deposit ID, so that I can refer to it when
  matching, querying the bank or talking to customers.
- As an AR team member, I want to see which department and account type a deposit belongs to, so that
  I route and match it correctly.
- As an AR team member, I want to match a deposit to a Collections case as easily as to an invoice, so that
  money collected without an invoice is accounted for too.

## Screens and flow

1. **BSU** (rail) opens the **Statement uploads** list: every upload RITM (decision 16). **New** opens the
   upload form: choose the bank account (shows bank, account no., department, type), statement date
   (defaults to yesterday), then choose the CSV file. For the demo, *Use sample file* generates a file
   in that bank's layout; *Download sample* gives the CSV to try a real file upload.
2. **Preview**: deposits with their new Deposit IDs, payment mode (or *No payment mode*, `BSU-08`), payer, reference and amount; withdrawals listed as
   skipped; totals.
3. **Save to bank statements**: submits the catalog item *Bank statement upload*, which creates the **RITM**
   (`RITM…`, one per bank account per day, decision 12) and one deposit record per credit, related to the RITM,
   then opens the new RITM. Upload completeness (which accounts are still missing a day) is decided later.
4. **Afterwards**: deposits appear in *Bank statements → Unmatched deposits* and on the Cash
   application page, where the AR team matches them with *Find invoice or case…* (decision 14).

## ServiceNow mapping

| Item | Build |
|---|---|
| `x_ar_bank_account` | Bank account master (decision 17: *Bank name*, *Bank account number*, *Bank account name* describing the department's sub-account type, department, account type, currency, **collection types** AR-iii / AR-iv / AR-v received, decision 13). |
| RITM (`sc_req_item`) | Upload = catalog item *Bank statement upload* (D32): variables bank account, statement date, file name; uploaded by = opened by; deposit count and total, skipped withdrawals set by the flow. Number prefix `RITM`. CSV kept as the RITM's attachment. Flow: parse with the bank's template, insert deposits, close the RITM complete. |
| `x_ar_bank_statement` | **Bank statements** table: one row per deposit, `deposit_id` as display value, reference to the RITM (`bsu`) and bank account, value date, payer, reference, amount, match state. |
| Parsing | The RITM's flow calls Script Include `x_ar.BankStatementParser` with the bank's template (or one Data Source + Transform Map per bank). Templates in a small config table or system properties. |
| Payment modes | `x_ar_payment_mode` (decisions 18–19): bank account, payment mode (= the statement's transaction code), prefix, suffix, account code and cost centre (optional, purpose to confirm, decision 20), active. Related list on the bank account (`RL-BNK-PMD`), *New payment mode* (`UA-BNK-newmode`). |
| Deposit ID | Before-insert business rule (decision 18): find the bank account's active payment mode whose `name` equals the line's transaction code (case-insensitive, decision 19); `deposit_id` = prefix + `-` + value date as DDMMYY + `-` + suffix; set `payment_mode`. No match: `UNK-DDMMYY-XX`, `payment_mode` empty. Not unique. |
| Matching | No auto-match. Manual matching on the Cash application page (below) creates `x_ar_allocation` records. |

See `SERVICENOW_MAPPING.md` (generated) for full column lists.

## Cash application (manual matching)

The AR team matches each BSU deposit to one or more **issued** invoices ([CCI](../CCI/README.md)) or open
**Collections cases** (AR-iii, AR-iv, AR-v; D28, D29, decision 11) by hand.

1. **Cash application page** (`CSH-01`): summary cards (`CSH-02`: to match, matched, amounts) and the
   deposits list (`CSH-03`) with filter tabs *To match / Matched / All*.
2. **Find invoice or case…** opens the finder (`CSH-04`): issued invoices and open Collections cases ranked as a
   suggestion only (decision 13: for cases, the deposit's bank account receiving that collection type adds to the
   score, `CSH-06`, and the case's own references count as citations; nothing is hidden). For invoices: (invoice
   number in the bank reference, amount fit, payer-name similarity), with an allocation preview. AR picks the
   invoices and amounts and clicks **Apply**, which creates accepted allocations.
   Open Collections cases (`x_ar_request`, `ar_form` = COL, the one Collections form for AR-iii / AR-iv / AR-v (D30), state New, Work in progress or Awaiting
   requestor information, Request value not yet matched) are listed with the invoices and tagged *Collection case ·
   AR-…* (`CSH-05`); their open amount is the case's **Request value** (`amount`) minus what is matched. The preview
   shows *Opened* and *Amount to collect* instead of invoice date, due and original amount. Invoices and cases can be
   ticked together (decision 15). On the deposit, a case shows *Collections · AR-…* in the customer column.
   AR-iii cases have no amount yet and are not offered (open question 7).
3. **Remove match** clears the deposit's allocations.
4. Allocations update each invoice's amount due and payment status (Unpaid / Part paid / Paid / Overdue).
   Exceptions (short pay, over pay, multi-invoice) are labels on the match, not separate flows.
5. A Collections case shows the deposits matched to it on its tab **BSU deposits matched** (`RL-REQ-ALC`).
   Matching never changes the case state: AR closes it with the State dropdown (decision 11).

| Item | Build |
|---|---|
| Cash application page | UI Builder custom page over `x_ar_bank_statement` with match state filters. |
| Invoice finder | Modal or side panel; Script Include ranks `x_ar_invoice` where state = issued and amount due > 0, and `x_ar_request` where `ar_form` = COL (D30), state is open and `amount` minus accepted allocations > 0 (D29). Suggestion only. |
| `x_ar_allocation` | Deposit, invoice **or** request (Collection case; exactly one is set, D29), amount, status (accepted); business rule recalculates the invoice's `amount_due` / `payment_status` and the deposit's match state. |
| UI actions | Deposit: *Find invoice or case… → Apply* (inserts allocations), *Remove match*. Related lists `RL-INV-ALC`, `RL-DEP-ALC`, `RL-REQ-ALC` (case). |

## Bank CSV layouts (mock)

| Bank (alias) | Stands in for | Date format | Columns used |
|---|---|---|---|
| Marina Bank (MB) | Largest local bank | `31 Oct 2026` | Transaction Date, Transaction Code (transaction ID), Transaction Description 1 (payer), Transaction Description 2 (reference), Debit Amount, Credit Amount |
| Orchard Bank (OB) | Second largest | `31/10/2026` | Transaction date, Txn Type (transaction ID), Description (payer), Remarks (reference), Withdrawals (SGD), Deposits (SGD) |
| Union Straits Bank (US) | Third largest | `2026-10-31` | Date, Transaction ID, Description (payer), Reference, Deposit, Withdrawal |

## Out of scope / later

- Duplicate statement detection, opening/closing balance check, date continuity warnings.
- CAMT.053, MT940 or Excel formats; direct bank integration (host-to-host / API).
- Non-SGD accounts.
