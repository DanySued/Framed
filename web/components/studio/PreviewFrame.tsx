"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStudio } from "./StudioContext";
import TextOverlayLayer from "./TextOverlayLayer";

const KEN_BURNS_DURATION = 7000; // ms per slide

export default function PreviewFrame() {
  const { keywords, overlays } = useStudio();
  const thumbnails = keywords
    .map((k) => k.thumbnail)
    .filter((t): t is string => Boolean(t));

  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (thumbnails.length < 2) return;
    timerRef.current = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % thumbnails.length);
    }, KEN_BURNS_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, thumbnails.length]);

  // Reset index when thumbnails change
  useEffect(() => {
    setActiveIndex(0);
  }, [thumbnails.length]);

  const isEmpty = thumbnails.length === 0;

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        // 9:16 aspect ratio, max height ~70vh
        width: "min(calc(70vh * 9/16), 100%)",
        aspectRatio: "9 / 16",
      }}
    >
      {/* Hairline border frame */}
      <div
        className="absolute inset-0"
        style={{ border: "1px solid var(--fr-line)", zIndex: 10, pointerEvents: "none" }}
      />

      {/* Cinema slate corner marks */}
      <CornerMarks />

      {/* Background / slideshow */}
      <div className="absolute inset-0 overflow-hidden bg-[var(--fr-surface)]">
        <AnimatePresence mode="crossfade">
          {!isEmpty && thumbnails[activeIndex] && (
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
                    "radial-gradient(ellipse at center, transparent 40%, rgba(13,11,8,0.7) 100%)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {isEmpty && (
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
              your scenes will appear here
            </p>
          </div>
        )}
      </div>

      {/* Text overlays */}
      <TextOverlayLayer overlays={overlays} />
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
