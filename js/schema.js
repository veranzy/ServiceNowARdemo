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

const STATE_REQ = [["new", "New"], ["in_progress", "In progress"], ["awaiting_info", "Awaiting info"], ["invoiced", "Billed"], ["completed", "Completed"], ["rejected", "Rejected"]];

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
export const AR_FORMS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi"].map((r, n) => ({
  code: `AR-${r}`, name: n === 0 ? "New AR request" : n === 8 ? "GIRO authorisation" : "To be defined",
  desc: n === 0 ? "Bill a customer: one-off and recurring lines, new or existing customer. Customer documents are given once."
    : n === 8 ? "Add or remove GIRO (direct debit) on a contract: rental, carpark or other charges." : "Form not yet specified.",
  active: n === 0 || n === 8
}));
export const GIRO_PURPOSES = [["rental", "Rental"], ["carpark", "Carpark"], ["others", "Others"]];
export const GIRO_TYPES = [["add", "Add GIRO"], ["remove", "Remove GIRO"]];
const GIRO_STATUS = [["active", "Active"], ["none", "Not active"]];

export const LINE_TYPES = [["one_off", "One-off"], ["recurring", "Recurring"]];
export const FREQUENCIES = [["monthly", "Monthly", 1], ["quarterly", "Quarterly", 3], ["half_yearly", "Half-yearly", 6], ["annually", "Annually", 12]];
export const DOC_TYPES = [["contract", "Signed contract / PO"], ["acra", "Company registration (ACRA / UEN)"], ["billing_form", "Billing contact & address form"]];
export const CONTRACT_OPTIONS = [["existing", "Existing contract"], ["new", "New contract"], ["none", "No contract required"]];
export const CONTRACT_TYPES = [["contract", "Contract"], ["shell", "No-contract shell"]];
export const AGENCY_TYPES = [["M", "M"], ["SB", "SB"], ["PV", "PV"]];
const YES_NO = [["yes", "Yes"], ["no", "No"]];
const BILLING_KINDS = ["A", "B", "C", "D", "E"].map(x => [x, x]);
export const CONTRACT_CATEGORIES = [["recurring", "Recurring"], ["ad_hoc", "Ad-hoc"]];
export const BILLING_CYCLES = [["first", "1st of the month"], ["fifteenth", "15th of the month"], ["others", "Others"]];
/** GST rate (%) for billing line items (ARF decision 33). Build: a system property, e.g. x_ar.gst_rate. */
export const GST_RATE = 9;
export const PAYMENT_TERM_CHOICES = [["30", "30 days"], ["others", "Others"]];
const CONTRACT_LOCATIONS = [["attached", "Attached to this form"], ["on_file", "Already with AR"], ["repository", "Document repository link"], ["physical", "Physical file"]];

