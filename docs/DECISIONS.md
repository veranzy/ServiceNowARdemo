# Decision log

Cross-module decisions for the ServiceNow AR build. Module-specific decisions live in each
module spec under `docs/modules/`.

| # | Date | Decision | Source |
|---|---|---|---|
| D1 | 2026-11-01 | All tables are custom tables in the scoped app (no CSM `customer_account`, `core_company` or Contract Management `ast_contract`). | Owner |
| D2 | 2026-11-01 | The app is the system of record for invoices. | Owner |
| D3 | 2026-11-01 | Two roles: project team uses the portal only; AR team uses the workspace only. | Owner |
| D4 | 2026-11-01 | Project team raises the AR form as a record producer; it creates an AR request case worked in the workspace. | Owner |
| D5 | 2026-11-01 | **No auto-matching.** Deposits are always matched to invoices manually by the AR team. | Owner (BSU) |
| D6 | 2026-11-01 | Bank statements arrive as CSV exports, imported once a day for the previous day, deposits only. | Owner (BSU) |
| D7 | 2026-11-01 | **Money received is only ever a BSU deposit.** No separate payments table or "payment received" step: cash application matches BSU deposits (Bank statements table) to invoices. | Owner |
| D8 | 2026-11-01 | Change requests reference **Build notes IDs** (`<ID> - <change>`). IDs are stable and listed in `docs/BUILD_NOTES.md`. | Owner |
| D9 | 2026-11-02 | The portal offers **16 AR forms, AR-i … AR-xvi**; each is a record producer. AR-i (New AR request) covers 1st, ad-hoc and recurring AR. | Owner (ARF) |
| D10 | 2026-11-02 | Customer documents (signed contract/PO, ACRA registration, billing contact & address form) are **filed on the customer once** and reused by later requests. | Owner (ARF) |
| D11 | 2026-11-02 | There are **11 operational departments**; a customer can have a **different billing contact per department**. | Owner (ARF) |
| D12 | 2026-11-02 | Recurring billing is requested **once** via AR-i; AR runs it from a **billing schedule** and raises each invoice manually. | Owner (ARF) |
