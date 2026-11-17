# ENH-9: Requirement — consolidated AR3 / AR4 / AR5 web form

Issue: [#9](https://github.com/veranzy/ServiceNowARdemo/issues/9) · raised 2026-11-17 · label `requirement` · module
**AR-iii** (Collections form, D28, D30), touching **AR-00**, **BSU**, **CCI** and **UIX** · triaged 2026-11-17 under
`docs/ENHANCEMENT_SOP.md`.

**Lock:** AR-iii, AR-00, BSU, CCI, UIX are Open. AR-i and AR-ix portal forms are Locked; items that change shared
parts (General information, case states) would also change those forms and are marked **Locked (shared)**.

**Sanitising (owner to check first):** the issue is public. It names items that may identify the client
(*G56 receipt*, *IB Case Number / WEU Number*, *AR10*, the AR5 categories) and personal-data fields (NRIC, FIN,
passport, addresses). Per [`MOCK_COMPANY.md`](../MOCK_COMPANY.md), confirm these are generic or replace them in the
issue. Demo data for AR5 will be fictional and masked.

The requirement's sections are numbered **§1–§22** below.

## Items

| Item | Requirement (§) | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|
| E9.1 | One form, type chosen, conditional sections; sequence Requestor Details → Submission Type → Collection Details → Supporting Documents → Review and Submit (§1, §5) | AR-iii · `PT-49`, `PT-50`, `REQ.collection_type` | Open | D30 (built as General information + Collection type; one page) | Keep D30's one form. Rename the type field and add the conditional sections; add a **Review and Submit** step. | Labels: *Submission Type* replaces *Collection type*? One page with a review panel, or a step-by-step wizard? | Needs owner |
| E9.2 | Changing Submission Type warns and asks before clearing data (§5) | AR-iii | Open | — | Confirm dialog in the page (no browser alert), then clear the other type's fields. | Wording of the warning. | Needs owner |
| E9.3 | Requestor Details: Requesting Department, Department/Division (dependent), Requestor Name, Email, **CC Count + up to 10 CC email fields** (§6) | AR-00 · `PT-30`, `REQ.department`, `REQ.dept_sub_bu`, `REQ.cc_list` | **Locked (shared)** | D19, AR-00 decisions 1–2 (General information on every form: one *CC list* text field) | Map to General information (Department, Sub-BU = Department/Division). CC Count + fields is a change to every form. | Keep today's General information (CC list) for Collections, or change it for all forms (unlocks AR-i, AR-ix)? Label *Department/Division* vs *Sub-BU*? | Needs owner |
| E9.4 | Submission Origin: Manual / System-generated (§6, §12) | AR-iii · new field | Open | — | New read-only field on the case. | — | Ready after E9.1 |
| E9.5 | AR3: Collection Date*, collection table (Collection Type*, Number of Transactions*), 1–99 rows, total shown, duplicates rejected (§7) | AR-iii · new fields + new child table | Open | D29 (matching uses the case's Request value; AR3 has **no amount**) | Multi-row set like AR-i billing line items. | What amount does AR match a BSU deposit to for AR3 (no amount field)? Duplicate types allowed (§22)? Collection Type list: the examples given? | Needs owner |
| E9.6 | AR4: Collection Date, Reference Number, Requesting Department Cost Centre*, allocation table (Description*, Amount*, Cost Centre*, Account Code*), 1–10 rows, total shown, GST / recovery check, total must equal the collection total (§8) | AR-iii, **CCI** (new master data: cost centres, account codes) | Open | AR-i has free-text *Cost center* and *Account code* | New master-data tables *Cost centre* (by department) and *Account code* (active flag, GST treatment). Request value = allocation total. | Build the two master tables now (sample values) or keep free text in the prototype? What is "the collection total" the allocation must equal (§22)? | Needs owner |
| E9.7 | AR5: category first (Cash Bail / Seized Monies / Restitution), category fields, statuses, document guidance (§9.1–9.3) | AR-iii | Open | — | Category choice, then one block per category. Amount fields set the Request value. | Which fields are mandatory per category (§22)? Final status lists (§22)? *Invested* Yes/No only for Seized Monies? | Needs owner |
| E9.8 | AR5 normalisation: date pickers, currency inputs, controlled currency list, status dropdowns, Yes/No radios, identity numbers protected and masked (§9.4) | AR-iii | Open | — | Build as stated; mask identity numbers on screen (show last 4). | Currency list: SGD plus which? | Needs owner |
| E9.9 | Supporting documents: multiple files, name / size / uploader / time, remove before submit, server validation, type and 7 MB limit, preserve form on failure, record-level access (§10) | AR-iii · `PT-46`-style section | Open | — | Prototype: list with name, size, uploader, time, remove; size and type checks in the browser; server rules documented for the build. | 7 MB per file or per submission (§22)? Allowed formats (§22)? Document guidance text per type / category: exact wording. | Needs owner |
| E9.10 | Save and resume a draft (§11) | AR-00 (new for every form?) | Open | No drafts today | Collections only: *Save draft* keeps a Draft case visible in My requests. | Drafts on Collections only, or every form later? New state *Draft*? | Needs owner |
| E9.11 | On submit: validation, case number, Submission Type and Origin recorded, fields locked, state New, auto-assignment, notifications, audit (§11) | AR-iii, AR-00 | Open | "Automation after AR form submission is still to be defined by the owner" (CLAUDE.md) | Prototype shows the case, assignment and the notifications as journal entries. | See E9.13 (assignment). | Needs owner |
| E9.12 | **System-generated cases** from unreconciled bank-statement records with an identified owner: linked case, source fields read-only, Awaiting Requestor Information (§12, AC-05) | **BSU**, AR-iii | Open | D5 (no auto-matching): creating a case is not matching, but it is automatic; D29 | AR picks an unmatched BSU deposit and raises a Collections case for an identified requestor (manual trigger), or a scheduled job (mock, like the daily invoice check). | Manual action by AR, or a scheduled job? How is the owner (requestor) identified on a deposit? Granularity: per deposit, per department or per batch (§12, §22)? | Needs owner |
| E9.13 | Round-robin assignment by requesting-department grouping; New → Work in progress on assignment; reassignment with mandatory reason (§13) | AR-00 | **Locked (shared)** for the case-state part | AR-00 decision 4 (*Assign to me*; assignment group Accounts Receivable) | Assignment rule for Collections only (mock round-robin over the AR Team). | Collections only, or every form? Department groupings: which departments go together? | Needs owner |
| E9.14 | Clarification: two modes (comments only; comments + reopened fields), substates, KPI pause, reply returns to Work in progress (§14, AC-06) | AR-00 · state / substate | **Locked (shared)** | AR-00 decision 4 has the substates (*Awaiting input*, *Awaiting comment*) but no field reopening | Reuse the substates; add *fields to reopen* picker on the case for Collections. | Labels: *Awaiting Requestor Input* / *Awaiting Requestor Comment* vs today's *Awaiting input* / *Awaiting comment*? KPI: show a paused timer, or document only? | Needs owner |
| E9.15 | **AR Approver** role; route for approval; approve, return with internal work notes, reject with reason; segregation of duties (§4, §15, AC-08) | AR-00, ROLES | Open | D3 (two roles: project team, AR team) | New role `x_ar.ar_approver` (workspace); new persona or a switch in the demo bar. | Approval for Collections only? Is the approver a separate demo user (e.g. a third AR Team member)? | Needs owner |
| E9.16 | New state **Awaiting Internal Information** with substates *Pending Approval*, *Pending Cancellation* (§17) | AR-00 · `REQ.state`, `REQ.substate` | **Locked (shared)** | AR-00 decision 4 (six states; no Awaiting Internal Information; has *Closed incomplete*) | Add the state for every form, or only use it on Collections. | Add to the shared state list? Keep *Closed incomplete*? | Needs owner |
| E9.17 | Withdraw Request by the requestor before a cut-off, controlled reason, optional documents (§16) | AR-00 portal ticket page | Open | No withdrawal today | Portal ticket action *Withdraw Request* → *Pending Cancellation*. | Cut-off state (§22)? Reason list? | Needs owner |
| E9.18 | Rejection / cancellation with closure code, reason, confirmation, notification (§16) | AR-00 | **Locked (shared)** | AR-00 decision 4 (state dropdown; *Reject* retired) | Closure code + reason fields required when State = Cancelled. | Closure code list? | Needs owner |
| E9.19 | Bulk close eligible cases after approval and downstream action; per-case outcome (§16, AC-09) | UIX list action | Open | — | List action *Close selected* on All Collections. | What makes a case eligible (approved + deposit matched)? | Needs owner |
| E9.20 | Status model table (§17) | AR-00 | **Locked (shared)** | AR-00 decision 4 | See E9.16. | — | Needs owner |
| E9.21 | Audit history (§18) | AR-00 | — | — | Already: Record history tab and activity journal. Document attachments versions and source link. | — | Already done (partly) |
| E9.22 | Non-functional: WCAG 2.1 AA, responsive, performance, idempotent submit, server-side security, privacy, logging, retention (§19) | All · docs | — | — | Record as build requirements in the AR-iii spec; prototype keeps 400 px and keyboard use. | — | Ready (docs) |
| E9.23 | Acceptance criteria AC-01 … AC-10 (§20) | AR-iii spec | — | — | Copy into the spec as *when … then* tests. | — | Ready (docs) |
| E9.24 | Out of scope: customer and contract maintenance (§3) | AR-iii | — | AR-iii open question 2 (customer / contract on a collection?) | Collections have **no customer or contract**: answers open question 2. | Confirm: no customer or contract on Collections cases. | Needs owner |
| E9.25 | Out of scope: refunds through **AR10**, bank-statement ingestion, finance approval screens (§3) | — | — | — | Note in the spec. | — | Ready (docs) |

## Owner decisions needed (proposed order)

1. **Sanitising** the issue (see above).
2. **Scope and phasing.** Proposed: Phase 1 the portal form (E9.1–E9.10, E9.24); Phase 2 workspace processing
   (E9.11, E9.13–E9.20, approver role); Phase 3 system-generated cases and BSU link (E9.12).
3. **Shared parts** (General information, case states, assignment): change them for Collections only, or for every
   form (needs AR-i and AR-ix unlocked)?
4. **Matching (D29):** the amount AR matches deposits to, per type (AR3 has no amount).
5. Then the per-item questions above, a few at a time.

## Log

| Date | Change |
|---|---|
| 2026-11-17 | Triaged: 25 items. 3 ready (docs), 1 partly done, 21 need the owner; 6 touch shared, locked parts (General information, states, assignment). |
