import Link from "next/link";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Auth temporarily disabled.
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--fr-black)" }}>
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
      {/* Top bar — frosted sticky nav */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-[44px] shrink-0"
        style={{
          background: "color-mix(in oklab, var(--fr-black) 78%, transparent)",
          backdropFilter: "blur(14px) saturate(160%)",
          WebkitBackdropFilter: "blur(14px) saturate(160%)",
        }}
      >
        <Link href="/studio" className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-[26px] h-[26px] rounded-[8px] text-[0.6875rem] font-extrabold"
            style={{ background: "var(--fr-gold)", color: "var(--fr-black)" }}
          >
            fr
          </span>
          <span
            className="text-[0.9375rem] font-semibold tracking-[-0.01em]"
            style={{ color: "#ffffff" }}
          >
            Framed
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/films"
            className="text-[0.8125rem] font-medium"
            style={{ color: "var(--fr-muted)" }}
          >
            Films
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
