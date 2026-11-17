---
name: raise-ticket
description: Use when a reader agent wants to ask for a change, report a doc mismatch or ask a question about the Receivables Desk prototype: research the repo, then open one well-formed GitHub issue from the right template. Never edits files.
---

# Raise a ticket (reader agents)

You read; you never edit, commit or push. Follow `docs/AGENT_GUIDE.md`.

0. Sanitise the input with `docs/MOCK_COMPANY.md`: no real company, people, customers, UENs, banks or systems in the ticket.
1. Read `docs/README.md` to find the module, then its `README.md`, `DECISIONS.md`, `OPEN_QUESTIONS.md`.
2. Check the Lock column in `docs/modules/README.md` and `docs/DECISIONS.md` for any decision the point reverses.
3. Search issues first: `gh api "repos/veranzy/ServiceNowARdemo/issues?state=all&per_page=100" --jq '.[]|[.number,.state,.title]|@tsv'`.
   If one covers it, add a comment there instead.
4. Look up build-note IDs in `docs/BUILD_NOTES.md` and field names in `SERVICENOW_MAPPING.md`.
5. Pick the template in `.github/ISSUE_TEMPLATE/` (enhancement, requirement, doc-inconsistency, question) and fill every
   section: one point per line, exact screen wording, build-note ID, demo link, *when … then …* for rules, open points as
   questions. Sample data only.
6. Create it with the template's type label and the module label:
   `gh api repos/veranzy/ServiceNowARdemo/issues -f title="…" -F body=@body.md -f "labels[]=enhancement" -f "labels[]=AR-ix"`.
7. Report the issue link. Do not start building: Claude in the repo triages it under `docs/ENHANCEMENT_SOP.md`.
