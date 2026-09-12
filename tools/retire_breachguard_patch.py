from pathlib import Path

p = Path("src/app/ChatPanel.tsx")
text = p.read_text()

old = '''      {/* Assistant header */}
      <div className="px-5 pt-5 pb-3 border-b border-war-border/60">
        <div className="inline-flex items-center gap-3 rounded-full bg-black/60 border border-war-border/70 px-3 py-1 shadow-sm">
          <div
            className={`h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] ${
              isTyping ? "animate-pulse" : ""
            }`}
          />
          <div className="text-xs font-medium tracking-[0.18em] uppercase text-war-muted">
            BreachGuard LLM
          </div>
          <span className="text-[10px] text-war-muted/80">
            IT Security Assistant · v1 {isTyping ? "· composing" : ""}
          </span>
        </div>'''
new = '''      {/* Decision Desk header */}
      <div className="px-5 pt-5 pb-3 border-b border-war-border/60">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-red-300/80">
              Decision desk
            </div>
            <div className="mt-1 text-xs font-semibold tracking-wide text-war-white">
              Scenario briefing
            </div>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-war-muted">
            {isTyping ? "Briefing in progress" : "Briefing ready"}
          </div>
        </div>'''
if old not in text:
    raise SystemExit("Decision Desk header anchor not found")
text = text.replace(old, new, 1)

old = '''        {/* LLM Message bubbles — only show messages up to current (strict order) */}
        <div className="space-y-3">
          {messageBubbles.map((bubble, idx) => {
            if (idx > currentMessageIndex) return null;
            const displayedText = bubble.text.slice(0, bubble.displayedLength);
            const isCurrentlyTyping = idx === currentMessageIndex && isTyping && !bubble.isComplete;
            return (
              <div
                key={bubble.id}
                className="rounded-xl bg-black/60 border border-war-border/70 px-4 py-3"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-war-muted mb-1">BreachGuard LLM</div>
                    <p className="text-sm text-war-white/90 leading-relaxed">
                      {displayedText}
                      {isCurrentlyTyping && (
                        <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>'''
new = '''        {/* Briefing feed — reveal authored notes in order */}
        <div className="space-y-3">
          {messageBubbles.map((bubble, idx) => {
            if (idx > currentMessageIndex) return null;
            const displayedText = bubble.text.slice(0, bubble.displayedLength);
            const isCurrentlyTyping = idx === currentMessageIndex && isTyping && !bubble.isComplete;
            return (
              <div
                key={bubble.id}
                className="border-l-2 border-slate-600/70 bg-black/45 px-4 py-3"
              >
                <div className="text-[9px] uppercase tracking-[0.18em] text-war-muted">
                  Briefing note {String(idx + 1).padStart(2, "0")}
                </div>
                <p className="mt-1 text-sm text-war-white/90 leading-relaxed">
                  {displayedText}
                  {isCurrentlyTyping && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-slate-400/80 animate-pulse" />
                  )}
                </p>
              </div>
            );
          })}
        </div>'''
if old not in text:
    raise SystemExit("Briefing feed anchor not found")
text = text.replace(old, new, 1)
p.write_text(text)

p = Path("src/content/securityScenarios.ts")
text = p.read_text()
old = '"As BreachGuard LLM, I need to highlight a critical inheritance problem here: these mappings bypass IBM i object-level security.",'
new = '"The critical inheritance problem is that these mappings bypass IBM i object-level security.",'
if old not in text:
    raise SystemExit("Scenario BreachGuard anchor not found")
p.write_text(text.replace(old, new, 1))

p = Path("src/content/schema.ts")
text = p.read_text()
old = "/** Array of messages that BreachGuard LLM will type out sequentially */"
new = "/** Array of briefing lines revealed sequentially in the Decision Desk. */"
if old not in text:
    raise SystemExit("Schema BreachGuard anchor not found")
p.write_text(text.replace(old, new, 1))
