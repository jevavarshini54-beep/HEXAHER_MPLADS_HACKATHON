import { useEffect } from "react";
import {loadWorksSanctioned,loadExpenditure,loadWorksCompleted,} from "./readData";
import { loadCombinedWorks } from "./readData";

function App() {
  useEffect(() => {
    async function test() {
      const works = await loadCombinedWorks();

      console.log("TOTAL WORKS:", works.length);
      console.log("FIRST WORK:", works[0]);
      const mismatches = works.filter(
        (w) => w.financialMismatch
      );

      console.log(
        "FINANCIAL MISMATCH COUNT:",
        mismatches.length
      );

      console.table(
  mismatches.slice(0, 10).map((work) => ({
    workId: work.workId,
    status: work.status,
    sanctioned: work.sanctionedAmount,
    expenditure: work.expenditureAmount,
    completedDisbursed: work.completedAmountDisbursed,
    spendingPercent: work.spendingPercentage,
    completionDate: work.completionDate,
    vendorCount: work.vendorCount,
    paymentCount: work.paymentCount,
  }))
);
    }
    test();
  }, []);

  return <h1>MPLADS Data Loading</h1>;
}

export default App;