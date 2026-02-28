import { useMemo, useState, lazy, Suspense } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useScenarioStore } from "../store/scenarioStore";
import { EduTooltip } from "./EduTooltip";
import { DeepFinanceMode } from "./DeepFinanceMode/DeepFinanceMode";
import { useStore } from "../store";
import { dcfFromCashFlows } from "../model/dcf";

// Lazy load FMVA spreadsheet (heavy component with Handsontable)
const FmvaSpreadsheet = lazy(() => import("./FmvaSpreadsheet").then(module => ({ default: module.FmvaSpreadsheet })));

type TabType = "exposure" | "debt" | "enforcement" | "fmva";

function formatMillions(n: number): string {
  return `$${n.toFixed(1)}M`;
}

const BASELINE_WACC = 0.092; // 9.2% discount rate for capital budgeting

/** Compute NPV of control investment: cost at t=0, annual benefit (risk reduction) for years 1..3 */
function npv(controlCost: number, annualBenefit: number, years = 3, discountRate = BASELINE_WACC): number {
  let pvBenefits = 0;
  for (let t = 1; t <= years; t++) {
    pvBenefits += annualBenefit / Math.pow(1 + discountRate, t);
  }
  return -controlCost + pvBenefits;
}

/** Approximate IRR (rate where NPV = 0) by binary search */
function irr(controlCost: number, annualBenefit: number, years = 3): number {
  if (annualBenefit <= 0) return 0;
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

/** Payback in years: controlCost / annualBenefit */
function paybackYears(controlCost: number, annualBenefit: number): number {
  if (annualBenefit <= 0) return 999;
  return controlCost / annualBenefit;
}

/** Profitability index: PV(benefits) / PV(costs) = PV(benefits) / controlCost */
function profitabilityIndex(controlCost: number, annualBenefit: number, years = 3, discountRate = BASELINE_WACC): number {
  if (controlCost <= 0) return 0;
  let pvBenefits = 0;
  for (let t = 1; t <= years; t++) {
    pvBenefits += annualBenefit / Math.pow(1 + discountRate, t);
  }
  return pvBenefits / controlCost;
}

export function MetricsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("exposure");
  const activeMetrics = useScenarioStore((s) => s.activeMetrics);
  const scenario = useScenarioStore((s) => s.scenarios[s.currentScenarioIndex]);
  const deepFinanceWacc = useStore((s) => s.deepFinanceWacc);
  const effectiveWacc = deepFinanceWacc ?? BASELINE_WACC;

  // Derive dynamic loss values using proper FAIR relationships
  // Loss Magnitude (P90, meanLoss) comes from base scenario (Monte Carlo simulation results)
  // LEF is affected by Vulnerability, which is affected by Control Adoption
  const dynamicLossProfile = useMemo(() => {
    const base = scenario.lossProfile;
    // FAIR: Vulnerability = function of Threat Capability vs Resistance Strength
    // Simplified for learning: Vulnerability ≈ 1 - Control Adoption (higher adoption = lower vulnerability)
    // FAIR: LEF = TEF × Vulnerability
    // Model LEF scaling with Vulnerability: higher Control Adoption → lower Vulnerability → lower LEF
    // Reference point: assume base scenario has ~50% Control Adoption (neutral point)
    const baseControlAdoption = 50; // Reference point for base scenario
    const vulnerabilityFactor = (100 - activeMetrics.controlAdoption) / (100 - baseControlAdoption);
    const adjustedFrequency = base.frequencyPerYear * Math.max(0.3, Math.min(1.7, vulnerabilityFactor));
    
    return {
      // Loss Magnitude values come from base scenario (Monte Carlo simulation results)
      // Not scaled by non-FAIR metrics - maintaining FAIR rigor
      grossP90: base.grossP90Millions,
      netP90: base.netP90Millions,
      meanLoss: base.meanLossMillions,
      // LEF affected by Vulnerability (which is affected by Control Adoption)
      // Higher Control Adoption → Lower Vulnerability → Lower LEF
      frequency: Math.max(0.01, adjustedFrequency),
    };
  }, [scenario.lossProfile, activeMetrics.controlAdoption]);

  const lossDistributionData = useMemo(() => {
    const p50 = dynamicLossProfile.meanLoss;
    const p90 = dynamicLossProfile.grossP90;
    return [
      { percentile: "P50", value: p50, label: "50th" },
      { percentile: "P90", value: p90, label: "90th" },
    ];
  }, [dynamicLossProfile]);

  const revenueAtRiskData = useMemo(() => {
    const revenue = scenario.company.annualRevenueMillions;
    const ebitda = revenue * (scenario.company.ebitdaMarginPercent / 100);
    return [
      { metric: "Revenue", value: revenue, fill: "#3b82f6" },
      { metric: "EBITDA", value: ebitda, fill: "#60a5fa" },
      { metric: "Gross P90", value: dynamicLossProfile.grossP90, fill: "#ef4444" },
      { metric: "Net P90", value: dynamicLossProfile.netP90, fill: "#f87171" },
    ];
  }, [scenario.company, dynamicLossProfile]);

  // FAIR: Expected annual loss (EAL) and key ratios
  const expectedAnnualLoss = useMemo(
    () => dynamicLossProfile.meanLoss * dynamicLossProfile.frequency,
    [dynamicLossProfile.meanLoss, dynamicLossProfile.frequency]
  );

  const companyRevenue = scenario.company.annualRevenueMillions;
  const companyEbitda = companyRevenue * (scenario.company.ebitdaMarginPercent / 100);
  const p90AsPctRevenue = useMemo(
    () => (companyRevenue > 0 ? (dynamicLossProfile.grossP90 / companyRevenue) * 100 : 0),
    [dynamicLossProfile.grossP90, companyRevenue]
  );
  const p90AsPctEbitda = useMemo(
    () => (companyEbitda > 0 ? (dynamicLossProfile.grossP90 / companyEbitda) * 100 : 0),
    [dynamicLossProfile.grossP90, companyEbitda]
  );

  // Capital budgeting: control cost (3yr) from scenario scale; benefit = annual risk reduction (Gross P90 − Net P90)
  const capitalBudgeting = useMemo(() => {
    const annualBenefit = dynamicLossProfile.grossP90 - dynamicLossProfile.netP90;
    const controlCost3yr = Math.max(2, scenario.company.annualRevenueMillions * 0.002 * 3); // ~0.2% of revenue per year × 3
    return {
      controlCost3yr,
      annualBenefit,
      npv: npv(controlCost3yr, annualBenefit, 3, effectiveWacc),
      irr: irr(controlCost3yr, annualBenefit),
      paybackYears: paybackYears(controlCost3yr, annualBenefit),
      pi: profitabilityIndex(controlCost3yr, annualBenefit, 3, effectiveWacc),
    };
  }, [dynamicLossProfile, scenario.company.annualRevenueMillions, effectiveWacc]);

  // FMVA: simple DCF valuation from projected FCFs
  const projectedFcfSeries = useMemo(() => {
    const rev1 = companyRevenue;
    const rev2 = companyRevenue * 1.05;
    const rev3 = companyRevenue * 1.1;
    const rev4 = companyRevenue * 1.15;
    const margin = scenario.company.ebitdaMarginPercent / 100;
    const ebitda1 = rev1 * margin;
    const ebitda2 = rev2 * margin;
    const ebitda3 = rev3 * margin;
    const ebitda4 = rev4 * margin;
    const fcf1 = ebitda1 * 0.7;
    const fcf2 = ebitda2 * 0.7;
    const fcf3 = ebitda3 * 0.7;
    const fcf4 = ebitda4 * 0.7;
    return [fcf1, fcf2, fcf3, fcf4];
  }, [companyRevenue, scenario.company.ebitdaMarginPercent]);

  const dcfValuation = useMemo(
    () => dcfFromCashFlows(projectedFcfSeries, 0.025, effectiveWacc),
    [projectedFcfSeries, effectiveWacc]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top controls / tabs */}
      <div className="px-6 pt-5 pb-3 border-b border-war-border/80 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-[0.2em] text-war-muted">FAIR & FMVA Analysis</span>
            <EduTooltip
              title="How FAIR and FMVA work together"
              body="FAIR (Factor Analysis of Information Risk) gives you quantitative risk numbers—loss percentiles, frequency, magnitude. FMVA (Financial Modeling & Valuation Analyst, from CFI) takes those numbers and models them in financial terms: revenue at risk, 3-statement impact, DCF, and capital budgeting. Together: FAIR measures the risk; FMVA models the financial impact and investment decisions."
              className="shrink-0"
            />
          </div>
          <div className="inline-flex items-center gap-1" role="tablist" aria-label="Dashboard tabs">
            <button
              type="button"
              onClick={() => setActiveTab("exposure")}
              role="tab"
              aria-selected={activeTab === "exposure"}
              aria-controls="exposure-tabpanel"
              id="exposure-tab"
              className={`px-4 py-2.5 min-h-[44px] text-xs rounded-lg font-medium transition-all ${
                activeTab === "exposure"
                  ? "bg-war-white text-black shadow-lg"
                  : "border border-war-border text-war-muted hover:text-war-white hover:bg-war-border/60"
              }`}
            >
              FAIR Risk Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("debt")}
              role="tab"
              aria-selected={activeTab === "debt"}
              aria-controls="debt-tabpanel"
              id="debt-tab"
              className={`px-4 py-2.5 min-h-[44px] text-xs rounded-lg font-medium transition-all ${
                activeTab === "debt"
                  ? "bg-war-white text-black shadow-lg"
                  : "border border-war-border text-war-muted hover:text-war-white hover:bg-war-border/60"
              }`}
            >
              FAIR & FMVA Ratios
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("enforcement")}
              role="tab"
              aria-selected={activeTab === "enforcement"}
              aria-controls="enforcement-tabpanel"
              id="enforcement-tab"
              className={`px-4 py-2.5 min-h-[44px] text-xs rounded-lg font-medium transition-all ${
                activeTab === "enforcement"
                  ? "bg-war-white text-black shadow-lg"
                  : "border border-war-border text-war-muted hover:text-war-white hover:bg-war-border/60"
              }`}
            >
              Investment Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fmva")}
              role="tab"
              aria-selected={activeTab === "fmva"}
              aria-controls="fmva-tabpanel"
              id="fmva-tab"
              className={`px-4 py-2.5 min-h-[44px] text-xs rounded-lg font-medium transition-all ${
                activeTab === "fmva"
                  ? "bg-war-white text-black shadow-lg"
                  : "border border-war-border text-war-muted hover:text-war-white hover:bg-war-border/60"
              }`}
            >
              Deep Finance Mode
            </button>
          </div>
        </div>
      </div>

      {/* Metrics body */}
      <div
        className={`flex-1 overflow-y-auto px-6 pb-6 pt-4 bg-gradient-to-b from-[#020617] to-black ${
          activeTab === "fmva" ? "flex flex-col min-h-0" : "space-y-4"
        }`}
      >
        {activeTab === "exposure" && (
          <section role="tabpanel" id="exposure-tabpanel" aria-labelledby="exposure-tab">
          <>
            <section className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-war-muted">
                FAIR risk summary
                <EduTooltip
                  title="What is FAIR? (for finance folks)"
                  body="FAIR is a quantitative risk framework. It produces probabilistic loss estimates (e.g. 90th percentile loss, expected frequency per year) using factors like threat event frequency, vulnerability, and loss magnitude. Think of it as the risk engine that gives you numbers you can plug into financial models—revenue at risk, reserves, and ROI on controls."
                  badge="FAIR"
                />
              </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricCard
              label="Gross loss P90"
              valueLabel={formatMillions(dynamicLossProfile.grossP90)}
              tone="red"
              description="90th percentile single‑scenario loss before insurance and recovery spend."
              fraction={Math.min(1, dynamicLossProfile.grossP90 / 250)}
              infoTitle="Gross P90 (FAIR)"
              infoBody="The 90th percentile loss from FAIR’s Monte Carlo simulation before insurance and recovery. Finance: use it like a conservative VaR for operational risk—90% of outcomes fall below this value."
              infoBadge="FAIR"
            />
            <MetricCard
              label="Net loss P90"
              valueLabel={formatMillions(dynamicLossProfile.netP90)}
              tone="green"
              description="Estimated residual loss to the firm after modeled insurance and buffers."
              fraction={Math.min(1, dynamicLossProfile.netP90 / 150)}
              infoTitle="Net P90 (FAIR)"
              infoBody="Residual loss after controls, insurance, and recovery are modeled. The gap between Gross and Net P90 is the risk reduction—the benefit side of ROSI and capital budgeting."
              infoBadge="FAIR"
            />
            <MetricCard
              label="Mean loss & frequency"
              valueLabel={`${formatMillions(
                dynamicLossProfile.meanLoss
              )} · ${dynamicLossProfile.frequency.toFixed(1)}/yr`}
              tone="blue"
              description="Average modeled loss coupled with expected event frequency per year."
              wide
              fraction={Math.min(1, dynamicLossProfile.meanLoss / 150)}
              infoTitle="Mean loss & LEF"
              infoBody="FAIR’s expected (mean) loss and Loss Event Frequency (LEF)—how often per year. Together they drive expected annual loss and feed into financial impact models."
              infoBadge="FAIR"
            />
          </div>
          <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
              Loss distribution (key FAIR percentiles)
              <EduTooltip
                title="Percentiles (P50, P90)"
                body="From FAIR’s Monte Carlo simulations: P50 is the median loss; P90 means 90% of simulated outcomes fall below this amount—a conservative estimate for planning and reserves. Finance uses these like value-at-risk (VaR) for operational risk."
                badge="FAIR"
              />
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={lossDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 10 }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0d0d0d", borderRadius: "8px" }}
                  formatter={(value: number) => formatMillions(value)}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-war-muted mt-2">
              Key FAIR-style percentiles: P50 (typical outcome) and P90 (conservative tail loss where 90% of outcomes fall below this amount).
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
              Revenue at risk (FMVA view)
              <EduTooltip
                title="Putting FAIR numbers in financial terms (for risk folks)"
                body="FMVA bridges risk and finance. We take FAIR’s Gross P90 and Net P90 (loss estimates) and place them next to Revenue and EBITDA. This shows how a single loss event compares to annual revenue and profit—so boards and CFOs can see impact in the same language as the P&L and valuation."
                badge="FMVA"
              />
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueAtRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" tick={{ fill: "#737373", fontSize: 10 }} />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0d0d0d", borderRadius: "8px" }}
                  formatter={(value: number) => formatMillions(value)}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {revenueAtRiskData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-war-muted mt-2">
              Gross P90 as % of EBITDA: {scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100) > 0
                ? (dynamicLossProfile.grossP90 / (scenario.company.annualRevenueMillions * (scenario.company.ebitdaMarginPercent / 100)) * 100).toFixed(0)
                : "—"}% — one P90 loss would consume this share of annual profit.
            </p>
          </div>
            </section>
          </>
          </section>
        )}

        {activeTab === "debt" && (
          <section className="space-y-2" role="tabpanel" id="debt-tabpanel" aria-labelledby="debt-tab">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-war-muted">
              FAIR risk & FMVA ratios
              <EduTooltip
                title="From risk to financial ratios"
                body="Connect FAIR outputs (P90, mean, frequency) to financial context: expected annual loss, P90 as a share of revenue and EBITDA. These are the bridge metrics finance teams use to interpret risk in business terms."
                badge="FAIR"
              />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="Expected annual loss (EAL)"
                valueLabel={formatMillions(expectedAnnualLoss)}
                tone="red"
                description="FAIR-style expected annual loss: mean modeled loss × loss event frequency."
                fraction={Math.min(1, expectedAnnualLoss / 150)}
                infoTitle="Expected annual loss (EAL)"
                infoBody="EAL ≈ Mean Loss × Loss Event Frequency (LEF). This is the average loss per year implied by the FAIR model—useful for planning reserves and comparing to control investment."
                infoBadge="FAIR"
              />
              <MetricCard
                label="P90 as % revenue"
                valueLabel={`${p90AsPctRevenue.toFixed(0)}%`}
                tone="blue"
                description="Single‑event Gross P90 loss expressed as a percentage of annual revenue."
                fraction={Math.min(1, p90AsPctRevenue / 100)}
                infoTitle="P90 as % of revenue"
                infoBody="Shows how a 90th percentile loss compares to top-line revenue. Helps boards understand tail risk scale relative to business size."
                infoBadge="FMVA"
              />
              <MetricCard
                label="P90 as % EBITDA"
                valueLabel={`${p90AsPctEbitda.toFixed(0)}%`}
                tone="green"
                description="Single‑event Gross P90 loss expressed as a percentage of annual EBITDA."
                fraction={Math.min(1, p90AsPctEbitda / 100)}
                infoTitle="P90 as % of EBITDA"
                infoBody="Shows how a 90th percentile loss compares to operating profit (EBITDA). This is a key FMVA-style ratio for understanding risk against profitability."
                infoBadge="FMVA"
              />
            </div>
            <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
                FAIR headline metrics
                <EduTooltip
                  title="Headline FAIR metrics"
                  body="Keep three anchors in view: Gross P90 (tail loss), Net P90 (after insurance/controls), and Expected Annual Loss (EAL). Together they summarize severe, residual, and average risk."
                  badge="FAIR"
                />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
                <div className="rounded-lg bg-black/60 p-3 border border-war-border/40">
                  <div className="text-war-muted mb-1">Gross P90</div>
                  <div className="text-lg font-bold text-war-white">
                    {formatMillions(dynamicLossProfile.grossP90)}
                  </div>
                  <p className="text-[10px] text-war-muted mt-1">
                    90th percentile loss before insurance and recovery—tail risk for planning.
                  </p>
                </div>
                <div className="rounded-lg bg-black/60 p-3 border border-war-border/40">
                  <div className="text-war-muted mb-1">Net P90</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatMillions(dynamicLossProfile.netP90)}
                  </div>
                  <p className="text-[10px] text-war-muted mt-1">
                    Residual 90th percentile loss after modeled insurance and buffers.
                  </p>
                </div>
                <div className="rounded-lg bg-black/60 p-3 border border-war-border/40">
                  <div className="text-war-muted mb-1">Expected annual loss (EAL)</div>
                  <div className="text-lg font-bold text-war-white">
                    {formatMillions(expectedAnnualLoss)}
                  </div>
                  <p className="text-[10px] text-war-muted mt-1">
                    Mean loss × frequency—average modeled loss per year.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick reference: definitions for ratios in this tab */}
            <div className="mt-4 rounded-xl border border-war-border/80 bg-black/60 p-4">
              <h3 className="text-xs font-semibold text-war-white/90 mb-3 uppercase tracking-wide">
                Quick reference — FAIR & FMVA terms in this tab
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[10px]">
                <div className="flex gap-2">
                  <span className="text-red-400/90 font-medium shrink-0">EAL</span>
                  <span className="text-war-muted">Expected Annual Loss = mean loss × LEF; average $ loss per year for reserves and planning.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sky-400/90 font-medium shrink-0">P90</span>
                  <span className="text-war-muted">90th percentile loss; 90% of outcomes fall below this amount. Used as tail risk for planning.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400/90 font-medium shrink-0">LEF</span>
                  <span className="text-war-muted">Loss Event Frequency = TEF × Vulnerability; events per year in this scenario.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-war-white/80 font-medium shrink-0">Gross / Net P90</span>
                  <span className="text-war-muted">Gross = before insurance/controls; Net = after. The gap is risk reduction for ROSI and capital budgeting.</span>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <span className="text-war-muted italic">Bridge:</span>
                  <span className="text-war-muted">FAIR gives P90 and EAL; FMVA puts them in business terms (P90 as % revenue, P90 as % EBITDA) so boards and finance see risk in the same language as the P&L.</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "enforcement" && (
          <section className="space-y-2" role="tabpanel" id="enforcement-tabpanel" aria-labelledby="enforcement-tab">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-war-muted">
              Control enforcement & investment analysis
              <EduTooltip
                title="FAIR + FMVA in this tab"
                body="Here we combine both: FAIR decomposes risk (LEF, LM, control impact) and computes ROSI. FMVA adds 3-statement modeling, DCF valuation, and capital budgeting (NPV, IRR, payback). Risk reduction from FAIR becomes the benefit; control cost is the investment—evaluated with standard finance tools."
                badge="FAIR"
              />
            </h2>
          
          {/* FAIR Risk Decomposition */}
          <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
              FAIR risk decomposition
              <EduTooltip
                title="LEF and Loss Magnitude (for finance folks)"
                body="FAIR breaks risk into Loss Event Frequency (LEF)—how often per year—and Loss Magnitude (LM)—how much when it happens. LEF comes from Threat Event Frequency and Vulnerability; LM from primary (direct) and secondary (indirect) loss. These feed Monte Carlo simulations to produce the P90 and other percentiles you see elsewhere."
                badge="FAIR"
              />
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <div className="text-[10px] text-war-muted">Loss Event Frequency (LEF)</div>
                <div className="text-sm font-semibold text-war-white">
                  {dynamicLossProfile.frequency.toFixed(2)}/yr
                </div>
                <div className="text-[10px] text-war-muted/80">
                  In FAIR, LEF = TEF × Vulnerability. Here LEF is the modeled events/year and Vulnerability is a rough proxy
                  based on control adoption (~{((1 - activeMetrics.controlAdoption / 100) * 100).toFixed(0)}%).
                </div>
                <div className="text-[9px] text-war-muted/60 italic mt-1">
                  TEF is reflected in the scenario base and in choice impacts (incident rate); Vulnerability is approximated by control adoption.
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-war-muted">Loss Magnitude (LM)</div>
                <div className="text-sm font-semibold text-war-white">
                  {formatMillions(dynamicLossProfile.meanLoss)}
                </div>
                <div className="text-[10px] text-war-muted/80">
                  Primary: {formatMillions(dynamicLossProfile.meanLoss * 0.65)}<br />
                  Secondary: {formatMillions(dynamicLossProfile.meanLoss * 0.35)}<br />
                  <span className="text-[9px] text-war-muted/60 italic">(Illustrative breakdown; actual ratios vary by scenario)</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-war-border/50">
              <div className="text-[10px] text-war-muted mb-2">Monte Carlo simulation results (10,000 iterations)</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={lossDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#737373", fontSize: 9 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#000", border: "1px solid #0d0d0d", borderRadius: "8px" }}
                    formatter={(value: number) => formatMillions(value)}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FMVA 3-Statement Model */}
          <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
              FMVA: 3-statement model (5-year forecast)
              <EduTooltip
                title="3-statement model (for risk folks)"
                body="Standard corporate finance: Income Statement (Revenue, EBITDA), Balance Sheet, and Cash Flow. CFI's FMVA teaches this. Here we project revenue and EBITDA over 5 years. FAIR's loss events would hit these lines (e.g. one-time loss reducing EBITDA); the Revenue at Risk view shows how big that impact could be relative to the P&L."
                badge="FMVA"
              />
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 text-[10px]">
                <div className="text-war-muted font-semibold">Metric</div>
                <div className="text-war-muted text-center">Y1</div>
                <div className="text-war-muted text-center">Y2</div>
                <div className="text-war-muted text-center">Y3</div>
                <div className="text-war-muted text-center">Y4</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-[10px] border-t border-war-border/30 pt-1">
                <div className="text-war-white/80">Revenue</div>
                <div className="text-war-white text-center">${scenario.company.annualRevenueMillions.toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.05).toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.1).toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.15).toFixed(0)}M</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-[10px]">
                <div className="text-war-white/80">EBITDA</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * scenario.company.ebitdaMarginPercent / 100).toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.05 * scenario.company.ebitdaMarginPercent / 100).toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.1 * scenario.company.ebitdaMarginPercent / 100).toFixed(0)}M</div>
                <div className="text-war-white text-center">${(scenario.company.annualRevenueMillions * 1.15 * scenario.company.ebitdaMarginPercent / 100).toFixed(0)}M</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-[10px] border-t border-war-border/30 pt-1">
                <div className="text-war-white/80">Free Cash Flow</div>
                <div className="text-emerald-400 text-center">${(scenario.company.annualRevenueMillions * scenario.company.ebitdaMarginPercent / 100 * 0.7).toFixed(0)}M</div>
                <div className="text-emerald-400 text-center">${(scenario.company.annualRevenueMillions * 1.05 * scenario.company.ebitdaMarginPercent / 100 * 0.7).toFixed(0)}M</div>
                <div className="text-emerald-400 text-center">${(scenario.company.annualRevenueMillions * 1.1 * scenario.company.ebitdaMarginPercent / 100 * 0.7).toFixed(0)}M</div>
                <div className="text-emerald-400 text-center">${(scenario.company.annualRevenueMillions * 1.15 * scenario.company.ebitdaMarginPercent / 100 * 0.7).toFixed(0)}M</div>
              </div>
            </div>
            <p className="text-[10px] text-war-muted mt-2">
              Stress: if a P90 loss occurs in a given year, it would reduce EBITDA by that amount (one-time loss).
            </p>
          </div>

          {/* DCF Valuation */}
          <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
              DCF valuation & sensitivity
              <EduTooltip
                title="DCF and WACC (for risk folks)"
                body="DCF: Enterprise Value = PV(FCF₁…FCFₙ) + PV(Terminal Value), with TV = FCFₙ₊₁/(WACC − g). WACC is the discount rate; g is terminal growth. Risk events from FAIR could reduce FCF in specific years; sensitivity scenarios show how valuation changes with different assumptions."
                badge="FMVA"
              />
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-[10px] text-war-muted mb-1">WACC</div>
                <div className="text-sm font-semibold text-war-white">
                  {(effectiveWacc * 100).toFixed(1)}%
                  {deepFinanceWacc !== null && (
                    <span className="text-[10px] text-emerald-400 ml-2">(from Deep Finance Mode)</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-war-muted mb-1">Terminal growth</div>
                <div className="text-sm font-semibold text-war-white">2.5%</div>
              </div>
              <div>
                <div className="text-[10px] text-war-muted mb-1">Enterprise value</div>
                <div className="text-sm font-semibold text-emerald-400">
                  ${dcfValuation.enterpriseValue.toFixed(0)}M
                </div>
              </div>
              <div>
                <div className="text-[10px] text-war-muted mb-1">Equity value</div>
                <div className="text-sm font-semibold text-war-white">
                  ${dcfValuation.equityValue.toFixed(0)}M
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={[
                  { scenario: "Base", value: dcfValuation.equityValue },
                  { scenario: "Upside", value: dcfValuation.equityValue * 1.2 },
                  { scenario: "Downside", value: dcfValuation.equityValue * 0.8 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="scenario" tick={{ fill: "#737373", fontSize: 9 }} />
                <YAxis tick={{ fill: "#737373", fontSize: 9 }} tickFormatter={(v) => `$${v.toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0d0d0d", borderRadius: "8px" }}
                  formatter={(value: number) => formatMillions(value)}
                />
                <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

            {/* Control Impact & ROSI */}
            <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
                FAIR: Control impact & ROSI
                <EduTooltip
                  title="ROSI — Return on Security Investment"
                  body="FAIR quantifies risk before and after controls (e.g. Gross P90 vs Net P90). The difference is risk reduction. ROSI = (risk reduction over time − control cost) / control cost. Finance folks: same idea as ROI—benefit (avoided loss) minus cost, expressed as a return. We use FAIR’s numbers for the benefit side."
                  badge="FAIR"
                />
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <div className="text-war-muted mb-1">Risk before control</div>
                    <div className="text-sm font-semibold text-red-400">
                      {formatMillions(dynamicLossProfile.grossP90)}
                    </div>
                  </div>
                  <div>
                    <div className="text-war-muted mb-1">Risk after control</div>
                    <div className="text-sm font-semibold text-emerald-400">
                      {formatMillions(dynamicLossProfile.netP90)}
                    </div>
                  </div>
                  <div>
                    <div className="text-war-muted mb-1">Delta reduction</div>
                    <div className="text-sm font-semibold text-war-white">
                      {formatMillions(dynamicLossProfile.grossP90 - dynamicLossProfile.netP90)}
                    </div>
                  </div>
                  <div>
                    <div className="text-war-muted mb-1">Control cost (3yr)</div>
                    <div className="text-sm font-semibold text-war-white">{formatMillions(capitalBudgeting.controlCost3yr)}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-war-border/30">
                  <div className="text-[10px] text-war-muted mb-1">Return on Security Investment (ROSI)</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {(capitalBudgeting.controlCost3yr > 0
                      ? ((dynamicLossProfile.grossP90 - dynamicLossProfile.netP90) * 3 - capitalBudgeting.controlCost3yr) / capitalBudgeting.controlCost3yr * 100
                      : 0).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-war-muted/80 mt-1">
                    Net benefit over 3 years: ${((dynamicLossProfile.grossP90 - dynamicLossProfile.netP90) * 3 - capitalBudgeting.controlCost3yr).toFixed(1)}M
                    <br />
                    <span className="text-[9px] text-war-muted/60 italic">(Simplified ROSI: assumes deterministic events.) For rigorous comparison, use NPV with your WACC—it accounts for discounting and probability.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capital Budgeting */}
            <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
                FMVA: Capital budgeting analysis
                <EduTooltip
                  title="NPV, IRR, Payback, PI (for risk folks)"
                  body="Capital budgeting evaluates projects using NPV (net present value), IRR (internal rate of return), payback period, and profitability index (PI). Here the ‘project’ is the security control: cost is the investment; benefit is FAIR’s risk reduction (avoided loss) over the control’s life. Same framework CFI teaches for any capital decision—applied to security investments."
                  badge="FMVA"
                />
              </h3>
              <p className="text-[10px] text-war-muted mb-3">
                Benefit = annual risk reduction (Gross P90 − Net P90); cost = control investment over 3 years.
              </p>
              <div className="grid grid-cols-4 gap-3 text-[10px] mb-3">
                <div className="rounded-lg bg-black/40 p-3 border border-war-border/50">
                  <div className="text-war-muted mb-1">NPV</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatMillions(capitalBudgeting.npv)}
                  </div>
                </div>
                <div className="rounded-lg bg-black/40 p-3 border border-war-border/50">
                  <div className="text-war-muted mb-1">IRR</div>
                  <div className="text-lg font-bold text-war-white">
                    {(capitalBudgeting.irr * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-lg bg-black/40 p-3 border border-war-border/50">
                  <div className="text-war-muted mb-1">Payback</div>
                  <div className="text-lg font-bold text-war-white">
                    {capitalBudgeting.paybackYears < 100
                      ? capitalBudgeting.paybackYears.toFixed(1) + "yr"
                      : "—"}
                  </div>
                </div>
                <div className="rounded-lg bg-black/40 p-3 border border-war-border/50">
                  <div className="text-war-muted mb-1">PI</div>
                  <div className="text-lg font-bold text-war-white">
                    {capitalBudgeting.pi.toFixed(2)}x
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-war-muted">
                NPV = PV(3yr risk reduction) − control cost; discount rate {(effectiveWacc * 100).toFixed(1)}% (WACC). Control cost ≈ 0.2% of revenue × 3yr.
              </div>
            </div>

            <div className="rounded-xl border border-war-border/80 bg-black/60 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-war-white/90 mb-3">
                Control adoption rate
                <EduTooltip
                  title="Control adoption and FAIR"
                  body="Adoption rate is the percentage of applicable systems or processes where the control is in place. In FAIR, vulnerability (and thus LEF) decreases as adoption increases—fewer successful threat events. Higher adoption generally reduces Gross P90 and improves Net P90 after controls. Target levels (e.g. 85%+) reflect mature security posture."
                  badge="FAIR"
                />
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-war-muted">Current adoption</span>
                  <span className="text-war-white font-semibold">{activeMetrics.controlAdoption}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-black/60 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                    style={{ width: `${activeMetrics.controlAdoption}%` }}
                  />
                </div>
                <div className="text-[10px] text-war-muted mt-2">
                  Target: 85%+ for mature security posture
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "fmva" && (
          <section className="flex-1 flex flex-col min-h-0 min-w-0 space-y-4" role="tabpanel" id="fmva-tabpanel" aria-labelledby="fmva-tab">
            {/* Deep Finance Mode FIRST - showcasing rigorous FMVA analysis */}
            <div>
              <DeepFinanceMode />
            </div>
            
            {/* Excel spreadsheet below - supporting reference tool */}
            <div className="flex-1 flex flex-col min-h-0">
              <a 
                href="#fmva-spreadsheet" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-6 focus:px-3 focus:py-1.5 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:z-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-black text-sm font-medium"
              >
                Skip to FMVA spreadsheet table
              </a>
              <div id="fmva-spreadsheet" tabIndex={-1} className="flex-1 flex flex-col min-h-0">
                <Suspense fallback={
                  <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-3">
                      <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-war-muted">Loading FMVA Model...</p>
                    </div>
                  </div>
                }>
                  <FmvaSpreadsheet />
                </Suspense>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  valueLabel: string;
  description: string;
  tone: "green" | "amber" | "red" | "blue" | "slate" | "orange";
  wide?: boolean;
  fraction?: number;
  /** Optional educational tooltip for this metric */
  infoTitle?: string;
  infoBody?: string;
  infoBadge?: "FAIR" | "FMVA";
}

function toneClasses(tone: MetricCardProps["tone"]) {
  switch (tone) {
    case "green":
      return {
        bar: "from-emerald-400 to-emerald-600",
        dot: "bg-emerald-400",
      };
    case "amber":
      return { bar: "from-amber-300 to-amber-500", dot: "bg-amber-300" };
    case "red":
      return { bar: "from-red-400 to-red-600", dot: "bg-red-400" };
    case "blue":
      return { bar: "from-sky-400 to-sky-600", dot: "bg-sky-400" };
    case "slate":
      return { bar: "from-slate-400 to-slate-600", dot: "bg-slate-300" };
    case "orange":
      return { bar: "from-orange-400 to-orange-600", dot: "bg-orange-400" };
  }
}

function MetricCard({ label, valueLabel, description, tone, wide, fraction, infoTitle, infoBody, infoBadge }: MetricCardProps) {
  const { bar, dot } = toneClasses(tone);
  const clamped = fraction === undefined ? 0.75 : Math.max(0, Math.min(1, fraction));
  return (
    <article
      className={`rounded-xl border border-war-border/80 bg-black/60 px-4 py-3 shadow-sm ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="flex items-center gap-1.5 text-xs font-medium text-war-white/90">
          {label}
          {infoTitle && infoBody && (
            <EduTooltip title={infoTitle} body={infoBody} badge={infoBadge} />
          )}
        </h3>
        <span className="text-sm font-semibold text-war-white">{valueLabel}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden mb-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${
          8 + clamped * 92
        }%` }} />
      </div>
      <p className="text-[11px] text-war-muted leading-snug">{description}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-war-muted/80">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span>{infoBadge === "FAIR" ? "FAIR risk metric" : infoBadge === "FMVA" ? "FMVA-linked" : "Risk & finance"}</span>
      </div>
    </article>
  );
}

