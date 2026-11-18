# BSU — open questions

1. Who may upload: any AR team member, or a named few?
2. Should an upload be deletable/re-uploadable if the wrong file was used? *(Now an RITM, decision 12: corrections could follow the RITM process.)*
3. Non-customer deposits stay in the to-match list (decision 10). Revisit if the list gets noisy?
4. ~~Cash application for Collections cases (D29): how the finder offers open cases and what an allocation records.~~ Built (decision 11).
5. ~~Can one BSU deposit be split across invoices and Collections cases together?~~ Yes (decision 15, 2026-11-18).
6. ~~Rename the finder labels?~~ Yes, proposed wording (decision 14, 2026-11-18).
7. ~~AR-iii cases have no amount, so they cannot be matched.~~ AR-iii rows now carry a Transaction Amount; the case is matched against its Total Amount (AR-iii decision 19, 2026-11-18).
8. How to track upload completeness (which bank accounts have no RITM for a statement day). Decided later (decision 16). (Owner)
9. Fallback Deposit ID for lines with no payment mode: `UNK-DDMMYY-XX` is a placeholder. What prefix and suffix? (Owner)
10. Deposit IDs repeat within a payment mode and day (decision 18). Is another unique reference needed when AR or the bank quotes a deposit? (Owner)
11. Why do payment modes need an account code and a cost centre (decision 20)? E.g. default posting for deposits of that mode, or for Collections? Mandatory once confirmed? (Owner)
