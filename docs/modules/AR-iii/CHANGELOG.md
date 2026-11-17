# AR-iii — change log

One row per change, newest last. Quote build-note IDs added (`New IDs`) and retired (`Retired IDs`).

| Date | Change |
|---|---|
| 2026-11-17 | **Module created.** Collections category (D28) and deposit-to-case matching (D29) recorded; form to be defined (open question 1). No IDs added or retired. |
| 2026-11-17 | Matching to the case built in BSU (BSU decision 11): Cash application lists open AR-iii / AR-iv / AR-v cases; tab *BSU deposits matched* on the case (`RL-REQ-ALC`). |
| 2026-11-17 | D30: AR-iii, AR-iv, AR-v merged into **one Collections form**, built as a shell (General information + Collection type); tiles active; case `ar_form` = COL; workspace list, form view and ribbon. **New IDs:** `PT-49`, `PT-50`, `REQ-FV-COL`, `LST-REQ-COL`, `REQ.collection_type`. Placeholder wording to confirm: *Collections*, tile description, *Collection type*, *-- Choose the collection type --*, *The rest of this form is still to be defined.*, *Choose the collection type.*, ribbon *BSU deposits matched*, *still to match*, *All Collections*. |
| 2026-11-17 | Decision 8: Collection type stays right after General information (no change to the form). |
| 2026-11-17 | Requirement set [#9](https://github.com/veranzy/ServiceNowARdemo/issues/9) triaged: [`ENH-9.md`](../../enhancements/ENH-9.md). No build yet. |
| 2026-11-17 | #9 phase 1 built (decisions 12–17): Collection Details for AR-iii / AR-iv / AR-v, AR3 and AR4 row tables, AR5 categories, document guidance, Submission Origin, workspace sections and row tabs. **New IDs:** `PT-51`–`PT-57`, `UA-PT-addcol`, `UA-PT-addalloc`, `RL-REQ-CTX`, `RL-REQ-CAL`, `REQ.submission_origin`, `REQ.collection_date`, `REQ.collection_reference`, `REQ.requesting_cost_centre`, `REQ.ar5_category`, `REQ.date_of_collection`, `REQ.g56_receipt_number`, `REQ.bail_amount`, `REQ.bailor_name`, `REQ.bailor_nric`, `REQ.bailor_address`, `REQ.ib_case_number`, `REQ.case_number`, `REQ.case_status`, `REQ.accused_name`, `REQ.accused_id_number`, `REQ.ar5_amount`, `REQ.ar5_currency`, `REQ.ar5_to_be_invested`, `REQ.ar5_currency_banked`, `CTX.*`, `CAL.*`. Placeholders to confirm: *Category*, *-- Choose the category --*, *-- Choose the case status --*, *Total transactions*, *Allocation total*, *Supporting-document guidance:*, *1 to N rows.*, *+ Add row*, error texts. |
