# Receivables Desk (App 2) — project brief

**Purpose:** a clickable prototype used to settle requirements for a **ServiceNow build** of an accounts
receivable app (custom scoped app on App Engine). Every screen should map to something the build team
can configure: tables and fields, record producer, portal widgets, workspace pages, UI actions, business
rules, flows. When adding a feature, add its ServiceNow equivalent too (schema + build notes + mapping doc).

Static site, no backend, no build step, no AI calls. Hosted on GitHub Pages:
https://veranzy.github.io/ServiceNowARdemo/ (deploys on every push to `main` via `.github/workflows/pages.yml`).

## Project instructions (team-maintained)

This section is the shared brief for anyone working on the project with Claude: repo sessions read
this file automatically. It lives **only in git**: it is not exported to the Claude project "ServiceNow AR";
project chats read it on GitHub (https://github.com/veranzy/ServiceNowARdemo/blob/main/CLAUDE.md). **Edit it here** when
a rule changes, commit with the prefix `DOCS:`, and add a line to *Instruction changes* at the end of
this section. Keep it short; module detail belongs in `docs/modules/`, not here.

**Goal and audience.** A clickable prototype plus a requirements pack for client **sign-off**, then
hand-over to a ServiceNow developer who must be able to build from the docs alone (spec +
`SERVICENOW_MAPPING.md` + `docs/BUILD_NOTES.md`), without the prototype.

**Source of truth.** This repo. Docs in the Claude project (`requirements/*.md`) are exported copies
for reference; if they differ from the repo, the repo wins. After a change that touches the docs,
re-export the changed files to the Claude project (or tell the owner they are stale). **Never export
CLAUDE.md**: the brief has a single copy, in git.

**Standing decisions** (don't revisit unless the owner asks; full list in `docs/DECISIONS.md`):
- All tables are custom tables in the scoped app; no CSM or `ast_contract` (D1). Exception: `x_ar_customer`
  references the platform `core_company` table and dot-walks the customer name from `company.name` (D26).
- The app is the system of record for invoices (D2).
- Project team uses the portal only; AR team uses the workspace only (D3).
- **No auto-matching, ever** (D5). Money received is only ever a BSU deposit (D7).
- Billing is contract level: customer › contract (or no-contract shell) › billing lines › invoices (D15);
  bill-to sits on the contract (D16).

**Context: forms vs master data (D22).** AR forms and customer / contract updates are separate **on
purpose**. A form is a request and never changes master data by itself; AR updates customers and
contracts in the workspace, and forms only read it (e.g. AR-i shows the contract's GIRO status
read-only, and only an AR-ix changes GIRO). Expect, and design for, scenarios that follow from this
(listed in `docs/modules/AR-00/README.md` → Context).

If a request conflicts with a recorded decision, point out the conflict and ask. Never override a
decision silently; a changed decision is recorded as a new or amended entry with its date.

**Quality bar for requirements.**
- Every screen element maps to a ServiceNow artefact (table, field, UI action, business rule, ACL,
  widget, flow) and carries a registered Build notes ID.
- A module spec is buildable without the prototype: tables and columns, choices, mandatory rules,
  UI actions and their effects, calculated fields, ACLs, notifications, open questions.
- Every open question has an owner and is listed in the module spec; resolved ones become decisions.
- When docs contradict each other (spec vs mapping vs build notes vs code), flag it and fix the source
  (`js/schema.js`, `js/notes.js` or the spec), never the generated sections.

**Module status for sign-off.** A module is *Agreed* only when the client has walked through it on the
live demo and its open questions are answered or explicitly deferred. Keep the status column in
`docs/modules/README.md` current; that table is the sign-off checklist.

**Style.** Plain English, short sentences. Sample or anonymised data only (the demo is public).
Singapore context: SGD, local bank CSV formats, UEN / ACRA.

**Instruction changes**

| Date | Change | By |
|---|---|---|
| 2026-11-02 | Section added: goal, source of truth, standing decisions, quality bar, sign-off status, style. | Owner |
| 2026-11-12 | Context added: AR forms and customer / contract updates are separate on purpose (D22). | Owner |
| 2026-11-12 | Standing decision D1 amended: customer name dot-walked from `core_company` (D26). | Owner |
| 2026-11-12 | Brief lives only in git: the Claude project copy is decommissioned and CLAUDE.md is no longer exported. | Owner |
| 2026-11-12 | Module map changed (D27): one module per AR form (AR-00 shared, AR-i, AR-ix, …), CCI, BSU (with cash application), UIX; one folder per module; git rules in `docs/GIT_WORKFLOW.md` with `node tools/check.mjs` before every push. | Owner |

## How we work: modules, one at a time

Features are added progressively as **modules** (D27, index and status in `docs/modules/README.md`):

| Code | Module |
|---|---|
| `AR-00` | AR forms, shared parts: catalogue, General information, My requests, ticket page, case states |
| `AR-i`, `AR-ix`, … | One module per AR form number: its portal form and its workspace processing |
| `CCI` | Customers, contracts and invoices |
| `BSU` | Bank statement upload and cash application (manual matching) |
| `UIX` | Workspace look and layout (Horizon) |

Each module is a folder `docs/modules/<CODE>/` with `README.md` (spec), `DECISIONS.md`,
`OPEN_QUESTIONS.md` and `CHANGELOG.md`. **Git rules for every session are in `docs/GIT_WORKFLOW.md`:**
pull first, one module per commit with its code as prefix, docs in the same commit, `node tools/check.mjs`
before every push, never force-push. For every new module or change:

1. **Ask first.** Before building, ask the owner 2–4 focused questions (multiple choice with a
   recommended option) about the decisions that change the build. Don't build on guesses.
2. **Spec.** Create or update `docs/modules/<CODE>/` (copy `docs/modules/_TEMPLATE/`): spec, decisions,
   open questions, change log. Add the module to the index in `docs/modules/README.md`. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).
3. **Build** in the prototype with schema + Build notes; regenerate `SERVICENOW_MAPPING.md`.
4. **Check and commit** (`docs/GIT_WORKFLOW.md`): `node tools/check.mjs`, commit with the module code as
   prefix (`AR-i: …`), push to `main`, confirm the Pages deploy and the Check run.
5. **Prompt the next step.** End by suggesting the next module or refinement and the questions it needs.

## Change requests by build-note ID

Two independent toggles in the demo bar: **Show IDs** (off by default; tick it to find IDs) draws a small purple ID tag on
every mapped element, for the owner's change requests; **ServiceNow notes** (off by default) is the
developer view: interactive note cards `[ID] <ServiceNow table/field/UI action/widget>` drawn on a
separate layer (`js/views/devnotes.js`, `#snLayer`) so nothing clips them; click a card to expand,
× to dismiss, "Restore" in the demo bar (body classes `sn-notes` and `sn-dev`). Hover shows the note via `title` when either is on. The owner finds the element and writes `<ID> - <change>` (e.g.
`BSU-03 - add a closing balance field`, `INV.due_date - default to end of next month`). To act on one:

1. Look the ID up in `js/notes.js` (or `docs/BUILD_NOTES.md`). Field IDs are `<TABLE CODE>.<column>`
   from `js/schema.js`; element IDs are used as `sn("ID")` in `js/views/*` (grep for the ID).
2. Make the change in the prototype (schema for fields, the view for elements).
3. Every new outlined element gets a **new** registered ID: add it to `NOTES` / `UI_ACTIONS` /
   `RELATED` / `CALC_COLS` in `js/notes.js` and call `sn("ID")`. `sn()` warns in the console for
   unregistered IDs. IDs are stable: never renumber or reuse one; if an element is removed, leave a
   line in the module's `CHANGELOG.md` saying the ID was retired.
4. Record the request in the owning module's `CHANGELOG.md` (quote the ID), run `node tools/check.mjs`
   (it regenerates `docs/BUILD_NOTES.md` and `SERVICENOW_MAPPING.md`), commit with the module code prefix, push.
5. If the request is ambiguous or changes a decision, ask before building.

"App 1" was an earlier Claude-hosted prototype with Claude-powered matching. It is frozen and will be
rebuilt later from this codebase. Do not add Claude/LLM calls here unless the owner asks.

## Personas (switch with the demo bar at the top)

| Persona | Role | UI | Does |
|---|---|---|---|
| Company project team | `x_ar.project_team` | **Portal only** (Service Portal / Employee Center look) | Picks from **16 AR forms (AR-i … AR-xvi)**; defined so far: AR-i *New AR request* (customer search, contract, invoice details) and AR-ix *GIRO authorisation*. Every form starts with **General information** (D19). Follows **My requests** (own cases and cases they are CC'd on), replies on the ticket page |
| Accounts receivable team | `x_ar.ar_team` | **Workspace only** (configurable workspace look) | Works AR request **cases**, creates and issues invoices, uploads bank statements (**BSU**), matches deposits to invoices **manually**, maintains customers, contracts and bank accounts |

Core flow: project team submits **AR-i**: searches the customer and adds it as new only if not found
(D14; a "first request" is just a request for a new customer), department, **contract** (D15: existing,
new, or *No contract required* → the customer's no-contract shell per department) with its **bill-to
person** (D16, held on the contract), **invoice details** (D13 amended: one billing event per request; invoice
description, attention to, amount per period before GST, invoice timing for one-invoice requests (Per billing cycle /
Expedited with justification), optional billing line items numbered 1, 2, 3… with GST 9%, D25; submit creates one billing line: recurring monthly to the contract end when the contract type is
Recurring, else one-off), documents only if not on file → `x_ar_request` case
(New) in the workspace → AR **Link to customer** (creates/links the customer, links/creates the contract
or shell and sets it on every line, writes the bill-to to the contract, files documents on the customer) → AR assigns,
may *Request info* (portal reply returns it to In progress) or *Reject* → per **billing line**: one-off →
*Create invoice* (draft) → *Issue invoice*; recurring → *Set up billing schedule*, then **Raise invoice**
per due period (never automatic, D12). The request becomes **Billed** when every line is invoiced
(issued) or scheduled; the requester sees each line's invoice or schedule on the ticket page. Each morning AR
uploads yesterday's CSV statement per bank account (**BSU**) → deposits saved to the **Bank statements**
table with a Deposit ID → AR matches deposits to issued invoices **manually** on the Cash application page.
**There is no auto-matching anywhere (D5); don't add it.** The app is the **system of record** for
invoices. Automation after AR form submission is still to be defined by the owner.

## Domain model (all custom tables, see `js/schema.js`)

customer → contracts (incl. no-contract shells, `contract_type = shell`, D15) → billing lines → invoices ← allocations ← deposits (Bank statements) ← BSU uploads ← bank accounts
AR request → billing line (`x_ar_request_line`, code key `lines`, one per AR-i, with `contract`) → invoice (one-off) or billing schedule (recurring) · AR request → billing line items (`x_ar_request_item`, code key `items`, GST calculated)
contract → GIRO status + active AR-ix case (`giro_status`, `giro_case`; max one active GIRO per contract, D21) · contract → bill-to person (D16) · customer → billing contacts (department default for prefill, D11) · customer documents (given once, D10) · billing schedules → invoices (per period)

**Departments:** 11 operational departments in `DEPARTMENTS` (`js/schema.js`); bank accounts may also be Finance.

**Money received is only ever a BSU deposit (D7).** There is no payments table or "payment received"
concept: deposits come from BSU uploads, live in `x_ar_bank_statement` (code key `deposits`,
`S.deposits`, `TABLES.deposits`) and are matched to invoices on the Cash application page. Say
"BSU deposit" in the UI and docs, never "payment".

- **`js/schema.js` is the single source** for tables, columns, types, choices, roles and the record
  producer. Forms, list columns, Build notes and `SERVICENOW_MAPPING.md` all read it.
  After changing it run `node tools/mapping.mjs` to regenerate the mapping doc.
- Invoice `state`: draft / issued / cancelled. Payment status (Unpaid / Part paid / Paid / Overdue) is
  calculated from accepted allocations. Only **issued** invoices can receive payments.
- AR request `state`: new / in_progress / awaiting_info / invoiced (label **Billed**) / rejected. There is
  no request type field; `amount` is the calculated request value (sum of line values). `activity` holds journal
  entries: `comment` (visible on portal), `work_note` (AR only), `system`.
- Matches (`S.matches[<deposit id>]`) hold the deposit's allocations; `status: "accepted"` applies them.
  Only manual matching creates them (invoice finder → Apply); *Remove match* clears them.
- Bank accounts have bank (MB/OB/US mock aliases), department and account type. Each bank's CSV
  layout is in `BANKS` in `js/schema.js`.

## Code layout

```
index.html              just #app; everything renders from JS
css/styles.css          tokens (light/dark), workspace, portal, cash application, build-notes overlay
js/main.js              delegated event handling (click/change/input/submit) and boot
js/state.js             S: data tables + UI state (persona, workspace tabs, portal page, drafts)
js/schema.js            ServiceNow tables/fields/roles/record producer (no DOM)
js/records.js           lifecycle: createRequest, requestAction (assign/info/reject/invoice), issueInvoice,
                        cancelInvoice, portalComment, saveRecord, validate, numbering, journal;
                        AR-i: validateARi, lineErrors, docsOnFile, contactFor, setupStatus, linkCustomer;
                        lines: periodDates, lineValue, linesSummary, lineStatus, lineInvoice, setupSchedule(lineId);
                        schedules: schedulePeriods, periodsDue, nextBilling, raiseInvoice
js/ledger.js            ledger reads: invoiceUse (applied/reserved), rollup, lookups
js/matching.js          manual allocation (act: manual/remove), allocationPlan, finder ranking (signals)
js/bsu.js               BSU: parse bank CSV by template, Deposit IDs, saveUpload, sample CSV per bank
js/io.js                CSV parser, matches CSV export
js/sample-data.js       users, customers, contracts, invoices, AR requests, payments (dates shift to today)
js/views/app.js         render(): demo bar + active persona; toast; setStatus
js/views/workspace.js   workspace shell, landing page, list pages (LISTS), record pages (LAYOUT, UI actions, activity)
js/views/portal.js      portal home, AR forms catalogue (AR-i … AR-xvi), AR-i form, confirmation, My requests, ticket page
js/views/cash.js        cash application page (manual matching of deposits)
js/views/bsu.js         BSU page: statement-day checklist, upload + preview, recent uploads
js/views/finder.js      invoice finder (ranked candidates + allocation preview)
js/views/devnotes.js    ServiceNow notes cards layer (expand / dismiss / restore, follows scroll and re-renders)
js/views/common.js      sn() build-note attribute, fieldHtml (forms from schema), chips, related lists, icons
tools/mapping.mjs       generates SERVICENOW_MAPPING.md from the schema
js/notes.js             build-note ID registry (table codes, element notes, UI actions, related lists)
tools/notes.mjs         generates docs/BUILD_NOTES.md (every ID and what it maps to)
tools/check.mjs         pre-push check (syntax, IDs, generated docs, module folders, links); CI runs it
docs/modules/<CODE>/    one folder per module (see "How we work"); docs/DECISIONS.md cross-module decisions
docs/GIT_WORKFLOW.md    git rules for every session
```

## Conventions

- **Money is integer cents.** Parse with `cents()`, display with `fmt()`.
- **State lives in `S`.** Mutate, then `render()`. `render()` redraws the whole app and restores focus by
  element id, so give inputs stable ids. For typing, update state without re-rendering (see the `input`
  handler); re-render on `change` only where dependent fields must refresh (selects).
- **Escape** every data value with `esc()` in templates.
- **Events are delegated** on `document` via `data-*` attributes (`data-open="table:id"`, `data-ui`,
  `data-list`, `data-rail`, `data-pnav`, `data-ticket`, …). Never attach listeners to rendered nodes.
- **ID tags (Build notes):** every element that corresponds to a ServiceNow artefact gets `sn("<ID>")` with an
  ID registered in `js/notes.js` (see "Change requests by build-note ID"). Fields get `<CODE>.<column>`
  IDs automatically through `fieldHtml`.
- **Workspace vs portal:** AR features go in the workspace only; project-team features in the portal only.
- **Workspace layout follows Horizon (D17, `docs/modules/UIX/README.md`):** record pages are header › ribbon ›
  record tabs (`related()` returns one tab per related list) + contextual side bar (`sidePanels()`);
  UI actions return `{html, ovf}` (overflow menu); metrics go in `ribbon()`, identity in `headerFields()`.
  Workspace tokens are scoped to `body[data-persona="ar"]` in `css/styles.css`.
- Styling uses the tokens in `css/styles.css`; every colour must work in light and dark. Layout must
  work at 400px wide with no horizontal page scroll.
- Sample data is fictional (Singapore, SGD). Keep it fictional.

## Checking changes

Serve with `python3 -m http.server` (modules don't load from `file://`). Click through: portal AR form
AR-i with each contract option (new contract, existing contract with bill-to, no contract with existing /
new shell); (search → add new customer with a new recurring contract; existing ad-hoc contract → one invoice;
existing recurring contract with billing line items, GST calculated; expedited without a justification rejected; recurring shows no invoice timing) → workspace Link to customer (contract / shell created, lines filed) → customer
billing hierarchy → per line Create invoice / Set up billing
schedule → request Billed → Raise invoice → portal ticket shows each line's invoice / schedule; BSU upload
(sample file and a real CSV file, wrong-bank error); cash application Find invoice → Apply, Remove match;
ID tags visible and unclipped; 400px wide in dark mode.
No console errors.

## Deploy

Push to `main` (after `node tools/check.mjs`). Pages source must stay "GitHub Actions". Two workflows run on
every push: **Deploy to GitHub Pages** and **Check** (`.github/workflows/check.yml`); both must be green.
