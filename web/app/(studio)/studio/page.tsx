import { StudioProvider } from "@/components/studio/StudioContext";
import AudioPanel from "@/components/studio/AudioPanel";
import PreviewFrame from "@/components/studio/PreviewFrame";
import ScenesPanel from "@/components/studio/ScenesPanel";
import TextPanel from "@/components/studio/TextPanel";
import ControlBar from "@/components/studio/ControlBar";

export default function StudioPage() {
  return (
    <StudioProvider>
      <div
        className="flex flex-col"
        style={{ height: "calc(100vh - 3rem)" /* below 48px header */ }}
      >
        {/* Three-column work area */}
        <div
          className="flex-1 min-h-0 grid"
          style={{
            gridTemplateColumns: "minmax(260px, 320px) 1fr minmax(260px, 320px)",
          }}
        >
          {/* Left — Audio */}
          <AudioPanel />

          {/* Center — Preview + Text panel */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ borderLeft: "1px solid var(--fr-line)", borderRight: "1px solid var(--fr-line)" }}
          >
            {/* Preview area — takes remaining space */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden"
              style={{ padding: "24px 20px 20px" }}
            >
              <PreviewFrame />
            </div>

            {/* Text panel pinned to bottom of center column */}
            <TextPanel />
          </div>

          {/* Right — Scenes */}
          <ScenesPanel />
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
