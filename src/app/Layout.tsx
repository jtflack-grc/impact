import { useImpactInteractionStore } from "../store/interactionStore";
import { BoardMode } from "./BoardMode";
import { ChatPanel } from "./ChatPanel";
import { CreditsPopup } from "./CreditsPopup";
import { GuidedScenarioMode } from "./GuidedScenarioMode";
import { MetricsDashboard } from "./MetricsDashboard";
import { ScenarioGlobe } from "./ScenarioGlobe";
import { WelcomePopup } from "./WelcomePopup";

export function Layout() {
  const viewMode = useImpactInteractionStore((state) => state.viewMode);
  const setViewMode = useImpactInteractionStore((state) => state.setViewMode);
  const guidedActive = useImpactInteractionStore((state) => state.guidedActive);
  const startGuided = useImpactInteractionStore((state) => state.startGuided);
  const stopGuided = useImpactInteractionStore((state) => state.stopGuided);

  return (
    <>
      <div className="impact-shell flex h-screen flex-col bg-war-bg text-war-white">
        <header className="impact-topbar shrink-0 border-b border-war-border px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <h1 className="shrink-0 text-xl font-semibold tracking-[0.08em] text-war-white md:text-2xl">
                IMPACT<span className="text-red-400">!</span>
              </h1>
              <div className="hidden h-7 w-px bg-war-border sm:block" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-war-white/90">FAIR × FMVA</p>
                <p className="truncate text-[11px] text-war-muted">
                  Quantitative cyber risk and capital decision simulator
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "board" ? "analyst" : "board")}
                className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
                  viewMode === "board"
                    ? "border-red-400/60 bg-red-950/20 text-red-200"
                    : "border-war-border text-war-muted hover:text-war-white"
                }`}
              >
                {viewMode === "board" ? "Analyst mode" : "Board mode"}
              </button>
              <button
                type="button"
                onClick={() => (guidedActive ? stopGuided() : startGuided())}
                className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
                  guidedActive
                    ? "border-emerald-400/50 text-emerald-300"
                    : "border-war-border text-war-muted hover:text-war-white"
                }`}
              >
                {guidedActive ? "Guided active" : "Guided mode"}
              </button>
              <CreditsPopup />
            </div>
          </div>
        </header>

        {viewMode === "board" ? (
          <main className="flex min-h-0 flex-1 overflow-hidden bg-war-bg">
            <BoardMode />
          </main>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-war-bg md:flex-row">
            <section className="scenario-rail flex min-h-0 w-full flex-col border-r border-war-border md:w-[300px] lg:w-[340px] xl:w-[380px]">
              <ChatPanel />
            </section>

            <section className="analysis-rail min-h-0 min-w-0 flex-1 overflow-y-auto border-r border-war-border md:min-w-[360px] lg:min-w-[440px] xl:min-w-[520px] xl:max-w-[720px]">
              <MetricsDashboard />
            </section>

            <section className="globe-rail relative hidden min-w-0 flex-[1.25] bg-black md:flex md:min-w-[340px] lg:min-w-[400px]">
              <ScenarioGlobe />
            </section>
          </main>
        )}
      </div>
      <GuidedScenarioMode />
      <WelcomePopup />
    </>
  );
}
