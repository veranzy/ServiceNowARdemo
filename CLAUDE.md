# Receivables Desk (App 2) — project brief

**Purpose:** a clickable prototype used to settle requirements for a **ServiceNow build** of an accounts
receivable app (custom scoped app on App Engine). Every screen should map to something the build team
can configure: tables and fields, record producer, portal widgets, workspace pages, UI actions, business
rules, flows. When adding a feature, add its ServiceNow equivalent too (schema + build notes + mapping doc).

Static site, no backend, no build step, no AI calls. Hosted on GitHub Pages:
https://veranzy.github.io/ServiceNowARdemo/ (deploys on every push to `main` via `.github/workflows/pages.yml`).

"App 1" was an earlier Claude-hosted prototype with Claude-powered matching. It is frozen and will be
rebuilt later from this codebase. Do not add Claude/LLM calls here unless the owner asks.

## Personas (switch with the demo bar at the top)

| Persona | Role | UI | Does |
|---|---|---|---|
| Company project team | `x_ar.project_team` | **Portal only** (Service Portal / Employee Center look) | Submits the **AR form** (record producer), follows **My requests**, replies on the ticket page |
| Accounts receivable team | `x_ar.ar_team` | **Workspace only** (configurable workspace look) | Works AR request **cases**, creates and issues invoices, applies payments, maintains customers and contracts |

Core flow: project team submits AR form → `x_ar_request` case (New) in the workspace → AR assigns,
may *Request info* (portal reply returns it to In progress) or *Reject* → *Create invoice* (draft) →
*Issue invoice* → request becomes Invoiced and the requester sees the invoice number → payment arrives →
cash application allocates it. The app is the **system of record** for invoices. Automation after
submission is still to be defined by the owner (placeholders in UI and mapping doc). Bank statement
loading is a later requirement (payments CSV import stands in for it).

## Domain model (all custom tables, see `js/schema.js`)

customer → contracts → AR requests → invoices ← allocations ← payments

- **`js/schema.js` is the single source** for tables, columns, types, choices, roles and the record
  producer. Forms, list columns, Build notes and `SERVICENOW_MAPPING.md` all read it.
  After changing it run `node tools/mapping.mjs` to regenerate the mapping doc.
- Invoice `state`: draft / issued / cancelled. Payment status (Unpaid / Part paid / Paid / Overdue) is
  calculated from accepted allocations. Only **issued** invoices can receive payments.
- AR request `state`: new / in_progress / awaiting_info / invoiced / rejected. `activity` holds journal
  entries: `comment` (visible on portal), `work_note` (AR only), `system`.
- Matches (`S.matches[paymentId]`) represent allocation records: `proposed` reserves, `accepted` applies.

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
js/matching.js          auto-match rules, accept/reject/manual allocation, allocationPlan
js/io.js                payments CSV import, matches CSV export
js/sample-data.js       users, customers, contracts, invoices, AR requests, payments (dates shift to today)
js/views/app.js         render(): demo bar + active persona; toast; setStatus
js/views/workspace.js   workspace shell, landing page, list pages (LISTS), record pages (LAYOUT, UI actions, activity)
js/views/portal.js      portal home, AR form, confirmation, My requests, ticket page
js/views/cash.js        cash application page
js/views/finder.js      invoice finder (ranked candidates + allocation preview)
js/views/common.js      sn() build-note attribute, fieldHtml (forms from schema), chips, related lists, icons
tools/mapping.mjs       generates SERVICENOW_MAPPING.md from the schema
```

## Conventions

- **Money is integer cents.** Parse with `cents()`, display with `fmt()`.
- **State lives in `S`.** Mutate, then `render()`. `render()` redraws the whole app and restores focus by
  element id, so give inputs stable ids. For typing, update state without re-rendering (see the `input`
  handler); re-render on `change` only where dependent fields must refresh (selects).
- **Escape** every data value with `esc()` in templates.
- **Events are delegated** on `document` via `data-*` attributes (`data-open="table:id"`, `data-ui`,
  `data-list`, `data-rail`, `data-pnav`, `data-ticket`, …). Never attach listeners to rendered nodes.
- **Build notes:** add `sn("…")` to any new element that corresponds to a ServiceNow artefact (table,
  field, UI action, widget, business rule). Fields get notes automatically through `fieldHtml`.
- **Workspace vs portal:** AR features go in the workspace only; project-team features in the portal only.
- Styling uses the tokens in `css/styles.css`; every colour must work in light and dark. Layout must
  work at 400px wide with no horizontal page scroll.
- Sample data is fictional (Singapore, SGD). Keep it fictional.

## Checking changes

Serve with `python3 -m http.server` (modules don't load from `file://`). Click through: portal AR form
submit → workspace new request → assign → create invoice → issue → portal shows invoice; cash
application auto-match, accept, Find invoice → Apply; Build notes on; 400px wide in dark mode.
No console errors.

## Deploy

Push to `main`. Pages source must stay "GitHub Actions".
