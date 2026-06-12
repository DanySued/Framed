"use client";

import { useCallback, useRef, useState } from "react";
import { useStudio } from "./StudioContext";

export default function ControlBar() {
  const {
    audioFileId,
    keywords,
    duration,
    setDuration,
    subtitlesEnabled,
    setSubtitlesEnabled,
    bulkCount,
    setBulkCount,
    onGenerate,
  } = useStudio();

  const canGenerate = Boolean(audioFileId) && keywords.length >= 1;

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
        borderTop: "1px solid var(--fr-line)",
        background: "var(--fr-black)",
        padding: "0 16px",
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* Duration slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
        <label
          className="fr-overline"
          style={{ fontSize: "0.6375rem", whiteSpace: "nowrap" }}
          htmlFor="duration-slider"
        >
          Duration
        </label>
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
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--fr-line)",
          flexShrink: 0,
        }}
      />

      {/* Bulk count stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Generate button */}
      <button
        ref={btnRef}
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
    </footer>
  );
}