export const TABLES = {
  requests: {
    table: `${SCOPE}_request`, label: "AR request", plural: "AR requests", extends: "task", display: "number", prefix: "ARQ",
    note: "Case raised by the project team through an AR form record producer (AR-i … AR-xvi). Extends Task for assignment, SLAs and the activity stream.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "ARQ0001000" },
      { key: "state", name: "state", label: "State", type: "Choice", choices: STATE_REQ, readonly: true },
      { key: "requestedBy", name: "opened_by", label: "Requested by", type: "Reference", ref: "users", readonly: true },
      { key: "form", name: "ar_form", label: "AR form", type: "Choice", choices: AR_FORMS.map(f => [f.code, `${f.code} ${f.name}`]), readonly: true },
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
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId", help: "Existing contract; for a new contract or No contract required, set by Link to customer" },
      // New contract (AR-i, contract option = new). Link to customer creates the contract from these (D22: AR changes master data).
      { key: "newCtrType", name: "new_contract_type", label: "Contract type", type: "Choice", choices: CONTRACT_CATEGORIES, help: "Mandatory for a new contract" },
      { key: "newCtrNumber", name: "new_contract_number", label: "Contract number", type: "String", help: "Mandatory for a new contract" },
      { key: "newCtrRef", name: "new_contract_ref", label: "Contract reference number", type: "String", help: "Optional for a new contract (AR-ix: the reference to link)" },
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
      { key: "billToName", name: "bill_to_name", label: "Bill-to person", type: "String", help: "Mandatory when the contract (or shell) has no bill-to person yet; Link to customer writes it to the contract" },
      { key: "billToEmail", name: "bill_to_email", label: "Bill-to email", type: "String" },
      { key: "billToPhone", name: "bill_to_phone", label: "Bill-to phone", type: "String" },
      { key: "billToAddress", name: "bill_to_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "contractLocation", name: "contract_location", label: "Where is the signed contract kept?", type: "Choice", choices: CONTRACT_LOCATIONS, help: "Mandatory for a new contract, or an existing one with no location recorded" },
      { key: "contractLocationRef", name: "contract_location_ref", label: "Link or file location", type: "String", wide: true, help: "Mandatory for repository link or physical file" },
      { key: "title", name: "short_description", label: "Invoice description", type: "String", mandatory: true, wide: true, help: "What the invoice is for; becomes the case's short description and the billing line's description" },
      { key: "attnName", name: "attention_name", label: "Attention to name", type: "String", help: "Optional. Prefilled from the contract's bill-to person" },
      { key: "attnEmail", name: "attention_email", label: "Attention to email", type: "String", help: "Optional; must be a valid email. Prefilled from the contract's bill-to email" },
      { key: "perPeriod", name: "amount_per_period", label: "Amount billed per period", type: "Currency", mandatory: true, help: "Before GST. Recurring contract: billed every period; ad-hoc or no contract: one invoice of this amount" },
      { key: "prefInvDate", name: "preferred_invoice_date", label: "Preferred invoice date", type: "Date", help: "Recurring contract: mandatory, the first invoice; invoices then follow monthly until the contract end date" },
      { key: "needItems", name: "billing_line_items_required", label: "Require billing line item?", type: "Choice", choices: YES_NO, help: "Yes shows the billing line items table (multi-row variable set)" },
      { key: "amount", name: "amount", label: "Request value", type: "Currency", readonly: true, help: "Calculated: one-off lines + recurring amount × number of periods" },
      { key: "poNumber", name: "po_number", label: "Customer PO number", type: "String" },
      { key: "pocName", name: "customer_poc_name", label: "POC name", type: "String", help: "AR-i customer details. Found customer: read-only copy of the customer master; new customer: typed in and replicated to the customer by Link to customer" },
      { key: "pocEmail", name: "customer_poc_email", label: "POC email", type: "String", help: "AR-i customer details; must be a valid email. Same rule as POC name" },
      { key: "costCenter", name: "cost_center", label: "Cost center", type: "String", help: "Optional, free text. To be filled by GA", tooltip: "To be filled by GA" },
      { key: "accountCode", name: "account_code", label: "Account code", type: "String", help: "Optional, free text" },
      { key: "agentName", name: "agent_name", label: "Name of agent to be billed", type: "String", help: "Optional, free text" },
      { key: "agencyType", name: "agency_type", label: "Agency type", type: "Choice", choices: AGENCY_TYPES, help: "AR-i customer details, optional. M, SB or PV (full names to be confirmed). Found customer: read-only from the customer master" },
      { key: "vag", name: "vag", label: "V@G", type: "Choice", choices: YES_NO, showIf: { key: "agencyType", in: ["SB", "PV"] }, help: "AR-i customer details, optional. Found customer: read-only from the customer master" },
      { key: "subBu", name: "sub_bu", label: "V@G sub-BU", type: "String", showIf: { key: "vag", eq: "yes" }, help: "Optional, free text" },
      { key: "typeOfBilling", name: "type_of_billing", label: "Type of billing", type: "Choice", choices: BILLING_KINDS, help: "Contract level: entered for a new contract (copied to the contract by Link to customer); read-only copy of the contract's value for an existing one" },
      { key: "docBulk", name: "bulk_supporting_docs", label: "Supporting documents (bulk upload)", type: "Attachment", multiple: true, showIf: { key: "typeOfBilling", in: ["C", "D", "E"] }, help: "Optional; several files at once" },
      { key: "invoiceBreakdown", name: "invoice_breakdown", label: "Invoice breakdown", type: "String (4000)", wide: true, help: "Optional, free text: how the invoice should be broken down" },
      { key: "giroOnContract", name: "giro_on_contract", label: "GIRO on this contract", type: "Choice", choices: YES_NO, readonly: true, help: "Read-only: copied from the contract's GIRO status at submit (set by AR-ix, D21)", tooltip: "GIRO is set by an AR-ix (GIRO authorisation). Raise an AR-ix if this contract needs GIRO." },
      // AR-ix GIRO authorisation (record producer variables; mandatory rules enforced on the form, see GIR module)
      { key: "applicantName", name: "giro_applicant_name", label: "Applicant name / entity", type: "String", help: "AR-ix. Mandatory on the form; prefilled from the contract's bill-to" },
      { key: "applicantEmail", name: "giro_applicant_email", label: "Applicant email", type: "String", help: "AR-ix. Mandatory on the form; prefilled from the contract's bill-to" },
      { key: "applicantMobile", name: "giro_applicant_mobile", label: "Applicant mobile", type: "String", help: "AR-ix. Prefilled from the contract's bill-to phone" },
      { key: "giroInvoiceRef", name: "giro_invoice_ref", label: "Invoice reference number", type: "String", help: "AR-ix. Optional; requirement to be confirmed" },
      { key: "giroPurpose", name: "giro_purpose", label: "Purpose", type: "Choice", choices: GIRO_PURPOSES, help: "AR-ix. Mandatory on the form" },
      { key: "giroPurposeOther", name: "giro_purpose_other", label: "Other purpose", type: "String", wide: true, showIf: { key: "giroPurpose", eq: "others" }, help: "AR-ix. Mandatory when Purpose = Others" },
      { key: "giroType", name: "giro_type", label: "Type", type: "Choice", choices: GIRO_TYPES, help: "AR-ix. Mandatory on the form" },
      { key: "giroStart", name: "giro_start_date", label: "Effective start date", type: "Date", showIf: { key: "giroPurpose", eq: "rental" }, help: "AR-ix rental. Mandatory for Add GIRO" },
      { key: "giroEnd", name: "giro_end_date", label: "Effective end date", type: "Date", showIf: { key: "giroPurpose", eq: "rental" }, help: "AR-ix rental. Optional; on or after the start date" },
      { key: "giroLocation", name: "giro_location", label: "Location", type: "String", wide: true, showIf: { key: "giroPurpose", eq: "rental" }, help: "AR-ix rental. Mandatory" },
      { key: "carplate", name: "giro_carplate", label: "Car plate", type: "String", showIf: { key: "giroPurpose", eq: "carpark" }, help: "AR-ix carpark. Mandatory; one vehicle per form" },
      { key: "parkStart", name: "giro_parking_start", label: "Parking start date", type: "Date", showIf: { key: "giroPurpose", eq: "carpark" }, help: "AR-ix carpark. Mandatory for Add GIRO" },
      { key: "parkEnd", name: "giro_parking_end", label: "Parking end date", type: "Date", showIf: { key: "giroPurpose", eq: "carpark" }, help: "AR-ix carpark. Optional; on or after the start date" },
      { key: "giroAmount", name: "giro_amount", label: "Amount", type: "Currency", help: "AR-ix, all purposes. Mandatory for Add GIRO" },
      { key: "docContract", name: "doc_contract_po", label: "Signed contract / PO", type: "Attachment", help: "Only when not already on file for the customer" },
      { key: "docAcra", name: "doc_acra", label: "Company registration (ACRA / UEN)", type: "Attachment", help: "Only when not already on file" },
      { key: "docBillingForm", name: "doc_billing_form", label: "Billing contact & address form", type: "Attachment", help: "Only when not already on file for this department" },
      { key: "details", name: "description", label: "Additional details", type: "String (4000)", wide: true },
      { key: "assignedTo", name: "assigned_to", label: "Assigned to", type: "Reference", ref: "users", refFilter: "ar" },
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
      { key: "number", name: "deposit_id", label: "Deposit ID", type: "String", readonly: true, auto: "DEP-<bank><acct4>-<YYMMDD>-<NNN>", help: "Set by before-insert business rule" },
      { key: "bankAccountId", name: "bank_account", label: "Bank account", type: "Reference", ref: "bankAccounts", readonly: true },
      { key: "uploadId", name: "bsu", label: "Statement upload", type: "Reference", ref: "uploads", readonly: true },
      { key: "date", name: "value_date", label: "Value date", type: "Date", readonly: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", readonly: true },
      { key: "payer", name: "payer_name", label: "Payer (as on statement)", type: "String", readonly: true, wide: true },
      { key: "reference", name: "bank_reference", label: "Reference / remittance", type: "String", readonly: true, wide: true },
      { key: "bankRef", name: "bank_transaction_ref", label: "Bank transaction ref", type: "String", readonly: true }
    ],
    calculated: [
      { name: "match_state", label: "Match state", type: "Choice", how: "Unmatched / Part matched / Matched, from accepted allocations" },
      { name: "unmatched_amount", label: "Unmatched amount", type: "Currency", how: "amount − accepted allocations" }
    ]
  },
  uploads: {
    table: `${SCOPE}_bsu`, label: "Statement upload", plural: "Statement uploads", display: "number", prefix: "BSU",
    note: "Bank statement upload (BSU): one record per bank account per statement day. The CSV is kept as an attachment.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "BSU0001000" },
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
      { key: "bank", name: "bank", label: "Bank", type: "Choice", choices: [["MB", "Marina Bank"], ["OB", "Orchard Bank"], ["US", "Union Straits Bank"]], mandatory: true, help: "Mock aliases for Singapore's three largest banks; each has its own CSV layout" },
      { key: "number", name: "account_number", label: "Account number", type: "String", mandatory: true },
      { key: "name", name: "account_name", label: "Account name", type: "String", mandatory: true },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: [["Finance", "Finance"], ...DEPT_CHOICES], mandatory: true },
      { key: "accountType", name: "account_type", label: "Account type", type: "Choice", choices: [["revenue", "Revenue account"], ["deposit", "Deposit account"], ["operating", "Operating account"]], mandatory: true },
      { key: "currency", name: "currency", label: "Currency", type: "String", readonly: true }
    ]
  },
  allocations: {
    table: `${SCOPE}_allocation`, label: "Allocation", plural: "Allocations", display: "number",
    note: "Applies part or all of a BSU deposit to an invoice. Always created manually by the AR team from the invoice finder (no auto-matching, D5).",
    fields: [
      { key: "depositId", name: "deposit", label: "BSU deposit", type: "Reference", ref: "deposits" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices" },
      { key: "amount", name: "amount", label: "Amount", type: "Currency" },
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
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", readonly: true, help: "Billing lines are contract level (D15). Existing contract at submit; otherwise set by Link to customer" },
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
    table: `${SCOPE}_request_item`, label: "Billing line item", plural: "Billing line items", display: "itemNo",
    note: "Breakdown of an AR request's invoice (ARF decision 32). Portal: multi-row variable set on AR-i, shown when 'Require billing line item?' is Yes. GST and total are calculated (GST_RATE).",
    fields: [
      { key: "requestId", name: "ar_request", label: "AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "itemNo", name: "billing_item_number", label: "Billing item number", type: "String", mandatory: true },
      { key: "amount", name: "amount_excl_gst", label: "Amount (w/o GST)", type: "Currency", mandatory: true },
      { key: "gst", name: "gst_amount", label: "GST amount", type: "Currency", readonly: true, help: "Calculated: amount × GST rate (9%), rounded to the cent" },
      { key: "total", name: "total_amount", label: "Total amount", type: "Currency", readonly: true, help: "Calculated: amount + GST" },
      { key: "lpiRate", name: "late_payment_interest", label: "Late payment interest (%)", type: "Decimal", help: "Rate % (to be confirmed with the users)" },
      { key: "accountCode", name: "account_code", label: "Account code", type: "String" }
    ]
  },
  contacts: {
    table: `${SCOPE}_billing_contact`, label: "Billing contact", plural: "Billing contacts", display: "name",
    note: "The department's usual bill-to person at a customer (D11): unique per customer + department. Used to prefill the bill-to on a new contract or shell; the bill-to used for invoicing is on the contract (D16).",
    fields: [
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "name", name: "contact_name", label: "Bill-to person", type: "String", mandatory: true },
      { key: "email", name: "email", label: "Email", type: "String", mandatory: true },
      { key: "phone", name: "phone", label: "Phone", type: "String" },
      { key: "address", name: "billing_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", readonly: true }
    ]
  },
  documents: {
    table: `${SCOPE}_customer_document`, label: "Customer document", plural: "Customer documents", display: "number", prefix: "DOC",
    note: "Documents supplied once per customer (D10). The file itself is a sys_attachment on this record.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "DOC0001000" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", readonly: true },
      { key: "docType", name: "document_type", label: "Document type", type: "Choice", choices: DOC_TYPES, readonly: true },
      { key: "fileName", name: "file_name", label: "File", type: "String", readonly: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", readonly: true, help: "For signed contract / PO" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, readonly: true, help: "For billing contact & address forms" },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "received", name: "received_on", label: "Received", type: "Date", readonly: true }
    ]
  },
  schedules: {
    table: `${SCOPE}_billing_schedule`, label: "Billing schedule", plural: "Billing schedules", display: "number", prefix: "SCH",
    note: "Recurring billing set up once from a recurring billing line (D12, D13): from–to date range and frequency. Periods are listed; AR raises each invoice manually.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "SCH0001000" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId" },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "desc", name: "short_description", label: "What is billed", type: "String", mandatory: true, wide: true },
      { key: "frequency", name: "frequency", label: "Frequency", type: "Choice", choices: FREQUENCIES.map(f => [f[0], f[1]]), mandatory: true },
      { key: "amount", name: "amount", label: "Amount per period", type: "Currency", mandatory: true },
      { key: "firstDate", name: "first_billing_date", label: "First billing date", type: "Date", mandatory: true },
      { key: "lastDate", name: "last_billing_date", label: "Last billing date", type: "Date", mandatory: true },
      { key: "firstAmount", name: "first_period_amount", label: "First period amount (prorated)", type: "Currency", help: "Empty = amount per period" },
      { key: "lastAmount", name: "last_period_amount", label: "Last period amount (prorated)", type: "Currency", help: "Empty = amount per period" },
      { key: "requestId", name: "source_request", label: "From AR request", type: "Reference", ref: "requests", readonly: true },
      { key: "lineId", name: "source_line", label: "From billing line", type: "Reference", ref: "lines", readonly: true }
    ],
    calculated: [{ name: "next_billing_date", label: "Next billing date", type: "Date", how: "first period on or after today without an invoice" }]
  },
  customers: {
    table: `${SCOPE}_customer`, label: "Customer", plural: "Customers", display: "name",
    note: "Custom customer master (not core_company / customer_account). Documents and per-department billing contacts hang off the customer (D10, D11).",
    fields: [
      { key: "name", name: "name", label: "Customer name", type: "String", mandatory: true, wide: true },
      { key: "uen", name: "uen", label: "UEN (company registration no.)", type: "String" },
      { key: "parent", name: "parent_group", label: "Parent group", type: "String" },
      { key: "address", name: "registered_address", label: "Registered address", type: "String (1000)", wide: true },
      { key: "agencyType", name: "agency_type", label: "Agency type", type: "Choice", choices: AGENCY_TYPES, help: "Master data replicated from the AR-i that set the customer up (Link to customer, D23)" },
      { key: "vag", name: "vag", label: "V@G", type: "Choice", choices: YES_NO, showIf: { key: "agencyType", in: ["SB", "PV"] } },
      { key: "vagSubBu", name: "vag_sub_bu", label: "V@G sub-BU", type: "String", showIf: { key: "vag", eq: "yes" } },
      { key: "pocName", name: "poc_name", label: "POC name", type: "String" },
      { key: "pocEmail", name: "poc_email", label: "POC email", type: "String" },
      { key: "terms", name: "payment_terms", label: "Payment terms (days)", type: "Integer" },
      { key: "creditLimit", name: "credit_limit", label: "Credit limit", type: "Currency" },
      { key: "aliases", name: "bank_names", label: "Names seen on bank statements", type: "String (1000)", wide: true, help: "Comma-separated. Used to rank invoices in the invoice finder." },
      { key: "notes", name: "notes", label: "Notes for AR", type: "String (4000)", wide: true }
    ]
  },
  contracts: {
    table: `${SCOPE}_contract`, label: "Contract", plural: "Contracts", display: "number",
    note: "Custom contract table (not ast_contract). GIRO is a contract status set from the approved AR-ix case (D21). Middle of the billing hierarchy customer › contract › billing lines › invoices (D15). Holds the bill-to person (D16) and billing terms. A no-contract shell (contract_type = shell, one per customer + department) holds billing that has no contract.",
    fields: [
      { key: "number", name: "number", label: "Contract number", type: "String", mandatory: true },
      { key: "contractType", name: "contract_type", label: "Record type", type: "Choice", choices: CONTRACT_TYPES, mandatory: true, help: "Contract, or the customer's no-contract shell (D15)" },
      { key: "category", name: "contract_category", label: "Contract type", type: "Choice", choices: CONTRACT_CATEGORIES, help: "Recurring or Ad-hoc" },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "department", name: "department", label: "Department", type: "Choice", choices: DEPT_CHOICES, help: "Owning department; a shell is unique per customer + department" },
      { key: "reference", name: "reference_number", label: "Contract reference number", type: "String" },
      { key: "poNumber", name: "po_number", label: "Contract PO number", type: "String" },
      { key: "title", name: "short_description", label: "Title", type: "String", mandatory: true, wide: true },
      { key: "billing", name: "billing_type", label: "Billing", type: "Choice", choices: ["Monthly", "Milestone", "Annual", "Time & materials", "Per PO"].map(x => [x, x]) },
      { key: "value", name: "contract_value", label: "Contract value", type: "Currency" },
      { key: "start", name: "start_date", label: "Start", type: "Date" },
      { key: "end", name: "end_date", label: "End", type: "Date" },
      { key: "terms", name: "payment_terms", label: "Payment terms (days)", type: "Integer" },
      { key: "discPct", name: "discount_percent", label: "Early-settlement discount %", type: "Decimal" },
      { key: "discDays", name: "discount_days", label: "Discount if paid within (days)", type: "Integer" },
      { key: "lpiApplicable", name: "lpi_applicable", label: "LPI applicable", type: "True/False", help: "Late payment interest is charged on overdue invoices under this contract" },
      { key: "lpiMinRate", name: "lpi_min_rate", label: "Minimum LPI rate (%)", type: "Decimal", help: "Mandatory when LPI applicable. % per annum; must not exceed the LPI rate" },
      { key: "lpiRate", name: "lpi_rate", label: "LPI rate (%)", type: "Decimal", help: "Mandatory when LPI applicable. % per annum" },
      { key: "contractLocation", name: "contract_location", label: "Where the signed contract is kept", type: "Choice", choices: CONTRACT_LOCATIONS },
      { key: "contractLocationRef", name: "contract_location_ref", label: "Link or file location", type: "String", wide: true },
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
      { key: "giroStatus", name: "giro_status", label: "GIRO status", type: "Choice", choices: GIRO_STATUS, readonly: true, help: "Set by Activate GIRO / Remove GIRO on an AR-ix case. At most one active GIRO per contract (D21)" },
      { key: "giroCaseId", name: "giro_case", label: "Active GIRO case", type: "Reference", ref: "requests", readonly: true, help: "The approved AR-ix case whose GIRO is active; empty when GIRO is not active" },
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
    header: ["Transaction Date", "Value Date", "Transaction Description 1", "Transaction Description 2", "Debit Amount", "Credit Amount", "Client Reference"],
    cols: { date: "Transaction Date", payer: "Transaction Description 1", reference: "Transaction Description 2", debit: "Debit Amount", credit: "Credit Amount", bankRef: "Client Reference" } },
  OB: { name: "Orchard Bank", short: "Orchard", dateFmt: "DD/MM/YYYY",
    header: ["Transaction date", "Value date", "Description", "Remarks", "Withdrawals (SGD)", "Deposits (SGD)"],
    cols: { date: "Transaction date", payer: "Description", reference: "Remarks", debit: "Withdrawals (SGD)", credit: "Deposits (SGD)", bankRef: null } },
  US: { name: "Union Straits Bank", short: "Union Straits", dateFmt: "YYYY-MM-DD",
    header: ["Date", "Description", "Reference", "Deposit", "Withdrawal", "Ledger Balance"],
    cols: { date: "Date", payer: "Description", reference: "Reference", debit: "Withdrawal", credit: "Deposit", bankRef: null } }
};

