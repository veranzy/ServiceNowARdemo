// Generates docs/DEV_TASKS.md: the developer task list for the ServiceNow build, one section per module.
// Run: node tools/devtasks.mjs (tools/check.mjs runs it). Source: js/schema.js, js/notes.js and the module index
// (docs/modules/README.md). Every module's tasks are generated as requirements are updated (owner, 2026-11-19).
// Add-only: tasks are never deleted; they are kept in the ledger docs/DEV_TASKS.json. A task whose item is retired or
// changed in the prototype gets the state Redundant (with its date); a changed item also gets a new task.
// Ticks ([x]) made in docs/DEV_TASKS.md are read back into the ledger (state Done), so they survive regeneration.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RECORD_PRODUCER, RECORD_PRODUCER_ARIX, RECORD_PRODUCER_COL, TABLES } from "../js/schema.js";
import { CODE, allNotes } from "../js/notes.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = join(ROOT, "docs/DEV_TASKS.json"), MD = join(ROOT, "docs/DEV_TASKS.md");
const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);   // Singapore date

// ---------- which module owns each build-note ID ----------
const TABLE_MODULE = { REQ: "AR-00", INV: "CCI", SCH: "CCI", CUS: "CCI", CON: "CCI", BCT: "CCI", DOC: "CCI", CMP: "CCI", CCT: "CCI", ACT: "CCI",
  RQL: "AR-i", RQI: "AR-i", CTX: "AR-iii", CAL: "AR-iii", C5L: "AR-iii", DEP: "BSU", BSU: "BSU", BNK: "BSU", ALC: "BSU", PMD: "BSU" };
