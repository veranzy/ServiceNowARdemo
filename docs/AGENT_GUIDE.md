# Guide for reader agents: raising tickets

Reader agents **read the repo and raise GitHub issues**; they never edit files, push or comment on behalf of
the owner. Claude in the repo is the only writer: it triages each ticket ([`ENHANCEMENT_SOP.md`](ENHANCEMENT_SOP.md)),
asks the owner, builds and reports back on the issue. Start with [`README.md`](README.md).

## Before you raise a ticket

1. **Search open and closed issues** for the same point. Comment on an existing issue instead of opening a duplicate.
2. **Find the module** in [`modules/README.md`](modules/README.md) and read its spec, `DECISIONS.md` and `OPEN_QUESTIONS.md`.
3. **Check the Lock column.** If the part is locked, still raise the ticket, but say so: the owner must unlock it first.
4. **Check decisions.** If your point reverses a decision (module decision or D-number), name it: *"reverses AR-ix decision 19"*.
   Never ask for auto-matching (D5) or a "payment" record (D7): those are standing decisions.
5. **Check the demo** (links in [`README.md`](README.md)). Some points describe what the prototype already does.
6. **Find the build-note ID** of each element: turn on **Show IDs** in the demo bar, or look it up in
   [`BUILD_NOTES.md`](BUILD_NOTES.md). Fields are `<TABLE CODE>.<column>`, e.g. `REQ.giro_type`.

## Which template

| Template | Use for | Label |
|---|---|---|
| **Enhancement set** | Changes to something that exists (a screen, field, rule). One batch per issue. | `enhancement` |
| **Requirement** | A new form, module or feature (e.g. AR-iii, AR-iv, AR-v Collections forms). | `requirement` |
| **Doc inconsistency** | Spec, mapping, build notes and demo disagree. | `doc-inconsistency` |
| **Question** | Something unclear that needs the owner's answer. | `question` |

Add the **module label** too (`AR-00`, `AR-i`, `AR-iii`, `AR-ix`, `CCI`, `BSU`, `UIX`).

## How to write it

- **One point per line**, numbered. One change per point.
- **Quote the screen's words exactly** (labels, buttons, choices) and give the new wording exactly. The builder
  never invents or "tidies" labels (CLAUDE.md, *Labels and logic: confirm first*).
- Give the **build-note ID** and the **demo link** (page URLs like `#/portal/form/AR-ix`, `#/ws/requests/ARQ0001008`).
- Say **why** in the Context section: who uses it, an example.
- For rules, write **when … then …**: *When Purpose is Carpark, then the reference field is hidden.*
- Mark what is **not decided** as a question rather than guessing.
- **Sanitise first** with [`MOCK_COMPANY.md`](MOCK_COMPANY.md): the repo and demo are public. Translate real names, people,
  customers, UENs, banks, amounts and systems into the mock company before writing anything.
