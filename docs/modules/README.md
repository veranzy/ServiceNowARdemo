# Modules

Each feature area of the AR app is a **module** with a short code. Every module has a spec in this
folder that records what was asked, what was decided, and how it maps to ServiceNow. The spec is
written *before* the build and updated when the build lands.

## How a module moves

1. **Ask** – Claude asks a few focused questions; answers are recorded under *Decisions*.
2. **Spec** – `docs/modules/<CODE>.md` is created from `_TEMPLATE.md` (status: *Specified*).
3. **Build** – prototype changes land in one or more commits prefixed `<CODE>:`; schema, Build notes and
   `SERVICENOW_MAPPING.md` are updated in the same commits (status: *In prototype*).
4. **Review** – the client walks through it on the live demo; changes are logged under *Change log*
   (status: *Agreed* once signed off).
5. **Hand-over** – the spec + mapping doc become the build requirement for the ServiceNow team
   (status: *Ready for build*).

Cross-module decisions go in [`../DECISIONS.md`](../DECISIONS.md).

## Index

| Code | Module | Persona | Status |
|---|---|---|---|
| [ARF](ARF.md) | AR forms catalogue (AR-i … AR-xvi) and AR-i New AR request; customer setup, documents, billing contacts, recurring schedules | Project team, AR team | In prototype |
| INV | Invoicing (draft → issued → cancelled) | AR team | In prototype |
| CSH | Cash application (manual matching of deposits to invoices) | AR team | In prototype |
| [MDM](MDM.md) | Master data: customers, contracts | AR team | In prototype |
| [BSU](BSU.md) | Bank statement upload | AR team | In prototype |
| [GIR](GIR.md) | AR-ix GIRO authorisation: add / remove GIRO on a contract; GIRO authorisation table | Project team, AR team | In prototype |
| [UIX](UIX.md) | Workspace look and layout aligned to the Horizon Design System (app shell, list page, record page) | AR team | In prototype |
