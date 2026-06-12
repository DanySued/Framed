"use client";

import { AnimatePresence, motion } from "motion/react";
import { useStudio } from "./StudioContext";

export default function GenerationOverlay() {
  const { phase, jobs } = useStudio();

  if (phase !== "generating" && phase !== "rendering") return null;

  const isBulk = jobs.length > 1;
  const phaseLabel = phase === "generating" ? "composing" : "rendering";

  // For single job, pull stage label + progress
  const firstJob = jobs[0];
  const singleStage = firstJob?.status?.stage ?? phaseLabel;
  const singleProgress = firstJob?.status?.progress ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        // Dim the backdrop
        background: "rgba(6,9,11,0.72)",
        backdropFilter: "blur(1px)",
        pointerEvents: "none",
      }}
    >
      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={singleStage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.875rem",
            letterSpacing: "0.06em",
            color: "var(--fr-ivory)",
            fontStyle: "italic",
            fontWeight: 400,
            textAlign: "center",
          }}
        >
          {singleStage}
        </motion.p>
      </AnimatePresence>

      {/* Progress bars */}
      <div
        style={{
          width: "72%",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {isBulk ? (
          jobs.map((j, i) => (
            <div key={j.jobId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* film index */}
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "monospace",
                  fontSize: "0.625rem",
                  color: "var(--fr-muted)",
                  minWidth: 12,
                  textAlign: "right",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--fr-line)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    background: "var(--fr-gold)",
                    width: `${j.status?.progress ?? 0}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--fr-line)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${singleProgress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  background: "var(--fr-gold)",
                }}
              />
            </div>
            {/* Film-counter numeral */}
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                fontFamily: "monospace",
                fontSize: "0.6875rem",
                color: "var(--fr-gold)",
                minWidth: 22,
                textAlign: "right",
              }}
            >
              {String(singleProgress).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
