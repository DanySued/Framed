"use client";

import { Download } from "lucide-react";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";
import { formatDuration, relativeTime } from "@/lib/utils";

const STATUS: Record<DashboardRender["status"], { dot: string; label: string }> = {
  done:      { dot: "bg-[var(--fr-green)]",               label: "Done" },
  rendering: { dot: "bg-[var(--fr-gold)] animate-pulse",  label: "Rendering" },
  failed:    { dot: "bg-[var(--fr-red)]",                 label: "Failed" },
  draft:     { dot: "bg-[rgba(255,255,255,0.25)]",        label: "Draft" },
};

export function RenderRow({ render }: { render: DashboardRender }) {
  return (
    <div
      className="group flex items-center gap-3 px-4 h-10 border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.025)] transition-colors cursor-default"
    >
      {/* Status dot */}
      <span className={`shrink-0 w-2 h-2 rounded-full ${STATUS[render.status].dot}`} />

      {/* Title */}
      <span className="flex-1 truncate text-[13px] text-[rgba(245,240,232,0.85)] leading-none">
        {render.title}
      </span>

      {/* Meta: duration */}
      {render.render_duration != null && (
        <span className="hidden sm:block tabular-nums text-[12px] text-[rgba(245,240,232,0.35)] leading-none w-12 text-right">
          {formatDuration(render.render_duration)}
        </span>
      )}

      {/* Status label */}
      <span className="text-[11px] text-[rgba(245,240,232,0.35)] leading-none w-16 text-right uppercase tracking-wide">
        {STATUS_LABEL[render.status]}
      </span>

      {/* Timestamp */}
      <span className="tabular-nums text-[12px] text-[rgba(245,240,232,0.3)] leading-none w-16 text-right">
        {relativeTime(render.created_at)}
      </span>

      {/* Download */}
      {render.signed_url ? (
        <a
          href={render.signed_url}
          download
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(255,255,255,0.08)] text-[rgba(245,240,232,0.55)]"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      ) : (
        <span className="shrink-0 w-6" />
      )}
    </div>
  );
}
