# Roadmap

Ideas for App 2 (Receivables Desk prototype for the ServiceNow build). Add new ideas under **Inbox**;
move them to **Next** once agreed, and to **Done** with the date when shipped. Requirement questions
still open for the client live in `SERVICENOW_MAPPING.md` → Open questions.

## Inbox

<!-- Add ideas here, one line each. Detail can follow as indented notes. -->
- Automation after AR form submission (owner to describe).

## Next

## Done

- 2026-11-01 **BSU** bank statement upload: bank account master (department, account type), daily CSV
  upload per account with preview, Deposit IDs, Bank statements table, three mock bank layouts.
  **Auto-matching removed** app-wide (D5): deposits are matched manually. Module specs in `docs/modules/`.
- 2026-11-01 Rebuilt around two personas: **Project team portal** (AR form record producer, My requests,
  ticket conversation) and **AR team workspace** (landing page, list menu, tabbed record pages with UI
  actions and activity stream, cash application). AR requests are cases; invoices have draft/issued/
  cancelled states and are created from requests. Schema-driven forms, **Build notes** overlay and
  generated `SERVICENOW_MAPPING.md`.
- 2026-11-01 Split into modules, project brief in `CLAUDE.md`, sample dates move with today's date.
- 2026-11-01 Published on GitHub Pages; Claude matching removed.
- 2026-10-24 Customers → contracts → invoices module; invoice finder with allocation preview.
