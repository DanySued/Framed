"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AudioRow } from "./AudioRow";

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

interface StartReelSectionProps {
  initialAudio: AudioFile[] | null;
}

export function StartReelSection({ initialAudio }: StartReelSectionProps) {
  const [audio, setAudio] = useState<AudioFile[] | null>(initialAudio);
  const [loading, setLoading] = useState(initialAudio === null);

  useEffect(() => {
    if (initialAudio !== null) return;
    fetch("/api/reels/audio")
      .then((r) => r.json())
      .then((data) => setAudio(Array.isArray(data) ? data : []))
      .catch(() => setAudio([]))
      .finally(() => setLoading(false));
  }, [initialAudio]);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(245,240,232,0.35)]">
            Audio library
          </span>
          {audio && audio.length > 0 && (
            <span className="text-[11px] tabular-nums text-[rgba(245,240,232,0.25)]">
              {audio.length}
            </span>
          )}
        </div>
        <Link
          href="/reels"
          className="flex items-center gap-1 text-[12px] text-[rgba(245,240,232,0.45)] hover:text-[rgba(245,240,232,0.75)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Upload audio
        </Link>
      </div>

      {loading ? (
        <>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 h-10 border-b border-[rgba(255,255,255,0.05)]"
            >
              <div className="w-3.5 h-3.5 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
              <div className="flex-1 h-3 rounded bg-[rgba(255,255,255,0.06)] animate-pulse max-w-48" />
              <div className="w-8 h-3 rounded bg-[rgba(255,255,255,0.04)] animate-pulse" />
            </div>
          ))}
        </>
      ) : !audio || audio.length === 0 ? (
        <div className="flex items-center px-4 h-10 text-[13px] text-[rgba(245,240,232,0.3)]">
          No audio files yet.{" "}
          <Link href="/reels" className="ml-1 text-[var(--fr-gold)] hover:underline underline-offset-4">
            Upload one to get started →
          </Link>
        </div>
      ) : (
        <div>
          {audio.map((a) => (
            <AudioRow key={a.id} id={a.id} filename={a.filename} duration={a.duration} />
          ))}
        </div>
      )}
    </section>
  );
}
