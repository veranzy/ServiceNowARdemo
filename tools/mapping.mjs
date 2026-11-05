// Generates SERVICENOW_MAPPING.md from js/schema.js. Run: node tools/mapping.mjs
import { writeFileSync } from "node:fs";
import { BANKS, RECORD_PRODUCER, ROLES, SCOPE, TABLES, showIfText } from "../js/schema.js";

const refName = r => r === "users" ? "sys_user" : TABLES[r].table;
const order = ["customers", "contracts", "requests", "invoices", "bankAccounts", "uploads", "deposits", "allocations"];
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
      f.showIf ? showIfText(k, f) + " (UI policy)" : "", f.mandatory ? "Mandatory" : "", f.readonly ? "Read-only on form" : "", f.help || "", f.tooltip ? `Tooltip: "${f.tooltip}"` : "", f.default ? `Default: ${f.default}` : ""].filter(Boolean).join(". ");
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
- Layout follows the **Horizon Design System** workspace templates (see \`docs/modules/UIX.md\`): unified navigation header, app navigation on the left, workspace tabs (primary tab + closable record tabs).
- **Landing page**: greeting header and a grid of single-score cards (new requests, assigned to me, awaiting info, customer setup pending, billing periods due, draft invoices, overdue amount, BSU deposits to match, statements uploaded for yesterday), aging bar chart, new requests list, overdue invoices list.
- **List page** (Horizon list page template): **list menu** on the left, list on the right. Menu: AR requests (Open, New unassigned, Customer setup pending, Assigned to me, Awaiting info, All); Recurring billing (Billing periods due, Active schedules, All); Invoices (Drafts, Issued unpaid, Overdue, All); Bank statements (Statement uploads, BSU deposits to match, All BSU deposits, Bank accounts); Master data (Customers, Contracts, No-contract shells, Billing contacts, Customer documents).
- **Record pages** (Horizon Record page template): header (record name, description, label-value pairs, form record presence, **UI action bar** with overflow menu) › **ribbon** of metric widgets (collapsible) › **resizable pane** with record tabs (Details first, then related items, then one tab per related list; extra tabs in a More menu) and the **contextual side bar** (vertical icon tabs). AR request side bar: Customer setup, Activity stream, Attachments (side bar tools for other records: open, GitHub issue #1). Last tab on every record: **Record history** (sys_audit; turn Audit on for every \`x_ar_\` table). Theme: the default workspace theme.
- **BSU (bank statement upload)** custom page: daily checklist of bank accounts for the statement date, upload form (bank account, statement date, CSV), preview of deposits with Deposit IDs, *Save to bank statements*, recent uploads. See \`docs/modules/BSU.md\`.
- **Cash application** custom page: deposits from the Bank statements table with match state; **manual matching only** through the invoice finder with allocation preview (modal or side panel).

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | \`assigned_to\` = current user; New → In progress |
| AR request | Link to customer | Creates or links \`${TABLES.customers.table}\`; links / creates the contract or no-contract shell and sets it on every billing line; writes the bill-to to the contract; files documents; records contract location (D10, D15, D16) |
| AR request | Request info (overflow menu) | Requires an additional comment; state → Awaiting info |
| AR request | Reject (overflow menu) | Requires an additional comment; state → Rejected |
| Billing line | Create invoice | One-off line: insert draft \`${TABLES.invoices.table}\` (customer, line's contract, description, amount, invoice date, due = date + terms); links \`request_line\` |
| Billing line | Set up billing schedule | Recurring line: insert \`${TABLES.schedules.table}\` over the line's date range; comment to requester (D12) |
| Billing schedule | Raise invoice | Draft invoice for one billing period; never automatic (D12) |
| Invoice | Issue invoice | Draft → Issued; posts a requester-visible comment; BR sets the AR request to Billed when every line is invoiced or scheduled |
| Invoice | Cancel invoice (overflow menu) | Only when no allocations; the line becomes open again and the request goes back to In progress |
| Deposit | Match to invoice / Find invoice → Apply | Inserts \`${TABLES.allocations.table}\` records (manual); exception = short pay / over pay / multi-invoice |
| Deposit | Remove match | Removes the deposit's allocations |
| BSU page | Save to bank statements | Inserts \`${TABLES.uploads.table}\` + one \`${TABLES.deposits.table}\` row per deposit; withdrawals skipped |
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
6. BSU: who may upload statements, and can a wrong upload be deleted and redone? (see docs/modules/BSU.md)
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
`;
writeFileSync(new URL("../SERVICENOW_MAPPING.md", import.meta.url), md);
console.log("Wrote SERVICENOW_MAPPING.md", md.length, "chars");
