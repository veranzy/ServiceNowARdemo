// ServiceNow build model: scoped custom tables, fields, choices and roles.
// This file is the single source for record forms, list columns, the Build notes overlay
// and SERVICENOW_MAPPING.md (regenerate with `node tools/mapping.mjs`). No DOM access here.

export const SCOPE = "x_ar"; // placeholder: replace with the real application scope, e.g. x_1234_ar

export const ROLES = {
  ar: { role: `${SCOPE}.ar_team`, label: "Accounts receivable team", ui: "Receivables Workspace (UI Builder, configurable workspace)",
    can: "Read/write all AR tables; works AR request cases, issues invoices, uploads bank statements (BSU), matches BSU deposits to invoices." },
  project: { role: `${SCOPE}.project_team`, label: "Company project team", ui: "Service Portal / Employee Center",
    can: "Submit the AR form (record producer) and read/comment on their own AR requests. Read customer and contract reference data only. No workspace access." }
};

const STATE_REQ = [["new", "New"], ["in_progress", "In progress"], ["awaiting_info", "Awaiting info"], ["invoiced", "Invoiced"], ["rejected", "Rejected"]];

export const TABLES = {
  requests: {
    table: `${SCOPE}_request`, label: "AR request", plural: "AR requests", extends: "task", display: "number", prefix: "ARQ",
    note: "Case raised by the project team through the AR form record producer. Extends Task for assignment, SLAs and the activity stream.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "ARQ0001000" },
      { key: "state", name: "state", label: "State", type: "Choice", choices: STATE_REQ, readonly: true },
      { key: "requestedBy", name: "opened_by", label: "Requested by", type: "Reference", ref: "users", readonly: true },
      { key: "customerId", name: "customer", label: "Customer", type: "Reference", ref: "customers", mandatory: true },
      { key: "contractId", name: "contract", label: "Contract", type: "Reference", ref: "contracts", dependsOn: "customerId" },
      { key: "billingType", name: "billing_type", label: "Billing type", type: "Choice", choices: [["Milestone", "Milestone"], ["Monthly fee", "Monthly fee"], ["Time & materials", "Time & materials"], ["Other", "Other"]], mandatory: true },
      { key: "title", name: "short_description", label: "What should be invoiced", type: "String", mandatory: true, wide: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", mandatory: true },
      { key: "invoiceDate", name: "requested_invoice_date", label: "Preferred invoice date", type: "Date" },
      { key: "periodStart", name: "period_start", label: "Service period from", type: "Date" },
      { key: "periodEnd", name: "period_end", label: "Service period to", type: "Date" },
      { key: "poNumber", name: "po_number", label: "Customer PO number", type: "String" },
      { key: "details", name: "description", label: "Additional details", type: "String (4000)", wide: true },
      { key: "assignedTo", name: "assigned_to", label: "Assigned to", type: "Reference", ref: "users", refFilter: "ar" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices", readonly: true },
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
      { key: "department", name: "department", label: "Department", type: "Choice", choices: ["Finance", "Projects – Engineering", "Projects – Digital", "Projects – Marine"].map(x => [x, x]), mandatory: true },
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
  customers: {
    table: `${SCOPE}_customer`, label: "Customer", plural: "Customers", display: "name",
    note: "Custom customer master (not core_company / customer_account).",
    fields: [
      { key: "name", name: "name", label: "Customer name", type: "String", mandatory: true, wide: true },
      { key: "parent", name: "parent_group", label: "Parent group", type: "String" },
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
  name: "AR form",
  table: "requests",
  variables: ["customerId", "contractId", "billingType", "title", "amount", "invoiceDate", "periodStart", "periodEnd", "poNumber", "details"],
  script: "current.opened_by = gs.getUserID(); current.state = 'new'; current.assignment_group = <AR team group>;"
};
