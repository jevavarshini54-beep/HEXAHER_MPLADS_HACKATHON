import { useEffect } from "react";
import {
  loadWorksSanctioned,
  loadExpenditure,
  loadWorksCompleted,
} from "./readData";

function App() {
  useEffect(() => {
    async function testData() {
      try {
        const sanctioned = await loadWorksSanctioned();
        const expenditure = await loadExpenditure();
        const completed = await loadWorksCompleted();

        console.log("SANCTIONED:", sanctioned);
        console.log("EXPENDITURE:", expenditure);
        console.log("COMPLETED:", completed);

        console.log("Sanctioned count:", sanctioned.length);
        console.log("Expenditure count:", expenditure.length);
        console.log("Completed count:", completed.length);
      } catch (error) {
        console.error("DATA ERROR:", error);
      }
    }

    testData();
  }, []);

  return (
    <div>
      <h1>MPLADS Dashboard</h1>
      <p>Data loading test...</p>
    </div>
  );
}

export default App;