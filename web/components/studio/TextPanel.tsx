"use client";

import { useStudio, TextOverlay } from "./StudioContext";
import { Plus, Minus } from "lucide-react";

export default function TextPanel() {
  const { overlays, updateOverlay, addOverlay, removeOverlay } = useStudio();

  return (
    <div
      style={{
        borderTop: "1px solid var(--fr-line)",
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2
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
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-gold)" }}>03</span>
          Title
        </h2>
        <button
          onClick={addOverlay}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fr-muted)",
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: 0,
          }}
          aria-label="Add text overlay"
        >
          <Plus size={12} />
          <span className="fr-caption" style={{ fontSize: "0.625rem", letterSpacing: "0.08em" }}>
            add
          </span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

function OverlayEditor({ overlay, onUpdate, onRemove }: EditorProps) {
  return (
    <div
      style={{
        border: "1px solid var(--fr-line)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Text input */}
      <input
        type="text"
        value={overlay.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="overlay text…"
        aria-label="Overlay text"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--fr-line)",
          outline: "none",
          color: "var(--fr-ivory)",
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.9375rem",
          padding: "4px 0",
          caretColor: "var(--fr-gold)",
        }}
      />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Font selector */}
        <select
          value={overlay.font}
          onChange={(e) => onUpdate({ font: e.target.value as TextOverlay["font"] })}
          style={{
            background: "var(--fr-surface)",
            border: "1px solid var(--fr-line)",
            color: "var(--fr-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.6875rem",
            padding: "3px 6px",
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          <option value="serif">serif</option>
          <option value="sans">sans</option>
          <option value="mono">mono</option>
        </select>

        {/* Bold */}
        <button
          onClick={() => onUpdate({ bold: !overlay.bold })}
          style={{
            background: overlay.bold ? "rgba(82,214,196,0.12)" : "transparent",
            border: `1px solid ${overlay.bold ? "var(--fr-gold)" : "var(--fr-line)"}`,
            color: overlay.bold ? "var(--fr-gold)" : "var(--fr-muted)",
            fontWeight: 700,
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            width: 24,
            height: 24,
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

        {/* Italic */}
        <button
          onClick={() => onUpdate({ italic: !overlay.italic })}
          style={{
            background: overlay.italic ? "rgba(82,214,196,0.12)" : "transparent",
            border: `1px solid ${overlay.italic ? "var(--fr-gold)" : "var(--fr-line)"}`,
            color: overlay.italic ? "var(--fr-gold)" : "var(--fr-muted)",
            fontStyle: "italic",
            fontSize: "0.75rem",
            fontFamily: "var(--font-display), Georgia, serif",
            width: 24,
            height: 24,
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

        <div style={{ flex: 1 }} />

        {/* Remove overlay */}
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              color: "var(--fr-muted)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Remove overlay"
          >
            <Minus size={12} />
          </button>
        )}
      </div>

      {/* Position hint */}
      <p
        className="fr-caption"
        style={{ fontSize: "0.5625rem", letterSpacing: "0.06em", color: "var(--fr-muted)" }}
      >
        drag to reposition on canvas
      </p>
    </div>
  );
}
