# AR-iii — Collections form (first of AR-iii, AR-iv, AR-v)

**Status:** Being defined (owner to supply the form)
**Persona(s):** Project team (portal: the form); AR team (workspace: the case, cash application)
**Demo:** not built yet. AR-iii shows as *To be defined* in Portal → AR forms.

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md). Shared form parts (General information, My requests, CC, case states):
[AR-00](../AR-00/README.md).

## Purpose

AR-iii, AR-iv and AR-v form the category **Collections** (D28): money collected **without an invoice**.
Compare AR-i, where AR bills the customer and the money is matched to the invoice. On a collection there is
no invoice: the project team tells AR to expect money, and AR matches the BSU deposit to the collection case
on Cash application (D29). Money received is still only ever a BSU deposit (D7), matched by hand (D5).

The forms are defined one at a time (AR-iii first). Collections is documented only; the portal catalogue
keeps one flat list (D28).

## User stories

- As a project manager, I want to tell AR about money we collect without an invoice, so that AR can match it when it arrives in the bank.
- As an AR officer, I want to match the BSU deposit to the collection case, so that every deposit is accounted for.

## Screens and flow

To be defined with the owner (open question 1). Known so far:

1. Portal: AR-iii form → `x_ar_request` case (`ar_form = AR-iii`), General information as on every form (D19).
2. Workspace: AR works the case (Assign to me, Save, State dropdown; AR-00 decision 4).
3. Cash application: AR applies the BSU deposit to the open AR-iii case (D29), manually.

## ServiceNow mapping

To be defined. Expected: record producer "AR-iii …" on `x_ar_request`; Cash application allocation target
extended from `x_ar_invoice` to collection cases (D29, BSU).

## Out of scope / later

- AR-iv and AR-v: their own module folders when the owner defines them (D27).
