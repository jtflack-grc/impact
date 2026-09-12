import { useState } from "react";
import { createPortal } from "react-dom";

export function CreditsPopup() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
      onClick={close}
    >
      <div
        className="relative flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden border border-war-border bg-war-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 p-1 text-war-muted transition-colors hover:text-war-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="shrink-0 border-b border-war-border p-6 pr-12">
          <p className="mb-1 text-xs font-medium text-war-muted">IMPACT! / FAIR × FMVA</p>
          <h2 id="credits-title" className="text-xl font-semibold text-war-white">
            Credits and project notes
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-war-muted">
            An educational simulation connecting quantitative cyber-risk analysis with financial modeling and capital decisions.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-sm text-war-muted">
          <dl className="divide-y divide-war-border border-y border-war-border">
            <div className="grid gap-1 py-4 sm:grid-cols-[132px_1fr] sm:gap-5">
              <dt className="font-semibold text-war-white">Built by</dt>
              <dd className="leading-relaxed">
                John Flack<br />
                <span className="text-xs text-war-muted">Application builder and author · Version 1.0.0</span>
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_1fr] sm:gap-5">
              <dt className="font-semibold text-war-white">Risk and finance</dt>
              <dd className="leading-relaxed">
                FAIR concepts include loss event frequency, loss magnitude, vulnerability, expected annual loss, and loss percentiles. FMVA-style analysis includes DCF, WACC, NPV, IRR, payback, and capital budgeting.
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_1fr] sm:gap-5">
              <dt className="font-semibold text-war-white">Technology</dt>
              <dd className="leading-relaxed">
                React, TypeScript, Vite, Zustand, Tailwind CSS, Recharts, Handsontable, and CesiumJS. Geographic rendering uses streamed ArcGIS World Elevation terrain and World Imagery with public country-boundary data.
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_1fr] sm:gap-5">
              <dt className="font-semibold text-war-white">References</dt>
              <dd className="leading-relaxed">
                The simulator draws on FAIR Institute materials, Corporate Finance Institute concepts, NIST risk guidance, and common quantitative risk and corporate-finance practices. Educational tooltips throughout the application explain the terms in context.
              </dd>
            </div>

            <div className="grid gap-1 py-4 sm:grid-cols-[132px_1fr] sm:gap-5">
              <dt className="font-semibold text-war-white">Scope</dt>
              <dd className="leading-relaxed">
                All companies, scenarios, incident descriptions, and financial figures are fictional. Outputs are illustrative and should not be used as the sole basis for real-world risk or investment decisions. IMPACT! is not affiliated with the FAIR Institute or Corporate Finance Institute.
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-war-muted">
            FAIR and FMVA terminology remains the property of the organizations and communities that developed and teach those methods. External references are provided for further reading.
          </p>
        </div>

        <div className="shrink-0 border-t border-war-border p-4">
          <button
            type="button"
            onClick={close}
            className="min-h-[40px] w-full rounded border border-war-border bg-transparent px-4 py-2 text-sm font-medium text-war-white transition-colors hover:bg-white/5"
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
        className="min-h-[40px] rounded border border-war-border bg-transparent px-3 py-2 text-xs font-medium text-war-muted transition-colors hover:border-slate-500 hover:text-war-white"
      >
        About
      </button>
      {createPortal(open ? modalContent : null, document.body)}
    </>
  );
}
