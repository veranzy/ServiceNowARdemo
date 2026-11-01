// Demo dataset: customers, contracts, invoices and payments loaded on start.
import { S } from "./state.js";
import { DAY, cents, today, uid } from "./util.js";
import { render } from "./views/cash.js";
import { setStatus } from "./views/shell.js";

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
  S.customers = cus.map(r => { const c = { id: uid("c"), name: r[1], parent: r[2], aliases: r[3], terms: r[4], creditLimit: cents(r[5]), notes: r[6] }; cid[r[0]] = c; return c; });
  S.contracts = ctr.map(r => { const k = { id: uid("k"), customerId: cid[r[0]].id, number: r[1], title: r[2], start: shiftDate(r[3]), end: shiftDate(r[4]), value: cents(r[5]), billing: r[6], terms: r[7], discPct: r[8], discDays: r[9], notes: r[10] }; kid[r[1]] = k; return k; });
  S.invoices = inv.map(r => ({ id: uid("i"), customerId: cid[r[0]].id, contractId: r[1] ? kid[r[1]].id : null, customer: cid[r[0]].name, number: r[2], date: shiftDate(r[3]), due: shiftDate(r[4]), amount: cents(r[5]), desc: r[6], currency: "SGD" }));
  S.selCust = null; S.form = null;
  S.payments = pay.map(r => ({ id: uid("p"), payer: r[0], date: shiftDate(r[1]), amount: cents(r[2]), reference: r[3], currency: "SGD" }));
  S.matches = {}; S.pick = {}; S.isSample = true;
  setStatus("info", "Sample data loaded: 10 customers, 11 contracts, 14 invoices and 11 payments covering exact, multi-invoice, discount, short-pay, typo, parent-company, partial and unidentified cases. Press Run auto-match.");
  render();
}
