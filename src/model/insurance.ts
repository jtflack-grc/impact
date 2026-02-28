/**
 * CFI-consistent net loss: deductible + limit.
 * NetLoss = min(GrossLoss, Deductible) + max(0, GrossLoss - Deductible - CoverageLimit)
 * So: amount below deductible is uninsured; amount above deductible+limit is uninsured.
 * Insured = between deductible and deductible+limit.
 */
export function netLoss(
  grossLoss: number,
  deductible: number,
  coverageLimit: number
): number {
  if (grossLoss <= deductible) return grossLoss;
  const aboveDeductible = grossLoss - deductible;
  const insured = Math.min(aboveDeductible, coverageLimit);
  return grossLoss - insured;
}
