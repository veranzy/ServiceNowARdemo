# ServiceNow build mapping

Generated from `js/schema.js` by `node tools/mapping.mjs`. Edit the schema, not this file's table sections.
Every screen element in the prototype carries the same references (turn on **Build notes** in the demo bar).

Scope: `x_ar` is a placeholder for the real application scope (for example `x_1234_ar`).
All tables are **custom tables in the scoped app**, except that each customer references the platform **`core_company`** table for its name (D26). No CSM or Contract Management tables are used.

## Personas and roles

| Persona | Role | Experience | Access |
|---|---|---|---|
| Accounts receivable team | `x_ar.ar_team` | Receivables Workspace (UI Builder, configurable workspace) | Read/write all AR tables; works AR request cases, issues invoices, uploads bank statements (BSU), matches BSU deposits to invoices. |
| Company project team | `x_ar.project_team` | Service Portal / Employee Center | Submit AR forms (record producers AR-i … AR-xvi) and read/comment on their own AR requests. Read customers, contracts, billing contacts and which customer documents are on file. No workspace access. |

## Tables

### Company — `core_company`

**Existing platform table, not created by the app** (D26). The app only references it: `x_ar_customer.company` points here and the customer name is dot-walked from `company.name`. The app does not create or edit companies (open question MDM-5).

| Column | Label | Type | Notes |
|---|---|---|---|
| `name` | Name | String | Mandatory |

### Customer — `x_ar_customer`

Custom customer master (not CSM customer_account). Each customer references one core_company record; the customer name is **dot-walked** from `company.name` and not stored on this table (D26). Make `company` the table's display field so references to a customer show the company name. UEN, address and the other details stay on this table. Documents and per-department billing contacts hang off the customer (D10, D11).

| Column | Label | Type | Notes |
|---|---|---|---|
| `company` | Company | Reference | → `core_company`. Mandatory. The core_company record for this customer. One customer per company. Display field of the table |
| `company.name` | Customer name | String | Read-only on form. Dot-walked from company.name (core_company); not a column on this table (D26) |
| `uen` | UEN (company registration no.) | String |  |
| `parent_group` | Parent group | String |  |
| `registered_address` | Registered address | String (1000) |  |
| `agency_type` | Agency type | Choice | Choices: M, SB, PV. Master data; AR copies it by hand from the AR-i that set the customer up (D23 as amended by D31) |
| `vag` | V@G | Choice | Choices: Yes (`yes`), No (`no`). Shown when Agency type is SB, PV (UI policy) |
| `vag_sub_bu` | V@G sub-BU | String | Shown when V@G = Yes (UI policy) |
| `poc_name` | POC name | String |  |
| `poc_email` | POC email | String |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `credit_limit` | Credit limit | Currency |  |
| `bank_names` | Names seen on bank statements | String (1000) | Comma-separated. Used to rank invoices in the invoice finder. |
| `notes` | Notes for AR | String (4000) |  |
| `active` | Active | True/False | Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields. Default: true |

### Contract — `x_ar_contract`

Custom contract table (not ast_contract). Every record has a system Contract ID (CTR…); Contract category Contract or No contract (D15 amended). GIRO is a contract status that AR updates manually from the AR-ix case (D21, AR-ix decision 11). Middle of the billing hierarchy customer › contract › billing lines › invoices (D15). Holds the bill-to person (D16) and billing terms. A no-contract shell (contract_type = shell, one per customer + department) holds billing that has no contract.

| Column | Label | Type | Notes |
|---|---|---|---|
| `contract_id` | Contract ID | String | Read-only on form. System contract ID, auto-numbered for every record, Contract or No contract (CCI, 2026-11-16) |
| `contract_type` | Contract category | Choice | Choices: Contract (`contract`), No contract (`shell`). Mandatory. Contract or No contract (D15 amended 2026-11-16: a customer can have several No contract records) |
| `number` | Contract number | String | The customer's contract number. Mandatory when Contract category = Contract |
| `contract_category` | Contract type | Choice | Choices: Recurring (`recurring`), Ad-hoc (`ad_hoc`). Recurring or Ad-hoc |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Owning department |
| `contract_owners` | Contract owner | List | → `sys_user` (users with x_ar.project_team). Project team users who can pick this contract on an AR-ix even when it belongs to another department (List of sys_user, several owners; CCI decision 10, E8.5) |
| `reference_number` | Contract reference number | String |  |
| `po_number` | Contract PO number | String |  |
| `short_description` | Title | String | Mandatory |
| `billing_type` | Billing | Choice | Choices: Monthly, Milestone, Annual, Time & materials, Per PO |
| `contract_value` | Contract value | Currency |  |
| `start_date` | Start | Date |  |
| `end_date` | End | Date |  |
| `payment_terms` | Payment terms (days) | Integer |  |
| `discount_percent` | Early-settlement discount % | Decimal |  |
| `discount_days` | Discount if paid within (days) | Integer |  |
| `lpi_applicable` | LPI applicable | True/False | Late payment interest is charged on overdue invoices under this contract |
| `lpi_min_rate` | Minimum LPI rate (%) | Decimal | Mandatory when LPI applicable. % per annum; must not exceed the LPI rate |
| `lpi_rate` | LPI rate (%) | Decimal | Mandatory when LPI applicable. % per annum |
| `billing_cycle` | Contract billing cycle | Choice | Choices: 1st of the month (`first`), 15th of the month (`fifteenth`), Others (`others`) |
| `billing_cycle_other` | Suggested billing cycle | String | Shown when Contract billing cycle = Others (UI policy) |
| `preferred_invoice_date` | Preferred invoice billing date | Date |  |
| `payment_terms_choice` | Payment terms | Choice | Choices: 30 days (`30`), Others (`others`). 30 days sets terms (days) = 30 |
| `payment_terms_other` | Other payment terms | String | Shown when Payment terms = Others (UI policy) |
| `proration` | Proration | Choice | Choices: Yes (`yes`), No (`no`). Yes: the first and last period of each recurring billing schedule use the proration amounts |
| `proration_first` | Proration for 1st month | Currency | Shown when Proration = Yes (UI policy) |
| `proration_last` | Proration for last month | Currency | Shown when Proration = Yes (UI policy) |
| `type_of_billing` | Type of billing | Choice | Choices: A, B, C, D, E |
| `bulk_supporting_docs` | Supporting documents (bulk upload) | Attachment | Shown when Type of billing is C, D, E (UI policy) |
| `giro_status` | GIRO status | Choice | Choices: Active (`active`), Not active (`none`). Updated by AR on the contract from the AR-ix case (manual, AR-ix decision 11). At most one active GIRO per contract (D21) |
| `giro_case` | Active GIRO case | Reference | → `x_ar_request`. AR links the AR-ix case whose GIRO is active (reference qualifier: ar_form = AR-ix, giro_type = Add GIRO and contract = this contract). Mandatory when GIRO status is Active; cleared when Not active |
| `bill_to_name` | Bill-to person | String |  |
| `bill_to_email` | Bill-to email | String |  |
| `bill_to_phone` | Bill-to phone | String |  |
| `bill_to_address` | Billing address | String (1000) |  |
| `notes` | Notes | String (4000) |  |

