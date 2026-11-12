# CCI — change log

| Date | Change |
|---|---|
| 2026-11-04 | Spec created. Contract: *Late payment interest (LPI)* section with `CON.lpi_applicable`, `CON.lpi_min_rate`, `CON.lpi_rate`; rates mandatory when LPI applicable, minimum must not exceed the rate. Sample contract `HL-2026-01` set to LPI applicable, minimum 5 %, rate 8 %. New IDs: `CON.lpi_applicable`, `CON.lpi_min_rate`, `CON.lpi_rate`. |
| 2026-11-12 | Customer name dot-walked from `core_company` (D26, decisions 2–3). New table entry `core_company` (`CMP.name`, reference only). New IDs: `CUS.company`, `CUS.company.name`, `REQ-LINKCO`. Retired ID: `CUS.name` (→ `CUS.company.name`). Link to customer now requires the company for a new customer. |
| 2026-11-12 | **Restructure (D27).** MDM and INV merged into **CCI** (customers, contracts and invoices). The customer record, contract record, billing contact and customer document parts of the old ARF spec moved here; invoice lifecycle written up from the build (Issue / Cancel invoice, payment status). Invoice open questions 6–10 copied from `SERVICENOW_MAPPING.md`. Rows above this one are the MDM history. No IDs added or retired. |
