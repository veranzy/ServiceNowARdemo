# CCI — decisions

Numbers 1–3 are carried over from the old MDM module. Invoicing (former INV) had no module decisions;
it follows D2 (system of record), D12 (never automatic) and D15 (billing hierarchy).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Does the contract record whether late payment interest applies? | Yes: three fields on the contract, in a *Late payment interest (LPI)* form section. | 2026-11-04 |
| 2 | Where does the customer name come from? | From the platform `core_company` table (D26). `x_ar_customer.company` (Reference, mandatory, display field) → `core_company`; name dot-walked from `company.name`, not stored. Only the name comes from `core_company`; UEN, address and other details stay on `x_ar_customer`. | 2026-11-12 |
| 3 | Who creates the customer record for a new customer on AR-i? | AR-i only records the customer details on the request (transaction data). The processing officer creates the `x_ar_customer` record with *Link to customer* and must choose its `core_company` record. | 2026-11-12 |
| 4 | Customer record tabs | Billing hierarchy tab removed; usage and purpose to revisit ([issue #6](https://github.com/veranzy/ServiceNowARdemo/issues/6)). Billing schedules are no longer listed on the customer, only on contracts. Customer and contract records show **every tab** (no More menu). | 2026-11-16 |
| 5 | Contract category and Contract ID | Field `contract_type` is labelled **Contract category** with choices **Contract / No contract** (No contract = the former no-contract shell). Every record gets a read-only system **Contract ID** (CTR0001001 …). **Contract number** stays the customer's number: mandatory for Contract, optional for No contract (shows the Contract ID when empty). A customer can have several No contract records (D15 amended). | 2026-11-16 |
| 6 | Billing schedule under a contract | **Contract** is mandatory on a billing schedule; the customer follows the contract (read-only). | 2026-11-16 |
| 7 | Daily invoice check | D12 amended: a daily scheduled job creates each billing period's **draft** invoice 5 working days (Mon–Fri) before its invoice date, linked to the schedule, the contract and the original AR-i case and line (shown on the case's new **Invoices** tab, with a work note). Draft → issued stays manual by the AR team (*Issue invoice*). *Raise invoice* retired. Demo: **Run daily invoice check** in the demo bar. Until the forecast logic is specified, the job uses the schedule's existing period dates. | 2026-11-16 |
