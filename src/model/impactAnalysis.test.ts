import { describe, expect, it } from "vitest";
import { SECURITY_SCENARIOS } from "../content/securityScenarios";
import {
  deriveImpactAnalysis,
  reconstructPreChoiceMetrics,
} from "./impactAnalysis";

describe("deriveImpactAnalysis", () => {
  const scenario = SECURITY_SCENARIOS[0];

  it("reproduces the scenario baseline LEF at baseline metrics", () => {
    const analysis = deriveImpactAnalysis(scenario, scenario.metrics);
    expect(analysis.loss.frequency).toBeCloseTo(
      scenario.lossProfile.frequencyPerYear,
      8
    );
  });

  it("lowers LEF when TEF falls or control adoption rises", () => {
    const lowerTef = deriveImpactAnalysis(scenario, {
      ...scenario.metrics,
      incidentRate: scenario.metrics.incidentRate - 4,
    });
    const strongerControls = deriveImpactAnalysis(scenario, {
      ...scenario.metrics,
      controlAdoption: scenario.metrics.controlAdoption + 4,
    });

    expect(lowerTef.loss.frequency).toBeLessThan(
      scenario.lossProfile.frequencyPerYear
    );
    expect(strongerControls.loss.frequency).toBeLessThan(
      scenario.lossProfile.frequencyPerYear
    );
  });
});

describe("reconstructPreChoiceMetrics", () => {
  it("reconstructs the metrics before the latest choice", () => {
    const after = {
      controlAdoption: 77,
      incidentRate: 14,
      successIndex: 56,
      welfareDebt: 78,
      systemReversibility: 22,
      debtIndex: 11,
    };

    const before = reconstructPreChoiceMetrics(after, {
      controlAdoption: 5,
      incidentRate: -4,
      successIndex: 4,
    });

    expect(before.controlAdoption).toBe(72);
    expect(before.incidentRate).toBe(18);
    expect(before.successIndex).toBe(52);
  });
});
