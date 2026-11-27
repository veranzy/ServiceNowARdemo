# CCI — open questions

| # | Question | Owner |
|---|---|---|
| 1 | Are the rates per annum (assumed) or per month? | Owner |
| 2 | What does *minimum LPI rate* mean: a floor under the LPI rate (assumed: min ≤ rate), or a minimum interest amount per invoice? | Owner |
| 3 | Should LPI be calculated and invoiced by the app (an LPI invoice or a line on the next invoice), or only recorded for reference? If calculated: from the due date or after a grace period, simple or compound? | Owner |
| 4 | Should a no-contract shell be able to carry LPI, or only real contracts? | Owner |
| 5 | If the requested company is not in `core_company` yet, who creates it: AR when setting up the customer by hand (D31), or another team (the prototype only lets AR pick an existing company)? Should AR-i search `core_company` too? | Owner |
| 6 | Approval step before *Issue invoice* (e.g. AR manager above a threshold)? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 7 | Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 8 | Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 9 | Multi-currency: SGD only, or currency per contract? (Invoicing; also in `SERVICENOW_MAPPING.md`.) | Owner |
| 10 | Who maintains customers and contracts: AR team only, or also project team via portal? D22 says forms never change them. (Also in `SERVICENOW_MAPPING.md`.) | Owner |
| 11 | **Invoice forecast** on a billing schedule: how is it generated? Factors named by the owner: contract start and end dates, contract billing cycle, proration, and the AR-i deciding the first invoice. The daily invoice check uses the schedule's period dates until then. | Owner (to describe) |
| 12 | Working days for the daily invoice check: Mon–Fri only, or also skip Singapore public holidays? Built as Mon–Fri. | Owner |
| 13 | Invoice PDF: generated when AR issues the draft (Issue invoice)? Template and delivery are open question 7. | Owner |
| 14 | ~~Approval date: must it be set before Issue invoice?~~ Yes, for every invoice (decision 9). | Owner |
| 15 | ~~1st invoice date and amount~~ The 1st invoice is reviewed manually: invoice date suggested from the AR-i's indicated start, approval date set by AR; amount from the AR-i, AR corrects it if needed (decision 9). | Owner |
| 16 | Should one contract record (Contract or No contract) have **only one recurring billing schedule**? Owner: in theory yes, but uncertain. Today any number is allowed and the case's Billing schedule tab shows all of the contract's schedules. ([issue #7](https://github.com/veranzy/ServiceNowARdemo/issues/7)) | Owner |
| 17 | Should the locked AR-i customer search also hide inactive customers (decision 12)? Needs the AR-i portal form unlocked. | Owner |
| 18 | *(Owner 2026-11-18: keep both on the contract for now; AR-i stays locked.)* Remove contract *Billing* and *Payment terms (days)* too? The locked AR-i form's contract box shows them ("Billing: Monthly · Net 30"). Suggestion: unlock AR-i once to show the AR-i fields instead, *Contract type* and *Payment terms* (e.g. "Recurring · 30 days"), then remove both and take due-date days from *Payment terms* (30, or the days in *Other payment terms*). | Owner |
| 19 | Billing schedule redesign (owner to describe): the scheduling tool generates schedules from the case details, can be amended, and AR can add schedules ad hoc. Until then: schedule invoices use the schedule's amount per period and do not print billing lines, so a recurring case's 1st invoice (lines with GST) and later invoices (amount per period) can differ, as on ARQ0001009. | Owner |
| 20 | Generate invoice: can AR pick which billing lines go on an invoice, or does every invoice print all of the case's lines? Should a warning show when the case already has a draft invoice? | Owner |
