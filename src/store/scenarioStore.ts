import { create } from "zustand";
import type { ScenarioMetrics } from "../content/schema";
import { SECURITY_SCENARIOS } from "../content/securityScenarios";

export interface ChoiceImpact {
  label: string;
  summary?: string;
  metricDeltas: Partial<ScenarioMetrics>;
}

export interface ScenarioState {
  scenarios: typeof SECURITY_SCENARIOS;
  currentScenarioIndex: number;
  currentStepIndex: number;
  activeMetrics: ScenarioMetrics;
  showResults: boolean; // Pause to show effects after choice
  lastChoiceImpact: ChoiceImpact | null; // What changed from the last choice (for popup)
  simulationComplete: boolean; // True when user has finished the last step of the last scenario
  setScenarioByIndex: (index: number) => void;
  setScenarioById: (id: string) => void;
  choose: (choiceId?: string) => void;
  continueAfterResults: () => void;
  moveToNextScenario: () => void; // Explicitly go to next scenario (no auto-advance)
  resetSimulation: () => void; // Reset to scenario 0 and clear completion (e.g. Play again)
  restartCurrent: () => void;
}

function clampMetric(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function applyMetricDeltas(base: ScenarioMetrics, deltas?: Partial<ScenarioMetrics>): ScenarioMetrics {
  if (!deltas) return base;
  const next: ScenarioMetrics = { ...base };
  (Object.keys(deltas) as (keyof ScenarioMetrics)[]).forEach((k) => {
    const delta = deltas[k];
    if (typeof delta === "number") {
      next[k] = clampMetric((next[k] ?? 0) + delta);
    }
  });
  return next;
}

export const useScenarioStore = create<ScenarioState>((set, get) => {
  const initialScenario = SECURITY_SCENARIOS[0];

  return {
    scenarios: SECURITY_SCENARIOS,
    currentScenarioIndex: 0,
    currentStepIndex: 0,
    activeMetrics: { ...initialScenario.metrics },
    showResults: false,
    lastChoiceImpact: null,
    simulationComplete: false,

    setScenarioByIndex: (index) => {
      const scenarios = get().scenarios;
      const safeIndex = Math.min(Math.max(index, 0), scenarios.length - 1);
      const scenario = scenarios[safeIndex];
      set({
        currentScenarioIndex: safeIndex,
        currentStepIndex: 0,
        activeMetrics: { ...scenario.metrics },
        showResults: false,
        lastChoiceImpact: null,
        simulationComplete: false,
      });
    },

    setScenarioById: (id) => {
      const scenarios = get().scenarios;
      const idx = scenarios.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const scenario = scenarios[idx];
      set({
        currentScenarioIndex: idx,
        currentStepIndex: 0,
        activeMetrics: { ...scenario.metrics },
        showResults: false,
        lastChoiceImpact: null,
        simulationComplete: false,
      });
    },

    choose: (choiceId) => {
      const state = get();
      const scenario = state.scenarios[state.currentScenarioIndex];
      const step = scenario.steps[state.currentStepIndex];

      let nextMetrics = state.activeMetrics;
      let impact: ChoiceImpact | null = null;
      if (step?.choices && choiceId) {
        const choice = step.choices.find((c) => c.id === choiceId);
        if (choice?.metricDeltas) {
          nextMetrics = applyMetricDeltas(nextMetrics, choice.metricDeltas);
          impact = {
            label: choice.label,
            summary: choice.summary,
            metricDeltas: choice.metricDeltas,
          };
        }
      }

      set({
        activeMetrics: nextMetrics,
        showResults: true,
        lastChoiceImpact: impact,
      });
    },

    continueAfterResults: () => {
      const state = get();
      const scenario = state.scenarios[state.currentScenarioIndex];
      const atLastStep = state.currentStepIndex >= scenario.steps.length - 1;
      const atLastScenario = state.currentScenarioIndex >= state.scenarios.length - 1;
      // When on last step of last scenario, clicking Continue = simulation complete
      if (atLastStep && atLastScenario) {
        set({ showResults: false, lastChoiceImpact: null, simulationComplete: true });
        return;
      }
      if (atLastStep) {
        set({ showResults: false, lastChoiceImpact: null });
        return;
      }
      const nextStepIndex = state.currentStepIndex + 1;
      set({
        currentStepIndex: nextStepIndex,
        showResults: false,
        lastChoiceImpact: null,
      });
    },

    moveToNextScenario: () => {
      const state = get();
      const nextScenarioIndex = state.currentScenarioIndex + 1;
      const scenarios = state.scenarios;
      if (nextScenarioIndex >= scenarios.length) {
        set({ showResults: false, lastChoiceImpact: null });
        return;
      }
      const nextScenario = scenarios[nextScenarioIndex];
      set({
        currentScenarioIndex: nextScenarioIndex,
        currentStepIndex: 0,
        activeMetrics: { ...nextScenario.metrics },
        showResults: false,
        lastChoiceImpact: null,
      });
    },

    resetSimulation: () => {
      const scenarios = get().scenarios;
      const first = scenarios[0];
      set({
        currentScenarioIndex: 0,
        currentStepIndex: 0,
        activeMetrics: { ...first.metrics },
        showResults: false,
        lastChoiceImpact: null,
        simulationComplete: false,
      });
    },

    restartCurrent: () => {
      const state = get();
      const scenario = state.scenarios[state.currentScenarioIndex];
      set({
        currentStepIndex: 0,
        activeMetrics: { ...scenario.metrics },
        showResults: false,
        lastChoiceImpact: null,
        simulationComplete: false,
      });
    },
  };
});

