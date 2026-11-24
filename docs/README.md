# Start here: reading the Receivables Desk repo

A clickable prototype and requirements pack for a **ServiceNow accounts receivable app** (custom scoped app,
App Engine). The prototype is a static site: **live demo** <https://veranzy.github.io/ServiceNowARdemo/>.
Sample data is fictional (Singapore, SGD).

**Reader agents:** read anything, change nothing. To ask for a change, raise a GitHub issue; how is in
[`AGENT_GUIDE.md`](AGENT_GUIDE.md).

## Where the truth lives

| Question | Look in | Notes |
|---|---|---|
| What does module X do, field by field? | [`modules/<CODE>/README.md`](modules/README.md) | One folder per module: spec, `DECISIONS.md`, `OPEN_QUESTIONS.md`, `CHANGELOG.md`. |
| Which modules exist, their sign-off status and **locks**? | [`modules/README.md`](modules/README.md) | The *Lock* column: a locked part is not changed without the owner unlocking it. |
| Decisions across modules (D1, D2, …) | [`DECISIONS.md`](DECISIONS.md) | Module decisions are in each module folder. |
| Exact field names, labels, choices, mandatory rules | [`../js/schema.js`](../js/schema.js), readable in [`../SERVICENOW_MAPPING.md`](../SERVICENOW_MAPPING.md) | **Single source** for fields. The mapping doc is generated from it. |
| What a build-note ID (`PT-33`, `REQ.giro_type`) maps to | [`BUILD_NOTES.md`](BUILD_NOTES.md) (generated from [`../js/notes.js`](../js/notes.js)) | Turn on **Show IDs** in the demo bar to see the IDs on screen. |
| Tables, money rules, code layout | [`ARCHITECTURE.md`](ARCHITECTURE.md) | |
| How a client ticket becomes a change | [`ENHANCEMENT_SOP.md`](ENHANCEMENT_SOP.md), triage files in [`enhancements/`](enhancements/) | |
| The mock company (for sanitising real requirements) | [`MOCK_COMPANY.md`](MOCK_COMPANY.md) | Read before writing any example or ticket. |
| Rules for the builder (labels and logic, locks, git) | [`../CLAUDE.md`](../CLAUDE.md), [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | |
| What's next | [`../ROADMAP.md`](../ROADMAP.md), open [GitHub issues](https://github.com/veranzy/ServiceNowARdemo/issues) | |

If two of these disagree, the code (`js/schema.js`, `js/notes.js`) is what the demo shows; raise a
*Doc inconsistency* issue.

## Modules and demo links

| Module | What | Demo |
|---|---|---|
| [AR-00](modules/AR-00/README.md) | Shared parts of every AR form: catalogue, General information, My requests, ticket page, case states | [AR forms](https://veranzy.github.io/ServiceNowARdemo/#/portal/forms) |
| [AR-i](modules/AR-i/README.md) | AR-i New AR request (billing with invoices) | [form](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-i) · [cases](https://veranzy.github.io/ServiceNowARdemo/#/ws/list/requests/all_ari) |
| [AR-ii](modules/AR-ii/README.md) | **Refund request**: refund reasons (1 to 5 rows) and the AR2 Excel; each Excel row becomes an AR2 task. | [form](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-ii) |
| [AR-iii](modules/AR-iii/README.md) | **Collections** form: one form for AR-iii, AR-iv, AR-v (money collected without an invoice). Shell, fields to be defined | [form](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-iii) · [cases](https://veranzy.github.io/ServiceNowARdemo/#/ws/list/requests/all_col) |
| [AR-x](modules/AR-x/README.md) | **AR10 Refund (payment / journal)**: payee rows, Expedited, the AR10 Excel; each Excel row becomes an AR10 task checked against the payee rows. | [form](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-x) |
| [AR-ix](modules/AR-ix/README.md) | AR-ix GIRO authorisation | [form](https://veranzy.github.io/ServiceNowARdemo/#/portal/form/AR-ix) · [cases](https://veranzy.github.io/ServiceNowARdemo/#/ws/list/requests/all_arix) |
| [CCI](modules/CCI/README.md) | Customers, contracts, invoices, billing schedules | [contracts](https://veranzy.github.io/ServiceNowARdemo/#/ws/list/contracts/all) · [invoices](https://veranzy.github.io/ServiceNowARdemo/#/ws/list/invoices/all) |
| [BSU](modules/BSU/README.md) | Bank statement upload and cash application (manual matching) | [upload](https://veranzy.github.io/ServiceNowARdemo/#/ws/bsu) · [cash application](https://veranzy.github.io/ServiceNowARdemo/#/ws/cash) |
| [UIX](modules/UIX/README.md) | Workspace look and layout (Horizon) | [workspace](https://veranzy.github.io/ServiceNowARdemo/#/ws) |

Personas: switch between **Project team · Portal** and **AR team · Workspace** with the demo bar at the top.

## Words used here

- **AR form**: a portal record producer (AR-i … AR-xvi) that creates an **AR request case** (`x_ar_request`).
- **BSU deposit**: money received, loaded from a bank statement upload. Never say "payment".
- **Collections**: AR forms for money collected without an invoice (AR-iii, AR-iv, AR-v; D28).
- **No contract**: a contract record of category No contract (formerly "shell") for billing without a contract.
- **Locked**: a module part that may not change until the owner unlocks it.
