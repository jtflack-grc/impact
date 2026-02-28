import { useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioMetricKey } from "../content/schema";
import { useScenarioStore } from "../store/scenarioStore";

const METRIC_LABELS: Record<ScenarioMetricKey, string> = {
  controlAdoption: "Control adoption",
  incidentRate: "Threat event frequency (TEF)",
  successIndex: "Success index",
  welfareDebt: "Governance debt",
  systemReversibility: "System reversibility",
  debtIndex: "Debt index",
};

// FAIR metrics that should be displayed in impact summaries
const FAIR_METRICS: Set<ScenarioMetricKey> = new Set(["controlAdoption", "incidentRate"]);

/** One-line FAIR takeaway from metric deltas for the impact popup */
function fairTakeaway(deltas: Partial<Record<ScenarioMetricKey, number>>): string | null {
  if (!deltas || Object.keys(deltas).length === 0) return null;
  const lines: string[] = [];
  // Only include actual FAIR metrics
  if (deltas.controlAdoption != null && deltas.controlAdoption > 0) {
    lines.push("Higher control adoption → lower vulnerability → lower LEF.");
  }
  // Note: incidentRate could map to TEF (Threat Event Frequency), but needs proper FAIR framing
  // For now, we'll keep it but frame it in FAIR terms
  if (deltas.incidentRate != null && deltas.incidentRate < 0) {
    lines.push("Threat event frequency (TEF) reduced → lower loss event frequency (LEF).");
  }
  // Non-FAIR metrics (welfareDebt, systemReversibility, debtIndex, successIndex) are game mechanics
  // and should not appear in FAIR takeaways
  return lines.length > 0 ? lines.join(" ") : null;
}

interface MessageBubble {
  id: string;
  text: string;
  displayedLength: number;
  isComplete: boolean;
}

const TYPING_INTERVAL_MS = 4;   // Very fast, snappy response
const CHARS_PER_TICK = 2;       // Multiple chars per tick for speed
const PAUSE_BETWEEN_MESSAGES_MS = 40;

