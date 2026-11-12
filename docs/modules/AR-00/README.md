# AR-00 — AR forms: shared parts

**Status:** In prototype
**Persona(s):** Project team (portal); AR team (workspace, case basics)
**Demo:** https://veranzy.github.io/ServiceNowARdemo/ → *Project team · Portal* → AR forms, My requests, any ticket

Files in this folder: this spec, [DECISIONS.md](DECISIONS.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md),
[CHANGELOG.md](CHANGELOG.md).

## Purpose

The project team asks Accounts Receivable for work through a catalogue of **16 AR forms, AR-i to
AR-xvi**. This module holds what every form shares: the catalogue, the **General information** section,
the case they create, **My requests** and the **ticket page**. Each form then has its own module named
after its number: [AR-i](../AR-i/README.md) New AR request, [AR-ix](../AR-ix/README.md) GIRO
authorisation; AR-ii … AR-xvi get a module each when the owner defines them.

## Context: AR forms and master data are separate on purpose (D22)

AR forms (AR-i, AR-ix, …) and customer / contract updates are **deliberately separate**. A form is a
request; it never changes customer or contract data by itself. AR changes the master data in the
workspace (Link to customer, Link contract, Activate / Remove GIRO). Each form only *reads* what the
master data says. This creates some scenarios the build must handle:

| Scenario | What happens |
|---|---|
| AR-i on a contract **with GIRO active** | AR-i shows GIRO = **Yes**, greyed out. It can't be changed on AR-i. |
| AR-i on a contract **without GIRO**, and the customer wants GIRO | AR-i shows GIRO = **No**, greyed out, with a tooltip: raise an **AR-ix**. The two forms are separate cases. |
| AR-i for a **new contract** or **no contract** | GIRO = No (a contract that doesn't exist yet can't have GIRO). After AR creates the contract from the AR-i, an AR-ix can add GIRO. |
| AR-ix for a contract **not on file yet** | AR processes the contract's **AR-i first**, then links the AR-ix to the new contract (AR-ix module). |
| GIRO changes **after** an AR-i is submitted | The AR-i keeps the value it had at submit (`giro_on_contract` is a snapshot); the contract shows the current status. |
| Bill-to or contract details change | Only through AR in the workspace (D16), never by editing a past form. |

## User stories

- As a project manager, I want one catalogue of AR forms, so that I know where to ask AR for anything.
- As a project manager, I want my name, email and department filled in on every form, so that I don't
  retype them.
- As a project manager, I want to CC colleagues on a request, so that they can follow it on the portal.
- As a project manager, I want to see my requests and the ones I'm CC'd on, and reply on the ticket, so
  that I can answer AR's questions in one place.

## Screens and flow

**Portal**
1. *AR forms* catalogue (`PT-14`): 16 tiles. Active forms: AR-i (`PT-15`), AR-ix. The rest show
   "To be defined" (`PT-16`).
2. Every form starts with **General information** (`PT-30`, D19): requester name (default: current user),
   email (SSO, read-only), requesting department (tooltip: change only when requesting for another
   department), **department sub-BU** (choices depend on the department; changing the department clears it),
   CC list (emails, comma-separated).
3. Submit (`PT-09`) creates one `x_ar_request` case (state New) and shows a confirmation.
4. **My requests** (`PT-10`): cases the user raised **or is CC'd on** (tagged *CC*).
5. **Ticket page** (`PT-11`, `PT-13`): read-only field summary, attachments and the conversation
   (comments only). A requester reply while *Awaiting info* sets the case back to *In progress*. Each form
   adds its own block (AR-i: lines with their invoice / schedule; AR-ix: GIRO outcome `PT-35`).

**Workspace** (case basics shared by every form; form-specific actions are in each form's module)
- AR request case states: New, In progress, Awaiting info, Billed (AR-i), Completed (non-billing forms such
  as AR-ix), Rejected. Actions *Assign to me*, *Request info*, *Reject*; activity stream with comments
  (visible on the portal), work notes (AR only) and system entries.

## ServiceNow mapping

| Item | Build |
|---|---|
| Portal catalogue | Service catalog category "AR forms" (`PT-14`) with 16 record producers (AR-i … AR-xvi) on `x_ar_request`; AR-ii … AR-xvi inactive until defined. Each producer sets `ar_form`. |
| General information | Variable set (`PT-30`) on every AR form producer: `requester_name`, `requester_email`, `department`, `department_sub_bu`, `cc_list`. The producer script copies `cc_list` to the case `watch_list`. |
| Case table | `x_ar_request`, field `ar_form` says which form raised it; `state` choices New / In progress / Awaiting info / Billed (`invoiced`) / Completed / Rejected; journal fields `comments`, `work_notes`. |
| My requests | Portal list widget on `x_ar_request` where `opened_by = me` or `watch_list` contains me; CC'd cases tagged *CC*. |
| Ticket page | Standard ticket conversation widget (comments only), ticket fields widget, attachments. Business rule: requester comment while *Awaiting info* → *In progress*. |
| ACL | Project team reads own cases; CC'd users (watch list) read the case and its comments; only the requester and AR edit. |
| Departments | 11 operational departments (`DEPARTMENTS` in `js/schema.js`); sub-BU list per department (mock until the client supplies it). |

## Out of scope / later

- AR-ii … AR-xvi content (each becomes its own module when defined).
- Automation after submission (assignment, notifications, SLAs): to be defined by the owner.
