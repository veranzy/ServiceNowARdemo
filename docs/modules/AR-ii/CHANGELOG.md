# AR-ii — change log

One row per change, newest last. Quote build-note IDs added (`New IDs`) and retired (`Retired IDs`).

| Date | Change |
|---|---|
| 2026-11-25 | Module created from [#13](https://github.com/veranzy/ServiceNowARdemo/issues/13) (decisions 1–5): portal form AR-ii Refund request (General information, Reason for Refund rows 1–5 with Add More, urgent explanation, Supporting documents); one AR2 task per row; All AR-ii and Open AR2 tasks lists; AR2 tasks tab on the case; task page; ticket page shows the tasks; demo case ARQ0001017. New IDs: `PT-65`–`PT-68`, `UA-PT-addrefund`, `UA-RFT-save`, `REQ-FV-AR2`, `LST-REQ-AR2`, `RL-REQ-RFT`, `REQ.urgent_explanation`, `RFT.*`, `LST/RP/HDR/FRM-RFT`. |
| 2026-11-25 | [#15](https://github.com/veranzy/ServiceNowARdemo/issues/15) Excel upload (decisions 6, 7; amends 5): the form reads the AR2 Excel template (Upload Excel, Use sample file, Download template); each filled row becomes an AR2 task with the template columns; the Reason for Refund rows move to `x_ar_refund_reason` (summary tab on the case). Ribbon adds *Excel total*; ticket page lists the tasks by payee. New IDs: `PT-69`, `UA-PT-xlsample`, `UA-PT-xltemplate`, `RFR.*`, `LST/RP/HDR/FRM-RFR`, `RL-REQ-RFR`, `RFT.collection_reference`, `RFT.amount`, `RFT.case_reference`, `RFT.payee_name`, `RFT.amount_not_sgd`. Changed: `RFT.refund_reason` (now free text from the Excel), `PT-66`, `PT-67`, `PT-68`. **Retired IDs:** `RFT.cases_registered` (moved to `RFR.cases_registered`). |
