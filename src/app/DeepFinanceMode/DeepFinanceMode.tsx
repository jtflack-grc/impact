import { useState } from "react";
import { DscrModule } from "./DscrModule";
import { WaccModule } from "./WaccModule";
import { WaterfallModule } from "./WaterfallModule";
import { SensitivityModule } from "./SensitivityModule";

export function DeepFinanceMode() {
  // Expanded by default to showcase rigorous FMVA analysis
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    dscr: true,
    wacc: true,
    waterfall: true,
    sensitivity: true,
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (!isExpanded) {
    return (
      <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-xs font-semibold text-war-white/90 mb-1">
              Capital Impact Engine – Deep Finance Mode
            </h3>
            <p className="text-[10px] text-war-muted">
              Advanced credit metrics, WACC breakdown, waterfall analysis, and sensitivity tables
            </p>
          </div>
          <svg
            className="w-5 h-5 text-war-muted"
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
    <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-war-white/90 mb-1">
            Capital Impact Engine – Deep Finance Mode
          </h3>
          <p className="text-[10px] text-war-muted">
            Advanced credit metrics, WACC breakdown, waterfall analysis, and sensitivity tables
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-war-muted hover:text-war-white transition-colors p-1"
          aria-label="Collapse Deep Finance Mode"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        <DscrModule
          isExpanded={expandedModules.dscr}
          onToggle={() => toggleModule("dscr")}
        />
        <WaccModule
          isExpanded={expandedModules.wacc}
          onToggle={() => toggleModule("wacc")}
        />
        <WaterfallModule
          isExpanded={expandedModules.waterfall}
          onToggle={() => toggleModule("waterfall")}
        />
        <SensitivityModule
          isExpanded={expandedModules.sensitivity}
          onToggle={() => toggleModule("sensitivity")}
        />
      </div>
    </div>
  );
}
