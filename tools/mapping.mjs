// Generates SERVICENOW_MAPPING.md from js/schema.js. Run: node tools/mapping.mjs
import { writeFileSync } from "node:fs";
import { BANKS, RECORD_PRODUCER, ROLES, SCOPE, TABLES } from "../js/schema.js";

const refName = r => r === "users" ? "sys_user" : TABLES[r].table;
const order = ["customers", "contracts", "requests", "invoices", "bankAccounts", "uploads", "payments", "allocations"];
let md = `# ServiceNow build mapping

Generated from \`js/schema.js\` by \`node tools/mapping.mjs\`. Edit the schema, not this file's table sections.
Every screen element in the prototype carries the same references (turn on **Build notes** in the demo bar).

Scope: \`${SCOPE}\` is a placeholder for the real application scope (for example \`x_1234_ar\`).
All tables are **custom tables in the scoped app**. No CSM, Contract Management or core_company tables are used.

## Personas and roles

| Persona | Role | Experience | Access |
|---|---|---|---|
${Object.values(ROLES).map(r => `| ${r.label} | \`${r.role}\` | ${r.ui} | ${r.can} |`).join("\n")}

## Tables

`;
for (const k of order) {
  const t = TABLES[k];
  md += `### ${t.tableLabel || t.label} — \`${t.table}\`${t.extends ? ` (extends \`${t.extends}\`)` : ""}\n\n${t.note}${t.prefix ? ` Number prefix: \`${t.prefix}\`.` : ""}\n\n| Column | Label | Type | Notes |\n|---|---|---|---|\n`;
  for (const f of t.fields) {
    const notes = [f.ref ? `→ \`${refName(f.ref)}\`${f.refFilter ? ` (users with ${ROLES[f.refFilter].role})` : ""}${f.dependsOn ? ", filtered by customer" : ""}` : "",
      f.choices ? "Choices: " + f.choices.map(c => c[0] === c[1] ? c[1] : `${c[1]} (\`${c[0]}\`)`).join(", ") : "",
      f.mandatory ? "Mandatory" : "", f.readonly ? "Read-only on form" : "", f.help || ""].filter(Boolean).join(". ");
    md += `| \`${f.name}\` | ${f.label} | ${f.type} | ${notes} |\n`;
  }
  for (const c of t.calculated || []) md += `| \`${c.name}\` | ${c.label} | ${c.type} | Calculated: ${c.how} |\n`;
  if (k === "requests") md += `| \`comments\` / \`work_notes\` | Additional comments / Work notes | Journal (inherited from task) | Comments visible on portal; work notes AR team only |\n`;
  md += "\n";
}
md += `## Portal (project team)

- **Record producer "${RECORD_PRODUCER.name}"** on \`${TABLES.requests.table}\`. Variables: ${RECORD_PRODUCER.variables.map(v => `\`${TABLES.requests.fields.find(f => f.key === v).name}\``).join(", ")}, plus attachments.
  - Producer script: \`${RECORD_PRODUCER.script}\`
  - Catalog client script on contract change: show contract value, invoiced to date, requested-not-invoiced and remaining (GlideAjax to a Script Include). Warn when the request exceeds the remaining value.
  - Contract reference qualifier: contracts of the selected customer.
- **My requests**: list widget on \`${TABLES.requests.table}\` where \`opened_by = me\`.
- **Ticket page**: standard ticket conversation (comments only), field summary, attachments; requester can comment. Business rule: requester comment while *Awaiting info* sets state to *In progress*.
- ACLs: \`${ROLES.project.role}\` create on \`${TABLES.requests.table}\` (via producer), read own records; read \`${TABLES.customers.table}\` and \`${TABLES.contracts.table}\` for reference selection; read invoice number/date/due of their own request's invoice. No workspace access.

## Workspace (AR team)

- Configurable workspace **Receivables Workspace** (UI Builder), role \`${ROLES.ar.role}\`.
- **Landing page**: single-score cards (new requests, assigned to me, awaiting info, draft invoices, overdue amount, unapplied cash), aging bar chart, new requests list, overdue invoices list.
- **List menu**: AR requests (Open, New unassigned, Assigned to me, Awaiting info, All); Invoices (Drafts, Issued unpaid, Overdue, All); Payments (Unapplied, All); Master data (Customers, Contracts).
- **Record pages** with header highlighted values, form sections, related lists, activity stream on AR requests.
- **BSU (bank statement upload)** custom page: daily checklist of bank accounts for the statement date, upload form (bank account, statement date, CSV), preview of deposits with Deposit IDs, *Save to bank statements*, recent uploads. See \`docs/modules/BSU.md\`.
- **Cash application** custom page: deposits from the Bank statements table with match state; **manual matching only** through the invoice finder with allocation preview (modal or side panel).

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | \`assigned_to\` = current user; New → In progress |
| AR request | Create invoice | Insert draft \`${TABLES.invoices.table}\` from request fields (customer, contract, description, amount, invoice date, due = date + terms); link \`ar_request\`; work note |
| AR request | Request info | Requires an additional comment; state → Awaiting info |
| AR request | Reject | Requires an additional comment; state → Rejected |
| Invoice | Issue invoice | Draft → Issued; BR sets the AR request to Invoiced and posts a requester-visible comment |
| Invoice | Cancel invoice | Only when no allocations; request back to In progress |
| Deposit | Match to invoice / Find invoice → Apply | Inserts \`${TABLES.allocations.table}\` records (manual); exception = short pay / over pay / multi-invoice |
| Deposit | Remove match | Removes the deposit's allocations |
| BSU page | Save to bank statements | Inserts \`${TABLES.uploads.table}\` + one \`${TABLES.payments.table}\` row per deposit; withdrawals skipped |
| Bank account | Upload statement | Opens the BSU page for that account |

### Matching (manual only)

There is **no auto-matching** (decision D5). The invoice finder ranks issued invoices for a deposit by
invoice number in the bank reference, amount fit and payer-name similarity (customer name, parent group,
bank-statement names), purely as a suggestion. The AR team always chooses and applies the allocation.
Only **issued** invoices receive deposits.

## Bank statement upload (BSU)

- One upload per bank account per statement day (previous day), CSV only, deposits (credits) only.
- Deposit ID: \`DEP-<bank code><last 4 of account>-<YYMMDD>-<NNN>\` (before-insert business rule).
- Parsing: Script Include \`${SCOPE}.BankStatementParser\` with one column template per bank (or one Data Source + Transform Map per bank).

| Bank (mock alias) | Code | Date format | Header columns |
|---|---|---|---|
${Object.entries(BANKS).map(([k, b]) => `| ${b.name} | ${k} | \`${b.dateFmt}\` | ${b.header.join(", ")} |`).join("\n")}

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
6. BSU: should department / account type of the bank account route deposits to different teams? (see docs/modules/BSU.md)
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
`;
writeFileSync(new URL("../SERVICENOW_MAPPING.md", import.meta.url), md);
console.log("Wrote SERVICENOW_MAPPING.md", md.length, "chars");
