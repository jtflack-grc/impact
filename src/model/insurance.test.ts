import { describe, it, expect } from "vitest";
import { netLoss } from "./insurance";

describe("netLoss", () => {
  it("returns gross when gross <= deductible", () => {
    expect(netLoss(100, 200, 1000)).toBe(100);
  });
  it("reduces by covered amount", () => {
    const net = netLoss(500, 100, 1000);
    expect(net).toBe(100);
  });
  it("caps insured at coverageLimit", () => {
    expect(netLoss(2000, 100, 1000)).toBe(1000);
  });
});
