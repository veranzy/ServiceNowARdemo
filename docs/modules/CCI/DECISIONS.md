# CCI — decisions

Numbers 1–3 are carried over from the old MDM module. Invoicing (former INV) had no module decisions;
it follows D2 (system of record), D12 (never automatic) and D15 (billing hierarchy).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Does the contract record whether late payment interest applies? | Yes: three fields on the contract, in a *Late payment interest (LPI)* form section. | 2026-11-04 |
| 2 | Where does the customer name come from? | From the platform `core_company` table (D26). `x_ar_customer.company` (Reference, mandatory, display field) → `core_company`; name dot-walked from `company.name`, not stored. Only the name comes from `core_company`; UEN, address and other details stay on `x_ar_customer`. | 2026-11-12 |
| 3 | Who creates the customer record for a new customer on AR-i? | AR-i only records the customer details on the request (transaction data). The processing officer creates the `x_ar_customer` record with *Link to customer* and must choose its `core_company` record. | 2026-11-12 |
