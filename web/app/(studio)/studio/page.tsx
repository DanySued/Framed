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
        {/* Work area: single column on mobile, three columns on lg+ */}
        <div className="flex-1 min-h-0 grid lg:grid lg:grid-cols-[minmax(260px,320px)_1fr_minmax(260px,320px)]">
          {/* Mobile: PreviewFrame first; on lg it sits in the center column */}
          <div
            className="flex flex-col overflow-hidden lg:order-2"
            style={{ borderLeft: "1px solid var(--fr-line)", borderRight: "1px solid var(--fr-line)" }}
          >
            {/* Preview area */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden"
              style={{ padding: "24px 20px 20px" }}
            >
              <PreviewFrame />
            </div>

            {/* Text panel pinned to bottom of center column */}
            <TextPanel />
          </div>

          {/* Audio — left column on lg */}
          <div className="lg:order-1">
            <AudioPanel />
          </div>

          {/* Scenes — right column on lg */}
          <div className="lg:order-3">
            <ScenesPanel />
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
