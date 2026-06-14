"use client";

import { useStudio, VIBE_PRESETS, TextOverlay } from "./StudioContext";
import { Plus, Minus } from "lucide-react";

export default function TextPanel() {
  const { overlays, updateOverlay, addOverlay, removeOverlay, vibePreset, setVibePreset } = useStudio();

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div className="flex items-center justify-center">
        <h2
          className="text-center"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--fr-muted)",
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-gold)" }}>02</span>
          Style
        </h2>
      </div>

      {/* Vibe sub-section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fr-muted)" }}>Vibe</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {VIBE_PRESETS.map((preset) => {
            const active = (vibePreset ?? "none") === preset.filter;
            return (
              <button
                key={preset.name}
                onClick={() => setVibePreset(preset.filter === "none" ? null : preset.filter)}
                style={{
                  background: active ? "rgba(82,214,196,0.12)" : "var(--fr-surface)",
                  border: `1px solid ${active ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
                  color: active ? "var(--fr-gold)" : "var(--fr-muted)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.625rem",
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--fr-line)" }} />

      {/* Overlays sub-section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fr-muted)" }}>Overlays</span>
          <button
            onClick={addOverlay}
            style={{
              background: "rgba(82,214,196,0.1)",
              border: "1px solid rgba(82,214,196,0.25)",
              borderRadius: "20px",
              cursor: "pointer",
              color: "var(--fr-gold)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              fontSize: "0.6875rem",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-sans)",
            }}
            aria-label="Add text overlay"
          >
            <Plus size={11} />
            add
          </button>
        </div>
        {overlays.map((overlay, i) => (
          <OverlayEditor
            key={i}
            index={i}
            overlay={overlay}
            onUpdate={(patch) => updateOverlay(i, patch)}
            onRemove={overlays.length > 1 ? () => removeOverlay(i) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

interface EditorProps {
  index: number;
  overlay: TextOverlay;
  onUpdate: (patch: Partial<TextOverlay>) => void;
  onRemove?: () => void;
}

function OverlayEditor({ index, overlay, onUpdate, onRemove }: EditorProps) {
  return (
    <div
      style={{
        border: "1px solid var(--fr-line-2)",
        borderRadius: "12px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--fr-surface-2)",
      }}
    >
      {/* Overlay number */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.5625rem",
            color: "var(--fr-gold)",
            letterSpacing: "0.08em",
          }}
        >
          TEXT {String(index + 1).padStart(2, "0")}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--fr-line)",
              borderRadius: "20px",
              color: "var(--fr-muted)",
              cursor: "pointer",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: "0.5625rem",
              letterSpacing: "0.06em",
            }}
            aria-label="Remove overlay"
          >
            <Minus size={9} />
            remove
          </button>
        )}
      </div>

      {/* Text input */}
      <input
        type="text"
        value={overlay.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="type your overlay text…"
        aria-label="Overlay text"
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--fr-line-2)",
          borderRadius: "8px",
          outline: "none",
          color: "var(--fr-ivory)",
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.9375rem",
          padding: "8px 12px",
          caretColor: "var(--fr-gold)",
        }}
      />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <select
          value={overlay.font}
          onChange={(e) => onUpdate({ font: e.target.value as TextOverlay["font"] })}
          style={{
            background: "var(--fr-surface)",
            border: "1px solid var(--fr-line-2)",
            borderRadius: "8px",
            color: "var(--fr-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.6875rem",
            padding: "5px 8px",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          <option value="serif">serif</option>
          <option value="sans">sans</option>
          <option value="mono">mono</option>
        </select>

        <button
          onClick={() => onUpdate({ bold: !overlay.bold })}
          style={{
            background: overlay.bold ? "rgba(82,214,196,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${overlay.bold ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
            borderRadius: "8px",
            color: overlay.bold ? "var(--fr-gold)" : "var(--fr-muted)",
            fontWeight: 700,
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            width: 30,
            height: 30,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms ease",
          }}
          aria-pressed={overlay.bold}
          aria-label="Bold"
        >
          B
        </button>

        <button
          onClick={() => onUpdate({ italic: !overlay.italic })}
          style={{
            background: overlay.italic ? "rgba(82,214,196,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${overlay.italic ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
            borderRadius: "8px",
            color: overlay.italic ? "var(--fr-gold)" : "var(--fr-muted)",
            fontStyle: "italic",
            fontSize: "0.875rem",
            fontFamily: "var(--font-display), Georgia, serif",
            width: 30,
            height: 30,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms ease",
          }}
          aria-pressed={overlay.italic}
          aria-label="Italic"
        >
          i
        </button>

        <p
          style={{
            flex: 1,
            fontSize: "0.5625rem",
            letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.2)",
            textAlign: "right",
          }}
        >
          drag on preview to reposition
        </p>
      </div>
    </div>
  );
}
