# AR-i — open questions

1. ~~Confirm decision 5's reading of "where their contracts are".~~ No longer applies: contract location removed (decision 35).
2. Is a billing contact needed per department for every customer, or only when it differs from the
   customer's default?
3. ~~Can a request for a customer with no contract go straight to invoicing?~~ Answered by decision 12: yes, under the no-contract shell.
6. Should a no-contract request record a reason (ad-hoc service, contract pending, …)? Not asked for now.
7. Should AR be able to move a shell's billing lines onto a real contract later (e.g. when a contract is signed)?
5. Should a recurring line be able to change amount part-way (e.g. price step-up), or is that a second line with its own date range?
4. ~~Who maintains the list of 11 departments?~~ Moved to [AR-00](../AR-00/OPEN_QUESTIONS.md) question 1.
8. Full names of agency types **M**, **SB** and **PV**, and what **V@G** stands for. (Owner)
9. Should cost center and account code be validated against a list (e.g. a cost center table or the
   finance system), or stay free text? (Owner)
10. Do the finance coding values need to flow onto the invoice (e.g. for GL posting)? (Owner) **Deferred (2026-11-06):** to be decided with the AR request → invoice field mapping, later.
11. ~~Real list of sub-BUs per department.~~ Moved to [AR-00](../AR-00/OPEN_QUESTIONS.md) question 2.
12. Is Sub-BU (V@G) related to the department Sub-BU list, or always free text? (Owner)
15. Is the customer POC a different person from the bill-to person on the contract? (Owner)
16. If an existing customer's details are blank (e.g. no agency type on file), should the requester be allowed to fill them on AR-i, or must AR complete the customer first? Prototype: they stay read-only and blank. (Owner)
17. Does contract proration apply to **every** recurring line under the contract, or should a line be able to opt out? Prototype: every recurring line. (Owner)
18. Payment terms *Others* is free text, so the due date can't be calculated from it. Should Others ask for a number of days instead? Prototype: AR sets the days on the contract. (Owner)
19. ~~Is the *preferred invoice billing date* a single date, or a day of the month?~~ **No longer applies 2026-11-12:** the date is removed from AR-i (decision 38).
20. Late payment interest on a billing line item: a rate (%), as built, or an amount, or Yes / No? **Parked 2026-11-12** as [GitHub issue #3](https://github.com/veranzy/ServiceNowARdemo/issues/3); to be confirmed with the users. (Owner)
21. ~~Final place of the *Others* fields; keep account code in both places?~~ **Answered 2026-11-12:** keep the Others section as it is for now, with account code in both places (decision 36). Final placement may be revisited later.
22. ~~Should the billing line items and attention to flow onto the invoice?~~ **Answered 2026-11-12:** yes; how is decided with the AR request → invoice mapping in the workspace (decision 36, deferred to that work).
23. Are attention to name and email mandatory? Prototype: optional, prefilled from the contract bill-to. **Deferred 2026-11-12** by the owner (ignore for now). (Owner)
24. ~~Should the billing cycle set the invoice day?~~ **Answered 2026-11-12:** no; billing cycle is information only and *Suggested billing cycle* stays free text (decision 36).
13. Prorating: should the first / last month amounts be calculated from the dates (days in month) instead of typed in? (Owner)
14. Does the invoice breakdown need structure (e.g. lines with amounts), or is free text enough? (Owner)
25. **Recurring contract: when does the monthly billing schedule start (first invoice)?** AR-i no longer asks for a date (decision 38). Options: the contract's *preferred invoice billing date*, the contract start date, or AR sets it when setting up the schedule. **Deferred 2026-11-12** by the owner to the workspace design ("keep all the data in the AR-i case first"). **Interim in the prototype:** the billing line starts at the contract start date, so the demo still runs. (Owner)
26. **One-off line: what invoice date does *Create invoice* default to?** E.g. Per billing cycle → the next 1st / 15th from the contract's billing cycle; Expedited → today. **Deferred 2026-11-12** to the workspace design. **Interim in the prototype:** today. (Owner)
