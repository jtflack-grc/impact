import { describe, it, expect } from "vitest";
import { probabilityMultiplier, timeMultiplier, costMultiplier } from "./controlMultipliers";

describe("controlMultipliers", () => {
  it("maturity 0 gives 1", () => {
    expect(probabilityMultiplier(0)).toBe(1);
    expect(timeMultiplier(0)).toBe(1);
    expect(costMultiplier(0)).toBe(1);
  });
  it("maturity 5 reduces below 1", () => {
    expect(probabilityMultiplier(5)).toBeLessThan(1);
    expect(probabilityMultiplier(5)).toBeGreaterThan(0);
    expect(timeMultiplier(5)).toBeLessThan(1);
    expect(costMultiplier(5)).toBeLessThan(1);
  });
  it("higher maturity gives lower multiplier", () => {
    expect(probabilityMultiplier(3)).toBeLessThan(probabilityMultiplier(1));
    expect(timeMultiplier(4)).toBeLessThan(timeMultiplier(2));
  });
});
