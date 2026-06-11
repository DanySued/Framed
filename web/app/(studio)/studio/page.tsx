import { StudioProvider } from "@/components/studio/StudioContext";
import AudioPanel from "@/components/studio/AudioPanel";
import PreviewFrame from "@/components/studio/PreviewFrame";
import ScenesPanel from "@/components/studio/ScenesPanel";
import TextPanel from "@/components/studio/TextPanel";
import ControlBar from "@/components/studio/ControlBar";
import ClipRail from "@/components/studio/ClipRail";
import StudioPhaseGate from "@/components/studio/StudioPhaseGate";

export default function StudioPage() {
  return (
    <StudioProvider>
      {/* Desktop: fixed viewport height layout. Mobile: natural scroll. */}
      <div
        className="flex flex-col lg:h-[calc(100vh-3rem)]"
      >
        {/* Work area */}
        <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(260px,320px)_1fr_minmax(260px,320px)]">
          {/* Center column: preview + text panel */}
          <div
            className="flex flex-col lg:overflow-hidden lg:order-2"
            style={{ borderLeft: "1px solid var(--fr-line)", borderRight: "1px solid var(--fr-line)" }}
          >
            {/* Preview area */}
            <div
              className="flex items-center justify-center lg:flex-1 lg:overflow-hidden"
              style={{ padding: "24px 20px 48px" }}
            >
              <PreviewFrame />
            </div>

            {/* Text panel pinned to bottom of center column (hidden during generation) */}
            <StudioPhaseGate phases={["compose"]}>
              <TextPanel />
            </StudioPhaseGate>
          </div>

          {/* Left column: Audio (compose) or hidden during generation */}
          <div className="lg:order-1 lg:overflow-hidden">
            <StudioPhaseGate phases={["compose"]}>
              <AudioPanel />
            </StudioPhaseGate>
          </div>

          {/* Right column: Scenes (compose) or ClipRail (approval) */}
          <div className="lg:order-3 lg:overflow-hidden flex flex-col">
            <StudioPhaseGate phases={["compose"]}>
              <ScenesPanel />
            </StudioPhaseGate>
            <StudioPhaseGate phases={["approval"]}>
              <ClipRail />
            </StudioPhaseGate>
          </div>
        </div>

        {/* Bottom control bar — full width */}
        <ControlBar />
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </StudioProvider>
  );
}
