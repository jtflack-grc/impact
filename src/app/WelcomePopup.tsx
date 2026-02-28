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
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={handleClose}
    >
      <div
        className="relative max-w-2xl w-full rounded-2xl border-2 border-slate-500 bg-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 id="welcome-title" className="text-3xl font-bold tracking-[0.1em] text-white">
              IMPACT!
            </h1>
            <p className="text-sm text-slate-400 tracking-wide">
              A FAIR and FMVA Financial Simulator
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-200 leading-relaxed">
            <p>
              <strong className="text-white">IMPACT!</strong> is a showpiece for both sides of the risk coin—{" "}
              <strong className="text-emerald-400">FAIR</strong> (Factor Analysis of Information Risk) and{" "}
              <strong className="text-emerald-400">FMVA</strong> (Financial Modeling & Valuation Analyst)—with
              scenario-based play as the glue between them. This tool is for learning how FAIR and FMVA concepts
              work together so you can understand IT security risk in financial terms.
            </p>
            <p className="text-slate-300 text-xs">
              You&apos;ll see FAIR terms (P90, LEF, loss magnitude) and FMVA terms (NPV, IRR, revenue at risk). Tap
              the (i) icons throughout the app to learn as you go.
            </p>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white uppercase tracking-wide">
                How It Works
              </h3>
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                <li>
                  <strong className="text-white">15 Security Scenarios:</strong> Each scenario presents a real-world
                  IT security incident, control failure, or architectural blind spot affecting a fictional company.
                </li>
                <li>
                  <strong className="text-white">Interactive Decision Making:</strong> You&apos;ll make choices that
                  affect risk exposure and financial outcomes (FAIR and FMVA metrics). Watch how your decisions impact
                  the center dashboard in real-time.
                </li>
                <li>
                  <strong className="text-white">FAIR Analysis:</strong> Understand loss event frequency, loss
                  magnitude, Monte Carlo simulations, and control impact modeling.
                </li>
                <li>
                  <strong className="text-white">FMVA Modeling:</strong> Explore 3-statement financial models, DCF
                  valuations, capital budgeting (NPV, IRR), and scenario analysis.
                </li>
                <li>
                  <strong className="text-white">Geographic Context:</strong> Each scenario is tied to a specific
                  country. Click on highlighted countries on the globe to see company details and financials.
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-600">
              <p className="text-xs text-slate-400">
                This simulation is designed for educational purposes to demonstrate FAIR and FMVA concepts. All
                companies, scenarios, and financial data are fictional.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold px-6 py-3 hover:bg-emerald-600 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
