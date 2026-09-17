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
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MPLADS backend running on port ${PORT}`);
});


app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, works } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Please ask me something about the MPLADS projects.",
        results: []
      });
    }

    if (!Array.isArray(works)) {
      return res.status(400).json({
        reply: "Project data was not received.",
        results: []
      });
    }

    const q = message.toLowerCase().trim();

    // ==========================================
    // CASUAL CONVERSATION
    // ==========================================

    if (
      q === "hi" ||
      q === "hello" ||
      q === "hey" ||
      q === "hii" ||
      q === "hey there"
    ) {
      return res.json({
        reply:
          "Hi! 👋 I'm the MPLADS AI Assistant. Ask me about projects, expenditure, risks, states, MPs, or anomalies.",
        results: []
      });
    }

    if (
      q === "how are you" ||
      q === "how are u" ||
      q === "how r you"
    ) {
      return res.json({
        reply:
          "I'm doing great! 🤖 I'm ready to help you investigate the MPLADS project data.",
        results: []
      });
    }

    if (
      q === "thanks" ||
      q === "thank you" ||
      q === "thankyou"
    ) {
      return res.json({
        reply: "You're welcome! 😊",
        results: []
      });
    }


    // ==========================================
    // STATES
    // ==========================================

    const states = [
      "andhra pradesh",
      "arunachal pradesh",
      "assam",
      "bihar",
      "chhattisgarh",
      "goa",
      "gujarat",
      "haryana",
      "himachal pradesh",
      "jharkhand",
      "karnataka",
      "kerala",
      "madhya pradesh",
      "maharashtra",
      "manipur",
      "meghalaya",
      "mizoram",
      "nagaland",
      "odisha",
      "punjab",
      "rajasthan",
      "sikkim",
      "tamil nadu",
      "telangana",
      "tripura",
      "uttar pradesh",
      "uttarakhand",
      "west bengal"
    ];

    const requestedState = states.find(state =>
      q.includes(state)
    );


    // ==========================================
    // SOUTH INDIA
    // ==========================================

    const southIndiaStates = [
      "andhra pradesh",
      "telangana",
      "karnataka",
      "kerala",
      "tamil nadu"
    ];

    const wantsSouthIndia =
      q.includes("south india") ||
      q.includes("south indian") ||
      q.includes("southern india") ||
      q.includes("south side") ||
      q.includes("south states") ||
      q.includes("southern states");


    // ==========================================
    // TOPIC DETECTION
    // ==========================================

    const topicFilters = {

      streetLight: [
        "street light",
        "street lights",
        "streetlight",
        "streetlights",
        "road lighting",
        "road light",
        "road lights",
        "lighting"
      ],

      irrigation: [
        "irrigation",
        "irrigation project",
        "irrigation projects",
        "canal",
        "canals"
      ],

      road: [
        "road",
        "roads",
        "road construction",
        "road repair",
        "street"
      ],

      water: [
        "water",
        "water supply",
        "drinking water",
        "water tank",
        "water tanks"
      ],

      sanitation: [
        "sanitation",
        "toilet",
        "toilets",
        "sewerage",
        "drainage"
      ],

      school: [
        "school",
        "schools",
        "classroom",
        "classrooms"
      ],

      health: [
        "hospital",
        "hospitals",
        "health",
        "healthcare",
        "medical",
        "clinic",
        "clinics"
      ],

      solar: [
        "solar",
        "solar light",
        "solar lights",
        "solar panel",
        "solar panels"
      ],

      community: [
        "community hall",
        "community halls",
        "community center",
        "community centre"
      ]

    };


    let detectedTopic = null;

    for (const [topic, keywords] of Object.entries(topicFilters)) {

      if (
        keywords.some(keyword =>
          q.includes(keyword)
        )
      ) {
        detectedTopic = topic;
        break;
      }

    }


    // ==========================================
    // RISK
    // ==========================================

    const wantsHighRisk =
      q.includes("high risk") ||
      q.includes("high-risk") ||
      q.includes("critical") ||
      q.includes("dangerous") ||
      q.includes("risky") ||
      q.includes("flagged");


    // ==========================================
    // STATUS
    // ==========================================

    const wantsCompleted =
      q.includes("completed") ||
      q.includes("complete") ||
      q.includes("finished");


    const wantsOngoing =
      q.includes("ongoing") ||
      q.includes("in progress") ||
      q.includes("not completed") ||
      q.includes("unfinished");


    const wantsPhysicalInspection =
      q.includes("physical inspection") ||
      q.includes("inspection");


    // ==========================================
    // EXPENDITURE
    // ==========================================

    const wantsZeroExpenditure =
      q.includes("zero expenditure") ||
      q.includes("zero spending") ||
      q.includes("no expenditure") ||
      q.includes("no spending") ||
      q.includes("0 expenditure") ||
      q.includes("0 spending");


    const wantsOverspending =
      q.includes("overspent") ||
      q.includes("over spending") ||
      q.includes("over budget") ||
      q.includes("cost overrun");


    // ==========================================
    // VENDOR
    // ==========================================

    const wantsVendor =
      q.includes("vendor") ||
      q.includes("contractor");


    // ==========================================
    // START WITH ALL WORKS
    // ==========================================

    let filtered = [...works];


    // ==========================================
    // STATE FILTER
    // ==========================================

    if (requestedState) {

      filtered = filtered.filter(work => {

        const workState = String(
          work.state || ""
        )
          .trim()
          .toLowerCase();

        return workState === requestedState;

      });

    }


    // ==========================================
    // SOUTH INDIA FILTER
    // ==========================================

    if (wantsSouthIndia) {

      filtered = filtered.filter(work => {

        const workState = String(
          work.state || ""
        )
          .trim()
          .toLowerCase();

        return southIndiaStates.includes(workState);

      });

    }


    // ==========================================
    // TOPIC FILTER
    // ==========================================

    if (detectedTopic) {

      const keywords =
        topicFilters[detectedTopic];

      filtered = filtered.filter(work => {

        const text = [
          work.workId,
          work.workDescription,
          work.workCategory
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return keywords.some(keyword =>
          text.includes(keyword)
        );

      });

    }


    // ==========================================
    // HIGH RISK FILTER
    // ==========================================

    if (wantsHighRisk) {

      filtered = filtered.filter(work => {

        const risk = String(
          work.riskLevel ||
          work.risk ||
          ""
        ).toUpperCase();

        return (
          risk === "HIGH" ||
          risk === "CRITICAL"
        );

      });

    }


    // ==========================================
    // COMPLETED FILTER
    // ==========================================

    if (wantsCompleted) {

      filtered = filtered.filter(work => {

        const status = String(
          work.status || ""
        ).toLowerCase();

        return (
          work.isCompleted === true ||
          status.includes("completed") ||
          status.includes("complete")
        );

      });

    }


    // ==========================================
    // ONGOING FILTER
    // ==========================================

    if (wantsOngoing) {

      filtered = filtered.filter(work => {

        const status = String(
          work.status || ""
        ).toLowerCase();

        return !(
          work.isCompleted === true ||
          status.includes("completed") ||
          status.includes("complete")
        );

      });

    }


    // ==========================================
    // ZERO EXPENDITURE
    // ==========================================

    if (wantsZeroExpenditure) {

      filtered = filtered.filter(work => {

        const expenditure = Number(
          work.totalExpenditure ??
          work.totalDisbursed ??
          work.amountDisbursed ??
          0
        );

        return expenditure === 0;

      });

    }


    // ==========================================
    // OVERSPENDING
    // ==========================================

    if (wantsOverspending) {

      filtered = filtered.filter(work => {

        const overspent = Number(
          work.overspentAmount || 0
        );

        return overspent > 0;

      });

    }


    // ==========================================
    // PHYSICAL INSPECTION
    // ==========================================

    if (wantsPhysicalInspection) {

      filtered = filtered.filter(work => {

        const anomalies =
          Array.isArray(work.anomalies)
            ? work.anomalies
                .join(" ")
                .toLowerCase()
            : String(
                work.anomalies || ""
              ).toLowerCase();

        return anomalies.includes("physical");

      });

    }


    // ==========================================
    // VENDOR FILTER
    // ==========================================

    if (wantsVendor) {

      filtered = filtered.filter(work => {

        return Boolean(
          work.vendorName ||
          work.vendor ||
          work.contractor
        );

      });

    }


    // ==========================================
    // TEXT SEARCH
    // ONLY IF NO STRUCTURED FILTER
    // ==========================================

    const stopWords = new Set([
      "a",
      "an",
      "the",
      "is",
      "are",
      "was",
      "were",
      "am",
      "be",
      "been",
      "being",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "and",
      "or",
      "but",
      "from",
      "by",
      "about",
      "show",
      "find",
      "give",
      "tell",
      "me",
      "please",
      "can",
      "could",
      "would",
      "should",
      "you",
      "your",
      "i",
      "we",
      "want",
      "need",
      "know",
      "what",
      "which",
      "who",
      "how",
      "many",
      "some",
      "any",
      "project",
      "projects",
      "work",
      "works",
      "mplads",
      "south",
      "indian",
      "india"
    ]);


    const words = q
      .split(/\s+/)
      .map(word =>
        word.replace(/[^\w]/g, "")
      )
      .filter(word =>
        word.length >= 3 &&
        !stopWords.has(word)
      );


    // Don't perform noisy text search when
    // we already detected a structured topic/filter.

    const hasStructuredFilter =
      requestedState ||
      wantsSouthIndia ||
      detectedTopic ||
      wantsHighRisk ||
      wantsCompleted ||
      wantsOngoing ||
      wantsZeroExpenditure ||
      wantsOverspending ||
      wantsPhysicalInspection ||
      wantsVendor;


    if (
      words.length > 0 &&
      !hasStructuredFilter
    ) {

      const scored = filtered.map(work => {

        const text = [
          work.workId,
          work.mpName,
          work.constituency,
          work.state,
          work.workDescription,
          work.workCategory,
          work.status
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        let score = 0;


        words.forEach(word => {

          if (text.includes(word)) {
            score++;
          }

        });


        return {
          work,
          score
        };

      });


      filtered = scored
        .filter(item =>
          item.score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(item =>
          item.work
        );

    }


    // ==========================================
    // NO RESULTS
    // ==========================================

    if (filtered.length === 0) {

      let locationText = "";

      if (requestedState) {

        locationText =
          ` in ${
            requestedState
              .split(" ")
              .map(w =>
                w[0].toUpperCase() +
                w.slice(1)
              )
              .join(" ")
          }`;

      } else if (wantsSouthIndia) {

        locationText =
          " in South Indian states";

      }


      return res.json({
        reply:
          `I couldn't find projects matching your criteria${locationText}.`,
        results: []
      });

    }


    // ==========================================
    // REPLY
    // ==========================================

    let reply =
      `I found ${filtered.length} matching projects.`;


    if (wantsSouthIndia) {

      reply +=
        " Region: South India.";

    }


    if (requestedState) {

      const stateName =
        requestedState
          .split(" ")
          .map(w =>
            w[0].toUpperCase() +
            w.slice(1)
          )
          .join(" ");

      reply +=
        ` State: ${stateName}.`;

    }


    if (detectedTopic) {

      const topicNames = {
        streetLight: "Street Lighting",
        irrigation: "Irrigation",
        road: "Roads",
        water: "Water Supply",
        sanitation: "Sanitation",
        school: "Education",
        health: "Healthcare",
        solar: "Solar",
        community: "Community Infrastructure"
      };

      reply +=
        ` Topic: ${topicNames[detectedTopic]}.`;

    }


    if (wantsHighRisk) {
      reply +=
        " Risk filter: High/Critical.";
    }


    if (wantsCompleted) {
      reply +=
        " Status: Completed.";
    }


    if (wantsOngoing) {
      reply +=
        " Status: Ongoing.";
    }


    if (wantsZeroExpenditure) {
      reply +=
        " Expenditure: ₹0 recorded.";
    }


    if (wantsOverspending) {
      reply +=
        " Expenditure: Overspending detected.";
    }


    // ==========================================
    // RETURN ALL MATCHING RESULTS
    // ==========================================

    // ==========================================
