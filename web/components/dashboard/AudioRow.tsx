"use client";

import Link from "next/link";
import { Music2 } from "lucide-react";

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cleanName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}

export function AudioRow({ id, filename, duration }: AudioFile) {
  return (
    <Link
      href={`/reels?audio=${id}`}
      className="group flex items-center gap-3 px-4 h-10 border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.025)] transition-colors"
    >
      <Music2 className="shrink-0 w-3.5 h-3.5 text-[rgba(245,240,232,0.25)]" />

      <span className="flex-1 truncate text-[13px] text-[rgba(245,240,232,0.80)] leading-none capitalize">
        {cleanName(filename)}
      </span>

      <span className="tabular-nums text-[12px] text-[rgba(245,240,232,0.35)] leading-none">
        {formatDuration(duration)}
      </span>

      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-[var(--fr-gold)] uppercase tracking-wide leading-none">
        Use →
      </span>
    </Link>
  );
}
