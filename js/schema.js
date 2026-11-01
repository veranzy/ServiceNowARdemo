// ServiceNow build model: scoped custom tables, fields, choices and roles.
// This file is the single source for record forms, list columns, the Build notes overlay
// and SERVICENOW_MAPPING.md (regenerate with `node tools/mapping.mjs`). No DOM access here.

export const SCOPE = "x_ar"; // placeholder: replace with the real application scope, e.g. x_1234_ar

export const ROLES = {
  ar: { role: `${SCOPE}.ar_team`, label: "Accounts receivable team", ui: "Receivables Workspace (UI Builder, configurable workspace)",
    can: "Read/write all AR tables; works AR request cases, issues invoices, applies payments." },
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
  payments: {
    table: `${SCOPE}_payment`, label: "Payment", plural: "Payments", display: "number", prefix: "PAY",
    note: "Incoming customer payment from the bank statement. Bank statement loading is a later requirement; today via CSV import.",
    fields: [
      { key: "number", name: "number", label: "Number", type: "String", readonly: true, auto: "PAY0001000" },
      { key: "payer", name: "payer_name", label: "Payer (as on statement)", type: "String", readonly: true, wide: true },
      { key: "date", name: "received_date", label: "Received", type: "Date", readonly: true },
      { key: "amount", name: "amount", label: "Amount", type: "Currency", readonly: true },
      { key: "reference", name: "bank_reference", label: "Bank reference / remittance", type: "String", readonly: true, wide: true }
    ],
    calculated: [
      { name: "match_state", label: "Match state", type: "Choice", how: "Unmatched / Proposed / Applied, from allocations" },
      { name: "unapplied_amount", label: "Unapplied amount", type: "Currency", how: "amount − accepted allocations" }
    ]
  },
  allocations: {
    table: `${SCOPE}_allocation`, label: "Allocation", plural: "Allocations", display: "number",
    note: "Applies part or all of a payment to an invoice. Proposed by auto-match or created manually from the invoice finder.",
    fields: [
      { key: "paymentId", name: "payment", label: "Payment", type: "Reference", ref: "payments" },
      { key: "invoiceId", name: "invoice", label: "Invoice", type: "Reference", ref: "invoices" },
      { key: "amount", name: "amount", label: "Amount", type: "Currency" },
      { key: "status", name: "state", label: "State", type: "Choice", choices: [["proposed", "Proposed"], ["accepted", "Accepted"], ["rejected", "Rejected"]] },
      { key: "method", name: "method", label: "Method", type: "Choice", choices: [["rule", "Auto"], ["manual", "Manual"]] },
      { key: "confidence", name: "confidence", label: "Confidence", type: "Decimal" },
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
      { key: "aliases", name: "bank_names", label: "Names seen on bank statements", type: "String (1000)", wide: true, help: "Comma-separated. Used by auto-match." },
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