export const fieldOf = (tableKey, key) => TABLES[tableKey].fields.find(f => f.key === key);

/** UI policy: a field with showIf is visible only when its parent field is visible and equals the value. */
export function fieldVisible(tableKey, f, vals) {
  if (!f?.showIf) return true;
  const p = fieldOf(tableKey, f.showIf.key), v = vals[f.showIf.key];
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
  return f.showIf.in ? `Shown when ${p.label} is ${f.showIf.in.map(lab).join(", ")}` : `Shown when ${p.label} = ${lab(f.showIf.eq)}`;
}

/** Build-note text for a field, e.g. "x_ar_invoice.due_date · Date". */
export function fieldNote(tableKey, key) {
  const t = TABLES[tableKey], f = fieldOf(tableKey, key);
  if (!f) return t.table;
  const ref = f.ref ? ` → ${f.ref === "users" ? "sys_user" : TABLES[f.ref].table}` : "";
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
    "newCtrInvDate", "newCtrTerms", "newCtrTermsOther", "newCtrProrate", "newCtrProFirst", "newCtrProLast", "contractLocation", "contractLocationRef",
    "billToName", "billToEmail", "billToPhone", "billToAddress", "title", "attnName", "attnEmail", "perPeriod", "prefInvDate", "needItems", "poNumber",
    "pocName", "pocEmail", "invoiceBreakdown", "costCenter", "accountCode", "agentName", "agencyType", "vag", "subBu", "typeOfBilling", "docBulk", "giroOnContract", "docContract", "docAcra", "docBillingForm", "details"],
  lineSet: "items",
  script: "current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>; creates one x_ar_request_line from the invoice details (recurring when the contract type is Recurring, else one-off, D13 as amended); copies the billing line items multi-row variable set to x_ar_request_item"
};
/** AR-ix GIRO authorisation (GIR module): same case table, its own variables. */
export const RECORD_PRODUCER_ARIX = {
  name: "AR-ix GIRO authorisation",
  table: "requests",
  variables: [...GENERAL_INFO, "customerId", "newCustomer", "newCustName", "contractOption", "contractId", "newCtrRef", "applicantName", "applicantEmail", "applicantMobile", "giroInvoiceRef",
    "giroPurpose", "giroPurposeOther", "giroType", "giroStart", "giroEnd", "giroLocation", "carplate", "parkStart", "parkEnd", "giroAmount", "details"],
  script: "current.opened_by = gs.getUserID(); current.ar_form = 'AR-ix'; current.short_description = 'GIRO ' + type + ' – ' + purpose; current.state = 'new'; current.watch_list = cc_list emails; current.assignment_group = <AR team group>;"
};
export const RECORD_PRODUCERS = [RECORD_PRODUCER, RECORD_PRODUCER_ARIX];
