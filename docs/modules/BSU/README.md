# BSU — Bank statement upload and cash application

**Status:** In prototype
**Persona(s):** AR team (workspace)
**Demo:** Workspace → left rail → **BSU** (upload icon). Lists: *Bank statements* group in the list menu (*Statement uploads* and *Bank lines*, decision 25).

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
4. **Afterwards** (decision 25): AR lands on the **daily statement** just uploaded, its *BSU deposits* tab (all its
   bank lines) first. AR opens each line and matches it on its record tabs (decision 21).

## ServiceNow mapping

| Item | Build |
|---|---|
| `x_ar_bank_account` | Bank account master (decision 17: *Bank name*, *Bank account number*, *Bank account name* describing the department's sub-account type, department, account type, currency, **collection types** AR-iii / AR-iv / AR-v received, decision 13). |
| RITM (`sc_req_item`) | Upload = catalog item *Bank statement upload* (D32): variables bank account, statement date, file name; uploaded by = opened by; deposit count and total, skipped withdrawals set by the flow. Number prefix `RITM`. CSV kept as the RITM's attachment. Flow: parse with the bank's template, insert deposits, close the RITM complete. |
| `x_ar_bank_statement` | **Bank statements** table: one row per deposit, `deposit_id` as display value, reference to the RITM (`bsu`) and bank account, value date, payer, reference, amount, match state. |
| Parsing | The RITM's flow calls Script Include `x_ar.BankStatementParser` with the bank's template (or one Data Source + Transform Map per bank). Templates in a small config table or system properties. |
| Payment modes | `x_ar_payment_mode` (decisions 18–19): bank account, payment mode (= the statement's transaction code), prefix, suffix, account code and cost centre (optional, purpose to confirm, decision 20), active. Related list on the bank account (`RL-BNK-PMD`), *New payment mode* (`UA-BNK-newmode`). |
| Deposit ID | Before-insert business rule (decision 18): find the bank account's active payment mode whose `name` equals the line's transaction code (case-insensitive, decision 19); `deposit_id` = prefix + `-` + value date as DDMMYY + `-` + suffix; set `payment_mode`. No match: `UNK-DDMMYY-XX`, `payment_mode` empty. Not unique. |
| Matching | No auto-match. Manual matching on the deposit, invoice or Collections case record (below, decision 21) creates `x_ar_allocation` records. |

See `SERVICENOW_MAPPING.md` (generated) for full column lists.

## Matching in the workspace (manual, decision 21)

The AR team matches each BSU deposit to one or more **issued** invoices ([CCI](../CCI/README.md)) or open
**Collections cases** (AR-iii, AR-iv, AR-v; D28, D29, decision 11) by hand, on the **standard record pages**. There is
no Cash application page (retired 2026-11-18, decision 21) and no auto-matching (D5).

**Two entry points** (owner, decision 25). Structure: a **daily statement** (one bank account, one day; the upload's
RITM is only the ServiceNow job that loads the file) groups its **bank lines**, and the **sum of the bank lines equals
the daily statement's total**.

1. **Statement uploads** (List menu → *Bank statements*): one row per daily statement. **New** uploads a file. Clicking
   a row opens the daily statement with its tab *BSU deposits* (all its bank lines) **first**, before *Details*
   (decision 24); a line opens from there.
2. **Bank lines** (List menu → *Bank statements*; replaces *BSU deposits to match* and *All BSU deposits*): every bank
   line, columns **RITM › Value date › Deposit ID › Bank name › Bank account** (account number) › Payer › Reference ›
   Amount › Unmatched › Match, sorted in that order (newest RITM first, then ascending; decision 23). The Match column
   shows Unmatched / Part matched / Matched. **Clicking a row opens the bank line.**

**Matching is per bank line**: on the line, *Suggested matches* → **Match**, or *Allocations* → **New**. One line can
pay several invoices and / or Collections cases; its allocations show what it fulfils (decisions 21, 22).

**From a deposit** (record tabs: Details, **Suggested matches**, **Allocations**, Record history):
1. **Suggested matches** (`RL-DEP-SUG`): up to 10 issued invoices with amount due and open Collections cases not yet
   on this deposit, ranked as a suggestion only: invoice / case number or the case's references cited in the bank
   reference, amount fit (exact or within 3%), payer-name similarity (invoices), and the bank account's collection
   types (cases, decision 13). Columns: *Invoice or case* (a case is tagged *Collection case · AR-…*), *Customer*,
   *Due* (a case shows *Opened*), *Open*, *Why suggested* (the signals), and a **Match** button per row (`UA-SUG-match`).
2. **Match** opens the *New allocation* form with the deposit and the invoice / case filled in and **Allocation
   value** prefilled with the smaller of the deposit's unmatched amount and the target's amount due; AR confirms or
   changes it and saves (decision 22). Nothing is matched until AR saves.
3. **Allocations** (`RL-DEP-ALC`) lists what is matched; **New** (`UA-DEP-newalloc`, shown while money is left) opens
   the **New allocation** form with the deposit filled in: AR picks an *Invoice* **or** a *Collection case*, may
   change the *Allocation value* (empty = the default above) and add a *Reason*, then **Save** (`UA-ALC-insert`) returns to
   the deposit. Several allocations cover partial and multi-invoice payments.
4. **Remove match** (header action, `UA-DEP-remove`) clears the deposit's allocations.

**From an invoice or a Collections case:** the same, the other way round. The invoice has **Allocations**
(`RL-INV-ALC`, *New* `UA-INV-newalloc`) and **Suggested BSU deposits** (`RL-INV-SUG`: deposits with money left,
same signals; columns *BSU deposit*, *Date*, *Payer*, *Reference*, *Left to match*, *Why suggested*, **Match**);
only issued invoices with amount due get suggestions. A Collections case has **BSU deposits matched** (`RL-REQ-ALC`,
*New* `UA-REQ-newalloc`) and **Suggested BSU deposits** (`RL-REQ-SUG`). AR-iii cases are matched against their
Total Amount (AR-iii decision 19). Matching never changes the case state: AR closes it with the State dropdown (decision 11).

**Validation on Save:** a BSU deposit, and exactly one of Invoice or Collection case; the amount must be above zero
and no more than either the deposit's unmatched amount or the target's amount due. The pickers only offer deposits
with money left, issued invoices with amount due and open Collections cases with an amount still to match.

**Allocation value and delta (decision 22).** An allocation is a child item of both sides: the deposit and the
invoice or Collections case. Its *Allocation value* is unique to the allocation; the deposit, invoice and case amounts
are fixed and never change. Each Allocations tab shows a line *Amount · Allocation value · Delta* (`ALC-DELTA`):
Delta = the record's Amount − the sum of its allocation values. On a deposit, the delta is money to refund or apply
elsewhere; on an invoice or case, it is still to collect or to offset.

Allocations update each invoice's amount due and payment status (Unpaid / Part paid / Paid / Overdue). Exceptions
(short pay, overpayment, multi-invoice) are labels set on the match, not separate flows.

| Item | Build |
|---|---|
| Lists | *Statement uploads* (`x_ar_bsu`, daily statements) and *Bank lines* (all `x_ar_bank_statement` records; Match column). No custom page. |
| Suggested matches / Suggested BSU deposits | Workspace related-list tabs fed by a data resource (Script Include ranks candidates; suggestion only), row **declarative action** *Match* that inserts one `x_ar_allocation`. |
| `x_ar_allocation` | Deposit, invoice **or** request (Collection case; exactly one is set, D29), *Allocation value* (`amount`, unique to the allocation; default on insert: smaller of deposit unmatched and target due), status (accepted); reference qualifiers as above; business rule recalculates the invoice's `amount_due` / `payment_status` and the deposit's match state. Form: *New allocation* with the parent prefilled. |
| UI actions | *Match* (row), *New* on the Allocations tabs, *Save* on the allocation, *Remove match* on the deposit. Related lists `RL-INV-ALC`, `RL-DEP-ALC`, `RL-REQ-ALC`. |

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
