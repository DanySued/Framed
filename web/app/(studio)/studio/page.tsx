"use client";

import { motion, AnimatePresence } from "motion/react";
import { StudioProvider, useStudio } from "@/components/studio/StudioContext";
import AudioPanel from "@/components/studio/AudioPanel";
import PreviewFrame from "@/components/studio/PreviewFrame";
import ScenesPanel from "@/components/studio/ScenesPanel";
import TextPanel from "@/components/studio/TextPanel";
import ControlBar from "@/components/studio/ControlBar";
import ClipRail from "@/components/studio/ClipRail";
import StudioPhaseGate from "@/components/studio/StudioPhaseGate";

function StudioLayout() {
  const { selectedClips, phase } = useStudio();
  const hasClips = selectedClips.length > 0;
  const showCompositor = hasClips || phase !== "compose";

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 44px)" }}>
      <h1 className="sr-only">Studio</h1>

      {/* ── Clip browser — always visible ───────────────────────── */}
      <StudioPhaseGate phases={["compose"]}>
        <div
          style={{
            borderBottom: "1px solid var(--fr-line)",
            background: "var(--fr-black)",
          }}
        >
          <ScenesPanel />
        </div>
      </StudioPhaseGate>

      {/* ── Compositor — slides in once clips are chosen ─────────── */}
      <AnimatePresence>
        {showCompositor && (
          <motion.div
            key="compositor"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0 grid lg:grid-cols-[minmax(260px,320px)_1fr_minmax(260px,320px)]"
            style={{ borderBottom: "1px solid var(--fr-line)" }}
          >
            {/* Left: TextPanel in compose; ClipRail in approval */}
            <div className="lg:overflow-y-auto flex flex-col" style={{ borderRight: "1px solid var(--fr-line)" }}>
              <StudioPhaseGate phases={["approval"]}>
                <ClipRail />
              </StudioPhaseGate>
              <StudioPhaseGate phases={["compose"]}>
                <TextPanel />
              </StudioPhaseGate>
            </div>

            {/* Center: preview only */}
            <div
              className="flex flex-col lg:overflow-hidden"
              style={{ borderRight: "1px solid var(--fr-line)" }}
            >
              <div
                className="flex items-center justify-center flex-1 lg:overflow-hidden"
                style={{ padding: "24px 20px 48px" }}
              >
                <PreviewFrame />
              </div>
            </div>

            {/* Right: audio in compose */}
            <div className="lg:overflow-hidden flex flex-col">
              <StudioPhaseGate phases={["compose"]}>
                <AudioPanel />
              </StudioPhaseGate>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Control bar ─────────────────────────────────────────── */}
      <ControlBar />
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
