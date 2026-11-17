# AR-iii — decisions

Numbers are stable: never renumber or reuse one. A changed decision gets a new row that says which one
it replaces, and the old row is struck through. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Category | AR-iii is the first form of the **Collections** category (AR-iii, AR-iv, AR-v): money collected without an invoice (D28). Documented only; no catalogue change. | 2026-11-17 |
| 2 | Matching | AR matches the BSU deposit to the open AR-iii case on Cash application, manually (D29, D5). | 2026-11-17 |
| 3 | Order | Collections forms are defined one at a time, AR-iii first. | 2026-11-17 |
| 4 | Amount matched | A collection uses the case's **Request value** (`amount`) as the amount to collect (owner, 2026-11-17); the AR-iii form will set it. | 2026-11-17 |
| 5 | One form (D30) | AR-iii, AR-iv and AR-v are **one form** (client request). Three catalogue tiles open it with the type preselected; **Collection type** is the first question after General information. | 2026-11-17 |
| 6 | Case form value | The case records `ar_form` = **COL** plus `collection_type` (owner: "One code + type field"). | 2026-11-17 |
| 7 | Shell first | Built now as a shell: General information + Collection type (owner: "Build a shell now"). Form name, choice labels and fields to come ("Tell you later"); codes used meanwhile. | 2026-11-17 |
| 8 | Order of the first sections | **Collection type comes right after General information** (owner, 2026-11-17), so D19 holds: every form starts with General information. Open question 5 answered. | 2026-11-17 |
