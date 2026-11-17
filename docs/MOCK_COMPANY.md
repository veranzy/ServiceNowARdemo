# Mock company background

**Why this file exists.** The repo and the live demo are **public**. Requirements often come from the real
client with real names, numbers and systems in them. Before anything goes into a GitHub issue, a spec or demo
data, **translate it into this mock company**. Reader agents ([`AGENT_GUIDE.md`](AGENT_GUIDE.md)) use this page to
sanitise; Claude in the repo uses it for sample data.

Everything here is **fictional**. Any resemblance to a real organisation is unintended.

## The company

| | |
|---|---|
| **Name** | **Corpex Group Pte Ltd** ("Corpex", "the Group"). Placeholder name; the owner may change it. |
| **Where** | Singapore head office; customers in Singapore and Malaysia. |
| **What it does** | Multi-disciplinary engineering, infrastructure and services group: projects, rentals (retail units, carparks), managed services and advisory. |
| **Currency and tax** | SGD; GST 9% (a system property in the app, D25). |
| **Email domain** | `@corp.example` for staff (e.g. `priya.nair@corp.example`). Customers use `@<customer>.example`. |
| **AR Team** | The **AR Team** (Accounts Receivable, in Finance) works every AR case. Always call it "AR Team"; don't use other names for it (e.g. FSSC). |
| **System** | A ServiceNow scoped app `x_ar` (this prototype): **portal** for project teams, **workspace** for the AR team. The app is the system of record for invoices (D2). Other systems are named generically: "the ERP", "the bank portal", "the document store". |

## Organisation

**11 operational departments**, each with three sub-BUs (from `js/schema.js`). Finance is a 12th unit that owns
bank accounts and the AR Team.

| Department | Sub-BUs |
|---|---|
| Engineering | Civil & Structural · M&E Services · Geotechnical |
| Marine | Port Works · Offshore · Dredging |
| Digital | Data & AI · Platforms · Cyber |
| Infrastructure | Roads · Water · Urban Systems |
| Energy | Power Grid · Solar · Gas |
| Facilities | Property Management · Carparks · Retail Leasing |
| Logistics | Warehousing · Cold Chain · Freight |
| Healthcare | Hospitals · Clinics · Med Tech |
| Environmental | Waste · Air & Noise · Ecology |
| Rail | Signalling · Rolling Stock · Track Works |
| Advisory | Strategy · Transactions · Risk |

## People (demo users)

| Name | Role | Team / department | Uses |
|---|---|---|---|
| Priya Nair | Project manager | Project team · Digital | Portal (the demo's portal user) |
| Marcus Wong | Project manager | Project team · Logistics | Portal |
| Daniel Lim | AR specialist | AR Team · Finance | Workspace (the demo's workspace user) |
| Siti Rahman | AR specialist | AR Team · Finance | Workspace |

Assignment group: **Accounts Receivable**. Use these four, or a role ("a project manager in Marine", "an AR
officer"), never a real person.

## Customers (sample master data)

Harbourline Logistics Pte Ltd · Meridian Foods Pte Ltd · Kestrel Engineering Sdn Bhd (Malaysia) · Tanjong Retail
Group · Orchid Clinics Pte Ltd · Novabay Software Pte Ltd · Brightwater Hotels (Sentosa) and (Orchard) Pte Ltd
(group: Brightwater Hospitality Holdings) · Lumen Print Studio (sole proprietorship) · Pacific Crest Marine Pte Ltd.

Contracts use numbers like `HL-2026-01`, `TR-TA-2025-14`; the app adds a Contract ID (`CTR0001001`). Prefer an
existing customer when you need an example; otherwise invent one in the same style (`<Name> Pte Ltd`,
`@<name>.example`).

## Banks

Three **mock** banks with their own CSV statement layouts (`BANKS` in `js/schema.js`): **Marina Bank** (MB),
**Orchard Bank** (OB), **Union Straits Bank** (US). Corpex's accounts: AR collections and Project deposits –
Engineering (Marina), Revenue SGD (Orchard), Retention and deposits – Marine and Operating (Union Straits).
Money received is only ever a **BSU deposit** from these statements (D7).

## AR forms (portal catalogue)

16 forms, AR-i … AR-xvi. Defined: **AR-i** New AR request (billing with invoices), **Collections** (one form for
AR-iii, AR-iv, AR-v: money collected without an invoice, D28, D30), **AR-ix** GIRO authorisation (direct debit,
also called DDA). The rest are *To be defined*.

## How to sanitise a requirement

Replace before you write anything into the repo or an issue:

| Real item | Write instead |
|---|---|
| The client's company or brand name | Corpex / Corpex Group |
| A real department, division or business unit | The closest mock department and sub-BU above |
| A real person's name, email or phone | A demo user above, or a role ("an AR officer") |
| A real customer, tenant or payer | A sample customer above, or a new fictional `<Name> Pte Ltd` |
| UEN, NRIC, company registration numbers | A made-up UEN in the same format (`201912345K`) clearly not real, or "the UEN" |
| Bank names, account numbers, CSV samples | Marina / Orchard / Union Straits Bank and their mock layouts; made-up account numbers |
| Real amounts from contracts or invoices | Round, plausible SGD amounts |
| Real addresses, unit numbers, car plates | Fictional Singapore-style ones (`#01-23, 3 Jurong Gateway Road`, `SNB 4821 K`) |
| Internal system names (ERP, DMS, bank portals) | "the ERP", "the document store", "the bank portal" |
| Internal team names for AR (e.g. FSSC) | AR Team |
| Internal form codes or form names | The AR form codes (AR-i … AR-xvi) and their names in the catalogue |
| Screenshots | Re-take them from the live demo, or describe them; never post real screens |

Keep the **business meaning**: who does what, the rules, the order of steps, the edge cases. Only the
identifying details change. If something can't be sanitised without losing its meaning, describe it in
general terms and add a *Question* for the owner instead of pasting it.
