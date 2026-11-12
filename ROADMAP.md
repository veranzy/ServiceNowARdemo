# Roadmap

Ideas for App 2 (Receivables Desk prototype for the ServiceNow build). Add new ideas under **Inbox**;
move them to **Next** once agreed, and to **Done** with the date when shipped. Requirement questions
still open for the client live in `SERVICENOW_MAPPING.md` → Open questions.

## Inbox

<!-- Add ideas here, one line each. Detail can follow as indented notes. -->
- Automation after AR form submission (owner to describe).
- AR-ii … AR-xvi: names and content (owner to describe, one at a time).
- AR request → invoice field mapping (incl. finance coding: cost center, account code, billing type) (owner, later).

## Next

## Done

- 2026-11-12 **ARF**: AR-i change request: GIRO section (read-only from AR-ix), department Sub-BU, finance coding logic
  (Type of billing for all, V@G for SB / PV, free-text Sub-BU, agent name, GA tooltip), bulk upload for C/D/E, recurring
  remarks and prorating, invoice breakdown (D22).
- 2026-11-11 **GIR**: GIRO table removed; contract › AR-ix design with GIRO status + active case, one active GIRO per
  contract (D21); GIRO history tab on the contract; demo contract TR-TA-2025-14.
- 2026-11-10 **GIR / AR-ix**: GIRO authorisation form (contract first, applicant prefilled from the bill-to, rental /
  carpark / others, add or remove); workspace Link contract, Activate GIRO, Remove GIRO; GIRO authorisation table
  per contract. **ARF**: General information section (requester, SSO email, department, CC list) on every AR form (D19, D20).
- 2026-11-03 **UIX**: workspace aligned to the Horizon Design System: list page template (list menu + list), Record
  page template (action bar with overflow, ribbon, record tabs, contextual side bar with Customer setup / Activity /
  Attachments), Cabin + Lato, Horizon radius and spacing (D17).
- 2026-11-02 **ARF / PT-05 contract level**: contract chosen before billing lines (existing / new / no contract
  required); no-contract shell per customer + department; bill-to held on the contract; billing lines carry the
  contract; customer billing hierarchy and contract related lists (D15, D16).
- 2026-11-02 **ARF / PT-05**: AR-i reworked: no request type; customer search with *Add as new customer*;
  billing lines (one-off, or recurring over a from–to date range, Monthly default), mixed in one request.
  Workspace bills per line; request becomes *Billed* when every line is invoiced or scheduled.
- 2026-11-02 **ARF / AR-i**: portal catalogue of 16 AR forms (AR-ii … AR-xvi placeholders); AR-i New AR request
  (1st / ad-hoc / recurring, new or existing customer, department bill-to, contract location, documents on-file
  check). Workspace: customer setup checklist + *Link to customer*, billing contacts per department (11
  departments), customer documents, billing schedules with *Raise invoice*.
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
