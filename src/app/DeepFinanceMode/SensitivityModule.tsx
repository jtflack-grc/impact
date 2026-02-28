import { useMemo } from "react";
import { useScenarioStore } from "../../store/scenarioStore";
import { EduTooltip } from "../EduTooltip";
import { useStore } from "../../store";
import { dcfFromCashFlows, buildProjectedFcf } from "../../model/dcf";

interface SensitivityModuleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function formatMillions(n: number): string {
  return `$${n.toFixed(1)}M`;
}

export function SensitivityModule({ isExpanded, onToggle }: SensitivityModuleProps) {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const deepFinanceWacc = useStore((s) => s.deepFinanceWacc);
  const baselineWacc = 0.092;
  const effectiveWacc = deepFinanceWacc ?? baselineWacc;

  function npv(controlCost: number, annualBenefit: number, years = 3): number {
    let pvBenefits = 0;
    for (let t = 1; t <= years; t++) {
      pvBenefits += annualBenefit / Math.pow(1 + effectiveWacc, t);
    }
    return -controlCost + pvBenefits;
  }

  // Base FAIR loss profile (no governance-debt hacks)
  const baseLossProfile = useMemo(
    () => ({
      grossP90: scenario.lossProfile.grossP90Millions,
      netP90: scenario.lossProfile.netP90Millions,
      frequency: scenario.lossProfile.frequencyPerYear,
    }),
    [scenario.lossProfile]
  );

  // FMVA layer: base NPV of the control investment using FAIR risk reduction
  const baseAnnualBenefit = baseLossProfile.grossP90 - baseLossProfile.netP90;
  const baseControlCost = Math.max(2, scenario.company.annualRevenueMillions * 0.002 * 3);
  const baseNPV = npv(baseControlCost, baseAnnualBenefit);

  // DCF base equity and WACC-stressed equity for "Equity Value (DCF) Δ" column
  const revenue = scenario.company.annualRevenueMillions;
  const marginPercent = scenario.company.ebitdaMarginPercent;
  const projectedFcf = useMemo(() => buildProjectedFcf(revenue, marginPercent), [revenue, marginPercent]);
  const terminalGrowth = 0.025;
  const baseEquity = useMemo(
    () => dcfFromCashFlows(projectedFcf, terminalGrowth, effectiveWacc).equityValue,
    [projectedFcf, effectiveWacc]
  );
  const waccHigh = effectiveWacc + 0.01;
  const equityAtHighWacc = useMemo(
    () => dcfFromCashFlows(projectedFcf, terminalGrowth, waccHigh).equityValue,
    [projectedFcf, waccHigh]
  );
  const equityValueDeltaWacc = baseEquity - equityAtHighWacc; // positive when high WACC lowers value

  // Sensitivity scenarios (1D table, grounded in FAIR + FMVA)
  const sensitivityData = useMemo(() => {
    // Loss Severity ±10% (affects Gross/Net P90 and thus annual benefit)
    const severityLow = {
      grossP90: baseLossProfile.grossP90 * 0.9,
      netP90: baseLossProfile.netP90 * 0.9,
    };
    const severityHigh = {
      grossP90: baseLossProfile.grossP90 * 1.1,
      netP90: baseLossProfile.netP90 * 1.1,
    };
    const severityLowBenefit = severityLow.grossP90 - severityLow.netP90;
    const severityHighBenefit = severityHigh.grossP90 - severityHigh.netP90;
    const severityLowNPV = npv(baseControlCost, severityLowBenefit);
    const severityHighNPV = npv(baseControlCost, severityHighBenefit);

    // Frequency ±10% (affects expected annual loss; we approximate NPV impact proportionally)
    const freqLow = baseLossProfile.frequency * 0.9;
    const freqHigh = baseLossProfile.frequency * 1.1;
    const freqLowNPV = baseNPV * (freqLow / baseLossProfile.frequency);
    const freqHighNPV = baseNPV * (freqHigh / baseLossProfile.frequency);

    // Insurance Limit ±20% (modeled by changing Net P90, keeping Gross fixed)
    const insuranceLowNetP90 = baseLossProfile.netP90 * 1.2; // Less coverage
    const insuranceHighNetP90 = baseLossProfile.netP90 * 0.8; // More coverage
    const insuranceLowBenefit = baseLossProfile.grossP90 - insuranceLowNetP90;
    const insuranceHighBenefit = baseLossProfile.grossP90 - insuranceHighNetP90;
    const insuranceLowNPV = npv(baseControlCost, insuranceLowBenefit);
    const insuranceHighNPV = npv(baseControlCost, insuranceHighBenefit);

    // WACC +100bps (higher discount rate → lower NPV)
    const waccHigh = effectiveWacc + 0.01;
    function npvWithWacc(controlCost: number, annualBenefit: number, wacc: number, years = 3): number {
      let pvBenefits = 0;
      for (let t = 1; t <= years; t++) {
        pvBenefits += annualBenefit / Math.pow(1 + wacc, t);
      }
      return -controlCost + pvBenefits;
    }
    const waccHighNPV = npvWithWacc(baseControlCost, baseAnnualBenefit, waccHigh);

    return [
      {
        driver: "Loss Severity",
        low: formatMillions(severityLowNPV),
        base: formatMillions(baseNPV),
        high: formatMillions(severityHighNPV),
        equityImpact: formatMillions(severityHighNPV - severityLowNPV),
        equityValueDcfDelta: "—",
      },
      {
        driver: "Frequency",
        low: formatMillions(freqLowNPV),
        base: formatMillions(baseNPV),
        high: formatMillions(freqHighNPV),
        equityImpact: formatMillions(freqHighNPV - freqLowNPV),
        equityValueDcfDelta: "—",
      },
      {
        driver: "Insurance Limit",
        low: formatMillions(insuranceLowNPV),
        base: formatMillions(baseNPV),
        high: formatMillions(insuranceHighNPV),
        equityImpact: formatMillions(insuranceHighNPV - insuranceLowNPV),
        equityValueDcfDelta: "—",
      },
      {
        driver: "WACC",
        low: formatMillions(baseNPV),
        base: formatMillions(baseNPV),
        high: formatMillions(waccHighNPV),
        equityImpact: formatMillions(waccHighNPV - baseNPV),
        equityValueDcfDelta: formatMillions(equityValueDeltaWacc),
      },
    ];
  }, [baseLossProfile, baseNPV, baseControlCost, baseAnnualBenefit, equityValueDeltaWacc]);

  if (!isExpanded) {
    return (
      <div className="rounded-lg border border-war-border/50 bg-black/40 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-semibold text-war-white/90">Sensitivity Analysis</span>
          <svg
            className="w-4 h-4 text-war-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-war-border/50 bg-black/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-war-white/90">Structured Sensitivity Table</h4>
          <EduTooltip
            title="Sensitivity Analysis"
            body="Shows how changes in key drivers (loss severity, frequency, insurance limits, WACC) affect NPV of the control investment. This is a standard FMVA-style way to see which assumptions move value the most."
            badge="FMVA"
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-war-muted hover:text-war-white transition-colors"
          aria-label="Collapse Sensitivity module"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-war-border/30">
              <th className="text-left py-2 text-war-muted font-semibold">Driver</th>
              <th className="text-right py-2 px-2 text-war-muted font-semibold">Low NPV</th>
              <th className="text-right py-2 px-2 text-war-muted font-semibold">Base NPV</th>
              <th className="text-right py-2 px-2 text-war-muted font-semibold">High NPV</th>
              <th className="text-right py-2 px-2 text-war-muted font-semibold">Δ NPV (High − Low)</th>
              <th className="text-right py-2 px-2 text-war-muted font-semibold">Equity Value (DCF) Δ</th>
            </tr>
          </thead>
          <tbody>
            {sensitivityData.map((row, idx) => (
              <tr key={idx} className="border-b border-war-border/20">
                <td className="py-2 text-war-white font-medium">{row.driver}</td>
                <td className="text-right py-2 px-2 text-war-white">{row.low}</td>
                <td className="text-right py-2 px-2 text-war-white font-semibold">{row.base}</td>
                <td className="text-right py-2 px-2 text-war-white">{row.high}</td>
                <td className="text-right py-2 px-2 text-emerald-400">{row.equityImpact}</td>
                <td className="text-right py-2 px-2 text-war-muted">{row.equityValueDcfDelta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-war-muted pt-2 border-t border-war-border/30">
        <p>Low/High: Loss Severity ±10%, Frequency ±10%, Insurance Limit ±20%, WACC +100bps.</p>
      </div>
    </div>
  );
}

