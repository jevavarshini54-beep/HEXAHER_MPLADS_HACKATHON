import { useEffect, useMemo, useState } from "react";
import {loadCombinedWorks,calculateRiskScores} from "./readData";
import "./App.css";
import ChatBox from "./ChatBox.jsx";

function App() {

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWork, setSelectedWork] = useState(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");

  const [showChat, setShowChat] = useState(true);

  // LOAD DATA
  useEffect(() => {
    async function loadData() {

      try {
        console.log("Loading works...");
        const combinedWorks = await loadCombinedWorks();
        console.log("WORKS LOADED:",combinedWorks.length);
        const scoredWorks = await calculateRiskScores(combinedWorks);
        console.log("RISK SCORES RECEIVED:",scoredWorks.length);
        setWorks(scoredWorks);
      }
      
      catch (err) {
        console.error("DATA ERROR:", err);
        setError("Could not load MPLADS data.");
      }
      
      finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // RISK DISTRIBUTION
  const riskDistribution = useMemo(() => {
    const distribution = {
      "NO RISK": 0,
      "VERY LOW": 0,
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    works.forEach((work) => {
      if (distribution[work.riskLevel] !== undefined) {
        distribution[work.riskLevel]++;
      }
    });

    return distribution;
  }, [works]);

  // STATES
  const states = useMemo(() => {
    return [
      ...new Set(
        works.map((work) => work.state).filter(Boolean)
      ),
    ].sort();
  }, [works]);

  // STATISTICS
  const statistics = useMemo(() => {
    const total = works.length;

    const completed = works.filter((work) => work.isCompleted).length;
    const withExpenditure = works.filter((work) => work.hasExpenditure).length;
    const flagged = works.filter((work) => Number(work.riskScore || 0) > 0).length;
    const critical = works.filter((work) => work.riskLevel === "CRITICAL").length;

    return {total,completed,withExpenditure,flagged,critical,};
  }, [works]);

  // FILTER WORKS
  const filteredWorks = useMemo(() => {
    return works
      .filter((work) => {
        const searchText = search.toLowerCase().trim();

        if (!searchText) return true;

        return (
          String(work.workId || "")
            .toLowerCase()
            .includes(searchText) ||
          String(work.mpName || "")
            .toLowerCase()
            .includes(searchText) ||
          String(work.constituency || "")
            .toLowerCase()
            .includes(searchText) ||
          String(work.workDescription || "")
            .toLowerCase()
            .includes(searchText)
        );
      })

      // RISK FILTER
      .filter((work) => {
        if (riskFilter === "ALL") {
          return true;
        }

        return work.riskLevel === riskFilter;
      })

      // STATE FILTER
      .filter((work) => {
        if (stateFilter === "ALL") {
          return true;
        }

        return work.state === stateFilter;
      })

      // STATUS FILTER
      .filter((work) => {
        if (statusFilter === "ALL") {
          return true;
        }

        // If completion record exists, treat the project as COMPLETED.
        if (statusFilter === "Completed" && work.isCompleted) {
          return true;
        }

        // Don't show Physical Inspection as a separate status if the project is completed.
        if (statusFilter === "Physical Inspection" && work.isCompleted) {
          return false;
        }

        return work.status === statusFilter;
      })

      // Highest risk first
      .sort(
        (a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0)
      );
  }, [
    works, search, riskFilter,
    stateFilter, statusFilter,
  ]);

  // FORMAT MONEY
  function formatMoney(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }


  // RISK BADGE CLASS
  function getRiskClass(level) {
    switch (level) {
      case "CRITICAL":
        return "badge-critical";

      case "HIGH":
        return "badge-high";

      case "MODERATE":
        return "badge-moderate";

      case "LOW":
      case "VERY LOW":
        return "badge-low";

      default:
        return "badge-none";
    }
  }

  // DISPLAY STATUS
  function getDisplayStatus(work) {
    if (work.isCompleted) {
      return "Completed";
    }

    return work.status || "—";
  }

  // STATUS BADGE CLASS
  function getStatusClass(work) {
    if (work.isCompleted) {
      return "status-completed";
    }

    const status = String(work.status || "").toLowerCase();

    if (status.includes("ongoing")) {
      return "status-ongoing";
    }

    if (status.includes("inspection")) {
      return "status-inspection";
    }

    return "status-default";
  }

  // LOADING
  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading MPLADS Risk Dashboard...</div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="app">
        <div className="loading">
          {error}
        </div>
      </div>
    );
  }

  // WHAT IS BEING SHOWN
  const displayedWorks =
    filteredWorks.slice(0, 100);

  return (
    <div className="app">

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>
            MPLADS Risk Dashboard
          </h1>

          <p>
            AI-assisted monitoring of
            sanctioned development works
          </p>
        </div>

        <div className="header-badge">
          Lok Sabha •{" "}
          {works.length.toLocaleString("en-IN")}{" "}
          Works
        </div>
      </header>


      <main className="dashboard-container">

        {!showChat && (
          <button
            className="open-chat-btn"
            onClick={() => setShowChat(true)}
          >
            🤖 Ask MPLADS AI
          </button>
        )}

        {showChat && (
          <ChatBox
            works={works}
            onSelectWork={setSelectedWork}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* SUMMARY CARDS */}
        <section className="summary-grid">

          <div className="summary-card">
            <div className="label">
              Total Sanctioned Works
            </div>

            <div className="value">
              {statistics.total.toLocaleString(
                "en-IN"
              )}
            </div>

            <div className="subtext">
              Works currently monitored
            </div>
          </div>


          <div className="summary-card">
            <div className="label">
              Completed Works
            </div>

            <div className="value">
              {statistics.completed.toLocaleString(
                "en-IN"
              )}
            </div>

            <div className="subtext">
              Matched with completion records
            </div>
          </div>


          <div className="summary-card">
            <div className="label">
              Works With Expenditure
            </div>

            <div className="value">
              {statistics.withExpenditure.toLocaleString(
                "en-IN"
              )}
            </div>

            <div className="subtext">
              Expenditure records available
            </div>
          </div>


          <div className="summary-card">
            <div className="label">
              AI Flagged Works
            </div>

            <div className="value">
              {statistics.flagged.toLocaleString(
                "en-IN"
              )}
            </div>

            <div className="subtext">
              Risk score above zero
            </div>
          </div>

        </section>


        {/* RISK DISTRIBUTION */}
        <section className="risk-section">

          <div className="section-title">
            Risk Distribution
          </div>

          <div className="risk-grid">

            <div className="risk-card risk-critical">
              <div className="risk-label">
                Critical
              </div>

              <div className="risk-number">
                {riskDistribution.CRITICAL}
              </div>
            </div>


            <div className="risk-card risk-high">
              <div className="risk-label">
                High
              </div>

              <div className="risk-number">
                {riskDistribution.HIGH}
              </div>
            </div>


            <div className="risk-card risk-moderate">
              <div className="risk-label">
                Moderate
              </div>

              <div className="risk-number">
                {riskDistribution.MODERATE}
              </div>
            </div>


            <div className="risk-card risk-low">
              <div className="risk-label">
                Very Low / Low
              </div>

              <div className="risk-number">
                {riskDistribution["VERY LOW"] +
                  riskDistribution.LOW}
              </div>
            </div>


            <div className="risk-card risk-none">
              <div className="risk-label">
                No Risk
              </div>

              <div className="risk-number">
                {riskDistribution["NO RISK"]}
              </div>
            </div>

          </div>
        </section>


        {/* FILTERS */}
        <section className="filter-section">

          <div className="section-title">
            Search & Filters
          </div>

          <div className="filter-row">

            <input
              className="filter-input"
              type="text"
              placeholder="Search work ID, MP, constituency..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />


            <select
              className="filter-select"
              value={riskFilter}
              onChange={(e) =>
                setRiskFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Risk Levels
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MODERATE">
                Moderate
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="VERY LOW">
                Very Low
              </option>

              <option value="NO RISK">
                No Risk
              </option>
            </select>


            <select
              className="filter-select"
              value={stateFilter}
              onChange={(e) =>
                setStateFilter(e.target.value)
              }
            >
              <option value="ALL">
                All States
              </option>

              {states.map((state) => (
                <option
                  key={state}
                  value={state}
                >
                  {state}
                </option>
              ))}
            </select>


            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Ongoing">
                Ongoing
              </option>

              <option value="Physical Inspection">
                Physical Inspection
              </option>
            </select>

          </div>
        </section>


        {/* TABLE */}
        <section className="table-section">

          <div className="table-header">

            <div className="section-title">
              {riskFilter === "NO RISK"
                ? "No Risk Works"
                : riskFilter === "ALL"
                ? "Monitored Works"
                : `${riskFilter} Risk Works`}
            </div>

            <div className="table-count">
              Showing{" "}
              {Math.min(
                displayedWorks.length,
                100
              ).toLocaleString("en-IN")}{" "}
              of{" "}
              {filteredWorks.length.toLocaleString(
                "en-IN"
              )}
            </div>

          </div>

          <div className="table-wrapper">

            <table>
              <thead>
                <tr>
                  <th>Work ID</th>
                  <th>MP / Constituency</th>
                  <th>Sanctioned</th>
                  <th>Spent</th>
                  <th>Spending</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>

                {displayedWorks.map((work) => (

                  <tr
                    key={work.workId}
                    className="work-row"
                    onClick={() => {setSelectedWork(work);}}
                  >

                    {/* WORK ID */}
                    <td>
                      <span className="work-id">
                        {work.workId}
                      </span>
                    </td>


                    {/* MP */}
                    <td>

                      <strong>
                        {work.mpName || "—"}
                      </strong>

                      <br />

                      <span
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                        }}
                      >
                        {work.constituency || "—"}
                      </span>

                    </td>


                    {/* SANCTIONED */}
                    <td>
                      {formatMoney(
                        work.sanctionedAmount
                      )}
                    </td>


                    {/* SPENT */}
                    <td>
                      {formatMoney(
                        work.effectiveExpenditure
                      )}
                    </td>


                    {/* SPENDING */}
                    <td>

                      <div className="progress-container">

                        <div className="progress-bar">

                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(
                                Number(
                                  work.spendingPercentage || 0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        <div className="progress-text">
                          {Number(
                            work.spendingPercentage || 0
                          ).toFixed(1)}
                          %
                        </div>

                      </div>

                    </td>


                    {/* STATUS */}
                    <td>

                      <span
                        className={`status-badge ${getStatusClass(
                          work
                        )}`}
                      >
                        {getDisplayStatus(work)}
                      </span>

                    </td>


                    {/* RISK */}
                    <td>

                      <span
                        className={`risk-badge ${getRiskClass(
                          work.riskLevel
                        )}`}
                      >
                        {work.riskLevel}{" "}
                        {work.riskScore}
                      </span>

                    </td>


                    {/* REASONS */}
                    <td>

                      <div className="reason-list">

                        {(work.riskReasons || [])
                          .map(
                            (reason, index) => (
                              <div
                                className="reason"
                                key={index}
                              >
                                • {reason}
                              </div>
                            )
                          )}

                        {(!work.riskReasons ||
                          work.riskReasons.length === 0) && (
                          <span className="no-reason">
                            —
                          </span>
                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>


            {/* EMPTY STATE */}
            {filteredWorks.length === 0 && (

              <div className="empty-state">
                No works match your filters.
              </div>

            )}


            {selectedWork && (
  <div
    className="modal-overlay"
    onClick={() => setSelectedWork(null)}
  >
    <div
      className="project-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="modal-header">
        <div>
          <h2>Project Details</h2>
          <p>{selectedWork.workId}</p>
        </div>

        <button
          className="modal-close"
          onClick={() => setSelectedWork(null)}
        >
          ×
        </button>
      </div>


      <div className="modal-grid">

        <div className="modal-field">
          <span>State</span>
          <strong>{selectedWork.state || "—"}</strong>
        </div>

        <div className="modal-field">
          <span>MP</span>
          <strong>{selectedWork.mpName || "—"}</strong>
        </div>

        <div className="modal-field">
          <span>Constituency</span>
          <strong>{selectedWork.constituency || "—"}</strong>
        </div>

        <div className="modal-field">
          <span>Work Category</span>
          <strong>{selectedWork.workCategory || "—"}</strong>
        </div>

      </div>


      <div className="modal-description">
        <span>Work Description</span>

        <p>
          {selectedWork.workDescription || "—"}
        </p>
      </div>


      <div className="modal-section">

        <h3>Timeline</h3>

        <div className="modal-grid">

          <div className="modal-field">
            <span>Recommended Date</span>
            <strong>
              {selectedWork.recommendedDate || "—"}
            </strong>
          </div>

          <div className="modal-field">
            <span>Sanction Date</span>
            <strong>
              {selectedWork.sanctionDate || "—"}
            </strong>
          </div>

          <div className="modal-field">
            <span>Completion Date</span>
            <strong>
              {selectedWork.completionDate || "Not completed"}
            </strong>
          </div>

          <div className="modal-field">
            <span>Latest Expenditure</span>
            <strong>
              {selectedWork.latestExpenditureDate || "—"}
            </strong>
          </div>

          <div className="modal-field">
            <span>Duration</span>
            <strong>
              {selectedWork.durationMonths != null
                ? `${selectedWork.durationMonths} months`
                : "—"}
            </strong>
          </div>

          <div className="modal-field">
            <span>Status</span>

            <strong
              className={
                selectedWork.isCompleted
                  ? "status-completed"
                  : "status-ongoing"
              }
            >
              {selectedWork.isCompleted
                ? "Completed"
                : selectedWork.status || "—"}
            </strong>

          </div>

        </div>

      </div>


      <div className="modal-section">

        <h3>Financial Details</h3>

        <div className="modal-grid">

          <div className="modal-field">
            <span>Sanctioned Amount</span>
            <strong>
              {formatMoney(selectedWork.sanctionedAmount)}
            </strong>
          </div>

          <div className="modal-field">
            <span>Expenditure</span>
            <strong>
              {formatMoney(selectedWork.effectiveExpenditure)}
            </strong>
          </div>

          <div className="modal-field">
            <span>Spending</span>
            <strong>
              {Number(
                selectedWork.spendingPercentage || 0
              ).toFixed(1)}%
            </strong>
          </div>

          <div className="modal-field">
            <span>Payment Count</span>
            <strong>
              {selectedWork.paymentCount || 0}
            </strong>
          </div>

          <div className="modal-field">
            <span>Vendor Count</span>
            <strong>
              {selectedWork.vendorCount || 0}
            </strong>
          </div>

          <div className="modal-field">
            <span>Financial Mismatch</span>
            <strong>
              {selectedWork.financialMismatch
                ? "Detected"
                : "No"}
            </strong>
          </div>

        </div>

      </div>


      {selectedWork.vendors?.length > 0 && (
        <div className="modal-section">

          <h3>Vendors</h3>

          <div className="vendor-list">
            {selectedWork.vendors.map(
              (vendor, index) => (
                <span key={index}>
                  {vendor}
                </span>
              )
            )}
          </div>

        </div>
      )}


      <div className="modal-section">

        <h3>Risk Assessment</h3>

        <div className="modal-risk">

          <span
            className={`risk-badge ${getRiskClass(
              selectedWork.riskLevel
            )}`}
          >
            {selectedWork.riskLevel}{" "}
            {selectedWork.riskScore}
          </span>

        </div>


        {selectedWork.riskReasons?.length > 0 && (

          <div className="modal-reasons">

            <strong>Risk Reasons</strong>

            {selectedWork.riskReasons.map(
              (reason, index) => (
                <div key={index}>
                  • {reason}
                </div>
              )
            )}

          </div>

        )}

      </div>

    </div>
  </div>
)}
          </div>

        </section>


        {/* FOOTER */}
        <footer className="dashboard-footer">
          MPLADS AI Monitoring Dashboard •
          Risk scores are generated using
          rule-based anomaly detection.
        </footer>

      </main>
    </div>
  );
}

export default App;