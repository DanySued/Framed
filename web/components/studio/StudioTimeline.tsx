"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Scissors, Music2, Play, Pause } from "lucide-react";
import { useStudio } from "./StudioContext";

const MIN_PX_PER_SEC = 8;
const MAX_PX_PER_SEC = 120;

// ── Inline trim overlay (renders inside the clip block, no overflow issues) ──
function InlineTrim({ clipId, clipDuration, trimStart, trimEnd, onClose }: {
  clipId: number; clipDuration: number; trimStart: number; trimEnd: number; onClose: () => void;
}) {
  const { trimClip } = useStudio();
  const [start, setStart] = useState(trimStart);
  const [end, setEnd] = useState(trimEnd);

  function apply() {
    const s = Math.max(0, Math.min(start, clipDuration - 1));
    const e = Math.max(s + 1, Math.min(end, clipDuration));
    trimClip(clipId, s, e);
    onClose();
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(4,17,14,0.96)",
        display: "flex", alignItems: "center", gap: 5, padding: "0 8px",
        borderRadius: 3,
      }}
    >
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem", color: "var(--fr-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>start</span>
      <input
        type="number" min={0} max={clipDuration - 1} step={0.5} value={start}
        onChange={(e) => setStart(Number(e.target.value))}
        style={{ width: 36, background: "var(--fr-surface)", border: "1px solid var(--fr-line)", color: "var(--fr-ivory)", fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", padding: "2px 4px", borderRadius: 3, outline: "none" }}
      />
      <span style={{ color: "var(--fr-line)", fontSize: "0.6rem", flexShrink: 0 }}>→</span>
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem", color: "var(--fr-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>end</span>
      <input
        type="number" min={1} max={clipDuration} step={0.5} value={end}
        onChange={(e) => setEnd(Number(e.target.value))}
        style={{ width: 36, background: "var(--fr-surface)", border: "1px solid var(--fr-line)", color: "var(--fr-ivory)", fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", padding: "2px 4px", borderRadius: 3, outline: "none" }}
      />
      <button onClick={apply} style={{ marginLeft: 2, padding: "3px 8px", background: "var(--fr-gold)", color: "var(--fr-black)", border: "none", borderRadius: 3, fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
        ✓ {Math.max(0, end - start).toFixed(1)}s
      </button>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: "transparent", border: "none", color: "var(--fr-muted)", cursor: "pointer", padding: "2px", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <X size={10} />
      </button>
    </div>
  );
}

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

// ── Timeline ──────────────────────────────────────────────────────
export default function StudioTimeline() {
  const {
    selectedClips, duration, audioFileId, audioName,
    songStartTime, setSongStartTime, removeClip, reorderClips, seek,
    currentTime, activeClipIndex, totalDuration, isPlaying, togglePlay,
  } = useStudio();

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openTrimId, setOpenTrimId] = useState<number | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1); // 1 = auto-fit
  const [containerW, setContainerW] = useState(800);

  // Measure container width for auto-fit
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function effDur(clip: (typeof selectedClips)[number]) {
    const raw = clip.duration ?? 5;
    return (clip.trimEnd ?? raw) - (clip.trimStart ?? 0);
  }

  const totalSecs = selectedClips.reduce((s, c) => s + effDur(c), 0);

  // Auto-fit: base scale fills the container; zoom multiplies it
  const basePxPerSec = totalSecs > 0
    ? Math.max(MIN_PX_PER_SEC, (containerW - 40) / totalSecs)
    : 40;
  const pxPerSec = Math.min(MAX_PX_PER_SEC, basePxPerSec * zoom);

  // Cumulative layout
  const blocks = selectedClips.map((clip, i) => {
    const left = selectedClips.slice(0, i).reduce((s, c) => s + effDur(c), 0) * pxPerSec;
    const width = effDur(clip) * pxPerSec;
    return { clip, i, left, width };
  });

  const timelineW = Math.max(totalSecs * pxPerSec + 40, duration * pxPerSec + 40, containerW);
  const tickStep = pxPerSec < 20 ? 10 : pxPerSec < 50 ? 5 : 2;
  const ticks = Array.from({ length: Math.ceil((timelineW / pxPerSec) / tickStep) + 1 }, (_, i) => i * tickStep);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const px = currentTime * pxPerSec;
    const { scrollLeft, clientWidth } = el;
    if (px > scrollLeft + clientWidth - 80) {
      el.scrollTo({ left: px - clientWidth / 2, behavior: "smooth" });
    } else if (px < scrollLeft + 20) {
      el.scrollTo({ left: Math.max(0, px - 40), behavior: "smooth" });
    }
  }, [currentTime, pxPerSec]);

  // Click ruler → seek
  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollX = scrollRef.current?.scrollLeft ?? 0;
    const x = e.clientX - rect.left + scrollX;
    seek(Math.max(0, x / pxPerSec));
  }

  // Audio drag
  const audioDrag = useRef<{ startX: number; startTime: number } | null>(null);
  function onAudioDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    audioDrag.current = { startX: e.clientX, startTime: songStartTime };
  }
  function onAudioMove(e: React.PointerEvent) {
    if (!audioDrag.current) return;
    setSongStartTime(Math.max(0, audioDrag.current.startTime + (e.clientX - audioDrag.current.startX) / pxPerSec));
  }
  function onAudioUp() { audioDrag.current = null; }

  // Drag-to-reorder
  function onDragStart(e: React.DragEvent, i: number) {
    e.dataTransfer.effectAllowed = "move";
    setDraggingFrom(i);
  }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDropTarget(i); }
  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (draggingFrom !== null && draggingFrom !== i) reorderClips(draggingFrom, i);
    setDraggingFrom(null); setDropTarget(null);
  }
  function onDragEnd() { setDraggingFrom(null); setDropTarget(null); }

  const playheadPx = currentTime * pxPerSec;

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
          <div ref={containerRef} style={{ padding: "16px 32px 24px", background: "rgba(0,0,0,0.25)" }}>
            {/* Header row: transport + meta + zoom */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {/* Play/pause */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: isPlaying ? "transparent" : "var(--fr-gold)",
                  border: isPlaying ? "1px solid rgba(82,214,196,0.5)" : "none",
                  color: isPlaying ? "var(--fr-gold)" : "#04110e",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 150ms ease",
                }}
              >
                {isPlaying ? <Pause size={12} strokeWidth={2.5} /> : <Play size={12} strokeWidth={2.5} style={{ marginLeft: 1 }} />}
              </button>

              {/* Time */}
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--fr-ivory)", letterSpacing: "0.02em", flexShrink: 0 }}>
                {fmt(currentTime)} / {fmt(totalDuration)}
              </span>

              {/* Divider */}
              <div style={{ width: 1, height: 14, background: "var(--fr-line)", flexShrink: 0 }} />

              {/* Clip indicator */}
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fr-gold)", flexShrink: 0 }}>
                {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""} · {totalSecs.toFixed(1)}s
              </span>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", color: "var(--fr-muted)", flexShrink: 0 }}>
                clip <span style={{ color: "var(--fr-ivory)" }}>{activeClipIndex + 1}</span> of {selectedClips.length}
              </span>

              {/* Divider */}
              <div style={{ width: 1, height: 14, background: "var(--fr-line)", flexShrink: 0 }} />

              {/* Duration meter */}
              {(() => {
                const over = totalSecs > duration;
                const under = totalSecs < duration - 2;
                const color = over
                  ? "rgba(255,80,80,0.9)"
                  : under
                  ? "rgba(255,180,50,0.9)"
                  : "var(--fr-gold)";
                const bg = over
                  ? "rgba(255,80,80,0.1)"
                  : under
                  ? "rgba(255,180,50,0.08)"
                  : "rgba(82,214,196,0.1)";
                const border = over
                  ? "rgba(255,80,80,0.3)"
                  : under
                  ? "rgba(255,180,50,0.25)"
                  : "rgba(82,214,196,0.25)";
                const label = over
                  ? `+${(totalSecs - duration).toFixed(1)}s over`
                  : under
                  ? `${(duration - totalSecs).toFixed(1)}s short`
                  : "fits";
                return (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 4, padding: "2px 8px", flexShrink: 0,
                    transition: "background 200ms ease, border-color 200ms ease",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", color, letterSpacing: "0.04em", transition: "color 200ms ease" }}>
                      {totalSecs.toFixed(1)}s / {duration}s
                    </span>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.4rem", color: color, opacity: 0.7, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {label}
                    </span>
                  </div>
                );
              })()}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Zoom slider */}
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem", color: "var(--fr-muted)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>zoom</span>
              <input
                type="range" min={1} max={8} step={0.1} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: 80, accentColor: "var(--fr-gold)", cursor: "pointer" }}
                aria-label="Timeline zoom"
              />
              {zoom > 1 && (
                <button
                  onClick={() => setZoom(1)}
                  style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem", color: "var(--fr-muted)", background: "transparent", border: "1px solid var(--fr-line)", padding: "2px 6px", cursor: "pointer", borderRadius: 3, flexShrink: 0 }}
                >
                  fit
                </button>
              )}
            </div>

            {/* Scrollable canvas */}
            <div ref={scrollRef} style={{ overflowX: "auto", overflowY: "visible", paddingBottom: 4 }}>
              <div style={{ position: "relative", width: timelineW, minWidth: "100%" }}>

                {/* Playhead line */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  width: 1,
                  transform: `translateX(${playheadPx}px)`,
                  background: "var(--fr-gold)",
                  boxShadow: "0 0 6px var(--fr-gold)",
                  zIndex: 30,
                  pointerEvents: "none",
                  willChange: "transform",
                }}>
                  {/* Diamond head */}
                  <div style={{
                    position: "absolute",
                    top: -2,
                    left: -4,
                    width: 9, height: 9,
                    background: "var(--fr-gold)",
                    transform: "rotate(45deg)",
                    boxShadow: "0 0 5px var(--fr-gold)",
                  }} />
                </div>

                {/* Ruler */}
                <div
                  onClick={handleRulerClick}
                  style={{ height: 24, position: "relative", cursor: "crosshair", marginBottom: 4, userSelect: "none" }}
                >
                  {ticks.map((t) => (
                    <div key={t} style={{ position: "absolute", left: t * pxPerSec, top: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.4375rem", color: "var(--fr-muted)", lineHeight: 1, transform: "translateX(-50%)" }}>{t}s</span>
                      <div style={{ width: 1, height: 6, background: "var(--fr-line)" }} />
                    </div>
                  ))}
                </div>

                {/* Clips track */}
                <div style={{ position: "relative", height: 88, background: "var(--fr-surface)", border: "1px solid var(--fr-line)", borderRadius: 4, marginBottom: audioFileId ? 10 : 0, overflow: "visible" }}>
                  {blocks.map(({ clip, i, left, width }) => {
                    const clipDur = clip.duration ?? 5;
                    const isTrimmed = clip.trimStart !== undefined || clip.trimEnd !== undefined;
                    const isActive = i === activeClipIndex;
                    const isDragTarget = dropTarget === i && draggingFrom !== i;

                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDrop={(e) => onDrop(e, i)}
                        onDragEnd={onDragEnd}
                        onClick={() => seek(selectedClips.slice(0, i).reduce((s, c) => s + effDur(c), 0))}
                        className="group"
                        style={{
                          position: "absolute",
                          left,
                          top: 0,
                          width: width - 2,
                          height: "100%",
                          border: isActive
                            ? "1px solid var(--fr-gold)"
                            : isDragTarget
                            ? "2px dashed var(--fr-gold)"
                            : isTrimmed
                            ? "1px solid rgba(82,214,196,0.5)"
                            : "1px solid var(--fr-line-2)",
                          boxShadow: isActive ? "0 0 0 2px rgba(82,214,196,0.15)" : undefined,
                          borderRadius: 3,
                          overflow: "visible",
                          cursor: "grab",
                          background: isActive ? "rgba(82,214,196,0.06)" : "var(--fr-surface-2)",
                          transition: "border-color 120ms ease, background 120ms ease, opacity 120ms ease",
                          opacity: draggingFrom === i ? 0.4 : 1,
                          zIndex: openTrimId === clip.id ? 40 : isActive ? 5 : 1,
                        }}
                      >
                        {clip.image && (
                          <img src={clip.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: isActive ? 0.5 : 0.3, borderRadius: 3, pointerEvents: "none" }} />
                        )}
                        <span style={{ position: "absolute", top: 4, left: 5, fontFamily: "monospace", fontSize: "0.4375rem", color: isActive ? "var(--fr-gold)" : "var(--fr-muted)", letterSpacing: "0.04em", textShadow: "0 1px 3px rgba(0,0,0,0.9)", pointerEvents: "none" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span style={{ position: "absolute", bottom: 4, left: 5, fontFamily: "monospace", fontSize: "0.4375rem", color: isTrimmed ? "var(--fr-gold)" : "rgba(255,255,255,0.35)", textShadow: "0 1px 3px rgba(0,0,0,0.9)", pointerEvents: "none" }}>
                          {effDur(clip).toFixed(1)}s{isTrimmed && ` ✂`}
                        </span>

                        {/* Scissors */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenTrimId(openTrimId === clip.id ? null : clip.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ position: "absolute", top: 3, right: 21, width: 16, height: 16, border: "1px solid var(--fr-line-2)", borderRadius: 3, background: "rgba(6,9,11,0.8)", color: "var(--fr-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          aria-label="Trim clip"
                        >
                          <Scissors size={9} />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeClip(clip.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, border: "1px solid var(--fr-line-2)", borderRadius: 3, background: "rgba(6,9,11,0.8)", color: "var(--fr-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          aria-label="Remove clip"
                        >
                          <X size={9} />
                        </button>

                        {openTrimId === clip.id && (
                          <InlineTrim clipId={clip.id} clipDuration={clipDur} trimStart={clip.trimStart ?? 0} trimEnd={clip.trimEnd ?? clipDur} onClose={() => setOpenTrimId(null)} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Audio track */}
                {audioFileId && (
                  <div style={{ position: "relative", height: 26, background: "var(--fr-surface)", border: "1px solid var(--fr-line)", borderRadius: 4 }}>
                    <div
                      onPointerDown={onAudioDown}
                      onPointerMove={onAudioMove}
                      onPointerUp={onAudioUp}
                      style={{ position: "absolute", left: Math.max(0, songStartTime * pxPerSec), top: 2, bottom: 2, right: 2, background: "rgba(82,214,196,0.1)", border: "1px solid rgba(82,214,196,0.3)", borderRadius: 3, cursor: "grab", display: "flex", alignItems: "center", gap: 5, paddingLeft: 7, userSelect: "none", minWidth: 60 }}
                    >
                      <Music2 size={9} style={{ color: "var(--fr-gold)", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.4375rem", color: "var(--fr-gold)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
