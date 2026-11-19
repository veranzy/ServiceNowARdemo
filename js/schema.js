// ServiceNow build model: scoped custom tables, fields, choices and roles.
// This file is the single source for record forms, list columns, the Build notes overlay
// and SERVICENOW_MAPPING.md (regenerate with `node tools/mapping.mjs`). No DOM access here.

export const SCOPE = "x_ar"; // placeholder: replace with the real application scope, e.g. x_1234_ar

export const ROLES = {
  ar: { role: `${SCOPE}.ar_team`, label: "Accounts receivable team", ui: "Receivables Workspace (UI Builder, configurable workspace)",
    can: "Read/write all AR tables; works AR request cases, issues invoices, uploads bank statements (BSU), matches BSU deposits to invoices." },
  project: { role: `${SCOPE}.project_team`, label: "Company project team", ui: "Service Portal / Employee Center",
    can: "Submit AR forms (record producers AR-i … AR-xvi) and read/comment on their own AR requests. Read customers, contracts, billing contacts and which customer documents are on file. No workspace access." }
};

// AR-00 decision (2026-11-16): case states and substates, owner's wording. AR sets them with the State dropdown on the case.
const STATE_REQ = [["new", "New"], ["work_in_progress", "Work in progress"], ["awaiting_requestor_info", "Awaiting requestor information"], ["closed_complete", "Closed complete"], ["closed_incomplete", "Closed incomplete"], ["cancelled", "Cancelled"]];
const SUBSTATE_REQ = [["awaiting_input", "Awaiting input"], ["awaiting_comment", "Awaiting comment"]];

/** The 11 operational departments (D11). Bank accounts may also belong to Finance. */
export const DEPARTMENTS = ["Engineering", "Marine", "Digital", "Infrastructure", "Energy", "Facilities", "Logistics", "Healthcare", "Environmental", "Rail", "Advisory"];
const DEPT_CHOICES = DEPARTMENTS.map(d => [d, d]);
/** Sub-BUs per department (mock data until the client supplies the real list). [value, label, department]. */
const SUB_BU_NAMES = {
  Engineering: ["Civil & Structural", "M&E Services", "Geotechnical"], Marine: ["Port Works", "Offshore", "Dredging"], Digital: ["Data & AI", "Platforms", "Cyber"],
  Infrastructure: ["Roads", "Water", "Urban Systems"], Energy: ["Power Grid", "Solar", "Gas"], Facilities: ["Property Management", "Carparks", "Retail Leasing"],
  Logistics: ["Warehousing", "Cold Chain", "Freight"], Healthcare: ["Hospitals", "Clinics", "Med Tech"], Environmental: ["Waste", "Air & Noise", "Ecology"],
  Rail: ["Signalling", "Rolling Stock", "Track Works"], Advisory: ["Strategy", "Transactions", "Risk"]
};
export const DEPT_SUB_BUS = DEPARTMENTS.flatMap(d => SUB_BU_NAMES[d].map((n, i) => [`${d.slice(0, 3).toUpperCase()}-${i + 1}`, n, d]));

/** Portal AR forms catalogue (D9): AR-i … AR-xvi. Only AR-i is defined so far. */
/** Collections (D28, D30): AR-iii, AR-iv and AR-v are one form. Its tiles open the same form with the type preselected;
 *  the case records ar_form = COL and the chosen type in collection_type. Names and descriptions: placeholders until the owner gives them. */
export const COLLECTION_TILES = ["AR-iii", "AR-iv", "AR-v"];
export const COLLECTIONS_FORM = "COL";
export const AR_FORMS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi"].map((r, n) => ({
  code: `AR-${r}`, name: n === 0 ? "New AR request" : n === 8 ? "GIRO authorisation" : n >= 2 && n <= 4 ? "Collections" : "To be defined",
  desc: n === 0 ? "Bill a customer: one-off and recurring lines, new or existing customer. Customer documents are given once."
    : n === 8 ? "Add or remove GIRO (direct debit) on a contract: rental, carpark or other charges."
    : n >= 2 && n <= 4 ? "Money collected without an invoice. One form for AR-iii, AR-iv and AR-v." : "Form not yet specified.",
  active: n === 0 || n === 8 || (n >= 2 && n <= 4)
}));
/** Collection type choices (D30): codes until the owner gives the labels. */
export const COLLECTION_TYPES = COLLECTION_TILES.map(c => [c, c]);
/** Collections category (D28): money collected without an invoice. A BSU deposit can be matched to an open case of these forms (D29). */
export const COLLECTION_FORMS = ["COL"];   // D30: one Collections form; the case's collection_type says AR-iii, AR-iv or AR-v
export const GIRO_PURPOSES = [["rental", "Rental"], ["carpark", "Carpark"], ["others", "Others"]];
export const GIRO_TYPES = [["add", "Add GIRO"], ["remove", "Remove GIRO"]];
const GIRO_STATUS = [["active", "Active"], ["none", "Not active"]];

export const LINE_TYPES = [["one_off", "One-off"], ["recurring", "Recurring"]];
export const FREQUENCIES = [["monthly", "Monthly", 1], ["quarterly", "Quarterly", 3], ["half_yearly", "Half-yearly", 6], ["annually", "Annually", 12]];
export const DOC_TYPES = [["contract", "Signed contract / PO"], ["acra", "Company registration (ACRA / UEN)"], ["billing_form", "Billing contact & address form"]];
export const CONTRACT_OPTIONS = [["existing", "Existing contract"], ["new", "New contract"], ["none", "No contract required"]];
// CCI decision (2026-11-16): field contract_type is labelled Contract category; "shell" records are labelled No contract.
export const CONTRACT_TYPES = [["contract", "Contract"], ["shell", "No contract"]];
export const AGENCY_TYPES = [["M", "M"], ["SB", "SB"], ["PV", "PV"]];
const YES_NO = [["yes", "Yes"], ["no", "No"]];
// ---------- Collections form, phase 1 (AR-iii decisions 12–17, #9) ----------
/** AR3 collection types (#9 §7, spec examples). Duplicates allowed (owner). */
export const AR3_TYPES = ["Cashcard", "Credit Card", "NETS", "NETS FlashPay", "NETS Scan/QR"].map(x => [x, x]);
/** AR5 categories (#9 §9). */
export const AR5_CATEGORIES = [["cash_bail", "Cash Bail"], ["seized", "Seized Monies"], ["restitution", "Restitution"]];
/** AR5 case status per category (#9 §9.1–9.3; subject to final business confirmation). [value, label, category] */
export const AR5_STATUS = [   // AR-iii decision 19: Cash Bail and Seized Monies: Case Pending / Case Closed; Restitution TBD (open question 12)
  ["pending", "Case Pending", "cash_bail"], ["case_closed", "Case Closed", "cash_bail"],
  ["pending", "Case Pending", "seized"], ["case_closed", "Case Closed", "seized"],
  ["forfeit_order", "Forfeit to State with court order", "restitution"], ["forfeit_no_order", "Forfeit to State without court order", "restitution"], ["pending", "Case Pending", "restitution"]
];
const AR5_ALL = ["cash_bail", "seized", "restitution"];
const BILLING_KINDS = ["A", "B", "C", "D", "E"].map(x => [x, x]);
export const CONTRACT_CATEGORIES = [["recurring", "Recurring"], ["ad_hoc", "Ad-hoc"]];
/** AR-i invoice timing for one-invoice requests (AR-i decision 38). */
export const INVOICE_TIMING = [["per_cycle", "Per Billing Cycle"], ["expedited", "Expedited"]];
export const BILLING_CYCLES = [["first", "1st of the month"], ["fifteenth", "15th of the month"], ["others", "Others"]];
/** GST rate (%) for billing line items (AR-i decision 33). Build: a system property, e.g. x_ar.gst_rate. */
export const GST_RATE = 9;
export const PAYMENT_TERM_CHOICES = [["30", "30 days"], ["others", "Others"]];

