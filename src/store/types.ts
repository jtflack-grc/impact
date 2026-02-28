/** Scene IDs from scenario-ifs (8 phases). */
export type SceneId =
  | "inheritance"
  | "exposure"
  | "door"
  | "pivot"
  | "silence"
  | "recovery"
  | "board"
  | "artifact";

/** Perspective toggle: Finance | Risk | Infrastructure */
export type Perspective = "Finance" | "Risk" | "Infrastructure";

/** Archetype (from archetypes.json). */
export interface Archetype {
  id: string;
  displayName: string;
  industry: string;
  annualRevenue: number;
  ebitdaMargin: number;
  cash: number;
  debt: number;
  downtimeImpactFactor: number;
  dataSensitivityTier: string;
  modeledInsurance: {
    deductible: number;
    coverageLimit: number;
    annualPremium: number;
  };
  geography: {
    primaryNodes: Array<{ id: string; label: string; lat: number; lon: number }>;
  };
  sourceNotes?: string;
}

/** Control maturity 0-5; affects variable multipliers. */
export type ControlMaturity = 0 | 1 | 2 | 3 | 4 | 5;

/** Single control from scenario DSL. */
export interface ControlDef {
  id: string;
  group: string;
  label: string;
  variableIds: string[];
}

/** Input variable id (e.g. TEF, P_InitialAccess). */
export type InputVariableId = string;

/** Input value: mode for triangular, or min/mode/max. */
export interface InputValue {
  min?: number;
  mode: number;
  max?: number;
}

/** Assumption journal entry. */
export interface AssumptionEntry {
  timestamp: string;
  fieldId: string;
  old: unknown;
  new: unknown;
  note?: string;
}

/** Simulation result summary (from worker). */
export interface SimulationResults {
  mean: number;
  median: number;
  p50: number;
  p90: number;
  p95: number;
  grossP90: number;
  netP90: number;
  topDriver?: string;
  iterationCount: number;
  lossSamples?: number[];
}

/** Snapshot for Current vs Target comparison. */
export interface PostureSnapshot {
  id: string;
  label: string;
  inputs: Record<InputVariableId, InputValue>;
  controls: Record<string, ControlMaturity>;
  results?: SimulationResults;
  createdAt: string;
}
