import { describe, expect, it } from "vitest";
import { annualProbabilityOfAtLeastOneEvent, calculateDecisionFinance } from "./riskDecisionFinance";

describe("decision finance: EAL rather than P90 gaps", () => {
  it("shows no investment return before an improvement can be compared", () => {
    const result = calculateDecisionFinance(12, 12, 1000, 0.09);
    expect(result.annualAvoidedLoss).toBe(0);
    expect(result.hasComparison).toBe(false);
    expect(result.irr).toBeNull();
    expect(result.paybackYears).toBeNull();
    expect(result.rosi).toBeNull();
  });

  it("calculates avoided expected annual loss and discounts yearly benefits", () => {
    const result = calculateDecisionFinance(12, 10, 1000, 0.1);
    expect(result.annualAvoidedLoss).toBe(2);
    expect(result.investmentCost).toBe(2);
    expect(result.netBenefitThreeYears).toBe(4);
    expect(result.rosi).toBeCloseTo(200);
    expect(result.npv).toBeCloseTo(2 / 1.1 + 2 / 1.1 ** 2 + 2 / 1.1 ** 3 - 2);
    expect(result.paybackYears).toBeCloseTo(1);
    expect(result.irr).not.toBeNull();
  });

  it("does not invent a positive IRR when the scenario gets worse", () => {
    const result = calculateDecisionFinance(10, 13, 1000, 0.09);
    expect(result.annualAvoidedLoss).toBe(-3);
    expect(result.npv).toBeLessThan(0);
    expect(result.irr).toBeNull();
    expect(result.paybackYears).toBeNull();
    expect(result.pi).toBeNull();
    expect(result.rosi).toBeLessThan(0);
  });
});

describe("annual event probability", () => {
  it("uses a Poisson conversion for an annual loss-event rate", () => {
    expect(annualProbabilityOfAtLeastOneEvent(0)).toBe(0);
    expect(annualProbabilityOfAtLeastOneEvent(1)).toBeCloseTo(1 - Math.exp(-1));
    expect(annualProbabilityOfAtLeastOneEvent(0.8)).toBeCloseTo(0.550671);
  });
});
