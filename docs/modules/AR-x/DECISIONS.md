# AR-x — decisions

Numbers are stable: never renumber or reuse one. A changed decision gets a new row that says which one
it replaces, and the old row is struck through. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Module | AR10 is form **AR-x**, a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-x`), from [#14](https://github.com/veranzy/ServiceNowARdemo/issues/14). Catalogue tile active, name *Refund (payment / journal)* (assumed, open question 3). | 2026-11-25 |
| 2 | Payee and amount table | The requester types **payee and amount** rows on the form (Name of Beneficiary /Vendor, Amount (SGD)); **AR checks them against the Excel** rows: *On the form* on each task, *In the Excel* on each payee row (owner). A check only, nothing automatic. | 2026-11-25 |
| 3 | Excel → tasks | The form takes the AR10 Excel template and processes it; **each filled row becomes an AR10 task** that keeps payee and amount, matched from the Excel after processing (owner). The case is the submission. Task states as AR-ii (Open, Work in progress, Closed complete, Closed incomplete). Demo reads the real .xlsx (SheetJS, vendored), with *Use sample file* and *Download template*. | 2026-11-25 |
| 4 | Expedited | *Expedited* Yes / No (default No); **Yes shows the urgent explanation, mandatory** (owner). | 2026-11-25 |
| 5 | Acknowledgement | A checkbox, **optional**, placeholder wording *I confirm the information above is correct.* (owner). | 2026-11-25 |
