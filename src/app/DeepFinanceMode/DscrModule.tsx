import { useState, useMemo } from "react";
import { useScenarioStore } from "../../store/scenarioStore";
import { EduTooltip } from "../EduTooltip";

interface DscrModuleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function DscrModule({ isExpanded, onToggle }: DscrModuleProps) {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);

  // Derive dynamic loss profile for Net P90
  // FAIR: Loss Magnitude comes from base scenario (Monte Carlo results)
  const dynamicLossProfile = useMemo(() => {
    const base = scenario.lossProfile;
    return {
      netP90: base.netP90Millions,
    };
  }, [scenario.lossProfile]);

  // Inputs (editable in Deep Mode, pre-filled from engine)
  const [cashTaxes, setCashTaxes] = useState(
    (scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100)) * 0.25
  );
  const [capex, setCapex] = useState(scenario.company.annualRevenueMillions * 0.05);
  const [otherAdjustments, setOtherAdjustments] = useState(0);
  const [interestExpense, setInterestExpense] = useState(scenario.company.annualRevenueMillions * 0.02);
  const [principalRepayment, setPrincipalRepayment] = useState(scenario.company.annualRevenueMillions * 0.01);
  const [covenantThreshold, setCovenantThreshold] = useState(1.2);

  const ebitda = scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100);

  // Formulas (match Excel structure)
  const cashFlowAvailable = ebitda - cashTaxes - capex + otherAdjustments;
  const dscrPreEvent = cashFlowAvailable / (interestExpense + principalRepayment);

  // Post-event DSCR (EBITDA reduced by Net P90)
  const ebitdaPostEvent = Math.max(0, ebitda - dynamicLossProfile.netP90);
  const cashFlowAvailablePostEvent = ebitdaPostEvent - cashTaxes - capex + otherAdjustments;
  const dscrPostEvent = cashFlowAvailablePostEvent / (interestExpense + principalRepayment);

  const covenantBreach = dscrPostEvent < covenantThreshold;

  if (!isExpanded) {
    return (
      <div className="rounded-lg border border-war-border/50 bg-black/40 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-war-white/90">Credit Metrics (DSCR)</span>
            {covenantBreach && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Covenant Stress
              </span>
            )}
          </div>
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
          <h4 className="text-xs font-semibold text-war-white/90">Credit Metrics (DSCR)</h4>
          <EduTooltip
            title="Debt Service Coverage Ratio"
            body="DSCR measures a company's ability to service its debt obligations. It's calculated as Cash Flow Available for Debt Service divided by total debt service (interest + principal). A ratio below the covenant threshold (typically 1.2x) indicates covenant stress and potential default risk."
            badge="FMVA"
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-war-muted hover:text-war-white transition-colors"
          aria-label="Collapse DSCR module"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <label className="text-war-muted mb-1 block">EBITDA</label>
          <div className="text-sm font-semibold text-war-white">${ebitda.toFixed(1)}M</div>
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Cash Taxes</label>
          <input
            type="number"
            value={cashTaxes.toFixed(1)}
            onChange={(e) => setCashTaxes(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Capex</label>
          <input
            type="number"
            value={capex.toFixed(1)}
            onChange={(e) => setCapex(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Other Adjustments</label>
          <input
            type="number"
            value={otherAdjustments.toFixed(1)}
            onChange={(e) => setOtherAdjustments(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Interest Expense</label>
          <input
            type="number"
            value={interestExpense.toFixed(1)}
            onChange={(e) => setInterestExpense(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Principal Repayment</label>
          <input
            type="number"
            value={principalRepayment.toFixed(1)}
            onChange={(e) => setPrincipalRepayment(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
      </div>

      {/* Calculations */}
      <div className="pt-3 border-t border-war-border/30 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-war-muted">Cash Flow Available for Debt Service</span>
          <span className="text-war-white font-semibold">${cashFlowAvailable.toFixed(1)}M</span>
        </div>
        <div className="text-[10px] text-war-muted italic">
          = EBITDA − Cash Taxes − Capex + Other Adjustments
        </div>
      </div>

      {/* DSCR Results */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-war-border/30">
        <div className="rounded-lg bg-black/60 p-3 border border-war-border/30">
          <div className="text-[10px] text-war-muted mb-1">Pre-event DSCR</div>
          <div className="text-lg font-bold text-war-white">{dscrPreEvent.toFixed(2)}x</div>
        </div>
        <div
          className={`rounded-lg p-3 border ${
            covenantBreach
              ? "bg-red-500/10 border-red-500/30 animate-pulse"
              : "bg-black/60 border-war-border/30"
          }`}
        >
          <div className="text-[10px] text-war-muted mb-1">Post-event DSCR</div>
          <div
            className={`text-lg font-bold ${covenantBreach ? "text-red-400" : "text-war-white"}`}
          >
            {dscrPostEvent.toFixed(2)}x
          </div>
          {covenantBreach && (
            <div className="text-[10px] text-red-400 mt-1 font-semibold">
              ⚠ Covenant Stress Triggered
            </div>
          )}
        </div>
      </div>

      {/* Covenant Threshold */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-war-muted">Covenant Threshold</span>
          <input
            type="number"
            step="0.1"
            value={covenantThreshold}
            onChange={(e) => setCovenantThreshold(parseFloat(e.target.value) || 1.2)}
            className="w-20 px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white text-right"
          />
        </div>
      </div>
    </div>
  );
}
