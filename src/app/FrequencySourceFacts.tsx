import type { SecurityScenario, ScenarioMetrics } from "../content/schema";
import { annualProbabilityOfAtLeastOneEvent } from "../model/riskDecisionFinance";
import { deriveImpactAnalysis } from "../model/impactAnalysis";
import { EduTooltip } from "./EduTooltip";

interface Props {
  scenario: SecurityScenario;
  metrics: ScenarioMetrics;
}

/**
 * Keep provenance visible without implying the fictional loss-event rates
 * are calibrated by Laura Voicu and Jack Jones's separate TEF Estimator.
 */
export function FrequencySourceFacts({ scenario, metrics }: Props) {
  const analysis = deriveImpactAnalysis(scenario, metrics);
  const baseline = deriveImpactAnalysis(scenario, scenario.metrics);
  const annualProbability = annualProbabilityOfAtLeastOneEvent(analysis.loss.frequency);
  return (
    <div className="mt-4 border border-war-border bg-[#0d1115] p-4">
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-semibold text-war-white">Frequency · Source facts</h3>
        <EduTooltip
          title="What can we substantiate?"
          body="The scenario baseline is an authored educational assumption, not a measured attempt rate. Choice-driven frequency and control-adoption scores are indexes. The scenario model scales baseline loss-event frequency by a frequency-index ratio and an illustrative vulnerability proxy. It does not ingest telemetry or an externally calibrated TEF estimate."
          badge="FAIR"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-y border-war-border/60 py-3 sm:grid-cols-3">
        <div>
          <div className="text-[10px] text-war-muted">Assumed baseline LEF</div>
          <div className="font-mono text-base text-war-white">{baseline.loss.frequency.toFixed(2)}/yr</div>
        </div>
        <div>
          <div className="text-[10px] text-war-muted">Current modeled LEF</div>
          <div className="font-mono text-base text-war-white">{analysis.loss.frequency.toFixed(2)}/yr</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[10px] text-war-muted">Chance of ≥1 loss in 12 months</div>
          <div className="font-mono text-base text-war-white">{(annualProbability * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-war-muted">Illustrative constant-rate Poisson</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-war-muted">
        <span className="text-war-white">Evidence status:</span> the {scenario.company.sector.toLowerCase()} scenario's
        {" "}frequency baseline, control effects and per-event loss anchors are educational assumptions.
        The probability is derived from modeled LEF, not observed attack data.
      </p>
      <details className="mt-3 border-t border-war-border/60 pt-3 group">
        <summary className="cursor-pointer text-[11px] font-medium text-[#a5c3d3] hover:text-war-white">
          Inspect the calculation and source limitations
        </summary>
        <div className="mt-3 space-y-2 text-[10px] leading-relaxed text-war-muted">
          <p>
            <span className="text-war-white">Starting point:</span> authored loss-event frequency
            {" "}{scenario.lossProfile.frequencyPerYear.toFixed(2)}/year. This is LEF (successful loss events), not TEF (threat attempts).
          </p>
          <p>
            <span className="text-war-white">Frequency index:</span> {scenario.metrics.incidentRate} → {metrics.incidentRate}.
            The ratio represents a narrative adjustment, not a measured attempt count.
          </p>
          <p>
            <span className="text-war-white">Control proxy:</span> {scenario.metrics.controlAdoption}% → {metrics.controlAdoption}% adoption;
            vulnerability is approximated as 100% minus adoption. This is not calibrated susceptibility or measured efficacy.
          </p>
          <p>
            <span className="text-war-white">LEF transformation:</span> baseline LEF × frequency-index ratio ×
            vulnerability-proxy ratio, with a 0.25×–2.5× scenario scale limit and a 0.01/year floor.
            Chance of at least one event = 1 − exp(−LEF) only under the stated Poisson assumption.
          </p>
          <p>
            <span className="text-war-white">External reading, not imported data:</span>{" "}
            <a className="text-[#a5c3d3] underline underline-offset-2" href="https://github.com/security-decision-science/security-decision-labs/tree/main/tools/tef-estimator" target="_blank" rel="noopener noreferrer">
              Voicu &amp; Jones TEF Estimator 1.3.0
            </a>
            {" "}documents empirically informed TEF by initial-access vector. We do not present its outputs as
            equivalent to this fictional scenario's LEF or import its model, code or fitted dispersion parameters.
          </p>
        </div>
      </details>
    </div>
  );
}
