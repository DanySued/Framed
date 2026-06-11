"use client";

import { KeyboardEvent, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useStudio, SceneKeyword } from "./StudioContext";

export default function ScenesPanel() {
  const { keywords, addKeyword, removeKeyword, setKeywordThumbnail } = useStudio();
  const [input, setInput] = useState("");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = input.trim().toLowerCase().replace(/,$/, "");
        if (val) {
          addKeyword(val);
          setInput("");
        }
      }
    },
    [input, addKeyword]
  );

  return (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{ borderLeft: "1px solid var(--fr-line)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--fr-line)" }}
      >
        <h4>Scenes</h4>
      </div>

      {/* Keyword input */}
      <div
        className="px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--fr-line)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="add keyword, press enter"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--fr-line)",
            outline: "none",
            color: "var(--fr-ivory)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.8125rem",
            padding: "6px 0",
            caretColor: "var(--fr-gold)",
          }}
        />
        <p
          className="fr-caption"
          style={{ fontSize: "0.625rem", marginTop: 4, letterSpacing: "0.06em" }}
        >
          press enter to add
        </p>
      </div>

      {/* Scene chips */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {keywords.length === 0 ? (
          <p
            className="fr-caption"
            style={{ textAlign: "center", marginTop: 24, fontStyle: "italic" }}
          >
            no scenes yet
          </p>
        ) : (
          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <AnimatePresence mode="popLayout">
              {keywords.map((kw) => (
                <SceneChip
                  key={kw.keyword}
                  kw={kw}
                  onRemove={() => removeKeyword(kw.keyword)}
                  onThumbnailLoaded={(thumb, id) =>
                    setKeywordThumbnail(kw.keyword, thumb, id)
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </aside>
  );
}

interface ChipProps {
  kw: SceneKeyword;
  onRemove: () => void;
  onThumbnailLoaded: (thumbnail: string | null, videoId: number | null) => void;
}

function SceneChip({ kw, onRemove, onThumbnailLoaded }: ChipProps) {
  const [thumbState, setThumbState] = useState<"loading" | "loaded" | "error">(
    kw.thumbnail ? "loaded" : "loading"
  );
  const fetched = useRef(false);

  // Fetch Pexels thumbnail once
  useState(() => {
    if (fetched.current || kw.thumbnail) return;
    fetched.current = true;

    fetch(`/api/reels/pexels/search?keywords=${encodeURIComponent(kw.keyword)}&per_page=1`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data: { videos: Array<{ id: number; url: string; image?: string }> }) => {
        const first = data.videos?.[0];
        if (first?.id) {
          // Prefer the `image` field from Pexels; fall back to CDN pattern
          const thumb =
            first.image ||
            `https://images.pexels.com/videos/${first.id}/pictures/preview-0.jpg`;
          onThumbnailLoaded(thumb, first.id);
          setThumbState("loaded");
        } else {
          setThumbState("error");
          onThumbnailLoaded(null, null);
        }
      })
      .catch(() => {
        setThumbState("error");
        onThumbnailLoaded(null, null);
      });
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative"
      style={{
        aspectRatio: "16 / 9",
        border: "1px solid var(--fr-line)",
        overflow: "hidden",
        background: "var(--fr-surface)",
        cursor: "default",
      }}
    >
      {/* Thumbnail / shimmer */}
      {thumbState === "loading" && (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, var(--fr-surface) 25%, rgba(42,37,28,0.8) 50%, var(--fr-surface) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
          }}
        />
      )}
      {thumbState === "loaded" && kw.thumbnail && (
        <img
          src={kw.thumbnail}
          alt={kw.keyword}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.7 }}
        />
      )}
      {thumbState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: "0.6rem", color: "var(--fr-muted)" }}>—</span>
        </div>
      )}

      {/* Dark gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(13,11,8,0.85) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Keyword label */}
      <span
        className="absolute bottom-0 left-0 px-2 py-1"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.625rem",
          letterSpacing: "0.08em",
          color: "var(--fr-ivory)",
          zIndex: 2,
          textTransform: "lowercase",
        }}
      >
        {kw.keyword}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: "rgba(13,11,8,0.7)",
          border: "1px solid var(--fr-line)",
          color: "var(--fr-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 2,
          padding: 0,
          zIndex: 3,
        }}
        aria-label={`Remove ${kw.keyword}`}
      >
        <X size={9} />
      </button>
    </motion.div>
  );
}
