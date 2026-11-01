// Demo dataset: customers, contracts, invoices and payments loaded on start.
import { S } from "./state.js";
import { DAY, cents, today, uid } from "./util.js";
import { depositId } from "./bsu.js";
import { render } from "./views/app.js";

// Sample dates are authored as if "today" were SAMPLE_AS_OF, then shifted so the demo
// always looks current (same mix of current, due-soon and overdue invoices).
const SAMPLE_AS_OF = "2026-10-24";
function shiftDate(iso) {
  if (!iso) return iso;
  const days = Math.round((today - new Date(SAMPLE_AS_OF + "T00:00:00")) / DAY);
  const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + days);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function loadSample() {
  const users = [
    ["u_ar1", "Daniel Lim", "ar", "AR specialist", "Finance"],
    ["u_ar2", "Siti Rahman", "ar", "AR specialist", "Finance"],
    ["u_pm1", "Priya Nair", "project", "Project manager", "Digital"],
    ["u_pm2", "Marcus Wong", "project", "Project manager", "Logistics"]
  ];
  const cus = [
    ["harb","Harbourline Logistics Pte Ltd","",["HARBOURLINE LOGISTICS PTE"],30,60000,""],
    ["meri","Meridian Foods Pte Ltd","",[],30,40000,""],
    ["kest","Kestrel Engineering Sdn Bhd","",["KESTREL ENGG SDN BHD"],30,150000,"Malaysian entity; pays in SGD from a Singapore account."],
    ["tanj","Tanjong Retail Group","",[],30,15000,"POS retainer billed on the 12th of each month."],
    ["orch","Orchid Clinics Pte Ltd","",[],30,10000,"Raises credit notes for SLA downtime and deducts them from payments."],
    ["nova","Novabay Software Pte Ltd","",["NOVABAY SW"],30,60000,""],
    ["bws","Brightwater Hotels (Sentosa) Pte Ltd","Brightwater Hospitality Holdings",[],30,25000,"Group treasury pays for all Brightwater hotels in one transfer."],
    ["bwo","Brightwater Hotels (Orchard) Pte Ltd","Brightwater Hospitality Holdings",[],30,25000,"Group treasury pays for all Brightwater hotels in one transfer."],
    ["lume","Lumen Print Studio","",[],14,5000,"Sole proprietorship owned by Lionel Tan; sometimes pays from his personal account."],
    ["paci","Pacific Crest Marine Pte Ltd","",[],30,80000,""]
  ];
  const ctr = [
    ["harb","HL-2026-01","Warehouse management services","2026-04-01","2027-03-31",149760,"Monthly",30,0,0,""],
    ["harb","HL-2026-02","Freight audit","2026-07-01","2026-12-31",20000,"Time & materials",30,0,0,""],
    ["meri","MF-2025-07","Cold-chain monitoring subscription","2025-07-01","2027-06-30",34902,"Milestone",30,0,0,"Billed quarterly in arrears."],
    ["kest","KE-2026-03","Plant retrofit design","2026-03-01","2027-02-28",120000,"Milestone",30,1,30,""],
    ["tanj","TR-2026-02","POS support retainer","2026-02-01","2027-01-31",52800,"Monthly",30,0,0,""],
    ["orch","OC-2026-01","Clinic scheduling licences","2026-01-01","2026-12-31",23760,"Monthly",30,0,0,"SLA credits are issued as credit notes."],
    ["nova","NB-2026-05","Data platform implementation","2026-05-01","2026-12-31",60000,"Milestone",30,0,0,""],
    ["bws","BW-S-2026","Guest Wi-Fi managed service","2026-01-01","2026-12-31",74880,"Monthly",30,0,0,""],
    ["bwo","BW-O-2026","Guest Wi-Fi managed service","2026-01-01","2026-12-31",69120,"Monthly",30,0,0,""],
    ["lume","LP-PO-0193","Event collateral printing","2026-09-01","2026-09-30",760,"Per PO",14,0,0,""],
    ["paci","PC-2026-02","Vessel telemetry rollout","2026-06-01","2027-05-31",54900,"Milestone",30,0,0,"Milestone 2 may be paid in two instalments by agreement."]
  ];
  const inv = [
    ["harb","HL-2026-01","INV-10041","2026-08-28","2026-09-27",12480,"Warehouse services, Aug 2026"],
    ["harb","HL-2026-02","INV-10042","2026-09-04","2026-10-04",3150,"Freight audit hours, Aug 2026"],
    ["meri","MF-2025-07","INV-10043","2026-09-05","2026-10-05",8725.5,"Monitoring subscription, Q3 2026"],
    ["kest","KE-2026-03","INV-10044","2026-09-10","2026-10-10",21600,"Milestone 2: detailed design"],
    ["tanj","TR-2026-02","INV-10045","2026-08-12","2026-09-11",4400,"Retainer, Aug 2026"],
    ["tanj","TR-2026-02","INV-10046","2026-09-12","2026-10-12",4400,"Retainer, Sep 2026"],
    ["orch","OC-2026-01","INV-10047","2026-09-15","2026-10-15",1980,"Licences, Sep 2026"],
    ["nova","NB-2026-05","INV-10048","2026-09-18","2026-10-18",15000,"Milestone 3: data migration"],
    ["bws","BW-S-2026","INV-10049","2026-09-20","2026-10-20",6240,"Managed Wi-Fi, Sep 2026"],
    ["bwo","BW-O-2026","INV-10050","2026-09-20","2026-10-20",5760,"Managed Wi-Fi, Sep 2026"],
    ["lume","LP-PO-0193","INV-10051","2026-09-22","2026-10-06",760,"Event brochures"],
    ["meri","","INV-10052","2026-09-25","2026-10-25",2310,"Replacement temperature sensors"],
    ["kest","KE-2026-03","INV-10053","2026-09-28","2026-10-28",9850,"Milestone 3: tender drawings"],
    ["paci","PC-2026-02","INV-10054","2026-10-01","2026-10-31",18300,"Milestone 2: fleet installation"]
  ];
  const pay = [
    ["HARBOURLINE LOGISTICS PTE","2026-10-02",15630,"INV 10041/10042"],
    ["MERIDIAN FOODS PTE LTD","2026-10-05",8725.5,"PAYMENT INV-10043"],
    ["KESTREL ENGG SDN BHD","2026-10-09",21384,"INV10044 LESS 1% EARLY SETTLEMENT"],
    ["TANJONG RETAIL GRP","2026-10-11",4400,"OCT PAYMT"],
    ["ORCHID CLINICS","2026-10-13",1780,"INV-10047 LESS CREDIT NOTE CN-221"],
    ["BRIGHTWATER HOSPITALITY HLDGS","2026-10-16",12000,"SENTOSA+ORCHARD SEPT"],
    ["NOVABAY SW","2026-10-17",15000,"INV-1OO48"],
    ["L. TAN","2026-10-20",760,"LUMEN PRINT"],
    ["MERIDIAN FOODS PTE LTD","2026-10-21",2310,""],
    ["UNKNOWN REMITTER","2026-10-22",3500,"TRF 88213004"],
    ["PACIFIC CREST MARINE","2026-10-23",9150,"INV-10054 PART 1 OF 2"]
  ];
  const cid = {}, kid = {};
  const uens = { harb: "199804512G", meri: "200511234K", kest: "Malaysia SSM 1123456-X", tanj: "201002233N", orch: "201505566M", nova: "201809988D", bws: "200733445R", bwo: "200733446H", lume: "53312345W", paci: "201211122E" };
  S.customers = cus.map(r => { const c = { id: uid("c"), name: r[1], uen: uens[r[0]] || "", address: "", parent: r[2], aliases: r[3], terms: r[4], creditLimit: cents(r[5]), notes: r[6] }; cid[r[0]] = c; return c; });
  S.contracts = ctr.map(r => { const k = { id: uid("k"), customerId: cid[r[0]].id, number: r[1], title: r[2], start: shiftDate(r[3]), end: shiftDate(r[4]), value: cents(r[5]), billing: r[6], terms: r[7], discPct: r[8], discDays: r[9], notes: r[10] }; kid[r[1]] = k; return k; });
  S.invoices = inv.map(r => ({ id: uid("i"), customerId: cid[r[0]].id, contractId: r[1] ? kid[r[1]].id : null, customer: cid[r[0]].name, number: r[2], date: shiftDate(r[3]), due: shiftDate(r[4]), amount: cents(r[5]), desc: r[6], currency: "SGD", state: "issued", requestId: null }));
  S.users = users.map(r => ({ id: r[0], name: r[1], team: r[2], title: r[3], department: r[4] }));
  // Company bank accounts (BSU): [key, bank, number, name, department, type]
  const accts = [
    ["mbRev", "MB", "072-104521-6", "AR collections", "Finance", "revenue"],
    ["mbDep", "MB", "072-118830-1", "Project deposits – Engineering", "Engineering", "deposit"],
    ["obRev", "OB", "601-337204-001", "Revenue SGD", "Finance", "revenue"],
    ["usDep", "US", "451-302-118-7", "Retention and deposits – Marine", "Marine", "deposit"],
    ["usOps", "US", "451-302-990-2", "Operating", "Finance", "operating"]
  ];
  const aid = {};
  S.bankAccounts = accts.map(r => { const a = { id: uid("b"), bank: r[1], number: r[2], name: r[3], department: r[4], accountType: r[5], currency: "SGD" }; aid[r[0]] = a; return a; });
  // Past statements already uploaded: deposits grouped into one BSU upload per account per day.
  const payAcct = ["mbRev", "obRev", "mbRev", "obRev", "mbRev", "obRev", "mbRev", "obRev", "mbRev", "obRev", "usDep"];
  S.uploads = []; S.deposits = [];
  const ups = {};
  let upNo = 1000;
  pay.forEach((r, n) => {
    const a = aid[payAcct[n]], date = shiftDate(r[1]), key = a.id + date;
    let up = ups[key];
    if (!up) { up = ups[key] = { id: uid("u"), number: "BSU" + String(++upNo).padStart(7, "0"), bankAccountId: a.id, statementDate: date, fileName: `${a.bank}_${a.number.replace(/\D/g, "")}_${date.replace(/-/g, "")}.csv`,
      uploadedBy: n % 2 ? "u_ar2" : "u_ar1", uploadedAt: shiftDate(r[1]).slice(0, 10) + " 09:1" + (n % 10), depositCount: 0, depositTotal: 0, skippedCount: n % 3 === 0 ? 1 : 0 }; S.uploads.push(up); }
    up.depositCount++; up.depositTotal += cents(r[2]);
    S.deposits.push({ id: uid("p"), number: depositId(a, date, up.depositCount), bankAccountId: a.id, uploadId: up.id, date, payer: r[0], amount: cents(r[2]), reference: r[3], bankRef: "", currency: "SGD" });
  });
  // uploads are made the morning after the statement day
  for (const u of S.uploads) { const d = new Date(u.statementDate + "T00:00:00"); d.setDate(d.getDate() + 1); u.uploadedAt = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) + u.uploadedAt.slice(10); }
  S.bsu = { acctId: S.bankAccounts[0].id, date: "", text: "", fileName: "", parsed: null, error: "" };
  S.matches = {}; S.pick = {}; S.isSample = true;

  // AR request cases raised by the project team: [key, by, customer, contract, billing, title, amount, opened, state, assigned, invoiceNo, periodFrom, periodTo, po, details, activity]
  const invByNo = n => S.invoices.find(i => i.number === n);
  const req = [
    ["r1","u_pm1","kest","KE-2026-03","Milestone","Milestone 3: tender drawings",9850,"2026-09-24","invoiced","u_ar1","INV-10053","","","KE-PO-7781","Client signed off tender drawings on 22 Sep.",
      [["2026-09-24","u_pm1","system","Submitted from the AR form on the portal."],["2026-09-25","u_ar1","system","Assigned to Daniel Lim."],["2026-09-28","u_ar1","comment","Invoice INV-10053 was issued, due in 30 days."]]],
    ["r2","u_pm2","paci","PC-2026-02","Milestone","Milestone 2: fleet installation",18300,"2026-09-29","invoiced","u_ar2","INV-10054","","","","Installation completed on all 6 vessels. Customer agreed to pay in two instalments.",
      [["2026-09-29","u_pm2","system","Submitted from the AR form on the portal."],["2026-09-30","u_ar2","work_note","Instalments agreed per contract notes; issuing a single invoice."],["2026-10-01","u_ar2","comment","Invoice INV-10054 was issued."]]],
    ["r3","u_pm1","nova","NB-2026-05","Milestone","Milestone 4: dashboards and handover",15000,"2026-10-20","in_progress","u_ar1","","","","NB-PO-2210","Handover workshop held on 19 Oct; acceptance email attached.",
      [["2026-10-20","u_pm1","system","Submitted from the AR form on the portal."],["2026-10-21","u_ar1","system","Assigned to Daniel Lim."],["2026-10-21","u_ar1","work_note","Checking acceptance email against milestone criteria before invoicing."]]],
    ["r4","u_pm2","harb","HL-2026-01","Monthly fee","Warehouse management services, monthly fee",12480,"2026-10-23","new","","","","","","Monthly fee for the rest of the contract. Please bill on the 28th of each month.",
      [["2026-10-23","u_pm2","system","Submitted from the AR form on the portal."]]],
    ["r5","u_pm1","tanj","TR-2026-02","Other","Replacement POS terminals (2 units)",1800,"2026-10-22","new","","","","","TR-PO-5521","Two terminals replaced at the Jurong store after water damage.",
      [["2026-10-22","u_pm1","system","Submitted from the AR form on the portal."]]],
    ["r6","u_pm1","orch","OC-2026-01","Monthly fee","Clinic scheduling licences, Oct 2026",1980,"2026-10-18","awaiting_info","u_ar2","","2026-10-01","2026-10-31","","",
      [["2026-10-18","u_pm1","system","Submitted from the AR form on the portal."],["2026-10-19","u_ar2","system","Assigned to Siti Rahman."],["2026-10-19","u_ar2","comment","Should the SLA credit note CN-221 (SGD 200) be deducted on this invoice, or was it already taken on the September payment?"]]],
    ["r7","u_pm2","meri","","Other","Install 12 additional temperature sensors",3600,"2026-10-10","rejected","u_ar1","","","","","Customer asked for extra sensors in the new cold room.",
      [["2026-10-10","u_pm2","system","Submitted from the AR form on the portal."],["2026-10-12","u_ar1","comment","This work isn't covered by contract MF-2025-07. Please raise a change order with the customer first, then submit a new AR form referencing it."],["2026-10-12","u_ar1","system","State changed to Rejected."]]]
  ];
  // AR-i details per request: [type, department, contract location, extra fields]
  const ari = {
    r1: ["adhoc", "Engineering", "on_file"], r2: ["adhoc", "Marine", "on_file"], r3: ["adhoc", "Digital", "repository", { contractLocationRef: "https://docs.example/contracts/NB-2026-05" }],
    r4: ["recurring", "Logistics", "on_file", { frequency: "monthly", firstBillDate: "2026-10-28", lastBillDate: "" }],
    r5: ["adhoc", "Digital", "on_file"], r6: ["adhoc", "Healthcare", "on_file"], r7: ["adhoc", "Logistics", "physical", { contractLocationRef: "Finance registry, cabinet 3" }]
  };
  S.requests = req.map(r => {
    const inv = r[10] ? invByNo(r[10]) : null;
    const rec = { id: r[0], number: "ARQ" + String(1000 + +r[0].slice(1)).padStart(7, "0"), requestedBy: r[1], customerId: cid[r[2]].id, contractId: r[3] ? kid[r[3]].id : null,
      billingType: r[4], title: r[5], amount: cents(r[6]), opened: shiftDate(r[7]), updated: shiftDate(r[15][r[15].length - 1][0]), state: r[8], assignedTo: r[9] || null,
      invoiceId: inv ? inv.id : null, periodStart: shiftDate(r[11]), periodEnd: shiftDate(r[12]), poNumber: r[13], details: r[14], invoiceDate: "", attachments: r[0] === "r3" ? ["Acceptance email - Novabay.pdf"] : [],
      activity: r[15].map(a => ({ at: shiftDate(a[0]) + "T09:00:00", by: a[1], kind: a[2], text: a[3] })) };
    const [type, dept, loc, extra] = ari[r[0]];
    Object.assign(rec, { form: "AR-i", requestType: type, department: dept, newCustomer: false, contractLocation: loc, contractLocationRef: "", scheduleId: null }, extra || {});
    if (rec.firstBillDate) rec.firstBillDate = shiftDate(rec.firstBillDate);
    rec.activity.forEach(a => { if (a.text === "Submitted from the AR form on the portal.") a.text = `Submitted from AR-i (${{ first: "1st AR request", adhoc: "Ad-hoc AR", recurring: "Recurring AR" }[type]}) on the portal.`; });
    if (inv) inv.requestId = rec.id;
    return rec;
  });
  // A new customer's first AR-i, waiting for AR to link it to the customer master
  S.requests.push({ id: "r8", number: "ARQ0001008", form: "AR-i", requestType: "first", department: "Digital", requestedBy: "u_pm1", customerId: null, contractId: null,
    newCustomer: true, newCustName: "Zephyr Data Centres Pte Ltd", newCustUen: "201912345K", newCustAddress: "8 Tampines Industrial Ave 5, #04-01, Singapore 528763",
    billToName: "Alicia Koh", billToEmail: "finance@zephyrdc.example", billToPhone: "+65 6123 4567", billToAddress: "Accounts Payable, 8 Tampines Industrial Ave 5, Singapore 528763",
    contractLocation: "attached", contractLocationRef: "", billingType: "Milestone", title: "Design phase: data hall cooling assessment", amount: cents(24000), poNumber: "ZDC-PO-0042",
    docContract: "Zephyr - signed services agreement.pdf", docAcra: "Zephyr - ACRA business profile.pdf", docBillingForm: "Zephyr - billing contact form (Digital).pdf",
    details: "First project with Zephyr. Signed agreement attached.", invoiceDate: "", periodStart: "", periodEnd: "", state: "new", assignedTo: null, invoiceId: null, scheduleId: null,
    opened: shiftDate("2026-10-24"), updated: shiftDate("2026-10-24"), attachments: [],
    activity: [{ at: shiftDate("2026-10-24") + "T08:40:00", by: "u_pm1", kind: "system", text: "Submitted from AR-i (1st AR request) on the portal." }] });

  // Billing contacts per customer per department (D11)
  const ct = [
    ["harb", "Logistics", "Grace Teo", "ap@harbourline.example", "+65 6311 2040", "Harbourline Logistics, Accounts Payable, 21 Penjuru Road, Singapore 609142"],
    ["harb", "Advisory", "Ravi Shankar", "ravi.s@harbourline.example", "+65 6311 2077", "Harbourline Logistics, Strategy Office, 21 Penjuru Road, Singapore 609142"],
    ["kest", "Engineering", "Nur Aisyah", "ap@kestrel-eng.example", "+60 3 7722 1100", "Kestrel Engineering Sdn Bhd, Finance, Petaling Jaya, Malaysia"],
    ["tanj", "Digital", "Kelvin Ong", "accounts@tanjongretail.example", "+65 6255 8899", "Tanjong Retail Group, Finance, 3 Jurong Gateway Road, Singapore 608532"],
    ["orch", "Healthcare", "Dr Mei Lin Chua", "admin@orchidclinics.example", "+65 6733 1200", "Orchid Clinics, 10 Sinaran Drive, Singapore 307506"],
    ["nova", "Digital", "Samuel Tan", "finance@novabay.example", "+65 6100 2200", "Novabay Software, 1 Fusionopolis Way, Singapore 138632"],
    ["paci", "Marine", "Hafiz Rahman", "accounts@pacificcrest.example", "+65 6265 3300", "Pacific Crest Marine, 50 Tuas South Ave 1, Singapore 637315"],
    ["meri", "Logistics", "Joanne Lee", "ap@meridianfoods.example", "+65 6862 4400", "Meridian Foods, 9 Senoko Way, Singapore 758049"],
    ["bws", "Facilities", "Hotel Finance (Sentosa)", "finance.sentosa@brightwater.example", "+65 6275 0001", "Brightwater Hospitality Holdings, Treasury, 1 Harbourfront Walk, Singapore 098585"],
    ["bwo", "Facilities", "Hotel Finance (Orchard)", "finance.orchard@brightwater.example", "+65 6275 0002", "Brightwater Hospitality Holdings, Treasury, 1 Harbourfront Walk, Singapore 098585"],
    ["lume", "Advisory", "Lionel Tan", "lionel@lumenprint.example", "+65 9123 4567", "Lumen Print Studio, 51 Ubi Ave 1, Singapore 408933"]
  ];
  S.contacts = ct.map(r => ({ id: uid("t"), customerId: cid[r[0]].id, department: r[1], name: r[2], email: r[3], phone: r[4], address: r[5], requestId: null }));
  // Customer documents on file (D10): [customer, type, file, contract, department, received]
  const dc = [
    ["harb", "acra", "Harbourline - ACRA profile.pdf", "", "", "2026-03-28"], ["harb", "contract", "HL-2026-01 signed.pdf", "HL-2026-01", "", "2026-03-28"], ["harb", "billing_form", "Harbourline - billing form (Logistics).pdf", "", "Logistics", "2026-03-28"],
    ["kest", "acra", "Kestrel - SSM registration.pdf", "", "", "2026-02-20"], ["kest", "contract", "KE-2026-03 signed.pdf", "KE-2026-03", "", "2026-02-20"], ["kest", "billing_form", "Kestrel - billing form (Engineering).pdf", "", "Engineering", "2026-02-20"],
    ["tanj", "acra", "Tanjong - ACRA profile.pdf", "", "", "2026-01-25"], ["tanj", "contract", "TR-2026-02 signed.pdf", "TR-2026-02", "", "2026-01-25"], ["tanj", "billing_form", "Tanjong - billing form (Digital).pdf", "", "Digital", "2026-01-25"],
    ["nova", "acra", "Novabay - ACRA profile.pdf", "", "", "2026-04-22"], ["nova", "contract", "NB-2026-05 signed.pdf", "NB-2026-05", "", "2026-04-22"], ["nova", "billing_form", "Novabay - billing form (Digital).pdf", "", "Digital", "2026-04-22"],
    ["paci", "acra", "Pacific Crest - ACRA profile.pdf", "", "", "2026-05-20"], ["paci", "contract", "PC-2026-02 signed.pdf", "PC-2026-02", "", "2026-05-20"], ["paci", "billing_form", "Pacific Crest - billing form (Marine).pdf", "", "Marine", "2026-05-20"],
    ["orch", "acra", "Orchid Clinics - ACRA profile.pdf", "", "", "2025-12-15"], ["orch", "contract", "OC-2026-01 signed.pdf", "OC-2026-01", "", "2025-12-15"],
    ["meri", "acra", "Meridian Foods - ACRA profile.pdf", "", "", "2025-06-20"], ["meri", "contract", "MF-2025-07 signed.pdf", "MF-2025-07", "", "2025-06-20"]
  ];
  let dn = 1000;
  S.documents = dc.map(r => ({ id: uid("d"), number: "DOC" + String(++dn).padStart(7, "0"), customerId: cid[r[0]].id, docType: r[1], fileName: r[2], contractId: r[3] ? kid[r[3]].id : null, department: r[4], requestId: null, received: shiftDate(r[5]) }));
  for (const k of Object.values(kid)) if (S.documents.some(d => d.contractId === k.id)) { k.contractLocation = "on_file"; k.contractLocationRef = "Customer documents"; }
  // A running billing schedule: Tanjong POS retainer, monthly on the 12th; Aug and Sep already invoiced
  const tsch = { id: "s1", number: "SCH0001001", customerId: cid.tanj.id, contractId: kid["TR-2026-02"].id, department: "Digital", desc: "POS support retainer", frequency: "monthly", amount: cents(4400),
    firstDate: shiftDate("2026-08-12"), lastDate: kid["TR-2026-02"].end, requestId: null };
  S.schedules = [tsch];
  for (const [no, d] of [["INV-10045", "2026-08-12"], ["INV-10046", "2026-09-12"]]) { const i = invByNo(no); i.scheduleId = tsch.id; i.periodDate = shiftDate(d); }
  S.ui.ws = { main: { kind: "home" }, tabs: [], active: "main", listMenu: false, q: "", composer: {} };
  S.ui.portal = { page: "home", id: null, draft: null, errors: {} };
  S.status = null;
  render();
}
