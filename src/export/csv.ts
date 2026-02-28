import type { SimulationResults } from "../store/types";
import type { Archetype } from "../store/types";

export function exportCsv(
  results: SimulationResults,
  archetype: Archetype | null
): string {
  const rows: string[] = [
    "metric,value",
    `mean,${results.mean}`,
    `median,${results.median}`,
    `p50,${results.p50}`,
    `p90,${results.p90}`,
    `p95,${results.p95}`,
    `grossP90,${results.grossP90}`,
    `netP90,${results.netP90}`,
    `iterations,${results.iterationCount}`,
  ];
  if (archetype) {
    rows.push(`archetype,${archetype.displayName}`);
    rows.push(`revenue,${archetype.annualRevenue}`);
    rows.push(`ebitdaMargin,${archetype.ebitdaMargin}`);
  }
  if (results.lossSamples && results.lossSamples.length > 0) {
    rows.push("loss_samples");
    results.lossSamples.forEach((v) => rows.push(String(v)));
  }
  return rows.join("\n");
}
