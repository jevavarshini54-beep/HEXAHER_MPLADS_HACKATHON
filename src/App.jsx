import { useEffect } from "react";
import {
  loadCombinedWorks,
  calculateRiskScores,
} from "./readData";

function App() {
  useEffect(() => {
    async function test() {
      try {
        console.log("Loading works...");

        const works = await loadCombinedWorks();

        console.log("WORKS LOADED:", works.length);

        // Send works to backend Risk Engine
        const scoredWorks = await calculateRiskScores(works);

        console.log("RISK SCORES RECEIVED:", scoredWorks.length);

        const riskCounts = scoredWorks.reduce((acc, work) => {
        const level = work.riskLevel || "NO RISK";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      console.log("RISK DISTRIBUTION:", riskCounts);

        // Top 10 risk works
        const highRiskWorks = [...scoredWorks]
          .filter((w) => w.riskScore > 0)
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 10);

        console.log("TOP 10 RISK WORKS:");

        console.table(
          highRiskWorks.map((w) => ({
            workId: w.workId,
            sanctioned: w.sanctionedAmount,
            spent: w.effectiveExpenditure,
            spendingPercent: Number(
              w.spendingPercentage.toFixed(1)
            ),
            status: w.status,
            completionDate: w.completionDate,
            riskScore: w.riskScore,
            riskLevel: w.riskLevel,
            reasons: w.riskReasons.join(", "),
          }))
        );

        // First 10
        console.log("FIRST WORK:", scoredWorks[0]);

        console.table(
          scoredWorks.slice(0, 10).map((w) => ({
            workId: w.workId,
            sanctioned: w.sanctionedAmount,
            spent: w.effectiveExpenditure,
            spendingPercent: Number(
              w.spendingPercentage.toFixed(1)
            ),
            riskScore: w.riskScore,
            riskLevel: w.riskLevel,
            reasons: w.riskReasons.join(", "),
          }))
        );

        const mismatches = scoredWorks.filter(
          (w) => w.financialMismatch
        );

        console.log(
          "FINANCIAL MISMATCH COUNT:",
          mismatches.length
        );
      } catch (error) {
        console.error("DATA ERROR:", error);
      }
    }

    test();
  }, []);

  return <h1>MPLADS Risk Dashboard</h1>;
}

export default App;