import { create } from "zustand";

export type ImpactLinkedFocus =
  | "grossP90"
  | "netP90"
  | "frequency"
  | "controlAdoption"
  | "incidentRate"
  | null;

export type ImpactViewMode = "analyst" | "board";

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
  viewMode: ImpactViewMode;
  guidedActive: boolean;
  guidedStep: number;
  guidedVoice: boolean;
  cameraReplayToken: number;
  setLinkedFocus: (focus: ImpactLinkedFocus) => void;
  clearLinkedFocus: () => void;
  setTailSelection: (selection: ImpactTailSelection) => void;
  clearTailSelection: () => void;
  setViewMode: (viewMode: ImpactViewMode) => void;
  startGuided: () => void;
  stopGuided: () => void;
  setGuidedStep: (guidedStep: number) => void;
  setGuidedVoice: (guidedVoice: boolean) => void;
  replayCamera: () => void;
}

export const useImpactInteractionStore = create<ImpactInteractionState>(
  (set) => ({
    linkedFocus: null,
    tailSelection: null,
    viewMode: "analyst",
    guidedActive: false,
    guidedStep: 0,
    guidedVoice: false,
    cameraReplayToken: 0,
    setLinkedFocus: (linkedFocus) => set({ linkedFocus }),
    clearLinkedFocus: () => set({ linkedFocus: null }),
    setTailSelection: (tailSelection) => set({ tailSelection }),
    clearTailSelection: () => set({ tailSelection: null }),
    setViewMode: (viewMode) => set({ viewMode }),
    startGuided: () =>
      set((state) => ({
        guidedActive: true,
        guidedStep: 0,
        cameraReplayToken: state.cameraReplayToken + 1,
      })),
    stopGuided: () =>
      set({ guidedActive: false, guidedStep: 0, linkedFocus: null }),
    setGuidedStep: (guidedStep) => set({ guidedStep }),
    setGuidedVoice: (guidedVoice) => set({ guidedVoice }),
    replayCamera: () =>
      set((state) => ({ cameraReplayToken: state.cameraReplayToken + 1 })),
  })
);
