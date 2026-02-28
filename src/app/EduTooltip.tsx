import { useState, useRef, useEffect } from "react";

export interface EduTooltipProps {
  title: string;
  body: string;
  /** Optional: "FAIR" or "FMVA" to show a small badge */
  badge?: "FAIR" | "FMVA";
  className?: string;
}

export function EduTooltip({ title, body, badge, className = "" }: EduTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <span ref={containerRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-500/80 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-600/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        aria-label={`Learn more about ${title}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-[100] left-0 top-full mt-1.5 w-72 max-w-[90vw] rounded-lg border border-slate-600 bg-slate-900 shadow-xl p-3 text-left"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-white">{title}</span>
            {badge && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  badge === "FAIR" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{body}</p>
        </div>
      )}
    </span>
  );
}
