import { ChatPanel } from "./ChatPanel";
import { CreditsPopup } from "./CreditsPopup";
import { MetricsDashboard } from "./MetricsDashboard";
import { ScenarioGlobe } from "./ScenarioGlobe";
import { WelcomePopup } from "./WelcomePopup";

export function Layout() {
  return (
    <>
      <div className="flex flex-col h-screen bg-black relative" style={{ color: '#ffffff' }}>
      {/* Top bar - inline color so header is always visible */}
      <header className="shrink-0 border-b border-gray-800 flex items-center justify-between px-4 md:px-8 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.9)', color: '#ffffff' }}>
        <div className="w-[40px] md:w-[80px]" aria-hidden="true" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.2em] md:tracking-[0.35em]" style={{ color: '#ffffff' }}>
            IMPACT!
          </h1>
          <p className="text-[10px] md:text-[11px] tracking-wide" style={{ color: '#a3a3a3' }}>
            A FAIR and FMVA Financial Simulator
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-xs">
          <CreditsPopup />
        </div>
      </header>

      {/* Three-column main layout - inline color so content is visible if Tailwind fails */}
      <main className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden" style={{ color: "#ffffff" }}>
        {/* Left: Faux LLM / chat */}
        <section className="flex flex-col w-full md:w-[320px] lg:w-[360px] border-r border-gray-800 bg-gradient-to-b from-black to-[#020617] min-h-0">
          <ChatPanel />
        </section>

        {/* Middle: Metrics dashboard */}
        <section className="flex-1 min-w-0 md:min-w-[320px] md:max-w-[640px] border-r border-gray-800 bg-[#020617] min-h-0 overflow-y-auto">
          <MetricsDashboard />
        </section>

        {/* Right: Globe */}
        <section className="hidden md:flex flex-1 min-w-0 md:min-w-[380px] bg-black relative">
          <ScenarioGlobe />
        </section>
      </main>
    </div>
      <WelcomePopup />
    </>
  );
}
