/**
 * DSCR (Debt Service Coverage Ratio) — credit-shaped inputs, no refactor of engine.
 * CFADS = EBITDA - CashTaxes - Capex + OtherAdjustments
 * Debt service = InterestExpense + PrincipalRepayment = TotalDebt * InterestRate + TotalDebt / AmortTermYears
 * DSCR = CFADS / DebtService
 */
export function debtService(totalDebt: number, interestRate: number, amortTermYears: number): number {
  if (amortTermYears <= 0) return totalDebt * interestRate;
  return totalDebt * interestRate + totalDebt / amortTermYears;
}

export function cfads(
  ebitda: number,
  cashTaxes: number,
  capex: number,
  otherAdjustments: number
): number {
  return ebitda - cashTaxes - capex + otherAdjustments;
}

export function dscr(
  cfadsValue: number,
  totalDebt: number,
  interestRate: number,
  amortTermYears: number
): number {
  const ds = debtService(totalDebt, interestRate, amortTermYears);
  return ds > 0 ? cfadsValue / ds : 0;
}
