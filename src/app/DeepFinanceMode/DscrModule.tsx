import { useMemo } from "react";
import { useScenarioStore } from "../../store/scenarioStore";
import { useStore } from "../../store";
import { EduTooltip } from "../EduTooltip";

interface DscrModuleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function DscrModule({ isExpanded, onToggle }: DscrModuleProps) {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const dscrInputs = useStore((s) => s.deepFinance.dscrInputs);
  const setDscrInputs = useStore((s) => s.setDscrInputs);

  const ebitda = scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100);

  const {
    totalDebt,
    interestRate,
    amortTermYears,
    taxRate,
    capex,
    cashTaxes,
    otherAdjustments,
    covenantThreshold,
  } = dscrInputs;

  // Derived from inputs
  const interestExpense = totalDebt * interestRate;
  const principalRepayment = amortTermYears > 0 ? totalDebt / amortTermYears : 0;
  const debtService = interestExpense + principalRepayment;

  // CFADS and DSCR
  const cashFlowAvailable = ebitda - cashTaxes - capex + otherAdjustments;
  const dscrPreEvent = debtService > 0 ? cashFlowAvailable / debtService : 0;

  // Derive dynamic loss profile for Net P90 (post-event DSCR)
  const dynamicLossProfile = useMemo(() => {
    const base = scenario.lossProfile;
    return { netP90: base.netP90Millions };
  }, [scenario.lossProfile]);

  // Post-event DSCR (EBITDA reduced by Net P90)
  const ebitdaPostEvent = Math.max(0, ebitda - dynamicLossProfile.netP90);
  const cashFlowAvailablePostEvent = ebitdaPostEvent - cashTaxes - capex + otherAdjustments;
  const dscrPostEvent = debtService > 0 ? cashFlowAvailablePostEvent / debtService : 0;

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

      {/* Inputs: credit-shaped */}
      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <label className="text-war-muted mb-1 block">EBITDA</label>
          <div className="text-sm font-semibold text-war-white">${ebitda.toFixed(1)}M</div>
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Total Debt ($M)</label>
          <input
            type="number"
            step="0.1"
            value={totalDebt.toFixed(1)}
            onChange={(e) => setDscrInputs({ totalDebt: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Interest Rate</label>
          <input
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setDscrInputs({ interestRate: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Amort Term (years)</label>
          <input
            type="number"
            min="1"
            value={amortTermYears}
            onChange={(e) => setDscrInputs({ amortTermYears: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Tax Rate</label>
          <input
            type="number"
            step="0.01"
            value={taxRate}
            onChange={(e) => setDscrInputs({ taxRate: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Cash Taxes ($M)</label>
          <input
            type="number"
            step="0.1"
            value={cashTaxes.toFixed(1)}
            onChange={(e) => setDscrInputs({ cashTaxes: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Capex ($M)</label>
          <input
            type="number"
            step="0.1"
            value={capex.toFixed(1)}
            onChange={(e) => setDscrInputs({ capex: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Other Adjustments ($M)</label>
          <input
            type="number"
            step="0.1"
            value={otherAdjustments.toFixed(1)}
            onChange={(e) => setDscrInputs({ otherAdjustments: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
      </div>

      {/* Calculations */}
      <div className="pt-3 border-t border-war-border/30 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-war-muted">Interest + Principal (debt service)</span>
          <span className="text-war-white font-semibold">${debtService.toFixed(1)}M</span>
        </div>
        <div className="text-[10px] text-war-muted italic">
          = Total Debt × Interest Rate + Total Debt ÷ Amort Term
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-war-muted">CFADS</span>
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
            onChange={(e) => setDscrInputs({ covenantThreshold: parseFloat(e.target.value) || 1.2 })}
            className="w-20 px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white text-right"
          />
        </div>
      </div>
    </div>
  );
}
