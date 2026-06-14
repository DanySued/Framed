"use client";

import { useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useStudio } from "./StudioContext";

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

export default function TransportBar() {
  const { selectedClips, isPlaying, currentTime, totalDuration, activeClipIndex, togglePlay, seek } = useStudio();

  // Clip start offsets
  const clipStarts = useMemo(() => {
    const starts: number[] = [];
    let elapsed = 0;
    for (const clip of selectedClips) {
      starts.push(elapsed);
      const raw = clip.duration ?? 5;
      elapsed += (clip.trimEnd ?? raw) - (clip.trimStart ?? 0);
    }
    return starts;
  }, [selectedClips]);

  function prevClip() {
    const idx = Math.max(0, activeClipIndex - 1);
    seek(clipStarts[idx] ?? 0);
  }

  function nextClip() {
    const idx = Math.min(selectedClips.length - 1, activeClipIndex + 1);
    seek(clipStarts[idx] ?? 0);
  }

  if (selectedClips.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 24px",
      background: "rgba(0,0,0,0.35)",
      borderTop: "1px solid var(--fr-line)",
      borderBottom: "1px solid var(--fr-line)",
    }}>
      {/* Prev clip */}
      <button
        onClick={prevClip}
        disabled={activeClipIndex === 0}
        aria-label="Previous clip"
        style={{
          width: 30, height: 30, borderRadius: 6,
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid var(--fr-line-2)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(0,0,0,0.35)",
          color: activeClipIndex === 0 ? "var(--fr-line)" : "var(--fr-muted)",
          cursor: activeClipIndex === 0 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color 120ms ease, border-color 120ms ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (activeClipIndex > 0) { e.currentTarget.style.borderColor = "rgba(82,214,196,0.4)"; e.currentTarget.style.color = "var(--fr-gold)"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--fr-line-2)"; e.currentTarget.style.color = activeClipIndex === 0 ? "var(--fr-line)" : "var(--fr-muted)"; }}
      >
        <SkipBack size={13} strokeWidth={2} />
      </button>

      {/* Play / Pause — primary button */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        style={{
          width: 42, height: 42, borderRadius: "50%",
          background: isPlaying
            ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)"
            : "linear-gradient(180deg, #5fe0cf 0%, #43c5b3 100%)",
          border: isPlaying ? "1px solid rgba(82,214,196,0.5)" : "1px solid rgba(255,255,255,0.2)",
          boxShadow: isPlaying
            ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 0 rgba(0,0,0,0.4)"
            : "inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(0,0,0,0.45), 0 0 0 0px rgba(82,214,196,0)",
          color: isPlaying ? "var(--fr-gold)" : "#04110e",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background 160ms ease, box-shadow 160ms ease, color 160ms ease",
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.45), 0 0 0 4px rgba(82,214,196,0.18)";
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(0,0,0,0.45), 0 0 0 0px rgba(82,214,196,0)";
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(1px) scale(0.96)"; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
      >
        {isPlaying
          ? <Pause size={16} strokeWidth={2.5} />
          : <Play size={16} strokeWidth={2.5} style={{ marginLeft: 2 }} />
        }
      </button>

      {/* Next clip */}
      <button
        onClick={nextClip}
        disabled={activeClipIndex >= selectedClips.length - 1}
        aria-label="Next clip"
        style={{
          width: 30, height: 30, borderRadius: 6,
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid var(--fr-line-2)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(0,0,0,0.35)",
          color: activeClipIndex >= selectedClips.length - 1 ? "var(--fr-line)" : "var(--fr-muted)",
          cursor: activeClipIndex >= selectedClips.length - 1 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color 120ms ease, border-color 120ms ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (activeClipIndex < selectedClips.length - 1) { e.currentTarget.style.borderColor = "rgba(82,214,196,0.4)"; e.currentTarget.style.color = "var(--fr-gold)"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--fr-line-2)"; e.currentTarget.style.color = activeClipIndex >= selectedClips.length - 1 ? "var(--fr-line)" : "var(--fr-muted)"; }}
      >
        <SkipForward size={13} strokeWidth={2} />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "var(--fr-line)", flexShrink: 0, marginLeft: 2 }} />

      {/* Time */}
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-ivory)", letterSpacing: "0.02em", flexShrink: 0 }}>
        {fmt(currentTime)}
      </span>
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-muted)", flexShrink: 0 }}>
        / {fmt(totalDuration)}
      </span>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "var(--fr-line)", flexShrink: 0 }} />

      {/* Clip indicator */}
      <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: "0.75rem", color: "var(--fr-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
        clip{" "}
        <span style={{ color: "var(--fr-ivory)" }}>{activeClipIndex + 1}</span>
        {" "}of {selectedClips.length}
      </span>
    </div>
  );
}
