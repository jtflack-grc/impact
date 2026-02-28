import { describe, it, expect } from "vitest";
import { generateScribe } from "./generate";

describe("generateScribe", () => {
  it("returns string", () => {
    const out = generateScribe({ perspective: "Finance", scene: "inheritance" });
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
  it("Finance perspective mentions P90 or EBITDA when provided", () => {
    const out = generateScribe({
      perspective: "Finance",
      scene: "board",
      netP90: 1e6,
      p90PctEbitda: 18,
    });
    expect(out).toMatch(/P90|EBITDA|18/);
  });
  it("Risk perspective can mention tail or driver", () => {
    const out = generateScribe({
      perspective: "Risk",
      scene: "board",
      topDriver: "P_WriteAccess",
    });
    expect(out).toMatch(/tail|driver|P_WriteAccess|sensitivity/i);
  });
  it("Infrastructure perspective can mention controls or IFS", () => {
    const out = generateScribe({
      perspective: "Infrastructure",
      scene: "pivot",
    });
    expect(out).toMatch(/IFS|control|exit|write/i);
  });
});
