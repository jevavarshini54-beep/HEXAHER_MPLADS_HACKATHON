import * as XLSX from "xlsx";
const DATA_PATH = `${import.meta.env.BASE_URL}data/Lok-Sabha-Data/`;

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

// Keep only the actual MPLADS Work ID
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

//EXPENDITURE DATA
  const expenditureMap = {};

  expenditure.forEach((row) => {
    const id = cleanWorkId(row["Work ID"]);

    if (!id) return;

    if (!expenditureMap[id]) {
      expenditureMap[id] = {
        totalExpenditure: 0,
        vendors: new Set(),
        paymentCount: 0,
        latestExpenditureDate: null,
      };
    }

    const amount = Number(row["Fund Disbursed Amount ( ₹ )"]) || 0;
    expenditureMap[id].totalExpenditure += amount;
    expenditureMap[id].paymentCount += 1;

    if (row["Vendor Name"]) {
      expenditureMap[id].vendors.add(String(row["Vendor Name"]).trim());
    }

    if (row["Expenditure Date"]) {
      expenditureMap[id].latestExpenditureDate = row["Expenditure Date"];
    }
  });

//COMPLETED DATA
  const completedMap = {};

  completed.forEach((row) => {
    const id = cleanWorkId(row["Work"]);

    if (!id) return;

    completedMap[id] = {
      completionDate: row["Completion Date"],
      completedAmountDisbursed: Number(row["Amount Disbursed ( ₹ )"]) || 0,
    };
  });

//COMBINE USING SANCTIONED AS BASE
  const combined = sanctioned.map((row) => {

    const id = cleanWorkId(row["Work ID"]);
    const exp = expenditureMap[id];
    const comp = completedMap[id];
    const sanctionedAmount = Number(row["Sanction Amount ( ₹ )"]) || 0;
    const expenditureAmount = exp? exp.totalExpenditure : 0;
    const completedAmountDisbursed = comp?.completedAmountDisbursed || 0;
    const effectiveExpenditure = expenditureAmount > 0 ? expenditureAmount : completedAmountDisbursed;
    const spendingPercentage = sanctionedAmount > 0 ? (effectiveExpenditure / sanctionedAmount) * 100 : 0;

    return {
      //Identification
      workId: id,
      state: row["State"],
      mpName: row["Hon'ble Members of Parliament"],
      constituency: row["Constituency"],
      workCategory: row["Work category"],
      workDescription: row["Work description"],

      //Dates
      recommendedDate: row["Recommended date"],
      sanctionDate: row["Sanction Date"],
      completionDate: comp?.completionDate || null,
      latestExpenditureDate: exp?.latestExpenditureDate || null,

      //Money
      sanctionedAmount,
      expenditureAmount,
      completedAmountDisbursed,
      effectiveExpenditure,
      spendingPercentage,

      //Status
      status: row["Work Status"],
      isCompleted: !!comp,

      //Expenditure information
      hasExpenditure: !!exp,
      paymentCount: exp?.paymentCount || 0,
      vendors: exp ? Array.from(exp.vendors) : [],
      vendorCount: exp?.vendors.size || 0,

      //Data quality
      financialMismatch: !!comp && expenditureAmount > 0 && completedAmountDisbursed > 0 &&
      Math.abs(expenditureAmount - completedAmountDisbursed) > 1,
    };
  });

  return combined;
}

export async function calculateRiskScores(works) {
  const BATCH_SIZE = 100;
  const allScoredWorks = [];

  for (let i = 0; i < works.length; i += BATCH_SIZE) {
    const batch = works.slice(i, i + BATCH_SIZE);

    console.log(
      `Sending risk batch ${Math.floor(i / BATCH_SIZE) + 1}...`
    );

    const response = await fetch("http://localhost:5000/api/risk-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Risk API error:", errorText);

      throw new Error("Could not calculate risk scores");
    }

    const scoredBatch = await response.json();

    console.log("BACKEND RESPONSE:", scoredBatch);

    // Backend should return an array
    if (!Array.isArray(scoredBatch)) {
      throw new Error("Risk Engine did not return an array");
    }

    allScoredWorks.push(...scoredBatch);
  }

  console.log(
    "ALL RISK SCORES RECEIVED:",
    allScoredWorks.length
  );

  return allScoredWorks;
}