### Billing contact — `x_ar_billing_contact`

The department's usual bill-to person at a customer (D11): unique per customer + department. Used to prefill the bill-to on a new contract or shell; the bill-to used for invoicing is on the contract (D16).

| Column | Label | Type | Notes |
|---|---|---|---|
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory |
| `contact_name` | Bill-to person | String | Mandatory |
| `email` | Email | String | Mandatory |
| `phone` | Phone | String |  |
| `billing_address` | Billing address | String (1000) |  |
| `source_request` | From AR request | Reference | → `x_ar_request`. Read-only on form |
| `active` | Active | True/False | Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields. Default: true |

### Customer document — `x_ar_customer_document`

Documents supplied once per customer (D10). The file itself is a sys_attachment on this record. Number prefix: `DOC`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `customer` | Customer | Reference | → `x_ar_customer`. Read-only on form |
| `document_type` | Document type | Choice | Choices: Signed contract / PO (`contract`), Company registration (ACRA / UEN) (`acra`), Billing contact & address form (`billing_form`). Read-only on form |
| `file_name` | File | String | Read-only on form |
| `contract` | Contract | Reference | → `x_ar_contract`. Read-only on form. For signed contract / PO |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Read-only on form. For billing contact & address forms |
| `source_request` | From AR request | Reference | → `x_ar_request`. Read-only on form |
| `received_on` | Received | Date | Read-only on form |

### AR request — `x_ar_request` (extends `task`)

