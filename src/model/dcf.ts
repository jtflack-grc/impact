/**
 * DCF (Discounted Cash Flow) — shared for dashboard and sensitivity.
 * Enterprise/equity value from projected FCFs + terminal value.
 */
export function dcfFromCashFlows(
  cashFlows: number[],
  terminalGrowth: number,
  discountRate: number
): { enterpriseValue: number; equityValue: number } {
  if (!cashFlows.length || discountRate <= terminalGrowth) {
    return { enterpriseValue: 0, equityValue: 0 };
  }
  let pv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    pv += cashFlows[t] / Math.pow(1 + discountRate, t + 1);
  }
  const lastCf = cashFlows[cashFlows.length - 1];
  const terminalValue = (lastCf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, cashFlows.length);
  const enterpriseValue = pv + pvTerminal;
  return { enterpriseValue, equityValue: enterpriseValue };
}

/** Build projected FCF series from revenue and EBITDA margin (same logic as dashboard). */
export function buildProjectedFcf(revenueMillions: number, ebitdaMarginPercent: number): number[] {
  const margin = ebitdaMarginPercent / 100;
  const rev1 = revenueMillions;
  const rev2 = revenueMillions * 1.05;
  const rev3 = revenueMillions * 1.1;
  const rev4 = revenueMillions * 1.15;
  const fcfFactor = 0.7;
  return [
    rev1 * margin * fcfFactor,
    rev2 * margin * fcfFactor,
    rev3 * margin * fcfFactor,
    rev4 * margin * fcfFactor,
  ];
}
