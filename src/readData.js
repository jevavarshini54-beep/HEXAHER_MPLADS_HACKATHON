import * as XLSX from "xlsx";
const DATA_PATH = "/data/Lok-Sabha-Data/";

async function loadExcelFile(fileName) {
  const response = await fetch(`${DATA_PATH}${fileName}`);

  if (!response.ok) {
    throw new Error(`Could not load ${fileName}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {type: "array",});
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {defval: null,});
}

function cleanWorkId(id) {
  if (!id) return "";

  let value = String(id).trim();
  value = value.replace(/\s+/g, "");
  const match = value.match(/^(WS\/MP\d+\/\d{4}-\d{4}\/\d+)/);

  return match ? match[1] : value;
}

export async function loadWorksSanctioned() {
  return loadExcelFile("Works Sanctioned_Lok.xlsx");
}

export async function loadExpenditure() {
  return loadExcelFile("Expenditure on Completed and On-going Works as on Date_Lok.xlsx");
}

export async function loadWorksCompleted() {
  return loadExcelFile("Works Completed_Lok.xlsx");
}

export async function loadCombinedWorks() {
  const [sanctioned, expenditure, completed] = await Promise.all([
    loadWorksSanctioned(),loadExpenditure(),loadWorksCompleted(),
  ]);

  const expenditureMap = {};

  expenditure.forEach((row) => {
    const id = cleanWorkId(row["Work ID"]);

    if (!id) return;
    if (!expenditureMap[id]) {
      expenditureMap[id] = {totalDisbursed: 0,vendors: new Set(),};
    }

    const amount =
      Number(row["Fund Disbursed Amount ( ₹ )"]) || 0;

    expenditureMap[id].totalDisbursed += amount;

    if (row["Vendor Name"]) {
      expenditureMap[id].vendors.add(String(row["Vendor Name"]).trim());
    }
  });

  const completedMap = {};
  completed.forEach((row) => {
    const id = cleanWorkId(row["Work"]);

    if (!id) return;

    completedMap[id] = {
      completionDate: row["Completion Date"],
      amountDisbursed:Number(row["Amount Disbursed ( ₹ )"]) || 0,
    };
  });

  const combined = sanctioned.map((row) => {
    const id = cleanWorkId(row["Work ID"]);
    const exp = expenditureMap[id];
    const comp = completedMap[id];
    const sanctionedAmount =Number(row["Sanction Amount ( ₹ )"]) || 0;
    const totalDisbursed = exp?.totalDisbursed || 0;
    const spendingPercentage =sanctionedAmount > 0 ? (totalDisbursed / sanctionedAmount) * 100 : 0;

    return {
      workId: id,
      state: row["State"],
      mpName: row["Hon'ble Members of Parliament"],
      constituency: row["Constituency"],
      workDescription: row["Work description"],
      recommendedDate: row["Recommended date"],
      sanctionDate: row["Sanction Date"],
      sanctionedAmount,
      status: row["Work Status"],
      totalDisbursed,
      spendingPercentage,
      completionDate: comp?.completionDate || null,
      completedAmount: comp?.amountDisbursed || 0,
      vendors: exp ? Array.from(exp.vendors) : [],

      hasExpenditure: !!exp,
      isCompleted: !!comp,
    };
  });

  return combined;
}