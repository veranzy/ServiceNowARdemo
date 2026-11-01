# Receivables Desk (App 2) — project brief

Client-facing demo of an accounts receivable solution, styled loosely after ServiceNow-type
enterprise workflows. Static site, no backend, no build step, no AI calls. Hosted on GitHub Pages:
https://veranzy.github.io/ServiceNowARdemo/ (deploys on every push to `main` via
`.github/workflows/pages.yml`).

"App 1" was an earlier Claude-hosted prototype with Claude-powered payment matching. It is frozen;
it will be rebuilt later from this codebase once the features here are settled. Do not add
Claude/LLM calls to this app unless the owner asks.

## Domain model

customer → contracts → invoices ← payment allocations ← payments

- **Customer**: name, parent group, aliases (names seen on bank statements), payment terms (days),
  credit limit, notes.
- **Contract**: belongs to a customer; number, title, billing type (Monthly, Milestone, Annual,
  Time & materials, Per PO), value, start/end, terms, early-settlement discount % and days, notes.
- **Invoice**: belongs to a customer and optionally a contract; number, description, date, due,
  amount. `invoice.customer` duplicates the customer name for display and must be kept in sync.
- **Payment**: payer text, date, amount, reference (bank memo / remittance text).
- **Match** (`S.matches[paymentId]`): `status` is `proposed` (reserves amounts), `accepted`
  (applies amounts), `rejected` or `unmatched`; `method` is `rule` (shown as "Auto") or `manual`;
  `allocations: [{invoiceId, amount}]`, `exception`, `reason`, `rejectedInvoices`.
  Invoice open balance = amount − accepted allocations; proposals only reserve.

## Code layout

```
index.html            markup only (tabs, panels, containers)
css/styles.css        all styles; colour tokens on :root with dark-mode overrides
js/main.js            entry point: event wiring and boot (loads sample data)
js/state.js           S — the single in-memory state object — and $() DOM helper
js/util.js            money/format/escape/name-matching/date helpers (pure)
js/ledger.js          ledger reads: invoiceUse, rollup, customer/contract lookups, invoiceState
js/matching.js        rule-based auto-match, accept/reject/manual actions, allocationPlan
js/io.js              CSV import (invoices or payments) and CSV export
js/sample-data.js     demo dataset; dates shift relative to today (SAMPLE_AS_OF)
js/views/cash.js      render() — redraws summary, payments, ledger, and the active tab
js/views/customers.js Customers & contracts tab: list, detail, contract cards, forms
js/views/finder.js    invoice finder: ranked candidates + allocation preview
js/views/shell.js     status banner, tab switching
```

Native ES modules loaded with `<script type="module" src="js/main.js">`. Circular imports exist
(views ↔ render); they are safe because no module uses an import at top level except main.js.

## Conventions

- **Money is integer cents everywhere.** Parse with `cents()`, display with `fmt()`. Never store
  floats.
- **State lives in `S` and nowhere else.** Mutate `S`, then call `render()` (or a narrower refresh
  like `renderCustomers()` / `refreshPicker()` for inputs that must keep focus).
- **Rendering is template strings.** Escape every user- or data-derived value with `esc()`.
- **Events are delegated** from stable containers (`#payList`, `#custDetail`, `#custRows`) using
  `data-*` attributes; don't attach listeners to re-rendered nodes.
- **Styling**: use the CSS tokens (`--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--ok`,
  `--warn`, `--bad` and `-soft` variants). Every colour must work in light and dark. Status is
  shown with `.chip` + `c-ok|c-warn|c-bad|c-accent|c-neutral`.
- **Layout must work at 400px wide** with no horizontal page scroll.
- Nothing persists: reload resets to sample data. Keep it that way unless persistence is asked for.
- Sample data uses a fictional Singapore client base in SGD. Keep it fictional.

## Checking changes

Serve locally with `python3 -m http.server` (modules don't load from `file://`) and click through
both tabs. Before pushing: no console errors, run auto-match, accept, use Find invoice → Apply,
add a contract and invoice, and check a 400px-wide viewport.

## Deploy

Push to `main`. The Pages workflow publishes the repo root. Pages source must stay set to
"GitHub Actions".
