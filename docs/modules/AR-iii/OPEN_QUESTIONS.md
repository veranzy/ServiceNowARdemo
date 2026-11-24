# AR-iii — open questions

Every question has an owner. Answered ones are struck through with the answer and the decision number;
parked ones link their GitHub issue (label `AR-iii`).

1. *(Being answered by [#9](https://github.com/veranzy/ServiceNowARdemo/issues/9), see `docs/enhancements/ENH-9.md`.)* The Collections form's name, the labels of the three types (AR-iii, AR-iv, AR-v), what each covers, and the form's sections and fields after Collection type. Placeholders meanwhile: *Collections*, *Collection type*, codes as choice labels, tile description *Money collected without an invoice. One form for AR-iii, AR-iv and AR-v.* (Owner)
2. ~~Does a collection need the customer and contract from AR's master data?~~ No: customer and contract maintenance is out of scope for Collections (#9 §3, E9.24, 2026-11-17).
3. ~~What does AR do with the case when the deposit is matched?~~ Nothing automatic: AR sets the state by hand (BSU decision 11, 2026-11-17).
4. Can one deposit cover several collection cases, or one case be paid by several deposits? Built as for invoices (both allowed); mixing invoices and cases is BSU open question 5. (Owner)
5. ~~Should Collection type move above General information?~~ No: it stays right after General information (decision 8, 2026-11-17).
6. ~~AR3 has no amount (only transaction counts). What does AR match a BSU deposit to for an AR3 case (D29 uses the Request value)? ([#9](https://github.com/veranzy/ServiceNowARdemo/issues/9) E9.5) **Parked** (decision 18, 2026-11-18). (Owner)
7. Shared-part changes from #9, one by one: CC Count + up to 10 CC fields (E9.3), round-robin assignment (E9.13), clarification with reopened fields (E9.14), AR Approver role and approval (E9.15), state *Awaiting Internal Information* (E9.16, E9.20), withdrawal (E9.17), closure codes (E9.18), bulk close (E9.19), system-generated cases (E9.12). Parked by decision 10. (Owner)
8. Wording of the warning when the collection type is changed after details are entered (#9 §5, E9.2). Owner to give the wording; until then changing the type keeps the other type's entries in the draft and clears them on submit. **Parked** (decision 18, 2026-11-18). (Owner)
9. ~~Do we need a currency master list, or is the default list enough?~~ No currency fields any more (decision 19, 2026-11-18).
10. ~~Restitution *Currency equivalent when banked in*: a currency choice or an SGD amount?~~ Removed (decision 19, 2026-11-18).
11. AR4 GST / recovery check: which account-code rule applies, and must the allocation total equal a collection total (§8, §22)? Not checked in the demo. **Parked** (decision 18, 2026-11-18). (Owner)
12. ~~Request value for AR-v when the currency isn't SGD.~~ No currency fields; amounts are SGD (decision 19, 2026-11-18).
13. From #9 §22, still open: 7 MB per file or per submission; AR5 mandatory fields per category; final AR5 status lists; AR4 Collection Date optional on purpose; permitted attachment formats. **Parked** (decision 18, 2026-11-18). (Owner)
14. ~~Restitution *Case Status* choices (TBD).~~ Case Pending / Case Closed (decision 22, 2026-11-25). Built with today's list (Forfeit to State with court order, Forfeit to State without court order, Case Pending) until confirmed (decision 19). (Owner)
15. Instructions per AR5 category (Cash Bail, Seized Monies, Restitution): wording to give. The document guidance per category (`PT-54`) still lists *G56* for Seized Monies and Restitution although their G56 field is removed: keep or drop? (Owner)
16. Case lines (Seized Monies, Restitution): how many lines at most, and is at least one line required? Built 0–99, none mandatory (decision 14). (Owner)
17. **#11 E11.9:** bring back *Requesting Department Cost Center* for AR4 ("replace Collection Details")? AR-iii decision 19 removed it on the owner's #9 comment. Parked by the owner (2026-11-19). (Owner)
18. **#11 E11.3:** AR3 supporting report: exactly one PDF (digitally signed) per case. Mandatory, or at most one? Today any number of files, optional. (Owner)
19. **#11 unclear items:** E11.7 "Remove #8 Total Number of Collections for the Day" (AR4 has no such field), ~~E11.8 Remarks~~ (added as section 4. Remarks, decision 22), E11.18 "Keep the CAD column" (Seized Monies; not in the demo). What do they refer to? (Owner)
20. **#11 E11.11:** additional AR4 notes / requirements not captured; to confirm with the client. (Owner)
