"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, RotateCcw, Check, Play, RefreshCw } from "lucide-react";
import { useStudio, JobEntry } from "./StudioContext";

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fr-muted)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", color: "var(--fr-gold)" }}>
          {Math.round(value)}%
        </span>
      </div>
      <div style={{ height: 2, background: "var(--fr-line)", borderRadius: 1, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", background: "var(--fr-gold)", borderRadius: 1, transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: value / 100 }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ── Clip card for approval ────────────────────────────────────────
function ClipCard({ jobId, index, total }: { jobId: string; index: number; total: number }) {
  const src = `/api/reels/clips/${jobId}/${index}`;
  const cardWidth = `min(${Math.floor(88 / Math.min(total, 5))}%, 140px)`;
  return (
    <div style={{
      position: "relative",
      aspectRatio: "9/16",
      background: "var(--fr-surface)",
      border: "1px solid var(--fr-line)",
      borderRadius: 6,
      overflow: "hidden",
      flexShrink: 0,
      width: cardWidth,
    }}>
      <video
        src={src}
        muted
        playsInline
        loop
        onMouseEnter={(e) => { (e.currentTarget as HTMLVideoElement).play(); }}
        onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "4px 6px",
        background: "linear-gradient(transparent, rgba(4,17,14,0.85))",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.4rem",
        color: "var(--fr-gold)",
        letterSpacing: "0.06em",
      }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div style={{ position: "absolute", top: 6, right: 6 }}>
        <Play size={10} style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
    </div>
  );
}

// ── Finished film card ────────────────────────────────────────────
function FilmCard({ job, index }: { job: JobEntry; index: number }) {
  const reelId = job.status?.reel_id;
  const videoSrc = reelId ? `/api/reels/download/${reelId}` : null;

  const handleDownload = useCallback(() => {
    if (!videoSrc) return;
    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = `framed-film-${index + 1}.mp4`;
    a.click();
  }, [videoSrc, index]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{
        position: "relative",
        width: 160,
        aspectRatio: "9/16",
        background: "var(--fr-surface)",
        border: "1px solid var(--fr-line)",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        {videoSrc && (
          <video
            src={videoSrc}
            controls
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div style={{
          position: "absolute", top: 8, left: 8,
          fontFamily: "var(--font-mono), monospace", fontSize: "0.4rem",
          color: "var(--fr-gold)", letterSpacing: "0.06em",
          background: "rgba(4,17,14,0.7)", padding: "2px 5px", borderRadius: 3,
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {reelId && (
        <button
          onClick={handleDownload}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem",
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--fr-gold)", background: "transparent",
            border: "1px solid var(--fr-gold)", padding: "6px 14px",
            borderRadius: 4, cursor: "pointer", transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(82,214,196,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Download size={10} />
          Download
        </button>
      )}
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────
export default function GenerationOverlay() {
  const { phase, jobs, approvalJobIndex, onApproveClips, onReset } = useStudio();

  const visible = phase !== "compose";
  const approvalJob = jobs[approvalJobIndex];
  const clipCount = approvalJob?.status?.clip_count ?? 0;

  const avgProgress = jobs.length > 0
    ? jobs.reduce((s, j) => s + (j.status?.progress ?? 0), 0) / jobs.length
    : 0;

  const stageLabel = (() => {
    const first = jobs[0]?.status;
    if (!first) return "Queuing…";
    if (first.stage) return first.stage;
    if (phase === "generating") return "Searching and downloading clips…";
    if (phase === "rendering") return "Stitching, scaling, mixing audio…";
    return "";
  })();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gen-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(4,17,14,0.88)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            style={{
              width: "100%", maxWidth: 640,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
            }}
          >

            {/* ── Generating (phase 1) ─────────────────────────── */}
            {phase === "generating" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: "1.25rem", color: "var(--fr-ivory)", marginBottom: 6 }}>
                    Building your film…
                  </p>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.55rem", color: "var(--fr-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {stageLabel}
                  </p>
                </div>
                <ProgressBar value={avgProgress} label="Phase 1 — sourcing clips" />
                {jobs.length > 1 && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    {jobs.map((j, i) => (
                      <div key={j.jobId} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.4rem", color: "var(--fr-muted)", marginBottom: 4, letterSpacing: "0.06em" }}>
                          film {i + 1}
                        </div>
                        <div style={{ width: 60, height: 2, background: "var(--fr-line)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--fr-gold)", width: `${j.status?.progress ?? 0}%`, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Approval gate ────────────────────────────────── */}
            {phase === "approval" && approvalJob && (
              <>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: "1.25rem", color: "var(--fr-ivory)", marginBottom: 6 }}>
                    Review your clips
                  </p>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.55rem", color: "var(--fr-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {clipCount} clip{clipCount !== 1 ? "s" : ""} — hover to preview · approve to render
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
                  {Array.from({ length: clipCount }, (_, i) => (
                    <ClipCard key={i} jobId={approvalJob.jobId} index={i} total={clipCount} />
                  ))}
                </div>

                {jobs.length > 1 && (
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem", color: "var(--fr-muted)", letterSpacing: "0.06em" }}>
                    film {approvalJobIndex + 1} of {jobs.length}
                  </p>
                )}

                <button
                  onClick={() => onApproveClips(approvalJob.jobId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-display), Georgia, serif",
                    fontSize: "0.9375rem", letterSpacing: "0.02em",
                    color: "#04110e", background: "var(--fr-gold)",
                    border: "none", padding: "10px 32px", borderRadius: 4,
                    cursor: "pointer", transition: "opacity 150ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Approve — begin render
                </button>
              </>
            )}

            {/* ── Rendering (phase 2) ──────────────────────────── */}
            {phase === "rendering" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: "1.25rem", color: "var(--fr-ivory)", marginBottom: 6 }}>
                    Rendering…
                  </p>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.55rem", color: "var(--fr-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {stageLabel}
                  </p>
                </div>
                <ProgressBar value={avgProgress} label="Phase 2 — stitching & encoding" />
                {jobs.length > 1 && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                    {jobs.map((j, i) => (
                      <div key={j.jobId} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.4rem", color: "var(--fr-muted)", marginBottom: 4, letterSpacing: "0.06em" }}>
                          film {i + 1}
                        </div>
                        <div style={{ width: 60, height: 2, background: "var(--fr-line)", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--fr-gold)", width: `${j.status?.progress ?? 0}%`, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Done: film viewer ────────────────────────────── */}
            {phase === "done" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontStyle: "italic", fontSize: "1.5rem", color: "var(--fr-ivory)", marginBottom: 6 }}>
                    Your film{jobs.length > 1 ? "s are" : " is"} ready
                  </p>
                  <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem", color: "var(--fr-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    play · download · or make another
                  </p>
                </div>

                <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                  {jobs.map((j, i) => (
                    <FilmCard key={j.jobId} job={j} index={i} />
                  ))}
                </div>

                <button
                  onClick={onReset}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--font-mono), monospace", fontSize: "0.5rem",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--fr-muted)", background: "transparent",
                    border: "1px solid var(--fr-line)", padding: "8px 20px",
                    borderRadius: 4, cursor: "pointer",
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fr-ivory)"; e.currentTarget.style.borderColor = "var(--fr-muted)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fr-muted)"; e.currentTarget.style.borderColor = "var(--fr-line)"; }}
                >
                  <RotateCcw size={10} />
                  Make another
                </button>
              </>
            )}

            {/* Cancel link (all non-done phases) */}
            {phase !== "done" && (
              <button
                onClick={onReset}
                style={{
                  fontFamily: "var(--font-mono), monospace", fontSize: "0.45rem",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "var(--fr-line)", background: "transparent", border: "none",
                  cursor: "pointer", transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fr-muted)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fr-line)"; }}
              >
                ← cancel &amp; go back
              </button>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
