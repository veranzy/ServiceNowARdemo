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

const STATE_REQ = [["new", "New"], ["in_progress", "In progress"], ["awaiting_info", "Awaiting info"], ["invoiced", "Billed"], ["rejected", "Rejected"]];

/** The 11 operational departments (D11). Bank accounts may also belong to Finance. */
export const DEPARTMENTS = ["Engineering", "Marine", "Digital", "Infrastructure", "Energy", "Facilities", "Logistics", "Healthcare", "Environmental", "Rail", "Advisory"];
const DEPT_CHOICES = DEPARTMENTS.map(d => [d, d]);

/** Portal AR forms catalogue (D9): AR-i … AR-xvi. Only AR-i is defined so far. */
export const AR_FORMS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi"].map((r, n) => ({
  code: `AR-${r}`, name: n === 0 ? "New AR request" : "To be defined",
  desc: n === 0 ? "Bill a customer: one-off and recurring lines, new or existing customer. Customer documents are given once." : "Form not yet specified.",
  active: n === 0
}));

export const LINE_TYPES = [["one_off", "One-off"], ["recurring", "Recurring"]];
export const FREQUENCIES = [["monthly", "Monthly", 1], ["quarterly", "Quarterly", 3], ["half_yearly", "Half-yearly", 6], ["annually", "Annually", 12]];
export const DOC_TYPES = [["contract", "Signed contract / PO"], ["acra", "Company registration (ACRA / UEN)"], ["billing_form", "Billing contact & address form"]];
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
      { key: "department", name: "department", label: "Requesting department", type: "Choice", choices: DEPT_CHOICES, mandatory: true },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", help: "Mandatory unless New customer is ticked" },
      { key: "newCustomer", name: "new_customer", label: "New customer", type: "True/False" },
      { key: "newCustName", name: "new_customer_name", label: "New customer name", type: "String", wide: true, help: "Mandatory when New customer" },
      { key: "newCustUen", name: "new_customer_uen", label: "UEN (company registration no.)", type: "String" },
      { key: "newCustAddress", name: "new_customer_address", label: "Registered address", type: "String (1000)", wide: true },
      { key: "updateBillTo", name: "update_bill_to", label: "Update the department's bill-to person", type: "True/False" },
      { key: "billToName", name: "bill_to_name", label: "Bill-to person", type: "String", help: "Mandatory when the department has no billing contact for this customer" },
      { key: "billToEmail", name: "bill_to_email", label: "Bill-to email", type: "String" },
      { key: "billToPhone", name: "bill_to_phone", label: "Bill-to phone", type: "String" },
      { key: "billToAddress", name: "bill_to_address", label: "Billing address", type: "String (1000)", wide: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId" },
      { key: "contractLocation", name: "contract_location", label: "Where is the signed contract kept?", type: "Choice", choices: CONTRACT_LOCATIONS, mandatory: true },
      { key: "contractLocationRef", name: "contract_location_ref", label: "Link or file location", type: "String", wide: true, help: "Mandatory for repository link or physical file" },
      { key: "title", name: "short_description", label: "Request summary", type: "String", mandatory: true, wide: true, help: "e.g. Data hall cooling project, phase 1" },
      { key: "amount", name: "amount", label: "Request value", type: "Currency", readonly: true, help: "Calculated: one-off lines + recurring amount × number of periods" },
      { key: "poNumber", name: "po_number", label: "Customer PO number", type: "String" },
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
      { key: "lineType", name: "line_type", label: "Line type", type: "Choice", choices: LINE_TYPES, mandatory: true },
      { key: "desc", name: "short_description", label: "Description", type: "String", mandatory: true, wide: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", mandatory: true, help: "Recurring: amount per period" },
      { key: "invoiceDate", name: "preferred_invoice_date", label: "Preferred invoice date", type: "Date", help: "One-off only" },
      { key: "frequency", name: "frequency", label: "Frequency", type: "Choice", choices: FREQUENCIES.map(f => [f[0], f[1]]), help: "Recurring only; Monthly by default (decision 10)" },
      { key: "startDate", name: "start_date", label: "From", type: "Date", help: "Recurring only: first billing date" },
      { key: "endDate", name: "end_date", label: "To", type: "Date", help: "Recurring only: last billing date" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices", readonly: true },
      { key: "scheduleId", name: "billing_schedule", label: "Billing schedule", type: "Reference", ref: "schedules", readonly: true }
    ],
    calculated: [{ name: "periods", label: "Number of invoices", type: "Integer", how: "recurring: periods between start and end at the frequency" },
      { name: "line_value", label: "Line value", type: "Currency", how: "one-off: amount; recurring: amount × periods" }]
  },
  contacts: {
    table: `${SCOPE}_billing_contact`, label: "Billing contact", plural: "Billing contacts", display: "name",
    note: "Who to bill at a customer, per department (D11). Unique per customer + department. Created or updated by Link to customer from an AR-i.",
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
      { key: "terms", name: "payment_terms", label: "Payment terms (days)", type: "Integer" },
      { key: "creditLimit", name: "credit_limit", label: "Credit limit", type: "Currency" },
      { key: "aliases", name: "bank_names", label: "Names seen on bank statements", type: "String (1000)", wide: true, help: "Comma-separated. Used to rank invoices in the invoice finder." },
      { key: "notes", name: "notes", label: "Notes for AR", type: "String (4000)", wide: true }
    ]
  },
  contracts: {
    table: `${SCOPE}_contract`, label: "Contract", plural: "Contracts", display: "number",
    note: "Custom contract table (not ast_contract). Holds billing terms the AR team invoices against.",
    fields: [
      { key: "number", name: "number", label: "Contract number", type: "String", mandatory: true },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "title", name: "short_description", label: "Title", type: "String", mandatory: true, wide: true },
      { key: "billing", name: "billing_type", label: "Billing", type: "Choice", choices: ["Monthly", "Milestone", "Annual", "Time & materials", "Per PO"].map(x => [x, x]) },
      { key: "value", name: "contract_value", label: "Contract value", type: "Currency" },
      { key: "start", name: "start_date", label: "Start", type: "Date" },
      { key: "end", name: "end_date", label: "End", type: "Date" },
      { key: "terms", name: "payment_terms", label: "Payment terms (days)", type: "Integer" },
      { key: "discPct", name: "discount_percent", label: "Early-settlement discount %", type: "Decimal" },
      { key: "discDays", name: "discount_days", label: "Discount if paid within (days)", type: "Integer" },
      { key: "contractLocation", name: "contract_location", label: "Where the signed contract is kept", type: "Choice", choices: CONTRACT_LOCATIONS },
      { key: "contractLocationRef", name: "contract_location_ref", label: "Link or file location", type: "String", wide: true },
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

/** Build-note text for a field, e.g. "x_ar_invoice.due_date · Date". */
export function fieldNote(tableKey, key) {
  const t = TABLES[tableKey], f = fieldOf(tableKey, key);
  if (!f) return t.table;
  const ref = f.ref ? ` → ${f.ref === "users" ? "sys_user" : TABLES[f.ref].table}` : "";
  return `${t.table}.${f.name} · ${f.type}${ref}${f.mandatory ? " · mandatory" : ""}`;
}

/** Record producer for the portal AR form: variables map onto x_ar_request fields. */
export const RECORD_PRODUCER = {
  name: "AR-i New AR request",
  table: "requests",
  variables: ["customerId", "newCustomer", "newCustName", "newCustUen", "newCustAddress", "department", "updateBillTo", "billToName", "billToEmail", "billToPhone", "billToAddress",
    "contractId", "contractLocation", "contractLocationRef", "title", "poNumber", "docContract", "docAcra", "docBillingForm", "details"],
  lineSet: "lines",
  script: "current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>;"
};
