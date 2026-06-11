"use client";

import { useCallback, useRef } from "react";
import { useStudio, TextOverlay } from "./StudioContext";

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

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      dragging.current = true;
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
      const dx = ((e.clientX - startPos.current.mouseX) / rect.width) * 100;
      const dy = ((e.clientY - startPos.current.mouseY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100, startPos.current.x + dx));
      const newY = Math.max(0, Math.min(100, startPos.current.y + dy));
      onUpdate({ x: newX, y: newY });
    },
    [containerRef, onUpdate]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const fontFamily =
    overlay.font === "serif"
      ? "var(--font-display), Georgia, serif"
      : overlay.font === "mono"
      ? "monospace"
      : "var(--font-sans), system-ui, sans-serif";

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "absolute",
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: "grab",
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
        padding: "2px 6px",
      }}
    >
      {overlay.text}
    </div>
  );
}
