import * as XLSX from "xlsx";
const DATA_PATH = "/data/Lok-Sabha-Data/";

async function loadExcelFile(fileName) {
  const response = await fetch(`${DATA_PATH}${fileName}`);

  if (!response.ok) {
    throw new Error(`Could not load ${fileName}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {type: "array",});
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(firstSheet, {defval: null,});
}

//Works Sanctioned
export async function loadWorksSanctioned() {
  return loadExcelFile("Works Sanctioned_Lok.xlsx");
}

//Expenditure
export async function loadExpenditure() {
  return loadExcelFile("Expenditure on Completed and On-going Works as on Date_Lok.xlsx");
}

//Works Completed
export async function loadWorksCompleted() {
  return loadExcelFile("Works Completed_Lok.xlsx");
}