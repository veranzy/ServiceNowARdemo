# AR-iii — Collections form (AR-iii, AR-iv, AR-v)

**Status:** In prototype (form phase 1 of #9; processing to come)
**Persona(s):** Project team (portal: the form); AR team (workspace: the case, cash application)
**Demo:** Portal → AR forms → AR-iii, AR-iv or AR-v ([AR-iv](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-iv)) · Workspace → AR requests → All Collections

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Shared form parts (General information, My requests, CC, case states):
[AR-00](../AR-00/README.md).

## Purpose

AR-iii, AR-iv and AR-v are the category **Collections** (D28): money collected **without an invoice**.
Compare AR-i, where AR bills the customer and the money is matched to the invoice. On a collection there is
no invoice: the project team tells AR to expect money, and AR matches the BSU deposit to the collection case
on the case or the deposit record (D29, BSU decision 21). Money received is still only ever a BSU deposit (D7), matched by hand (D5).

The three are **one form** (D30, client request): the requester chooses AR-iii, AR-iv or AR-v first.

## User stories

- As a project manager, I want to tell AR about money we collect without an invoice, so that AR can match it when it arrives in the bank.
- As an AR officer, I want to match the BSU deposit to the collection case, so that every deposit is accounted for.

## Screens and flow

1. **Catalogue** (AR-00, `PT-14`): three tiles, *AR-iii*, *AR-iv*, *AR-v* (name *Collections*, placeholder
   description). Each opens the same form with the type preselected (`#/portal/form/AR-iv`).
2. **Form** (`PT-49`), phase 1 of [#9](https://github.com/veranzy/ServiceNowARdemo/issues/9) (decisions 10–17):
   1. **General information** (D19, AR-00).
   2. **Collection type*** (`collection_type`, `PT-50`), right after General information (decision 8), preselected from the tile.
   3. **Collection Details** (`PT-51`), only the selected type's fields:
      - **AR-iii:** *Collection Date** ; table **Total number of collections for the day*** (`PT-52`, `x_ar_collection_tx`):
        *Collection Type** (Cashcard, Credit Card, NETS, NETS FlashPay, NETS Scan/QR; duplicates allowed), *Number of
        Transactions** (whole number > 0); 1–99 rows; *Total transactions* calculated (`PT-56`).
      - **AR-iv:** *Collection Date*, *Reference Number*, *Requesting Department Cost Centre** (active cost centres of the
        Requesting Department); table **Amount for Each Account Code*** (`PT-53`, `x_ar_collection_allocation`):
        *Description**, *Amount** (> 0), *Cost Centre** (same filter), *Account Code** (active); 1–10 rows;
        *Allocation total* calculated (`PT-57`) and stored as the Request value.
      - **AR-v:** *Category** first (Cash Bail / Seized Monies / Restitution), then only that category's fields, none
        mandatory (decision 14):
        - Cash Bail: Date of Collection, G56 Receipt Number, Bail Amount Received, Bailor Name, Bailor NRIC (masked),
          Bailor Address, IB Case Number / WEU Number, Case Status, Accused Name, Accused NRIC / FIN / Passport Number (masked).
        - Seized Monies: Date of Collection, G56 Receipt Number, Case Number, Case Status, Amount, Currency,
          *Whether the seized monies are to be invested* (Yes / No radios).
        - Restitution: Date of Collection, G56 Receipt Number, Case Number, Case Status, Amount, Currency equivalent
          when banked in.
        - Case Status choices depend on the category (subject to confirmation). Identity numbers show only the last 4
          characters outside the form.
   4. **Supporting Documents** (`PT-55`): optional attachments; for AR-v, the category's document guidance (`PT-54`).
   - Submit creates an `x_ar_request` case: `ar_form` = **COL**, `collection_type`, `submission_origin` = Manual, title
     *Collections – AR-iv*; rows copied to their tables; **Request value** = AR-iv allocation total or the AR-v amount
     (AR-iii: open question 6).
3. **Workspace** (AR team): list **All Collections** (`LST-REQ-COL`). Case page (`REQ-FV-COL`): Details with Case
   (incl. *Submission Origin* and **Request value** = the amount to collect), General information, Collection type, Collection Details, Supporting Documents; tabs *Total number of collections for the day* (`RL-REQ-CTX`) or *Amount for Each Account Code* (`RL-REQ-CAL`); ribbon *Collection type*,
   *Request value*, *BSU deposits matched*; tab **BSU deposits matched** (`RL-REQ-ALC`). Actions: Assign to me, Save,
   State dropdown (AR-00 decision 4). No billing lines, no Link to customer, no invoice on Closed complete.
4. **Matching:** AR applies a BSU deposit to the open case from the case (*Suggested BSU deposits*, *BSU deposits matched › New*) or from the deposit (D29, BSU decisions 11 and 21), against its Request value.
   Matching doesn't change the case state.
5. **Portal ticket:** Form, requester, department, Collection type; no customer, contract or billing block yet.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "Collections (AR-iii, AR-iv, AR-v)" on `x_ar_request` (`PT-49`): variable sets General information (`PT-30`), Collection type (`PT-50`). Three catalogue items (AR-iii, AR-iv, AR-v) open it with `collection_type` preset (URL parameter or default value). Producer script sets `ar_form` = COL, `collection_type`, `short_description`, `watch_list`, assignment group. |
| Case fields | Collection Details columns on `x_ar_request` (`collection_date`, `collection_reference`, `requesting_cost_centre`, `ar5_category`, `date_of_collection`, `g56_receipt_number`, `bail_amount`, `bailor_name`, `bailor_nric`, `bailor_address`, `ib_case_number`, `case_number`, `case_status`, `accused_name`, `accused_id_number`, `ar5_amount`, `ar5_currency`, `ar5_to_be_invested`, `ar5_currency_banked`; identity columns encrypted / masked, ACL by role), `submission_origin`. Child tables `x_ar_collection_tx`, `x_ar_collection_allocation` (multi-row variable sets copied by the producer script). `x_ar_request.ar_form` choice **COL** (Collections (AR-iii, AR-iv, AR-v)); `x_ar_request.collection_type` (Choice AR-iii / AR-iv / AR-v; labels to be given); `amount` = amount to collect (set by the form once its fields are defined). |
| Workspace | Form view `REQ-FV-COL` (view rule `ar_form` = COL); list `LST-REQ-COL`; related list `RL-REQ-ALC` (`x_ar_allocation.request`). |
| Business rule | Closed complete generates invoices **only** for AR-i (CCI decision 8); never for Collections. |

## Out of scope / later

- #9 processing (clarification modes, AR Approver, withdrawal, bulk close, round-robin assignment, system-generated cases): parked (decision 10, open question 7).
- Non-functional requirements and acceptance criteria AC-01 … AC-10 of #9 apply to the build (see `docs/enhancements/ENH-9.md`).