export const TABLES = {
  requests: {
    table: `${SCOPE}_request`, label: "AR request", plural: "AR requests", extends: "task", display: "number", prefix: "ARQ",
    note: "Case raised by the project team through an AR form record producer (AR-i … AR-xvi). Extends Task for assignment, SLAs and the activity stream.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "ARQ0001000" },
      { key: "state", name: "state", label: "State", type: "Choice", choices: STATE_REQ, mandatory: true, help: "Set by AR with the dropdown on the case and Save (AR-00 decision, 2026-11-16). Assign to me moves New to Work in progress; a portal reply moves Awaiting requestor information to Work in progress" },
      { key: "substate", name: "substate", label: "Substate", type: "Choice", choices: SUBSTATE_REQ, showIf: { key: "state", eq: "awaiting_requestor_info" }, help: "Only for Awaiting requestor information; optional; cleared when the state changes. AR only (not shown on the portal)" },
      { key: "requestedBy", name: "opened_by", label: "Requested by", type: "Reference", ref: "users", readonly: true },
      { key: "form", name: "ar_form", label: "AR form", type: "Choice", choices: [...AR_FORMS.filter(f => !COLLECTION_TILES.includes(f.code)).map(f => [f.code, `${f.code} ${f.name}`]), ["COL", "Collections (AR-iii, AR-iv, AR-v)"]], readonly: true, help: "Collections cases: COL, with the type in collection_type (D30)" },
      { key: "colOrigin", name: "submission_origin", label: "Submission Origin", type: "Choice", choices: [["manual", "Manual"], ["system", "System-generated from unreconciled bank statement"]], readonly: true, help: "Collections (#9 §6). System-managed: Manual for portal submissions; system-generated cases are a later phase (AR-iii decision 10)" },
      { key: "colType", name: "collection_type", label: "Collection type", type: "Choice", choices: COLLECTION_TYPES, help: "Collections form (AR-iii module, D30). Mandatory; first question after General information, preselected from the catalogue tile. Choice labels are the codes until the owner gives the wording" },
      // Collections section 3. Collection Details (#9 §7–9; AR-iii decisions 12–17). AR5 fields: none mandatory (owner, decision 14)
      { key: "colDate", name: "collection_date", label: "Collection Date", type: "Date", showIf: { key: "colType", in: ["AR-iii", "AR-iv"] }, help: "AR-iii: mandatory. AR-iv: optional (#9 §7, §8)" },
      { key: "colRef", name: "collection_reference", label: "Reference Number", type: "String", showIf: { key: "colType", eq: "AR-iv" }, help: "AR-iv. Optional (#9 §8)" },
      { key: "colCategory", name: "ar5_category", label: "Category", type: "Choice", choices: AR5_CATEGORIES, showIf: { key: "colType", eq: "AR-v" }, help: "AR-v. Chosen first; shows only that category's fields and document guidance (#9 §9). Mandatory" },
      { key: "ar5Date", name: "date_of_collection", label: "Date of Collection", type: "Date", showIf: { key: "colCategory", in: AR5_ALL }, help: "AR-v, every category (general). Optional until confirmed" },
      { key: "ar5Receipt", name: "g56_receipt_number", label: "G56 Receipt Number", type: "String", showIf: { key: "colCategory", eq: "cash_bail" }, help: "AR-v Cash Bail only (AR-iii decision 19). Optional until confirmed" },
      { key: "bailAmount", name: "bail_amount", label: "Bail Amount Received", type: "Currency", showIf: { key: "colCategory", eq: "cash_bail" }, help: "AR-v Cash Bail. Sets the Request value" },
      { key: "bailorName", name: "bailor_name", label: "Bailor Name", type: "String", showIf: { key: "colCategory", eq: "cash_bail" } },
      { key: "ibCase", name: "ib_case_number", label: "IB Case Number / WEU Number", type: "String", showIf: { key: "colCategory", eq: "cash_bail" } },
      { key: "caseStatus", name: "case_status", label: "Case Status", type: "Choice", choices: AR5_STATUS, choiceDependsOn: "colCategory", showIf: { key: "colCategory", eq: "cash_bail" }, help: "AR-v Cash Bail: one bailor / accused set per case (AR-iii decision 19). Seized Monies and Restitution have a status per case line" },
      { key: "accusedName", name: "accused_name", label: "Accused Name", type: "String", showIf: { key: "colCategory", eq: "cash_bail" } },
      { key: "ar5Forfeit", name: "ar5_forfeit", label: "Forfeit", type: "True/False", showIf: { key: "colCategory", eq: "seized" }, help: "AR-v Seized Monies: checkbox after the case lines (AR-iii decision 19)" },
      { key: "ar5CourtOrder", name: "ar5_court_order", label: "Court order", type: "True/False", showIf: { key: "colCategory", in: ["seized", "restitution"] }, help: "AR-v Seized Monies and Restitution: checkbox after the case lines (AR-iii decision 19)" },
      { key: "ar5Invest", name: "ar5_to_be_invested", label: "Whether the seized monies are to be invested", type: "Choice", choices: YES_NO, radio: true, showIf: { key: "colCategory", eq: "seized" }, help: "Yes / No radio buttons (#9 §9.4), where applicable" },
      { key: "ar5Refund", name: "ar5_refund_required", label: "Refund required?", type: "Choice", choices: YES_NO, radio: true, showIf: { key: "colCategory", in: ["cash_bail", "seized"] }, help: "AR-v Cash Bail and Seized Monies (AR-iii decision 19). Yes shows: Please raise a AR10, with a link to the AR10 form" },
      { key: "requesterName", name: "requester_name", label: "Requester name", type: "String", help: "General information (all AR forms). Mandatory on the form; defaults to the signed-in user's name", default: "gs.getUser().getFullName()" },
      { key: "requesterEmail", name: "requester_email", label: "Email", type: "String", readonly: true, help: "General information (all AR forms). From ServiceNow SSO (sys_user.email); always read-only", default: "gs.getUser().getEmail()" },
      { key: "deptSubBu", name: "department_sub_bu", label: "Sub-BU", type: "Choice", choices: DEPT_SUB_BUS, choiceDependsOn: "department", help: "General information (all AR forms). Sub-BUs of the chosen department (mock list)" },
      { key: "ccList", name: "cc_list", label: "CC list", type: "String (1000)", wide: true, help: "General information (all AR forms). Emails separated by commas; these people can view the case on the portal (Watch list)" },
      { key: "department", name: "department", label: "Requesting department", type: "Choice", choices: DEPT_CHOICES, mandatory: true, tooltip: "Auto-populated from the requester's department. Change it only if you are requesting for another department.", default: "Requester's department (sys_user.department via the variable's default value)" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", help: "Mandatory unless New customer is ticked" },
      { key: "newCustomer", name: "new_customer", label: "New customer", type: "True/False" },
      { key: "newCustName", name: "new_customer_name", label: "New customer name", type: "String", wide: true, help: "Mandatory when New customer" },
      { key: "newCustUen", name: "new_customer_uen", label: "UEN (company registration no.)", type: "String" },
      { key: "newCustAddress", name: "new_customer_address", label: "Registered address", type: "String (1000)", wide: true },
      { key: "contractOption", name: "contract_option", label: "Contract", type: "Choice", choices: CONTRACT_OPTIONS, mandatory: true, help: "Billing is contract level: every billing line sits under a contract, or under the customer's no-contract shell (D15)" },
      // Link section (workspace only, D31): AR links the case to master data it has set up by hand. Saving sets customer / contract.
      { key: "linkCustomer", name: "link_customer", label: "Link Customer Reference", type: "Reference", ref: "customers", help: "AR-i, workspace Link section (D31). x_ar_customer, display value UEN (reference auto-complete shows UEN and name). Saving sets the case's customer. Mandatory before Closed complete" },
      { key: "linkContract", name: "link_contract", label: "Link Contract Reference", type: "Reference", ref: "contracts", help: "AR-i and AR-ix, workspace Link section (D31). x_ar_contract, display value Contract ID (CTR…). Reference qualifier: contracts of the linked customer (AR-i) or of the case's customer (AR-ix). Saving sets the case's contract (AR-i: also every billing line's contract). AR-i: mandatory before Closed complete" },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId", help: "Existing contract; otherwise set when AR saves Link Contract Reference (D31). Read-only in the workspace" },
      // New contract (AR-i, contract option = new). AR creates the contract by hand from these, then links it (D22, D31).
      { key: "newCtrType", name: "new_contract_type", label: "Contract type", type: "Choice", choices: CONTRACT_CATEGORIES, help: "Mandatory for a new contract" },
      { key: "newCtrNumber", name: "new_contract_number", label: "Contract number", type: "String", help: "Mandatory for a new contract" },
      { key: "newCtrRef", name: "new_contract_ref", label: "Contract reference number", type: "String", help: "AR-i, optional for a new contract. Not on AR-ix (AR-ix decision 25: the GIRO reference giro_reference is used instead)" },
      { key: "newCtrPo", name: "new_contract_po", label: "Contract PO number", type: "String", help: "Optional" },
      { key: "newCtrTitle", name: "new_contract_title", label: "Contract title", type: "String", wide: true, help: "Mandatory for a new contract" },
      { key: "newCtrStart", name: "new_contract_start", label: "Contract start date", type: "Date", help: "Mandatory for a new contract" },
      { key: "newCtrEnd", name: "new_contract_end", label: "Contract end date", type: "Date" },
      { key: "newCtrValue", name: "new_contract_value", label: "Contract value (SGD)", type: "Currency", help: "Mandatory for a new contract" },
      { key: "newCtrCycle", name: "new_contract_billing_cycle", label: "Contract billing cycle", type: "Choice", choices: BILLING_CYCLES, help: "Optional" },
      { key: "newCtrCycleOther", name: "new_contract_billing_cycle_other", label: "Suggested billing cycle", type: "String", showIf: { key: "newCtrCycle", eq: "others" }, help: "Mandatory when the billing cycle is Others" },
      { key: "newCtrInvDate", name: "new_contract_invoice_date", label: "Preferred invoice billing date", type: "Date", help: "Optional" },
      { key: "newCtrTerms", name: "new_contract_payment_terms", label: "Payment terms", type: "Choice", choices: PAYMENT_TERM_CHOICES, help: "Default 30 days" },
      { key: "newCtrTermsOther", name: "new_contract_payment_terms_other", label: "Other payment terms", type: "String", showIf: { key: "newCtrTerms", eq: "others" }, help: "Mandatory when payment terms is Others" },
      { key: "newCtrProrate", name: "new_contract_proration", label: "Proration", type: "Choice", choices: YES_NO, help: "Default No" },
      { key: "newCtrProFirst", name: "new_contract_proration_first", label: "Proration for 1st month", type: "Currency", showIf: { key: "newCtrProrate", eq: "yes" }, help: "Mandatory when proration is Yes" },
      { key: "newCtrProLast", name: "new_contract_proration_last", label: "Proration for last month", type: "Currency", showIf: { key: "newCtrProrate", eq: "yes" }, help: "Mandatory when proration is Yes" },
      { key: "billToName", name: "bill_to_name", label: "Bill-to person", type: "String", help: "Mandatory when the contract (or shell) has no bill-to person yet; AR copies it to the contract by hand (D16 as amended by D31)" },
      { key: "billToEmail", name: "bill_to_email", label: "Bill-to email", type: "String" },
      { key: "billToPhone", name: "bill_to_phone", label: "Bill-to phone", type: "String" },
      { key: "billToAddress", name: "bill_to_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "title", name: "short_description", label: "Invoice description", type: "String", mandatory: true, wide: true, help: "What the invoice is for; becomes the case's short description and the billing line's description" },
      { key: "attnName", name: "attention_name", label: "Attention to name", type: "String", help: "Optional. Prefilled from the contract's bill-to person" },
      { key: "attnEmail", name: "attention_email", label: "Attention to email", type: "String", help: "Optional; must be a valid email. Prefilled from the contract's bill-to email" },
      { key: "perPeriod", name: "amount_per_period", label: "Amount billed per period", type: "Currency", mandatory: true, help: "Before GST. Recurring contract: billed every period; ad-hoc or no contract: one invoice of this amount" },
      { key: "invoiceTiming", name: "preferred_invoice_date_choice", label: "Preferred invoice date", type: "Choice", choices: INVOICE_TIMING, help: "One-invoice requests only (ad-hoc contract, no contract, or contract type not on file); hidden and cleared for a recurring contract. Optional (AR-i decision 38)" },
      { key: "expediteReason", name: "preferred_invoice_date_justification", label: "Provide Justification for expedited or Off billing cycle request", type: "String (1000)", wide: true, showIf: { key: "invoiceTiming", eq: "expedited" }, help: "Shown when Expedited; optional" },
      { key: "needItems", name: "billing_line_items_required", label: "Require billing line item?", type: "Choice", choices: YES_NO, help: "Yes shows the billing line items table (multi-row variable set)" },
      { key: "amount", name: "amount", label: "Request value", type: "Currency", readonly: true, help: "AR-i: calculated, one-off lines + recurring amount × number of periods. Collections (AR-iii, AR-iv, AR-v): the amount to collect; BSU deposits are matched against it on Cash application (D29)" },
      { key: "poNumber", name: "po_number", label: "Customer PO number", type: "String", showIf: { key: "vag", eq: "yes" }, help: "AR-i Invoice details; shown only when V@G = Yes (Agency type SB) (AR-i decision 42)" },
      { key: "pocName", name: "customer_poc_name", label: "POC name", type: "String", help: "AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in; AR copies it to the customer by hand (D23 as amended by D31)" },
      { key: "pocEmail", name: "customer_poc_email", label: "POC email", type: "String", help: "AR-i customer details; must be a valid email. Same rule as POC name" },
      { key: "agencyType", name: "agency_type", label: "Agency type", type: "Choice", choices: AGENCY_TYPES, help: "AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master" },
      { key: "vag", name: "vag", label: "V@G", type: "Choice", choices: YES_NO, showIf: { key: "agencyType", eq: "SB" }, help: "AR-i customer details, optional; only for Agency type SB (AR-i decision 42). Found customer: read-only from the customer master" },
      { key: "subBu", name: "sub_bu", label: "V@G sub-BU", type: "String", showIf: { key: "vag", eq: "yes" }, help: "Optional, free text" },
      { key: "typeOfBilling", name: "type_of_billing", label: "Type of billing", type: "Choice", choices: BILLING_KINDS, help: "Contract level: entered for a new contract (AR copies it to the contract by hand, D31); read-only copy of the contract's value for an existing one" },
      { key: "docBulk", name: "bulk_supporting_docs", label: "Supporting documents (bulk upload)", type: "Attachment", multiple: true, showIf: { key: "typeOfBilling", in: ["C", "D", "E"] }, help: "Optional; several files at once" },
      { key: "giroOnContract", name: "giro_on_contract", label: "GIRO on this contract", type: "Choice", choices: YES_NO, readonly: true, help: "Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21)", tooltip: "GIRO is set by an AR-ix (GIRO authorisation). Raise an AR-ix if this contract needs GIRO." },
      // AR-ix GIRO authorisation (record producer variables; mandatory rules enforced on the form, see AR-ix module)
      // AR-ix decision 14: Type comes first and is limited by the contract. Decisions 17–21, 24 (enhancement set #8): the reference follows Purpose (Add) or Type (Remove);
      // Add GIRO asks the effective start date and the purpose details (decision 15 amended); Remove GIRO asks only the effective end date.
      { key: "giroType", name: "giro_type", label: "Type of request", type: "Choice", choices: GIRO_TYPES, help: "AR-ix. Mandatory. New contract or no contract: Add GIRO only. Existing contract: Add GIRO when GIRO is not active, Remove GIRO only when it is (catalog client script filters the choices)" },
      { key: "giroReference", name: "giro_reference", label: "Contract / tenancy agreement / reference", type: "String", wide: true, showIf: { key: "giroType", in: ["add", "remove"] }, hideIf: { key: "giroPurpose", eq: "carpark" }, help: "AR-ix, Add and Remove GIRO. Optional. Add GIRO: right after Purpose of GIRO/DDA request, hidden when Purpose = Carpark; Remove GIRO: after Type of request (UI policy; AR-ix decisions 19, 24; E8.9–E8.12)" },
      { key: "giroPurpose", name: "giro_purpose", label: "Purpose of GIRO/DDA request", type: "Choice", choices: GIRO_PURPOSES, showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO. Mandatory. Choices by contract (catalog client script, AR-ix decision 25): No contract required → Carpark, Others; existing or new contract → Rental, Others" },
      { key: "giroPurposeOther", name: "giro_purpose_other", label: "Other purpose", type: "String", wide: true, showIf: { key: "giroPurpose", eq: "others" }, help: "AR-ix. Mandatory when Purpose = Others" },
      { key: "applicantName", name: "giro_applicant_name", label: "Customer name", type: "String", showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6)" },
      { key: "applicantEmail", name: "giro_applicant_email", label: "Customer email", type: "String", showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO. Mandatory; prefilled from the contract's bill-to (label: AR-ix decision 20, E8.6)" },
      { key: "applicantMobile", name: "giro_applicant_mobile", label: "Customer mobile", type: "String", showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO. Prefilled from the contract's bill-to phone (label: AR-ix decision 20, E8.6)" },
      { key: "giroRemarks", name: "giro_remarks", label: "Remarks", type: "String (1000)", wide: true, showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO, all purposes. Optional" },
      { key: "giroLocation", name: "giro_location", label: "Location", type: "String", wide: true, showIf: { key: "giroPurpose", in: ["rental", "carpark"] }, help: "AR-ix Rental and Carpark. Mandatory (AR-ix decision 21, E8.15)" },
      { key: "giroStart", name: "giro_start_date", label: "Effective start date", type: "Date", showIf: { key: "giroType", eq: "add" }, help: "AR-ix Add GIRO, every purpose. Mandatory (AR-ix decision 18, E8.7)" },
      { key: "giroEnd", name: "giro_end_date", label: "Effective end date", type: "Date", showIf: { key: "giroType", eq: "remove" }, help: "AR-ix Remove GIRO. Mandatory; the only Remove GIRO detail (AR-ix decision 18, E8.8)" },
      { key: "carplate", name: "giro_carplate", label: "Car plate", type: "String", showIf: { key: "giroPurpose", eq: "carpark" }, help: "AR-ix carpark. Mandatory; one vehicle per form" },
      { key: "giroAmount", name: "giro_amount", label: "Amount", type: "String", showIf: { key: "giroPurpose", in: ["rental", "carpark"] }, help: "AR-ix Rental and Carpark. Optional free text; not used by any other field or calculation (AR-ix decisions 13, 21; E8.13, E8.15)" },
      { key: "docContract", name: "doc_contract_po", label: "Signed contract / PO", type: "Attachment", help: "Optional, offered for a new contract only" },
      { key: "docAcra", name: "doc_acra", label: "Company registration (ACRA / UEN)", type: "Attachment", help: "Only when not already on file" },
      { key: "docBillingForm", name: "doc_billing_form", label: "Billing contact & address form", type: "Attachment", help: "Only when not already on file for this department" },
      { key: "details", name: "description", label: "Additional details", type: "String (4000)", wide: true },
      { key: "assignmentGroup", name: "assignment_group", label: "Assignment group", type: "Reference", ref: "groups", help: "Platform sys_user_group. One group for now: Accounts Receivable, set on every new case (record producer script)" },
      { key: "assignedTo", name: "assigned_to", label: "Assigned to", type: "Reference", ref: "users", refFilter: "ar", help: "Reference qualifier: members of the assignment group" },
      { key: "opened", name: "opened_at", label: "Opened", type: "Date", readonly: true }
    ]
  },
  invoices: {
    table: `${SCOPE}_invoice`, label: "Invoice", plural: "Invoices", display: "number", prefix: "INV",
    note: "System of record for customer invoices. Created by the AR team from an AR request, then issued.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "INV-00000" },
      { key: "state", name: "state", label: "State", type: "Choice", choices: [["draft", "Draft"], ["issued", "Issued"], ["cancelled", "Cancelled"]], readonly: true },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId" },
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "lineId", name: "request_line", label: "Billing line", type: "Reference", ref: "lines", readonly: true },
      { key: "scheduleId", name: "billing_schedule", label: "Billing schedule", type: "Reference", ref: "schedules", readonly: true },
      { key: "periodDate", name: "billing_period", label: "Billing period", type: "Date", readonly: true },
      { key: "desc", name: "short_description", label: "Description", type: "String", wide: true, mandatory: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", mandatory: true },
      { key: "date", name: "invoice_date", label: "Invoice date", type: "Date" },
      { key: "approvalDate", name: "approval_date", label: "Approval date", type: "Date", help: "Set manually by the AR team (CCI decision 8)" },
      { key: "due", name: "due_date", label: "Due date", type: "Date", help: "Defaults to invoice date + contract payment terms" }
    ],
    calculated: [
      { name: "amount_due", label: "Amount due", type: "Currency", how: "amount − accepted allocations (business rule on allocation insert/update)" },
      { name: "payment_status", label: "Payment status", type: "Choice", how: "Unpaid / Part paid / Paid, set with amount_due" }
    ]
  },
  deposits: {
    table: `${SCOPE}_bank_statement`, label: "BSU deposit", plural: "BSU deposits", tableLabel: "Bank statements (BSU deposits)", display: "number", prefix: "DEP",
    note: "The only record of money received (D7): one row per deposit (credit) loaded by BSU from the daily CSV statement. There is no separate payments table. Matched to invoices manually; no auto-matching (D5).",
    fields: [
      { key: "number", name: "deposit_id", label: "Deposit ID", type: "String", readonly: true, auto: "<Prefix>-<DDMMYY>-<Suffix>", help: "Set by before-insert business rule (BSU decision 18): the payment mode's prefix, the deposit (value) date as DDMMYY and the payment mode's suffix. Not unique: deposits of one payment mode on one day share it. No matching payment mode: UNK-<DDMMYY>-XX" },
      { key: "bankAccountId", name: "bank_account", label: "Bank account", type: "Reference", ref: "bankAccounts", readonly: true },
      { key: "uploadId", name: "bsu", label: "Statement upload", type: "Reference", ref: "uploads", readonly: true },
      { key: "date", name: "value_date", label: "Value date", type: "Date", readonly: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", readonly: true },
      { key: "payer", name: "payer_name", label: "Payer (as on statement)", type: "String", readonly: true, wide: true },
      { key: "reference", name: "bank_reference", label: "Reference / remittance", type: "String", readonly: true, wide: true },
      { key: "bankRef", name: "bank_transaction_ref", label: "Bank transaction ref", type: "String", readonly: true },
      { key: "txnId", name: "transaction_id", label: "Transaction ID", type: "String", readonly: true, help: "From the bank's transaction-code column (BSU decisions 18–19); matched to a payment mode of the bank account" },
      { key: "paymentModeId", name: "payment_mode", label: "Payment mode", type: "Reference", ref: "paymentModes", readonly: true, help: "Payment mode equal to the statement line's transaction code (BSU decision 19); empty when none matched (fallback Deposit ID)" }
    ],
    calculated: [
      { name: "match_state", label: "Match state", type: "Choice", how: "Unmatched / Part matched / Matched, from accepted allocations" },
      { name: "unmatched_amount", label: "Unmatched amount", type: "Currency", how: "amount − accepted allocations" }
    ]
  },
  uploads: {
    table: "sc_req_item", label: "Statement upload", plural: "Statement uploads", display: "number", prefix: "RITM",
    note: "Bank statement upload (BSU) = one RITM per bank account per statement day (D32, BSU decision 12): catalog item 'Bank statement upload' submitted from the workspace BSU page (direct upload by AR); its variables hold the fields below, the CSV is the RITM's attachment, and a flow creates the related Bank statements records and closes the RITM.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "RITM0001000" },
      { key: "bankAccountId", name: "bank_account", label: "Bank account", type: "Reference", ref: "bankAccounts", readonly: true },
      { key: "statementDate", name: "statement_date", label: "Statement date", type: "Date", readonly: true },
      { key: "fileName", name: "file_name", label: "File", type: "String", readonly: true },
      { key: "uploadedBy", name: "uploaded_by", label: "Uploaded by", type: "Reference", ref: "users", readonly: true },
      { key: "uploadedAt", name: "uploaded_at", label: "Uploaded", type: "String", readonly: true },
      { key: "depositCount", name: "deposit_count", label: "Deposits", type: "Integer", readonly: true },
      { key: "depositTotal", name: "deposit_total", label: "Deposit total", type: "Currency", readonly: true },
      { key: "skippedCount", name: "withdrawals_skipped", label: "Withdrawals skipped", type: "Integer", readonly: true }
    ]
  },
  bankAccounts: {
    table: `${SCOPE}_bank_account`, label: "Bank account", plural: "Bank accounts", display: "number",
    note: "Company bank accounts that statements are uploaded for. Department and account type classify every deposit on the account.",
    fields: [
      { key: "bank", name: "bank", label: "Bank name", type: "Choice", choices: [["MB", "Marina Bank"], ["OB", "Orchard Bank"], ["US", "Union Straits Bank"]], mandatory: true, help: "BSU decision 17: shown apart from the bank account number. Mock aliases for Singapore's three largest banks; each has its own CSV layout" },
      { key: "number", name: "account_number", label: "Bank account number", type: "String", mandatory: true },
      { key: "name", name: "account_name", label: "Bank account name", type: "String", mandatory: true, help: "Describes the sub-account type under the department, so the department understands it (e.g. Project deposits, Retention and deposits) (BSU decision 17)" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: [["Finance", "Finance"], ...DEPT_CHOICES], mandatory: true },
      { key: "accountType", name: "account_type", label: "Account type", type: "Choice", choices: [["revenue", "Revenue account"], ["deposit", "Deposit account"], ["operating", "Operating account"]], mandatory: true },
      { key: "currency", name: "currency", label: "Currency", type: "String", readonly: true },
      { key: "colTypes", name: "collection_types", label: "Collection types", type: "List", choices: COLLECTION_TYPES, help: "Collections forms whose money arrives in this account (BSU decision 13). The invoice finder ranks open Collections cases of these types first; it never hides the others" },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields" }
    ]
  },
  paymentModes: {
    table: `${SCOPE}_payment_mode`, label: "Payment mode", plural: "Payment modes", display: "name",
    note: "Payment modes per bank account (BSU decisions 18–19), defined by AR. A statement line's transaction code equals the payment mode, whose prefix and suffix build the Deposit ID: <Prefix>-<DDMMYY>-<Suffix>.",
    fields: [
      { key: "bankAccountId", name: "bank_account", label: "Bank account", type: "Reference", ref: "bankAccounts", mandatory: true },
      { key: "name", name: "name", label: "Payment mode", type: "String", mandatory: true, help: "The code in the bank statement's transaction column for this payment mode, e.g. GIRO, FAST, CHQ, TT; a statement line matches it exactly, not case-sensitive (BSU decision 19)" },
      { key: "prefix", name: "prefix", label: "Prefix", type: "String", mandatory: true, help: "Start of the Deposit ID, e.g. AAA" },
      { key: "suffix", name: "suffix", label: "Suffix", type: "String", mandatory: true, help: "End of the Deposit ID" },
      // BSU decision 20: purpose to be checked with the client (BSU open question 11)
      { key: "accountCode", name: "account_code", label: "Account code", type: "Reference", ref: "accountCodes", tooltip: "To check: why is it needed?", help: "Optional. Active account codes (CCI decision 11). Purpose to be confirmed (BSU open question 11)" },
      { key: "costCentre", name: "cost_centre", label: "Cost centre", type: "Reference", ref: "costCentres", tooltip: "To check: why is it needed?", help: "Optional. Active cost centres (CCI decision 11). Purpose to be confirmed (BSU open question 11)" },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Inactive payment modes are not used for new uploads (CCI decision 12)" }
    ]
  },
  allocations: {
    table: `${SCOPE}_allocation`, label: "Allocation", plural: "Allocations", display: "number",
    note: "Applies part or all of a BSU deposit to an invoice, or to an open Collections case (AR-iii, AR-iv, AR-v; D29). Exactly one of invoice or request is set. Always created manually by the AR team from the invoice finder (no auto-matching, D5).",
    fields: [
      { key: "depositId", name: "deposit", label: "BSU deposit", type: "Reference", ref: "deposits", mandatory: true, qual: "BSU deposits with an unmatched amount" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices", qual: "issued invoices with amount due > 0" },
      { key: "requestId", name: "request", label: "Collection case", type: "Reference", ref: "requests", qual: "open Collections cases (ar_form = COL) with an amount still to match", help: "Set instead of Invoice when the deposit is matched to a Collections case (reference qualifier: ar_form = COL, the Collections form for AR-iii, AR-iv, AR-v; D29, D30)" },
      { key: "amount", name: "amount", label: "Allocation value", type: "Currency", how: "BSU decision 22: the part of the deposit that goes to this invoice or Collections case; unique to the allocation (the deposit and invoice / case amounts never change). Defaults on insert to the smaller of the deposit's unmatched amount and the target's amount due (BSU decision 21)" },
      { key: "status", name: "state", label: "State", type: "Choice", choices: [["accepted", "Applied"], ["removed", "Removed"]] },
      { key: "exception", name: "exception", label: "Exception", type: "Choice", choices: [["none", "Exact"], ["multi_invoice", "Multi-invoice"], ["short_pay", "Short pay"], ["over_pay", "Overpayment"], ["partial", "Partial"], ["discount", "Discount taken"]] },
      { key: "reason", name: "reason", label: "Reason", type: "String (1000)" }
    ]
  },
  lines: {
    table: `${SCOPE}_request_line`, label: "Billing line", plural: "Billing lines", display: "number", prefix: "RQL",
    note: "What to bill on an AR request (D13): one-off, or recurring over a from–to date range. Portal: multi-row variable set on AR-i.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "RQL0001000" },
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", readonly: true, help: "Billing lines are contract level (D15). Existing contract at submit; otherwise set when AR saves Link Contract Reference on the case (D31)" },
      { key: "lineType", name: "line_type", label: "Line type", type: "Choice", choices: LINE_TYPES, mandatory: true },
      { key: "desc", name: "short_description", label: "Description", type: "String", mandatory: true, wide: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", mandatory: true, help: "Recurring: amount per period" },
      { key: "invoiceDate", name: "preferred_invoice_date", label: "Preferred invoice date", type: "Date", help: "One-off only" },
      { key: "frequency", name: "frequency", label: "Frequency", type: "Choice", choices: FREQUENCIES.map(f => [f[0], f[1]]), help: "Recurring only; Monthly by default (decision 10)" },
      { key: "startDate", name: "start_date", label: "From", type: "Date", help: "Recurring only: first billing date" },
      { key: "endDate", name: "end_date", label: "To", type: "Date", help: "Recurring only: last billing date" },
      { key: "remarks", name: "remarks", label: "Remarks", type: "String", wide: true, help: "Recurring only, optional" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices", readonly: true },
      { key: "scheduleId", name: "billing_schedule", label: "Billing schedule", type: "Reference", ref: "schedules", readonly: true }
    ],
    calculated: [{ name: "periods", label: "Number of invoices", type: "Integer", how: "recurring: periods between start and end at the frequency" },
      { name: "line_value", label: "Line value", type: "Currency", how: "one-off: amount; recurring: amount × periods, or when prorated: first month amount + amount × (periods − 2) + last month amount" }]
  },
  items: {
    table: `${SCOPE}_request_item`, label: "Billing line item", plural: "Billing line items", display: "seq",
    note: "Breakdown of an AR request's invoice (AR-i decision 32). Portal: multi-row variable set on AR-i, shown when 'Require billing line item?' is Yes. GST and total are calculated (GST_RATE).",
    fields: [
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "seq", name: "item_number", label: "Item number", type: "Integer", readonly: true, help: "System number 1, 2, 3… in row order within the AR request; set by the producer script, never typed (AR-i decision 37)" },
      { key: "amount", name: "amount_excl_gst", label: "Amount (w/o GST)", type: "Currency", mandatory: true },
      { key: "gst", name: "gst_amount", label: "GST amount", type: "Currency", readonly: true, help: "Calculated: amount × GST rate (9%), rounded to the cent" },
      { key: "total", name: "total_amount", label: "Total amount", type: "Currency", readonly: true, help: "Calculated: amount + GST" },
      { key: "lpiRate", name: "late_payment_interest", label: "Late payment interest (%)", type: "Decimal", help: "Rate % (to be confirmed with the users)" },
      { key: "accountCode", name: "account_code", label: "Account code", type: "String" },
      { key: "costCenter", name: "cost_center", label: "Cost center", type: "String", help: "Optional, free text. To be filled by GA (AR-i decision 42: moved from the request to each item, right of Account code)", tooltip: "To be filled by GA" }
    ]
  },
  contacts: {
    table: `${SCOPE}_billing_contact`, label: "Billing contact", plural: "Billing contacts", display: "name",
    note: "The department's usual bill-to person at a customer (D11): unique per customer + department. Used to prefill the bill-to on a new contract or shell; the bill-to used for invoicing is on the contract (D16).",
    fields: [
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "requestor", name: "requestor", label: "Requestor", type: "Reference", ref: "users", refFilter: "project", help: "Project-team user who gave this contact (#10 E10.1, CCI decision 15)" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "name", name: "contact_name", label: "Bill-to person", type: "String", mandatory: true },
      { key: "email", name: "email", label: "Email", type: "String", mandatory: true },
      { key: "phone", name: "phone", label: "Phone", type: "String" },
      { key: "address", name: "billing_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields" }
    ]
  },
  documents: {
    table: `${SCOPE}_customer_document`, label: "Customer document", plural: "Customer documents", display: "number", prefix: "DOC",
    note: "Documents supplied once per customer (D10). The file itself is a sys_attachment on this record.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "DOC0001000" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", readonly: true },
      { key: "requestor", name: "requestor", label: "Requestor", type: "Reference", ref: "users", refFilter: "project", help: "Project-team user who gave this document (#10 E10.2, CCI decision 15)" },
      { key: "docType", name: "document_type", label: "Document type", type: "Choice", choices: DOC_TYPES, readonly: true },
      { key: "fileName", name: "file_name", label: "File", type: "String", readonly: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", readonly: true, help: "For signed contract / PO" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, readonly: true, help: "For billing contact & address forms" },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "received", name: "received_on", label: "Received", type: "Date", readonly: true }
    ]
  },
  colTx: {
    table: `${SCOPE}_collection_tx`, label: "Collection", plural: "Total number of collections for the day", display: "seq",
    note: "AR3 rows of a Collections case (#9 §7): multi-row variable set on the Collections form, copied to this table by the producer script. 1 to 99 rows; duplicate collection types allowed (owner). The Transaction Amount total is the case's Total Amount (amount), used for BSU matching (AR-iii decision 19).",
    fields: [
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "seq", name: "row_number", label: "Row", type: "Integer", readonly: true },
      { key: "collectionType", name: "collection_type", label: "Collection Type", type: "Choice", choices: AR3_TYPES, mandatory: true },
      { key: "amount", name: "transaction_amount", label: "Transaction Amount", type: "Currency", mandatory: true, help: "Positive, at most two decimals (AR-iii decision 19: replaces Number of Transactions). The rows' total is the case's Total Amount" }
    ]
  },
  ar5Lines: {
    table: `${SCOPE}_collection_case_line`, label: "Case line", plural: "Case lines", display: "caseNumber",
    note: "AR5 Seized Monies and Restitution lines of a Collections case (AR-iii decision 19): multi-row variable set, copied to this table by the producer script. 0 to 99 rows (no AR5 field mandatory yet, decision 14). The Amount total is the case's Total Amount (amount). Checkboxes Forfeit / Court order and Refund required? sit on the case, after the lines.",
    fields: [
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "seq", name: "row_number", label: "Row", type: "Integer", readonly: true },
      { key: "caseNumber", name: "case_number", label: "Case Number", type: "String" },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", help: "Positive, at most two decimals" },
      { key: "caseStatus", name: "case_status", label: "Case Status", type: "Choice", choices: AR5_STATUS, choiceDependsOn: "colCategory", help: "Choices depend on the case's category: Seized Monies Case Pending / Case Closed; Restitution to be confirmed (AR-iii open question 12)" }
    ]
  },
  colAlloc: {
    table: `${SCOPE}_collection_allocation`, label: "Allocation", plural: "Amount for Each Account Code", display: "seq",
    note: "AR4 rows of a Collections case (#9 §8): 1 to 10 rows; the allocation total becomes the case's Total Amount (amount). Stores the cost centre and account code records (sys_id), not only their labels.",
    fields: [
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "seq", name: "row_number", label: "Row", type: "Integer", readonly: true },
      { key: "desc", name: "description", label: "Description", type: "String", mandatory: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", mandatory: true, help: "Positive, at most two decimals" },
      { key: "costCentre", name: "cost_centre", label: "Cost Centre", type: "Reference", ref: "costCentres", mandatory: true, help: "Reference qualifier: active cost centres of the Requesting Department (the case's department; the separate Requesting Department Cost Centre field is removed, AR-iii decision 19)" },
      { key: "accountCode", name: "account_code", label: "Account Code", type: "Reference", ref: "accountCodes", mandatory: true, help: "Reference qualifier: active account codes. GST / recovery rule check to be approved (AR-iii open question 11)" }
    ]
  },
  costCentres: {
    table: `${SCOPE}_cost_centre`, label: "Cost centre", plural: "Cost centres", display: "code",
    note: "Master data (CCI decision 11, #9 §8): cost centres per requesting department; only active ones are offered. Fictional sample values.",
    fields: [
      { key: "code", name: "code", label: "Code", type: "String", mandatory: true },
      { key: "name", name: "name", label: "Name", type: "String", mandatory: true, wide: true },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Inactive records are not offered in forms (CCI decision 12)" }
    ]
  },
  accountCodes: {
    table: `${SCOPE}_account_code`, label: "Account code", plural: "Account codes", display: "code",
    note: "Master data (CCI decision 11, #9 §8): account codes for AR4 allocations with their GST / recovery treatment; only active ones are offered. Fictional sample values.",
    fields: [
      { key: "code", name: "code", label: "Code", type: "String", mandatory: true },
      { key: "name", name: "description", label: "Description", type: "String", mandatory: true, wide: true },
      { key: "treatment", name: "gst_treatment", label: "GST / recovery treatment", type: "Choice", choices: [["gst", "GST applicable"], ["no_gst", "No GST"], ["recovery", "Recovery"]] },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Inactive records are not offered in forms (CCI decision 12)" }
    ]
  },
  schedules: {
    table: `${SCOPE}_billing_schedule`, label: "Billing schedule", plural: "Billing schedules", display: "number", prefix: "SCH",
    note: "Recurring billing from the 2nd invoice onwards (CCI decision 8): AR creates the schedule by hand on the contract and picks the AR-i case; D12 amended, D13. Under a contract: from–to date range and frequency. A daily scheduled job creates each period's draft invoice 5 working days before its invoice date; AR issues it.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "SCH0001000" },
      // CCI 2026-11-16: a billing schedule sits under a contract (Contract or No contract); the customer follows the contract
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", mandatory: true },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", readonly: true, help: "From the contract" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "desc", name: "short_description", label: "What is billed", type: "String", mandatory: true, wide: true },
      { key: "frequency", name: "frequency", label: "Frequency", type: "Choice", choices: FREQUENCIES.map(f => [f[0], f[1]]), mandatory: true },
      { key: "amount", name: "amount", label: "Amount per period", type: "Currency", mandatory: true },
      { key: "firstDate", name: "first_billing_date", label: "First billing date", type: "Date", mandatory: true },
      { key: "lastDate", name: "last_billing_date", label: "Last billing date", type: "Date", mandatory: true },
      { key: "firstAmount", name: "first_period_amount", label: "First period amount (prorated)", type: "Currency", help: "Empty = amount per period" },
      { key: "lastAmount", name: "last_period_amount", label: "Last period amount (prorated)", type: "Currency", help: "Empty = amount per period" },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", help: "AR picks the recurring AR-i case (reference qualifier: AR-i cases with a recurring line on this contract). Invoices from this schedule are linked to that case (CCI decision 8)" },
      { key: "lineId", name: "source_line", label: "From billing line", type: "Reference", ref: "lines", readonly: true, help: "Set from the AR request's recurring line" }
    ],
    calculated: [{ name: "next_billing_date", label: "Next billing date", type: "Date", how: "first period on or after today without an invoice" }]
  },
  companies: {
    table: "core_company", label: "Company", plural: "Companies", display: "name", platform: true,
    note: "**Existing platform table, not created by the app** (D26). The app only references it: `x_ar_customer.company` points here and the customer name is dot-walked from `company.name`. The app does not create or edit companies (open question MDM-5).",
    fields: [
      { key: "name", name: "name", label: "Name", type: "String", mandatory: true, wide: true }
    ]
  },
  customers: {
    table: `${SCOPE}_customer`, label: "Customer", plural: "Customers", display: "name",
    note: "Custom customer master (not CSM customer_account). Each customer references one core_company record; the customer name is **dot-walked** from `company.name` and not stored on this table (D26). Make `company` the table's display field so references to a customer show the company name. UEN, address and the other details stay on this table. Documents and per-department billing contacts hang off the customer (D10, D11).",
    fields: [
      { key: "companyId", name: "company", label: "Company", type: "Reference", ref: "companies", mandatory: true, wide: true, help: "The core_company record for this customer. One customer per company. Display field of the table" },
      { key: "name", name: "company.name", label: "Customer name", type: "String", readonly: true, wide: true, help: "Dot-walked from company.name (core_company); not a column on this table (D26)" },
      { key: "uen", name: "uen", label: "UEN (company registration no.)", type: "String" },
      { key: "parent", name: "parent_group", label: "Parent group", type: "String" },
      { key: "address", name: "registered_address", label: "Registered address", type: "String (1000)", wide: true },
      { key: "agencyType", name: "agency_type", label: "Agency type", type: "Choice", choices: AGENCY_TYPES, help: "Master data; AR copies it by hand from the AR-i that set the customer up (D23 as amended by D31)" },
      { key: "vag", name: "vag", label: "V@G", type: "Choice", choices: YES_NO, showIf: { key: "agencyType", eq: "SB" }, help: "Only for Agency type SB (AR-i decision 42)" },
      { key: "vagSubBu", name: "vag_sub_bu", label: "V@G sub-BU", type: "String", showIf: { key: "vag", eq: "yes" } },
      { key: "pocName", name: "poc_name", label: "POC name", type: "String" },
      { key: "pocEmail", name: "poc_email", label: "POC email", type: "String" },
      { key: "aliases", name: "bank_names", label: "Names seen on bank statements", type: "String (1000)", wide: true, help: "Comma-separated. Used to rank invoices in the invoice finder." },
      { key: "notes", name: "notes", label: "Notes for AR", type: "String (4000)", wide: true },
      { key: "active", name: "active", label: "Active", type: "True/False", default: true, help: "Master data never gets deleted (CCI decision 12): inactive records stay for history and are not offered in forms or reference fields" }
    ]
  },
  contracts: {
    table: `${SCOPE}_contract`, label: "Contract", plural: "Contracts", display: "number",
    note: "Custom contract table (not ast_contract). Every record has a system Contract ID (CTR…); Contract category Contract or No contract (D15 amended). GIRO is a contract status that AR updates manually from the AR-ix case (D21, AR-ix decision 11). Middle of the billing hierarchy customer › contract › billing lines › invoices (D15). Holds the bill-to person (D16) and billing terms. A no-contract shell (contract_type = shell, one per customer + department) holds billing that has no contract.",
    fields: [
      { key: "ctrId", name: "contract_id", label: "Contract ID", type: "String", readonly: true, auto: "CTR0001001", help: "System contract ID, auto-numbered for every record, Contract or No contract (CCI, 2026-11-16)" },
      { key: "contractType", name: "contract_type", label: "Contract category", type: "Choice", choices: CONTRACT_TYPES, mandatory: true, help: "Contract or No contract (D15 amended 2026-11-16: a customer can have several No contract records)" },
      { key: "number", name: "number", label: "Contract number", type: "String", help: "The customer's contract number. Mandatory when Contract category = Contract" },
      { key: "category", name: "contract_category", label: "Contract type", type: "Choice", choices: CONTRACT_CATEGORIES, help: "Recurring or Ad-hoc" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, help: "Owning department" },
      { key: "owners", name: "contract_owners", label: "Contract owner", type: "List", ref: "users", refFilter: "project", help: "Project team users who can pick this contract on an AR-ix even when it belongs to another department (List of sys_user, several owners; CCI decision 10, E8.5)" },
      { key: "reference", name: "reference_number", label: "Contract reference number", type: "String" },
      { key: "poNumber", name: "po_number", label: "Contract PO number", type: "String" },
      { key: "title", name: "short_description", label: "Contract title", type: "String", mandatory: true, wide: true },
      { key: "billing", name: "billing_type", label: "Billing", type: "Choice", choices: ["Monthly", "Milestone", "Annual", "Time & materials", "Per PO"].map(x => [x, x]) },
      { key: "value", name: "contract_value", label: "Contract value (SGD)", type: "Currency" },
      { key: "start", name: "start_date", label: "Contract start date", type: "Date" },
      { key: "end", name: "end_date", label: "Contract end date", type: "Date" },
      { key: "terms", name: "payment_terms", label: "Payment terms (days)", type: "Integer" },
      { key: "lpiApplicable", name: "lpi_applicable", label: "LPI applicable", type: "True/False", help: "Late payment interest is charged on overdue invoices under this contract" },
      { key: "lpiMinRate", name: "lpi_min_rate", label: "Minimum LPI rate (%)", type: "Decimal", help: "Mandatory when LPI applicable. % per annum; must not exceed the LPI rate" },
      { key: "lpiRate", name: "lpi_rate", label: "LPI rate (%)", type: "Decimal", help: "Mandatory when LPI applicable. % per annum" },
      { key: "billingCycle", name: "billing_cycle", label: "Contract billing cycle", type: "Choice", choices: BILLING_CYCLES },
      { key: "billingCycleOther", name: "billing_cycle_other", label: "Suggested billing cycle", type: "String", showIf: { key: "billingCycle", eq: "others" } },
      { key: "invoiceDate", name: "preferred_invoice_date", label: "Preferred invoice billing date", type: "Date" },
      { key: "paymentTerms", name: "payment_terms_choice", label: "Payment terms", type: "Choice", choices: PAYMENT_TERM_CHOICES, help: "30 days sets terms (days) = 30" },
      { key: "paymentTermsOther", name: "payment_terms_other", label: "Other payment terms", type: "String", showIf: { key: "paymentTerms", eq: "others" } },
      { key: "prorate", name: "proration", label: "Proration", type: "Choice", choices: YES_NO, help: "Yes: the first and last period of each recurring billing schedule use the proration amounts" },
      { key: "prorateFirst", name: "proration_first", label: "Proration for 1st month", type: "Currency", showIf: { key: "prorate", eq: "yes" } },
      { key: "prorateLast", name: "proration_last", label: "Proration for last month", type: "Currency", showIf: { key: "prorate", eq: "yes" } },
      { key: "typeOfBilling", name: "type_of_billing", label: "Type of billing", type: "Choice", choices: BILLING_KINDS },
      { key: "bulkDocs", name: "bulk_supporting_docs", label: "Supporting documents (bulk upload)", type: "Attachment", multiple: true, showIf: { key: "typeOfBilling", in: ["C", "D", "E"] } },
      { key: "giroStatus", name: "giro_status", label: "GIRO status", type: "Choice", choices: GIRO_STATUS, help: "Updated by AR on the contract from the AR-ix case (manual, AR-ix decision 11). At most one active GIRO per contract (D21)" },
      { key: "giroCaseId", name: "giro_case", label: "Active GIRO case", type: "Reference", ref: "requests", help: "AR links the AR-ix case whose GIRO is active (reference qualifier: ar_form = AR-ix, giro_type = Add GIRO and contract = this contract). Mandatory when GIRO status is Active; cleared when Not active" },
      { key: "billToName", name: "bill_to_name", label: "Bill-to person", type: "String" },
      { key: "billToEmail", name: "bill_to_email", label: "Bill-to email", type: "String" },
      { key: "billToPhone", name: "bill_to_phone", label: "Bill-to phone", type: "String" },
      { key: "billToAddress", name: "bill_to_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "notes", name: "notes", label: "Notes", type: "String (4000)", wide: true }
    ]
  }
};

