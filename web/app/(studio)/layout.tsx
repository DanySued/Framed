import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const authed = await getSession();
  if (!authed) redirect("/");

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--fr-black)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 h-12 shrink-0"
        style={{ borderBottom: "1px solid var(--fr-line)" }}
      >
        <Link
          href="/studio"
          className="text-[0.75rem] tracking-[0.3em] uppercase transition-opacity hover:opacity-70"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            color: "var(--fr-ivory)",
            letterSpacing: "0.3em",
          }}
        >
          Framed
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/studio"
            className="text-[0.75rem] tracking-[0.12em] uppercase transition-colors"
            style={{ color: "var(--fr-muted)" }}
          >
            Films
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
