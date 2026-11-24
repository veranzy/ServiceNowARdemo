# AR-x — change log

One row per change, newest last. Quote build-note IDs added (`New IDs`) and retired (`Retired IDs`).

| Date | Change |
|---|---|
| 2026-11-25 | Module created from [#14](https://github.com/veranzy/ServiceNowARdemo/issues/14) (decisions 1–5): portal form AR-x (General information, Payee and amount rows, Expedited with the mandatory urgent explanation, Remarks, optional acknowledgement, Supporting documents with the AR10 Excel); each filled Excel row becomes an AR10 task with payee and amount; AR checks tasks against the payee rows; All AR-x and Open AR10 tasks lists; demo case ARQ0001018. New IDs: `PT-70`–`PT-73`, `UA-PT-addpayee`, `UA-PYT-save`, `REQ-FV-AR10`, `LST-REQ-AR10`, `RL-REQ-PYR`, `RL-REQ-PYT`, `PYT.on_form`, `PYR.in_excel`, `REQ.expedited`, `REQ.acknowledgement`, `PYR.*`, `PYT.*`, `LST/RP/HDR/FRM-PYR`, `LST/RP/HDR/FRM-PYT`. Shared with AR-ii: `PT-69`, `UA-PT-xlsample`, `UA-PT-xltemplate`; `REQ.urgent_explanation` and `REQ.remarks` now also used by AR-x. |
