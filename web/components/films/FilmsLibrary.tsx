"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

interface ReelItem {
  id: string;
  title: string;
  keywords: string;
  duration: number;
  output_path: string;
  created_at: string;
}

export default function FilmsLibrary() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState<ReelItem | null>(null);

  useEffect(() => {
    fetch("/api/reels/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reels) setReels(data.reels);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 3rem)",
        background: "var(--fr-black)",
        padding: "40px 32px 64px",
      }}
    >
      {/* Page title */}
      <div
        style={{
          borderBottom: "1px solid var(--fr-line)",
          paddingBottom: 20,
          marginBottom: 32,
          display: "flex",
          alignItems: "baseline",
          gap: 20,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "1.25rem",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--fr-ivory)",
            letterSpacing: "0.02em",
            margin: 0,
          }}
        >
          films
        </h1>
        {!loading && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.6875rem",
              color: "var(--fr-muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(reels.length).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <ShimmerGrid />
      ) : reels.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
          className="sm:grid-cols-3 lg:grid-cols-4"
        >
          {reels.map((reel, i) => (
            <FilmCard
              key={reel.id}
              reel={reel}
              index={i}
              onClick={() => setFocused(reel)}
            />
          ))}
        </div>
      )}

      {/* Focused film overlay */}
      <AnimatePresence>
        {focused && (
          <FilmFocus reel={focused} onClose={() => setFocused(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FilmCard({
  reel,
  index,
  onClick,
}: {
  reel: ReelItem;
  index: number;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = `/api/reels/download/${reel.id}`;

  const date = reel.created_at
    ? new Date(reel.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: "easeOut" }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) { v.pause(); v.currentTime = 0; }
      }}
    >
      {/* Poster */}
      <div
        className="fr-card-hover"
        style={{
          aspectRatio: "9 / 16",
          background: "var(--fr-surface)",
          border: "1px solid var(--fr-line-2)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Frame index */}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            fontFamily: "monospace",
            fontSize: "0.5625rem",
            color: "rgba(242,237,227,0.4)",
            fontVariantNumeric: "tabular-nums",
            pointerEvents: "none",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Caption row */}
      <div
        style={{
          padding: "8px 2px 4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.75rem",
            fontStyle: "italic",
            color: "var(--fr-ivory)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {reel.title || reel.keywords.split(",")[0]?.trim() || "untitled"}
        </p>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.5625rem",
            color: "var(--fr-muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {date}
        </span>
      </div>
    </motion.div>
  );
}

function FilmFocus({ reel, onClose }: { reel: ReelItem; onClose: () => void }) {
  const src = `/api/reels/download/${reel.id}`;

  // Close on backdrop click
  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const date = reel.created_at
    ? new Date(reel.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(13,11,8,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        padding: 32,
      }}
    >
      {/* 9:16 video */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          height: "min(80vh, 520px)",
          aspectRatio: "9 / 16",
          border: "1px solid var(--fr-line)",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <video
          src={src}
          autoPlay
          controls
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </motion.div>

      {/* Info + actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 280,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "1.125rem",
              fontStyle: "italic",
              color: "var(--fr-ivory)",
              margin: "0 0 6px",
            }}
          >
            {reel.title || "untitled"}
          </p>
          {date && (
            <p style={{ fontFamily: "monospace", fontSize: "0.625rem", color: "var(--fr-muted)", margin: 0 }}>
              {date}
            </p>
          )}
          {reel.duration > 0 && (
            <p style={{ fontFamily: "monospace", fontSize: "0.625rem", color: "var(--fr-muted)", margin: "2px 0 0" }}>
              {reel.duration}s
            </p>
          )}
        </div>

        <a
          href={src}
          download
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.875rem",
            letterSpacing: "0.04em",
            color: "var(--fr-gold)",
            border: "1px solid var(--fr-gold)",
            padding: "8px 20px",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
            transition: "background 150ms ease, color 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--fr-gold)";
            e.currentTarget.style.color = "#04110e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fr-gold)";
          }}
        >
          download film
        </a>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.8125rem",
            color: "var(--fr-muted)",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
            letterSpacing: "0.04em",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fr-ivory)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fr-muted)"; }}
        >
          close ×
        </button>
      </div>
    </motion.div>
  );
}

function ShimmerGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "9 / 16" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, var(--fr-surface) 25%, var(--fr-line) 50%, var(--fr-surface) 75%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        gap: 16,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.9375rem",
          fontStyle: "italic",
          color: "var(--fr-muted)",
          textAlign: "center",
          maxWidth: 340,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        no films yet — your premieres will appear here
      </p>
      <Link
        href="/studio"
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "0.8125rem",
          letterSpacing: "0.04em",
          color: "var(--fr-gold)",
          textDecoration: "none",
          borderBottom: "1px solid var(--fr-line)",
          paddingBottom: 2,
          transition: "border-color 150ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--fr-gold)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--fr-line)";
        }}
      >
        open studio
      </Link>
    </div>
  );
}
