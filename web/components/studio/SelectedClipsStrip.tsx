"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Scissors } from "lucide-react";
import { useStudio } from "./StudioContext";

function TrimPopover({
  clipId,
  clipDuration,
  trimStart,
  trimEnd,
  onClose,
}: {
  clipId: number;
  clipDuration: number;
  trimStart: number;
  trimEnd: number;
  onClose: () => void;
}) {
  const { trimClip } = useStudio();
  const [start, setStart] = useState(trimStart);
  const [end, setEnd] = useState(trimEnd);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function commit() {
    const s = Math.max(0, Math.min(start, clipDuration - 1));
    const e = Math.max(s + 1, Math.min(end, clipDuration));
    trimClip(clipId, s, e);
    onClose();
  }

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--fr-surface-2)",
        border: "1px solid var(--fr-line-2)",
        borderRadius: 8,
        padding: "10px 12px",
        zIndex: 50,
        width: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.5rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--fr-gold)",
        marginBottom: 8,
      }}>
        trim clip · max {clipDuration}s
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <label style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "0.5rem", color: "var(--fr-muted)", marginBottom: 3, fontFamily: "var(--font-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            start
          </span>
          <input
            type="number"
            min={0}
            max={clipDuration - 1}
            step={0.5}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            style={{
              width: "100%",
              background: "var(--fr-surface)",
              border: "1px solid var(--fr-line)",
              color: "var(--fr-ivory)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.75rem",
              padding: "4px 6px",
              outline: "none",
              borderRadius: 4,
            }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "0.5rem", color: "var(--fr-muted)", marginBottom: 3, fontFamily: "var(--font-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            end
          </span>
          <input
            type="number"
            min={1}
            max={clipDuration}
            step={0.5}
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            style={{
              width: "100%",
              background: "var(--fr-surface)",
              border: "1px solid var(--fr-line)",
              color: "var(--fr-ivory)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.75rem",
              padding: "4px 6px",
              outline: "none",
              borderRadius: 4,
            }}
          />
        </label>
      </div>
      <button
        onClick={commit}
        style={{
          width: "100%",
          background: "var(--fr-gold)",
          color: "var(--fr-black)",
          border: "none",
          borderRadius: 4,
          padding: "5px 0",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.5625rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        apply · {Math.max(0, end - start)}s
      </button>
    </div>
  );
}

export default function SelectedClipsStrip() {
  const { selectedClips, duration, removeClip } = useStudio();
  const targetClips = Math.max(1, Math.round(duration / 4));
  const [openTrimId, setOpenTrimId] = useState<number | null>(null);

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
            background: "rgba(82,214,196,0.02)",
          }}>
            <p style={{
              fontSize: "0.5625rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fr-gold)",
              fontFamily: "var(--font-mono), monospace",
              marginBottom: 8,
            }}>
              your cut · {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""}
              {selectedClips.length < targetClips ? ` · ~${targetClips} clips for ${duration}s` : ""}
            </p>

            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              <AnimatePresence mode="popLayout">
                {selectedClips.map((clip, i) => {
                  const clipDur = clip.duration ?? 10;
                  const isTrimmed = clip.trimStart !== undefined || clip.trimEnd !== undefined;
                  const effectiveDur = isTrimmed
                    ? (clip.trimEnd ?? clipDur) - (clip.trimStart ?? 0)
                    : clipDur;

                  return (
                    <motion.div
                      key={clip.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="group relative shrink-0"
                      style={{ width: 44, position: "relative" }}
                    >
                      {/* Clip thumbnail */}
                      <div
                        onClick={() => setOpenTrimId(openTrimId === clip.id ? null : clip.id)}
                        style={{
                          width: 44,
                          aspectRatio: "9 / 16",
                          border: `1px solid ${isTrimmed ? "var(--fr-gold)" : "rgba(82,214,196,0.4)"}`,
                          overflow: "hidden",
                          background: "var(--fr-surface)",
                          cursor: "pointer",
                          position: "relative",
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
                        <span style={{
                          position: "absolute",
                          top: 2,
                          left: 3,
                          fontFamily: "monospace",
                          fontSize: "0.5rem",
                          color: "var(--fr-gold)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {/* Duration badge */}
                        <span style={{
                          position: "absolute",
                          bottom: 2,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          fontFamily: "monospace",
                          fontSize: "0.4375rem",
                          color: isTrimmed ? "var(--fr-gold)" : "rgba(255,255,255,0.5)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                        }}>
                          {effectiveDur.toFixed(1)}s
                        </span>
                        {isTrimmed && (
                          <Scissors
                            size={8}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              color: "var(--fr-gold)",
                              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.8))",
                            }}
                          />
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeClip(clip.id)}
                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{
                          top: -6,
                          right: -6,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "var(--fr-surface-2)",
                          border: "1px solid var(--fr-line)",
                          color: "var(--fr-muted)",
                          cursor: "pointer",
                          zIndex: 10,
                        }}
                        aria-label="Remove clip"
                      >
                        <X size={8} />
                      </button>

                      {/* Trim popover */}
                      {openTrimId === clip.id && (
                        <TrimPopover
                          clipId={clip.id}
                          clipDuration={clipDur}
                          trimStart={clip.trimStart ?? 0}
                          trimEnd={clip.trimEnd ?? clipDur}
                          onClose={() => setOpenTrimId(null)}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Capacity bar */}
            {(() => {
              const totalSecs = selectedClips.reduce((sum, c) => {
                const dur = c.duration ?? 4;
                return sum + ((c.trimEnd ?? dur) - (c.trimStart ?? 0));
              }, 0);
              const pct = Math.min(100, (totalSecs / duration) * 100);
              const over = totalSecs > duration;
              return (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 2, background: "var(--fr-line)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: over ? "#f97316" : "var(--fr-gold)",
                      transition: "width 300ms ease, background 200ms ease",
                      borderRadius: 1,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.5rem",
                    color: over ? "#f97316" : "var(--fr-muted)",
                    whiteSpace: "nowrap",
                    transition: "color 200ms ease",
                  }}>
                    {totalSecs.toFixed(1)}s / {duration}s
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
