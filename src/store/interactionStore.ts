import { create } from "zustand";

export type ImpactLinkedFocus =
  | "grossP90"
  | "netP90"
  | "frequency"
  | "controlAdoption"
  | "incidentRate"
  | null;

export interface ImpactTailSelection {
  scenarioId: string;
  label: string;
  lowMillions: number;
  highMillions: number;
  probabilityMass: number;
  conditionalMeanMillions: number;
  percentileLow: number;
  percentileHigh: number;
  annualizedContributionMillions: number;
  ebitdaSharePercent: number;
}

interface ImpactInteractionState {
  linkedFocus: ImpactLinkedFocus;
  tailSelection: ImpactTailSelection | null;
  setLinkedFocus: (focus: ImpactLinkedFocus) => void;
  clearLinkedFocus: () => void;
  setTailSelection: (selection: ImpactTailSelection) => void;
  clearTailSelection: () => void;
}

export const useImpactInteractionStore = create<ImpactInteractionState>((set) => ({
  linkedFocus: null,
  tailSelection: null,
  setLinkedFocus: (linkedFocus) => set({ linkedFocus }),
  clearLinkedFocus: () => set({ linkedFocus: null }),
  setTailSelection: (tailSelection) => set({ tailSelection }),
  clearTailSelection: () => set({ tailSelection: null }),
}));
