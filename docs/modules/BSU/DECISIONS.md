# BSU — decisions

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
| 9 | Routing by department / account type | **No routing.** All deposits go to one AR queue (Cash application). Department and account type are labels for reference only. | 2026-11-01 |
| 10 | Non-customer deposits (interest, refunds, transfers) | **Leave them unmatched.** No special status; they stay in the to-match list and are handled outside the app. | 2026-11-01 |
