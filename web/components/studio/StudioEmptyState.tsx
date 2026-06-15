"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useStudio, PickedClip } from "./StudioContext";
import { STUDIO_TEMPLATES, StudioTemplate } from "@/lib/studio-templates";

interface SearchResult {
  id: number;
  url: string;
  image: string | null;
  duration: number | null;
  width?: number;
  height?: number;
}

function isPortrait(r: SearchResult) {
  if (!r.width || !r.height) return true;
  return r.width / r.height < 0.85;
}

export default function StudioEmptyState() {
  const { toggleClip, addKeyword, setVibePreset, setDuration } = useStudio();
  const [loading, setLoading] = useState<string | null>(null);

  const loadTemplate = useCallback(async (tpl: StudioTemplate) => {
    setLoading(tpl.id);
    try {
      // Fetch portrait clips for each keyword, take top portrait results
      const allClips: PickedClip[] = [];

      for (const kw of tpl.keywords) {
        if (allClips.length >= 4) break;
        try {
          const res = await fetch(
            `/api/reels/pexels/search?keywords=${encodeURIComponent(kw)}&per_page=15`
          );
          if (!res.ok) continue;
          const data: { videos: SearchResult[] } = await res.json();
          const portraits = (data.videos ?? []).filter(isPortrait);
          for (const v of portraits) {
            if (allClips.length >= 4) break;
            if (allClips.some((c) => c.id === v.id)) continue;
            allClips.push({ id: v.id, url: v.url, image: v.image, duration: v.duration, keyword: kw });
          }
        } catch {
          // skip this keyword on error
        }
      }

      // Add keywords to context
      for (const kw of tpl.keywords) addKeyword(kw);

      // Add clips (toggleClip is already wrapped with pushHistory)
      for (const clip of allClips) toggleClip(clip);

      // Apply vibe + duration
      setVibePreset(tpl.vibe);
      setDuration(tpl.duration);
    } finally {
      setLoading(null);
    }
  }, [toggleClip, addKeyword, setVibePreset, setDuration]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px 64px",
      gap: 40,
    }}>
      {/* Heading */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontStyle: "italic",
          fontSize: "1.125rem",
          color: "var(--fr-ivory)",
          margin: "0 0 8px",
        }}>
          start from a vibe
        </p>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.5rem",
          color: "var(--fr-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: 0,
        }}>
          pick a template — or search your own scenes above
        </p>
      </div>

      {/* Template grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        width: "100%",
        maxWidth: 640,
      }}>
        {STUDIO_TEMPLATES.map((tpl, i) => {
          const isLoading = loading === tpl.id;
          const anyLoading = loading !== null;
          return (
            <motion.button
              key={tpl.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.06, ease: "easeOut" }}
              onClick={() => !anyLoading && loadTemplate(tpl)}
              disabled={anyLoading}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "20px 16px",
                background: isLoading ? "rgba(82,214,196,0.08)" : "var(--fr-surface)",
                border: `1px solid ${isLoading ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
                borderRadius: 8,
                cursor: anyLoading ? "default" : "pointer",
                opacity: anyLoading && !isLoading ? 0.4 : 1,
                transition: "border-color 150ms ease, background 150ms ease, opacity 150ms ease",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                if (anyLoading) return;
                e.currentTarget.style.borderColor = "rgba(82,214,196,0.4)";
                e.currentTarget.style.background = "rgba(82,214,196,0.05)";
              }}
              onMouseLeave={(e) => {
                if (isLoading) return;
                e.currentTarget.style.borderColor = "var(--fr-line-2)";
                e.currentTarget.style.background = "var(--fr-surface)";
              }}
            >
              {/* Emoji / spinner */}
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>
                {isLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block" }}
                  >
                    ○
                  </motion.span>
                ) : tpl.emoji}
              </span>

              {/* Name */}
              <span style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "0.875rem",
                fontStyle: "italic",
                color: isLoading ? "var(--fr-gold)" : "var(--fr-ivory)",
                transition: "color 150ms ease",
              }}>
                {isLoading ? "loading…" : tpl.name}
              </span>

              {/* Tagline */}
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.4375rem",
                color: "var(--fr-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                lineHeight: 1.4,
              }}>
                {tpl.tagline}
              </span>

              {/* Keywords preview */}
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.4rem",
                color: "var(--fr-line)",
                letterSpacing: "0.04em",
                lineHeight: 1.4,
              }}>
                {tpl.keywords[0]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
