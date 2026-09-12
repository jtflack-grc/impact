import {
  deriveImpactAnalysis,
  formatImpactMillions,
} from "../model/impactAnalysis";
import { useScenarioStore } from "../store/scenarioStore";

function ExposureMetric({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: string;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`border px-5 py-4 ${emphasis ? "border-red-400/55 bg-red-950/10" : "border-war-border bg-black/30"}`}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-2xl font-semibold ${emphasis ? "text-red-300" : "text-war-white"}`}
      >
        {value}
      </div>
      <div className="mt-2 text-[10px] leading-relaxed text-war-muted">
        {note}
      </div>
    </div>
  );
}

function BriefSection({
  label,
  title,
  children,
  emphasis = false,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`border p-5 ${emphasis ? "border-red-400/45 bg-red-950/10" : "border-war-border bg-black/25"}`}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-war-white">{title}</div>
      <div className="mt-3 text-xs leading-relaxed text-war-muted">
        {children}
      </div>
    </div>
  );
}

export function BoardMode() {
  const scenario = useScenarioStore(
    (state) => state.scenarios[state.currentScenarioIndex]
  );
  const currentStep = useScenarioStore((state) => {
    const activeScenario = state.scenarios[state.currentScenarioIndex];
    return activeScenario.steps[state.currentStepIndex];
  });
  const activeMetrics = useScenarioStore((state) => state.activeMetrics);
  const lastChoiceImpact = useScenarioStore((state) => state.lastChoiceImpact);
  const analysis = deriveImpactAnalysis(scenario, activeMetrics);

  const riskReduction =
    analysis.loss.grossP90 > 0
      ? ((analysis.loss.grossP90 - analysis.loss.netP90) /
          analysis.loss.grossP90) *
        100
      : 0;
  const residualEbitdaPercent =
    analysis.ebitdaMillions > 0
      ? (analysis.loss.netP90 / analysis.ebitdaMillions) * 100
      : 0;
  const residualRevenuePercent =
    analysis.revenueMillions > 0
      ? (analysis.loss.netP90 / analysis.revenueMillions) * 100
      : 0;

  const boardAsk =
    currentStep.prompt ??
    "Is the remaining exposure acceptable relative to earnings, resilience, and the organization's risk appetite?";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-war-bg">
      <section className="mx-auto w-full max-w-[1500px] px-6 py-6 xl:px-10 xl:py-8">
        <header className="border-b border-war-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-red-300/80">
              Board risk memo · For discussion
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-war-muted">
              <span className="border border-war-border px-2 py-1">
                Scenario {scenario.index}
              </span>
              <span className="border border-war-border px-2 py-1">
                {scenario.severity} severity
              </span>
              <span className="border border-war-border px-2 py-1">
                {scenario.company.region}
              </span>
            </div>
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-war-white xl:text-4xl">
            {scenario.title}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-war-muted">
            <span>{scenario.company.name}</span>
            <span>{scenario.company.sector}</span>
            <span>{scenario.category}</span>
            <span>{scenario.company.headquarters}</span>
          </div>
        </header>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.6fr)]">
          <div className="border border-war-border bg-black/30 p-6">
            <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
              Executive assessment
            </div>
            <p className="mt-3 max-w-5xl text-lg leading-relaxed text-war-white">
              {scenario.company.name} is carrying a modeled gross P90 cyber loss
              of {formatImpactMillions(analysis.loss.grossP90)}. Current
              controls, recovery, and risk transfer reduce that to a residual
              P90 of {formatImpactMillions(analysis.loss.netP90)}, or{" "}
              {residualEbitdaPercent.toFixed(0)}% of annual EBITDA.
            </p>
            <p className="mt-4 max-w-5xl text-sm leading-relaxed text-war-muted">
              The primary loss driver is {scenario.lossProfile.topDriver}. The
              modeled expected annual loss is{" "}
              {formatImpactMillions(analysis.expectedAnnualLossMillions)} at a
              loss-event frequency of {analysis.loss.frequency.toFixed(2)} per
              year. The exposure is financially material enough to warrant an
              explicit risk-appetite decision rather than being treated as a
              purely technical security issue.
            </p>
          </div>

          <div className="border border-war-border bg-black/35 p-5">
            <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
              Decision status
            </div>
            <div className="mt-3 text-xl font-semibold text-war-white">
              {lastChoiceImpact
                ? "Management action selected"
                : "Decision pending"}
            </div>
            <div className="mt-4 border-t border-war-border pt-4 text-xs leading-relaxed text-war-muted">
              {lastChoiceImpact
                ? lastChoiceImpact.label
                : "No simulated management action has been applied at this decision point."}
            </div>
            <div className="mt-4 border-t border-war-border pt-4 font-mono text-[10px] text-war-muted">
              Control adoption {activeMetrics.controlAdoption}%
              <br />
              Modeled gross-to-residual reduction {riskReduction.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="mt-4 border border-red-400/50 bg-red-950/10 p-6 xl:p-7">
          <div className="text-[9px] uppercase tracking-[0.2em] text-red-300/80">
            Board decision
          </div>
          <div className="mt-3 max-w-6xl text-xl font-semibold leading-snug text-war-white xl:text-2xl">
            {boardAsk}
          </div>
          <p className="mt-3 max-w-5xl text-sm leading-relaxed text-war-muted">
            The board's role here isn't to optimize the FAIR model. It's to
            decide whether management's proposed posture, capital allocation,
            and retained exposure are acceptable given the business consequence,
            and whether additional mitigation, transfer, or evidence is required
            before accepting the risk.
          </p>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
                Financial exposure
              </div>
              <div className="mt-1 text-base font-semibold text-war-white">
                Quantified downside supporting the decision
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-war-muted">
              Annual EBITDA {formatImpactMillions(analysis.ebitdaMillions)} ·
              Annual revenue {formatImpactMillions(analysis.revenueMillions)}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ExposureMetric
              label="Gross P90"
              value={formatImpactMillions(analysis.loss.grossP90)}
              note={`${analysis.grossP90EbitdaPercent.toFixed(0)}% of annual EBITDA before modeled mitigation`}
              emphasis
            />
            <ExposureMetric
              label="Residual P90"
              value={formatImpactMillions(analysis.loss.netP90)}
              note={`${residualEbitdaPercent.toFixed(0)}% of EBITDA · ${residualRevenuePercent.toFixed(1)}% of revenue`}
            />
            <ExposureMetric
              label="Expected annual loss"
              value={formatImpactMillions(analysis.expectedAnnualLossMillions)}
              note="Mean loss × modeled annual loss-event frequency"
            />
            <ExposureMetric
              label="Loss-event frequency"
              value={`${analysis.loss.frequency.toFixed(2)}/yr`}
              note={`TEF ${analysis.tefFactor.toFixed(2)}× baseline · vulnerability ${(analysis.vulnerabilityProxy * 100).toFixed(0)}%`}
            />
          </div>
        </div>

        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          <BriefSection
            label="Management posture"
            title={lastChoiceImpact?.label ?? "No action selected yet"}
          >
            {lastChoiceImpact ? (
              <>
                {lastChoiceImpact.summary ??
                  "The latest simulated management action has been applied to the current risk posture."}
                <div className="mt-4 border-t border-war-border pt-3 font-mono text-[10px] text-war-muted">
                  Control adoption {activeMetrics.controlAdoption}% · Modeled
                  risk reduction {riskReduction.toFixed(0)}%
                </div>
              </>
            ) : (
              <>
                Management has not yet selected a simulated response. The
                figures above represent the current baseline for this decision
                point.
                <div className="mt-4 border-t border-war-border pt-3 font-mono text-[10px] text-war-muted">
                  Control adoption {activeMetrics.controlAdoption}%
                </div>
              </>
            )}
          </BriefSection>

          <BriefSection
            label="Residual exposure"
            title={`${formatImpactMillions(analysis.loss.netP90)} remains at P90`}
          >
            Modeled mitigation removes {riskReduction.toFixed(0)}% of gross P90,
            but the remaining tail exposure is still equal to{" "}
            {residualEbitdaPercent.toFixed(0)}% of annual EBITDA. The governance
            question is whether to accept it, spend more to reduce it, transfer
            more of it, or require additional evidence before deciding.
          </BriefSection>

          <BriefSection
            label="Key watchpoint"
            title={scenario.lossProfile.topDriver}
          >
            {scenario.fairFocus ??
              "This factor is the primary scenario sensitivity anchor and deserves explicit challenge before the exposure is accepted."}
            <div className="mt-4 border-t border-war-border pt-3 text-[10px] leading-relaxed text-war-muted">
              Board challenge: confirm that management's assumptions about this
              driver are supported well enough for the decision being made.
            </div>
          </BriefSection>
        </div>

        <div className="mt-7 border-t border-war-border pt-4 text-[10px] leading-relaxed text-war-muted">
          Board view intentionally suppresses analyst detail. Return to Analyst
          mode for the full FAIR teaching model, scenario controls, tail lens,
          causal trace, finance modules, and geographic scenario view.
        </div>
      </section>
    </div>
  );
}
