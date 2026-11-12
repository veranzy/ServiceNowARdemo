# CCI — open questions

| # | Question | Owner |
|---|---|---|
| 1 | Are the rates per annum (assumed) or per month? | Owner |
| 2 | What does *minimum LPI rate* mean: a floor under the LPI rate (assumed: min ≤ rate), or a minimum interest amount per invoice? | Owner |
| 3 | Should LPI be calculated and invoiced by the app (an LPI invoice or a line on the next invoice), or only recorded for reference? If calculated: from the due date or after a grace period, simple or compound? | Owner |
| 4 | Should a no-contract shell be able to carry LPI, or only real contracts? | Owner |
| 5 | If the requested company is not in `core_company` yet, who creates it: AR from *Link to customer*, or another team (the prototype only lets AR pick an existing company)? Should AR-i search `core_company` too? | Owner |
| 6 | Approval step before *Issue invoice* (e.g. AR manager above a threshold)? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 7 | Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 8 | Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 9 | Multi-currency: SGD only, or currency per contract? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 10 | Who maintains customers and contracts: AR team only, or also project team via portal? D22 says forms never change them. (Also in `SERVICENOW_MAPPING.md`.) | Owner |
