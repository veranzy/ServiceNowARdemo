# Git workflow

Rules for every working session on this repo, human or Claude. The repo is the **single source of
truth** (CLAUDE.md): if it isn't committed and pushed to `main`, it doesn't exist. Every push to `main`
redeploys the live demo, so `main` must always be demo-ready.

## 1. Start of session (5 minutes)

1. **Get the latest `main`.** `git pull --ff-only origin main` (or a fresh clone). Never work from a
   copy you haven't just updated.
2. **Read** `CLAUDE.md`, then the index in `docs/modules/README.md` (status of every module).
3. **Check open GitHub issues** for parked questions (`gh api repos/veranzy/ServiceNowARdemo/issues`).
4. **Name the module** you are working on (`AR-i`, `CCI`, …) before changing anything. One session can
   touch several modules, but one change belongs to one module.
5. Run `node tools/check.mjs` once, so you start from a clean state.

## 2. Commit codes

Every commit subject starts with exactly one code:

| Code | Use for |
|---|---|
| `AR-00` | Shared AR form parts: catalogue, General information, My requests, ticket page, case states |
| `AR-i`, `AR-ix`, … | One AR form: its portal form and its workspace processing (one code per form number) |
| `CCI` | Customers, contracts and invoices |
| `BSU` | Bank statement upload and cash application |
| `UIX` | Workspace look and layout |
| `DOCS` | The brief (`CLAUDE.md`), this workflow, `docs/DECISIONS.md`, README, ROADMAP-only changes |
| `TOOLS` | `tools/`, `.github/`, checks and generators (no product change) |

A new module adds its code here and to `docs/modules/README.md` in the same commit that creates its folder.

## 3. What a commit looks like

```
AR-i: preferred invoice date becomes a day of the month

- REQ.preferred_invoice_date: Date → Integer (1–28); validation and summary updated
- New IDs: REQ.invoice_day. Retired IDs: none
- Decision 37; open question 19 answered
- Also: CCI (contract form label)
```

- **Subject:** `<CODE>: <what changed>`, imperative, at most 72 characters.
- **Body:** what changed, build-note IDs added and retired, decisions and open questions touched, and
  `Also: <CODE>` when a change unavoidably reaches into another module.
- **One change per commit, complete:** code + `js/schema.js` / `js/notes.js` + regenerated
  `SERVICENOW_MAPPING.md` and `docs/BUILD_NOTES.md` + the module's `CHANGELOG.md` (and `DECISIONS.md` /
  `OPEN_QUESTIONS.md` if touched) + a ROADMAP *Done* line when something ships. Never split the docs into
  a later "update docs" commit.
- **Small and often.** Commit after each change the owner asked for, not once at the end of a session.

## 4. Before every push

1. `node tools/check.mjs`: JS syntax, unregistered build-note IDs, generated docs in sync, module
   folders complete, no broken links in the docs. It regenerates the generated docs; commit them if they
   changed. Fix every error before pushing.
2. For a UI change, click through the affected flow (CLAUDE.md → *Checking changes*), including 400 px
   wide in dark mode, with no console errors.

## 5. Push and confirm

1. `git push origin main`. If rejected because `main` moved: `git pull --rebase origin main`, run the
   check again, then push.
2. Confirm both workflow runs pass: **Deploy to GitHub Pages** and **Check**
   (`gh run list -R veranzy/ServiceNowARdemo -L 4`). A red Check means `main` is broken: fix it next.

## 6. Never

- Never force-push or rewrite `main` history. Undo with `git revert <sha>` (commit `<CODE>: revert …`).
- Never commit real customer data, credentials or tokens: the repo and demo are public.
- Never commit scratch files, exports or `node_modules` (see `.gitignore`).
- Never edit the generated sections by hand (`SERVICENOW_MAPPING.md`, `docs/BUILD_NOTES.md`): change
  `js/schema.js`, `js/notes.js` or `tools/` and regenerate.
- Never renumber or reuse a build-note ID, a decision number or an open-question number.

## 7. Questions, issues and sign-off

- An open question lives in the module's `OPEN_QUESTIONS.md` with an owner. When it needs discussion
  outside the session, park it as a **GitHub issue** with the module code as its label and link it from
  the question (e.g. AR-i question 20 → issue #3).
- When the client signs a module off on the live demo: set its status to *Agreed* in
  `docs/modules/README.md`, commit, then tag that commit so the hand-over points at an exact version:
  `git tag signoff/<CODE>-<YYYY-MM-DD> && git push origin signoff/<CODE>-<YYYY-MM-DD>`.

## 8. End of session

1. Everything committed and pushed; `git status` clean; both workflow runs green.
2. The module's `CHANGELOG.md`, status in `docs/modules/README.md` and `ROADMAP.md` are current.
3. Tell the owner: commits pushed, IDs added / retired, questions still open, and the suggested next step
   with the questions it needs (CLAUDE.md → *How we work*, step 5).
