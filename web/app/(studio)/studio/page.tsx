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
        className="flex flex-col lg:h-[calc(100vh-60px)]"
      >
        <h1 className="sr-only">Studio</h1>

        {/* Work area — DOM order matches visual + workflow order: scenes/clips → preview/title → audio */}
        <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(260px,320px)_1fr_minmax(260px,320px)]">
          {/* Left column: Scenes/clip picker (compose) or hidden during generation */}
          <div className="lg:overflow-hidden">
            <StudioPhaseGate phases={["compose"]}>
              <ScenesPanel />
            </StudioPhaseGate>
          </div>

          {/* Center column: preview + text panel */}
          <div
            className="flex flex-col lg:overflow-hidden"
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

          {/* Right column: Audio (compose) or ClipRail (approval) */}
          <div className="lg:overflow-hidden flex flex-col">
            <StudioPhaseGate phases={["compose"]}>
              <AudioPanel />
            </StudioPhaseGate>
            <StudioPhaseGate phases={["approval"]}>
              <ClipRail />
            </StudioPhaseGate>
          </div>
        </div>

        {/* Bottom control bar — full width */}
        <ControlBar />
      </div>
    </StudioProvider>
  );
}
