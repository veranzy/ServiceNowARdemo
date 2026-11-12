# Modules

Each feature area of the AR app is a **module** with a short code. Every module has **its own folder**
here that records what was asked, what was decided, and how it maps to ServiceNow. The spec is written
*before* the build and updated when the build lands. Module map: D27 (`../DECISIONS.md`).

## Folder layout

```
docs/modules/<CODE>/
  README.md          the spec: purpose, user stories, screens and flow, ServiceNow mapping, out of scope
  DECISIONS.md       the module's numbered decisions (stable numbers, never reused)
  OPEN_QUESTIONS.md  questions with an owner; answered ones struck through with the decision number
  CHANGELOG.md       one row per change, with build-note IDs added and retired
```

New module: copy [`_TEMPLATE/`](_TEMPLATE/) to `<CODE>/` and add a row to the index below.
Git rules for working on a module: [`../GIT_WORKFLOW.md`](../GIT_WORKFLOW.md).

## How a module moves

1. **Ask** – Claude asks a few focused questions; answers are recorded in `DECISIONS.md`.
2. **Spec** – the folder is created from `_TEMPLATE/` (status: *Specified*).
3. **Build** – prototype changes land in commits prefixed `<CODE>:`; schema, Build notes and
   `SERVICENOW_MAPPING.md` are updated in the same commits (status: *In prototype*).
4. **Review** – the client walks through it on the live demo; changes are logged in `CHANGELOG.md`
   (status: *Agreed* once signed off, tagged `signoff/<CODE>-<date>` in git).
5. **Hand-over** – the spec + mapping doc become the build requirement for the ServiceNow team
   (status: *Ready for build*).

Cross-module decisions go in [`../DECISIONS.md`](../DECISIONS.md).

## Index (sign-off checklist)

**Lock** says what Claude may not change. *Open*: normal rules. *Locked*: no change of any kind to that part
until the owner unlocks it (CLAUDE.md → *Locks*). Only the owner edits this column: write *Locked* or *Open*
for a module or a named part of it (e.g. *Portal form: Locked*) with the date.

| Code | Module | Persona | Status | Lock |
|---|---|---|---|---|
| [AR-00](AR-00/README.md) | AR forms, shared parts: catalogue of 16 forms (AR-i … AR-xvi), General information, department sub-BU, CC list, My requests, ticket page, case states | Project team, AR team | In prototype | Open |
| [AR-i](AR-i/README.md) | AR-i New AR request: the form, Link to customer, billing lines, Create invoice / billing schedules, Raise invoice | Project team, AR team | In prototype | **Portal form: Locked** (2026-11-12, Owner) |
| [AR-ix](AR-ix/README.md) | AR-ix GIRO authorisation: add / remove GIRO on a contract; contract GIRO status from the approved AR-ix case (one active per contract) | Project team, AR team | In prototype | Open |
| [CCI](CCI/README.md) | Customers, contracts and invoices: master data, billing hierarchy, billing contacts, customer documents, invoice lifecycle (draft → issued → cancelled) | AR team | In prototype | Open |
| [BSU](BSU/README.md) | Bank statement upload and cash application: daily CSV upload, Deposit IDs, manual matching of deposits to invoices | AR team | In prototype | Open |
| [UIX](UIX/README.md) | Workspace look and layout aligned to the Horizon Design System (app shell, list page, record page) | AR team | In prototype | Open |

AR-ii … AR-xvi each get a module folder named after the form (e.g. `AR-ii/`) when the owner defines them.

## Former module codes (before 2026-11-12)

Old commits, change logs and code comments may use these codes. Build-note IDs did not change.

| Old code | Now |
|---|---|
| ARF | Split: catalogue and shared parts → **AR-00**; the AR-i form and its processing → **AR-i** (decision numbers kept); customer / contract records → **CCI** |
| GIR | **AR-ix** (decision numbers kept) |
| MDM, INV | **CCI** (MDM decision numbers kept) |
| CSH | **BSU** |
