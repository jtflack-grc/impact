import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useScenarioStore } from "../../store/scenarioStore";
import { EduTooltip } from "../EduTooltip";

interface WaterfallModuleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function formatMillions(n: number): string {
  return `$${n.toFixed(1)}M`;
}

export function WaterfallModule({ isExpanded, onToggle }: WaterfallModuleProps) {
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);

  // FAIR: Loss Magnitude comes from base scenario (Monte Carlo results)
  const dynamicLossProfile = useMemo(() => {
    const base = scenario.lossProfile;
    return {
      grossP90: base.grossP90Millions,
      netP90: base.netP90Millions,
    };
  }, [scenario.lossProfile]);

  // Waterfall data: derived from scenario Gross P90 and Net P90 only.
  // The model does not split control vs insurance; we show one combined "Insurance & other mitigation" step.
  const waterfallData = useMemo(() => {
    const grossP90 = dynamicLossProfile.grossP90;
    const netResidual = dynamicLossProfile.netP90;
    const insuranceAndOther = Math.max(0, Math.min(grossP90 - netResidual, grossP90));

    return [
      { step: "Gross P90", value: grossP90, cumulative: grossP90, fill: "#ef4444" },
      { step: "Insurance & other mitigation", value: -insuranceAndOther, cumulative: netResidual, fill: "#f59e0b" },
      { step: "Net P90", value: netResidual, cumulative: netResidual, fill: "#8b5cf6" },
    ];
  }, [dynamicLossProfile]);

  if (!isExpanded) {
    return (
      <div className="rounded-lg border border-war-border/50 bg-black/40 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-semibold text-war-white/90">P90 Waterfall Decomposition</span>
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
          <h4 className="text-xs font-semibold text-war-white/90">P90 Waterfall Decomposition</h4>
          <EduTooltip
            title="Capital Erosion Waterfall"
            body="Derived from scenario Gross P90 and Net P90. The step from Gross to Net is shown as a single 'Insurance & other mitigation' bucket because the model does not separately attribute control vs insurance; both are reflected in the scenario's net residual. This keeps the decomposition honest and defensible."
            badge="FAIR"
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-war-muted hover:text-war-white transition-colors"
          aria-label="Collapse Waterfall module"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="step"
            tick={{ fill: "#737373", fontSize: 9 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 9 }}
            tickFormatter={(v) => `$${v.toFixed(0)}M`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#000", border: "1px solid #0d0d0d", borderRadius: "8px" }}
            formatter={(value: number) => formatMillions(value)}
          />
          <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-war-border/30">
        <div>
          <div className="text-war-muted">Gross P90</div>
          <div className="text-war-white font-semibold">{formatMillions(dynamicLossProfile.grossP90)}</div>
        </div>
        <div>
          <div className="text-war-muted">Net Residual</div>
          <div className="text-war-white font-semibold">{formatMillions(dynamicLossProfile.netP90)}</div>
        </div>
      </div>
    </div>
  );
}
