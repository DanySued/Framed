"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudio } from "./StudioContext";

export default function ControlBar() {
  const {
    audioFileId,
    keywords,
    selectedClips,
    duration,
    setDuration,
    subtitlesEnabled,
    setSubtitlesEnabled,
    transitionsEnabled,
    setTransitionsEnabled,
    bulkCount,
    setBulkCount,
    onGenerate,
  } = useStudio();

  const hasScenes = selectedClips.length >= 1 || keywords.length >= 1;
  const canGenerate = Boolean(audioFileId) && hasScenes;
  const missingHint = !hasScenes
    ? "choose your clips first"
    : !audioFileId
      ? "now pick a track"
      : selectedClips.length > 0
        ? `${selectedClips.length} clip${selectedClips.length > 1 ? "s" : ""} · your cut`
        : "framed will pick clips for you";

  const [glowing, setGlowing] = useState(false);
  const prevCanGenerate = useRef(false);

  useEffect(() => {
    if (canGenerate && !prevCanGenerate.current) {
      setGlowing(true);
      const t = setTimeout(() => setGlowing(false), 1200);
      return () => clearTimeout(t);
    }
    prevCanGenerate.current = canGenerate;
  }, [canGenerate]);

  // Magnetic button effect
  const btnRef = useRef<HTMLButtonElement>(null);
  const [magnetic, setMagnetic] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (prefersReducedMotion || !canGenerate) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setMagnetic({ x: dx * 4, y: dy * 4 });
    },
    [canGenerate, prefersReducedMotion]
  );

  const formatDuration = (s: number) => `${s}s`;

  return (
    <footer
      style={{
        background: "var(--fr-black)",
        borderTop: "1px solid var(--fr-line)",
        padding: "0 20px",
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div className="flex items-center gap-4 flex-1">
      {/* Duration slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
        <label
          className="fr-overline"
          style={{ fontSize: "0.6375rem", whiteSpace: "nowrap" }}
          htmlFor="duration-slider"
        >
          Duration
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ position: "relative", width: 120 }}>
            <input
              id="duration-slider"
              type="range"
              min={15}
              max={60}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--fr-gold)",
                cursor: "pointer",
              }}
            />
          </div>
          {/* Tick marks under slider */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 2,
            width: 120,
            paddingLeft: 1,
            paddingRight: 1,
          }}>
            {[15, 30, 45, 60].map(v => (
              <span key={v} style={{
                fontFamily: "monospace",
                fontSize: "0.4375rem",
                color: duration === v ? "var(--fr-gold)" : "rgba(255,255,255,0.2)",
                letterSpacing: 0,
                transition: "color 150ms ease",
              }}>
                {v}
              </span>
            ))}
          </div>
        </div>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.8125rem",
            color: "var(--fr-ivory)",
            minWidth: 28,
          }}
        >
          {formatDuration(duration)}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--fr-line)",
          flexShrink: 0,
        }}
      />

      {/* Subtitles toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          role="switch"
          aria-checked={subtitlesEnabled}
          aria-label="Subtitles"
          onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            background: subtitlesEnabled ? "var(--fr-gold)" : "var(--fr-line)",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 200ms ease",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: subtitlesEnabled ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: subtitlesEnabled ? "#04110e" : "var(--fr-muted)",
              transition: "left 200ms ease",
            }}
          />
        </button>
        <label
          className="fr-overline"
          style={{ fontSize: "0.6375rem", cursor: "pointer" }}
          onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
        >
          Subtitles
        </label>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "var(--fr-line)", flexShrink: 0 }} />

      {/* Transitions toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          role="switch"
          aria-checked={transitionsEnabled}
          aria-label="Transitions"
          onClick={() => setTransitionsEnabled(!transitionsEnabled)}
          style={{
            width: 32, height: 18, borderRadius: 9,
            background: transitionsEnabled ? "var(--fr-gold)" : "var(--fr-line)",
            border: "none", cursor: "pointer", position: "relative",
            transition: "background 200ms ease", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 2,
            left: transitionsEnabled ? 16 : 2,
            width: 14, height: 14, borderRadius: "50%",
            background: transitionsEnabled ? "#04110e" : "var(--fr-muted)",
            transition: "left 200ms ease",
          }} />
        </button>
        <label
          className="fr-overline"
          style={{ fontSize: "0.6375rem", cursor: "pointer" }}
          onClick={() => setTransitionsEnabled(!transitionsEnabled)}
        >
          Transitions
        </label>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "var(--fr-line)", flexShrink: 0 }} />

      {/* Bulk count stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} title="Number of unique films to generate">
        <span className="fr-overline" style={{ fontSize: "0.6375rem" }}>
          Films
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setBulkCount(Math.max(1, bulkCount - 1))}
            disabled={bulkCount <= 1}
            style={{
              width: 22,
              height: 22,
              border: "1px solid var(--fr-line)",
              background: "transparent",
              color: bulkCount <= 1 ? "var(--fr-line)" : "var(--fr-muted)",
              cursor: bulkCount <= 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              transition: "color 150ms ease",
            }}
            aria-label="Decrease film count"
          >
            −
          </button>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.875rem",
              color: "var(--fr-ivory)",
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {bulkCount}
          </span>
          <button
            onClick={() => setBulkCount(Math.min(5, bulkCount + 1))}
            disabled={bulkCount >= 5}
            style={{
              width: 22,
              height: 22,
              border: "1px solid var(--fr-line)",
              background: "transparent",
              color: bulkCount >= 5 ? "var(--fr-line)" : "var(--fr-muted)",
              cursor: bulkCount >= 5 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              transition: "color 150ms ease",
            }}
            aria-label="Increase film count"
          >
            +
          </button>
        </div>
      </div>

      </div>

      {/* Spacer (desktop only) */}
      <div className="hidden sm:flex flex-1" />

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
      {/* Readiness hint */}
      <span
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontStyle: "italic",
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          color: canGenerate ? "var(--fr-gold)" : "var(--fr-muted)",
          whiteSpace: "nowrap",
          transition: "color 200ms ease",
        }}
      >
        {missingHint}
      </span>

      {/* Generate button */}
      <button
        ref={btnRef}
        className="fr-shine"
        onClick={canGenerate ? onGenerate : undefined}
        disabled={!canGenerate}
        onMouseMove={handleMouseMove}
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.9375rem",
          letterSpacing: "0.02em",
          color: canGenerate ? "var(--fr-gold)" : "var(--fr-muted)",
          background: "transparent",
          border: `1px solid ${canGenerate ? "var(--fr-gold)" : "var(--fr-line)"}`,
          padding: "0 28px",
          height: 38,
          cursor: canGenerate ? "pointer" : "not-allowed",
          opacity: canGenerate ? 1 : 0.4,
          transition: "color 200ms ease, border-color 200ms ease, background 200ms ease, transform 150ms ease, opacity 200ms ease",
          transform: canGenerate
            ? `translate(${magnetic.x}px, ${magnetic.y}px)`
            : "none",
          whiteSpace: "nowrap",
          position: "relative",
          overflow: "hidden",
          animation: glowing ? "fr-glow-pulse 0.6s ease-out 2" : "none",
        }}
        onMouseEnter={(e) => {
          if (!canGenerate) return;
          const el = e.currentTarget;
          el.style.background = "var(--fr-gold)";
          el.style.color = "#04110e";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "transparent";
          el.style.color = canGenerate ? "var(--fr-gold)" : "var(--fr-muted)";
          setMagnetic({ x: 0, y: 0 });
        }}
        aria-label="Generate film"
      >
        Generate film
      </button>
      </div>
    </footer>
  );
}
