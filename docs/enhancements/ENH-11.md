# ENH-11: Enhancement set 19 Nov (PM): AR3 / AR4 / AR5 forms

Issue: [#11](https://github.com/veranzy/ServiceNowARdemo/issues/11) · raised 2026-11-19 · label `enhancement` · module
**AR-iii** (Collections form: AR-iii, AR-iv, AR-v; D28, D30), touching **BSU** (matching) · triaged 2026-11-19 under
`docs/ENHANCEMENT_SOP.md`.

**Lock:** AR-iii and BSU are Open. No locked part is touched.

**Context.** Most of this set repeats the owner's #9 comment of 2026-11-18, already built as **AR-iii decision 19**. The
items below compare each point with what the demo does today.

## Items

| Item | Client wording | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|
| E11.1 | Keep AR3/4/5 forms first to revisit merging later | AR-iii · `PT-49`, `PT-50`, `REQ.collection_type` | Open | **D30** (one Collections form, type chosen first) | Today: three catalogue tiles AR-iii, AR-iv, AR-v open one Collections form. | Does it mean (a) keep today's three tiles + one form (no change), or (b) three separate forms (reverses D30)? | Already done (owner: keep today's setup, decision 20) |
| E11.2 | AR3: Change "Number of Transactions" to "Amount" | AR-iii · `CTX.transaction_amount` | Open | AR-iii decision 19 used the label *Transaction Amount* | Rename the column label to **Amount**. | Label *Amount* (client) or keep *Transaction Amount*? | Built (decision 20) |
| E11.3 | AR3: supporting reports in PDF with a digital signature; strictly one PDF per AR3 submission / case | AR-iii · `PT-55` | Open | AR-iii decision 15 (generic attachments) | AR-iii only: Supporting Documents accepts **exactly one PDF** (mandatory?). Digital signature: checked by AR, not by the form (document only). | Mandatory one PDF, or at most one? | Deferred (open question 18) |
| E11.4 | AR3 and BSU mapped on the total amount, not line by line (AR3 total = BSU total) | BSU · `RL-REQ-SUG`, `UA-SUG-match` | Open | **D5** (no auto-matching) | Already: the AR3 case's Total Amount is what a BSU deposit is matched against; *Suggested BSU deposits* ranks an exact total first; AR presses *Match* (no automatic reconcile, D5). | Confirm "system should match" means a suggestion AR confirms (D5). | Already done (to confirm) |
| E11.5 | AR4: maximum 10 rows for "Amount for Each Account Code" | AR-iii · `PT-53` | Open | — | Already 1 to 10 rows. | — | Already done |
| E11.6 | AR4: Account Code a dropdown; if not available, "Others" with a free-text field | AR-iii · `CAL.account_code` | Open | — | Account Code is already a dropdown (active account codes). Add choice **Others** → free-text *Other account code* in the row. | Wording of the free-text field? | Built (decision 20) |
| E11.7 | AR4: Remove #8 "Total Number of Collections for the Day" | AR-iii · `PT-52` | Open | — | AR4 has no such field today (it is AR3's table name). | Already gone for AR4? Or remove the AR3 table title? | Deferred (open question 19) |
| E11.8 | AR4: Keep the Remarks field; remove the example / help text under Remarks | AR-iii | Open | — | The Collections form has no Remarks field today. | Add a **Remarks** field to AR4 (free text, no help text)? | Deferred (open question 19) |
| E11.9 | AR4: Remove "Collection Details" from Prototype 3; replace it with "Requesting Department Cost Center" | AR-iii · `PT-51` | Open | **AR-iii decision 19** removed *Requesting Department Cost Centre* (#9 comment, 2026-11-18) | Bring back **Requesting Department Cost Center** for AR4. "Collection Details" is section 3's title. | Restore the field? Rename section 3 for AR4, or remove a field called Collection Details? | Deferred (owner parked it; open question 17) |
| E11.10 | AR4 workspace view like AR3: main view shows the summed total; click in for the breakdown by account code | AR-iii · `RL-REQ-CAL`, ribbon | Open | — | Already: the case ribbon shows **Total Amount**; tab *Amount for Each Account Code* has the breakdown. | Show Total Amount as a column in the All Collections list too? | Already done (to confirm) |
| E11.11 | Open point: additional AR4 notes / requirements may need confirmation | AR-iii | — | — | Logged as an open question. | — | Deferred (open question 20) |
| E11.12 | Cash Bail: remove Bailor NRIC, Bailor Address, Accused's NRIC | AR-iii | Open | — | Already removed (decision 19). | — | Already done |
| E11.13 | Cash Bail: no add-row; 1 case : 1 form | AR-iii | Open | — | Already one bailor / accused set per case. | — | Already done |
| E11.14 | Cash Bail: Case Status Case Pending / Case Closed | AR-iii · `REQ.case_status` | Open | — | Already. | — | Already done |
| E11.15 | Cash Bail: for closed cases, the refund outcome says whether the refund is to the bailor or the accused | AR-iii · new field | Open | — | New field **Refund to** (Bailor / Accused), shown when Case Status = Case Closed. | Label and choices? Shown only when Refund Required is ticked too? | Built (decision 20) |
| E11.16 | Cash Bail: add "Refund Required" as a checkbox | AR-iii · `REQ.ar5_refund_required` | Open | Decision 19 built *Refund required?* as Yes / No buttons with the AR10 link | Change to a checkbox labelled **Refund Required**; ticked shows the AR10 message. | Same for Seized Monies (E11.20 calls it *Refund*)? | Built (decision 20) |
| E11.17 | Cash Bail: supporting-documents list changes with the Collection Category; AR team to provide the list | AR-iii · `PT-54` | Open | — | Already: guidance list per category. The list itself is waiting for the AR Team. | — | Already done; list deferred (AR-iii open question 15) |
| E11.18 | Seized Monies: remove G56 Receipt No. and "Indicate Currency"; keep the CAD column | AR-iii | Open | — | G56 and Currency already removed. **CAD** column: not in the demo. | What is the CAD column (a field on each case line)? | Partly done: G56 and Currency removed; CAD deferred (open question 19) |
| E11.19 | Seized Monies: Case Status Case Pending / Case Closed | AR-iii · `C5L.case_status` | Open | — | Already (per case line). | — | Already done |
| E11.20 | Seized Monies: checkboxes Refund, Forfeit to State, Court Order | AR-iii · `REQ.ar5_forfeit`, `REQ.ar5_court_order`, `REQ.ar5_refund_required` | Open | Decision 19 labels *Forfeit*, *Court order*, *Refund required?* (buttons), placed after the lines | Rename to **Refund**, **Forfeit to State**, **Court Order** as checkboxes. | Per case line (like E11.23) or once after the lines (decision 19)? | Built (decision 20; after the lines) |
| E11.21 | Seized Monies: multiple rows / line items | AR-iii · `PT-59` | Open | — | Already (Case lines). | — | Already done |
| E11.22 | Restitution: remove G56 Receipt No. and Currency | AR-iii | Open | — | Already. | — | Already done |
| E11.23 | Restitution: Case Status proposed removed (to be confirmed); Court Order checkbox; multiple rows, checkbox at line-item level | AR-iii · `C5L.case_status`, `REQ.ar5_court_order` | Open | Decision 19 (owner: checkboxes after the lines, not in them); AR-iii open question 14 | Move **Court Order** into each Restitution case line; hide Case Status for Restitution when confirmed. | Line-level checkbox reverses decision 19: confirm. Remove Restitution Case Status now or wait? | Partly: Court Order built after the lines (decision 19 kept); line-level not done; Case Status removal open (question 14) |

## Owner decisions needed

1. E11.1: three tiles + one form (no change) or three separate forms (reverses D30)?
2. E11.9 conflict: bring back *Requesting Department Cost Center* (removed by decision 19)?
3. E11.20 / E11.23 conflict: checkboxes per case line, or once after the lines (decision 19)?
4. Labels: E11.2 (*Amount*), E11.6 (Others free text), E11.15 (*Refund to*), E11.16 / E11.20 (*Refund Required* / *Refund*).
5. Unclear items: E11.7 (#8), E11.8 (Remarks), E11.18 (CAD column).

## Log

| Date | Change |
|---|---|
| 2026-11-19 | Triaged: 23 items. 10 already done (2 to confirm), 1 deferred, 12 need the owner (3 conflict with decisions: D30, AR-iii decision 19 twice). |
| 2026-11-19 | Owner: E11.1 keep setup; E11.9 parked; checkboxes stay after the lines; client wording accepted. Built E11.2, E11.6, E11.15, E11.16, E11.20 (AR-iii decision 20). Deferred E11.3, E11.7, E11.8, E11.9, E11.11, CAD in E11.18 (open questions 17–20). |
