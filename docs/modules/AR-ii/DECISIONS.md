# AR-ii — decisions

Numbers are stable: never renumber or reuse one. A changed decision gets a new row that says which one
it replaces, and the old row is struck through. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Module | AR-ii is a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-ii`), from [#13](https://github.com/veranzy/ServiceNowARdemo/issues/13). Catalogue tile active, name *Refund request* (assumed, open question 4). | 2026-11-25 |
| 2 | Reason for Refund choices | **A, B, C** as placeholders, plus **Others** (in the client's help text), until the client gives the list (owner). | 2026-11-25 |
| 3 | "Volume … max is 5" | The **number of rows**: 1 to 5 (owner). *No. of cases registered* is a whole number of at least 1, no maximum. | 2026-11-25 |
| 4 | Urgent explanation | Always shown, optional (owner). | 2026-11-25 |
| 5 | Workspace | ~~The submission is the **case**; **one AR2 task per row** (owner), table `x_ar_refund_task`, worked on its own task page. Task states Open, Work in progress, Closed complete, Closed incomplete (assumed, open question 3).~~ Tasks part replaced by decision 6; the case and the task states stand. | 2026-11-25 |
| 6 | Excel upload ([#15](https://github.com/veranzy/ServiceNowARdemo/issues/15)) | The form takes the AR2 Excel template and processes it; **each filled Excel row becomes an AR2 task** in the workspace, with the template's columns (S/N, Collection reference No. (e.g. Reciept No.), Refund Reason, Amount ($), Case Reference No. (if applicable), Name of Payee, If amount for refund is not in SGD (if applicable)). Amends decision 5 (owner). Demo reads the real .xlsx in the browser (SheetJS, vendored) and offers *Use sample file* and *Download template* (owner). | 2026-11-25 |
| 7 | Reason for Refund rows | Kept on the form and stored on the case as a **summary** (`x_ar_refund_reason`); no tasks are made from them (owner). | 2026-11-25 |
