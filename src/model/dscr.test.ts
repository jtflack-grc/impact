import { describe, it, expect } from "vitest";
import { debtService, cfads, dscr } from "./dscr";

describe("dscr", () => {
  describe("debtService", () => {
    it("computes interest + principal (straight-line amort)", () => {
      // 100M debt, 6%, 5yr -> interest 6M, principal 20M
      expect(debtService(100, 0.06, 5)).toBeCloseTo(26, 1);
    });
    it("avoids division by zero for zero amort term", () => {
      expect(debtService(100, 0.06, 0)).toBe(6);
    });
  });

  describe("cfads", () => {
    it("subtracts taxes and capex, adds other adjustments", () => {
      expect(cfads(50, 10, 5, 0)).toBe(35);
      expect(cfads(50, 10, 5, 2)).toBe(37);
    });
  });

  describe("dscr", () => {
    it("returns CFADS / debt service", () => {
      const ds = debtService(100, 0.06, 5);
      expect(dscr(52, 100, 0.06, 5)).toBeCloseTo(52 / ds, 2);
    });
    it("returns 0 when debt service is zero", () => {
      expect(dscr(50, 0, 0.06, 5)).toBe(0);
    });
  });
});
