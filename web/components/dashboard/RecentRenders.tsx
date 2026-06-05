import Link from "next/link";
import { Plus } from "lucide-react";
import { RenderRow } from "./RenderRow";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";

interface RecentRendersProps {
  renders: DashboardRender[];
}

export function RecentRenders({ renders }: RecentRendersProps) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(245,240,232,0.35)]">
            Reels
          </span>
          {renders.length > 0 && (
            <span className="text-[11px] tabular-nums text-[rgba(245,240,232,0.25)]">
              {renders.length}
            </span>
          )}
        </div>
        <Link
          href="/reels"
          className="flex items-center gap-1 text-[12px] text-[rgba(245,240,232,0.45)] hover:text-[rgba(245,240,232,0.75)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          New reel
        </Link>
      </div>

      {/* Column labels */}
      {renders.length > 0 && (
        <div className="flex items-center gap-3 px-4 h-7 border-b border-[rgba(255,255,255,0.04)]">
          <span className="w-2 shrink-0" />
          <span className="flex-1 text-[11px] text-[rgba(245,240,232,0.22)] uppercase tracking-wide">Title</span>
          <span className="hidden sm:block text-[11px] text-[rgba(245,240,232,0.22)] uppercase tracking-wide w-12 text-right">Len</span>
          <span className="text-[11px] text-[rgba(245,240,232,0.22)] uppercase tracking-wide w-16 text-right">Status</span>
          <span className="text-[11px] text-[rgba(245,240,232,0.22)] uppercase tracking-wide w-16 text-right">When</span>
          <span className="w-6 shrink-0" />
        </div>
      )}

      {renders.length === 0 ? (
        <div className="flex items-center px-4 h-10 text-[13px] text-[rgba(245,240,232,0.3)]">
          No reels yet.{" "}
          <Link href="/reels" className="ml-1 text-[var(--fr-gold)] hover:underline underline-offset-4">
            Create your first reel →
          </Link>
        </div>
      ) : (
        <div>
          {renders.map((r) => (
            <RenderRow key={r.id} render={r} />
          ))}
        </div>
      )}
    </section>
  );
}
