// Generates docs/BUILD_NOTES.md: every Build notes ID with its ServiceNow meaning. Run: node tools/notes.mjs
import { writeFileSync } from "node:fs";
import { allNotes } from "../js/notes.js";

const rows = allNotes();
const groups = [...new Set(rows.map(r => r.area))];
let md = `# Build note IDs

Every element outlined by **Build notes** in the prototype has an ID, shown in brackets on its label.
To request a change, write \`<ID> - <change>\`, for example \`BSU-03 - add a field for the statement's closing balance\`
or \`INV.due_date - default to end of next month\`. With Build notes on, Alt/Option+click an outlined
element to copy its ID.

ID patterns:

| Pattern | Meaning | Example |
|---|---|---|
| \`<TABLE>.<column>\` | A field (form, portal variable or list column) | \`REQ.po_number\` |
| \`LST-<TABLE>\` / \`RP-\` / \`HDR-\` / \`FRM-\` | List, record page, record header, form view | \`RP-INV\` |
| \`RL-<PARENT>-<CHILD>\` | Related list on a record page | \`RL-CUS-INV\` |
| \`UA-<TABLE>-<action>\` | UI action (button) | \`UA-REQ-invoice\` |
| \`WS-\`, \`PT-\`, \`BSU-\`, \`CSH-\` + number | Workspace, portal, BSU page, cash application elements | \`PT-07\` |

Table codes: REQ AR request, INV invoice, DEP BSU deposit, BSU statement upload, BNK bank account,
ALC allocation, CUS customer, CON contract.

Generated from \`js/notes.js\` and \`js/schema.js\` by \`node tools/notes.mjs\`.

`;
for (const g of groups) {
  md += `## ${g}\n\n| ID | ServiceNow |\n|---|---|\n`;
  for (const r of rows.filter(x => x.area === g)) md += `| \`${r.id}\` | ${String(r.text).replace(/\|/g, "\\|")} |\n`;
  md += "\n";
}
writeFileSync(new URL("../docs/BUILD_NOTES.md", import.meta.url), md);
console.log("Wrote docs/BUILD_NOTES.md with", rows.length, "IDs");
