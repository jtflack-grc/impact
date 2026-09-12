import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildCalibratedLossSamples,
  buildLossHistogram,
  percentileValue,
} from "../model/scenarioLossDistribution";
import { useImpactInteractionStore } from "../store/interactionStore";
import { EduTooltip } from "./EduTooltip";

interface LossTailExplorerProps {
  scenarioId: string;
  meanLossMillions: number;
  grossP90Millions: number;
  netP90Millions: number;
  frequencyPerYear: number;
  annualRevenueMillions: number;
  ebitdaMarginPercent: number;
  topDriver: string;
}

interface BrushRange {
  startIndex: number;
  endIndex: number;
}

function formatMillions(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  if (value >= 100) return `$${value.toFixed(0)}M`;
  return `$${value.toFixed(1)}M`;
}

function percentileLabel(low: number, high: number): string {
  const lowPct = Math.round(low * 100);
  const highPct = Math.round(high * 100);
  if (high >= 0.995) return `P${lowPct}+ tail`;
  return `P${lowPct}–P${highPct} band`;
}

export function LossTailExplorer({
  scenarioId,
  meanLossMillions,
  grossP90Millions,
  netP90Millions,
  frequencyPerYear,
  annualRevenueMillions,
  ebitdaMarginPercent,
  topDriver,
}: LossTailExplorerProps) {
  const setTailSelection = useImpactInteractionStore((state) => state.setTailSelection);
  const clearTailSelection = useImpactInteractionStore((state) => state.clearTailSelection);

  const samples = useMemo(
    () =>
      buildCalibratedLossSamples(
        meanLossMillions,
        grossP90Millions,
        scenarioId,
        8000
      ),
    [grossP90Millions, meanLossMillions, scenarioId]
  );
  const histogram = useMemo(() => buildLossHistogram(samples, 30), [samples]);
  const fullRange = useMemo<BrushRange>(
    () => ({ startIndex: 0, endIndex: Math.max(0, histogram.length - 1) }),
    [histogram.length]
  );
  const [brushRange, setBrushRange] = useState<BrushRange>(fullRange);
  const [selectionActive, setSelectionActive] = useState(false);

  const sampleP90 = useMemo(() => percentileValue(samples, 0.9), [samples]);
  const sampleMean = useMemo(
    () =>
      samples.length > 0
        ? samples.reduce((total, sample) => total + sample, 0) / samples.length
        : 0,
    [samples]
  );

  useEffect(() => {
    setBrushRange(fullRange);
    setSelectionActive(false);
    clearTailSelection();
  }, [clearTailSelection, fullRange, scenarioId]);

  const selection = useMemo(() => {
    if (!selectionActive || histogram.length === 0 || samples.length === 0) return null;
    const start = Math.max(0, Math.min(brushRange.startIndex, histogram.length - 1));
    const end = Math.max(start, Math.min(brushRange.endIndex, histogram.length - 1));
    const low = histogram[start].low;
    const high = histogram[end].high;
    const selected = samples.filter((sample) => sample >= low && sample <= high);
    if (selected.length === 0) return null;

    const probabilityMass = selected.length / samples.length;
    const conditionalMean = selected.reduce((total, sample) => total + sample, 0) / selected.length;
    const percentileLow = samples.filter((sample) => sample < low).length / samples.length;
    const percentileHigh = samples.filter((sample) => sample <= high).length / samples.length;
    const annualizedContribution = conditionalMean * probabilityMass * frequencyPerYear;
    const ebitda = annualRevenueMillions * (ebitdaMarginPercent / 100);
    const ebitdaSharePercent = ebitda > 0 ? (conditionalMean / ebitda) * 100 : 0;

    return {
      low,
      high,
      probabilityMass,
      conditionalMean,
      percentileLow,
      percentileHigh,
      annualizedContribution,
      ebitdaSharePercent,
      label: percentileLabel(percentileLow, percentileHigh),
    };
  }, [
    annualRevenueMillions,
    brushRange.endIndex,
    brushRange.startIndex,
    ebitdaMarginPercent,
    frequencyPerYear,
    histogram,
    samples,
    selectionActive,
  ]);

  useEffect(() => {
    if (!selection) return;
    setTailSelection({
      scenarioId,
      label: selection.label,
      lowMillions: selection.low,
      highMillions: selection.high,
      probabilityMass: selection.probabilityMass,
      conditionalMeanMillions: selection.conditionalMean,
      percentileLow: selection.percentileLow,
      percentileHigh: selection.percentileHigh,
      annualizedContributionMillions: selection.annualizedContribution,
      ebitdaSharePercent: selection.ebitdaSharePercent,
    });
  }, [scenarioId, selection, setTailSelection]);

  const applyPercentilePreset = (percentile: number) => {
    const threshold = percentileValue(samples, percentile);
    const startIndex = Math.max(
      0,
      histogram.findIndex((bin) => bin.high >= threshold)
    );
    setBrushRange({
      startIndex,
      endIndex: Math.max(0, histogram.length - 1),
    });
    setSelectionActive(true);
  };

  const clearSelection = () => {
    setBrushRange(fullRange);
    setSelectionActive(false);
    clearTailSelection();
  };

  return (
    <div className="mt-4 border border-war-border/80 bg-black/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90">
            Monte Carlo tail lens
            <EduTooltip
              title="Interrogate a loss band"
              body="Drag the range handles or choose a tail preset. The selected slice is analyzed as its own conditional loss band and shared with the scenario rail and globe."
              badge="FAIR"
            />
          </h3>
          <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-war-muted">
            8,000 deterministic samples from a scenario-specific distribution calibrated to the published mean and Gross P90 anchors. This reconstructs a plausible loss shape for interrogation; it does not replace a factor-level FAIR model.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.1em]">
          <button
            type="button"
            onClick={() => applyPercentilePreset(0.75)}
            className="border border-war-border px-2 py-1.5 text-war-muted hover:border-amber-400/60 hover:text-war-white"
          >
            P75+
          </button>
          <button
            type="button"
            onClick={() => applyPercentilePreset(0.9)}
            className="border border-red-500/40 px-2 py-1.5 text-red-300/90 hover:border-red-400 hover:text-red-200"
          >
            P90+
          </button>
          <button
            type="button"
            onClick={() => applyPercentilePreset(0.95)}
            className="border border-red-500/40 px-2 py-1.5 text-red-300/90 hover:border-red-400 hover:text-red-200"
          >
            P95+
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="border border-war-border px-2 py-1.5 text-war-muted hover:text-war-white"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-war-border/50 py-2 font-mono text-[9px] text-war-muted">
        <span>Mean anchor <strong className="font-medium text-war-white">{formatMillions(meanLossMillions)}</strong></span>
        <span>Gross P90 <strong className="font-medium text-red-300">{formatMillions(grossP90Millions)}</strong></span>
        <span>Net P90 <strong className="font-medium text-emerald-300">{formatMillions(netP90Millions)}</strong></span>
      </div>

      <div className="mt-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} barCategoryGap={0} margin={{ top: 8, right: 6, bottom: 2, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#20262d" vertical={false} />
            <XAxis
              dataKey="midpoint"
              tick={{ fill: "#8b949e", fontSize: 9 }}
              tickFormatter={(value) => formatMillions(Number(value))}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "#8b949e", fontSize: 9 }}
              tickFormatter={(value) => `${value}`}
              width={30}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#07090b", border: "1px solid #303841", borderRadius: "2px" }}
              labelFormatter={(value) => `Loss near ${formatMillions(Number(value))}`}
              formatter={(value: number) => [`${value} samples`, "Frequency"]}
            />
            <Bar dataKey="count" radius={0}>
              {histogram.map((bin) => {
                const selected =
                  selectionActive &&
                  bin.index >= brushRange.startIndex &&
                  bin.index <= brushRange.endIndex;
                const containsP90 = grossP90Millions >= bin.low && grossP90Millions <= bin.high;
                return (
                  <Cell
                    key={bin.index}
                    fill={selected ? "#ef4444" : containsP90 ? "#c89a55" : "#46515c"}
                    fillOpacity={selected ? 0.92 : 0.72}
                  />
                );
              })}
            </Bar>
            <Brush
              dataKey="midpoint"
              height={24}
              stroke="#66717d"
              fill="#0d1115"
              travellerWidth={8}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => {
                if (range.startIndex == null || range.endIndex == null) return;
                const next = {
                  startIndex: range.startIndex,
                  endIndex: range.endIndex,
                };
                setBrushRange(next);
                const isFullRange =
                  next.startIndex === 0 &&
                  next.endIndex === Math.max(0, histogram.length - 1);
                setSelectionActive(!isFullRange);
                if (isFullRange) clearTailSelection();
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 font-mono text-[9px] text-war-muted">
        <span>Reconstructed mean {formatMillions(sampleMean)} · P90 {formatMillions(sampleP90)}</span>
        <span>Amber bin = published P90</span>
      </div>

      {selection ? (
        <div className="mt-3 border-l-2 border-red-400 bg-red-950/10 px-3 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-red-300/80">Selected loss band</div>
              <div className="mt-1 text-sm font-semibold text-war-white">{selection.label}</div>
            </div>
            <div className="font-mono text-xs text-war-white">
              {formatMillions(selection.low)} – {formatMillions(selection.high)}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-war-muted">Probability mass</div>
              <div className="mt-1 font-mono text-sm text-war-white">{(selection.probabilityMass * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-war-muted">Conditional mean</div>
              <div className="mt-1 font-mono text-sm text-red-300">{formatMillions(selection.conditionalMean)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-war-muted">EBITDA consumed</div>
              <div className="mt-1 font-mono text-sm text-war-white">{selection.ebitdaSharePercent.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-war-muted">Annualized contribution</div>
              <div className="mt-1 font-mono text-sm text-war-white">{formatMillions(selection.annualizedContribution)}</div>
            </div>
          </div>

          <div className="mt-3 border-t border-war-border/50 pt-2 text-[10px] leading-relaxed text-war-muted">
            Sensitivity anchor: <span className="text-war-white/90">{topDriver}</span>. Annualized contribution is the selected band’s conditional mean × its probability mass × modeled loss-event frequency ({frequencyPerYear.toFixed(2)}/yr).
          </div>
        </div>
      ) : (
        <div className="mt-3 border-l-2 border-war-border px-3 py-2 text-[10px] leading-relaxed text-war-muted">
          Drag either range handle, or choose P75+, P90+, or P95+, to interrogate a slice of the loss distribution. The selected slice will also drive the linked scenario rail and globe.
        </div>
      )}
    </div>
  );
}
