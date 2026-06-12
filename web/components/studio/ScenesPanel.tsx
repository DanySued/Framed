"use client";

import { KeyboardEvent, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search } from "lucide-react";
import { toast } from "sonner";
import { useStudio, PickedClip } from "./StudioContext";

interface SearchResult {
  id: number;
  url: string;
  image: string | null;
  duration: number | null;
}

export default function ScenesPanel() {
  const {
    keywords,
    addKeyword,
    removeKeyword,
    setKeywordThumbnail,
    selectedClips,
    toggleClip,
    removeClip,
    duration,
  } = useStudio();

  const [input, setInput] = useState("");
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(
    async (kw: string) => {
      setSearching(true);
      setActiveKeyword(kw);
      setResults([]);
      try {
        const res = await fetch(
          `/api/reels/pexels/search?keywords=${encodeURIComponent(kw)}&per_page=10`
        );
        if (!res.ok) throw new Error();
        const data: { videos: SearchResult[] } = await res.json();
        const videos = data.videos ?? [];
        setResults(videos);
        if (videos[0]) {
          setKeywordThumbnail(kw, videos[0].image, videos[0].id);
        }
        if (!videos.length) toast.error(`No clips found for “${kw}”`);
      } catch {
        toast.error("Clip search failed — try again");
      } finally {
        setSearching(false);
      }
    },
    [setKeywordThumbnail]
  );

  const submit = useCallback(() => {
    const val = input.trim().toLowerCase().replace(/,$/, "");
    if (!val) return;
    addKeyword(val);
    setInput("");
    search(val);
  }, [input, addKeyword, search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  const targetClips = Math.max(1, Math.round(duration / 4));

  return (
    <aside
      className="flex flex-col min-h-[420px] lg:h-full overflow-hidden"
      style={{ borderRight: "1px solid var(--fr-line)", borderBottom: "1px solid var(--fr-line)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--fr-line)" }}
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
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-gold)" }}>01</span>
          Scenes
        </h2>
        <p className="fr-caption" style={{ fontSize: "0.625rem", marginTop: 4, letterSpacing: "0.06em" }}>
          start here — search a mood, pick your clips
        </p>
      </div>

      {/* Keyword input */}
      <div
        className="px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--fr-line)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={12} style={{ color: "var(--fr-muted)", flexShrink: 0 }} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ocean, neon city, rain…"
            aria-label="Search scene clips"
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
        </div>

        {/* Keyword chips */}
        {keywords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {keywords.map((kw) => {
              const active = kw.keyword === activeKeyword;
              return (
                <span
                  key={kw.keyword}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.625rem",
                    letterSpacing: "0.06em",
                    padding: "2px 7px",
                    border: `1px solid ${active ? "var(--fr-gold)" : "var(--fr-line)"}`,
                    color: active ? "var(--fr-gold)" : "var(--fr-muted)",
                    cursor: "pointer",
                  }}
                  onClick={() => search(kw.keyword)}
                  role="button"
                >
                  {kw.keyword}
                  <X
                    size={8}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyword(kw.keyword);
                      if (kw.keyword === activeKeyword) {
                        setActiveKeyword(null);
                        setResults([]);
                      }
                    }}
                  />
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected clips strip */}
      {selectedClips.length > 0 && (
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--fr-line)" }}
        >
          <p
            className="fr-overline"
            style={{ fontSize: "0.5625rem", marginBottom: 6, color: "var(--fr-gold)" }}
          >
            your cut · {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""}
            {selectedClips.length < targetClips ? ` · ~${targetClips} fills ${duration}s` : ""}
          </p>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            <AnimatePresence mode="popLayout">
              {selectedClips.map((clip, i) => (
                <motion.div
                  key={clip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="group relative shrink-0"
                  style={{
                    width: 42,
                    aspectRatio: "9 / 16",
                    border: "1px solid var(--fr-gold)",
                    overflow: "hidden",
                    background: "var(--fr-surface)",
                  }}
                >
                  {clip.image && (
                    <img
                      src={clip.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: 0.8 }}
                    />
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 3,
                      fontFamily: "monospace",
                      fontSize: "0.5rem",
                      color: "var(--fr-gold)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => removeClip(clip.id)}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{
                      background: "rgba(6,9,11,0.65)",
                      border: "none",
                      color: "var(--fr-ivory)",
                      cursor: "pointer",
                    }}
                    aria-label="Remove clip"
                  >
                    <X size={11} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {searching ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "9 / 16",
                  background:
                    "linear-gradient(90deg, var(--fr-surface) 25%, rgba(255,255,255,0.06) 50%, var(--fr-surface) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                  border: "1px solid var(--fr-line)",
                }}
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p
            className="fr-caption"
            style={{ textAlign: "center", marginTop: 32, fontStyle: "italic", lineHeight: 1.7, padding: "0 12px" }}
          >
            {keywords.length === 0
              ? "search a keyword above to browse clips — or just add keywords and let framed pick for you"
              : "click a keyword chip to browse its clips"}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {results.map((r) => {
              const picked = selectedClips.some((c) => c.id === r.id);
              const clip: PickedClip = {
                id: r.id,
                url: r.url,
                image: r.image,
                duration: r.duration,
                keyword: activeKeyword ?? "",
              };
              return (
                <button
                  key={r.id}
                  onClick={() => toggleClip(clip)}
                  className="relative"
                  style={{
                    aspectRatio: "9 / 16",
                    border: `1px solid ${picked ? "var(--fr-gold)" : "var(--fr-line)"}`,
                    boxShadow: picked ? "0 0 0 1px var(--fr-gold)" : "none",
                    overflow: "hidden",
                    background: "var(--fr-surface)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                  aria-pressed={picked}
                  aria-label={picked ? "Deselect clip" : "Select clip"}
                >
                  {r.image && (
                    <img
                      src={r.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: picked ? 0.95 : 0.7, transition: "opacity 150ms ease" }}
                    />
                  )}
                  {/* duration badge */}
                  {r.duration != null && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 5,
                        fontFamily: "monospace",
                        fontSize: "0.5625rem",
                        color: "var(--fr-ivory)",
                        background: "rgba(6,9,11,0.7)",
                        padding: "1px 4px",
                      }}
                    >
                      {r.duration}s
                    </span>
                  )}
                  {/* pick order */}
                  {picked && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 5,
                        fontFamily: "monospace",
                        fontSize: "0.625rem",
                        color: "#04110e",
                        background: "var(--fr-gold)",
                        padding: "1px 5px",
                      }}
                    >
                      {String(selectedClips.findIndex((c) => c.id === r.id) + 1).padStart(2, "0")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
