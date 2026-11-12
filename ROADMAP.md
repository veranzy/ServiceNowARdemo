# Roadmap

Ideas for App 2 (Receivables Desk prototype for the ServiceNow build). Add new ideas under **Inbox**,
starting with the module code; move them to **Next** once agreed, and to **Done** with the date when
shipped. Requirement questions still open for the client live in each module's
`docs/modules/<CODE>/OPEN_QUESTIONS.md`.

## Inbox

<!-- Add ideas here, one line each. Detail can follow as indented notes. -->
- **AR-00** Automation after AR form submission (owner to describe).
- **AR-ii … AR-xvi**: names and content (owner to describe, one at a time; one module each).
- **AR-i / CCI** AR request → invoice field mapping (incl. finance coding: cost center, account code, billing type) (owner, later).

## Next

## Done

- 2026-11-12 **AR-ix**: GIRO details revamp: Type set by the contract (Remove only when GIRO is active; nothing more for Remove), new Add GIRO fields (Remarks, Tenancy agreement, Contract reference number, second Remarks, Form number) (decisions 14–15).
- 2026-11-12 **AR-ix**: form sections Select Customer / Select Contract (existing, new or no contract); Amount free text; AR-ix is a request: Complete replaces Activate / Remove GIRO and AR updates GIRO on the contract by hand (decisions 11–13, issue #4 for the next major release).
- 2026-11-12 **TOOLS**: ServiceNow notes developer view removed (Show IDs stays); demo bar pinned to the top.
- 2026-11-12 **DOCS / TOOLS**: module map D27 (AR-00, AR-i, AR-ix, CCI, BSU, UIX), one folder per module;
  git rules in `docs/GIT_WORKFLOW.md`; `tools/check.mjs` and the Check workflow; `.gitignore`.
- 2026-11-12 **ARF**: contract location removed everywhere (ARF 35); bulk upload hint removed; open questions 20–24
  answered (ARF 36; LPI parked as issue #3).
- 2026-11-12 **ARF**: AR-i Invoice details revamp: billing lines replaced by invoice description, attention to, amount per
  period, preferred invoice date and optional billing line items (GST 9% calculated, LPI %); recurring follows the
  contract type; Others section for finance coding (ARF 31–34, D13 amended, D25).
- 2026-11-12 **ARF**: AR-i contract details revamp: existing contract read-only; new contract fields (contract type first,
  billing cycle, payment terms, proration, type of billing); proration and type of billing moved to the contract;
  GIRO is a subsection of Contract (existing DDA, greyed for new / no contract) (ARF 27–30, D24).
- 2026-11-12 **ARF**: AR-i Customer section revamp (read-only customer details for a found customer, replicated to the
  customer master, D23); finance coding moved into Invoice details; Billing type renamed Agency type.
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
