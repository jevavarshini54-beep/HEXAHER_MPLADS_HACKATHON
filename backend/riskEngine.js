function parseDate(value) {

  if (!value) return null;

  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  // Format: 22-Oct-2025
  const match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);

  if (match) {
    const months = {Jan: 0,Feb: 1,Mar: 2,Apr: 3,May: 4,Jun: 5,Jul: 6,Aug: 7,Sep: 8,Oct: 9,Nov: 10,Dec: 11,};
    const day = Number(match[1]);
    const month = months[match[2]];
    const year = Number(match[3]);
    if (month === undefined) return null;

    return new Date(year, month, day);
  }

  // Try normal JS date parsing
  const parsed = new Date(text);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}


// Calculate exact months between two dates
function calculateMonths(startDate, endDate) {
  if (!startDate || !endDate) return null;

  let months =(endDate.getFullYear() - startDate.getFullYear()) * 12 +(endDate.getMonth() - startDate.getMonth());

  // Adjust if the end day hasn't reached the start day
  if (endDate.getDate() < startDate.getDate()) {
    months--;
  }
  return Math.max(months, 0);
}


export function calculateRiskScore(work) {

  let score = 0;
  const reasons = [];
  const sanctioned = Number(work.sanctionedAmount) || 0;
  const spent = Number(work.effectiveExpenditure) || 0;
  const spendingPercent =sanctioned > 0 ? (spent / sanctioned) * 100 : 0;

  // DATES
  const sanctionDate = parseDate(work.sanctionDate);
  const completionDate = parseDate(work.completionDate);

  // Use completion date when completed
  // Otherwise use today's date for ongoing works
  const endDate = work.isCompleted && completionDate ? completionDate : new Date();
  const durationMonths = sanctionDate && endDate ? calculateMonths(sanctionDate,endDate) : null;

  // SPENDING / COST ANOMALY
  if (spendingPercent > 110) {
    score += 4;
    reasons.push("Spending significantly exceeds sanctioned amount");
  }
  
  else if (spendingPercent > 100) {
    score += 2;
    reasons.push("Spending exceeds sanctioned amount");
  }

  // COMPLETED WORK WITH LOW SPENDING
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

  // ONGOING WORK WITH NO EXPENDITURE
  if (
    !work.isCompleted &&
    durationMonths !== null &&
    durationMonths >= 6 &&
    spent === 0) {
        score += 5;
        reasons.push(`Ongoing work has no recorded expenditure for ${durationMonths} months`);
  }

  // ONGOING WORK WITH VERY LOW SPENDING
  else if (
    !work.isCompleted &&
    durationMonths !== null &&
    durationMonths >= 6 &&
    spendingPercent < 20) {
        score += 3;
        reasons.push(`Ongoing work has only ${spendingPercent.toFixed(1)}% spending after ${durationMonths} months`);
  }

  // FINANCIAL MISMATCH
  if (work.financialMismatch) {
    score += 2;
    reasons.push("Financial amount discrepancy detected");
  }

  // MULTIPLE VENDORS
  const vendorCount = Number(work.vendorCount) || 0;

  if (vendorCount >= 5) {
    score += 1;
    reasons.push("Multiple vendors involved");
  }

  // HIGH VALUE PROJECT
  if (sanctioned >= 10000000) {
    score += 0.5;
    reasons.push("High-value project");
  }

  // LIMIT SCORE
  score = Math.min(score, 10);
  score = Number(score.toFixed(1));

  // RISK LEVEL
  let riskLevel = "NO RISK";
  if (score >= 8.5) {
    riskLevel = "CRITICAL";
  } else if (score >= 7) {
    riskLevel = "HIGH";
  } else if (score >= 4) {
    riskLevel = "MODERATE";
  } else if (score > 1.5) {
    riskLevel = "LOW";
  } else if (score > 0) {
    riskLevel = "VERY LOW";
  }

  return {
    riskScore: score,riskLevel,
    riskReasons: reasons,
    // Useful for dashboard popup
    durationMonths,
    sanctionDate: work.sanctionDate || null,
    completionDate: work.completionDate || null,
  };
}