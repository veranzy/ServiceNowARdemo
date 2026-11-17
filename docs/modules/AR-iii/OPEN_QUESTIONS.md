# AR-iii — open questions

Every question has an owner. Answered ones are struck through with the answer and the decision number;
parked ones link their GitHub issue (label `AR-iii`).

1. *(Being answered by [#9](https://github.com/veranzy/ServiceNowARdemo/issues/9), see `docs/enhancements/ENH-9.md`.)* The Collections form's name, the labels of the three types (AR-iii, AR-iv, AR-v), what each covers, and the form's sections and fields after Collection type. Placeholders meanwhile: *Collections*, *Collection type*, codes as choice labels, tile description *Money collected without an invoice. One form for AR-iii, AR-iv and AR-v.* (Owner)
2. Does a collection need the customer and contract from AR's master data (existing customer only, as AR-ix; existing or new, as AR-i; or a free-text payer)? Owner: not sure yet (2026-11-17). Applies to AR-iv and AR-v too. (Owner)
3. ~~What does AR do with the case when the deposit is matched?~~ Nothing automatic: AR sets the state by hand (BSU decision 11, 2026-11-17).
4. Can one deposit cover several collection cases, or one case be paid by several deposits? Built as for invoices (both allowed); mixing invoices and cases is BSU open question 5. (Owner)
5. ~~Should Collection type move above General information?~~ No: it stays right after General information (decision 8, 2026-11-17).
6. AR3 has no amount (only transaction counts). What does AR match a BSU deposit to for an AR3 case (D29 uses the Request value)? ([#9](https://github.com/veranzy/ServiceNowARdemo/issues/9) E9.5) (Owner)
7. Shared-part changes from #9, one by one: CC Count + up to 10 CC fields (E9.3), round-robin assignment (E9.13), clarification with reopened fields (E9.14), AR Approver role and approval (E9.15), state *Awaiting Internal Information* (E9.16, E9.20), withdrawal (E9.17), closure codes (E9.18), bulk close (E9.19), system-generated cases (E9.12). Parked by decision 10. (Owner)
