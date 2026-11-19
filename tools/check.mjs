// Pre-push check (docs/GIT_WORKFLOW.md §4). Run: node tools/check.mjs   (CI: node tools/check.mjs --ci)
// 1. JS syntax  2. literal build-note IDs are registered  3. generated docs regenerated and in sync
// 4. every module folder is complete and listed in the index  5. relative links in the docs resolve
// 6. drift: field / build-note IDs quoted in module specs exist in the schema and the registry (warning)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CI = process.argv.includes("--ci");
const errors = [], warnings = [];
const walk = (dir, ext) => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  if (n === ".git" || n === "node_modules") return [];
  return statSync(p).isDirectory() ? walk(p, ext) : ext.some(e => n.endsWith(e)) ? [p] : [];
});
const rel = p => relative(ROOT, p);

// 1. Syntax
const scripts = [...walk(join(ROOT, "js"), [".js"]), ...walk(join(ROOT, "tools"), [".mjs"])];
for (const f of scripts) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { errors.push(`Syntax error in ${rel(f)}: ${String(e.stderr).split("\n").slice(0, 4).join(" ")}`); }
}

// 2. Build-note IDs written literally in the views: sn("ID") and related-list { id: "RL-…" }
const { noteText } = await import(join(ROOT, "js/notes.js"));
for (const f of walk(join(ROOT, "js"), [".js"])) {
  const src = readFileSync(f, "utf8");
  const ids = [...src.matchAll(/sn\("([^"]+)"\)/g), ...src.matchAll(/\{ ?id: "(RL-[A-Z0-9]+-[A-Z0-9]+)"/g)].map(m => m[1]);
  for (const id of new Set(ids)) if (noteText(id) === null) errors.push(`Unregistered build-note ID ${id} in ${rel(f)} (add it to js/notes.js)`);
}

// 3. Generated docs
const GEN = ["SERVICENOW_MAPPING.md", "docs/BUILD_NOTES.md", "docs/DEV_TASKS.md"];
const before = GEN.map(f => existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), "utf8") : "");
for (const tool of ["tools/notes.mjs", "tools/mapping.mjs", "tools/devtasks.mjs"]) {
  try { execFileSync(process.execPath, [join(ROOT, tool)], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }); }
  catch (e) { errors.push(`${tool} failed: ${String(e.stderr).split("\n")[0]}`); }
}
GEN.forEach((f, i) => {
  if (readFileSync(join(ROOT, f), "utf8") !== before[i]) {
    (CI ? errors : warnings).push(CI ? `${f} is out of date: run node tools/check.mjs locally, then commit` : `${f} was regenerated: commit it with your change`);
  }
});

// 3b. Dev task list: every active build-note ID must belong to a module (tools/devtasks.mjs)
{ const { build } = await import(join(ROOT, "tools/devtasks.mjs")); const { unmapped } = build();
  if (unmapped.length) warnings.push(`Dev tasks: no module for ${unmapped.join(", ")}: add them to tools/devtasks.mjs`); }

// 4. Module folders
const MOD = join(ROOT, "docs/modules");
const PARTS = ["README.md", "DECISIONS.md", "OPEN_QUESTIONS.md", "CHANGELOG.md"];
const index = readFileSync(join(MOD, "README.md"), "utf8");
for (const code of readdirSync(MOD).filter(n => statSync(join(MOD, n)).isDirectory())) {
  for (const p of PARTS) if (!existsSync(join(MOD, code, p))) errors.push(`docs/modules/${code}/ is missing ${p}`);
  if (code !== "_TEMPLATE" && !index.includes(`](${code}/README.md)`)) errors.push(`Module ${code} is not in the index table in docs/modules/README.md`);
}
for (const f of readdirSync(MOD).filter(n => n.endsWith(".md") && n !== "README.md")) errors.push(`docs/modules/${f}: module docs live in a folder (docs/modules/<CODE>/)`);

// 5. Relative links in Markdown, and old flat module paths (docs/modules/<CODE>.md) anywhere
const STALE = /docs\/modules\/(?!README\.md)[A-Za-z0-9_-]+\.md/;
for (const f of [...walk(ROOT, [".md", ".js", ".mjs", ".css", ".yml"])].filter(f => !f.endsWith("tools/check.mjs"))) {
  const hit = readFileSync(f, "utf8").match(STALE);
  if (hit) errors.push(`Old module path ${hit[0]} in ${rel(f)}: use docs/modules/<CODE>/README.md`);
}
for (const f of walk(ROOT, [".md"])) {
  const src = readFileSync(f, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of src.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    if (!existsSync(resolve(dirname(f), target))) errors.push(`Broken link in ${rel(f)}: ${m[1]}`);
  }
}

// 6. Drift: field and build-note IDs quoted in module specs must exist in js/schema.js / js/notes.js
//    (lines that mention "retired" or are struck through are skipped). Warning only: the spec or the code needs fixing.
{
  const { TABLES } = await import(join(ROOT, "js/schema.js"));
  const { CODE } = await import(join(ROOT, "js/notes.js"));
  const cols = {}; for (const [k, t] of Object.entries(TABLES)) cols[CODE[k]] = new Set(t.fields.map(f => f.name));
  const byTable = Object.fromEntries(Object.entries(TABLES).map(([k, t]) => [t.table, CODE[k]]));
  for (const code of readdirSync(MOD)) {
    const f = join(MOD, code, "README.md"); if (code === "_TEMPLATE" || !existsSync(f)) continue;
    readFileSync(f, "utf8").split("\n").forEach((line, n) => {
      if (/retir|~~/i.test(line)) return;
      const at = `docs/modules/${code}/README.md:${n + 1}`;
      for (const m of line.matchAll(/`([A-Z][A-Z0-9]{1,3})\.([a-z_][a-z0-9_.]*)`/g)) { const c = cols[m[1]]; if (c && !c.has(m[2].split(".")[0]) && noteText(`${m[1]}.${m[2]}`) === null) warnings.push(`Drift: ${at} quotes ${m[1]}.${m[2]}, not in js/schema.js`); }
      for (const m of line.matchAll(/`(x_ar_[a-z_]+)\.([a-z_]+)`/g)) { const c = cols[byTable[m[1]]]; if (c && !c.has(m[2])) warnings.push(`Drift: ${at} quotes ${m[1]}.${m[2]}, not in js/schema.js`); }
      for (const m of line.matchAll(/`((?:PT|UA|CSH|REQ|RL|CON|CUS|INV|BSU|LST|WS|DEP|SCH)-[A-Za-z0-9-]+)`/g)) if (noteText(m[1]) === null) warnings.push(`Drift: ${at} quotes build-note ID ${m[1]}, not registered in js/notes.js`);
    });
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `\n${errors.length} error(s). Fix before pushing.` : `\nCheck passed (${scripts.length} scripts${warnings.length ? `, ${warnings.length} warning(s)` : ""}).`);
process.exit(errors.length ? 1 : 0);