const CHILD_OF_REQ = { RQL: "AR-i", RQI: "AR-i", INV: "AR-i", SCH: "AR-i", CTX: "AR-iii", CAL: "AR-iii", C5L: "AR-iii" };
const ELEMENT_MODULE = {
  "AR-00": ["PT-01", "PT-02", "PT-04", "PT-08", "PT-09", "PT-10", "PT-11", "PT-13", "PT-14", "PT-16", "PT-30", "REQ-ACT", "REQ-ATT",
    "UA-REQ-assign", "UA-REQ-post", "UA-REQ-save", "LST-REQ"],
  "AR-i": ["PT-03", "PT-05", "PT-07", "PT-15", "PT-19", "PT-20", "PT-23", "PT-25", "PT-27", "PT-28", "PT-29", "PT-36", "PT-37", "PT-39",
    "PT-40", "PT-41", "PT-42", "PT-43", "PT-62", "PT-63", "REQ-FV-ARI", "LST-REQ-ARI", "UA-PT-newcust", "UA-PT-additem"],
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

const clean = t => t.replace(/\s+/g, " ").replace(/^UI action: /, "");
const line = e => `\`${e.id}\` ${e.text}`;
const render = e => e.state === "redundant"
  ? `- ~~#${e.no} ${line(e)}~~ **Redundant ${e.redundantOn}**${e.why ? ` (${e.why})` : ""}`
  : `- [${e.state === "done" ? "x" : " "}] #${e.no} ${e.affects ? `(changes #${e.affects}) ` : ""}${line(e)}`;

// ---------- CSV for the developer and the BA (no git access; owner, 2026-11-19) ----------
const MOD_RE = "AR-00|AR-iii|AR-ix|AR-i|CCI|BSU|UIX";
/** Decision references in a note: "AR-i 43", "D31". A bare "decision 12" belongs to the task's module. */
export function decisionsOf(text, module) {
  const out = [];
  for (const m of text.matchAll(new RegExp(`\\b(?:(${MOD_RE}) )?decisions? (\\d+(?:\\s*(?:[–-]|,|and)\\s*\\d+)*)`, "g")))
    out.push(`${m[1] || module} ${m[2].replace(/\s*and\s*/g, ", ").replace(/\s+/g, " ")}`);
  for (const m of text.matchAll(/\bD(\d+)\b/g)) out.push(`D${m[1]}`);
  return [...new Set(out)].join("; ");
}
/** Short task text: a field gives table.column, label and type; anything else its first clause. */
function shortOf(e) {
  const fm = e.id.match(/^([A-Z][A-Z0-9]*)\.([a-z0-9_.]+)$/);
  if (fm && KEY[fm[1]] && TABLES[KEY[fm[1]]]) {
    const t = TABLES[KEY[fm[1]]], f = t.fields.find(x => x.name === fm[2]);
    if (!f) { const [col, type] = e.text.split(" · "); return `Field ${col} (${type || "?"})`; }
    return `Field ${t.table}.${f.name} "${f.label}" (${f.type}${f.ref ? ` → ${TABLES[f.ref]?.table || f.ref}` : ""}${f.mandatory ? ", mandatory" : ""}${f.readonly ? ", read-only" : ""}${f.choices && f.choices.length <= 8 ? `: ${[...new Set(f.choices.map(c => c[1]))].join(" / ")}` : ""})`;
  }
  let s = e.text; for (let k = 0; k < 3; k++) s = s.replace(/\s*\([^()]*\)/g, "");   // drop bracketed detail
  const cut = s.search(/\. (?=[A-Z])/);
  if (cut > 20) s = s.slice(0, cut);
  return s.length > 260 ? s.slice(0, 257).replace(/\s+\S*$/, "") + "…" : s;
}
const AREA = ["AR portal forms", "AR workspace", "Data and logic"];
const csvCell = v => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };

/** Returns the new ledger (old entries kept, new ones appended), the markdown and the CSV. Pure: writes nothing. */
export function build(ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : [], mdNow = existsSync(MD) ? readFileSync(MD, "utf8") : "") {
  const all = allNotes(), seen = new Set(), tasks = [];
  for (const n of all) { if (!n.text || /RETIRED/.test(n.text) || seen.has(n.id)) continue; seen.add(n.id); tasks.push({ ...n, text: clean(n.text), module: moduleOf(n.id) }); }
  const unmapped = tasks.filter(t => !t.module).map(t => t.id);
  const mods = modules();
  const sideOf = id => SIDES.findIndex(([, kinds]) => kinds.some(([, test]) => test(id)));
  const kindOf = id => SIDES.flatMap(([, kinds]) => kinds).find(([, test]) => test(id))[0];
  const split = code => [0, 1, 2].map(i => tasks.filter(t => t.module === code && sideOf(t.id) === i).length);

  // 0. ledger rows: { no, ref, type: task | redundant, module, id, text, added, state, affects, change, redundantOn, why }
  //    no = running number (never reused), ref = running index per module (e.g. AR-i-012). Rows are only appended.
  ledger = ledger.map(({ release, done, ...e }) => ({ type: "task", ...e, state: e.state || (done ? "done" : "todo") }));
  let next = Math.max(0, ...ledger.map(e => e.no || 0)) + 1;
  const perMod = {}; ledger.forEach(e => { if (e.ref) perMod[e.module] = Math.max(perMod[e.module] || 0, +e.ref.split("-").pop()); });
  const stamp = e => { if (!e.short) e.short = shortOf(e);   // frozen when the row is added, so old rows never change
    if (!e.no) e.no = next++; if (!e.ref) e.ref = `${e.module}-${String(perMod[e.module] = (perMod[e.module] || 0) + 1).padStart(3, "0")}`; return e; };
  ledger.forEach(stamp);
  // migration (2026-11-19): link changed tasks to the row they replace; give each removal its own row
  ledger.forEach((e, i) => { if (e.type !== "task" || e.state !== "redundant" || e.closedBy) return;
    const r = ledger.slice(i + 1).find(x => x.type === "task" && x.module === e.module && x.id === e.id);
    if (e.why === "replaced by a changed task" && r) { Object.assign(r, { change: "Changed", affects: e.no }); e.closedBy = r.no; }
    else { const ev = stamp({ type: "redundant", module: e.module, id: e.id, text: e.text, added: e.redundantOn, state: "todo", change: "Redundant", affects: e.no, why: e.why }); ledger.push(ev); e.closedBy = ev.no; } });
  // 1. ticks made in the markdown go back into the ledger
  const ticked = new Set([...mdNow.matchAll(/^- \[[xX]\] #\d+ (?:\(changes #\d+\) )?(.+)$/gm)].map(m => m[1]));
  ledger.forEach(e => { if (e.type === "task" && e.state === "todo" && ticked.has(line(e))) e.state = "done"; });
  // 2. add-only, every module. New item: a New row. Changed item: a Changed row that names the row it affects (the old
  //    task becomes Redundant). Removed item: a Redundant row that names the row it affects.
  const live = e => e.type === "task" && e.state !== "redundant";
  for (const t of tasks.filter(x => x.module)) {
    const cur = ledger.find(e => e.module === t.module && e.id === t.id && live(e));
    if (cur && cur.text === t.text) continue;
    const row = stamp({ type: "task", module: t.module, id: t.id, text: t.text, added: today(), state: "todo", change: cur ? "Changed" : "New", affects: cur?.no });
    if (cur) Object.assign(cur, { state: "redundant", redundantOn: today(), why: `replaced by #${row.no}`, closedBy: row.no });
    ledger.push(row);
  }
  for (const e of ledger.filter(live)) if (!tasks.some(t => t.id === e.id && t.module === e.module)) {
    const why = /RETIRED/.test(all.find(n => n.id === e.id)?.text || "") ? "retired in the prototype"
      : tasks.some(t => t.id === e.id) ? `moved to ${tasks.find(t => t.id === e.id).module}` : "removed from the prototype";
    const ev = stamp({ type: "redundant", module: e.module, id: e.id, text: e.text, added: today(), state: "todo", change: "Redundant", affects: e.no, why });
    Object.assign(e, { state: "redundant", redundantOn: today(), why: `${why}, see #${ev.no}`, closedBy: ev.no });
    ledger.push(ev);
  }
  ledger.forEach(e => { if (!e.change) e.change = "New"; });

  // CSV: one row per ledger row, in running order; the team copies new rows (No. above their last one) into their tracker
  const byNo = Object.fromEntries(ledger.map(e => [e.no, e]));
  const csvRows = [["No.", "Ref", "Module", "Area", "Item", "Build-note ID", "Task", "Decision", "Change", "Affects row", "Affects ref", "Date added", "State now"]];
  for (const e of [...ledger].sort((a, b) => a.no - b.no)) {
    const old = e.affects ? byNo[e.affects] : null;
    const task = e.type === "redundant" ? `Do not build / remove: ${e.short}${e.why ? ` (${e.why})` : ""}` : e.short;
    csvRows.push([e.no, e.ref, e.module, AREA[sideOf(e.id)] || "", kindOf(e.id), e.id, task, decisionsOf(e.text, e.module), e.change, e.affects || "", old?.ref || "",
      e.added, e.type === "redundant" ? "To do" : e.state === "redundant" ? `Redundant (see #${e.closedBy})` : e.state === "done" ? "Done" : "To do"]);
  }
  const csv = "﻿" + csvRows.map(r => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const withTasks = mods.filter(m => ledger.some(e => e.module === m.code));
  let md = `# Developer task list (ServiceNow build)

<!-- Generated by tools/devtasks.mjs from js/schema.js, js/notes.js, docs/modules/README.md and the ledger docs/DEV_TASKS.json. Do not edit by hand except to tick boxes: change the source and run node tools/check.mjs. -->

The build tasks for the ServiceNow scoped app \`x_ar\`, one per build-note ID, grouped by module. Each line is
the ID and what to build. Inside each module the tasks are split into **AR portal forms** (what the project
team sees), **AR workspace** (what the AR team uses) and **Data and logic** (tables, fields and jobs both use).
Specs: \`docs/modules/<CODE>/README.md\`; full mapping: \`SERVICENOW_MAPPING.md\`; all IDs: \`docs/BUILD_NOTES.md\`.

**Every module is listed, and tasks are added as requirements change.** The module's status (e.g. *Ready for build
(Release 1)* or *In prototype*) shows how settled its tasks are; see [\`docs/modules/README.md\`](modules/README.md).

**Add-only.** Tasks are never deleted. When an item changes in the prototype, its old task becomes
~~struck through~~ **Redundant** (with the date) and a new task is added; when an item is retired, its task becomes
Redundant. Tick a box (\`- [x]\`) when a task is done: ticks are kept when the file is regenerated.

**For the developer and the BA: [\`DEV_TASKS.csv\`](DEV_TASKS.csv)** (opens in Excel). One row per task with a running
**No.** (never reused) and a running **Ref** per module (e.g. \`AR-i-012\`). Rows are only ever added: copy the rows
whose No. is above your last one into your own tracker. A **Changed** row replaces the row named in *Affects row*;
a **Redundant** row says *Do not build / remove* for the row named in *Affects row*. Columns: No., Ref, Module, Area,
Item, Build-note ID, Task (short), Decision (module decision number, e.g. \`AR-i 43\`, or a cross-module \`D\` number),
Change (New / Changed / Redundant), Affects row, Affects ref, Date added, State now.

## Setup (before any module)

- [ ] Scoped application \`x_ar\` (Receivables Desk) on App Engine; all tables are custom tables in the scope (D1),
  except the customer's company, a reference to \`core_company\` (D26).
- [ ] Roles \`x_ar.project_team\` (portal only) and \`x_ar.ar_team\` (workspace only) (D3).
- [ ] System property for GST 9% (D25).
- [ ] Assignment group *Accounts Receivable*.

## Modules

| Module | Status | AR portal forms | AR workspace | Data and logic | Tasks |
|---|---|---|---|---|---|
${mods.map(m => { const n = ledger.filter(e => e.module === m.code && e.type === "task"), st = k => n.filter(e => e.state === k).length;
  return `| ${m.code} | ${m.status} | ${split(m.code).join(" | ")} | [${st("todo")} to do, ${st("done")} done, ${st("redundant")} redundant](#${m.code.toLowerCase()}) |`; }).join("\n")}

`;
  for (const m of withTasks) {
    md += `\n## ${m.code}\n\n${m.name}. Status: ${m.status}. Spec: \`docs/modules/${m.code}/README.md\`.\n`;
    const es = ledger.filter(e => e.module === m.code && e.type === "task");
    for (const [side, kinds] of SIDES) {
      let part = "";
      for (const [kind] of kinds) {
        const ts = es.filter(e => kindOf(e.id) === kind);
        if (ts.length) part += `\n#### ${kind}\n\n${ts.map(render).join("\n")}\n`;
      }
      if (part) md += `\n### ${side}\n${part}`;
    }
  }
  return { md, csv, ledger, unmapped };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { md, csv, ledger, unmapped } = build();
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n");
  writeFileSync(MD, md);
  writeFileSync(join(ROOT, "docs/DEV_TASKS.csv"), csv);
  if (unmapped.length) console.warn(`devtasks: no module for ${unmapped.join(", ")} (add it to tools/devtasks.mjs)`);
}
