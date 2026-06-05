export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-fr-black p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-12">Framed Wordmark — Logo Preview</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Hero size */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40">
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: "64px",
                fontWeight: 400,
                color: "var(--fr-white)",
                letterSpacing: "0.5em",
                lineHeight: 1.2,
              }}
            >
              F R A M E D
            </div>
            <p className="text-xs text-fr-text-muted mt-4">Hero / H1 — 64px / 0.5em tracking</p>
          </div>

          {/* 2. Section heading */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40">
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "var(--fr-white)",
                letterSpacing: "0.3em",
                lineHeight: 1.2,
              }}
            >
              F R A M E D
            </div>
            <p className="text-xs text-fr-text-muted mt-4">Section heading — 32px / 0.3em</p>
          </div>

          {/* 3. TopBar mockup */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40 lg:col-span-2">
            <div className="flex items-center h-14 px-4 border-b border-white/10 bg-background/80 rounded-lg mb-4">
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "var(--fr-white)",
                  letterSpacing: "0.18em",
                }}
              >
                F R A M E D
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span>API Online</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="w-4 h-4 text-muted-foreground">⚙</div>
                <div className="w-4 h-4 text-muted-foreground">→</div>
              </div>
            </div>
            <p className="text-xs text-fr-text-muted">TopBar — 14px / 0.18em tracking</p>
          </div>

          {/* 4. Footer size */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40">
            <div
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "var(--fr-text-muted)",
                letterSpacing: "0.16em",
                lineHeight: 1.2,
              }}
            >
              F R A M E D
            </div>
            <p className="text-xs text-fr-text-muted mt-4">Footer — 12px / 0.16em</p>
          </div>

          {/* 5. Favicon mockup — large */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40">
            <div className="flex items-center justify-center w-32 h-32 bg-fr-black border border-fr-gold/50 rounded-2xl mx-auto mb-4">
              <div
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontSize: "72px",
                  fontWeight: 500,
                  color: "var(--fr-gold)",
                  letterSpacing: 0,
                }}
              >
                F
              </div>
            </div>
            <p className="text-xs text-fr-text-muted text-center">Favicon — 128×128 preview</p>
          </div>

          {/* 6. Favicon mockup — actual sizes */}
          <div className="border border-white/10 rounded-lg p-8 bg-black/40">
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-4 h-4 bg-fr-black border border-fr-gold/50 rounded flex items-center justify-center">
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif), Georgia, serif",
                      fontSize: "8px",
                      fontWeight: 500,
                      color: "var(--fr-gold)",
                    }}
                  >
                    F
                  </div>
                </div>
                <p className="text-xs text-fr-text-muted">16×16</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-fr-black border border-fr-gold/50 rounded flex items-center justify-center">
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif), Georgia, serif",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "var(--fr-gold)",
                    }}
                  >
                    F
                  </div>
                </div>
                <p className="text-xs text-fr-text-muted">32×32</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-fr-black border border-fr-gold/50 rounded flex items-center justify-center">
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif), Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 500,
                      color: "var(--fr-gold)",
                    }}
                  >
                    F
                  </div>
                </div>
                <p className="text-xs text-fr-text-muted">48×48</p>
              </div>
            </div>
            <p className="text-xs text-fr-text-muted text-center">Favicon — actual sizes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
