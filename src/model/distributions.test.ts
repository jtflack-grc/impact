import { describe, it, expect } from "vitest";
import { sampleTriangular, samplePoisson, sampleBernoulli } from "./distributions";

describe("sampleTriangular", () => {
  it("returns value within min and max", () => {
    for (let i = 0; i < 50; i++) {
      const v = sampleTriangular(10, 50, 100);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("samplePoisson", () => {
  it("returns non-negative integer", () => {
    for (let i = 0; i < 100; i++) {
      const v = samplePoisson(2);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
  it("returns 0 when lambda is 0", () => {
    expect(samplePoisson(0)).toBe(0);
  });
});

describe("sampleBernoulli", () => {
  it("returns 0 or 1", () => {
    for (let i = 0; i < 50; i++) {
      const v = sampleBernoulli(0.5);
      expect(v === 0 || v === 1).toBe(true);
    }
  });
});