export function ChatPanel() {
  const scenarios = useScenarioStore((s) => s.scenarios);
  const currentScenarioIndex = useScenarioStore((s) => s.currentScenarioIndex);
  const currentStepIndex = useScenarioStore((s) => s.currentStepIndex);
  const showResults = useScenarioStore((s) => s.showResults);
  const setScenarioByIndex = useScenarioStore((s) => s.setScenarioByIndex);
  const choose = useScenarioStore((s) => s.choose);
  const continueAfterResults = useScenarioStore((s) => s.continueAfterResults);
  const moveToNextScenario = useScenarioStore((s) => s.moveToNextScenario);
  const lastChoiceImpact = useScenarioStore((s) => s.lastChoiceImpact);
  const restart = useScenarioStore((s) => s.restartCurrent);
  const simulationComplete = useScenarioStore((s) => s.simulationComplete);
  const resetSimulation = useScenarioStore((s) => s.resetSimulation);

  const scenario = scenarios[currentScenarioIndex];
  const step = scenario.steps[currentStepIndex];
  const atLastStep = currentStepIndex >= scenario.steps.length - 1;
  const hasNextScenario = currentScenarioIndex < scenarios.length - 1;

  useEffect(() => {
    if (simulationComplete) {
      localStorage.setItem("impact-completed-once", "true");
    }
  }, [simulationComplete]);

  const messages = useMemo(() => {
    if (step.messages && Array.isArray(step.messages)) {
      return step.messages;
    }
    return [];
  }, [step]);

  const [messageBubbles, setMessageBubbles] = useState<MessageBubble[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const msgIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const messagesRef = useRef<string[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    setMessageBubbles([]);
    setCurrentMessageIndex(0);
    setIsTyping(false);
    msgIdxRef.current = 0;
    charIdxRef.current = 0;

    if (messages.length === 0) return;

    const initialBubbles: MessageBubble[] = messages.map((msg, idx) => ({
      id: `msg-${idx}`,
      text: msg,
      displayedLength: 0,
      isComplete: false,
    }));
    setMessageBubbles(initialBubbles);
    setIsTyping(true);

    let pauseUntil = 0;
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now < pauseUntil) return;

      const msgIdx = msgIdxRef.current;
      const charIdx = charIdxRef.current;
      const msgs = messagesRef.current;
      if (msgIdx >= msgs.length) {
        setIsTyping(false);
        return;
      }

      const currentText = msgs[msgIdx];
      if (charIdx >= currentText.length) {
        // Finish current message and move to next
        msgIdxRef.current = msgIdx + 1;
        charIdxRef.current = 0;
        setCurrentMessageIndex(msgIdx + 1);
        if (msgIdx + 1 >= msgs.length) {
          clearInterval(intervalId);
          setIsTyping(false);
          return;
        }
        pauseUntil = Date.now() + PAUSE_BETWEEN_MESSAGES_MS;
        return;
      }

      const advance = Math.min(CHARS_PER_TICK, currentText.length - charIdx);
      charIdxRef.current = charIdx + advance;
      setMessageBubbles((prev) => {
        const updated = [...prev];
        if (msgIdx < updated.length) {
          const nextLen = charIdx + advance;
          updated[msgIdx] = {
            ...updated[msgIdx],
            displayedLength: nextLen,
            isComplete: nextLen >= updated[msgIdx].text.length,
          };
        }
        return updated;
      });
    }, TYPING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [scenario.id, step.id, messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Assistant header */}
      <div className="px-5 pt-5 pb-3 border-b border-war-border/60">
        <div className="inline-flex items-center gap-3 rounded-full bg-black/60 border border-war-border/70 px-3 py-1 shadow-sm">
          <div
            className={`h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] ${
              isTyping ? "animate-pulse" : ""
            }`}
          />
          <div className="text-xs font-medium tracking-[0.18em] uppercase text-war-muted">
            BreachGuard LLM
          </div>
          <span className="text-[10px] text-war-muted/80">
            IT Security Assistant · v1 {isTyping ? "· composing" : ""}
          </span>
        </div>
        {/* Scenario chips hidden in UI; progression handled from bottom controls */}
        <div className="mt-3 hidden flex-wrap gap-1.5">
          {scenarios.map((s, idx) => {
            const active = idx === currentScenarioIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenarioByIndex(idx)}
                className={`px-2.5 py-1 rounded-full text-[11px] border ${
                  active
                    ? "border-war-white bg-war-white text-black"
                    : "border-war-border text-war-muted hover:text-war-white hover:bg-war-border/70"
                }`}
              >
                {s.index.toString().padStart(2, "0")} · {s.shortTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 space-y-4">
        {simulationComplete ? (
          /* End / completion view */
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-emerald-900/40 to-slate-900/80 border border-emerald-500/40 px-6 py-6 text-center">
              <h2 className="text-xl font-bold tracking-wide text-white mb-2">Simulation complete</h2>
              <p className="text-sm text-slate-300 mb-6">
                You completed all 15 scenarios. Thank you for exploring FAIR and FMVA with IMPACT!
              </p>
              <div className="text-left max-w-md mx-auto space-y-3 mb-6">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">What you practiced</p>
                <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                  <li>FAIR loss percentiles (P90, LEF, loss magnitude) across 15 scenarios</li>
                  <li>FMVA-style capital budgeting (NPV, IRR, ROSI) and revenue-at-risk thinking</li>
                  <li>How choices affect control adoption and threat event frequency (TEF) in the dashboard</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => resetSimulation()}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 text-white text-sm font-semibold px-6 py-3.5 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
                >
                  Play again
                </button>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); document.querySelector<HTMLButtonElement>("[data-credits-trigger]")?.click(); }}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-500 text-slate-300 text-sm font-medium px-6 py-3.5 hover:bg-slate-700/50 transition-colors"
                >
                  Credits
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Scenario header */}
        <div className="rounded-xl bg-black/60 border border-war-border/70 px-4 py-3 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-war-muted">
            Scenario {scenario.index} of {scenarios.length}
          </p>
          <h2 className="text-sm font-semibold text-war-white">{scenario.title}</h2>
          <p className="text-xs text-war-muted mb-1">{scenario.category}</p>
          {scenario.fairFocus && (
            <p className="text-[11px] text-emerald-400/90 italic">
              FAIR focus: {scenario.fairFocus}
            </p>
          )}
          <p className="text-xs text-war-muted/90">
            You are modeling risk for{" "}
            <span className="font-semibold text-war-white/90">{scenario.company.name}</span>, a{" "}
            {scenario.company.sector.toLowerCase()} operating in {scenario.company.region}. Annual
            revenue is approximately{" "}
            <span className="font-semibold">
              ${scenario.company.annualRevenueMillions.toLocaleString()}M
            </span>{" "}
            with an EBITDA margin around {scenario.company.ebitdaMarginPercent}%.
          </p>
        </div>

        {/* LLM Message bubbles — only show messages up to current (strict order) */}
        <div className="space-y-3">
          {messageBubbles.map((bubble, idx) => {
            if (idx > currentMessageIndex) return null;
            const displayedText = bubble.text.slice(0, bubble.displayedLength);
            const isCurrentlyTyping = idx === currentMessageIndex && isTyping && !bubble.isComplete;
            return (
              <div
                key={bubble.id}
                className="rounded-xl bg-black/60 border border-war-border/70 px-4 py-3"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-war-muted mb-1">BreachGuard LLM</div>
                    <p className="text-sm text-war-white/90 leading-relaxed">
                      {displayedText}
                      {isCurrentlyTyping && (
                        <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Choices section */}
        <div className="mt-2 rounded-xl bg-black/40 border border-war-border/70 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-war-muted">
              Round
            </div>
            <div className="text-[10px] text-war-muted/80">
              Step {currentStepIndex + 1} of {scenario.steps.length}
            </div>
          </div>
          
          {showResults ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-800/90 border border-slate-600 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600/30 to-sky-600/20 px-4 py-3 border-b border-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300 tracking-wide">Impact on FAIR & FMVA</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-1">{lastChoiceImpact?.label}</p>
                  {lastChoiceImpact?.summary && (
                    <p className="text-xs text-slate-300 mt-1">{lastChoiceImpact.summary}</p>
                  )}
                </div>
                <div className="px-4 py-3">
                  {lastChoiceImpact?.metricDeltas && Object.keys(lastChoiceImpact.metricDeltas).length > 0 ? (
                    <>
                      {/* Show only FAIR metrics prominently */}
                      {Object.entries(lastChoiceImpact.metricDeltas).some(([key]) => FAIR_METRICS.has(key as ScenarioMetricKey)) && (
                        <ul className="space-y-2 mb-4">
                          {(Object.entries(lastChoiceImpact.metricDeltas) as [ScenarioMetricKey, number][])
                            .filter(([key]) => FAIR_METRICS.has(key))
                            .map(([key, delta]) => {
                              const label = METRIC_LABELS[key];
                              const sign = delta >= 0 ? "+" : "";
                              // For FAIR metrics: controlAdoption higher is better, incidentRate lower is better
                              const isPositive = key === "controlAdoption" ? delta > 0 : delta < 0;
                              return (
                                <li key={key} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">{label}</span>
                                  <span className={isPositive ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                                    {sign}{delta}%
                                  </span>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                      {/* Note about other metrics being game mechanics */}
                      {Object.entries(lastChoiceImpact.metricDeltas).some(([key]) => !FAIR_METRICS.has(key as ScenarioMetricKey)) && (
                        <p className="text-[10px] text-slate-500 mb-4 italic">
                          Other scenario factors may also change (see center dashboard for full FAIR/FMVA analysis).
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 mb-4">Check the center dashboard for updated FAIR risk metrics and FMVA financial impact.</p>
                  )}
                  {lastChoiceImpact?.metricDeltas && fairTakeaway(lastChoiceImpact.metricDeltas) && (
                    <p className="text-[11px] text-emerald-300/90 mb-4 border-l-2 border-emerald-500/50 pl-3">
                      FAIR: {fairTakeaway(lastChoiceImpact.metricDeltas)}
                    </p>
                  )}
                  {atLastStep && hasNextScenario ? (
                    <button
                      type="button"
                      onClick={() => moveToNextScenario()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold px-6 py-3.5 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
                    >
                      Move to Next Scenario →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => continueAfterResults()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold px-6 py-3 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {step.prompt && (
                <p className="text-sm text-war-white/90 mb-2">
                  <span className="font-semibold">Prompt:</span> {step.prompt}
                </p>
              )}
              {step.choices && step.choices.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {step.choices.map((choice, idx) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => choose(choice.id)}
                      className="group text-left rounded-xl border-2 border-slate-600/80 bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:border-emerald-500/60 hover:from-emerald-900/30 hover:to-slate-900 px-4 py-4 min-h-[44px] transition-all duration-200 shadow-lg hover:shadow-emerald-500/15"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/80 group-hover:bg-emerald-500/30 text-xs font-bold text-slate-400 group-hover:text-emerald-300">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-war-white group-hover:text-white mb-1">{choice.label}</div>
                          {choice.summary && (
                            <div className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed">
                              {choice.summary}
                            </div>
                          )}
                          {!choice.summary && choice.metricDeltas && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              This choice will update FAIR metrics (e.g. control adoption, LEF) and FMVA impact in the center dashboard.
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => choose()}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-war-white text-black text-sm font-semibold px-6 py-3.5 hover:bg-white/90 transition-colors shadow-lg"
                >
                  {atLastStep && hasNextScenario ? "Move to Next Scenario →" : atLastStep ? "Finish scenario" : "Continue"}
                </button>
              )}
            </>
          )}
          
          <div className="flex gap-2 pt-2 border-t border-war-border/50">
            <button
              type="button"
              onClick={() => restart()}
              className="inline-flex items-center justify-center rounded-lg border border-war-border text-war-muted text-xs px-4 py-2 hover:text-war-white hover:bg-war-border/60 transition-colors"
            >
              Restart scenario
            </button>
            {atLastStep && hasNextScenario && !showResults && (
              <button
                type="button"
                onClick={() => moveToNextScenario()}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold px-6 py-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Move to Next Scenario →
              </button>
            )}
          </div>
        </div>

        {/* Further reading */}
        {scenario.resources && scenario.resources.length > 0 && (
          <div className="rounded-xl bg-black/40 border border-war-border/70 px-4 py-3 space-y-2">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-war-muted">
              Further reading
            </div>
            <ul className="space-y-1">
              {scenario.resources.map((res) => (
                <li key={res.id}>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-2"
                  >
                    {res.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
