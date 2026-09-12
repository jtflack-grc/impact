import { useEffect, useState } from "react";

export function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("impact-welcome-seen");
    if (hasSeenWelcome) return;
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("impact-welcome-seen", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden border border-war-border bg-war-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 p-1 text-war-muted transition-colors hover:text-war-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="max-w-lg space-y-2 pr-8">
            <p className="text-xs font-medium text-war-muted">FAIR × FMVA simulation</p>
            <h1 id="welcome-title" className="text-2xl font-semibold leading-tight text-war-white sm:text-3xl">
              Cyber risk, translated into financial consequence.
            </h1>
            <p className="text-sm leading-relaxed text-war-muted">
              Work through 15 fictional security scenarios. Your decisions change quantitative risk exposure and the financial case for controls.
            </p>
          </div>

          <dl className="divide-y divide-war-border border-y border-war-border">
            <div className="grid gap-1 py-3 sm:grid-cols-[108px_1fr] sm:gap-4">
              <dt className="text-xs font-semibold text-war-white">Decide</dt>
              <dd className="text-sm leading-relaxed text-war-muted">
                Respond to incidents, control failures, and architecture tradeoffs in the left rail.
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[108px_1fr] sm:gap-4">
              <dt className="text-xs font-semibold text-war-white">Measure</dt>
              <dd className="text-sm leading-relaxed text-war-muted">
                Track FAIR outputs such as P90, LEF, loss magnitude, and expected annual loss in the center rail.
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[108px_1fr] sm:gap-4">
              <dt className="text-xs font-semibold text-war-white">Translate</dt>
              <dd className="text-sm leading-relaxed text-war-muted">
                Put the risk into FMVA-style terms including NPV, IRR, revenue at risk, DCF, and capital budgeting.
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-sm text-xs leading-relaxed text-war-muted">
              Educational simulation only. Companies, scenarios, and financial data are fictional. Use the information icons for definitions as you work.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded bg-war-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Start simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
