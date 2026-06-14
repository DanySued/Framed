"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause } from "lucide-react";
import { useStudio } from "./StudioContext";
import TextOverlayLayer from "./TextOverlayLayer";
import GenerationOverlay from "./GenerationOverlay";

const KEN_BURNS_DURATION = 7000;

export default function PreviewFrame() {
  const {
    keywords, selectedClips, overlays, phase, jobs,
    previewOverride, subtitlesEnabled, onReset, vibePreset,
    isPlaying, activeClipIndex, togglePlay,
  } = useStudio();

  const videoUrls = selectedClips.map((c) => c.url).filter((u): u is string => Boolean(u));
  const thumbnails =
    selectedClips.length === 0
      ? keywords.map((k) => k.thumbnail).filter((t): t is string => Boolean(t))
      : selectedClips.map((c) => c.image).filter((t): t is string => Boolean(t));
  const showVideoSlideshow = videoUrls.length > 0;

  // Thumbnail Ken-Burns (only when no clips picked)
  const [thumbIndex, setThumbIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (thumbnails.length < 2 || showVideoSlideshow) return;
    timerRef.current = setTimeout(() => setThumbIndex((i) => (i + 1) % thumbnails.length), KEN_BURNS_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [thumbIndex, thumbnails.length, showVideoSlideshow]);
  useEffect(() => { setThumbIndex(0); }, [thumbnails.length]);

  // Video ref — play/pause driven by isPlaying from context
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.play().catch(() => {});
    else v.pause();
  }, [isPlaying, activeClipIndex]);

  // Gold pulse on done
  const [showGoldPulse, setShowGoldPulse] = useState(false);
  const prevPhase = useRef("");
  useEffect(() => {
    if (phase === "done" && prevPhase.current !== "done") {
      setShowGoldPulse(true);
      const t = setTimeout(() => setShowGoldPulse(false), 700);
      return () => clearTimeout(t);
    }
    prevPhase.current = phase;
  }, [phase]);

  // Hover state for ghost overlay
  const [hovered, setHovered] = useState(false);

  const isEmpty = videoUrls.length === 0 && thumbnails.length === 0;
  const doneJob = jobs.find((j) => j.status?.status === "done" && j.status.reel_id);
  const reelId = doneJob?.status?.reel_id;
  const finalVideoSrc = reelId ? `/api/reels/download/${reelId}` : null;
  const srtSrc = reelId ? `/api/reels/download/${reelId}/srt` : null;
  const showFinal = phase === "done" && finalVideoSrc;

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: "min(calc(70vh * 9/16), 100%)", aspectRatio: "9 / 16", borderRadius: "16px", overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gold pulse */}
      {showGoldPulse && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none", boxShadow: "0 0 0 1px var(--fr-gold), 0 0 16px 2px var(--fr-gold)", animation: "goldPulse 600ms ease-out forwards", borderRadius: "16px" }} />
      )}

      {/* Background / content */}
      <div
        className="absolute inset-0 overflow-hidden bg-[var(--fr-surface)]"
        style={{ filter: vibePreset && vibePreset !== "none" ? vibePreset : undefined }}
      >
        {(previewOverride || showFinal) ? (
          <video
            key={previewOverride ?? finalVideoSrc ?? ""}
            src={previewOverride ?? finalVideoSrc ?? ""}
            autoPlay={!!showFinal}
            controls={!!showFinal}
            loop={!showFinal}
            muted={!showFinal}
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <>
            <AnimatePresence mode="wait">
              {!isEmpty && showVideoSlideshow && videoUrls[activeClipIndex] && (
                <motion.div
                  key={videoUrls[activeClipIndex]}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <video
                    ref={videoRef}
                    src={videoUrls[activeClipIndex]}
                    autoPlay={isPlaying}
                    muted
                    playsInline
                    loop={videoUrls.length === 1}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,9,11,0.5) 100%)", pointerEvents: "none" }} />
                </motion.div>
              )}
              {!isEmpty && !showVideoSlideshow && thumbnails[thumbIndex] && (
                <motion.div
                  key={thumbnails[thumbIndex]}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  <motion.img
                    src={thumbnails[thumbIndex]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.06 }}
                    transition={{ duration: KEN_BURNS_DURATION / 1000, ease: "linear" }}
                  />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,9,11,0.7) 100%)", pointerEvents: "none" }} />
                </motion.div>
              )}
            </AnimatePresence>

            {isEmpty && phase === "compose" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.8125rem", letterSpacing: "0.12em", color: "var(--fr-muted)", textAlign: "center", padding: "0 2rem", fontStyle: "italic" }}>
                  begin by choosing your clips —<br />search a scene above
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <GenerationOverlay />
      {(phase === "compose" || phase === "approval") && <TextOverlayLayer overlays={overlays} />}

      {/* Ghost play/pause overlay — appears on hover when clips are loaded */}
      {showVideoSlideshow && phase === "compose" && !previewOverride && (
        <AnimatePresence>
          {(hovered || isPlaying) && (
            <motion.button
              key="playoverlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(6,9,11,0.55)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(6px)",
              }}>
                {isPlaying
                  ? <Pause size={18} strokeWidth={2} style={{ color: "var(--fr-ivory)" }} />
                  : <Play size={18} strokeWidth={2} style={{ color: "var(--fr-ivory)", marginLeft: 2 }} />
                }
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {phase === "done" && (
        <DoneActions reelId={reelId ?? null} srtSrc={srtSrc} subtitlesEnabled={subtitlesEnabled} onReset={onReset} />
      )}

      <style>{`
        @keyframes goldPulse {
          0%   { opacity: 1; }
          60%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function DoneActions({ reelId, srtSrc, subtitlesEnabled, onReset }: { reelId: string | null; srtSrc: string | null; subtitlesEnabled: boolean; onReset: () => void }) {
  if (!reelId) return null;
  return (
    <div style={{ position: "absolute", bottom: -56, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 15 }}>
      <a href={`/api/reels/download/${reelId}`} download style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.8125rem", letterSpacing: "0.04em", color: "var(--fr-gold)", border: "1px solid var(--fr-gold)", padding: "6px 18px", textDecoration: "none", transition: "background 150ms ease, color 150ms ease", whiteSpace: "nowrap" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--fr-gold)"; e.currentTarget.style.color = "#04110e"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fr-gold)"; }}
      >download film</a>
      {subtitlesEnabled && srtSrc && (
        <a href={srtSrc} download style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.8125rem", letterSpacing: "0.04em", color: "var(--fr-muted)", border: "1px solid var(--fr-line)", padding: "6px 18px", textDecoration: "none", transition: "color 150ms ease", whiteSpace: "nowrap" }}>subtitles (.srt)</a>
      )}
      <button onClick={onReset} style={{ background: "transparent", border: "none", fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.8125rem", letterSpacing: "0.04em", color: "var(--fr-muted)", cursor: "pointer", padding: "6px 12px", transition: "color 150ms ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fr-ivory)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fr-muted)"; }}
      >new film</button>
    </div>
  );
}