/** Mock bank CSV layouts (BSU). Column names as they appear in each bank's export header. */
export const BANKS = {
  MB: { name: "Marina Bank", short: "Marina", dateFmt: "D MMM YYYY",
    header: ["Transaction Date", "Value Date", "Transaction Code", "Transaction Description 1", "Transaction Description 2", "Debit Amount", "Credit Amount", "Client Reference"],
    cols: { date: "Transaction Date", txn: "Transaction Code", payer: "Transaction Description 1", reference: "Transaction Description 2", debit: "Debit Amount", credit: "Credit Amount", bankRef: "Client Reference" } },
  OB: { name: "Orchard Bank", short: "Orchard", dateFmt: "DD/MM/YYYY",
    header: ["Transaction date", "Value date", "Txn Type", "Description", "Remarks", "Withdrawals (SGD)", "Deposits (SGD)"],
    cols: { date: "Transaction date", txn: "Txn Type", payer: "Description", reference: "Remarks", debit: "Withdrawals (SGD)", credit: "Deposits (SGD)", bankRef: null } },
  US: { name: "Union Straits Bank", short: "Union Straits", dateFmt: "YYYY-MM-DD",
    header: ["Date", "Transaction ID", "Description", "Reference", "Deposit", "Withdrawal", "Ledger Balance"],
    cols: { date: "Date", txn: "Transaction ID", payer: "Description", reference: "Reference", debit: "Withdrawal", credit: "Deposit", bankRef: null } }
};

