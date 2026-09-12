import { useEffect, useMemo, useState } from "react";
import { deriveImpactAnalysis, formatImpactMillions } from "../model/impactAnalysis";
import { useImpactInteractionStore } from "../store/interactionStore";
import { useScenarioStore } from "../store/scenarioStore";

type GuideStep = {
  kicker: string;
  title: string;
  text: string;
  focus: "grossP90" | "netP90" | "frequency" | null;
};

function choosePreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const preferred = [
    "natural",
    "neural",
    "aria",
    "jenny",
    "ava",
    "guy",
    "google us english",
    "samantha",
  ];
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  for (const needle of preferred) {
    const match = english.find((voice) => voice.name.toLowerCase().includes(needle));
    if (match) return match;
  }
  return english[0] ?? voices[0] ?? null;
}

export function GuidedScenarioMode() {
  const scenario = useScenarioStore((state) => state.scenarios[state.currentScenarioIndex]);
  const step = useScenarioStore((state) => {
    const activeScenario = state.scenarios[state.currentScenarioIndex];
    return activeScenario.steps[state.currentStepIndex];
  });
  const activeMetrics = useScenarioStore((state) => state.activeMetrics);
  const guidedActive = useImpactInteractionStore((state) => state.guidedActive);
  const guidedStep = useImpactInteractionStore((state) => state.guidedStep);
  const guidedVoice = useImpactInteractionStore((state) => state.guidedVoice);
  const setGuidedStep = useImpactInteractionStore((state) => state.setGuidedStep);
  const setGuidedVoice = useImpactInteractionStore((state) => state.setGuidedVoice);
  const stopGuided = useImpactInteractionStore((state) => state.stopGuided);
  const setLinkedFocus = useImpactInteractionStore((state) => state.setLinkedFocus);
  const clearLinkedFocus = useImpactInteractionStore((state) => state.clearLinkedFocus);
  const [playing, setPlaying] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const analysis = useMemo(
    () => deriveImpactAnalysis(scenario, activeMetrics),
    [activeMetrics, scenario]
  );

  const steps = useMemo<GuideStep[]>(() => {
    const gross = analysis.loss.grossP90;
    const net = analysis.loss.netP90;
    const reduction = gross > 0 ? ((gross - net) / gross) * 100 : 0;
    return [
      {
        kicker: "Situation",
        title: scenario.title,
        text: `${scenario.company.name} is a ${scenario.company.sector.toLowerCase()} organization in ${scenario.company.region}. This scenario centers on ${scenario.lossProfile.topDriver}.`,
        focus: null,
      },
      {
        kicker: "Exposure",
        title: `Gross P90 ${formatImpactMillions(gross)}`,
        text: `The conservative single-event loss boundary is ${formatImpactMillions(gross)}, about ${analysis.grossP90RevenuePercent.toFixed(1)} percent of annual revenue and ${analysis.grossP90EbitdaPercent.toFixed(0)} percent of annual EBITDA.`,
        focus: "grossP90",
      },
      {
        kicker: "Residual",
        title: `Net P90 ${formatImpactMillions(net)}`,
        text: `After modeled controls, recovery, and risk transfer, the residual P90 is ${formatImpactMillions(net)}. That is a ${reduction.toFixed(0)} percent reduction from gross exposure.`,
        focus: "netP90",
      },
      {
        kicker: "Frequency",
        title: `LEF ${analysis.loss.frequency.toFixed(2)} per year`,
        text: `The teaching model combines a threat-event-frequency factor of ${analysis.tefFactor.toFixed(2)} times baseline with a vulnerability proxy of ${(analysis.vulnerabilityProxy * 100).toFixed(0)} percent. That produces a loss-event frequency of ${analysis.loss.frequency.toFixed(2)} per year and expected annual loss of ${formatImpactMillions(analysis.expectedAnnualLossMillions)}.`,
        focus: "frequency",
      },
      {
        kicker: "Decision",
        title: step.title,
        text: step.prompt
          ? `${step.prompt} The model is now yours: compare the choices, make the decision, and then inspect why the numbers moved.`
          : "Review the available decision paths, make the next choice, and then inspect why the numbers moved.",
        focus: null,
      },
    ];
  }, [analysis, scenario, step.prompt, step.title]);

  const safeStep = Math.min(guidedStep, steps.length - 1);
  const current = steps[safeStep];
  const preferredVoice = useMemo(() => choosePreferredVoice(voices), [voices]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener?.("voiceschanged", refresh);
    return () => synth.removeEventListener?.("voiceschanged", refresh);
  }, []);

  useEffect(() => {
    if (!guidedActive) return;
    setPlaying(true);
    setGuidedStep(0);
  }, [guidedActive, scenario.id, setGuidedStep]);

  useEffect(() => {
    if (!guidedActive) return;
    if (current.focus) setLinkedFocus(current.focus);
    else clearLinkedFocus();
    return () => clearLinkedFocus();
  }, [clearLinkedFocus, current.focus, guidedActive, setLinkedFocus]);

  useEffect(() => {
    if (!guidedActive || !guidedVoice || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`${current.title}. ${current.text}`);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.93;
    utterance.pitch = 0.98;
    utterance.volume = 0.92;
    synth.speak(utterance);
    return () => synth.cancel();
  }, [current, guidedActive, guidedVoice, preferredVoice]);

  useEffect(() => {
    if (!guidedActive || !playing || safeStep >= steps.length - 1) return;
    const duration = Math.max(4800, Math.min(9000, current.text.length * 36));
    const timer = window.setTimeout(() => setGuidedStep(safeStep + 1), duration);
    return () => window.clearTimeout(timer);
  }, [current.text.length, guidedActive, playing, safeStep, setGuidedStep, steps.length]);

  if (!guidedActive) return null;

  const exit = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    clearLinkedFocus();
    stopGuided();
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-[80] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 border border-slate-500/70 bg-[#07090b]/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-war-border px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em] text-red-300/80">Guided mode</span>
          <span className="truncate text-[10px] text-war-muted">{safeStep + 1} / {steps.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setGuidedVoice(!guidedVoice)}
            className={`border px-2 py-1 ${guidedVoice ? "border-emerald-400/50 text-emerald-300" : "border-war-border text-war-muted"}`}
            title={preferredVoice?.name ?? "System speech voice"}
          >
            Voice {guidedVoice ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={exit}
            className="border border-war-border px-2 py-1 text-war-muted hover:text-war-white"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">{current.kicker}</div>
        <div className="mt-1 text-base font-semibold text-war-white">{current.title}</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{current.text}</p>
        {guidedVoice && (
          <div className="mt-2 font-mono text-[9px] text-slate-500">
            Voice: {preferredVoice?.name ?? "system default"}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-war-border px-4 py-2">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          className="border border-war-border px-2 py-1 text-[10px] text-war-muted hover:text-war-white"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safeStep === 0}
            onClick={() => setGuidedStep(Math.max(0, safeStep - 1))}
            className="border border-war-border px-3 py-1 text-[10px] text-war-muted disabled:opacity-30"
          >
            Back
          </button>
          {safeStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setGuidedStep(safeStep + 1)}
              className="border border-red-400/50 bg-red-950/20 px-3 py-1 text-[10px] text-red-200"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={exit}
              className="border border-emerald-400/50 px-3 py-1 text-[10px] text-emerald-300"
            >
              Hand back control
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
