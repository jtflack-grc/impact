import type { SimulationResults, Archetype, AssumptionEntry, InputValue } from "../store/types";

export function exportJsonBundle(
  inputs: Record<string, InputValue>,
  controls: Record<string, number>,
  assumptionJournal: AssumptionEntry[],
  results: SimulationResults | null,
  archetype: Archetype | null
): string {
  const bundle = {
    exportedAt: new Date().toISOString(),
    archetype: archetype ? { id: archetype.id, displayName: archetype.displayName } : null,
    inputs,
    controls,
    assumptionJournal,
    simulation: results ? { mean: results.mean, p90: results.p90, grossP90: results.grossP90, netP90: results.netP90, topDriver: results.topDriver, iterationCount: results.iterationCount } : null,
  };
  return JSON.stringify(bundle, null, 2);
}
