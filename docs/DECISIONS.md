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
| D9 | 2026-11-02 | The portal offers **16 AR forms, AR-i … AR-xvi**; each is a record producer. AR-i (New AR request) is the general request; "first" and "recurring" are not separate types (see D13). | Owner (ARF) |
| D10 | 2026-11-02 | Customer documents (signed contract/PO, ACRA registration, billing contact & address form) are **filed on the customer once** and reused by later requests. | Owner (ARF) |
| D11 | 2026-11-02 | There are **11 operational departments**; a customer can have a **different billing contact per department**. | Owner (ARF) |
| D12 | 2026-11-02 | Recurring billing is requested **once** (as a recurring billing line); AR runs it from a **billing schedule** and raises each invoice manually. | Owner (ARF) |
| D13 | 2026-11-02 | Every AR request has **billing lines**: one-off, or recurring over a **from–to date range** (frequency Monthly by default). One request can mix both. | Owner (ARF, PT-05) |
| D14 | 2026-11-02 | The customer is **searched first**; a new customer is added only when not found. A "first request" is simply a request for a new customer. | Owner (ARF, PT-05) |
| D15 | 2026-11-02 | **Billing is contract level**: customer › contract › billing lines › invoices. Billing with no contract is filed under the customer's **no-contract shell** (a contract record of type shell, one per customer + department), so the hierarchy always holds. | Owner (ARF, PT-05) |
| D16 | 2026-11-02 | The **bill-to person is held on the contract** (or shell). The department billing contact is only the default used to prefill it. | Owner (ARF, PT-05) |
| D17 | 2026-11-03 | The AR workspace follows the **Horizon Design System** workspace templates (tabbed app shell, list page template, Record page template with ribbon and contextual side bar). The portal keeps its own look. | Owner (UIX) |
| D18 | 2026-11-03 | The workspace uses the **ServiceNow default workspace theme** (no branded theme), and every record page has a **Record history** tab backed by the audit log (Audit on for every `x_ar_` table). | Owner (UIX) |
