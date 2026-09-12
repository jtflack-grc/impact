import { deriveImpactAnalysis, formatImpactMillions } from "../model/impactAnalysis";
import { useScenarioStore } from "../store/scenarioStore";
import { ScenarioGlobe } from "./ScenarioGlobe";

function Metric({ label, value, note, emphasis = false }: { label: string; value: string; note: string; emphasis?: boolean }) {
  return (
    <div className={`border p-4 ${emphasis ? "border-red-400/50 bg-red-950/10" : "border-war-border bg-black/35"}`}>
      <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${emphasis ? "text-red-300" : "text-war-white"}`}>{value}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-war-muted">{note}</div>
    </div>
  );
}

export function BoardMode() {
  const scenario = useScenarioStore((state) => state.scenarios[state.currentScenarioIndex]);
  const activeMetrics = useScenarioStore((state) => state.activeMetrics);
  const lastChoiceImpact = useScenarioStore((state) => state.lastChoiceImpact);
  const analysis = deriveImpactAnalysis(scenario, activeMetrics);
  const riskReduction = analysis.loss.grossP90 > 0
    ? ((analysis.loss.grossP90 - analysis.loss.netP90) / analysis.loss.grossP90) * 100
    : 0;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-war-bg lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="min-h-0 overflow-y-auto border-r border-war-border px-6 py-5 xl:px-8">
        <div className="border-b border-war-border pb-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-red-300/80">Board brief · Scenario {scenario.index}</div>
          <h2 className="mt-1 text-2xl font-semibold text-war-white">{scenario.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-war-muted">
            <span>{scenario.company.name}</span>
            <span>{scenario.company.sector}</span>
            <span>{scenario.company.region}</span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-war-muted">
            {scenario.company.description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
          <Metric
            label="Gross P90"
            value={formatImpactMillions(analysis.loss.grossP90)}
            note={`${analysis.grossP90RevenuePercent.toFixed(1)}% of revenue · ${analysis.grossP90EbitdaPercent.toFixed(0)}% of EBITDA`}
            emphasis
          />
          <Metric
            label="Net P90"
            value={formatImpactMillions(analysis.loss.netP90)}
            note={`${riskReduction.toFixed(0)}% below gross P90 after modeled controls/transfer`}
          />
          <Metric
            label="Loss event frequency"
            value={`${analysis.loss.frequency.toFixed(2)}/yr`}
            note={`TEF factor ${analysis.tefFactor.toFixed(2)}× · vulnerability ${(analysis.vulnerabilityProxy * 100).toFixed(0)}%`}
          />
          <Metric
            label="Expected annual loss"
            value={formatImpactMillions(analysis.expectedAnnualLossMillions)}
            note="Mean loss × modeled annual loss-event frequency"
          />
          <Metric
            label="Control adoption"
            value={`${activeMetrics.controlAdoption}%`}
            note="Resistance-strength proxy used on the vulnerability side of LEF"
          />
          <Metric
            label="Top driver"
            value={scenario.lossProfile.topDriver}
            note={scenario.fairFocus ?? "Primary scenario sensitivity anchor"}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="border border-war-border bg-black/30 p-4">
            <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">Decision posture</div>
            {lastChoiceImpact ? (
              <>
                <div className="mt-1 text-sm font-semibold text-war-white">{lastChoiceImpact.label}</div>
                <p className="mt-2 text-xs leading-relaxed text-war-muted">
                  {lastChoiceImpact.summary ?? "Latest decision applied to the current scenario posture."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-war-muted">
                No decision has been applied yet. The board view is showing the current scenario baseline.
              </p>
            )}
          </div>
          <div className="border border-war-border bg-black/30 p-4">
            <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">Board question</div>
            <p className="mt-1 text-sm font-semibold text-war-white">
              Is the residual exposure acceptable relative to EBITDA and operating resilience?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-war-muted">
              FAIR quantifies the exposure; the finance lens shows whether the residual loss is material enough to change capital allocation, liquidity, or risk-transfer decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="relative hidden min-h-0 bg-black lg:block">
        <ScenarioGlobe />
      </section>
    </div>
  );
}
