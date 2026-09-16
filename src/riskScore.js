export function calculateRiskScore(work) {

  let score = 0;
  const reasons = [];
  const sanctioned = Number(work.sanctionedAmount) || 0;
  const spent = Number(work.effectiveExpenditure) || 0;
  const spendingPercent = sanctioned > 0 ? (spent / sanctioned) * 100 : 0;

  // Spending/cost anomaly

    if (spendingPercent > 110) {
        score += 4;
        reasons.push("Spending significantly exceeds sanctioned amount");
    }
    
    else if (spendingPercent > 100) {
        score += 2;
        reasons.push("Spending exceeds sanctioned amount");
    }


    //Completed work with unusually low spending

    if (work.isCompleted) {

        if (spendingPercent < 20) {
            score += 7.5;
            reasons.push("Completed work has critically low spending");
        }
        
        else if (spendingPercent < 40) {
            score += 6;
            reasons.push("Completed work has unusually low spending");
        }
        
        else if (spendingPercent < 60) {
            score += 4;
            reasons.push("Completed work has relatively low spending");
        }
    }

    //Financial mismatch

    if (work.financialMismatch) {
        score += 2;
        reasons.push("Financial amount discrepancy detected");
    }


    // 4. Physical inspection

    if (work.status === "Physical Inspection") {
        //Do nothing
    }

    //Multiple vendors
    const vendorCount = Number(work.vendorCount) || 0;
    if (vendorCount >= 5) {
        score += 1;
        reasons.push("Multiple vendors involved");
    }

    //High-value project
    if (sanctioned >= 10000000) {
        score += 0.5;
        reasons.push("High-value project");
    }

    //Keep between 0 and 10
    score = Math.min(score, 10);

    //One decimal place
    score = Number(score.toFixed(1));
    let riskLevel = "NO RISK";

    if (score >= 8.5) {
        riskLevel = "CRITICAL";
    }
    
    else if (score >= 7) {
        riskLevel = "HIGH";
    }
    
    else if (score >= 4) {
        riskLevel = "MODERATE";
    }

    else if (score > 1.5) {
        riskLevel = "LOW";
    }


    else if (score > 0) {
        riskLevel = "VERY LOW";
    }

    return {
        riskScore: score,
        riskLevel,
        riskReasons: reasons,
    };
}