export const fieldOf = (tableKey, key) => TABLES[tableKey].fields.find(f => f.key === key);

/** UI policy: a field with showIf is visible only when its parent field is visible and equals the value. */
export function fieldVisible(tableKey, f, vals) {
  if (!f?.showIf) return true;
  const p = fieldOf(tableKey, f.showIf.key), v = vals[f.showIf.key];
  if (f.hideIf && vals[f.hideIf.key] === f.hideIf.eq) return false;   // UI policy that hides the field for one value (e.g. AR-ix reference on Carpark)
  return fieldVisible(tableKey, p, vals) && (f.showIf.in ? f.showIf.in.includes(v) : v === f.showIf.eq);
}
/** Blank the values of fields hidden by a UI policy (run when a parent changes and before saving). Returns the keys cleared. */
export function clearHidden(tableKey, vals) {
  const out = [];
  for (const f of TABLES[tableKey].fields) if (f.showIf && !fieldVisible(tableKey, f, vals) && vals[f.key]) { vals[f.key] = ""; out.push(f.key); }
  return out;
}
/** "Shown when Agency type = SB" text for docs. */
export function showIfText(tableKey, f) {
  if (!f.showIf) return "";
  const p = fieldOf(tableKey, f.showIf.key), lab = x => x === true ? "Yes" : (p.choices?.find(c => c[0] === x) || [, x])[1];
  const t = f.showIf.in ? `Shown when ${p.label} is ${f.showIf.in.map(lab).join(", ")}` : `Shown when ${p.label} = ${lab(f.showIf.eq)}`;
  if (!f.hideIf) return t;
  const h = fieldOf(tableKey, f.hideIf.key);
  return `${t}; hidden when ${h.label} = ${(h.choices?.find(c => c[0] === f.hideIf.eq) || [, f.hideIf.eq])[1]}`;
}

