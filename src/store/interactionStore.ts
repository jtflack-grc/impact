import { create } from "zustand";

export type ImpactLinkedFocus =
  | "grossP90"
  | "netP90"
  | "frequency"
  | "controlAdoption"
  | "incidentRate"
  | null;

interface ImpactInteractionState {
  linkedFocus: ImpactLinkedFocus;
  setLinkedFocus: (focus: ImpactLinkedFocus) => void;
  clearLinkedFocus: () => void;
}

export const useImpactInteractionStore = create<ImpactInteractionState>(
  (set) => ({
    linkedFocus: null,
    setLinkedFocus: (linkedFocus) => set({ linkedFocus }),
    clearLinkedFocus: () => set({ linkedFocus: null }),
  })
);
