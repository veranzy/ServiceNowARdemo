// Generates docs/DEV_TASKS.md: the developer task list for the ServiceNow build, one section per module.
// Run: node tools/devtasks.mjs (tools/check.mjs runs it). Source: js/schema.js, js/notes.js and the module index
// (docs/modules/README.md). Only modules whose status is Agreed or Ready for build get their tasks listed (owner, 2026-11-19).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RECORD_PRODUCER, RECORD_PRODUCER_ARIX, RECORD_PRODUCER_COL, TABLES } from "../js/schema.js";
import { CODE, allNotes } from "../js/notes.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LISTED = ["Agreed", "Ready for build"];

// ---------- which module owns each build-note ID ----------
const TABLE_MODULE = { REQ: "AR-00", INV: "CCI", SCH: "CCI", CUS: "CCI", CON: "CCI", BCT: "CCI", DOC: "CCI", CMP: "CCI", CCT: "CCI", ACT: "CCI",
  RQL: "AR-i", RQI: "AR-i", CTX: "AR-iii", CAL: "AR-iii", C5L: "AR-iii", DEP: "BSU", BSU: "BSU", BNK: "BSU", ALC: "BSU", PMD: "BSU" };
const CHILD_OF_REQ = { RQL: "AR-i", RQI: "AR-i", INV: "AR-i", SCH: "AR-i", CTX: "AR-iii", CAL: "AR-iii", C5L: "AR-iii" };
const ELEMENT_MODULE = {
  "AR-00": ["PT-01", "PT-02", "PT-04", "PT-08", "PT-09", "PT-10", "PT-11", "PT-13", "PT-14", "PT-16", "PT-30", "REQ-ACT", "REQ-ATT",
    "UA-REQ-assign", "UA-REQ-post", "UA-REQ-save", "LST-REQ"],
  "AR-i": ["PT-03", "PT-05", "PT-07", "PT-15", "PT-19", "PT-20", "PT-23", "PT-25", "PT-27", "PT-28", "PT-29", "PT-36", "PT-37", "PT-39",
    "PT-40", "PT-41", "PT-42", "PT-43", "REQ-FV-ARI", "LST-REQ-ARI", "UA-PT-newcust", "UA-PT-additem"],
  "AR-ix": ["PT-31", "PT-32", "PT-33", "PT-34", "PT-35", "PT-44", "PT-45", "PT-46", "PT-48", "REQ-GIRO", "REQ-GIROHIST", "REQ-FV-ARIX", "LST-REQ-ARIX"],
  "AR-iii": ["PT-49", "PT-50", "PT-51", "PT-52", "PT-53", "PT-54", "PT-55", "PT-56", "PT-57", "PT-59", "PT-60", "PT-61", "REQ-FV-COL", "LST-REQ-COL",
    "UA-PT-addcase", "UA-PT-addcol", "UA-PT-addalloc"],
  "CCI": ["CON-GIRO", "SCH-PER", "JOB-DAILYINV", "INV-PDF"],
  "BSU": ["ALC-DELTA", "UA-SUG-match", "UA-INV-newalloc", "UA-REQ-newalloc"]
};
const EL = Object.fromEntries(Object.entries(ELEMENT_MODULE).flatMap(([m, ids]) => ids.map(id => [id, m])));
const KEY = Object.fromEntries(Object.entries(CODE).map(([k, c]) => [c, k]));

// AR request fields: in every record producer = shared (AR-00); in one producer = that form's module.
const PRODUCERS = [[RECORD_PRODUCER, "AR-i"], [RECORD_PRODUCER_ARIX, "AR-ix"], [RECORD_PRODUCER_COL, "AR-iii"]];
function reqFieldModule(col) {
  const f = TABLES.requests.fields.find(x => x.name === col); if (!f) return "AR-00";
  const in_ = PRODUCERS.filter(([p]) => p.variables.includes(f.key)).map(([, m]) => m);
  return in_.length === 1 ? in_[0] : "AR-00";
}

export function moduleOf(id) {
  if (EL[id]) return EL[id];
  let m;
  if (id.startsWith("WS-")) return "UIX";
  if (/^BSU-\d+$/.test(id)) return "BSU";
  if ((m = id.match(/^REQ\.([a-z0-9_.]+)$/))) return reqFieldModule(m[1]);
  if ((m = id.match(/^([A-Z][A-Z0-9]*)\./)) && TABLE_MODULE[m[1]]) return TABLE_MODULE[m[1]];
  if ((m = id.match(/^(LST|RP|HDR|FRM)-([A-Z][A-Z0-9]*)$/)) && TABLE_MODULE[m[2]]) return TABLE_MODULE[m[2]];
  if ((m = id.match(/^RL-([A-Z][A-Z0-9]*)-([A-Z][A-Z0-9]*)$/))) {
    if (["ALC", "SUG"].includes(m[2])) return "BSU";
    if (m[1] === "REQ") return CHILD_OF_REQ[m[2]] || "AR-00";
    return TABLE_MODULE[m[1]] || null;
  }
  if ((m = id.match(/^UA-([A-Z]+)-/)) && TABLE_MODULE[m[1]]) return TABLE_MODULE[m[1]];
  return null;
}