/** Build-note text for a field, e.g. "x_ar_invoice.due_date · Date". */
export function fieldNote(tableKey, key) {
  const t = TABLES[tableKey], f = fieldOf(tableKey, key);
  if (!f) return t.table;
  const ref = f.ref ? ` → ${f.ref === "users" ? "sys_user" : f.ref === "groups" ? "sys_user_group" : TABLES[f.ref].table}` : "";
  return `${t.table}.${f.name} · ${f.type}${ref}${f.mandatory ? " · mandatory" : ""}`;
}

/** Record producer for the portal AR form: variables map onto x_ar_request fields. */
/** Variable set "General information", shared by every AR form (D19). */
export const GENERAL_INFO = ["requesterName", "requesterEmail", "department", "deptSubBu", "ccList"];
export const RECORD_PRODUCER = {
  name: "AR-i New AR request",
  table: "requests",
  variables: [...GENERAL_INFO, "customerId", "newCustomer", "newCustName", "newCustUen", "newCustAddress",
    "contractOption", "contractId", "newCtrType", "newCtrNumber", "newCtrRef", "newCtrPo", "newCtrTitle", "newCtrStart", "newCtrEnd", "newCtrValue", "newCtrCycle", "newCtrCycleOther",
    "newCtrInvDate", "newCtrTerms", "newCtrTermsOther", "newCtrProrate", "newCtrProFirst", "newCtrProLast",
    "billToName", "billToEmail", "billToPhone", "billToAddress", "title", "attnName", "attnEmail", "perPeriod", "invoiceTiming", "expediteReason", "needItems", "poNumber",
    "pocName", "pocEmail", "agencyType", "vag", "subBu", "typeOfBilling", "docBulk", "giroOnContract", "docContract", "docAcra", "docBillingForm", "details"],
  lineSet: "items",
  script: "current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; creates one x_ar_request_line from the invoice details (recurring when the contract type is Recurring, else one-off, D13 as amended); copies the billing line items multi-row variable set to x_ar_request_item"
};
/** AR-ix GIRO authorisation (AR-ix module): same case table, its own variables. */
export const RECORD_PRODUCER_ARIX = {
  name: "AR-ix GIRO authorisation",
  table: "requests",
  variables: [...GENERAL_INFO, "customerId", "contractOption", "contractId", "giroType", "giroReference", "giroPurpose", "giroPurposeOther",
    "applicantName", "applicantEmail", "applicantMobile", "giroRemarks", "giroStart", "giroEnd", "carplate", "giroLocation", "giroAmount"],
  script: "current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>; contract_option = none → current.contract = the customer's no-contract shell for the department, if it exists;"
};
/** Collections form (AR-iii module, D30): one record producer for AR-iii, AR-iv and AR-v. Shell: fields to be defined. */
export const RECORD_PRODUCER_COL = {
  name: "Collections (AR-iii, AR-iv, AR-v)",
  table: "requests",
  variables: [...GENERAL_INFO, "colType", "colDate", "colRef", "colCategory", "ar5Date", "ar5Receipt", "bailAmount", "bailorName", "ibCase",
    "caseStatus", "accusedName", "ar5Forfeit", "ar5CourtOrder", "ar5Invest", "ar5Refund"],
  rowSets: ["colTx", "colAlloc", "ar5Lines"],
  script: "current.opened_by = gs.getUserID(); current.ar_form = 'COL'; current.collection_type = producer.collection_type; current.short_description = 'Collections – ' + collection_type; current.submission_origin = 'manual'; copies the multi-row sets to x_ar_collection_tx (AR3) / x_ar_collection_allocation (AR4); amount = AR4 allocation total or the AR5 amount (AR3: open question); current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>. Catalogue: three items (AR-iii, AR-iv, AR-v) open this producer with collection_type preset (URL parameter / default value)."
};
export const RECORD_PRODUCERS = [RECORD_PRODUCER, RECORD_PRODUCER_ARIX, RECORD_PRODUCER_COL];