// SUMMARY QUESTIONS
// ==========================================

const wantsSummary =
  q.includes("summary") ||
  q.includes("overview") ||
  q.includes("summarize") ||
  q.includes("summarise") ||
  q.includes("how are") ||
  q.includes("tell me about") ||
  q.includes("give me details about") ||
  q.includes("give me an overview");


// Summary should be used when the user asks
// about a particular state/topic.
if (wantsSummary && (requestedState || detectedTopic || wantsSouthIndia)) {

  // ------------------------------------------
  // STATE NAME
  // ------------------------------------------

  let locationName = "India";

  if (requestedState) {
    locationName = requestedState
      .split(" ")
      .map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
      )
      .join(" ");
  } else if (wantsSouthIndia) {
    locationName = "South India";
  }


  // ------------------------------------------
  // TOPIC NAME
  // ------------------------------------------

  const topicNames = {
    streetLight: "Street Lighting",
    irrigation: "Irrigation",
    road: "Road",
    water: "Water Supply",
    sanitation: "Sanitation",
    school: "Education",
    health: "Healthcare",
    solar: "Solar",
    community: "Community Infrastructure"
  };

  const topicName =
    detectedTopic
      ? topicNames[detectedTopic]
      : "All Projects";


  // ------------------------------------------
  // HELPER FOR AMOUNTS
  // ------------------------------------------

  const parseAmount = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    return Number(
      String(value)
        .replace(/[₹,\s]/g, "")
        .replace(/[^\d.-]/g, "")
    ) || 0;

  };


  // ------------------------------------------
  // BASIC COUNTS
  // ------------------------------------------

  const totalProjects = filtered.length;


  const completedProjects = filtered.filter(work => {

    const status = String(
      work.status || ""
    ).toLowerCase();

    return (
      work.isCompleted === true ||
      status.includes("completed") ||
      status.includes("complete")
    );

  }).length;


  const ongoingProjects =
    totalProjects - completedProjects;


  // ------------------------------------------
  // HIGH RISK
  // ------------------------------------------

  const highRiskProjects = filtered.filter(work => {

    const risk = String(
      work.riskLevel ||
      work.risk ||
      ""
    ).toUpperCase();

    return (
      risk === "HIGH" ||
      risk === "CRITICAL"
    );

  }).length;


  // ------------------------------------------
  // ZERO EXPENDITURE
  // ------------------------------------------

  const zeroExpenditureProjects = filtered.filter(work => {

    const expenditure = parseAmount(
      work.totalExpenditure ??
      work.totalDisbursed ??
      work.amountDisbursed ??
      work.expenditure ??
      work.amountSpent ??
      work.spentAmount
    );

    return expenditure === 0;

  }).length;


  // ------------------------------------------
  // TOTAL SANCTIONED AMOUNT
  // ------------------------------------------

  const totalSanctioned = filtered.reduce(
    (sum, work) => {

      return sum + parseAmount(
        work.sanctionedAmount ??
        work.sanctionAmount ??
        work.sanctionedCost ??
        work.approvedAmount
      );

    },
    0
  );


  // ------------------------------------------
  // TOTAL EXPENDITURE
  // ------------------------------------------

  const totalExpenditure = filtered.reduce(
    (sum, work) => {

      return sum + parseAmount(
        work.totalExpenditure ??
        work.totalDisbursed ??
        work.amountDisbursed ??
        work.expenditure ??
        work.amountSpent ??
        work.spentAmount
      );

    },
    0
  );


  // ------------------------------------------
  // OVERSPENDING
  // ------------------------------------------

  const overspendingProjects = filtered.filter(work => {

    const overspent = parseAmount(
      work.overspentAmount ??
      work.overSpentAmount ??
      work.excessAmount ??
      work.excessExpenditure
    );

    const sanctioned = parseAmount(
      work.sanctionedAmount ??
      work.sanctionAmount ??
      work.sanctionedCost ??
      work.approvedAmount
    );

    const expenditure = parseAmount(
      work.totalExpenditure ??
      work.totalDisbursed ??
      work.amountDisbursed ??
      work.expenditure ??
      work.amountSpent ??
      work.spentAmount
    );

    return (
      overspent > 0 ||
      (
        sanctioned > 0 &&
        expenditure > sanctioned
      )
    );

  }).length;


  // ------------------------------------------
  // PERCENTAGE
  // ------------------------------------------

  const completionPercentage =
    totalProjects > 0
      ? ((completedProjects / totalProjects) * 100).toFixed(1)
      : "0.0";


  // ------------------------------------------
  // FORMAT MONEY
  // ------------------------------------------

  const formatCrores = (amount) => {

    return `₹${(
      amount / 10000000
    ).toFixed(2)} Cr`;

  };


  // ------------------------------------------
  // AI RESPONSE
  // ------------------------------------------

  reply =
    `Here is a summary of ${topicName.toLowerCase()} projects in ${locationName}:\n\n` +

    `📊 PROJECT OVERVIEW\n` +
    `• Total projects: ${totalProjects}\n` +
    `• Completed: ${completedProjects}\n` +
    `• Ongoing / not completed: ${ongoingProjects}\n` +
    `• Completion rate: ${completionPercentage}%\n\n` +

    `💰 FINANCIAL OVERVIEW\n` +
    `• Total sanctioned amount: ${formatCrores(totalSanctioned)}\n` +
    `• Total expenditure: ${formatCrores(totalExpenditure)}\n\n` +

    `⚠️ MONITORING FLAGS\n` +
    `• High-risk projects: ${highRiskProjects}\n` +
    `• Zero-expenditure projects: ${zeroExpenditureProjects}\n` +
    `• Overspending projects: ${overspendingProjects}\n\n` +

    `The figures are calculated from the projects currently available in the dashboard.`;


  // ------------------------------------------
  // RETURN SUMMARY + PROJECT PREVIEWS
  // ------------------------------------------

  return res.json({

    reply,

    results: filtered.slice(0, 5),

    totalResults: filtered.length,

    allResults: filtered

  });

}

    return res.json({
  reply,
  results: filtered.slice(0, 5),
  totalResults: filtered.length,
  allResults: filtered
});


  } catch (error) {

    console.error(
      "AI CHAT ERROR:",
      error
    );

    return res.status(500).json({
      reply:
        "Something went wrong while processing your question.",
      results: []
    });

  }
});

app.listen(PORT, () => {
  console.log(
    `MPLADS backend running on http://localhost:${PORT}`
  );
});