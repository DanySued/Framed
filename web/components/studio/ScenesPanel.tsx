"use client";

import { KeyboardEvent, useCallback, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, SlidersHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { useStudio, PickedClip } from "./StudioContext";

interface SearchResult {
  id: number;
  url: string;
  image: string | null;
  duration: number | null;
}

const TAG_CHIPS = [
  { label: "Nature", query: "nature" },
  { label: "City", query: "city night" },
  { label: "People", query: "people lifestyle" },
  { label: "Abstract", query: "abstract motion" },
  { label: "Aerial", query: "aerial drone" },
  { label: "Ocean", query: "ocean waves" },
  { label: "Golden Hour", query: "golden hour sunset" },
  { label: "Slow Mo", query: "slow motion" },
  { label: "Rain", query: "rain cinematic" },
  { label: "Architecture", query: "architecture modern" },
];

type OrientationFilter = "all" | "portrait" | "landscape";
type DurationFilter = "all" | "short" | "medium" | "long";

function matchesOrientation(r: SearchResult, f: OrientationFilter): boolean {
  // We don't have dimension data from the API, so we pass all through for now
  // (Pexels API can be extended later with orientation param)
  return true;
}

function matchesDuration(r: SearchResult, f: DurationFilter): boolean {
  if (f === "all" || r.duration == null) return true;
  if (f === "short") return r.duration <= 8;
  if (f === "medium") return r.duration > 8 && r.duration <= 20;
  if (f === "long") return r.duration > 20;
  return true;
}

interface ClipCardProps {
  r: SearchResult;
  picked: boolean;
  clip: PickedClip;
  pickIndex: number;
  toggleClip: (clip: PickedClip) => void;
}

function ClipCard({ r, picked, clip, pickIndex, toggleClip }: ClipCardProps) {
  const [hovered, setHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setVideoReady(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setVideoReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <motion.button
      onClick={() => toggleClip(clip)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      style={{
        aspectRatio: "9 / 16",
        border: `1px solid ${picked ? "var(--fr-gold)" : "var(--fr-line)"}`,
        boxShadow: picked ? "0 0 0 1px var(--fr-gold)" : "none",
        overflow: "hidden",
        background: "var(--fr-surface)",
        cursor: "pointer",
        padding: 0,
        transition: "border-color 150ms ease, box-shadow 150ms ease",
        position: "relative",
      }}
      aria-pressed={picked}
      aria-label={picked ? "Deselect clip" : "Select clip"}
    >
      {/* thumbnail */}
      {r.image && (
        <img
          src={r.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: hovered && videoReady ? 0 : picked ? 0.95 : 0.7,
            transition: "opacity 200ms ease",
          }}
        />
      )}

      {/* hover video */}
      {hovered && r.url && (
        <video
          ref={videoRef}
          src={r.url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: videoReady ? 1 : 0, transition: "opacity 200ms ease" }}
          onCanPlay={() => setVideoReady(true)}
          onWaiting={() => setVideoReady(false)}
        />
      )}

      {/* loading spinner while video buffers */}
      {hovered && !videoReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              border: "2px solid rgba(82,214,196,0.25)",
              borderTopColor: "var(--fr-gold)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
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
          {String(pickIndex + 1).padStart(2, "0")}
        </span>
      )}
    </motion.button>
  );
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>("all");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");

  const PER_PAGE = 18;

  const filteredResults = useMemo(() => {
    return results.filter(
      (r) =>
        matchesOrientation(r, orientationFilter) &&
        matchesDuration(r, durationFilter)
    );
  }, [results, orientationFilter, durationFilter]);

  const fetchPage = useCallback(
    async (kw: string, pg: number, append: boolean) => {
      try {
        const res = await fetch(
          `/api/reels/pexels/search?keywords=${encodeURIComponent(kw)}&per_page=${PER_PAGE}&page=${pg}`
        );
        if (!res.ok) throw new Error();
        const data: { videos: SearchResult[] } = await res.json();
        const videos = data.videos ?? [];
        if (append) {
          setResults((prev) => [...prev, ...videos]);
        } else {
          setResults(videos);
          if (videos[0]) setKeywordThumbnail(kw, videos[0].image, videos[0].id);
          if (!videos.length) toast.error(`No clips found for "${kw}"`);
        }
        setPage(pg);
        setHasMore(videos.length === PER_PAGE);
      } catch {
        toast.error("Clip search failed — try again");
      }
    },
    [setKeywordThumbnail]
  );

  const search = useCallback(
    async (kw: string) => {
      setSearching(true);
      setActiveKeyword(kw);
      setResults([]);
      setPage(1);
      setHasMore(false);
      await fetchPage(kw, 1, false);
      setSearching(false);
    },
    [fetchPage]
  );

  const loadMore = useCallback(async () => {
    if (!activeKeyword || loadingMore) return;
    setLoadingMore(true);
    await fetchPage(activeKeyword, page + 1, true);
    setLoadingMore(false);
  }, [activeKeyword, page, loadingMore, fetchPage]);

  const handleTagClick = useCallback(
    (query: string, label: string) => {
      addKeyword(label.toLowerCase());
      search(query);
    },
    [addKeyword, search]
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
  const hasActiveFilters = orientationFilter !== "all" || durationFilter !== "all";

  return (
    <section
      className="flex flex-col w-full"
      aria-label="Clip browser"
    >
      {/* ── Hero search bar ─────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--fr-line)",
          padding: "16px 24px 14px",
        }}
      >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.625rem",
              color: "var(--fr-gold)",
              letterSpacing: "0.06em",
            }}
          >
            01
          </span>
          <h2
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fr-muted)",
            }}
          >
            Choose your clips
          </h2>
        </div>

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--fr-surface-2)",
            border: "1px solid var(--fr-line-2)",
            padding: "10px 14px",
            transition: "border-color 150ms ease",
          }}
        >
          <Search size={14} style={{ color: "var(--fr-muted)", flexShrink: 0 }} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search a mood, place, or feeling…"
            aria-label="Search clips"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--fr-ivory)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              caretColor: "var(--fr-gold)",
            }}
          />
          {input && (
            <button
              onClick={submit}
              style={{
                background: "var(--fr-gold)",
                color: "#04110e",
                border: "none",
                padding: "3px 10px",
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Search
            </button>
          )}
        </div>

        {/* Tag chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
          }}
        >
          {TAG_CHIPS.map((tag) => {
            const isActive = activeKeyword === tag.query || keywords.some((k) => k.keyword === tag.label.toLowerCase());
            return (
              <button
                key={tag.label}
                onClick={() => handleTagClick(tag.query, tag.label)}
                style={{
                  background: isActive ? "rgba(82,214,196,0.12)" : "var(--fr-surface-2)",
                  border: `1px solid ${isActive ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
                  color: isActive ? "var(--fr-gold)" : "var(--fr-muted)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.04em",
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(82,214,196,0.4)";
                    e.currentTarget.style.color = "var(--fr-ivory)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--fr-line-2)";
                    e.currentTarget.style.color = "var(--fr-muted)";
                  }
                }}
              >
                {tag.label}
              </button>
            );
          })}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{
              background: showFilters || hasActiveFilters ? "rgba(82,214,196,0.12)" : "transparent",
              border: `1px solid ${showFilters || hasActiveFilters ? "var(--fr-gold)" : "var(--fr-line)"}`,
              color: showFilters || hasActiveFilters ? "var(--fr-gold)" : "var(--fr-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.6875rem",
              letterSpacing: "0.04em",
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 150ms ease",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
            aria-pressed={showFilters}
          >
            <SlidersHorizontal size={11} />
            Filters{hasActiveFilters ? " ·" : ""}
          </button>
        </div>

        {/* Filters row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "10px 12px",
                  background: "var(--fr-surface-2)",
                  border: "1px solid var(--fr-line)",
                }}
              >
                {/* Duration filter */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: "0.5625rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--fr-muted)",
                      fontFamily: "var(--font-mono), monospace",
                      minWidth: 52,
                    }}
                  >
                    Duration
                  </span>
                  {(["all", "short", "medium", "long"] as DurationFilter[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDurationFilter(opt)}
                      style={{
                        background: durationFilter === opt ? "var(--fr-gold)" : "transparent",
                        color: durationFilter === opt ? "#04110e" : "var(--fr-muted)",
                        border: `1px solid ${durationFilter === opt ? "var(--fr-gold)" : "var(--fr-line)"}`,
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.625rem",
                        letterSpacing: "0.04em",
                        padding: "3px 9px",
                        cursor: "pointer",
                        transition: "all 120ms ease",
                        textTransform: "capitalize",
                      }}
                    >
                      {opt === "short" ? "≤8s" : opt === "medium" ? "9–20s" : opt === "long" ? ">20s" : "All"}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User keyword chips */}
        {keywords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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
                    padding: "3px 8px",
                    border: `1px solid ${active ? "var(--fr-gold)" : "var(--fr-line)"}`,
                    color: active ? "var(--fr-gold)" : "var(--fr-muted)",
                    cursor: "pointer",
                    background: active ? "rgba(82,214,196,0.08)" : "transparent",
                    transition: "all 120ms ease",
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
      </div>

      {/* ── Selected clips strip ────────────────────────────────── */}
      <AnimatePresence>
        {selectedClips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderBottom: "1px solid var(--fr-line)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 24px" }}>
              <p
                style={{
                  fontSize: "0.5625rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--fr-gold)",
                  fontFamily: "var(--font-mono), monospace",
                  marginBottom: 8,
                }}
              >
                your cut · {selectedClips.length} clip{selectedClips.length > 1 ? "s" : ""}
                {selectedClips.length < targetClips ? ` · ~${targetClips} fills ${duration}s` : ""}
              </p>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
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
                        width: 44,
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results grid ────────────────────────────────────────── */}
      <div style={{ padding: "16px 24px", flex: 1 }}>
        {searching ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
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
        ) : filteredResults.length === 0 && results.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "1rem",
                fontStyle: "italic",
                color: "var(--fr-muted)",
                lineHeight: 1.7,
                marginBottom: 8,
              }}
            >
              {keywords.length === 0
                ? "pick a mood above, or search for a scene"
                : "click a keyword chip to browse its clips"}
            </p>
            {keywords.length === 0 && (
              <p
                style={{
                  fontSize: "0.6875rem",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.04em",
                }}
              >
                ocean · golden hour · city night · …
              </p>
            )}
          </div>
        ) : filteredResults.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "32px 0",
              fontStyle: "italic",
              fontSize: "0.8125rem",
              color: "var(--fr-muted)",
            }}
          >
            No clips match the current filters
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            {filteredResults.map((r) => {
              const picked = selectedClips.some((c) => c.id === r.id);
              const clip: PickedClip = {
                id: r.id,
                url: r.url,
                image: r.image,
                duration: r.duration,
                keyword: activeKeyword ?? "",
              };
              return (
                <ClipCard
                  key={r.id}
                  r={r}
                  picked={picked}
                  clip={clip}
                  pickIndex={selectedClips.findIndex((c) => c.id === r.id)}
                  toggleClip={toggleClip}
                />
              );
            })}

            {/* load more placeholder */}
            {hasMore && (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  aspectRatio: "9 / 16",
                  border: "1px dashed var(--fr-line)",
                  background: "transparent",
                  cursor: loadingMore ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 0,
                  transition: "border-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) e.currentTarget.style.borderColor = "rgba(82,214,196,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--fr-line)";
                }}
                aria-label="Load more clips"
              >
                {loadingMore ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: "2px solid rgba(82,214,196,0.25)",
                      borderTopColor: "var(--fr-gold)",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                ) : (
                  <>
                    <Plus size={16} style={{ color: "var(--fr-muted)" }} />
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: "0.5625rem",
                        letterSpacing: "0.08em",
                        color: "var(--fr-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      More
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
