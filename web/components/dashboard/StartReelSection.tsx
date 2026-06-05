"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioCard } from "./AudioCard";

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
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAudio !== null) return;
    fetch("/api/reels/audio")
      .then((r) => r.json())
      .then((data) => setAudio(Array.isArray(data) ? data : []))
      .catch(() => setAudio([]))
      .finally(() => setLoading(false));
  }, [initialAudio]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Start a new reel
        </h2>
        <Button asChild size="sm">
          <Link href="/reels">
            <Plus className="w-3.5 h-3.5" />
            New reel
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 w-48 h-28 rounded-xl" />
          ))}
        </div>
      ) : !audio || audio.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No audio files yet.{" "}
          <Link href="/reels" className="text-primary hover:underline underline-offset-4">
            Upload one to get started.
          </Link>
        </div>
      ) : (
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {audio.map((a) => (
            <AudioCard key={a.id} id={a.id} filename={a.filename} duration={a.duration} />
          ))}
        </div>
      )}
    </section>
  );
}
