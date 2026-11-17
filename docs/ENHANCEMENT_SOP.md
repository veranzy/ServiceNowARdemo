# Enhancement SOP: client enhancement tickets

How we take a client enhancement request from a GitHub issue to a change on the live demo.
It sits on top of the brief (`CLAUDE.md`: *Labels and logic: confirm first*, *Locks*, *Quality bar*)
and the git rules (`docs/GIT_WORKFLOW.md`). If this SOP and the brief disagree, the brief wins.

## Roles

| Role | Does |
|---|---|
| **Client** | Raises the request as a GitHub issue; walks through the result on the live demo. |
| **Owner** | Decides: unlocks / relocks parts, answers questions, gives exact wording, accepts or defers items. |
| **Builder** (Claude or a developer) | Triages, asks, builds, checks, ships, reports back on the issue. |

## Item status

Every point in a ticket becomes an item with one status:

| Status | Meaning |
|---|---|
| **New** | Logged, not yet triaged. |
| **Needs owner** | Blocked on the owner: a lock, a conflict with a decision, or a question. |
| **Ready** | Owner has answered; nothing blocks the build. |
| **Built** | Pushed to `main`; Check and Pages deploy green. |
| **Verified** | Owner or client checked it on the live demo. |
| **Already done** | The prototype already behaves this way; no change. |
| **Deferred** | Parked as an open question or a later issue (link it). |
| **Won't do** | Owner declined; reason recorded. |

## Steps

### 1. Intake
- The client or a **reader agent** ([`AGENT_GUIDE.md`](AGENT_GUIDE.md)) opens a GitHub issue with the label **`enhancement`**,
  one issue per batch, titled *Enhancement set <date>* (template: `.github/ISSUE_TEMPLATE/enhancement.md`), plus the module label.
- **Requirement** tickets (new forms or features, label `requirement`) follow the same steps; the triage file lists the
  proposed fields and rules, and the owner's answers become the module's first decisions. **Doc inconsistency** tickets
  are fixed at the source (`js/schema.js`, `js/notes.js` or the spec) and closed; **Question** tickets are answered by the
  owner and recorded as a decision or an open question.
- One point per line, naming the form or screen (e.g. *AR9*, *Contract*). Screenshots or build-note IDs
  (turn on **Show IDs** in the demo bar) help.

### 2. Triage (builder)
- Create `docs/enhancements/ENH-<issue number>.md` from the table in this SOP (see *Triage file*).
- Split the issue into numbered items **E<issue>.<n>** (e.g. E8.3), one change each. Quote the client's
  wording exactly.
- For each item record:
  - **Module** and the **build-note IDs** it touches (`js/notes.js`, field IDs `REQ.giro_…`).
  - **Lock**: check the *Lock* column in `docs/modules/README.md`. Touching a locked part (screen,
    behaviour or its docs, including shared code) means **Needs owner**.
  - **Decision conflict**: search the module's `DECISIONS.md` and `docs/DECISIONS.md`. A change that
    reverses a decision is allowed only as a new or amended, dated decision.
  - **Labels / logic** it changes, and any extra label or logic change it would force (list each).
  - **Questions**: anything ambiguous. Propose a recommended answer.
  - **Already done?** Check the live demo first; some points describe what the prototype already does.
- Post a short comment on the issue linking the triage file and listing what the owner must decide.
- Commit the triage file with the module prefix (e.g. `AR-ix: triage enhancement set #8`).

### 3. Owner decisions
- Owner unlocks what is needed: edit the *Lock* column with the date (e.g. *Portal form: Open
  (2026-11-17, Owner, for #8)*). Only the owner edits that column.
- Builder asks the questions, at most four at a time, multiple choice with a recommended option.
  Labels use the owner's exact wording; nothing is "tidied".
- Each answer becomes a **decision** (module `DECISIONS.md`, dated, quoting *E8.n*) or an **open
  question** (`OPEN_QUESTIONS.md`, with an owner) if deferred. Update the item's status in the triage file.

### 4. Build (builder)
- Build only **Ready** items. Follow the brief: `js/schema.js` for fields, `js/notes.js` for IDs, views for
  screens; spec (`README.md`), decisions, open questions and `CHANGELOG.md` in the **same commit**.
- One module per commit, prefix = module code, and reference the items: `AR-ix: E8.5–E8.7 …` with
  `Refs #8` in the body. Say which IDs were added or retired (IDs are never reused).
- If building shows another label or logic change is needed, stop and ask (back to step 3).

### 5. Check (builder)
- `node tools/check.mjs` passes.
- Serve locally (`python3 -m http.server`) and click through every changed path, plus the standard
  click-through in the brief. 400 px wide in dark mode, no horizontal scroll, no console errors.
- Demo data (`data/AR_form.csv`, `js/cases.js`) still loads and still shows each path.

### 6. Ship and report
- Push to `main`; both **Check** and **Deploy to GitHub Pages** must be green.
- Mark items **Built** in the triage file and comment on the issue: per item, the status, the commit and
  a demo link (page URLs from UIX decision 14, e.g. `#/portal/form/AR-ix`).

### 7. Verify and close
- Owner / client checks each item on the live demo → **Verified**, or reopens it with a comment.
- When every item is Verified, Already done, Deferred (linked) or Won't do: close the issue, add a line to
  `ROADMAP.md` → *Done*, and the owner relocks the part if wanted.
- If the module was walked through with the client, update *Status* in `docs/modules/README.md`.

## Triage file

`docs/enhancements/ENH-<n>.md` holds one table:

| Item | Client wording | Module · IDs | Lock | Conflicts | Proposed change | Questions | Status |
|---|---|---|---|---|---|---|---|

Below the table: *Owner decisions needed* (the lock and the questions, in order) and a *Log* of status
changes with dates and commits.
