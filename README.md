# Receivables Desk — ServiceNow AR prototype

Live demo: https://veranzy.github.io/ServiceNowARdemo/

A clickable prototype for clarifying requirements for an accounts receivable app to be built on
ServiceNow (custom scoped app). It shows both experiences side by side:

- **Project team · Portal**: submit the AR form (record producer) to ask Accounts Receivable for an
  invoice, follow it under My requests, and reply when AR asks for more information.
- **AR team · Workspace**: work AR request cases, create and issue invoices, upload the daily bank
  statements (BSU), match deposits to invoices manually, and maintain customers, contracts and bank
  accounts.

Demo bar toggles:
- **Show IDs** (on): a small purple ID tag on every element that maps to a ServiceNow build item. Use the
  ID in change requests: `<ID> - <change>`.
- **ServiceNow notes** (off): developer view; every element labelled with its ServiceNow table, field,
  UI action or widget.

Turn both off for a clean client demo. You can also switch persona or reset the sample data there.

## Documents

- `SERVICENOW_MAPPING.md`: tables, fields, roles, record producer, workspace, UI actions, match rules
  and open questions. Generated from `js/schema.js` with `node tools/mapping.mjs`.
- `docs/BUILD_NOTES.md`: every ID tag and what it maps to. Request changes as `<ID> - <change>`;
  Alt/Option+click a tagged element to copy its ID.
- `docs/modules/`: one requirement spec per module (e.g. `BSU.md`), plus `docs/DECISIONS.md`.
- `CLAUDE.md`: project brief, how we add modules, code layout and conventions.
- `ROADMAP.md`: ideas and what has shipped.

## Run locally

`python3 -m http.server` in this folder, then open http://localhost:8000 (ES modules don't load from a
`file://` URL).

## Deploy

Every push to `main` deploys to GitHub Pages (Settings → Pages → Source: GitHub Actions).

## Notes

- The site is public to anyone with the link. Use only sample or anonymised data.
- Everything runs in the browser and nothing is saved; reloading resets the demo.
