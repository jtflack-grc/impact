import { create } from "zustand";
import type {
  SceneId,
  Perspective,
  Archetype,
  ControlMaturity,
  InputVariableId,
  InputValue,
  AssumptionEntry,
  SimulationResults,
  PostureSnapshot,
} from "./types";

export type { SceneId, Perspective, Archetype, ControlMaturity, ControlDef, InputValue, AssumptionEntry, SimulationResults, PostureSnapshot } from "./types";

/** Deep Finance inputs for DSCR (credit-shaped) */
export interface DscrInputs {
  totalDebt: number;
  interestRate: number;
  amortTermYears: number;
  taxRate: number;
  capex: number;
  cashTaxes: number;
  otherAdjustments: number;
  covenantThreshold: number;
}

/** Deep Finance inputs for WACC */
export interface WaccInputs {
  riskFreeRate: number;
  equityRiskPremium: number;
  unleveredBeta: number;
  costOfDebt: number;
  taxRate: number;
  debtWeight: number;
  equityWeight: number;
}

export interface DeepFinanceState {
  dscrInputs: DscrInputs;
  waccInputs: WaccInputs;
}

const DEEP_FINANCE_STORAGE_KEY = "impact-deep-finance";

const defaultDscrInputs: DscrInputs = {
  totalDebt: 50,
  interestRate: 0.06,
  amortTermYears: 5,
  taxRate: 0.25,
  capex: 2.5,
  cashTaxes: 10,
  otherAdjustments: 0,
  covenantThreshold: 1.2,
};

const defaultWaccInputs: WaccInputs = {
  riskFreeRate: 0.035,
  equityRiskPremium: 0.06,
  unleveredBeta: 1.0,
  costOfDebt: 0.05,
  taxRate: 0.25,
  debtWeight: 0.3,
  equityWeight: 0.7,
};

function loadDeepFinanceFromStorage(): DeepFinanceState {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(DEEP_FINANCE_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as DeepFinanceState;
      return {
        dscrInputs: { ...defaultDscrInputs, ...parsed.dscrInputs },
        waccInputs: { ...defaultWaccInputs, ...parsed.waccInputs },
      };
    }
  } catch {
    // ignore
  }
  return { dscrInputs: defaultDscrInputs, waccInputs: defaultWaccInputs };
}

function persistDeepFinance(state: DeepFinanceState): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DEEP_FINANCE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore
  }
}

export interface AppState {
  // Selection
  archetype: Archetype | null;
  perspective: Perspective;
  currentScene: SceneId;

  // Model inputs (variable id -> triangular-ish value)
  inputs: Record<InputVariableId, InputValue>;

  // Controls: control id -> maturity 0–5
  controls: Record<string, ControlMaturity>;

  // Governance
  assumptionJournal: AssumptionEntry[];

  // Simulation
  simulationResults: SimulationResults | null;
  simIterationCount: number; // 2k live, 10k/25k/50k refine

  // Snapshots for Current vs Target
  snapshots: {
    current: PostureSnapshot | null;
    target: PostureSnapshot | null;
  };

  // Deep Finance / valuation
  deepFinanceWacc: number | null;
  deepFinance: DeepFinanceState;

  // Actions
  setArchetype: (a: Archetype | null) => void;
  setPerspective: (p: Perspective) => void;
  setCurrentScene: (s: SceneId) => void;
  setInput: (id: InputVariableId, value: InputValue) => void;
  setControl: (id: string, maturity: ControlMaturity) => void;
  appendAssumption: (entry: Omit<AssumptionEntry, "timestamp">) => void;
  setSimulationResults: (r: SimulationResults | null) => void;
  setSimIterationCount: (n: number) => void;
  setSnapshot: (which: "current" | "target", s: PostureSnapshot | null) => void;
  setDeepFinanceWacc: (wacc: number | null) => void;
  setDscrInputs: (partial: Partial<DscrInputs>) => void;
  setWaccInputs: (partial: Partial<WaccInputs>) => void;
}

const defaultInputs: Record<string, InputValue> = {
  TEF: { min: 0.5, mode: 1, max: 2 },
  P_InitialAccess: { min: 0.1, mode: 0.3, max: 0.6 },
  P_IFSReachable: { min: 0.2, mode: 0.5, max: 0.8 },
  P_WriteAccess: { min: 0.1, mode: 0.4, max: 0.7 },
  T_DetectDays: { min: 1, mode: 5, max: 14 },
  T_RecoveryDays: { min: 3, mode: 10, max: 21 },
  Cost_IR: { min: 100000, mode: 250000, max: 500000 },
  Cost_Recovery: { min: 200000, mode: 500000, max: 1200000 },
  Cost_DowntimePerDay: { min: 50000, mode: 150000, max: 400000 },
  P_Secondary: { min: 0.05, mode: 0.15, max: 0.35 },
};

const initialDeepFinance = loadDeepFinanceFromStorage();

export const useStore = create<AppState>((set) => ({
  archetype: null,
  perspective: "Risk",
  currentScene: "inheritance",
  inputs: { ...defaultInputs },
  controls: {},
  assumptionJournal: [],
  simulationResults: null,
  simIterationCount: 2000,
  snapshots: { current: null, target: null },
  deepFinanceWacc: null,
  deepFinance: initialDeepFinance,

  setArchetype: (archetype) => set({ archetype }),
  setPerspective: (perspective) => set({ perspective }),
  setCurrentScene: (currentScene) => set({ currentScene }),
  setInput: (id, value) =>
    set((state) => ({
      inputs: { ...state.inputs, [id]: value },
    })),
  setControl: (id, maturity) =>
    set((state) => ({
      controls: { ...state.controls, [id]: maturity },
    })),
  appendAssumption: (entry) =>
    set((state) => ({
      assumptionJournal: [
        ...state.assumptionJournal,
        { ...entry, timestamp: new Date().toISOString() },
      ],
    })),
  setSimulationResults: (simulationResults) => set({ simulationResults }),
  setSimIterationCount: (simIterationCount) => set({ simIterationCount }),
  setSnapshot: (which, snapshot) =>
    set((state) => ({
      snapshots: { ...state.snapshots, [which]: snapshot },
    })),
  setDeepFinanceWacc: (deepFinanceWacc) => set({ deepFinanceWacc }),
  setDscrInputs: (partial) =>
    set((state) => {
      const next = {
        ...state.deepFinance,
        dscrInputs: { ...state.deepFinance.dscrInputs, ...partial },
      };
      persistDeepFinance(next);
      return { deepFinance: next };
    }),
  setWaccInputs: (partial) =>
    set((state) => {
      const next = {
        ...state.deepFinance,
        waccInputs: { ...state.deepFinance.waccInputs, ...partial },
      };
      persistDeepFinance(next);
      return { deepFinance: next };
    }),
}));
