import { useEffect, useMemo, useState } from "react";
import type { ScenarioMetricKey } from "../content/schema";
import {
  deriveImpactAnalysis,
  formatImpactMillions,
  reconstructPreChoiceMetrics,
} from "../model/impactAnalysis";
import { useImpactInteractionStore } from "../store/interactionStore";
import { useScenarioStore } from "../store/scenarioStore";

const LABELS: Record<ScenarioMetricKey, string> = {
  controlAdoption: "Control adoption",
  incidentRate: "Threat event frequency",
  successIndex: "Success index",
  welfareDebt: "Governance debt",
  systemReversibility: "System reversibility",
  debtIndex: "Debt index",
};

const FAIR_LINKED = new Set<ScenarioMetricKey>([
  "controlAdoption",
  "incidentRate",
]);

export function WhyDidThisChange() {
  const scenario = useScenarioStore(
    (state) => state.scenarios[state.currentScenarioIndex]
  );
  const activeMetrics = useScenarioStore((state) => state.activeMetrics);
  const lastChoiceImpact = useScenarioStore((state) => state.lastChoiceImpact);
  const setLinkedFocus = useImpactInteractionStore(
    (state) => state.setLinkedFocus
  );
  const clearLinkedFocus = useImpactInteractionStore(
    (state) => state.clearLinkedFocus
  );
  const [open, setOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] =
    useState<ScenarioMetricKey | null>(null);

  const changedMetrics = useMemo(
    () =>
      (
        Object.entries(lastChoiceImpact?.metricDeltas ?? {}) as [
          ScenarioMetricKey,
          number,
        ][]
      ).filter(([, delta]) => typeof delta === "number" && delta !== 0),
    [lastChoiceImpact]
  );

  const beforeMetrics = useMemo(
    () =>
      reconstructPreChoiceMetrics(
        activeMetrics,
        lastChoiceImpact?.metricDeltas ?? {}
      ),
    [activeMetrics, lastChoiceImpact]
  );
  const before = useMemo(
    () => deriveImpactAnalysis(scenario, beforeMetrics),
    [beforeMetrics, scenario]
  );
  const after = useMemo(
    () => deriveImpactAnalysis(scenario, activeMetrics),
    [activeMetrics, scenario]
  );

  useEffect(() => {
    setOpen(false);
    setSelectedMetric(null);
  }, [scenario.id, lastChoiceImpact?.label]);

  useEffect(() => () => clearLinkedFocus(), [clearLinkedFocus]);

  if (!lastChoiceImpact || changedMetrics.length === 0) return null;

  const selectMetric = (key: ScenarioMetricKey) => {
    setSelectedMetric(key);
    if (key === "controlAdoption") setLinkedFocus("controlAdoption");
    else if (key === "incidentRate") setLinkedFocus("incidentRate");
    else clearLinkedFocus();
  };

  const selectedDelta = selectedMetric
    ? lastChoiceImpact.metricDeltas[selectedMetric]
    : undefined;

  return (
    <div className="border-t border-slate-600/70 pt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (open) {
            setSelectedMetric(null);
            clearLinkedFocus();
          }
        }}
        className="flex w-full items-center justify-between border border-slate-600 bg-black/25 px-3 py-2 text-left hover:border-red-400/50"
      >
        <span>
          <span className="block text-[9px] uppercase tracking-[0.18em] text-red-300/80">
            Causal trace
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-white">
            Why did this change?
          </span>
        </span>
        <span className="font-mono text-xs text-slate-400">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="mt-2 border border-slate-700 bg-black/30 p-3">
          <div className="text-[10px] leading-relaxed text-slate-300">
            <span className="text-slate-500">Decision</span>
            <span className="mx-2 text-red-300">→</span>
            <span className="text-white">{lastChoiceImpact.label}</span>
            <span className="mx-2 text-red-300">→</span>
            <span className="text-white">TEF × vulnerability</span>
            <span className="mx-2 text-red-300">→</span>
            <span className="text-white">LEF</span>
            <span className="mx-2 text-red-300">→</span>
            <span className="text-white">annualized loss</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono sm:grid-cols-4">
            <div className="border border-slate-700 px-2 py-2">
              <div className="text-slate-500">Vulnerability</div>
              <div className="mt-1 text-white">
                {(before.vulnerabilityProxy * 100).toFixed(0)}% →{" "}
                {(after.vulnerabilityProxy * 100).toFixed(0)}%
              </div>
            </div>
            <div className="border border-slate-700 px-2 py-2">
              <div className="text-slate-500">TEF factor</div>
              <div className="mt-1 text-white">
                {before.tefFactor.toFixed(2)}× → {after.tefFactor.toFixed(2)}×
              </div>
            </div>
            <div className="border border-slate-700 px-2 py-2">
              <div className="text-slate-500">LEF</div>
              <div className="mt-1 text-white">
                {before.loss.frequency.toFixed(2)}/yr →{" "}
                {after.loss.frequency.toFixed(2)}/yr
              </div>
            </div>
            <div className="border border-slate-700 px-2 py-2">
              <div className="text-slate-500">Expected annual loss</div>
              <div className="mt-1 text-white">
                {formatImpactMillions(before.expectedAnnualLossMillions)} →{" "}
                {formatImpactMillions(after.expectedAnnualLossMillions)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500">
              Inspect a changed factor
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {changedMetrics.map(([key, delta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectMetric(key)}
                  className={`border px-2 py-1.5 text-[10px] ${
                    selectedMetric === key
                      ? "border-red-400 bg-red-950/20 text-red-200"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {LABELS[key]} {delta > 0 ? "+" : ""}
                  {delta}
                </button>
              ))}
            </div>
          </div>

          {selectedMetric && (
            <div className="mt-3 border-l-2 border-red-400 pl-3 text-[10px] leading-relaxed text-slate-300">
              <span className="font-semibold text-white">
                {LABELS[selectedMetric]}{" "}
                {selectedDelta && selectedDelta > 0 ? "+" : ""}
                {selectedDelta}
              </span>{" "}
              {FAIR_LINKED.has(selectedMetric) ? (
                selectedMetric === "controlAdoption" ? (
                  <>
                    changes the vulnerability side of the teaching model. Higher
                    control adoption lowers the vulnerability proxy, which
                    changes LEF and therefore expected annual loss.
                  </>
                ) : (
                  <>
                    changes the threat-event-frequency side of the teaching
                    model. That TEF factor combines with vulnerability to change
                    LEF and therefore expected annual loss.
                  </>
                )
              ) : (
                <>
                  is a scenario/game mechanic. It can change the narrative
                  posture and decision quality, but it does not directly alter
                  the FAIR loss calculation in this build.
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
