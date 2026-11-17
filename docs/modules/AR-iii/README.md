# AR-iii — Collections form (AR-iii, AR-iv, AR-v)

**Status:** In prototype (shell; fields to be defined)
**Persona(s):** Project team (portal: the form); AR team (workspace: the case, cash application)
**Demo:** Portal → AR forms → AR-iii, AR-iv or AR-v ([AR-iv](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-iv)) · Workspace → AR requests → All Collections

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Shared form parts (General information, My requests, CC, case states):
[AR-00](../AR-00/README.md).

## Purpose

AR-iii, AR-iv and AR-v are the category **Collections** (D28): money collected **without an invoice**.
Compare AR-i, where AR bills the customer and the money is matched to the invoice. On a collection there is
no invoice: the project team tells AR to expect money, and AR matches the BSU deposit to the collection case
on Cash application (D29). Money received is still only ever a BSU deposit (D7), matched by hand (D5).

The three are **one form** (D30, client request): the requester chooses AR-iii, AR-iv or AR-v first.

## User stories

- As a project manager, I want to tell AR about money we collect without an invoice, so that AR can match it when it arrives in the bank.
- As an AR officer, I want to match the BSU deposit to the collection case, so that every deposit is accounted for.

## Screens and flow

1. **Catalogue** (AR-00, `PT-14`): three tiles, *AR-iii*, *AR-iv*, *AR-v* (name *Collections*, placeholder
   description). Each opens the same form with the type preselected (`#/portal/form/AR-iv`).
2. **Form** (`PT-49`), shell for now:
   1. **General information** (D19, AR-00).
   2. **Collection type*** (`collection_type`, `PT-50`), right after General information (decision 8): AR-iii / AR-iv / AR-v, preselected from the tile, starts on
      *-- Choose the collection type --* otherwise. Hint: *The rest of this form is still to be defined.*
   - Submit creates an `x_ar_request` case: `ar_form` = **COL**, `collection_type`, title *Collections – AR-iv*.
3. **Workspace** (AR team): list **All Collections** (`LST-REQ-COL`). Case page (`REQ-FV-COL`): Details with Case
   (incl. **Request value** = the amount to collect), General information, Collection type; ribbon *Collection type*,
   *Request value*, *BSU deposits matched*; tab **BSU deposits matched** (`RL-REQ-ALC`). Actions: Assign to me, Save,
   State dropdown (AR-00 decision 4). No billing lines, no Link to customer, no invoice on Closed complete.
4. **Cash application:** AR applies a BSU deposit to the open case (D29, BSU decision 11), against its Request value.
   Matching doesn't change the case state.
5. **Portal ticket:** Form, requester, department, Collection type; no customer, contract or billing block yet.

## ServiceNow mapping

| Item | Build |
|---|---|
| Record producer | "Collections (AR-iii, AR-iv, AR-v)" on `x_ar_request` (`PT-49`): variable sets General information (`PT-30`), Collection type (`PT-50`). Three catalogue items (AR-iii, AR-iv, AR-v) open it with `collection_type` preset (URL parameter or default value). Producer script sets `ar_form` = COL, `collection_type`, `short_description`, `watch_list`, assignment group. |
| Case fields | `x_ar_request.ar_form` choice **COL** (Collections (AR-iii, AR-iv, AR-v)); `x_ar_request.collection_type` (Choice AR-iii / AR-iv / AR-v; labels to be given); `amount` = amount to collect (set by the form once its fields are defined). |
| Workspace | Form view `REQ-FV-COL` (view rule `ar_form` = COL); list `LST-REQ-COL`; related list `RL-REQ-ALC` (`x_ar_allocation.request`). |
| Business rule | Closed complete generates invoices **only** for AR-i (CCI decision 8); never for Collections. |

## Out of scope / later

- The form's fields, its name and the labels of the three types (open question 1).