Case raised by the project team through an AR form record producer (AR-i … AR-xvi). Extends Task for assignment, SLAs and the activity stream. Number prefix: `ARQ`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `state` | State | Choice | Choices: New (`new`), Work in progress (`work_in_progress`), Awaiting requestor information (`awaiting_requestor_info`), Closed complete (`closed_complete`), Closed incomplete (`closed_incomplete`), Cancelled (`cancelled`). Mandatory. Set by AR with the dropdown on the case and Save (AR-00 decision, 2026-11-16). Assign to me moves New to Work in progress; a portal reply moves Awaiting requestor information to Work in progress |
| `substate` | Substate | Choice | Choices: Awaiting input (`awaiting_input`), Awaiting comment (`awaiting_comment`). Shown when State = Awaiting requestor information (UI policy). Only for Awaiting requestor information; optional; cleared when the state changes. AR only (not shown on the portal) |
| `opened_by` | Requested by | Reference | → `sys_user`. Read-only on form |
| `ar_form` | AR form | Choice | Choices: AR-i New AR request (`AR-i`), AR-ii To be defined (`AR-ii`), AR-vi To be defined (`AR-vi`), AR-vii To be defined (`AR-vii`), AR-viii To be defined (`AR-viii`), AR-ix GIRO authorisation (`AR-ix`), AR-x To be defined (`AR-x`), AR-xi To be defined (`AR-xi`), AR-xii To be defined (`AR-xii`), AR-xiii To be defined (`AR-xiii`), AR-xiv To be defined (`AR-xiv`), AR-xv To be defined (`AR-xv`), AR-xvi To be defined (`AR-xvi`), Collections (AR-iii, AR-iv, AR-v) (`COL`). Read-only on form. Collections cases: COL, with the type in collection_type (D30) |
| `submission_origin` | Submission Origin | Choice | Choices: Manual (`manual`), System-generated from unreconciled bank statement (`system`). Read-only on form. Collections (#9 §6). System-managed: Manual for portal submissions; system-generated cases are a later phase (AR-iii decision 10) |
| `collection_type` | Collection type | Choice | Choices: AR-iii, AR-iv, AR-v. Collections form (AR-iii module, D30). Mandatory; first question after General information, preselected from the catalogue tile. Choice labels are the codes until the owner gives the wording |
| `collection_date` | Collection Date | Date | Shown when Collection type is AR-iii, AR-iv (UI policy). AR-iii: mandatory. AR-iv: optional (#9 §7, §8) |
| `collection_reference` | Reference Number | String | Shown when Collection type = AR-iv (UI policy). AR-iv. Optional (#9 §8) |
| `requesting_cost_centre` | Requesting Department Cost Centre | Reference | → `x_ar_cost_centre`. Shown when Collection type = AR-iv (UI policy). AR-iv. Mandatory. Reference qualifier: active cost centres of the Requesting Department (#9 §8, AC-10) |
| `ar5_category` | Category | Choice | Choices: Cash Bail (`cash_bail`), Seized Monies (`seized`), Restitution (`restitution`). Shown when Collection type = AR-v (UI policy). AR-v. Chosen first; shows only that category's fields and document guidance (#9 §9). Mandatory |
| `date_of_collection` | Date of Collection | Date | Shown when Category is Cash Bail, Seized Monies, Restitution (UI policy). AR-v, every category. Optional until confirmed |
| `g56_receipt_number` | G56 Receipt Number | String | Shown when Category is Cash Bail, Seized Monies, Restitution (UI policy). AR-v, every category. Optional until confirmed |
| `bail_amount` | Bail Amount Received | Currency | Shown when Category = Cash Bail (UI policy). AR-v Cash Bail. Sets the Request value |
| `bailor_name` | Bailor Name | String | Shown when Category = Cash Bail (UI policy) |
| `bailor_nric` | Bailor NRIC | String | Shown when Category = Cash Bail (UI policy). Protected: masked on display (last 4 shown); validation rule to be approved (#9 §9.4) |
| `bailor_address` | Bailor Address | String (1000) | Shown when Category = Cash Bail (UI policy) |
| `ib_case_number` | IB Case Number / WEU Number | String | Shown when Category = Cash Bail (UI policy) |
| `case_number` | Case Number | String | Shown when Category is Seized Monies, Restitution (UI policy) |
| `case_status` | Case Status | Choice | Choices: Case Closed (`case_closed`), Refund to Bailor/Accused (`refund`), Case Pending (`pending`), Case Concluded (`concluded`), Forfeit to State with court order (`forfeit_order`), Forfeit to State without court order (`forfeit_no_order`), Case Pending (`pending`), Case Concluded (`concluded`), Forfeit to State with court order (`forfeit_order`), Forfeit to State without court order (`forfeit_no_order`), Case Pending (`pending`). Shown when Category is Cash Bail, Seized Monies, Restitution (UI policy). AR-v. Choices depend on the category (#9 §9; subject to final business confirmation) |
| `accused_name` | Accused Name | String | Shown when Category = Cash Bail (UI policy) |
| `accused_id_number` | Accused NRIC / FIN / Passport Number | String | Shown when Category = Cash Bail (UI policy). Protected: masked on display (last 4 shown) |
| `ar5_amount` | Amount | Currency | Shown when Category is Seized Monies, Restitution (UI policy). AR-v Seized Monies and Restitution. Sets the Request value |
| `ar5_currency` | Currency | Choice | Choices: SGD, USD, MYR, EUR, GBP, CNY, JPY, AUD. Shown when Category = Seized Monies (UI policy). Controlled list (default list; master list to be decided) |
| `ar5_to_be_invested` | Whether the seized monies are to be invested | Choice | Choices: Yes (`yes`), No (`no`). Shown when Category = Seized Monies (UI policy). Yes / No radio buttons (#9 §9.4), where applicable |
| `ar5_currency_banked` | Currency equivalent when banked in | Choice | Choices: SGD, USD, MYR, EUR, GBP, CNY, JPY, AUD. Shown when Category = Restitution (UI policy). AR-v Restitution (#9 §9.3). Read as a currency choice; to confirm (AR-iii open question 10) |
| `requester_name` | Requester name | String | General information (all AR forms). Mandatory on the form; defaults to the signed-in user's name. Default: gs.getUser().getFullName() |
| `requester_email` | Email | String | Read-only on form. General information (all AR forms). From ServiceNow SSO (sys_user.email); always read-only. Default: gs.getUser().getEmail() |
| `department_sub_bu` | Sub-BU | Choice | Choices: Civil & Structural (`ENG-1`), M&E Services (`ENG-2`), Geotechnical (`ENG-3`), Port Works (`MAR-1`), Offshore (`MAR-2`), Dredging (`MAR-3`), Data & AI (`DIG-1`), Platforms (`DIG-2`), Cyber (`DIG-3`), Roads (`INF-1`), Water (`INF-2`), Urban Systems (`INF-3`), Power Grid (`ENE-1`), Solar (`ENE-2`), Gas (`ENE-3`), Property Management (`FAC-1`), Carparks (`FAC-2`), Retail Leasing (`FAC-3`), Warehousing (`LOG-1`), Cold Chain (`LOG-2`), Freight (`LOG-3`), Hospitals (`HEA-1`), Clinics (`HEA-2`), Med Tech (`HEA-3`), Waste (`ENV-1`), Air & Noise (`ENV-2`), Ecology (`ENV-3`), Signalling (`RAI-1`), Rolling Stock (`RAI-2`), Track Works (`RAI-3`), Strategy (`ADV-1`), Transactions (`ADV-2`), Risk (`ADV-3`). General information (all AR forms). Sub-BUs of the chosen department (mock list) |
| `cc_list` | CC list | String (1000) | General information (all AR forms). Emails separated by commas; these people can view the case on the portal (Watch list) |
| `department` | Requesting department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory. Tooltip: "Auto-populated from the requester's department. Change it only if you are requesting for another department.". Default: Requester's department (sys_user.department via the variable's default value) |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory unless New customer is ticked |
| `new_customer` | New customer | True/False |  |
| `new_customer_name` | New customer name | String | Mandatory when New customer |
| `new_customer_uen` | UEN (company registration no.) | String |  |
| `new_customer_address` | Registered address | String (1000) |  |
| `contract_option` | Contract | Choice | Choices: Existing contract (`existing`), New contract (`new`), No contract required (`none`). Mandatory. Billing is contract level: every billing line sits under a contract, or under the customer's no-contract shell (D15) |
| `link_customer` | Link Customer Reference | Reference | → `x_ar_customer`. AR-i, workspace Link section (D31). x_ar_customer, display value UEN (reference auto-complete shows UEN and name). Saving sets the case's customer. Mandatory before Closed complete |
| `link_contract` | Link Contract Reference | Reference | → `x_ar_contract`. AR-i and AR-ix, workspace Link section (D31). x_ar_contract, display value Contract ID (CTR…). Reference qualifier: contracts of the linked customer (AR-i) or of the case's customer (AR-ix). Saving sets the case's contract (AR-i: also every billing line's contract). AR-i: mandatory before Closed complete |
| `contract` | Contract | Reference | → `x_ar_contract`, filtered by customer. Existing contract; otherwise set when AR saves Link Contract Reference (D31). Read-only in the workspace |
| `new_contract_type` | Contract type | Choice | Choices: Recurring (`recurring`), Ad-hoc (`ad_hoc`). Mandatory for a new contract |
| `new_contract_number` | Contract number | String | Mandatory for a new contract |
| `new_contract_ref` | Contract reference number | String | AR-i, optional for a new contract. Not on AR-ix (AR-ix decision 25: the GIRO reference giro_reference is used instead) |
| `new_contract_po` | Contract PO number | String | Optional |
| `new_contract_title` | Contract title | String | Mandatory for a new contract |
| `new_contract_start` | Contract start date | Date | Mandatory for a new contract |
| `new_contract_end` | Contract end date | Date |  |
| `new_contract_value` | Contract value (SGD) | Currency | Mandatory for a new contract |
| `new_contract_billing_cycle` | Contract billing cycle | Choice | Choices: 1st of the month (`first`), 15th of the month (`fifteenth`), Others (`others`). Optional |
| `new_contract_billing_cycle_other` | Suggested billing cycle | String | Shown when Contract billing cycle = Others (UI policy). Mandatory when the billing cycle is Others |
| `new_contract_invoice_date` | Preferred invoice billing date | Date | Optional |
| `new_contract_payment_terms` | Payment terms | Choice | Choices: 30 days (`30`), Others (`others`). Default 30 days |
| `new_contract_payment_terms_other` | Other payment terms | String | Shown when Payment terms = Others (UI policy). Mandatory when payment terms is Others |
| `new_contract_proration` | Proration | Choice | Choices: Yes (`yes`), No (`no`). Default No |
| `new_contract_proration_first` | Proration for 1st month | Currency | Shown when Proration = Yes (UI policy). Mandatory when proration is Yes |
| `new_contract_proration_last` | Proration for last month | Currency | Shown when Proration = Yes (UI policy). Mandatory when proration is Yes |
| `bill_to_name` | Bill-to person | String | Mandatory when the contract (or shell) has no bill-to person yet; AR copies it to the contract by hand (D16 as amended by D31) |
| `bill_to_email` | Bill-to email | String |  |
| `bill_to_phone` | Bill-to phone | String |  |
| `bill_to_address` | Billing address | String (1000) |  |
| `short_description` | Invoice description | String | Mandatory. What the invoice is for; becomes the case's short description and the billing line's description |
| `attention_name` | Attention to name | String | Optional. Prefilled from the contract's bill-to person |
| `attention_email` | Attention to email | String | Optional; must be a valid email. Prefilled from the contract's bill-to email |
| `amount_per_period` | Amount billed per period | Currency | Mandatory. Before GST. Recurring contract: billed every period; ad-hoc or no contract: one invoice of this amount |
| `preferred_invoice_date_choice` | Preferred invoice date | Choice | Choices: Per Billing Cycle (`per_cycle`), Expedited (`expedited`). One-invoice requests only (ad-hoc contract, no contract, or contract type not on file); hidden and cleared for a recurring contract. Optional (AR-i decision 38) |
| `preferred_invoice_date_justification` | Provide Justification for expedited or Off billing cycle request | String (1000) | Shown when Preferred invoice date = Expedited (UI policy). Shown when Expedited; optional |
| `billing_line_items_required` | Require billing line item? | Choice | Choices: Yes (`yes`), No (`no`). Yes shows the billing line items table (multi-row variable set) |
| `amount` | Request value | Currency | Read-only on form. AR-i: calculated, one-off lines + recurring amount × number of periods. Collections (AR-iii, AR-iv, AR-v): the amount to collect; BSU deposits are matched against it on Cash application (D29) |
| `po_number` | Customer PO number | String |  |
| `customer_poc_name` | POC name | String | AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in; AR copies it to the customer by hand (D23 as amended by D31) |
| `customer_poc_email` | POC email | String | AR-i customer details; must be a valid email. Same rule as POC name |
| `cost_center` | Cost center | String | Optional, free text. To be filled by GA. Tooltip: "To be filled by GA" |
| `agent_name` | Name of agent to be billed | String | Optional, free text |
| `agency_type` | Agency type | Choice | Choices: M, SB, PV. AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master |
| `vag` | V@G | Choice | Choices: Yes (`yes`), No (`no`). Shown when Agency type is SB, PV (UI policy). AR-i customer details, optional. Found customer: read-only from the customer master |
| `sub_bu` | V@G sub-BU | String | Shown when V@G = Yes (UI policy). Optional, free text |
| `type_of_billing` | Type of billing | Choice | Choices: A, B, C, D, E. Contract level: entered for a new contract (AR copies it to the contract by hand, D31); read-only copy of the contract's value for an existing one |
| `bulk_supporting_docs` | Supporting documents (bulk upload) | Attachment | Shown when Type of billing is C, D, E (UI policy). Optional; several files at once |
| `giro_on_contract` | GIRO on this contract | Choice | Choices: Yes (`yes`), No (`no`). Read-only on form. Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21). Tooltip: "GIRO is set by an AR-ix (GIRO authorisation). Raise an AR-ix if this contract needs GIRO." |
| `giro_type` | Type of request | Choice | Choices: Add GIRO (`add`), Remove GIRO (`remove`). AR-ix. Mandatory. New contract or no contract: Add GIRO only. Existing contract: Add GIRO when GIRO is not active, Remove GIRO only when it is (catalog client script filters the choices) |
| `giro_reference` | Contract / tenancy agreement / reference | String | Shown when Type of request is Add GIRO, Remove GIRO; hidden when Purpose of GIRO/DDA request = Carpark (UI policy). AR-ix, Add and Remove GIRO. Optional. Add GIRO: right after Purpose of GIRO/DDA request, hidden when Purpose = Carpark; Remove GIRO: after Type of request (UI policy; AR-ix decisions 19, 24; E8.9–E8.12) |
| `giro_purpose` | Purpose of GIRO/DDA request | Choice | Choices: Rental (`rental`), Carpark (`carpark`), Others (`others`). Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO. Mandatory. Choices by contract (catalog client script, AR-ix decision 25): No contract required → Carpark, Others; existing or new contract → Rental, Others |
| `giro_purpose_other` | Other purpose | String | Shown when Purpose of GIRO/DDA request = Others (UI policy). AR-ix. Mandatory when Purpose = Others |
| `giro_applicant_name` | Customer name | String | Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6) |
| `giro_applicant_email` | Customer email | String | Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6) |
| `giro_applicant_mobile` | Customer mobile | String | Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO. Prefilled from the contract's bill-to phone (label: AR-ix decision 20, E8.6) |
| `giro_remarks` | Remarks | String (1000) | Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO, all purposes. Optional |
| `giro_location` | Location | String | Shown when Purpose of GIRO/DDA request is Rental, Carpark (UI policy). AR-ix Rental and Carpark. Mandatory (AR-ix decision 21, E8.15) |
| `giro_start_date` | Effective start date | Date | Shown when Type of request = Add GIRO (UI policy). AR-ix Add GIRO, every purpose. Mandatory (AR-ix decision 18, E8.7) |
| `giro_end_date` | Effective end date | Date | Shown when Type of request = Remove GIRO (UI policy). AR-ix Remove GIRO. Mandatory; the only Remove GIRO detail (AR-ix decision 18, E8.8) |
| `giro_carplate` | Car plate | String | Shown when Purpose of GIRO/DDA request = Carpark (UI policy). AR-ix carpark. Mandatory; one vehicle per form |
| `giro_amount` | Amount | String | Shown when Purpose of GIRO/DDA request is Rental, Carpark (UI policy). AR-ix Rental and Carpark. Optional free text; not used by any other field or calculation (AR-ix decisions 13, 21; E8.13, E8.15) |
| `doc_contract_po` | Signed contract / PO | Attachment | Optional, offered for a new contract only |
| `doc_acra` | Company registration (ACRA / UEN) | Attachment | Only when not already on file |
| `doc_billing_form` | Billing contact & address form | Attachment | Only when not already on file for this department |
| `description` | Additional details | String (4000) |  |
| `assignment_group` | Assignment group | Reference | → `sys_user_group`. Platform sys_user_group. One group for now: Accounts Receivable, set on every new case (record producer script) |
| `assigned_to` | Assigned to | Reference | → `sys_user` (users with x_ar.ar_team). Reference qualifier: members of the assignment group |
| `opened_at` | Opened | Date | Read-only on form |
| `comments` / `work_notes` | Additional comments / Work notes | Journal (inherited from task) | Comments visible on portal; work notes AR team only |

### Billing line — `x_ar_request_line`

What to bill on an AR request (D13): one-off, or recurring over a from–to date range. Portal: multi-row variable set on AR-i. Number prefix: `RQL`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `contract` | Contract | Reference | → `x_ar_contract`. Read-only on form. Billing lines are contract level (D15). Existing contract at submit; otherwise set when AR saves Link Contract Reference on the case (D31) |
| `line_type` | Line type | Choice | Choices: One-off (`one_off`), Recurring (`recurring`). Mandatory |
| `short_description` | Description | String | Mandatory |
| `amount` | Amount | Currency | Mandatory. Recurring: amount per period |
| `preferred_invoice_date` | Preferred invoice date | Date | One-off only |
| `frequency` | Frequency | Choice | Choices: Monthly (`monthly`), Quarterly (`quarterly`), Half-yearly (`half_yearly`), Annually (`annually`). Recurring only; Monthly by default (decision 10) |
| `start_date` | From | Date | Recurring only: first billing date |
| `end_date` | To | Date | Recurring only: last billing date |
| `remarks` | Remarks | String | Recurring only, optional |
| `invoice` | Invoice | Reference | → `x_ar_invoice`. Read-only on form |
| `billing_schedule` | Billing schedule | Reference | → `x_ar_billing_schedule`. Read-only on form |
| `periods` | Number of invoices | Integer | Calculated: recurring: periods between start and end at the frequency |
| `line_value` | Line value | Currency | Calculated: one-off: amount; recurring: amount × periods, or when prorated: first month amount + amount × (periods − 2) + last month amount |

### Billing line item — `x_ar_request_item`

Breakdown of an AR request's invoice (AR-i decision 32). Portal: multi-row variable set on AR-i, shown when 'Require billing line item?' is Yes. GST and total are calculated (GST_RATE).

| Column | Label | Type | Notes |
|---|---|---|---|
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `item_number` | Item number | Integer | Read-only on form. System number 1, 2, 3… in row order within the AR request; set by the producer script, never typed (AR-i decision 37) |
| `amount_excl_gst` | Amount (w/o GST) | Currency | Mandatory |
| `gst_amount` | GST amount | Currency | Read-only on form. Calculated: amount × GST rate (9%), rounded to the cent |
| `total_amount` | Total amount | Currency | Read-only on form. Calculated: amount + GST |
| `late_payment_interest` | Late payment interest (%) | Decimal | Rate % (to be confirmed with the users) |
| `account_code` | Account code | String |  |

### Billing schedule — `x_ar_billing_schedule`

Recurring billing from the 2nd invoice onwards (CCI decision 8): AR creates the schedule by hand on the contract and picks the AR-i case; D12 amended, D13. Under a contract: from–to date range and frequency. A daily scheduled job creates each period's draft invoice 5 working days before its invoice date; AR issues it. Number prefix: `SCH`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `contract` | Contract | Reference | → `x_ar_contract`. Mandatory |
| `customer` | Customer | Reference | → `x_ar_customer`. Read-only on form. From the contract |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory |
| `short_description` | What is billed | String | Mandatory |
| `frequency` | Frequency | Choice | Choices: Monthly (`monthly`), Quarterly (`quarterly`), Half-yearly (`half_yearly`), Annually (`annually`). Mandatory |
| `amount` | Amount per period | Currency | Mandatory |
| `first_billing_date` | First billing date | Date | Mandatory |
| `last_billing_date` | Last billing date | Date | Mandatory |
| `first_period_amount` | First period amount (prorated) | Currency | Empty = amount per period |
| `last_period_amount` | Last period amount (prorated) | Currency | Empty = amount per period |
| `source_request` | From AR request | Reference | → `x_ar_request`. AR picks the recurring AR-i case (reference qualifier: AR-i cases with a recurring line on this contract). Invoices from this schedule are linked to that case (CCI decision 8) |
| `source_line` | From billing line | Reference | → `x_ar_request_line`. Read-only on form. Set from the AR request's recurring line |
| `next_billing_date` | Next billing date | Date | Calculated: first period on or after today without an invoice |

### Invoice — `x_ar_invoice`

System of record for customer invoices. Created by the AR team from an AR request, then issued. Number prefix: `INV`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `state` | State | Choice | Choices: Draft (`draft`), Issued (`issued`), Cancelled (`cancelled`). Read-only on form |
| `customer` | Customer | Reference | → `x_ar_customer`. Mandatory |
| `contract` | Contract | Reference | → `x_ar_contract`, filtered by customer |
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `request_line` | Billing line | Reference | → `x_ar_request_line`. Read-only on form |
| `billing_schedule` | Billing schedule | Reference | → `x_ar_billing_schedule`. Read-only on form |
| `billing_period` | Billing period | Date | Read-only on form |
| `short_description` | Description | String | Mandatory |
| `amount` | Amount | Currency | Mandatory |
| `invoice_date` | Invoice date | Date |  |
| `approval_date` | Approval date | Date | Set manually by the AR team (CCI decision 8) |
| `due_date` | Due date | Date | Defaults to invoice date + contract payment terms |
| `amount_due` | Amount due | Currency | Calculated: amount − accepted allocations (business rule on allocation insert/update) |
| `payment_status` | Payment status | Choice | Calculated: Unpaid / Part paid / Paid, set with amount_due |

### Bank account — `x_ar_bank_account`

Company bank accounts that statements are uploaded for. Department and account type classify every deposit on the account.

| Column | Label | Type | Notes |
|---|---|---|---|
| `bank` | Bank name | Choice | Choices: Marina Bank (`MB`), Orchard Bank (`OB`), Union Straits Bank (`US`). Mandatory. BSU decision 17: shown apart from the bank account number. Mock aliases for Singapore's three largest banks; each has its own CSV layout |
| `account_number` | Bank account number | String | Mandatory |
| `account_name` | Bank account name | String | Mandatory. Describes the sub-account type under the department, so the department understands it (e.g. Project deposits, Retention and deposits) (BSU decision 17) |
| `department` | Department | Choice | Choices: Finance, Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory |
| `account_type` | Account type | Choice | Choices: Revenue account (`revenue`), Deposit account (`deposit`), Operating account (`operating`). Mandatory |
| `currency` | Currency | String | Read-only on form |
| `collection_types` | Collection types | List | Choices: AR-iii, AR-iv, AR-v. Collections forms whose money arrives in this account (BSU decision 13). The invoice finder ranks open Collections cases of these types first; it never hides the others |
| `active` | Active | True/False | Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields. Default: true |

### Statement upload — `sc_req_item`

Bank statement upload (BSU) = one RITM per bank account per statement day (D32, BSU decision 12): catalog item 'Bank statement upload' submitted from the workspace BSU page (direct upload by AR); its variables hold the fields below, the CSV is the RITM's attachment, and a flow creates the related Bank statements records and closes the RITM. Number prefix: `RITM`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `number` | Number | String | Read-only on form |
| `bank_account` | Bank account | Reference | → `x_ar_bank_account`. Read-only on form |
| `statement_date` | Statement date | Date | Read-only on form |
| `file_name` | File | String | Read-only on form |
| `uploaded_by` | Uploaded by | Reference | → `sys_user`. Read-only on form |
| `uploaded_at` | Uploaded | String | Read-only on form |
| `deposit_count` | Deposits | Integer | Read-only on form |
| `deposit_total` | Deposit total | Currency | Read-only on form |
| `withdrawals_skipped` | Withdrawals skipped | Integer | Read-only on form |

### Bank statements (BSU deposits) — `x_ar_bank_statement`

The only record of money received (D7): one row per deposit (credit) loaded by BSU from the daily CSV statement. There is no separate payments table. Matched to invoices manually; no auto-matching (D5). Number prefix: `DEP`.

| Column | Label | Type | Notes |
|---|---|---|---|
| `deposit_id` | Deposit ID | String | Read-only on form. Set by before-insert business rule (BSU decision 18): the payment mode's prefix, the deposit (value) date as DDMMYY and the payment mode's suffix. Not unique: deposits of one payment mode on one day share it. No matching payment mode: UNK-<DDMMYY>-XX |
| `bank_account` | Bank account | Reference | → `x_ar_bank_account`. Read-only on form |
| `bsu` | Statement upload | Reference | → `sc_req_item`. Read-only on form |
| `value_date` | Value date | Date | Read-only on form |
| `amount` | Amount | Currency | Read-only on form |
| `payer_name` | Payer (as on statement) | String | Read-only on form |
| `bank_reference` | Reference / remittance | String | Read-only on form |
| `bank_transaction_ref` | Bank transaction ref | String | Read-only on form |
| `transaction_id` | Transaction ID | String | Read-only on form. From the bank's transaction-code column (BSU decisions 18–19); matched to a payment mode of the bank account |
| `payment_mode` | Payment mode | Reference | → `x_ar_payment_mode`. Read-only on form. Payment mode equal to the statement line's transaction code (BSU decision 19); empty when none matched (fallback Deposit ID) |
| `match_state` | Match state | Choice | Calculated: Unmatched / Part matched / Matched, from accepted allocations |
| `unmatched_amount` | Unmatched amount | Currency | Calculated: amount − accepted allocations |

### Allocation — `x_ar_allocation`

Applies part or all of a BSU deposit to an invoice, or to an open Collections case (AR-iii, AR-iv, AR-v; D29). Exactly one of invoice or request is set. Always created manually by the AR team from the invoice finder (no auto-matching, D5).

| Column | Label | Type | Notes |
|---|---|---|---|
| `deposit` | BSU deposit | Reference | → `x_ar_bank_statement` |
| `invoice` | Invoice | Reference | → `x_ar_invoice` |
| `request` | Collection case | Reference | → `x_ar_request`. Set instead of Invoice when the deposit is matched to a Collections case (reference qualifier: ar_form = COL, the Collections form for AR-iii, AR-iv, AR-v; D29, D30) |
| `amount` | Amount | Currency |  |
| `state` | State | Choice | Choices: Applied (`accepted`), Removed (`removed`) |
| `exception` | Exception | Choice | Choices: Exact (`none`), Multi-invoice (`multi_invoice`), Short pay (`short_pay`), Overpayment (`over_pay`), Partial (`partial`), Discount taken (`discount`) |
| `reason` | Reason | String (1000) |  |

### Payment mode — `x_ar_payment_mode`

Payment modes per bank account (BSU decisions 18–19), defined by AR. A statement line's transaction code equals the payment mode, whose prefix and suffix build the Deposit ID: <Prefix>-<DDMMYY>-<Suffix>.

| Column | Label | Type | Notes |
|---|---|---|---|
| `bank_account` | Bank account | Reference | → `x_ar_bank_account`. Mandatory |
| `name` | Payment mode | String | Mandatory. The code in the bank statement's transaction column for this payment mode, e.g. GIRO, FAST, CHQ, TT; a statement line matches it exactly, not case-sensitive (BSU decision 19) |
| `prefix` | Prefix | String | Mandatory. Start of the Deposit ID, e.g. AAA |
| `suffix` | Suffix | String | Mandatory. End of the Deposit ID |
| `active` | Active | True/False | Inactive payment modes are not used for new uploads (CCI decision 12). Default: true |

### Collection — `x_ar_collection_tx`

AR3 rows of a Collections case (#9 §7): multi-row variable set on the Collections form, copied to this table by the producer script. 1 to 99 rows; total transactions calculated; duplicate collection types allowed (owner).

| Column | Label | Type | Notes |
|---|---|---|---|
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `row_number` | Row | Integer | Read-only on form |
| `collection_type` | Collection Type | Choice | Choices: Cashcard, Credit Card, NETS, NETS FlashPay, NETS Scan/QR. Mandatory |
| `number_of_transactions` | Number of Transactions | Integer | Mandatory. Positive whole number |

### Allocation — `x_ar_collection_allocation`

AR4 rows of a Collections case (#9 §8): 1 to 10 rows; the allocation total becomes the case's Request value. Stores the cost centre and account code records (sys_id), not only their labels.

| Column | Label | Type | Notes |
|---|---|---|---|
| `ar_request` | AR request | Reference | → `x_ar_request`. Read-only on form |
| `row_number` | Row | Integer | Read-only on form |
| `description` | Description | String | Mandatory |
| `amount` | Amount | Currency | Mandatory. Positive, at most two decimals |
| `cost_centre` | Cost Centre | Reference | → `x_ar_cost_centre`. Mandatory. Reference qualifier: active cost centres of the Requesting Department |
| `account_code` | Account Code | Reference | → `x_ar_account_code`. Mandatory. Reference qualifier: active account codes. GST / recovery rule check to be approved (AR-iii open question 11) |

### Cost centre — `x_ar_cost_centre`

Master data (CCI decision 11, #9 §8): cost centres per requesting department; only active ones are offered. Fictional sample values.

| Column | Label | Type | Notes |
|---|---|---|---|
| `code` | Code | String | Mandatory |
| `name` | Name | String | Mandatory |
| `department` | Department | Choice | Choices: Engineering, Marine, Digital, Infrastructure, Energy, Facilities, Logistics, Healthcare, Environmental, Rail, Advisory. Mandatory |
| `active` | Active | True/False | Inactive records are not offered in forms (CCI decision 12). Default: true |

### Account code — `x_ar_account_code`

Master data (CCI decision 11, #9 §8): account codes for AR4 allocations with their GST / recovery treatment; only active ones are offered. Fictional sample values.

| Column | Label | Type | Notes |
|---|---|---|---|
| `code` | Code | String | Mandatory |
| `description` | Description | String | Mandatory |
| `gst_treatment` | GST / recovery treatment | Choice | Choices: GST applicable (`gst`), No GST (`no_gst`), Recovery (`recovery`) |
| `active` | Active | True/False | Inactive records are not offered in forms (CCI decision 12). Default: true |

## Portal (project team)

- **Record producer "AR-i New AR request"** on `x_ar_request`. Variables: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`, `customer`, `new_customer`, `new_customer_name`, `new_customer_uen`, `new_customer_address`, `contract_option`, `contract`, `new_contract_type`, `new_contract_number`, `new_contract_ref`, `new_contract_po`, `new_contract_title`, `new_contract_start`, `new_contract_end`, `new_contract_value`, `new_contract_billing_cycle`, `new_contract_billing_cycle_other`, `new_contract_invoice_date`, `new_contract_payment_terms`, `new_contract_payment_terms_other`, `new_contract_proration`, `new_contract_proration_first`, `new_contract_proration_last`, `bill_to_name`, `bill_to_email`, `bill_to_phone`, `bill_to_address`, `short_description`, `attention_name`, `attention_email`, `amount_per_period`, `preferred_invoice_date_choice`, `preferred_invoice_date_justification`, `billing_line_items_required`, `po_number`, `customer_poc_name`, `customer_poc_email`, `cost_center`, `agent_name`, `agency_type`, `vag`, `sub_bu`, `type_of_billing`, `bulk_supporting_docs`, `giro_on_contract`, `doc_contract_po`, `doc_acra`, `doc_billing_form`, `description`, plus attachments.
  - Producer script: `current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; creates one x_ar_request_line from the invoice details (recurring when the contract type is Recurring, else one-off, D13 as amended); copies the billing line items multi-row variable set to x_ar_request_item`
  - Catalog client script on contract change: show contract value, invoiced to date, requested-not-invoiced and remaining (GlideAjax to a Script Include). Warn when the request exceeds the remaining value.
  - Contract reference qualifier: contracts of the selected customer.
- **Variable set "General information"** (D19), first section of every AR form: `requester_name` (default: current user's name), `requester_email` (from SSO, read-only), `department`, `cc_list` (emails; the producer script adds them to the case `watch_list` so they can view it on the portal).
- **Record producer "AR-ix GIRO authorisation"** on `x_ar_request` (AR-ix module). Variables: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`, `customer`, `contract_option`, `contract`, `giro_type`, `giro_reference`, `giro_purpose`, `giro_purpose_other`, `giro_applicant_name`, `giro_applicant_email`, `giro_applicant_mobile`, `giro_remarks`, `giro_start_date`, `giro_end_date`, `giro_carplate`, `giro_location`, `giro_amount`, plus attachments.
  - Producer script: `current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>; contract_option = none → current.contract = the customer's no-contract shell for the department, if it exists;`
  - Catalog client script on contract change: prefill applicant name / email / mobile from the contract's bill-to; show active GIRO on the contract.
  - UI policies: Other purpose when Purpose = Others; location and effective start/end for Rental; car plate and parking start/end for Carpark; amount and start date mandatory for Add GIRO.
- **Record producer "Collections (AR-iii, AR-iv, AR-v)"** on `x_ar_request` (AR-iii module, D30). Variables: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`, `collection_type`, `collection_date`, `collection_reference`, `requesting_cost_centre`, `ar5_category`, `date_of_collection`, `g56_receipt_number`, `bail_amount`, `bailor_name`, `bailor_nric`, `bailor_address`, `ib_case_number`, `case_number`, `case_status`, `accused_name`, `accused_id_number`, `ar5_amount`, `ar5_currency`, `ar5_to_be_invested`, `ar5_currency_banked`.
  - Producer script: `current.opened_by = gs.getUserID(); current.ar_form = 'COL'; current.collection_type = producer.collection_type; current.short_description = 'Collections – ' + collection_type; current.submission_origin = 'manual'; copies the multi-row sets to x_ar_collection_tx (AR3) / x_ar_collection_allocation (AR4); amount = AR4 allocation total or the AR5 amount (AR3: open question); current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>. Catalogue: three items (AR-iii, AR-iv, AR-v) open this producer with collection_type preset (URL parameter / default value).`
- **My requests**: list widget on `x_ar_request` where `opened_by = me` **or the user's email is on the CC list** (`watch_list` contains me); CC'd cases are marked *CC*.
- **Ticket page**: standard ticket conversation (comments only), field summary, attachments; requester can comment. Business rule: requester comment while *Awaiting info* sets state to *In progress*.
- ACLs: `x_ar.project_team` create on `x_ar_request` (via producer), read own records; read `x_ar_customer` and `x_ar_contract` for reference selection; read invoice number/date/due of their own request's invoice. No workspace access.

## Workspace (AR team)

- Configurable workspace **Receivables Workspace** (UI Builder), role `x_ar.ar_team`.
- Layout follows the **Horizon Design System** workspace templates (see `docs/modules/UIX/README.md`): unified navigation header, app navigation on the left, workspace tabs (primary tab + closable record tabs).
- **Landing page**: greeting header and a grid of single-score cards (new requests, assigned to me, awaiting info, customer setup pending, billing periods due, draft invoices, overdue amount, BSU deposits to match, statements uploaded for yesterday), aging bar chart, new requests list, overdue invoices list.
- **List page** (Horizon list page template): **list menu** on the left, list on the right. Menu: AR requests (Open, New unassigned, Customer setup pending, Assigned to me, Awaiting info, All); Recurring billing (Billing periods due, Active schedules, All); Invoices (Drafts, Issued unpaid, Overdue, All); Bank statements (Statement uploads, BSU deposits to match, All BSU deposits, Bank accounts); Master data (Customers, Contracts, No-contract shells, Billing contacts, Customer documents).
- **Record pages** (Horizon Record page template): header (record name, description, label-value pairs, form record presence, **UI action bar** with overflow menu) › **ribbon** of metric widgets (collapsible) › **resizable pane** with record tabs (Details first, then related items, then one tab per related list; extra tabs in a More menu) and the **contextual side bar** (vertical icon tabs). AR request side bar: Customer setup, Activity stream, Attachments (side bar tools for other records: open, GitHub issue #1). Last tab on every record: **Record history** (sys_audit; turn Audit on for every `x_ar_` table). Theme: the default workspace theme.
- **BSU (bank statement upload)** custom page: daily checklist of bank accounts for the statement date, upload form (bank account, statement date, CSV), preview of deposits with Deposit IDs, *Save to bank statements*, recent uploads. See `docs/modules/BSU/README.md`.
- **Cash application** custom page: deposits from the Bank statements table with match state; **manual matching only** through the invoice finder with allocation preview (modal or side panel).

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | `assigned_to` = current user; New → In progress |
| AR request | Link to customer | Creates or links `x_ar_customer`; links / creates the contract or no-contract shell and sets it on every billing line; writes the bill-to to the contract; files documents (D10, D15, D16) |
| AR request | Request info (overflow menu) | Requires an additional comment; state → Awaiting info |
| AR request | Reject (overflow menu) | Requires an additional comment; state → Rejected |
| Billing line | Create invoice | One-off line: insert draft `x_ar_invoice` (customer, line's contract, description, amount, invoice date, due = date + terms); links `request_line` |
| Billing line | Set up billing schedule | Recurring line: insert `x_ar_billing_schedule` over the line's date range; comment to requester (D12) |
| Billing schedule | Raise invoice | Draft invoice for one billing period; never automatic (D12) |
| AR request (AR-ix) | Link contract | Shown while `contract` is empty: sets contract and customer from the chosen contract. For a contract not on file, AR processes its AR-i first (AR-ix module) |
| AR request (AR-ix) | Activate GIRO | Type Add: contract `giro_status` = Active and `giro_case` = this case; case → Completed. Blocked if the contract already has GIRO active (one per contract, D21) |
| AR request (AR-ix) | Remove GIRO | Type Remove: contract `giro_status` = Not active, `giro_case` cleared; case → Completed. Blocked if GIRO is not active |
| Invoice | Issue invoice | Draft → Issued; posts a requester-visible comment; BR sets the AR request to Billed when every line is invoiced or scheduled |
| Invoice | Cancel invoice (overflow menu) | Only when no allocations; the line becomes open again and the request goes back to In progress |
| Deposit | Match to invoice / Find invoice → Apply | Inserts `x_ar_allocation` records (manual); exception = short pay / over pay / multi-invoice |
| Deposit | Remove match | Removes the deposit's allocations |
| BSU page | Save to bank statements | Inserts `sc_req_item` + one `x_ar_bank_statement` row per deposit; withdrawals skipped |
| Bank account | Upload statement | Opens the BSU page for that account |

### Matching (manual only)

There is **no auto-matching** (decision D5). The invoice finder ranks issued invoices for a deposit by
invoice number in the bank reference, amount fit and payer-name similarity (customer name, parent group,
bank-statement names), purely as a suggestion. The AR team always chooses and applies the allocation.
Only **issued** invoices receive deposits.

## Bank statement upload (BSU)

- One upload per bank account per statement day (previous day), CSV only, deposits (credits) only.
- Deposit ID: `DEP-<bank code><last 4 of account>-<YYMMDD>-<NNN>` (before-insert business rule).
- Parsing: Script Include `x_ar.BankStatementParser` with one column template per bank (or one Data Source + Transform Map per bank).

| Bank (mock alias) | Code | Date format | Header columns |
|---|---|---|---|
| Marina Bank | MB | `D MMM YYYY` | Transaction Date, Value Date, Transaction Code, Transaction Description 1, Transaction Description 2, Debit Amount, Credit Amount, Client Reference |
| Orchard Bank | OB | `DD/MM/YYYY` | Transaction date, Value date, Txn Type, Description, Remarks, Withdrawals (SGD), Deposits (SGD) |
| Union Straits Bank | US | `YYYY-MM-DD` | Date, Transaction ID, Description, Reference, Deposit, Withdrawal, Ledger Balance |

## Automation

To be defined by the owner (placeholder). Candidates seen in the prototype:
- On AR request insert: assignment to AR team group, notification to the group.
- On state change: notifications to the requester (Awaiting info, Invoiced, Rejected).
- Reminder if a bank account has no upload for yesterday by a cut-off time (optional; controls kept out for now).

## Open questions

1. Should the project team see payment status of their invoices on the portal (currently only number, issue date and due date)?
2. Approval step before *Issue invoice* (e.g. AR manager above a threshold)?
3. Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format?
4. Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in?
5. Multi-currency: SGD only, or currency per contract?
6. BSU: who may upload statements, and can a wrong upload be deleted and redone? (see docs/modules/BSU/README.md)
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
