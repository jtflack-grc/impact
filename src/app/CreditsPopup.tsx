import { useState } from "react";
import { createPortal } from "react-dom";

export function CreditsPopup() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
      onClick={close}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] rounded-2xl border-2 border-slate-500/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 pb-6 flex-shrink-0 border-b border-slate-700">
          <h2 id="credits-title" className="text-xl font-semibold tracking-wide text-white mb-1">
            Credits &amp; Acknowledgments
          </h2>
          <p className="text-slate-300 font-medium text-lg">Impact! An IT Loss &amp; Financial Simulator</p>
          <p className="text-sm text-slate-400 mt-2">
            IMPACT! is designed as a showpiece for both sides of the risk coin—FAIR and FMVA—with scenario-based
            play as the glue between them. This educational tool is for learning how FAIR and FMVA concepts work
            together: quantifying cyber risk and modeling its financial impact through interactive simulation.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 text-sm text-slate-300">
          <section>
            <h3 className="text-white font-semibold mb-2">Created and Developed By</h3>
            <p className="text-white font-medium text-base">John Flack</p>
            <p className="text-slate-400 text-xs">Application Builder &amp; Author</p>
            <p className="text-slate-500 text-xs mt-1">Version 1.0.0</p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Technologies &amp; Libraries</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>React — UI framework</li>
              <li>react-globe.gl — 3D globe visualization</li>
              <li>Three.js — 3D graphics rendering</li>
              <li>Recharts — Charts and data visualization</li>
              <li>Vite — Build tool and dev server</li>
              <li>TypeScript — Type-safe JavaScript</li>
              <li>Zustand — State management</li>
              <li>Tailwind CSS — Styling</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Methodologies &amp; References</h3>
            <p className="text-slate-400 mb-2">
              This simulator draws on concepts and frameworks from:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>FAIR (Factor Analysis of Information Risk) — quantitative cyber risk</li>
              <li>FMVA / CFI (Corporate Finance Institute) — financial modeling and valuation</li>
              <li>NIST Risk Management Framework and cybersecurity guidance</li>
              <li>Industry practice for loss event frequency, loss magnitude, and control effectiveness</li>
              <li>Capital budgeting (NPV, IRR, payback) and DCF valuation concepts</li>
            </ul>
            <p className="text-slate-500 text-xs mt-2">
              Full citations and educational tooltips are available throughout the application.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">About FAIR</h3>
            <p className="text-slate-400 mb-2">
              FAIR (Factor Analysis of Information Risk) models risk as the product of Loss Event Frequency (LEF)
              and Loss Magnitude (LM). LEF = TEF × Vulnerability (TEF = how often threats act; Vulnerability = likelihood
              a threat event becomes a loss). LM captures primary and secondary loss. Monte Carlo simulation produces
              loss percentiles (e.g. P50, P90)—the numbers this simulator uses to show how FAIR-style risk translates
              into financial impact (FMVA). In this app, TEF is approximated by the incident-rate proxy; Vulnerability
              by control adoption.
            </p>
            <p className="text-slate-500 text-xs">
              Learn more:{" "}
              <a
                href="https://www.fairinstitute.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                FAIR Institute
              </a>
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Geographic Data</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>World GeoJSON data for country boundaries on the globe</li>
              <li>Scenario company and location data for illustrative purposes only</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Educational Purpose</h3>
            <p className="text-slate-400 mb-2">
              This simulator is designed for educational purposes to help users understand:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>How FAIR quantifies cyber risk (loss percentiles, frequency, magnitude)</li>
              <li>How FMVA-style modeling puts risk in financial terms (revenue at risk, DCF, capital budgeting)</li>
              <li>How control adoption and TEF affect LEF and loss exposure over time</li>
              <li>Trade-offs between control investment and risk reduction (ROSI, NPV, IRR)</li>
            </ul>
            <p className="text-slate-500 text-xs mt-2">
              This tool should not be used as the sole basis for risk or investment decisions. Real-world outcomes
              depend on many factors not captured in this simplified model.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Acknowledgments</h3>
            <p className="text-slate-400">
              Special thanks to the FAIR Institute, CFI, and the broader risk and finance communities for
              methodologies that make quantitative risk and financial modeling accessible. This tool aims to
              bridge the gap between risk practitioners and finance professionals.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              For questions, feedback, or to report issues, please refer to the disclaimers in the application.
            </p>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">Key terms</h3>
            <p className="text-slate-400 mb-2">FAIR:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mb-3">
              <li><strong className="text-slate-300">LEF</strong> — Loss Event Frequency; how often a loss event is expected to occur.</li>
              <li><strong className="text-slate-300">LM</strong> — Loss Magnitude; the size of loss when an event occurs.</li>
              <li><strong className="text-slate-300">TEF</strong> — Threat Event Frequency; how often a threat acts.</li>
              <li><strong className="text-slate-300">P90</strong> — 90th percentile loss; 90% of simulated outcomes fall below this amount.</li>
              <li><strong className="text-slate-300">Vulnerability</strong> — Likelihood that a threat event results in a loss (TEF → LEF).</li>
              <li><strong className="text-slate-300">EAL</strong> — Expected Annual Loss; mean loss × LEF, used for reserves and planning.</li>
            </ul>
            <p className="text-slate-400 mb-2">FMVA:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-300">NPV</strong> — Net Present Value; value of future cash flows in today’s terms.</li>
              <li><strong className="text-slate-300">IRR</strong> — Internal Rate of Return; discount rate at which NPV equals zero.</li>
              <li><strong className="text-slate-300">WACC</strong> — Weighted Average Cost of Capital; cost of financing used to discount cash flows.</li>
              <li><strong className="text-slate-300">DCF</strong> — Discounted Cash Flow; valuation method based on projected cash flows.</li>
              <li><strong className="text-slate-300">EBITDA</strong> — Earnings Before Interest, Taxes, Depreciation, and Amortization; proxy for operating profit.</li>
            </ul>
          </section>

          <section className="pt-2 border-t border-slate-700">
            <h3 className="text-slate-300 font-semibold mb-2 text-xs uppercase tracking-wider">Disclaimers</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
              <li>All companies, scenarios, financial figures, and incident descriptions are fictional and for illustration only.</li>
              <li>This application is not affiliated with the FAIR Institute or the Corporate Finance Institute (CFI).</li>
              <li>Risk and valuation outputs are simulated and must not be used for real-world decisions.</li>
              <li>External references are provided as further reading; content is the responsibility of those organizations.</li>
            </ul>
          </section>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t border-slate-700">
          <button
            type="button"
            onClick={close}
            className="w-full rounded-lg bg-slate-600 text-white text-sm font-medium py-2.5 hover:bg-slate-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        data-credits-trigger
        onClick={() => setOpen(true)}
        className="px-3 py-2 min-h-[44px] rounded-full border border-war-border text-war-white/80 hover:bg-war-border/60 text-xs"
      >
        Credits
      </button>
      {createPortal(open ? modalContent : null, document.body)}
    </>
  );
}
