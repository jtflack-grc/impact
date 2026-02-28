import { useEffect, useState } from "react";
import { EduTooltip } from "../EduTooltip";
import { useStore } from "../../store";

interface WaccModuleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const BASELINE_WACC = 0.092; // 9.2%

export function WaccModule({ isExpanded, onToggle }: WaccModuleProps) {
  // Inputs (editable in Deep Mode)
  const [riskFreeRate, setRiskFreeRate] = useState(0.035); // 3.5%
  const [equityRiskPremium, setEquityRiskPremium] = useState(0.06); // 6%
  const [unleveredBeta, setUnleveredBeta] = useState(1.0);
  const [costOfDebt, setCostOfDebt] = useState(0.05); // 5%
  const [taxRate, setTaxRate] = useState(0.25); // 25%
  const [debtWeight, setDebtWeight] = useState(0.30); // 30%
  const [equityWeight, setEquityWeight] = useState(0.70); // 70%
  const setDeepFinanceWacc = useStore((s) => s.setDeepFinanceWacc);

  // Formula chain (exact structure from Excel)
  const debtToEquity = debtWeight / equityWeight;
  const leveredBeta = unleveredBeta * (1 + (1 - taxRate) * debtToEquity);
  const costOfEquity = riskFreeRate + leveredBeta * equityRiskPremium;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
  const wacc = costOfEquity * equityWeight + afterTaxCostOfDebt * debtWeight;

  const waccChange = wacc - BASELINE_WACC;
  const waccChangeBps = waccChange * 10000; // basis points

  useEffect(() => {
    setDeepFinanceWacc(wacc);
  }, [wacc, setDeepFinanceWacc]);

  if (!isExpanded) {
    return (
      <div className="rounded-lg border border-war-border/50 bg-black/40 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-war-white/90">WACC Breakdown</span>
            <span className="text-[10px] text-war-muted">
              {wacc.toFixed(3)} ({waccChangeBps >= 0 ? "+" : ""}{waccChangeBps.toFixed(0)} bps vs baseline)
            </span>
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
          <h4 className="text-xs font-semibold text-war-white/90">WACC Breakdown</h4>
          <EduTooltip
            title="Weighted Average Cost of Capital"
            body="WACC is the discount rate used in DCF valuation. It combines the cost of equity (using CAPM) and after-tax cost of debt, weighted by their proportions in the capital structure. Higher WACC reduces present value of future cash flows, lowering equity value."
            badge="FMVA"
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-war-muted hover:text-war-white transition-colors"
          aria-label="Collapse WACC module"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <label className="text-war-muted mb-1 block">Risk Free Rate</label>
          <input
            type="number"
            step="0.001"
            value={riskFreeRate}
            onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Equity Risk Premium</label>
          <input
            type="number"
            step="0.001"
            value={equityRiskPremium}
            onChange={(e) => setEquityRiskPremium(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Unlevered Beta</label>
          <input
            type="number"
            step="0.1"
            value={unleveredBeta}
            onChange={(e) => setUnleveredBeta(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Cost of Debt</label>
          <input
            type="number"
            step="0.001"
            value={costOfDebt}
            onChange={(e) => setCostOfDebt(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Tax Rate</label>
          <input
            type="number"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Debt Weight</label>
          <input
            type="number"
            step="0.01"
            value={debtWeight}
            onChange={(e) => setDebtWeight(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
        <div>
          <label className="text-war-muted mb-1 block">Equity Weight</label>
          <input
            type="number"
            step="0.01"
            value={equityWeight}
            onChange={(e) => setEquityWeight(parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 bg-black/60 border border-war-border/50 rounded text-sm text-war-white"
          />
        </div>
      </div>

      {/* Intermediate Calculations */}
      <div className="pt-3 border-t border-war-border/30 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-war-muted">Debt to Equity</span>
          <span className="text-war-white font-semibold">{debtToEquity.toFixed(2)}</span>
        </div>
        <div className="text-[10px] text-war-muted italic">= Debt Weight ÷ Equity Weight</div>

        <div className="flex justify-between items-center">
          <span className="text-war-muted">Levered Beta</span>
          <span className="text-war-white font-semibold">{leveredBeta.toFixed(2)}</span>
        </div>
        <div className="text-[10px] text-war-muted italic">
          = Unlevered Beta × (1 + (1 − Tax Rate) × Debt/Equity)
        </div>

        <div className="flex justify-between items-center">
          <span className="text-war-muted">Cost of Equity</span>
          <span className="text-war-white font-semibold">{(costOfEquity * 100).toFixed(2)}%</span>
        </div>
        <div className="text-[10px] text-war-muted italic">
          = Risk Free Rate + Levered Beta × Equity Risk Premium
        </div>

        <div className="flex justify-between items-center">
          <span className="text-war-muted">After-Tax Cost of Debt</span>
          <span className="text-war-white font-semibold">{(afterTaxCostOfDebt * 100).toFixed(2)}%</span>
        </div>
        <div className="text-[10px] text-war-muted italic">= Cost of Debt × (1 − Tax Rate)</div>
      </div>

      {/* Final WACC */}
      <div className="pt-3 border-t border-war-border/30">
        <div className="rounded-lg bg-black/60 p-3 border border-war-border/30">
          <div className="text-[10px] text-war-muted mb-1">Final WACC</div>
          <div className="text-xl font-bold text-war-white">{(wacc * 100).toFixed(2)}%</div>
          <div className="text-[10px] text-war-muted mt-1">
            = Cost of Equity × Equity Weight + After-Tax Cost of Debt × Debt Weight
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-war-muted">Change vs baseline (9.2%): </span>
          <span className={`font-semibold ${waccChangeBps >= 0 ? "text-red-400" : "text-emerald-400"}`}>
            {waccChangeBps >= 0 ? "+" : ""}{waccChangeBps.toFixed(0)} bps
          </span>
        </div>
      </div>
    </div>
  );
}
