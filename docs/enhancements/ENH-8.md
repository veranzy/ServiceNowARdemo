# ENH-8: Enhancement set 17 Nov (AM)

Issue: [#8](https://github.com/veranzy/ServiceNowARdemo/issues/8) · raised 2026-11-17 · module **AR-ix**
(one item also needs **CCI**) · triaged 2026-11-17 under `docs/ENHANCEMENT_SOP.md`.

**Lock:** the AR-ix portal form was unlocked by the owner on 2026-11-17 for this ticket (locked since 2026-11-12) and locked again the same day after the build.

| Item | Client wording | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|
| E8.1 | Customer – only can find existing customers cannot add new | AR-ix · `PT-44`, `REQ.new_customer`, `REQ.new_customer_name` | Open | AR-ix decision 12 (new customer allowed) | Remove *add as new customer*; search existing customers only. | What does a requester do if the customer is missing: raise an AR-i first? | Built (AR-ix 17) |
| E8.2 | Add only new or no-existing giro | AR-ix · `REQ.giro_type` | Open | — | None: decision 14 already offers only Add GIRO on a new contract, no contract, or a contract without active GIRO. | — | Already done (to confirm) |
| E8.3 | Remove only for existing giro | AR-ix · `REQ.giro_type` | Open | — | None: decision 14 already offers only Remove GIRO when the contract has active GIRO. | — | Already done (to confirm) |
| E8.4 | Context: GIRO removed for end of contract, change of bank account details; project teams need to AR9-remove, then AR9-add | AR-ix · spec | Open | — | Add as context in the AR-ix spec (bank change = Remove case, then Add case). Docs of a locked part count as touched. | — | Built (spec Context) |
| E8.5 | AR9 is open to all: show only contracts tagged to the same requesting department as the requester; contracts get a **contract owner** field with multiple owners; owners can view even if not the same department | AR-ix `PT-32`, `REQ.contract` · CCI new field `CON.contract_owners` | Open | New CCI field; AR-i not mentioned | Contract reference qualifier on AR-ix: contract department = requesting department, OR requester is a contract owner. New contract field *Contract owner* (List → `sys_user`, multiple). | Which department: the form's *Department* (General information) or the requester's own? Same rule on AR-i (locked)? Label exactly "Contract owner"? Does it also limit No contract records? | Built (AR-ix 22, CCI 10) |
| E8.6 | "applicant" change to "customer" name | AR-ix · `REQ.giro_applicant_name`, `_email`, `_mobile` | Open | — | Relabel the applicant fields. | Exact labels: "Customer name" / "Customer email" / "Customer mobile"? Section heading *Applicant* becomes *Customer*? | Built (AR-ix 20) |
| E8.7 | If add giro – only have effective start date | AR-ix · `REQ.giro_start_date`, `REQ.giro_end_date`, `REQ.giro_parking_start`, `REQ.giro_parking_end` | Open | AR-ix decision 15 | Add GIRO: one *Effective start date* for every purpose; no end date; carpark parking dates replaced. | Mandatory? Carpark uses the same *Effective start date*? | Built (AR-ix 18) |
| E8.8 | If remove giro – only have effective end date | AR-ix · `REQ.giro_end_date` | Open | AR-ix decision 14 (Remove asks nothing more) | Remove GIRO: one *Effective end date*. | Mandatory? Still no purpose / other fields on Remove? | Built (AR-ix 18) |
| E8.9 | Tenancy agreement for rental | AR-ix · `REQ.giro_tenancy_agreement` | Open | — | Keep for Rental only (already so). | Make it mandatory? Is it the same as the generic field in E8.11 / E8.12? | Built (AR-ix 19) |
| E8.10 | Carpark: no contract, no tenancy agreement | AR-ix · `PT-32`, `REQ.contract_option` | Open | AR-ix decision 12 | Carpark has no contract / tenancy reference. | Does carpark skip *Select Contract* (always No contract)? Purpose is chosen after the contract today, so the order would change. | Built (AR-ix 19) |
| E8.11 | If others – show a generic field contract / tenancy agreement / reference | AR-ix · new field | Open | AR-ix decision 15 | New generic field for Others. | Exact label? Is this the same field as E8.12? | Built (AR-ix 19) |
| E8.12 | Move field – contract / tenancy agreement / reference types for all scenarios after "type of request" | AR-ix · `REQ.new_contract_ref`, `PT-32`, `PT-33` | Open | AR-ix decision 12 (Select Contract section) | Put the contract / tenancy / reference field right after *Type of request*. | Does it replace the *New contract* reference in Select Contract, or the whole Select Contract section? How does it fit with E8.5 (pick a contract) and E8.10 (carpark none)? | Built (AR-ix 19) |
| E8.13 | Under others remove contract reference, invoice reference, amount, remarks | AR-ix · `REQ.giro_contract_ref`, `REQ.giro_invoice_ref`, `REQ.giro_others_remarks`, `REQ.giro_amount` (Others) | Open | AR-ix decisions 13, 15 | Remove these from the Others block (retire `REQ.giro_contract_ref`, `REQ.giro_invoice_ref`, `REQ.giro_others_remarks`). | Amount: removed for Others only (kept for Rental and Carpark, E8.15)? The general *Remarks* after the applicant stays? | Built (AR-ix 21) |
| E8.14 | 6. Others – remove Form number | AR-ix · `PT-47`, `REQ.giro_form_number` | Open | AR-ix decision 16 | Remove section 6 and the field (retire `PT-47`, `REQ.giro_form_number`); close open question 8. | — | Built (AR-ix 23) |
| E8.15 | Both rental and carpark have amount and location | AR-ix · `REQ.giro_location`, `REQ.giro_amount` | Open | AR-ix decision 15 | Carpark gains *Location*; Amount stays on both. | Location mandatory for Carpark, as for Rental? | Built (AR-ix 21) |

## Owner decisions (answered 2026-11-17)

1. **Unlock** the AR-ix portal form for #8 (Lock column in `docs/modules/README.md`).
2. **E8.10–E8.12 together:** the client's new field order. Proposed reading, to confirm:
   *Type of request* → *Contract / tenancy agreement / reference* (one generic field, all purposes except
   Carpark) → *Purpose of GIRO/DDA request* → customer → purpose details. Does this replace the
   *Select Contract* section (existing / new / no contract), or sit beside it? How does E8.5 (pick a contract
   of my department) fit?
3. **E8.1:** what a requester does when the customer is not found.
4. **E8.5:** which department; whether AR-i gets the same rule; the contract owner field's label.
5. **E8.6–E8.9, E8.11, E8.15:** exact labels and mandatory rules.
6. **E8.2–E8.3:** confirm they are already met on the live demo (`#/portal/form/AR-ix`).

## Log

| Date | Change |
|---|---|
| 2026-11-17 | Triaged: 15 items; 2 already done (to confirm), 13 need the owner (AR-ix portal form locked; questions on 10 of them). |
| 2026-11-17 | Owner: AR-ix portal form **unlocked** for #8. E8.12: **retain the contract step** (Select Contract stays; the contract / tenancy / reference field sits beside it). |
| 2026-11-17 | Owner answers: E8.1 hint *Customer not found? Submit an AR-i to set up the customer first.*; E8.5 the form's Department, Contract owner (multiple users), AR-i unchanged; E8.9–E8.12 one field *Contract / tenancy agreement / reference* after Type of request, hidden for Carpark; labels and mandatory dates as proposed. |
| 2026-11-17 | E8.1, E8.4–E8.15 **Built** (AR-ix decisions 17–23, CCI decision 10). E8.2, E8.3 already done, to confirm on the demo. |
| 2026-11-17 | Owner: reference field moved after Purpose of GIRO/DDA request (AR-ix decision 24); built. |
| 2026-11-17 | Owner: remove `REQ.new_contract_ref` from AR-ix; purpose by contract (no contract → Carpark / Others; existing / new → Rental / Others). AR-ix decision 25; built. |
| 2026-11-17 | Owner: Purpose placeholder *-- Choose the purpose --*; built. |
| 2026-11-17 | Owner: AR-ix portal form **locked** again. Remaining: client verifies each item on the live demo; AR-ix open question 9 (reference mandatory for a new contract). |
