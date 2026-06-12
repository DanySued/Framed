"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useStudio } from "./StudioContext";

interface ClipMeta {
  index: number;
  duration: number | null;
}

export default function ClipRail() {
  const { phase, jobs, approvalJobIndex, onApproveClips, setPreviewOverride } = useStudio();
  const [clips, setClips] = useState<ClipMeta[]>([]);
  const [replacing, setReplacing] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  // Cache-bust tokens per clip index
  const [cacheBust, setCacheBust] = useState<Record<number, number>>({});

  const activeJob = jobs[approvalJobIndex];
  const jobId = activeJob?.jobId;
  const clipCount = activeJob?.status?.clip_count ?? 0;

  // Load clip list when entering approval
  useEffect(() => {
    if (phase !== "approval" || !jobId) return;
    if (clipCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClips(
        Array.from({ length: clipCount }, (_, i) => ({ index: i, duration: null }))
      );
    } else {
      // Fetch to get count
      fetch(`/api/reels/clips/${jobId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) {
            toast.error("Couldn't load clips — retry in a moment");
            return;
          }
          // data could be an array or { clips: [] }
          const list: { index?: number; duration?: number }[] = Array.isArray(data)
            ? data
            : data.clips ?? [];
          setClips(
            list.map((c, i) => ({
              index: c.index ?? i,
              duration: c.duration ?? null,
            }))
          );
        })
        .catch(() => {
          toast.error("Couldn't load clips — retry in a moment");
        });
    }
  }, [phase, jobId, clipCount]);

  const handleReplace = useCallback(
    async (idx: number) => {
      if (!jobId) return;
      setReplacing((prev) => new Set(prev).add(idx));
      try {
        await fetch(`/api/reels/clips/${jobId}/replace/${idx}`, { method: "POST" });
        setCacheBust((prev) => ({ ...prev, [idx]: Date.now() }));
      } finally {
        setReplacing((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }
    },
    [jobId]
  );

  const handleApprove = useCallback(async () => {
    if (!jobId || approving) return;
    setApproving(true);
    try {
      await onApproveClips(jobId);
    } finally {
      setApproving(false);
    }
  }, [jobId, approving, onApproveClips]);

  if (phase !== "approval" || !jobId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 32, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          borderLeft: "1px solid var(--fr-line)",
          background: "var(--fr-surface)",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: "1px solid var(--fr-line)",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              color: "var(--fr-muted)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            review clips
          </p>
        </div>

        {/* Clip cards */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 12px 0",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {clips.map((clip) => (
            <ClipCard
              key={clip.index}
              jobId={jobId}
              index={clip.index}
              isReplacing={replacing.has(clip.index)}
              cacheBust={cacheBust[clip.index] ?? 0}
              onReplace={handleReplace}
              onSelect={(src) => setPreviewOverride(src)}
            />
          ))}
          {clips.length === 0 && (
            <p
              style={{
                color: "var(--fr-muted)",
                fontSize: "0.75rem",
                fontStyle: "italic",
                padding: "20px 8px",
                textAlign: "center",
              }}
            >
              loading clips…
            </p>
          )}
        </div>

        {/* Approve footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--fr-line)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleApprove}
            disabled={approving}
            style={{
              width: "100%",
              padding: "9px 0",
              background: "transparent",
              border: "1px solid var(--fr-gold)",
              color: approving ? "var(--fr-muted)" : "var(--fr-gold)",
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.875rem",
              letterSpacing: "0.04em",
              cursor: approving ? "not-allowed" : "pointer",
              transition: "background 200ms ease, color 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (approving) return;
              e.currentTarget.style.background = "var(--fr-gold)";
              e.currentTarget.style.color = "#04110e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = approving ? "var(--fr-muted)" : "var(--fr-gold)";
            }}
          >
            {approving ? "approving…" : "approve all →"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ClipCardProps {
  jobId: string;
  index: number;
  isReplacing: boolean;
  cacheBust: number;
  onReplace: (index: number) => void;
  onSelect: (src: string) => void;
}

function ClipCard({ jobId, index, isReplacing, cacheBust, onReplace, onSelect }: ClipCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = `/api/reels/clips/${jobId}/${index}${cacheBust ? `?t=${cacheBust}` : ""}`;

  const handleMouseEnter = useCallback(() => {
    const v = videoRef.current;
    if (!v || isReplacing) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [isReplacing]);

  const handleMouseLeave = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, []);

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "9 / 16",
        width: "100%",
        background: "var(--fr-black)",
        border: "1px solid var(--fr-line)",
        overflow: "hidden",
        cursor: "pointer",
        flexShrink: 0,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(src)}
    >
      {/* Clip index badge */}
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          zIndex: 5,
          fontFamily: "monospace",
          fontSize: "0.625rem",
          color: "var(--fr-muted)",
          fontVariantNumeric: "tabular-nums",
          pointerEvents: "none",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Video */}
      {isReplacing ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, var(--fr-surface) 25%, var(--fr-line) 50%, var(--fr-surface) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s ease-in-out infinite",
          }}
        />
      ) : (
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
      )}

      {/* Swap button */}
      {!isReplacing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReplace(index);
          }}
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 5,
            background: "rgba(6,9,11,0.8)",
            border: "1px solid var(--fr-line)",
            color: "var(--fr-gold)",
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "0.6875rem",
            letterSpacing: "0.06em",
            padding: "3px 8px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "background 150ms ease",
          }}
        >
          swap
        </button>
      )}
    </div>
  );
}
