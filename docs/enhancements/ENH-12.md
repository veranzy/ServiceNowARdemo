# ENH-12: Enhancement set 25 Nov (PM): Collections form

Issue: [#12](https://github.com/veranzy/ServiceNowARdemo/issues/12) · raised 2026-11-24 · label `enhancement` · module
**AR-iii** (Collections form) · triaged 2026-11-25 under `docs/ENHANCEMENT_SOP.md`. **Lock:** AR-iii Open.

| Item | Client wording | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|
| E12.1 | AR5 Seized Monies: checkbox order Forfeit to State, Court Order, Refund Required | AR-iii · `REQ.ar5_forfeit`, `REQ.ar5_court_order`, `REQ.ar5_refund` | Open | Decision 20 order (Refund first, label *Refund*) | New order; Seized refund label *Refund Required* | — | Built (decision 22) |
| E12.2 | AR5 Restitution: remove current case status; two statuses Case Pending, Case Closed | AR-iii · `C5L.case_status` | Open | — | Restitution choices Case Pending / Case Closed | — | Built (decision 22) |
| E12.3 | New name for AR3/4/5 form: "Submission of Supporting Documents – Collections" | AR-iii · `PT-49`, `PT-15` | Open | Decision 20 (E11.1: three tiles) | Form title, record producer and **one** catalogue tile (owner) | Where does the name apply? (owner: title + 1 tile) | Built (decision 22) |
| E12.4 | Dropdown: AR3 Counter/UPOS Terminals, AR4 Miscellaneous/Ad hoc, AR5 Cash Bail/Seized Monies/Restitution | AR-iii · `REQ.collection_type`, `PT-50` | Open | — | Labels "AR-iii Counter/UPOS Terminals" etc. (owner) | Label format (owner: code + name) | Built (decision 22) |
| E12.5 | Optional "Remarks" section before "Attachments" | AR-iii · `PT-64`, `REQ.remarks` | Open | — | Section 4. Remarks, one multi-line text box, every type | Every type or AR4 only? (owner: every type) | Built (decision 22) |

## Log

| Date | Change |
|---|---|
| 2026-11-25 | Triaged 5 items; owner answered label format, form-name scope and Remarks scope; all 5 built (AR-iii decision 22). |
