// Generates SERVICENOW_MAPPING.md from js/schema.js. Run: node tools/mapping.mjs
import { writeFileSync } from "node:fs";
import { RECORD_PRODUCER, ROLES, SCOPE, TABLES } from "../js/schema.js";

const refName = r => r === "users" ? "sys_user" : TABLES[r].table;
const order = ["customers", "contracts", "requests", "invoices", "payments", "allocations"];
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
  md += `### ${t.label} — \`${t.table}\`${t.extends ? ` (extends \`${t.extends}\`)` : ""}\n\n${t.note}${t.prefix ? ` Number prefix: \`${t.prefix}\`.` : ""}\n\n| Column | Label | Type | Notes |\n|---|---|---|---|\n`;
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
- **Cash application** custom page: auto-match proposals, accept/reject, invoice finder with allocation preview (modal or side panel), payments CSV import as an interim for bank statement loading.

### UI actions

| Table | Action | Effect |
|---|---|---|
| AR request | Assign to me | \`assigned_to\` = current user; New → In progress |
| AR request | Create invoice | Insert draft \`${TABLES.invoices.table}\` from request fields (customer, contract, description, amount, invoice date, due = date + terms); link \`ar_request\`; work note |
| AR request | Request info | Requires an additional comment; state → Awaiting info |
| AR request | Reject | Requires an additional comment; state → Rejected |
| Invoice | Issue invoice | Draft → Issued; BR sets the AR request to Invoiced and posts a requester-visible comment |
| Invoice | Cancel invoice | Only when no accepted allocations; removes pending proposals; request back to In progress |
| Payment | Accept / Reject proposal | Allocation state → Accepted / Rejected |
| Payment | Find invoice → Apply | Creates accepted allocations; exception = short pay / over pay / multi-invoice |
| Cash application | Run auto-match | Script Include \`${SCOPE}.AutoMatch\` (rules below), or a scheduled flow after bank statement load |

### Auto-match rules (current prototype)

1. Reference contains invoice number(s) (tolerates letter O for zero, missing prefix) and amount equals their combined open balance → proposed, confidence 0.99.
2. No usable reference, and exactly one issued invoice for a customer whose name, parent group or bank-statement names match the payer has exactly that open amount → proposed, confidence 0.90.
3. Otherwise unmatched; AR uses the invoice finder (ranked by reference, amount fit and name similarity).

Only **issued** invoices receive payments.

## Automation

To be defined by the owner (placeholder). Candidates seen in the prototype:
- On AR request insert: assignment to AR team group, notification to the group.
- On state change: notifications to the requester (Awaiting info, Invoiced, Rejected).
- On bank statement load: run auto-match.

## Open questions

1. Should the project team see payment status of their invoices on the portal (currently only number, issue date and due date)?
2. Approval step before *Issue invoice* (e.g. AR manager above a threshold)?
3. Invoice output: PDF generation and delivery to the customer (email, portal)? Numbering format?
4. Credit notes: separate table or negative invoice? How do SLA credits on contracts flow in?
5. Multi-currency: SGD only, or currency per contract?
6. Bank statement load: file format (MT940, CAMT.053, CSV) and frequency.
7. Who maintains customers and contracts: AR team only, or also project team via portal?
8. Does an AR request ever produce more than one invoice (e.g. instalments)?
`;
writeFileSync(new URL("../SERVICENOW_MAPPING.md", import.meta.url), md);
console.log("Wrote SERVICENOW_MAPPING.md", md.length, "chars");
