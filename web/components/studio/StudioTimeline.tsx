"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Scissors, Music2 } from "lucide-react";
import { useStudio } from "./StudioContext";

const PX_PER_SEC = 56;

// ── Trim popover ────────────────────────────────────────────────
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
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  function apply() {
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
        bottom: "calc(100% + 6px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--fr-surface-2)",
        border: "1px solid var(--fr-line-2)",
        borderRadius: 8,
        padding: "10px 12px",
        zIndex: 60,
        width: 186,
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
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
        trim · max {clipDuration}s
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(["start", "end"] as const).map((key) => (
          <label key={key} style={{ flex: 1 }}>
            <span style={{
              display: "block",
              fontSize: "0.5rem",
              color: "var(--fr-muted)",
              marginBottom: 3,
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {key}
            </span>
            <input
              type="number"
              min={key === "start" ? 0 : 1}
              max={key === "start" ? clipDuration - 1 : clipDuration}
              step={0.5}
              value={key === "start" ? start : end}
              onChange={(e) => key === "start" ? setStart(Number(e.target.value)) : setEnd(Number(e.target.value))}
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
        ))}
      </div>
      <button
        onClick={apply}
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
        apply · {Math.max(0, end - start).toFixed(1)}s
      </button>
    </div>
  );
}

// ── Main timeline ────────────────────────────────────────────────
export default function StudioTimeline() {
  const {
    selectedClips,
    duration,
    audioFileId,
    audioName,
    songStartTime,
    setSongStartTime,
    removeClip,
    reorderClips,
    setPreviewOverride,
  } = useStudio();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [openTrimId, setOpenTrimId] = useState<number | null>(null);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  // Per-clip effective duration
  function effectiveDur(clip: (typeof selectedClips)[number]) {
    const raw = clip.duration ?? 5;
    return (clip.trimEnd ?? raw) - (clip.trimStart ?? 0);
  }

  // Cumulative left positions
  const blocks = selectedClips.map((clip, i) => {
    const left = selectedClips.slice(0, i).reduce((s, c) => s + effectiveDur(c), 0) * PX_PER_SEC;
    const width = effectiveDur(clip) * PX_PER_SEC;
    return { clip, i, left, width };
  });

  const totalSecs = selectedClips.reduce((s, c) => s + effectiveDur(c), 0);
  const timelineW = Math.max(totalSecs * PX_PER_SEC + 80, duration * PX_PER_SEC + 80, 500);

  // Ruler ticks
  const tickStep = timelineW > 2000 ? 10 : 5;
  const ticks = Array.from(
    { length: Math.ceil((timelineW / PX_PER_SEC) / tickStep) + 1 },
    (_, i) => i * tickStep
  );

  // Click ruler → move playhead + sync preview
  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollX = scrollRef.current?.scrollLeft ?? 0;
    const x = e.clientX - rect.left + scrollX;
    const t = Math.max(0, x / PX_PER_SEC);
    setPlayheadSec(t);

    let elapsed = 0;
    for (const { clip } of blocks) {
      const d = effectiveDur(clip);
      if (t >= elapsed && t < elapsed + d) {
        setPreviewOverride(clip.url);
        return;
      }
      elapsed += d;
    }
  }

  // Audio drag via pointer capture
  const audioDrag = useRef<{ startX: number; startTime: number } | null>(null);

  function onAudioDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    audioDrag.current = { startX: e.clientX, startTime: songStartTime };
  }
  function onAudioMove(e: React.PointerEvent) {
    if (!audioDrag.current) return;
    const dt = (e.clientX - audioDrag.current.startX) / PX_PER_SEC;
    setSongStartTime(Math.max(0, audioDrag.current.startTime + dt));
  }
  function onAudioUp() { audioDrag.current = null; }

  // Drag-to-reorder
  function onDragStart(e: React.DragEvent, i: number) {
    e.dataTransfer.effectAllowed = "move";
    setDraggingFrom(i);
  }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDropTarget(i);
  }
  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (draggingFrom !== null && draggingFrom !== i) reorderClips(draggingFrom, i);
    setDraggingFrom(null);
    setDropTarget(null);
  }
  function onDragEnd() {
    setDraggingFrom(null);
    setDropTarget(null);
  }

  return (
    <AnimatePresence>
      {selectedClips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22 }}
          style={{ overflow: "hidden", borderTop: "1px solid var(--fr-line)" }}
        >
          <div style={{ padding: "16px 24px 20px", background: "rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.5rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--fr-gold)",
              }}>
                timeline · {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""} · {totalSecs.toFixed(1)}s
              </span>
              <span style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.5rem",
                color: "var(--fr-muted)",
              }}>
                — click to preview · drag to reorder
              </span>
            </div>

            {/* Scrollable canvas */}
            <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "visible", paddingBottom: 4 }}>
              <div style={{ position: "relative", width: timelineW, minWidth: "100%" }}>

                {/* Playhead */}
                <div
                  style={{
                    position: "absolute",
                    left: playheadSec * PX_PER_SEC,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "var(--fr-gold)",
                    zIndex: 30,
                    pointerEvents: "none",
                    boxShadow: "0 0 6px var(--fr-gold)",
                  }}
                />

                {/* Ruler */}
                <div
                  onClick={handleRulerClick}
                  style={{
                    height: 22,
                    position: "relative",
                    cursor: "crosshair",
                    marginBottom: 4,
                    userSelect: "none",
                  }}
                >
                  {ticks.map((t) => (
                    <div
                      key={t}
                      style={{
                        position: "absolute",
                        left: t * PX_PER_SEC,
                        top: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      <span style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: "0.4375rem",
                        color: "var(--fr-muted)",
                        lineHeight: 1,
                        transform: "translateX(-50%)",
                      }}>
                        {t}s
                      </span>
                      <div style={{ width: 1, height: 6, background: "var(--fr-line)" }} />
                    </div>
                  ))}
                </div>

                {/* Clips track */}
                <div
                  style={{
                    position: "relative",
                    height: 72,
                    background: "var(--fr-surface)",
                    border: "1px solid var(--fr-line)",
                    borderRadius: 4,
                    marginBottom: audioFileId ? 6 : 0,
                    overflow: "visible",
                  }}
                >
                  {blocks.map(({ clip, i, left, width }) => {
                    const clipDur = clip.duration ?? 5;
                    const isTrimmed = clip.trimStart !== undefined || clip.trimEnd !== undefined;
                    const isDragTarget = dropTarget === i && draggingFrom !== i;

                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDrop={(e) => onDrop(e, i)}
                        onDragEnd={onDragEnd}
                        onClick={() => setPreviewOverride(clip.url)}
                        className="group"
                        style={{
                          position: "absolute",
                          left,
                          top: 0,
                          width: width - 2,
                          height: "100%",
                          border: isDragTarget
                            ? "2px solid var(--fr-gold)"
                            : isTrimmed
                            ? "1px solid rgba(82,214,196,0.6)"
                            : "1px solid var(--fr-line-2)",
                          borderRadius: 3,
                          overflow: "visible",
                          cursor: "grab",
                          background: "var(--fr-surface-2)",
                          transition: "border-color 120ms ease, opacity 120ms ease",
                          opacity: draggingFrom === i ? 0.4 : 1,
                          zIndex: openTrimId === clip.id ? 40 : 1,
                        }}
                      >
                        {/* Thumbnail fill */}
                        {clip.image && (
                          <img
                            src={clip.image}
                            alt=""
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              opacity: 0.35,
                              borderRadius: 3,
                              pointerEvents: "none",
                            }}
                          />
                        )}

                        {/* Clip index */}
                        <span style={{
                          position: "absolute",
                          top: 4,
                          left: 5,
                          fontFamily: "monospace",
                          fontSize: "0.4375rem",
                          color: "var(--fr-gold)",
                          letterSpacing: "0.04em",
                          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                          pointerEvents: "none",
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {/* Duration */}
                        <span style={{
                          position: "absolute",
                          bottom: 4,
                          left: 5,
                          fontFamily: "monospace",
                          fontSize: "0.4375rem",
                          color: isTrimmed ? "var(--fr-gold)" : "rgba(255,255,255,0.4)",
                          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                          pointerEvents: "none",
                        }}>
                          {effectiveDur(clip).toFixed(1)}s
                          {isTrimmed && ` (${clip.trimStart ?? 0}→${clip.trimEnd ?? clipDur})`}
                        </span>

                        {/* Scissors button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTrimId(openTrimId === clip.id ? null : clip.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 20,
                            width: 16,
                            height: 16,
                            border: "1px solid var(--fr-line)",
                            borderRadius: 3,
                            background: "var(--fr-surface-2)",
                            color: "var(--fr-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          aria-label="Trim clip"
                        >
                          <Scissors size={9} />
                        </button>

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClip(clip.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            width: 16,
                            height: 16,
                            border: "1px solid var(--fr-line)",
                            borderRadius: 3,
                            background: "var(--fr-surface-2)",
                            color: "var(--fr-muted)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          aria-label="Remove clip"
                        >
                          <X size={9} />
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
                      </div>
                    );
                  })}
                </div>

                {/* Audio track */}
                {audioFileId && (
                  <div
                    style={{
                      position: "relative",
                      height: 26,
                      background: "var(--fr-surface)",
                      border: "1px solid var(--fr-line)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      onPointerDown={onAudioDown}
                      onPointerMove={onAudioMove}
                      onPointerUp={onAudioUp}
                      style={{
                        position: "absolute",
                        left: Math.max(0, songStartTime * PX_PER_SEC),
                        top: 2,
                        bottom: 2,
                        right: 2,
                        background: "rgba(82,214,196,0.12)",
                        border: "1px solid rgba(82,214,196,0.35)",
                        borderRadius: 3,
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        paddingLeft: 7,
                        userSelect: "none",
                        minWidth: 60,
                      }}
                    >
                      <Music2 size={9} style={{ color: "var(--fr-gold)", flexShrink: 0 }} />
                      <span style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: "0.4375rem",
                        color: "var(--fr-gold)",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {audioName ?? "audio"} · drag to offset
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
