import { useEffect, useMemo, useState } from "react";
import {
  deriveImpactAnalysis,
  formatImpactMillions,
} from "../model/impactAnalysis";
import { useImpactInteractionStore } from "../store/interactionStore";
import { useScenarioStore } from "../store/scenarioStore";

type GuideStep = {
  kicker: string;
  title: string;
  text: string;
  focus: "grossP90" | "netP90" | "frequency" | null;
};

const VOICE_STORAGE_KEY = "impact-guided-voice-uri";

function voiceQualityScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (!voice.localService) score += 120;
  if (/natural|neural|online|premium/.test(name)) score += 100;
  if (/aria|jenny|ava|guy|sonia|ryan|libby/.test(name)) score += 45;
  if (/google us english|samantha/.test(name)) score += 35;
  if (/zira|hazel/.test(name)) score += 18;
  if (voice.lang.toLowerCase() === "en-us") score += 12;
  if (/david|mark/.test(name)) score -= 8;
  return score;
}

function isHighQualityVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return !voice.localService || /natural|neural|online|premium/.test(name);
}

function choosePreferredVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );
  const candidates = english.length > 0 ? english : voices;
  return (
    [...candidates].sort(
      (a, b) => voiceQualityScore(b) - voiceQualityScore(a)
    )[0] ?? null
  );
}

function configureUtterance(
  utterance: SpeechSynthesisUtterance,
  voice: SpeechSynthesisVoice | null
) {
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }
  const highQuality = voice ? isHighQualityVoice(voice) : false;
  utterance.rate = highQuality ? 0.97 : 0.88;
  utterance.pitch = highQuality ? 1 : 1.03;
  utterance.volume = 0.94;
}

export function GuidedScenarioMode() {
  const scenario = useScenarioStore(
    (state) => state.scenarios[state.currentScenarioIndex]
  );
  const step = useScenarioStore((state) => {
    const activeScenario = state.scenarios[state.currentScenarioIndex];
    return activeScenario.steps[state.currentStepIndex];
  });
  const activeMetrics = useScenarioStore((state) => state.activeMetrics);
  const guidedActive = useImpactInteractionStore((state) => state.guidedActive);
  const guidedStep = useImpactInteractionStore((state) => state.guidedStep);
  const guidedVoice = useImpactInteractionStore((state) => state.guidedVoice);
  const setGuidedStep = useImpactInteractionStore(
    (state) => state.setGuidedStep
  );
  const setGuidedVoice = useImpactInteractionStore(
    (state) => state.setGuidedVoice
  );
  const stopGuided = useImpactInteractionStore((state) => state.stopGuided);
  const setLinkedFocus = useImpactInteractionStore(
    (state) => state.setLinkedFocus
  );
  const clearLinkedFocus = useImpactInteractionStore(
    (state) => state.clearLinkedFocus
  );
  const [playing, setPlaying] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(VOICE_STORAGE_KEY) ?? "")
  );

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
  const englishVoices = useMemo(
    () =>
      voices
        .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
        .sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a)),
    [voices]
  );
  const preferredVoice = useMemo(
    () => choosePreferredVoice(englishVoices),
    [englishVoices]
  );
  const selectedVoice = useMemo(
    () =>
      englishVoices.find((voice) => voice.voiceURI === selectedVoiceURI) ??
      preferredVoice,
    [englishVoices, preferredVoice, selectedVoiceURI]
  );
  const naturalVoiceAvailable = englishVoices.some(isHighQualityVoice);
  const isFirefox =
    typeof navigator !== "undefined" &&
    navigator.userAgent.includes("Firefox/");

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
    const utterance = new SpeechSynthesisUtterance(
      `${current.title}. ${current.text}`
    );
    configureUtterance(utterance, selectedVoice);
    synth.speak(utterance);
    return () => synth.cancel();
  }, [current, guidedActive, guidedVoice, selectedVoice]);

  useEffect(() => {
    if (!guidedActive || !playing || safeStep >= steps.length - 1) return;
    const duration = Math.max(4800, Math.min(9000, current.text.length * 36));
    const timer = window.setTimeout(
      () => setGuidedStep(safeStep + 1),
      duration
    );
    return () => window.clearTimeout(timer);
  }, [
    current.text.length,
    guidedActive,
    playing,
    safeStep,
    setGuidedStep,
    steps.length,
  ]);

  if (!guidedActive) return null;

  const updateSelectedVoice = (voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    if (voiceURI) window.localStorage.setItem(VOICE_STORAGE_KEY, voiceURI);
    else window.localStorage.removeItem(VOICE_STORAGE_KEY);
  };

  const previewVoice = () => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Impact guided briefing. Quantified cyber risk, translated into business consequence."
    );
    configureUtterance(utterance, selectedVoice);
    synth.speak(utterance);
  };

  const exit = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    clearLinkedFocus();
    stopGuided();
  };

  return (
    <div className="fixed bottom-5 left-1/2 z-[80] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 border border-slate-500/70 bg-[#07090b]/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-war-border px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em] text-red-300/80">
            Guided mode
          </span>
          <span className="truncate text-[10px] text-war-muted">
            {safeStep + 1} / {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setGuidedVoice(!guidedVoice)}
            className={`border px-2 py-1 ${guidedVoice ? "border-emerald-400/50 text-emerald-300" : "border-war-border text-war-muted"}`}
            title={selectedVoice?.name ?? "System speech voice"}
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
        <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
          {current.kicker}
        </div>
        <div className="mt-1 text-base font-semibold text-war-white">
          {current.title}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {current.text}
        </p>
        {guidedVoice && (
          <div className="mt-3 border-t border-war-border/70 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedVoiceURI}
                onChange={(event) => updateSelectedVoice(event.target.value)}
                className="min-w-0 flex-1 border border-war-border bg-black/70 px-2 py-1.5 text-[10px] text-slate-300"
                aria-label="Guided narration voice"
              >
                <option value="">
                  Auto · {preferredVoice?.name ?? "system default"}
                </option>
                {englishVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} · {voice.localService ? "local" : "online"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={previewVoice}
                className="border border-war-border px-2.5 py-1.5 text-[10px] text-war-muted hover:text-war-white"
              >
                Preview
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] text-slate-500">
              Selected: {selectedVoice?.name ?? "system default"}
              {selectedVoice
                ? ` · ${isHighQualityVoice(selectedVoice) ? "natural/online candidate" : "local system voice"}`
                : ""}
            </div>
            {!naturalVoiceAvailable && (
              <div className="mt-2 border-l-2 border-amber-500/60 pl-2 text-[10px] leading-relaxed text-amber-200/80">
                {isFirefox
                  ? "Firefox is only exposing local system voices here. Pick the best installed option above, or open Impact in Edge for a better chance of an online natural voice."
                  : "This browser is only exposing local system voices. Pick the best installed option above; a browser with online speech voices may sound substantially more natural."}
              </div>
            )}
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
