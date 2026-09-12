import { describe, expect, it } from "vitest";
import {
  buildCalibratedLossSamples,
  buildLossHistogram,
  percentileValue,
} from "./scenarioLossDistribution";

describe("scenario loss distribution", () => {
  it("is deterministic for a scenario seed", () => {
    const first = buildCalibratedLossSamples(35, 180, "na-ransomware-ibmi", 1000);
    const second = buildCalibratedLossSamples(35, 180, "na-ransomware-ibmi", 1000);
    expect(second).toEqual(first);
  });

  it("stays close to the published mean and P90 anchors", () => {
    const targetMean = 35;
    const targetP90 = 180;
    const samples = buildCalibratedLossSamples(
      targetMean,
      targetP90,
      "calibration-test",
      30000
    );
    const sampleMean = samples.reduce((total, sample) => total + sample, 0) / samples.length;
    const sampleP90 = percentileValue(samples, 0.9);

    expect(sampleMean).toBeGreaterThan(targetMean * 0.94);
    expect(sampleMean).toBeLessThan(targetMean * 1.06);
    expect(sampleP90).toBeGreaterThan(targetP90 * 0.96);
    expect(sampleP90).toBeLessThan(targetP90 * 1.04);
  });

  it("accounts for every sample in the histogram", () => {
    const samples = buildCalibratedLossSamples(24, 120, "vendor-breach", 5000);
    const histogram = buildLossHistogram(samples, 24);
    const count = histogram.reduce((total, bin) => total + bin.count, 0);
    const share = histogram.reduce((total, bin) => total + bin.share, 0);

    expect(count).toBe(samples.length);
    expect(share).toBeCloseTo(1, 8);
  });
});
