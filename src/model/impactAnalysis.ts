import type { SecurityScenario, ScenarioMetrics } from "../content/schema";

export interface ImpactLossProfile {
  grossP90: number;
  netP90: number;
  meanLoss: number;
  frequency: number;
}

export interface ImpactAnalysis {
  loss: ImpactLossProfile;
  revenueMillions: number;
  ebitdaMillions: number;
  expectedAnnualLossMillions: number;
  grossP90RevenuePercent: number;
  grossP90EbitdaPercent: number;
  vulnerabilityProxy: number;
  tefFactor: number;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export function deriveImpactAnalysis(
  scenario: SecurityScenario,
  metrics: ScenarioMetrics
): ImpactAnalysis {
  const baselineControl = clamp(scenario.metrics.controlAdoption, 0, 99);
  const currentControl = clamp(metrics.controlAdoption, 0, 99);
  const baselineVulnerability = Math.max(0.01, (100 - baselineControl) / 100);
  const currentVulnerability = Math.max(0.01, (100 - currentControl) / 100);
  const vulnerabilityFactor = currentVulnerability / baselineVulnerability;

  const baselineTef = Math.max(1, scenario.metrics.incidentRate);
  const currentTef = Math.max(0, metrics.incidentRate);
  const tefFactor = currentTef / baselineTef;

  // FAIR teaching relationship: LEF = TEF × Vulnerability. The scenario's
  // published frequency is the baseline LEF; current game metrics scale the
  // TEF and vulnerability components relative to that starting posture.
  const frequencyScale = clamp(tefFactor * vulnerabilityFactor, 0.25, 2.5);
  const frequency = Math.max(
    0.01,
    scenario.lossProfile.frequencyPerYear * frequencyScale
  );

  const revenueMillions = scenario.company.annualRevenueMillions;
  const ebitdaMillions =
    revenueMillions * (scenario.company.ebitdaMarginPercent / 100);
  const grossP90 = scenario.lossProfile.grossP90Millions;
  const meanLoss = scenario.lossProfile.meanLossMillions;

  return {
    loss: {
      grossP90,
      netP90: scenario.lossProfile.netP90Millions,
      meanLoss,
      frequency,
    },
    revenueMillions,
    ebitdaMillions,
    expectedAnnualLossMillions: meanLoss * frequency,
    grossP90RevenuePercent:
      revenueMillions > 0 ? (grossP90 / revenueMillions) * 100 : 0,
    grossP90EbitdaPercent:
      ebitdaMillions > 0 ? (grossP90 / ebitdaMillions) * 100 : 0,
    vulnerabilityProxy: currentVulnerability,
    tefFactor,
  };
}

export function reconstructPreChoiceMetrics(
  activeMetrics: ScenarioMetrics,
  metricDeltas: Partial<ScenarioMetrics>
): ScenarioMetrics {
  const before = { ...activeMetrics };
  (Object.keys(metricDeltas) as (keyof ScenarioMetrics)[]).forEach((key) => {
    const delta = metricDeltas[key];
    if (typeof delta === "number") {
      before[key] = clamp((activeMetrics[key] ?? 0) - delta, 0, 100);
    }
  });
  return before;
}

export function formatImpactMillions(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  if (value >= 100) return `$${value.toFixed(0)}M`;
  return `$${value.toFixed(1)}M`;
}
