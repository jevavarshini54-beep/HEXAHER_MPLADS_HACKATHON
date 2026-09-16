const express = require("express");
const cors = require("cors");
const { calculateRiskScore } = require("./riskEngine");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));


// Test route
app.get("/", (req, res) => {
  res.json({
    message: "MPLADS Risk Engine Backend is running",
  });
});


// Risk score API
app.post("/api/risk-score", (req, res) => {
  try {

    console.log("BODY TYPE:", typeof req.body);
    console.log("IS ARRAY:", Array.isArray(req.body));

    const works = req.body;

    // We MUST receive an array
    if (!Array.isArray(works)) {
      console.log("INVALID BODY:", works);

      return res.status(400).json({
        error: "Expected an array of works",
      });
    }

    console.log("NUMBER OF WORKS RECEIVED:", works.length);


    // Calculate risk for every work
    const scoredWorks = works.map((work) => {

      const result = calculateRiskScore(work);

      return {
        ...work,
        ...result,
      };

    });


    console.log(
      "NUMBER OF WORKS SCORED:",
      scoredWorks.length
    );


    // IMPORTANT: return the ARRAY
    return res.status(200).json(scoredWorks);

  } catch (error) {

    console.error("Risk calculation error:", error);

    return res.status(500).json({
      error: "Could not calculate risk scores",
    });

  }
});


// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `MPLADS backend running on http://localhost:${PORT}`
  );
});