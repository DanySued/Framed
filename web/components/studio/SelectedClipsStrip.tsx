"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useStudio } from "./StudioContext";

export default function SelectedClipsStrip() {
  const { selectedClips, targetClips, duration, removeClip } = useStudio();

  return (
    <AnimatePresence>
      {selectedClips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: "hidden" }}
        >
          <div style={{
            padding: "24px 24px 20px",
            borderLeft: "2px solid var(--fr-gold)",
            marginLeft: 0,
            background: "rgba(82,214,196,0.02)",
          }}>
            <p
              style={{
                fontSize: "0.5625rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--fr-gold)",
                fontFamily: "var(--font-mono), monospace",
                marginBottom: 8,
              }}
            >
              your cut · {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""}
              {selectedClips.length < targetClips ? ` · ~${targetClips} clips for ${duration}s` : ""}
            </p>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              <AnimatePresence mode="popLayout">
                {selectedClips.map((clip, i) => (
                  <motion.div
                    key={clip.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="group relative shrink-0"
                    style={{
                      width: 44,
                      aspectRatio: "9 / 16",
                      border: "1px solid var(--fr-gold)",
                      overflow: "hidden",
                      background: "var(--fr-surface)",
                    }}
                  >
                    {clip.image && (
                      <img
                        src={clip.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ opacity: 0.8 }}
                      />
                    )}
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 3,
                        fontFamily: "monospace",
                        fontSize: "0.5rem",
                        color: "var(--fr-gold)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <button
                      onClick={() => removeClip(clip.id)}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      style={{
                        background: "rgba(6,9,11,0.65)",
                        border: "none",
                        color: "var(--fr-ivory)",
                        cursor: "pointer",
                      }}
                      aria-label="Remove clip"
                    >
                      <X size={11} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* Capacity bar */}
            {(() => {
              const totalSecs = selectedClips.reduce((sum, c) => sum + (c.duration ?? 4), 0);
              const pct = Math.min(100, (totalSecs / duration) * 100);
              const over = totalSecs > duration;
              return (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 2, background: "var(--fr-line)", borderRadius: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: over ? "#f97316" : "var(--fr-gold)",
                        transition: "width 300ms ease, background 200ms ease",
                        borderRadius: 1,
                      }}
                    />
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.5rem",
                    color: over ? "#f97316" : "var(--fr-muted)",
                    whiteSpace: "nowrap",
                    transition: "color 200ms ease",
                  }}>
                    {totalSecs}s / {duration}s
                  </span>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
