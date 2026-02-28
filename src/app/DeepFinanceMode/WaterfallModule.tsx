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

  // Waterfall data: cumulative erosion from Gross P90 to Net P90
  // Note: The breakdown between insurance and controls is illustrative
  // In practice, this would come from actual insurance limits and control effectiveness data
  const waterfallData = useMemo(() => {
    const grossP90 = dynamicLossProfile.grossP90;
    const netResidual = dynamicLossProfile.netP90;
    const totalAbsorption = grossP90 - netResidual;
    
    // Illustrative breakdown: assume controls reduce exposure, insurance covers remainder
    // In a rigorous model, this would be calculated from actual control effectiveness and insurance limits
    const controlImpact = totalAbsorption * 0.5; // Illustrative: 50% from controls
    const insuranceAbsorption = totalAbsorption * 0.5; // Illustrative: 50% from insurance
    const recoveryGains = 0; // No recovery gains in current model

    // Cumulative values for waterfall
    const start = grossP90;
    const afterInsurance = start - insuranceAbsorption;
    const afterControls = afterInsurance - controlImpact;
    const afterRecovery = afterControls + recoveryGains;
    const end = netResidual;

    return [
      { step: "Gross P90", value: start, cumulative: start, fill: "#ef4444" },
      { step: "Insurance", value: -insuranceAbsorption, cumulative: afterInsurance, fill: "#f59e0b" },
      { step: "Controls", value: -controlImpact, cumulative: afterControls, fill: "#3b82f6" },
      { step: "Recovery", value: recoveryGains, cumulative: afterRecovery, fill: "#10b981" },
      { step: "Net Exposure", value: end, cumulative: end, fill: "#8b5cf6" },
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
            body="Shows how Gross P90 loss erodes through insurance absorption, control impact, and recovery gains to arrive at Net residual exposure. The breakdown between controls and insurance is illustrative—in practice, this would be calculated from actual control effectiveness metrics and insurance policy limits. This visualization helps finance teams understand the layers of risk mitigation and residual exposure."
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
