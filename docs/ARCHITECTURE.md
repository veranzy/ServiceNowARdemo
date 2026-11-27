# Architecture: domain model and code layout

Moved from `CLAUDE.md` on 2026-11-17 to keep the brief short. **Builder** reference: read it before changing
code. Rules (labels and logic, locks, git) stay in [`CLAUDE.md`](../CLAUDE.md). Readers start at
[`docs/README.md`](README.md).

## Domain model (all custom tables, see `js/schema.js`)

customer → contracts (system Contract ID; Contract category Contract or No contract, `contract_type = shell`, several per customer, D15) → billing lines → invoices ← allocations ← deposits (Bank statements) ← BSU uploads ← bank accounts
AR request → billing lines (`x_ar_request_line`, code key `lines`: the AR-i PT-43 rows, print-only, with `contract`; CCI decision 23) · AR request → invoices (*Generate invoice*, one draft per click) · contract → billing schedule (recurring, interim) → invoices (daily job). `x_ar_request_item` retired.
contract → GIRO status + active AR-ix case (`giro_status`, `giro_case`; max one active GIRO per contract, D21) · contract → bill-to person (D16) · customer → billing contacts (department default for prefill, D11) · customer documents (given once, D10) · contract → billing schedules → invoices (per period, drafts from the daily invoice check)

**Departments:** 11 operational departments in `DEPARTMENTS` (`js/schema.js`); bank accounts may also be Finance.

**Money received is only ever a BSU deposit (D7).** There is no payments table or "payment received"
concept: deposits come from BSU uploads, live in `x_ar_bank_statement` (code key `deposits`,
`S.deposits`, `TABLES.deposits`) and are matched to invoices or Collections cases (D29) on the deposit, invoice or case record (BSU decision 21). Say
"BSU deposit" in the UI and docs, never "payment".

- **`js/schema.js` is the single source** for tables, columns, types, choices, roles and the record
  producer. Forms, list columns, Build notes and `SERVICENOW_MAPPING.md` all read it.
  After changing it run `node tools/mapping.mjs` to regenerate the mapping doc.
- Invoice `state`: draft / issued / cancelled. Payment status (Unpaid / Part paid / Paid / Overdue) is
  calculated from accepted allocations. Only **issued** invoices can receive payments.
- AR request `state` (AR-00 decision 4): new / work_in_progress / awaiting_requestor_info / closed_complete /
  closed_incomplete / cancelled, set by AR with a dropdown; `substate` (awaiting_input / awaiting_comment) only for
  awaiting_requestor_info; `assignment_group` (Accounts Receivable). Case actions: Assign to me, Save. Link section on Details (D31): `linkCustomer` / `linkContract` set `customerId` / `contractId` on save. There is
  no request type field; `amount` is the calculated request value (sum of line values). `activity` holds journal
  entries: `comment` (visible on portal), `work_note` (AR only), `system`.
- Matches (`S.matches[<deposit id>]`) hold the deposit's allocations; `status: "accepted"` applies them. An allocation
  has `invoiceId` or, for a Collections case, `requestId` (`allocKey()` in `js/ledger.js`).
  Only manual matching creates them (*Match* on a Suggested tab, or *New* allocation; BSU decision 21); *Remove match* clears them.
- Bank accounts have bank (MB/OB/US mock aliases), department and account type. Each bank's CSV
  layout is in `BANKS` in `js/schema.js`.

## Code layout

```
index.html              just #app; everything renders from JS
css/styles.css          tokens (light/dark), workspace, portal, cash application, build-notes overlay
js/main.js              delegated event handling (click/change/input/submit) and boot
js/state.js             S: data tables + UI state (persona, workspace tabs, portal page, drafts)
js/schema.js            ServiceNow tables/fields/roles/record producer (no DOM)
js/records.js           lifecycle: createRequest, requestAction (assign), issueInvoice (needs approval date),
                        cancelInvoice, portalComment, saveRecord (state change; billing line GST / total),
                        validate, numbering, journal, assignContractIds;
                        AR-i: validateARi, docsOnFile, contactFor, setupStatus, caseRecurring, linesTotal, generateInvoice (CCI decision 23); retired firstInvoices, lineErrors, lineStatus, setupSchedule, lineInvoice;
                        lines: periodDates, lineValue, linesSummary, lineStatus (lineInvoice / setupSchedule retired);
                        schedules: schedulePeriods, periodsDue, nextBilling, cycleDay, nextCycleDate,
                        draftDate, runDailyInvoiceCheck (the daily job)
js/ledger.js            ledger reads: invoiceUse (applied/reserved), rollup, lookups
js/matching.js          manual matching (BSU decision 21): allocate, act (remove), candidateList / depositCandidates ranking (signals)
js/bsu.js               BSU: parse bank CSV by template, Deposit IDs, saveUpload, sample CSV per bank
js/io.js                CSV parser, matches CSV export
js/sample-data.js       users, customers, contracts, invoices, BSU data (dates shift to today); no AR requests
js/cases.js             loads AR request cases from data/AR_form.csv (UIX decision 13) + demo setup (ARQ0001009, schedule history, mock daily job) + demo Collections, AR-ii and AR-x cases
js/excel.js             AR-ii / AR-x Excel templates: read .xlsx (SheetJS in vendor/, loaded on first use), rows that become AR2 / AR10 tasks, sample rows, blank template download
data/AR_form.csv        demo AR-i / AR-ix cases, one row per case, headers = x_ar_request field names
js/views/app.js         render(): demo bar + active persona; toast; setStatus
js/router.js            page URLs (#/ws/…, #/portal/…): URL → screen on load and Back / Forward, screen → URL after render (UIX decision 14)
js/views/workspace.js   workspace shell, landing page, list pages (LISTS), record pages (LAYOUT, UI actions, activity)
js/views/portal.js      portal home, AR forms catalogue (AR-i … AR-xvi), AR-i form, confirmation, My requests, ticket page
js/views/bsu.js         BSU page: statement-day checklist, upload + preview, recent uploads
js/views/common.js      sn() build-note attribute, fieldHtml (forms from schema), chips, related lists, icons
tools/mapping.mjs       generates SERVICENOW_MAPPING.md from the schema
js/notes.js             build-note ID registry (table codes, element notes, UI actions, related lists)
tools/notes.mjs         generates docs/BUILD_NOTES.md (every ID and what it maps to)
tools/check.mjs         pre-push check (syntax, IDs, generated docs, module folders, links); CI runs it
docs/modules/<CODE>/    one folder per module (see "How we work"); docs/DECISIONS.md cross-module decisions
docs/GIT_WORKFLOW.md    git rules for every session
docs/ENHANCEMENT_SOP.md SOP for client enhancement tickets; docs/enhancements/ENH-<n>.md one triage file per ticket
```
