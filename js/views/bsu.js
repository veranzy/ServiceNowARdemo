// BSU upload form (AR workspace, BSU decision 16): opened with New on the Statement uploads list; preview, then save as an RITM.
import { acctById, acctLabel, yesterday } from "../bsu.js";
import { userById } from "../records.js";
import { BANKS, TABLES } from "../schema.js";
import { S } from "../state.js";
import { esc, fmt } from "../util.js";
import { icon, refLink, sn } from "./common.js";

const TYPE = Object.fromEntries(TABLES.bankAccounts.fields.find(f => f.key === "accountType").choices);
export const acctType = a => TYPE[a.accountType] || a.accountType;

export function bsuPage() {
  const b = S.bsu;
  if (!b.date) b.date = yesterday();
  const acct = acctById(b.acctId) || S.bankAccounts.find(a => a.active !== false);   // CCI decision 12: inactive accounts aren't offered
  if (acct && b.acctId !== acct.id) b.acctId = acct.id;
  const bank = acct ? BANKS[acct.bank] : null;
  const existing = acct ? S.uploads.filter(u => u.bankAccountId === acct.id && u.statementDate === b.date) : [];
  const p = b.parsed;
  return `<div class="page"${sn("BSU-01")}>
    <div class="pagehead"><div><h1 class="pt">Bank statement upload</h1><p class="psub">Load the previous day's CSV statement for each company bank account. Deposits are tagged with a Deposit ID and saved to the Bank statements table, ready for manual matching. Withdrawals are skipped.</p></div>
      <button type="button" class="btn" data-list="uploads:all">Statement uploads</button><button type="button" class="btn" data-list="deposits:unapplied">BSU deposits to match</button></div>

    <section class="card bsu-up"${sn("BSU-03")}>
      <header><h2>Upload a statement</h2></header>
      <div class="bsu-form">
        <label class="ffield"${sn("BSU.bank_account")}><span class="flabel"><i class="req">*</i>Bank account</span>
          <select id="bsuAcct">${S.bankAccounts.filter(a => a.active !== false || a.id === acct?.id).map(a => `<option value="${a.id}"${a.id === acct?.id ? " selected" : ""}>${esc(acctLabel(a))} · ${esc(a.name)}</option>`).join("")}</select>
          ${acct ? `<span class="fhelp">${esc(acct.department)} · ${esc(acctType(acct))}</span>` : ""}</label>
        <label class="ffield"${sn("BSU.statement_date")}><span class="flabel"><i class="req">*</i>Statement date</span><input type="date" id="bsuDate" value="${esc(b.date)}">
          ${existing.length ? `<span class="fhelp">Already uploaded for this day: ${existing.map(u => refLink("uploads", u.id, u.number)).join(", ")}</span>` : `<span class="fhelp">Usually yesterday.</span>`}</label>
        <div class="ffield wide"${sn("BSU-04")}><span class="flabel"><i class="req">*</i>Statement file (CSV)</span>
          <div class="row start"><label class="btn" for="bsuFile">${icon("upload", 16)} Choose CSV file</label><input type="file" id="bsuFile" accept=".csv,text/csv,text/plain" hidden>
            <button type="button" class="btn" data-bsu="sample"${sn("UA-BSU-sample")}>Use sample file</button>
            <button type="button" class="linkish small" data-bsu="download">Download a sample ${esc(bank?.name || "")} CSV</button></div>
          ${b.fileName ? `<span class="fhelp">Selected: <b>${esc(b.fileName)}</b></span>` : ""}
        </div>
      </div>
      ${bank ? `<details class="layout"${sn("BSU-05")}><summary>${esc(bank.name)} CSV layout</summary>
        <p class="small">Date format <span class="mono">${esc(bank.dateFmt)}</span>. Deposits are read from <b>${esc(bank.cols.credit)}</b>; rows with <b>${esc(bank.cols.debit)}</b> are skipped. Payer from <b>${esc(bank.cols.payer)}</b>, reference from <b>${esc(bank.cols.reference)}</b>.</p>
        <p class="small mono wrapcode">${bank.header.map(esc).join(", ")}</p></details>` : ""}
      ${b.error ? `<div class="notice err" role="alert"><span class="grow">${esc(b.error)}</span></div>` : ""}
      ${p ? `<div class="bsu-preview"${sn("BSU-06")}>
        <div class="row"><h3>Preview</h3><span class="small"><b>${p.deposits.length}</b> deposit${p.deposits.length === 1 ? "" : "s"} · <b class="mono">SGD ${fmt(p.total)}</b> · ${p.skipped.length} withdrawal${p.skipped.length === 1 ? "" : "s"} skipped</span></div>
        <div class="tablewrap"><table><thead><tr><th${sn("DEP.deposit_id")}>Deposit ID</th><th>Value date</th><th>Payer</th><th>Reference</th><th class="num">Amount</th></tr></thead><tbody>
          ${p.deposits.map(d => `<tr><td class="mono small">${esc(d.depositId)}</td><td>${esc(d.date)}</td><td>${esc(d.payer)}</td><td class="wrap"><span class="mono small">${esc(d.reference || "—")}</span></td><td class="num">${fmt(d.amount)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">No deposits in this file.</td></tr>`}
        </tbody></table></div>
        ${p.skipped.length ? `<details><summary class="small">Skipped withdrawals (${p.skipped.length})</summary><ul class="small">${p.skipped.map(s => `<li>${esc(s.date)} · ${esc(s.payer)} ${esc(s.reference)} · ${fmt(s.amount)}</li>`).join("")}</ul></details>` : ""}
        <div class="row start"><button type="button" class="btn primary" data-bsu="save"${p.deposits.length ? "" : " disabled"}${sn("UA-BSU-save")}>Save ${p.deposits.length} deposit${p.deposits.length === 1 ? "" : "s"} to bank statements</button><button type="button" class="btn" data-bsu="discard">Discard</button></div>
      </div>` : ""}
    </section>

  </div>`;
}
