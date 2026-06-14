"use client";

import { useCallback, useRef, useState } from "react";
import { useStudio, TextOverlay } from "./StudioContext";

// Snap targets: center + rule-of-thirds
const SNAP_X = [50];
const SNAP_Y = [33.3, 50, 66.6];
const SNAP_RADIUS = 3; // % distance to trigger snap

function snap(value: number, targets: number[]): { value: number; snapped: boolean } {
  for (const t of targets) {
    if (Math.abs(value - t) < SNAP_RADIUS) return { value: t, snapped: true };
  }
  return { value, snapped: false };
}

interface Props {
  overlays: TextOverlay[];
}

export default function TextOverlayLayer({ overlays }: Props) {
  const { updateOverlay } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 20 }}>
      {overlays.map((overlay, i) =>
        overlay.text ? (
          <DraggableOverlay
            key={i}
            index={i}
            overlay={overlay}
            containerRef={containerRef}
            onUpdate={(patch) => updateOverlay(i, patch)}
          />
        ) : null
      )}
    </div>
  );
}

interface DraggableProps {
  index: number;
  overlay: TextOverlay;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (patch: Partial<TextOverlay>) => void;
}

function DraggableOverlay({ overlay, containerRef, onUpdate }: DraggableProps) {
  const dragging = useRef(false);
  const startPos = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      dragging.current = true;
      setIsDragging(true);
      startPos.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: overlay.x,
        y: overlay.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [containerRef, overlay.x, overlay.y]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = startPos.current.x + ((e.clientX - startPos.current.mouseX) / rect.width) * 100;
      const rawY = startPos.current.y + ((e.clientY - startPos.current.mouseY) / rect.height) * 100;

      const snappedX = snap(Math.max(0, Math.min(100, rawX)), SNAP_X);
      const snappedY = snap(Math.max(0, Math.min(100, rawY)), SNAP_Y);

      setSnapGuides({ x: snappedX.snapped, y: snappedY.snapped });
      onUpdate({ x: snappedX.value, y: snappedY.value });
    },
    [containerRef, onUpdate]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
    setSnapGuides({ x: false, y: false });
  }, []);

  const fontFamily =
    overlay.font === "serif"
      ? "var(--font-display), Georgia, serif"
      : overlay.font === "mono"
      ? "monospace"
      : "var(--font-sans), system-ui, sans-serif";

  const showFrame = hovered || isDragging;

  return (
    <>
      {/* Snap guide lines — rendered inside the container */}
      {isDragging && snapGuides.x && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1,
          background: "rgba(82,214,196,0.35)",
          pointerEvents: "none",
          zIndex: 25,
        }} />
      )}
      {isDragging && snapGuides.y && (
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${overlay.y}%`,
          height: 1,
          background: "rgba(82,214,196,0.35)",
          pointerEvents: "none",
          zIndex: 25,
        }} />
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!isDragging) setHovered(false); }}
        style={{
          position: "absolute",
          left: `${overlay.x}%`,
          top: `${overlay.y}%`,
          transform: "translate(-50%, -50%)",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          fontFamily,
          fontWeight: overlay.bold ? 700 : 400,
          fontStyle: overlay.italic ? "italic" : "normal",
          fontSize: "clamp(0.85rem, 2.5vw, 1.5rem)",
          color: "var(--fr-ivory)",
          textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          zIndex: 30,
          padding: "4px 8px",
          // Bounding box — visible on hover/drag only
          outline: showFrame ? "1px dashed rgba(82,214,196,0.55)" : "1px dashed transparent",
          outlineOffset: 3,
          borderRadius: 2,
          transition: isDragging ? "none" : "outline-color 120ms ease",
        }}
      >
        {overlay.text}

        {/* Drag handle hint — shows only on hover, not while dragging */}
        {hovered && !isDragging && (
          <span style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.35rem",
            color: "rgba(82,214,196,0.6)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}>
            drag
          </span>
        )}
      </div>
    </>
  );
}
