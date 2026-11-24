# AR-ii — decisions

Numbers are stable: never renumber or reuse one. A changed decision gets a new row that says which one
it replaces, and the old row is struck through. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Module | AR-ii is a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-ii`), from [#13](https://github.com/veranzy/ServiceNowARdemo/issues/13). Catalogue tile active, name *Refund request* (assumed, open question 4). | 2026-11-25 |
| 2 | Reason for Refund choices | **A, B, C** as placeholders, plus **Others** (in the client's help text), until the client gives the list (owner). | 2026-11-25 |
| 3 | "Volume … max is 5" | The **number of rows**: 1 to 5 (owner). *No. of cases registered* is a whole number of at least 1, no maximum. | 2026-11-25 |
| 4 | Urgent explanation | Always shown, optional (owner). | 2026-11-25 |
| 5 | Workspace | The submission is the **case**; **one AR2 task per row** (owner), table `x_ar_refund_task`, worked on its own task page. Task states Open, Work in progress, Closed complete, Closed incomplete (assumed, open question 3). | 2026-11-25 |
