# UIX — Workspace aligned to the Horizon Design System

**Status:** In prototype
**Persona(s):** AR team (workspace). The project team portal is unchanged.
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → *AR team · Workspace*

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md).

## Purpose

Make the AR team workspace look and behave like what the build team will produce with ServiceNow's
out-of-box workspace templates, so the client signs off on a realistic screen. Reference: the
Horizon Design System workspace guidance at https://horizon.servicenow.com/workspace/overview.

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
