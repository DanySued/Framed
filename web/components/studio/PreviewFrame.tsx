"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStudio } from "./StudioContext";
import TextOverlayLayer from "./TextOverlayLayer";
import GenerationOverlay from "./GenerationOverlay";

const KEN_BURNS_DURATION = 7000; // ms per slide

export default function PreviewFrame() {
  const { keywords, selectedClips, overlays, phase, jobs, previewOverride, subtitlesEnabled, onReset } = useStudio();
  const videoUrls =
    selectedClips.map((c) => c.url).filter((u): u is string => Boolean(u));
  const thumbnails =
    selectedClips.length === 0
      ? keywords.map((k) => k.thumbnail).filter((t): t is string => Boolean(t))
      : selectedClips.map((c) => c.image).filter((t): t is string => Boolean(t));
  const showVideoSlideshow = videoUrls.length > 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Gold border pulse on done
  const [showGoldPulse, setShowGoldPulse] = useState(false);
  const prevPhase = useRef<string>("");

  useEffect(() => {
    if (thumbnails.length < 2) return;
    timerRef.current = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % thumbnails.length);
    }, KEN_BURNS_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, thumbnails.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
  }, [thumbnails.length]);

  // Trigger gold pulse once when phase transitions to "done"
  useEffect(() => {
    if (phase === "done" && prevPhase.current !== "done") {
      setShowGoldPulse(true);
      const t = setTimeout(() => setShowGoldPulse(false), 700);
      return () => clearTimeout(t);
    }
    prevPhase.current = phase;
  }, [phase]);

  const isEmpty = videoUrls.length === 0 && thumbnails.length === 0;

  // Find the final reel_id from done jobs
  const doneJob = jobs.find((j) => j.status?.status === "done" && j.status.reel_id);
  const reelId = doneJob?.status?.reel_id;
  const finalVideoSrc = reelId ? `/api/reels/download/${reelId}` : null;
  const srtSrc = reelId ? `/api/reels/download/${reelId}/srt` : null;

  const showFinal = phase === "done" && finalVideoSrc;

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: "min(calc(70vh * 9/16), 100%)",
        aspectRatio: "9 / 16",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Gold pulse border on done */}
      {showGoldPulse && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            pointerEvents: "none",
            boxShadow: "0 0 0 1px var(--fr-gold), 0 0 16px 2px var(--fr-gold)",
            animation: "goldPulse 600ms ease-out forwards",
            borderRadius: "16px",
          }}
        />
      )}

      {/* Background / slideshow */}
      <div className="absolute inset-0 overflow-hidden bg-[var(--fr-surface)]">
        {/* Override: clip preview or final film */}
        {(previewOverride || showFinal) ? (
          <video
            key={previewOverride ?? finalVideoSrc ?? ""}
            src={previewOverride ?? finalVideoSrc ?? ""}
            autoPlay={!!showFinal}
            controls={!!showFinal}
            loop={!showFinal}
            muted={!showFinal}
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <>
            <AnimatePresence mode="wait">
              {!isEmpty && showVideoSlideshow && videoUrls[activeIndex] && (
                <motion.div
                  key={videoUrls[activeIndex]}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <video
                    src={videoUrls[activeIndex]}
                    autoPlay
                    muted
                    playsInline
                    loop={videoUrls.length === 1}
                    className="absolute inset-0 w-full h-full object-cover"
                    onEnded={() =>
                      videoUrls.length > 1 &&
                      setActiveIndex((i) => (i + 1) % videoUrls.length)
                    }
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 40%, rgba(6,9,11,0.5) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </motion.div>
              )}
              {!isEmpty && !showVideoSlideshow && thumbnails[activeIndex] && (
                <motion.div
                  key={thumbnails[activeIndex]}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  style={{ willChange: "opacity" }}
                >
                  <motion.img
                    src={thumbnails[activeIndex]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.06 }}
                    transition={{
                      duration: KEN_BURNS_DURATION / 1000,
                      ease: "linear",
                    }}
                    style={{ willChange: "transform" }}
                  />
                  {/* subtle vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 40%, rgba(6,9,11,0.7) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {isEmpty && phase === "compose" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p
                  style={{
                    fontFamily: "var(--font-display), Georgia, serif",
                    fontSize: "0.8125rem",
                    letterSpacing: "0.12em",
                    color: "var(--fr-muted)",
                    textAlign: "center",
                    padding: "0 2rem",
                    fontStyle: "italic",
                  }}
                >
                  begin by choosing your clips —<br />
                  search a scene on the left
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generation / rendering overlay */}
      <GenerationOverlay />

      {/* Text overlays (hide during generation/approval/done) */}
      {(phase === "compose" || phase === "approval") && (
        <TextOverlayLayer overlays={overlays} />
      )}

      {/* Done state actions (shown outside the 9:16 frame, below) */}
      {phase === "done" && (
        <DoneActions
          reelId={reelId ?? null}
          srtSrc={srtSrc}
          subtitlesEnabled={subtitlesEnabled}
          onReset={onReset}
        />
      )}

      {/* Keyframes */}
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

function DoneActions({
  reelId,
  srtSrc,
  subtitlesEnabled,
  onReset,
}: {
  reelId: string | null;
  srtSrc: string | null;
  subtitlesEnabled: boolean;
  onReset: () => void;
}) {
  if (!reelId) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: -56,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        zIndex: 15,
      }}
    >
      <a
        href={`/api/reels/download/${reelId}`}
        download
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.8125rem",
          letterSpacing: "0.04em",
          color: "var(--fr-gold)",
          border: "1px solid var(--fr-gold)",
          padding: "6px 18px",
          textDecoration: "none",
          transition: "background 150ms ease, color 150ms ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--fr-gold)";
          e.currentTarget.style.color = "#04110e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--fr-gold)";
        }}
      >
        download film
      </a>

      {subtitlesEnabled && srtSrc && (
        <a
          href={srtSrc}
          download
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.8125rem",
            letterSpacing: "0.04em",
            color: "var(--fr-muted)",
            border: "1px solid var(--fr-line)",
            padding: "6px 18px",
            textDecoration: "none",
            transition: "color 150ms ease",
            whiteSpace: "nowrap",
          }}
        >
          subtitles (.srt)
        </a>
      )}

      <button
        onClick={onReset}
        style={{
          background: "transparent",
          border: "none",
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.8125rem",
          letterSpacing: "0.04em",
          color: "var(--fr-muted)",
          cursor: "pointer",
          padding: "6px 12px",
          transition: "color 150ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fr-ivory)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fr-muted)"; }}
      >
        new film
      </button>
    </div>
  );
}

function CornerMarks() {
  const markStyle: React.CSSProperties = {
    position: "absolute",
    width: 14,
    height: 14,
    zIndex: 11,
    pointerEvents: "none",
  };
  const lineColor = "var(--fr-gold)";
  const thickness = "1px";

  return (
    <>
      {/* top-left */}
      <div style={{ ...markStyle, top: 8, left: 8 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: thickness, background: lineColor }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: thickness, height: "100%", background: lineColor }} />
      </div>
      {/* top-right */}
      <div style={{ ...markStyle, top: 8, right: 8 }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "100%", height: thickness, background: lineColor }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: thickness, height: "100%", background: lineColor }} />
      </div>
      {/* bottom-left */}
      <div style={{ ...markStyle, bottom: 8, left: 8 }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: thickness, background: lineColor }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: thickness, height: "100%", background: lineColor }} />
      </div>
      {/* bottom-right */}
      <div style={{ ...markStyle, bottom: 8, right: 8 }}>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "100%", height: thickness, background: lineColor }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: thickness, height: "100%", background: lineColor }} />
      </div>
    </>
  );
}
