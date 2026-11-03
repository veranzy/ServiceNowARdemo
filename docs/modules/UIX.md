# UIX — Workspace aligned to the Horizon Design System

**Status:** In prototype
**Persona(s):** AR team (workspace). The project team portal is unchanged.
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → *AR team · Workspace*

## Purpose

Make the AR team workspace look and behave like what the build team will produce with ServiceNow's
out-of-box workspace templates, so the client signs off on a realistic screen. Reference: the
Horizon Design System workspace guidance at https://horizon.servicenow.com/workspace/overview.

## Decisions

| # | Question | Decision | Date |
|---|---|---|---|
| 1 | Scope | **Workspace only.** The portal keeps its Employee Center look. | 2026-11-03 |
| 2 | App shell | Unified navigation header (navy), app navigation on the left (icon rail), workspace tabs below the header: one primary tab (not closable) plus closable record tabs. | 2026-11-03 |
| 3 | List page | Horizon **list page template**: list menu on the left, list on the right; the menu selection drives the list. The menu can be hidden (hidden by default on phones). | 2026-11-03 |
| 4 | Record page | Horizon **Record page template**: header (name, description, label-value pairs, form record presence, UI action bar with overflow menu) › **ribbon** of metric widgets (collapsible) › **resizable pane**: record tabs on the left, **contextual side bar** on the right. | 2026-11-03 |
| 5 | Record tabs | Order per Horizon: **Details** (the form) first, then related items (e.g. *Billing hierarchy*, *Billing periods*), then **one tab per related list**. Beyond 5 tabs (2 on phones) the rest go into a *More* menu. | 2026-11-03 |
| 6 | Contextual side bar | Vertical icon tabs, open by default, collapsible, resizable by dragging its left edge. AR request: **Customer setup**, **Activity** (stream + composer), **Attachments**. Opens on Customer setup while setup is pending, otherwise Activity. Other tables have no side bar for now. | 2026-11-03 |
| 7 | UI action bar | Main actions as buttons; secondary and destructive ones (Request info, Reject, Cancel invoice, Add billing contact) in the overflow menu (⋯), as in the template's defaults. | 2026-11-03 |
| 8 | Header vs ribbon | Header label-value pairs hold identity (state, customer, contract, department, people, dates). Money and progress move to the ribbon (request value, lines done, setup done; amount due; open AR / overdue; billed vs contract value; periods due). | 2026-11-03 |
| 10 | Theme | Use the **ServiceNow default workspace theme**; no custom or branded theme. The prototype's colours approximate it. (Open question 1, answered by the owner.) | 2026-11-03 |
| 11 | Record history | A **Record history** tab on **every** record page, last in the tab order: when, who, field, old value, new value, newest first, plus a *Record created* row. Needs Audit turned on for every `x_ar_` table. (Open question 3, answered by the owner.) | 2026-11-03 |
| 9 | Foundations | Fonts **Cabin** (headers, titles) and **Lato** (body). Corner radius 2 px (badges) / 6 px (buttons, inputs) / 8 px (containers). Spacing scale 2, 4, 8, 12, 16, 24, 40 px: card padding 16, gaps between cards 8, between form fields 12, between form columns 24. Type sizes header 24 / section 20 / sub 16. | 2026-11-03 |

## User stories

- As the client, I want the prototype workspace to look like the delivered ServiceNow workspace, so that
  what I sign off is what I get.
- As an AR team member, I want the customer setup checklist and activity beside the record form, so
  that I can work the case without scrolling past them.
- As an AR team member, I want related lists as tabs, so that long records stay readable.

## Screens and flow

1. **Landing page**: greeting header, single-score cards, aging chart, new requests, overdue invoices.
2. **Lists** (rail icon): list menu left, list right; *Lists* button re-opens a hidden menu.
3. **Record page**: header with presence avatar and action bar (⋯ for more), ribbon (chevron collapses
   it), tabs, side bar (click an icon to switch; click the open icon or the panel icon to collapse;
   drag the divider to resize). On screens under 900 px the side bar moves below the tabs with its
   icons in a row.

## ServiceNow mapping

| Item | Build |
|---|---|
| App shell | Workspace experience in UI Builder with the standard tabbed app shell (Next Experience unified navigation + app navigation + workspace tabs). Build note IDs `WS-01`, `WS-03`, `WS-05`. |
| List page | Out-of-box list page template: List menu (\`sys_ux_list_menu_config\`, categories and lists with conditions; audience by role) + List component. `WS-04`, `WS-16`, `LST-*`. |
| Record page | Out-of-box **Record** page template (not Record Vertical). Header + highlighted values (`HDR-*`), form record presence (`WS-15`), UI action bar via workspace action configuration with *overflow* set per action (`WS-11`), ribbon widgets per table (`WS-12`), tabs (`WS-13`), contextual side bar (`WS-14`). |
| Ribbon widgets | Per table, from record and related-table data resources: see the ribbon list in decision 8. Up to 12 widgets per row. |
| Side bar (AR request) | Customer setup = custom UI Builder component or a guided checklist (`REQ-SETUP`); Activity = activity stream component (`REQ-ACT`); Attachments = attachments panel (`REQ-ATT`). |
| Theme | **Default workspace theme** (decision 10): no custom theme record; the workspace uses the instance default (Next Experience / Horizon). The prototype's colours are approximations. |
| Record history | Out-of-box Record history tab on the Record page template (`WS-17`), reading `sys_audit` / `sys_history_set`. **Dictionary: set Audit = true on every `x_ar_` table** (or list them in `glide.ui.audit_deleted_tables` / audit properties as the instance requires). Shows created, field changes with old and new values, who and when. |

## Out of scope / later

- Portal restyle (decision 1).
- Playbooks, Record Vertical template, presence of other users.
- Exact colour tokens: the Horizon colour pages couldn't be read from here; colours follow the default
  theme by eye (navy header, dark primary buttons, teal links).

## Open questions

1. ~~Default theme or a branded one?~~ Answered: default workspace theme (decision 10).
2. Which side bar tools does AR want on invoices, customers and other records? (Owner; decided later, tracked in [GitHub issue #1](https://github.com/veranzy/ServiceNowARdemo/issues/1).)
3. ~~Record history tab on every record?~~ Answered: yes (decision 11).

## Change log

| Date | Change |
|---|---|
| 2026-11-03 | Module created: workspace aligned to Horizon app shell, list page template and Record page template; Cabin / Lato, radius and spacing scale. New IDs `WS-11` (UI action bar), `WS-12` (ribbon), `WS-13` (record tabs), `WS-14` (contextual side bar), `WS-15` (presence), `WS-16` (list page template). `WS-04` (list menu) now sits inside the list page. `REQ-SETUP`, `REQ-ACT`, `REQ-ATT` moved into the side bar. No IDs retired. |
| 2026-11-03 | Owner answers: default workspace theme (decision 10); Record history tab on every record (decision 11, new ID `WS-17`; the prototype logs every data change like `sys_audit`); side panel tools for other records left open in GitHub issue #1. |
