# ENH-10: Enhancement set 18 Nov (AM) — customer, contract and invoice workspace

Issue: [#10](https://github.com/veranzy/ServiceNowARdemo/issues/10) · raised 2026-11-17 · module **CCI** (workspace:
customers, contracts, invoices) · triaged 2026-11-18 under `docs/ENHANCEMENT_SOP.md`.

**Lock:** CCI is Open. No portal form is touched.

| Item | Client wording | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|
| E10.1 | Customer > Add Billing Contact tab: need Requestor/Dept + customer contact name, email details. One customer can have multiple billing contacts | CCI · `RL-CUS-BCT`, `BCT.*` | Open | D11 (a contact per department) | Add **Requestor** (the project-team user who gave the contact) to billing contacts; the tab shows Requestor, Department, Contact name, Email. Several contacts per customer already allowed. | Several contacts per customer **and department**, or still one default per department (D11)? Label *Requestor*? | Needs owner |
| E10.2 | Customer Document tab: attachments also have Requestor/Dept | CCI · `RL-CUS-DOC`, `DOC.*` | Open | — | Add **Requestor** to customer documents (Department exists); show both in the tab. | Same label as E10.1? | Needs owner |
| E10.3 | Contracts Tab: copy in same table as the external contact tab in the list | CCI · `RL-CUS-CON` | Open | — | Unclear. | What should the customer's Contracts tab look like: the same columns as the Billing contacts tab, or the same as the *Contracts* list page? | Needs owner |
| E10.4 | Contracts View: move AR Requests tab to the front → Invoice → Billing Schedule → Billing → GIRO history | CCI · contract record tabs | Open | — | Tab order: AR requests, Invoices, Billing schedules, Billing lines, GIRO history (then Record history). | — | Ready |
| E10.5 | Invoices tab: invoices tagged to the contract | CCI · `RL-CON-INV` | — | — | Already: the tab lists the contract's invoices (1st invoice and schedule invoices). | — | Already done (to confirm) |
| E10.6 | GIRO History: add/remove AR9 cases | CCI / AR-ix · `RL-CON-GIRO` | — | — | Already: lists the contract's AR-ix Add and Remove cases. | — | Already done (to confirm) |
| E10.7 | Billing Lines: user will copy from AR1 case and used in subsequent invoices | CCI · `RL-CON-LINE` | Open | D31 (AR copies by hand); CCI decision 8 | A **New** billing line on the contract (AR copies from the AR-i case); later invoices use the contract's billing lines. | Are contract billing lines a new contract-level table (AR's copy), or the AR-i lines themselves? Do schedule invoices take amount and description from them? | Needs owner |
| E10.8 | Billing schedule: copy from AR1, auto-generate based on contract start and end date; start from 2nd invoice; Invoices tab still shows all invoices; columns serial number, billing date, draft creation date, linked invoice case (if any), amount | CCI · `RL-CON-SCH`, `SCH.*` | Open | CCI decisions 8–9 | Contract's *Billing schedule* tab lists the **periods** (No., Billing date, Draft creation date, Linked invoice, Amount), generated from the contract start / end, 2nd period onwards. | Generate when the contract is saved, or with a button? One schedule per contract (CCI open question 16)? | Needs owner |
| E10.9 | Keep one set of contract billing person under details | CCI · `CON.bill_to_*` | — | D16 | Already one *Bill-to* section on Details. | Is there a duplicate you saw (e.g. billing contacts vs bill-to)? | Needs owner |
| E10.10 | Should be able to raise an invoice directly from the contract view (e.g. "New" button under invoice tab) | CCI · `RL-CON-INV` | Open | **CCI decision 13** (invoices system-made only), CCI decision 8, D2 | *New* on the contract's Invoices tab: a draft invoice prefilled with customer, contract, bill-to; AR sets description, amount, dates, approval date and issues it. | Reverse decision 13 for manual invoices from the contract? Line items on a manual invoice? | Needs owner |
| E10.11 | Invoices View: see all draft / approved invoices – see aging – click into invoice to see billing lines and PDF | CCI · `LST-INV`, invoice record | Open | — | Invoice list tabs *Drafts*, *Issued* (= approved?), an **Aging** column (Current, 1–30 …), invoice record gets a **Billing lines** tab; PDF = the *Invoice preview* tab (decision 13). | "Approved" = issued (approval date set)? Aging buckets as on the landing page? | Needs owner |

## Owner decisions needed

1. E10.10 conflicts with CCI decision 13 (no manual invoices): allow *New* invoice from the contract?
2. E10.7 / E10.8: contract-level billing lines and the schedule periods tab, and how the schedule is generated.
3. E10.1–E10.3: the *Requestor* field and the customer's Contracts tab.
4. E10.11: list tabs and aging.

## Log

| Date | Change |
|---|---|
| 2026-11-18 | Triaged: 11 items; 1 ready, 2 already done (to confirm), 8 need the owner (one conflicts with CCI decision 13). |
