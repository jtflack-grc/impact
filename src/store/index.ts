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
}));
