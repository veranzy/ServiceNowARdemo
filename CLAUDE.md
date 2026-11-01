# Receivables Desk (App 2) — project brief

**Purpose:** a clickable prototype used to settle requirements for a **ServiceNow build** of an accounts
receivable app (custom scoped app on App Engine). Every screen should map to something the build team
can configure: tables and fields, record producer, portal widgets, workspace pages, UI actions, business
rules, flows. When adding a feature, add its ServiceNow equivalent too (schema + build notes + mapping doc).

Static site, no backend, no build step, no AI calls. Hosted on GitHub Pages:
https://veranzy.github.io/ServiceNowARdemo/ (deploys on every push to `main` via `.github/workflows/pages.yml`).

## How we work: modules, one at a time

Features are added progressively as **modules** with a short code (ARF, INV, CSH, MDM, BSU, …).
For every new module or change:

1. **Ask first.** Before building, ask the owner 2–4 focused questions (multiple choice with a
   recommended option) about the decisions that change the build. Don't build on guesses.
2. **Spec.** Create or update `docs/modules/<CODE>.md` from `docs/modules/_TEMPLATE.md`: decisions table,
   user stories, screens/flow, ServiceNow mapping, out of scope, open questions, change log. Add the
   module to `docs/modules/README.md`. Cross-module decisions go to `docs/DECISIONS.md` (D1, D2, …).
3. **Build** in the prototype with schema + Build notes; regenerate `SERVICENOW_MAPPING.md`.
4. **Commit** with the module code as prefix (`BSU: …`), push to `main`, confirm the Pages deploy.
5. **Prompt the next step.** End by suggesting the next module or refinement and the questions it needs.

## Change requests by build-note ID

Two independent toggles in the demo bar: **Show IDs** (on by default) draws a small purple ID tag on
every mapped element, for the owner's change requests; **ServiceNow notes** (off by default) is the
developer view, labelling each element with `[ID] <ServiceNow table/field/UI action/widget>` (body
classes `sn-notes` and `sn-dev`). Hover shows the note via `title` when either is on. The owner finds the element and writes `<ID> - <change>` (e.g.
`BSU-03 - add a closing balance field`, `INV.due_date - default to end of next month`). To act on one:

1. Look the ID up in `js/notes.js` (or `docs/BUILD_NOTES.md`). Field IDs are `<TABLE CODE>.<column>`
   from `js/schema.js`; element IDs are used as `sn("ID")` in `js/views/*` (grep for the ID).
2. Make the change in the prototype (schema for fields, the view for elements).
3. Every new outlined element gets a **new** registered ID: add it to `NOTES` / `UI_ACTIONS` /
   `RELATED` / `CALC_COLS` in `js/notes.js` and call `sn("ID")`. `sn()` warns in the console for
   unregistered IDs. IDs are stable: never renumber or reuse one; if an element is removed, leave a
   line in the module spec change log saying the ID was retired.
4. Record the request in the owning module spec's change log (quote the ID), regenerate
   `node tools/notes.mjs` and `node tools/mapping.mjs`, commit with the module code prefix, push.
5. If the request is ambiguous or changes a decision, ask before building.

"App 1" was an earlier Claude-hosted prototype with Claude-powered matching. It is frozen and will be
rebuilt later from this codebase. Do not add Claude/LLM calls here unless the owner asks.

## Personas (switch with the demo bar at the top)

| Persona | Role | UI | Does |
|---|---|---|---|
| Company project team | `x_ar.project_team` | **Portal only** (Service Portal / Employee Center look) | Submits the **AR form** (record producer), follows **My requests**, replies on the ticket page |
| Accounts receivable team | `x_ar.ar_team` | **Workspace only** (configurable workspace look) | Works AR request **cases**, creates and issues invoices, uploads bank statements (**BSU**), matches deposits to invoices **manually**, maintains customers, contracts and bank accounts |

Core flow: project team submits AR form → `x_ar_request` case (New) in the workspace → AR assigns,
may *Request info* (portal reply returns it to In progress) or *Reject* → *Create invoice* (draft) →
*Issue invoice* → request becomes Invoiced and the requester sees the invoice number. Each morning AR
uploads yesterday's CSV statement per bank account (**BSU**) → deposits saved to the **Bank statements**
table with a Deposit ID → AR matches deposits to issued invoices **manually** on the Cash application page.
**There is no auto-matching anywhere (D5); don't add it.** The app is the **system of record** for
invoices. Automation after AR form submission is still to be defined by the owner.

## Domain model (all custom tables, see `js/schema.js`)

customer → contracts → AR requests → invoices ← allocations ← deposits (Bank statements) ← BSU uploads ← bank accounts

**Money received is only ever a BSU deposit (D7).** There is no payments table or "payment received"
concept: deposits come from BSU uploads, live in `x_ar_bank_statement` (code key `deposits`,
`S.deposits`, `TABLES.deposits`) and are matched to invoices on the Cash application page. Say
"BSU deposit" in the UI and docs, never "payment".

- **`js/schema.js` is the single source** for tables, columns, types, choices, roles and the record
  producer. Forms, list columns, Build notes and `SERVICENOW_MAPPING.md` all read it.
  After changing it run `node tools/mapping.mjs` to regenerate the mapping doc.
- Invoice `state`: draft / issued / cancelled. Payment status (Unpaid / Part paid / Paid / Overdue) is
  calculated from accepted allocations. Only **issued** invoices can receive payments.
- AR request `state`: new / in_progress / awaiting_info / invoiced / rejected. `activity` holds journal
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
                        cancelInvoice, portalComment, saveRecord, validate, numbering, journal
js/ledger.js            ledger reads: invoiceUse (applied/reserved), rollup, lookups
js/matching.js          manual allocation (act: manual/remove), allocationPlan, finder ranking (signals)
js/bsu.js               BSU: parse bank CSV by template, Deposit IDs, saveUpload, sample CSV per bank
js/io.js                CSV parser, matches CSV export
js/sample-data.js       users, customers, contracts, invoices, AR requests, payments (dates shift to today)
js/views/app.js         render(): demo bar + active persona; toast; setStatus
js/views/workspace.js   workspace shell, landing page, list pages (LISTS), record pages (LAYOUT, UI actions, activity)
js/views/portal.js      portal home, AR form, confirmation, My requests, ticket page
js/views/cash.js        cash application page (manual matching of deposits)
js/views/bsu.js         BSU page: statement-day checklist, upload + preview, recent uploads
js/views/finder.js      invoice finder (ranked candidates + allocation preview)
js/views/common.js      sn() build-note attribute, fieldHtml (forms from schema), chips, related lists, icons
tools/mapping.mjs       generates SERVICENOW_MAPPING.md from the schema
js/notes.js             build-note ID registry (table codes, element notes, UI actions, related lists)
tools/notes.mjs         generates docs/BUILD_NOTES.md (every ID and what it maps to)
docs/modules/           one spec per module (see "How we work"); docs/DECISIONS.md cross-module decisions
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
- Styling uses the tokens in `css/styles.css`; every colour must work in light and dark. Layout must
  work at 400px wide with no horizontal page scroll.
- Sample data is fictional (Singapore, SGD). Keep it fictional.

## Checking changes

Serve with `python3 -m http.server` (modules don't load from `file://`). Click through: portal AR form
submit → workspace new request → assign → create invoice → issue → portal shows invoice; BSU upload
(sample file and a real CSV file, wrong-bank error); cash application Find invoice → Apply, Remove match;
ID tags visible and unclipped; 400px wide in dark mode.
No console errors.

## Deploy

Push to `main`. Pages source must stay "GitHub Actions".
