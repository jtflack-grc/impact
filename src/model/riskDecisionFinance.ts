/**
 * Illustrative decision comparison. Both annualized benefits and the expense
 * proxy are assumptions, NOT observed control efficacy or measured savings.
 * Gross P90 minus residual P90 is deliberately excluded: a percentile gap is
 * neither annual expected benefit nor necessarily attributable to controls.
 * All currency values here are millions of USD, matching scenario inputs.
 */
export interface DecisionFinance {
  baselineEal: number;
  currentEal: number;
  annualAvoidedLoss: number;
  investmentCost: number;
  netBenefitThreeYears: number;
  npv: number;
  irr: number | null;
  paybackYears: number | null;
  pi: number | null;
  rosi: number | null;
  hasComparison: boolean;
}

export function annualProbabilityOfAtLeastOneEvent(lossEventsPerYear: number): number {
  if (!Number.isFinite(lossEventsPerYear) || lossEventsPerYear <= 0) return 0;
  // Under an explicit constant-rate Poisson assumption, NOT a universal FAIR law.
  return -Math.expm1(-lossEventsPerYear);
}

function pvAnnuity(annualBenefit: number, years: number, rate: number): number {
  let pv = 0;
  for (let year = 1; year <= years; year += 1) {
    pv += annualBenefit / Math.pow(1 + rate, year);
  }
  return pv;
}

/** Conventional IRR for one initial outflow and three equal positive inflows. */
function annuityIrr(cost: number, benefit: number, years: number): number | null {
  if (cost <= 0 || benefit <= 0) return null;
  let low = -0.99;
  let high = 100;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    if (pvAnnuity(benefit, years, mid) > cost) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function calculateDecisionFinance(
  baselineEal: number,
  currentEal: number,
  revenueMillions: number,
  discountRate: number,
  years = 3
): DecisionFinance {
  const baseline = Math.max(0, baselineEal);
  const current = Math.max(0, currentEal);
  const annualAvoidedLoss = baseline - current;
  // Illustrative up-front intervention cost: 0.2% of one year's revenue.
  // No actual implementation cost is collected by IMPACT.
  const investmentCost = Math.max(0.05, revenueMillions * 0.002);
  const netBenefitThreeYears = annualAvoidedLoss * years - investmentCost;
  const npv = pvAnnuity(annualAvoidedLoss, years, discountRate) - investmentCost;
  const hasComparison = Math.abs(annualAvoidedLoss) > 1e-9;
  return {
    baselineEal: baseline,
    currentEal: current,
    annualAvoidedLoss,
    investmentCost,
    netBenefitThreeYears,
    npv,
    irr: annuityIrr(investmentCost, annualAvoidedLoss, years),
    paybackYears: annualAvoidedLoss > 0 ? investmentCost / annualAvoidedLoss : null,
    pi: annualAvoidedLoss > 0
      ? pvAnnuity(annualAvoidedLoss, years, discountRate) / investmentCost
      : null,
    rosi: hasComparison ? (netBenefitThreeYears / investmentCost) * 100 : null,
    hasComparison,
  };
}
