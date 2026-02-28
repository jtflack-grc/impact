import { useMemo, useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { HotTable } from "@handsontable/react";
import type { CellChange, ChangeSource } from "handsontable/common";
import "handsontable/dist/handsontable.min.css";
import { useScenarioStore } from "../store/scenarioStore";
import { useStore } from "../store";
import "./FmvaSpreadsheet.css";

const BASELINE_WACC = 0.092;

/** Hover tooltips for Metric column (row index → definition) */
const METRIC_TOOLTIPS: Record<number, string> = {
  0: "Revenue (M): Annual revenue in millions of dollars. A key input for sizing the business and scaling risk.",
  1: "EBITDA %: Earnings before interest, taxes, depreciation, and amortization, as a percentage of revenue. A proxy for operating profitability.",
  2: "Gross P90: 90th percentile loss from FAIR-style simulation before insurance and recovery. Conservative single-event loss estimate.",
  3: "Net P90: 90th percentile loss after modeling controls, insurance, and recovery. Residual exposure the firm retains.",
  4: "Annual benefit: Risk reduction per year (Gross P90 − Net P90). Used as the benefit stream in NPV and IRR.",
  5: "Control cost (3yr): Total investment in the security control over three years. The cost side of capital budgeting.",
  6: "WACC: Weighted average cost of capital. The discount rate used to bring future cash flows to present value.",
  7: "Years: Horizon over which benefits are received (e.g. 3 years). Affects NPV and payback.",
  8: "NPV: Net present value. PV of benefits minus cost. Positive NPV means the control is value‑creating.",
  9: "Payback (yr): Years until cumulative benefits equal the initial cost. Shorter is better.",
  10: "PI: Profitability index. PV(benefits) ÷ cost. Above 1 means the project adds value.",
  11: "IRR: Internal rate of return. The discount rate at which NPV equals zero. Compare to WACC to assess attractiveness.",
};

function npv(controlCost: number, annualBenefit: number, years = 3, discountRate = BASELINE_WACC): number {
  let pvBenefits = 0;
  for (let t = 1; t <= years; t++) {
    pvBenefits += annualBenefit / Math.pow(1 + discountRate, t);
  }
  return -controlCost + pvBenefits;
}

function irr(controlCost: number, annualBenefit: number, years = 3): number {
  if (annualBenefit <= 0) return 0;
  if (controlCost <= 0) return 0;
  const totalBenefit = annualBenefit * years;
  if (totalBenefit <= controlCost) return 0;
  let low = 0;
  let high = 2;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    let pv = 0;
    for (let t = 1; t <= years; t++) {
      pv += annualBenefit / Math.pow(1 + mid, t);
    }
    if (pv >= controlCost) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function paybackYears(controlCost: number, annualBenefit: number): number {
  if (annualBenefit <= 0) return 0;
  return controlCost / annualBenefit;
}

function profitabilityIndex(controlCost: number, annualBenefit: number, years = 3, discountRate = BASELINE_WACC): number {
  if (controlCost <= 0) return 0;
  let pvBenefits = 0;
  for (let t = 1; t <= years; t++) {
    pvBenefits += annualBenefit / Math.pow(1 + discountRate, t);
  }
  return pvBenefits / controlCost;
}

export function FmvaSpreadsheet() {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const deepFinanceWacc = useStore((s) => s.deepFinanceWacc);

  // FAIR: Loss Magnitude comes from base scenario (Monte Carlo results), not scaled by non-FAIR metrics
  const dynamicLossProfile = useMemo(() => {
    const base = scenario.lossProfile;
    return {
      grossP90: base.grossP90Millions,
      netP90: base.netP90Millions,
    };
  }, [scenario.lossProfile]);

  const controlCost3yr = Math.max(
    2,
    scenario.company.annualRevenueMillions * 0.002 * 3
  );

  const [revenue, setRevenue] = useState(scenario.company.annualRevenueMillions);
  const [ebitdaPct, setEbitdaPct] = useState(scenario.company.ebitdaMarginPercent);
  const [grossP90, setGrossP90] = useState(Math.round(dynamicLossProfile.grossP90 * 10) / 10);
  const [netP90, setNetP90] = useState(Math.round(dynamicLossProfile.netP90 * 10) / 10);
  const [controlCost, setControlCost] = useState(Math.round(controlCost3yr * 10) / 10);
  const effectiveWacc = deepFinanceWacc ?? BASELINE_WACC;
  const [wacc, setWacc] = useState(effectiveWacc);
  const [years, setYears] = useState(3);

  // Sync from scenario when scenario changes
  useEffect(() => {
    setRevenue(scenario.company.annualRevenueMillions);
    setEbitdaPct(scenario.company.ebitdaMarginPercent);
    setGrossP90(Math.round(dynamicLossProfile.grossP90 * 10) / 10);
    setNetP90(Math.round(dynamicLossProfile.netP90 * 10) / 10);
    setControlCost(Math.round(controlCost3yr * 10) / 10);
    setWacc(effectiveWacc);
    setYears(3);
  }, [scenario.id, scenario.company.annualRevenueMillions, scenario.company.ebitdaMarginPercent, dynamicLossProfile.grossP90, dynamicLossProfile.netP90, controlCost3yr, effectiveWacc]);

  // Sync WACC from Deep Finance Mode when it changes (but allow local override)
  useEffect(() => {
    if (deepFinanceWacc !== null) {
      setWacc(deepFinanceWacc);
    }
  }, [deepFinanceWacc]);

  const annualBenefit = grossP90 - netP90;
  const npvVal = npv(controlCost, annualBenefit, years, wacc);
  const irrVal = irr(controlCost, annualBenefit, years);
  const paybackVal = paybackYears(controlCost, annualBenefit);
  const piVal = profitabilityIndex(controlCost, annualBenefit, years, wacc);

  const afterChange = useCallback((changes: CellChange[] | null, source: ChangeSource) => {
    if (!changes || source === "loadData") return;
    for (const change of changes) {
      const row = change[0];
      const col = change[1];
      const newVal = change[3];
      if (typeof col === "number" && col !== 1) continue;
      if (typeof col === "string" && col !== "1") continue;
      const n = typeof newVal === "number" ? newVal : parseFloat(String(newVal));
      if (Number.isNaN(n)) continue;
      switch (row) {
        case 0: setRevenue(n); break;
        case 1: setEbitdaPct(n); break;
        case 2: setGrossP90(n); break;
        case 3: setNetP90(n); break;
        case 5: setControlCost(n); break;
        case 6: setWacc(n); break;
        case 7: setYears(Math.max(1, Math.round(n))); break;
        default: break;
      }
    }
  }, []);

  const data = useMemo(
    () => [
      ["Revenue (M)", revenue, ""],
      ["EBITDA %", ebitdaPct, ""],
      ["Gross P90", grossP90, ""],
      ["Net P90", netP90, ""],
      ["Annual benefit", annualBenefit, "= Gross P90 − Net P90"],
      ["Control cost (3yr)", controlCost, ""],
      ["WACC", wacc, ""],
      ["Years", years, ""],
      ["NPV", Math.round(npvVal * 100) / 100, "= −Cost + PV(benefits @ WACC)"],
      ["Payback (yr)", annualBenefit > 0 ? Math.round(paybackVal * 100) / 100 : "—", "= Cost ÷ Annual benefit"],
      ["PI", Math.round(piVal * 100) / 100, "= PV(benefits) ÷ Cost"],
      ["IRR", annualBenefit > 0 && controlCost > 0 ? (irrVal * 100).toFixed(1) + "%" : "—", "= IRR(cash flows)"],
    ],
    [revenue, ebitdaPct, grossP90, netP90, annualBenefit, controlCost, wacc, years, npvVal, paybackVal, piVal, irrVal]
  );

  const cells = useMemo(
    () => (row: number, col: number) => {
      const readOnlyRows = new Set([4, 8, 9, 10, 11]);
      if (col === 1 && readOnlyRows.has(row)) return { readOnly: true };
      if (col === 2) return { readOnly: true }; // Formula column always read-only
      if (col === 0) {
        const tooltip = METRIC_TOOLTIPS[row];
        return {
          renderer(_instance: unknown, td: HTMLTableCellElement, _r: number, _c: number, _prop: unknown, value: unknown) {
            td.textContent = value != null ? String(value) : "";
            if (tooltip) td.title = tooltip;
          },
        };
      }
      return {};
    },
    []
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(500);
  const [colWidths, setColWidths] = useState<number[]>([200, 200, 200]);

  useLayoutEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const h = Math.max(400, Math.floor(rect.height));
      const w = Math.max(400, Math.floor(rect.width));
      const colW = Math.floor(w / 3);
      setTableHeight(h);
      setColWidths([colW, colW, colW]);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scenario.id]);

  return (
    <div className="rounded-xl border border-war-border/80 bg-slate-900/80 overflow-hidden fmva-spreadsheet-wrapper flex flex-col flex-1 min-h-0 min-w-0">
      <div className="px-4 py-2 border-b border-war-border/60 flex-shrink-0">
        <h3 className="text-xs font-semibold text-war-white/90">
          FMVA Model — Capital budgeting (editable inputs, formula outputs)
        </h3>
        <p className="text-[10px] text-war-muted mt-0.5">
          Edit inputs in the Value column; outputs recalc automatically. Formula column shows the logic.
        </p>
      </div>
      <div ref={tableContainerRef} className="flex-1 min-h-0 p-2 fmva-table-container">
        <HotTable
          key={scenario.id}
          data={data}
          licenseKey="non-commercial-and-evaluation"
          colHeaders={["Metric", "Value", "Formula"]}
          rowHeaders={false}
          width="100%"
          height={tableHeight}
          rowHeights={36}
          colWidths={colWidths}
          cells={cells}
          afterChange={afterChange}
          columnSorting={false}
          contextMenu={true}
          manualColumnResize={true}
          stretchH="all"
          className="htLeft htMiddle fmva-table"
        />
      </div>
    </div>
  );
}
