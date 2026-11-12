# Receivables Desk — ServiceNow AR prototype

Live demo: https://veranzy.github.io/ServiceNowARdemo/

A clickable prototype for clarifying requirements for an accounts receivable app to be built on
ServiceNow (custom scoped app). It shows both experiences side by side:

- **Project team · Portal**: a catalogue of 16 AR forms (AR-i … AR-xvi). AR-i *New AR request*: search
  the customer (add it if AR doesn't have it), the contract (existing, new, or no contract required) with
  its bill-to person, billing lines (one-off, or recurring over a date range) and customer documents (only those AR doesn't hold yet). Follow
  requests under My requests.
- **AR team · Workspace**: work AR request cases, create and issue invoices, upload the daily bank
  statements (BSU), match deposits to invoices manually, and maintain customers, contracts and bank
  accounts.

Demo bar (pinned to the top of the page):
- **Show IDs** (off by default): a small purple ID tag on every element that maps to a ServiceNow build item. Hover
  a tag for its ServiceNow note. Use the ID in change requests: `<ID> - <change>`.

Turn it off for a clean client demo. You can also switch persona or reset the sample data there.

## Documents

- `SERVICENOW_MAPPING.md`: tables, fields, roles, record producer, workspace, UI actions, match rules
  and open questions. Generated from `js/schema.js` with `node tools/mapping.mjs`.
- `docs/BUILD_NOTES.md`: every ID tag and what it maps to. Request changes as `<ID> - <change>`;
  Alt/Option+click a tagged element to copy its ID.
- `docs/modules/`: one folder per module (AR-00, AR-i, AR-ix, CCI, BSU, UIX) with its spec, decisions,
  open questions and change log; the index there is the sign-off checklist. Cross-module decisions:
  `docs/DECISIONS.md`.
- `docs/GIT_WORKFLOW.md`: how we use git (commit codes, checks before push, sign-off tags).
- `CLAUDE.md`: project brief, how we add modules, code layout and conventions.
- `ROADMAP.md`: ideas and what has shipped.

## Run locally

`python3 -m http.server` in this folder, then open http://localhost:8000 (ES modules don't load from a
`file://` URL).

Before pushing: `node tools/check.mjs` (syntax, build-note IDs, generated docs, module folders, links).

## Deploy

Every push to `main` deploys to GitHub Pages (Settings → Pages → Source: GitHub Actions) and runs the
**Check** workflow.

## Notes

- The site is public to anyone with the link. Use only sample or anonymised data.
- Everything runs in the browser and nothing is saved; reloading resets the demo.
