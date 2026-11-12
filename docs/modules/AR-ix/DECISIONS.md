# AR-ix — decisions

Numbers are carried over from the old GIR module (before the 2026-11-12 restructure, D27).

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | What is "directbankauth" | **GIRO** (direct debit authorisation). | 2026-11-10 |
| 2 | Case | AR-ix is a record producer on the AR request case table (`x_ar_request`, `ar_form = AR-ix`), worked in the workspace like AR-i. | 2026-11-10 |
| 3 | Contract | The requester picks the customer, then an **existing contract**, or says it is **not listed** and gives the contract / tenancy agreement / reference number. An existing contract links the case at submit. Otherwise the AR officer **processes the contract's AR-i first**, then links the case manually with **Link contract**. | 2026-11-10 |
| 4 | Form order | **Contract first** (it prefills the applicant), then GIRO details. One invoice reference number field. | 2026-11-10 |
| 5 | Applicant | Applicant name / entity, email and mobile are **prefilled from the contract's bill-to** (D16) and can be changed. Name and email mandatory. | 2026-11-10 |
| 6 | Where GIRO is recorded | ~~New table GIRO authorisation~~ (2026-11-10, **replaced 2026-11-11**). The design is **contract › AR-ix case**: the contract has **GIRO status** (Active / Not active) and **Active GIRO case** (reference to the approved AR-ix case). No separate GIRO table (D21). | 2026-11-11 |
| 9 | One GIRO per contract | A contract has **at most one active GIRO** at any time. *Add GIRO* on a contract with GIRO active is **blocked** (portal and workspace); the requester submits *Remove GIRO* first. Replacing instead of blocking is an open question ([issue #2](https://github.com/veranzy/ServiceNowARdemo/issues/2)). | 2026-11-11 |
| 10 | Remove GIRO | Ends whatever GIRO is active on the contract (purpose and car plate are recorded on the case but not matched). | 2026-11-11 |
| 7 | Carpark | **One vehicle per form**: car plate, parking start and end dates. | 2026-11-10 |
| 8 | General information | Section 1 is the shared General information variable set (D19): requester name, department, email (SSO, read-only), CC list. | 2026-11-10 |
