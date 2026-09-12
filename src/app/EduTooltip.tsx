import { useState, useRef, useEffect } from "react";

export interface EduTooltipProps {
  title: string;
  body: string;
  /** Optional: "FAIR" or "FMVA" to show a small source label */
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
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-war-border bg-transparent text-war-muted transition-colors hover:border-slate-500 hover:text-war-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        aria-label={`Learn more about ${title}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[100] mt-1.5 w-72 max-w-[90vw] rounded border border-war-border bg-[#0d1115] p-3 text-left"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold text-war-white">{title}</span>
            {badge && (
              <span className={`shrink-0 text-[10px] font-medium ${badge === "FAIR" ? "text-amber-400" : "text-emerald-400"}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">{body}</p>
        </div>
      )}
    </span>
  );
}
