"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StudioProvider, useStudio } from "@/components/studio/StudioContext";
import AudioPanel from "@/components/studio/AudioPanel";
import PreviewFrame from "@/components/studio/PreviewFrame";
import ScenesPanel from "@/components/studio/ScenesPanel";
import TextPanel from "@/components/studio/TextPanel";
import ControlBar from "@/components/studio/ControlBar";
import StudioTimeline from "@/components/studio/StudioTimeline";
import StudioPhaseGate from "@/components/studio/StudioPhaseGate";
import GenerationOverlay from "@/components/studio/GenerationOverlay";

function StudioLayout() {
  const { selectedClips, phase, togglePlay } = useStudio();
  const hasClips = selectedClips.length > 0;
  const showCompositor = hasClips || phase !== "compose";

  // Spacebar → play/pause
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 54px)" }}>
      <h1 className="sr-only">Studio</h1>

      {/* ── Clip browser ────────────────────────────────────────── */}
      <StudioPhaseGate phases={["compose"]}>
        <div style={{ background: "var(--fr-black)" }}>
          <ScenesPanel />
        </div>
      </StudioPhaseGate>

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <StudioTimeline />

      {/* ── Compositor ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCompositor && (
          <motion.div
            key="compositor"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 grid lg:grid-cols-[minmax(260px,320px)_1fr_minmax(260px,320px)] items-start"
            style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}
          >
            {/* Left: TextPanel in compose */}
            <div className="lg:overflow-y-auto flex flex-col">
              <StudioPhaseGate phases={["compose"]}>
                <TextPanel />
              </StudioPhaseGate>
            </div>

            {/* Center: preview */}
            <div className="flex flex-col lg:sticky lg:top-[54px] lg:self-start lg:max-h-[calc(100vh-54px)] lg:overflow-hidden">
              <div className="flex items-center justify-center flex-1 lg:overflow-hidden" style={{ padding: "24px 20px 48px" }}>
                <PreviewFrame />
              </div>
            </div>

            {/* Right: audio */}
            <div className="lg:overflow-hidden flex flex-col">
              <StudioPhaseGate phases={["compose"]}>
                <AudioPanel />
              </StudioPhaseGate>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Control bar ─────────────────────────────────────────── */}
      {hasClips && <ControlBar />}
    </div>
  );
}

export default function StudioPage() {
  return (
    <StudioProvider>
      <StudioLayout />
    </StudioProvider>
  );
}