// ---------- the module index (status) ----------
function modules() {
  const md = readFileSync(join(ROOT, "docs/modules/README.md"), "utf8");
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\| \[([A-Za-z0-9-]+)\]\([^)]+\) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/);
    if (m) rows.push({ code: m[1], name: m[2].replace(/\*\*/g, "").split(":")[0].trim(), status: m[4].trim() });
  }
  return rows;
}

// Inside each module: AR portal forms, AR workspace, then Data and logic (owner, 2026-11-19).
const SIDES = [
  ["AR portal forms", [["Catalogue, record producers and portal widgets", id => /^PT-|^UA-PT-/.test(id)]]],
  ["AR workspace", [["Lists, record pages and forms", id => /^(LST|RP|HDR|FRM|REQ-FV)-|^WS-/.test(id)], ["Related lists", id => /^RL-/.test(id)],
    ["UI actions", id => /^UA-/.test(id)], ["Panels, tabs and other workspace items", id => /^(REQ-(ACT|GIRO|GIROHIST|ATT)|CON-GIRO|SCH-PER|INV-PDF|ALC-DELTA|BSU-\d+)$/.test(id)]]],
  ["Data and logic", [["Tables and fields", id => /^[A-Z][A-Z0-9]*\.[a-z]/.test(id)], ["Jobs and other items", () => true]]]
];

export function build() {
  const notes = allNotes().filter(n => n.text && !/RETIRED/.test(n.text));
  const seen = new Set(), tasks = [];
  for (const n of notes) { if (seen.has(n.id)) continue; seen.add(n.id); tasks.push({ ...n, module: moduleOf(n.id) }); }
  const unmapped = tasks.filter(t => !t.module).map(t => t.id);
  const mods = modules(), listed = mods.filter(m => LISTED.includes(m.status));
  const count = code => tasks.filter(t => t.module === code).length;
  const sideOf = id => SIDES.findIndex(([, kinds]) => kinds.some(([, test]) => test(id)));
  const split = code => [0, 1, 2].map(i => tasks.filter(t => t.module === code && sideOf(t.id) === i).length);
  const one = t => `- [ ] \`${t.id}\` ${t.text.replace(/\s+/g, " ").replace(/^UI action: /, "")}`;

  let md = `# Developer task list (ServiceNow build)

<!-- Generated by tools/devtasks.mjs from js/schema.js, js/notes.js and docs/modules/README.md. Do not edit by hand: change the source and run node tools/check.mjs. -->

The build tasks for the ServiceNow scoped app \`x_ar\`, one per build-note ID, grouped by module. Each line is
the ID and what to build. Inside each module the tasks are split into **AR portal forms** (what the project
team sees), **AR workspace** (what the AR team uses) and **Data and logic** (tables, fields and jobs both use). Specs: \`docs/modules/<CODE>/README.md\`; full mapping: \`SERVICENOW_MAPPING.md\`;
all IDs: \`docs/BUILD_NOTES.md\`.

**Only signed-off modules are listed.** A module's tasks appear here when its status in
[\`docs/modules/README.md\`](modules/README.md) is *Agreed* or *Ready for build*. Until then it shows under
*Waiting for sign-off* with its task count, because its screens may still change.

**This file is regenerated on every check**, so ticks made here are lost. Track progress in a copy, or raise one
GitHub issue per module and paste its section there.

## Setup (before any module)

- [ ] Scoped application \`x_ar\` (Receivables Desk) on App Engine; all tables are custom tables in the scope (D1),
  except the customer's company, a reference to \`core_company\` (D26).
- [ ] Roles \`x_ar.project_team\` (portal only) and \`x_ar.ar_team\` (workspace only) (D3).
- [ ] System property for GST 9% (D25).
- [ ] Assignment group *Accounts Receivable*.

## Modules

| Module | Status | AR portal forms | AR workspace | Data and logic | Tasks |
|---|---|---|---|---|---|
${mods.map(m => `| ${m.code} | ${m.status} | ${split(m.code).join(" | ")} | ${LISTED.includes(m.status) ? `[${count(m.code)}](#${m.code.toLowerCase()})` : `${count(m.code)} (waiting for sign-off)`} |`).join("\n")}

`;
  if (!listed.length) md += `## Waiting for sign-off

No module is *Agreed* yet, so no tasks are listed. They appear here, grouped by module, once the client signs a
module off on the live demo.
`;
  for (const m of listed) {
    md += `\n## ${m.code}\n\n${m.name}. Spec: \`docs/modules/${m.code}/README.md\`.\n`;
    for (const [side, kinds] of SIDES) {
      let part = "";
      for (const [kind, test] of kinds) {
        const ts = tasks.filter(t => t.module === m.code && !t.done && test(t.id));
        ts.forEach(t => { t.done = true; });
        if (ts.length) part += `\n#### ${kind}\n\n${ts.map(one).join("\n")}\n`;
      }
      if (part) md += `\n### ${side}\n${part}`;
    }
  }
  return { md, unmapped };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { md, unmapped } = build();
  writeFileSync(join(ROOT, "docs/DEV_TASKS.md"), md);
  if (unmapped.length) console.warn(`devtasks: no module for ${unmapped.join(", ")} (add it to tools/devtasks.mjs)`);
}
