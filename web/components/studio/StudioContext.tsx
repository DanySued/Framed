"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Matches TextOverlayItem in api/models/schemas.py exactly
export interface TextOverlay {
  text: string;
  x: number;   // % from left, 0–100
  y: number;   // % from top,  0–100
  font: "sans" | "serif" | "mono";
  bold: boolean;
  italic: boolean;
}

export interface SceneKeyword {
  keyword: string;
  thumbnail: string | null; // resolved after Pexels fetch
  videoId: number | null;
}

export interface PickedClip {
  id: number;
  url: string;            // direct video file URL (Pexels)
  image: string | null;
  duration: number | null;
  keyword: string;
  trimStart?: number;     // seconds from clip start
  trimEnd?: number;       // seconds from clip start
}

export type StudioPhase =
  | "compose"
  | "generating"
  | "approval"
  | "rendering"
  | "done";

export interface JobStatus {
  job_id: string;
  reel_id: string | null;
  status: "queued" | "processing" | "awaiting_clip_approval" | "done" | "failed";
  progress: number;
  phase: number;
  phase_progress: number;
  error_message: string | null;
  clip_count: number | null;
  stage: string | null;
  reels_done: number;
  reels_total: number;
  srt_path: string | null;
}

export interface JobEntry {
  jobId: string;
  status: JobStatus | null;
}

interface StudioState {
  // Audio
  audioFileId: string | null;
  audioName: string | null;
  songStartTime: number;

  // Scenes
  keywords: SceneKeyword[];
  // Clips the user hand-picked (clip-first flow). Empty = let the API pick.
  selectedClips: PickedClip[];

  // Reel settings
  duration: number; // 15–60
  subtitlesEnabled: boolean;
  bulkCount: number; // 1–5

  // Text overlays
  overlays: TextOverlay[];

  // Cinematic filter preset (CSS filter string or null)
  vibePreset: string | null;

  // Workflow phase
  phase: StudioPhase;

  // Generation jobs
  jobs: JobEntry[];
  // Index of the job currently shown in approval UI
  approvalJobIndex: number;
  // Override media shown in PreviewFrame (clip preview or final video)
  previewOverride: string | null;
}

interface StudioActions {
  setAudio: (id: string, name: string) => void;
  clearAudio: () => void;
  setSongStartTime: (t: number) => void;

  addKeyword: (kw: string) => void;
  removeKeyword: (kw: string) => void;
  setKeywordThumbnail: (kw: string, thumbnail: string | null, videoId: number | null) => void;

  toggleClip: (clip: PickedClip) => void;
  removeClip: (id: number) => void;
  trimClip: (id: number, start: number, end: number) => void;
  reorderClips: (from: number, to: number) => void;

  setDuration: (d: number) => void;
  setSubtitlesEnabled: (v: boolean) => void;
  setBulkCount: (n: number) => void;

  setOverlays: (overlays: TextOverlay[]) => void;
  updateOverlay: (index: number, patch: Partial<TextOverlay>) => void;
  addOverlay: () => void;
  removeOverlay: (index: number) => void;

  setVibePreset: (v: string | null) => void;

  setPhase: (p: StudioPhase) => void;
  setPreviewOverride: (src: string | null) => void;

  onGenerate: () => void;
  onApproveClips: (jobId: string) => Promise<void>;
  onReset: () => void;
}

type StudioContextValue = StudioState & StudioActions;

const StudioContext = createContext<StudioContextValue | null>(null);

export const VIBE_PRESETS: Array<{ name: string; filter: string; emoji: string }> = [
  { name: "Natural", filter: "none", emoji: "○" },
  { name: "Golden", filter: "saturate(1.3) sepia(0.2) contrast(1.08) brightness(1.05)", emoji: "◑" },
  { name: "Noir", filter: "grayscale(0.85) contrast(1.25) brightness(0.9)", emoji: "●" },
  { name: "Faded", filter: "saturate(0.7) contrast(0.88) brightness(1.08) sepia(0.08)", emoji: "◔" },
  { name: "Neon", filter: "saturate(1.7) contrast(1.12) hue-rotate(-15deg)", emoji: "◕" },
];

const DEFAULT_OVERLAY: TextOverlay = {
  text: "",
  x: 50,
  y: 82,
  font: "serif",
  bold: false,
  italic: false,
};

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [audioFileId, setAudioFileId] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [songStartTime, setSongStartTime] = useState(0);
  const [keywords, setKeywords] = useState<SceneKeyword[]>([]);
  const [selectedClips, setSelectedClips] = useState<PickedClip[]>([]);
  const [duration, setDuration] = useState(30);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [overlays, setOverlays] = useState<TextOverlay[]>([{ ...DEFAULT_OVERLAY }]);
  const [phase, setPhase] = useState<StudioPhase>("compose");
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [approvalJobIndex, setApprovalJobIndex] = useState(0);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [vibePreset, setVibePreset] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll all active jobs
  const pollJobs = useCallback(async (jobIds: string[]) => {
    const results = await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          const res = await fetch(`/api/reels/job/${jobId}`);
          if (!res.ok) return null;
          return (await res.json()) as JobStatus;
        } catch {
          return null;
        }
      })
    );

    setJobs((prev) =>
      prev.map((j, i) => ({
        ...j,
        status: results[i] ?? j.status,
      }))
    );

    return results;
  }, []);

  // Derive phase from job statuses
  const derivePhase = useCallback((statuses: (JobStatus | null)[]): StudioPhase => {
    const valid = statuses.filter(Boolean) as JobStatus[];
    if (!valid.length) return "generating";

    const anyFailed = valid.some((s) => s.status === "failed");
    if (anyFailed) return "compose";

    const allDone = valid.every((s) => s.status === "done");
    if (allDone) return "done";

    const anyApproval = valid.some((s) => s.status === "awaiting_clip_approval");
    if (anyApproval) return "approval";

    const anyPhase2 = valid.some(
      (s) => s.status === "processing" && s.phase === 2
    );
    if (anyPhase2) return "rendering";

    return "generating";
  }, []);

  // Start polling after jobs are created
  const startPolling = useCallback(
    (jobIds: string[]) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        const results = await pollJobs(jobIds);
        const newPhase = derivePhase(results);

        setPhase(newPhase);

        if (newPhase === "approval") {
          // Find first job awaiting approval
          const awaitingIdx = results.findIndex(
            (s) => s?.status === "awaiting_clip_approval"
          );
          if (awaitingIdx >= 0) setApprovalJobIndex(awaitingIdx);
        }

        if (newPhase === "done" || newPhase === "compose") {
          stopPolling();
          if (newPhase === "compose") {
            // Failed — show error
            const failed = results.find((s) => s?.status === "failed");
            toast.error(failed?.error_message ?? "Generation failed");
          }
        }
      }, 1500);
    },
    [stopPolling, pollJobs, derivePhase]
  );

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const setAudio = useCallback((id: string, name: string) => {
    setAudioFileId(id);
    setAudioName(name);
  }, []);

  const clearAudio = useCallback(() => {
    setAudioFileId(null);
    setAudioName(null);
    setSongStartTime(0);
  }, []);

  const addKeyword = useCallback((kw: string) => {
    const normalized = kw.trim().toLowerCase();
    if (!normalized) return;
    setKeywords((prev) => {
      if (prev.some((k) => k.keyword === normalized)) return prev;
      return [...prev, { keyword: normalized, thumbnail: null, videoId: null }];
    });
  }, []);

  const removeKeyword = useCallback((kw: string) => {
    setKeywords((prev) => prev.filter((k) => k.keyword !== kw));
    setSelectedClips((prev) => prev.filter((c) => c.keyword !== kw));
  }, []);

  const toggleClip = useCallback((clip: PickedClip) => {
    setSelectedClips((prev) =>
      prev.some((c) => c.id === clip.id)
        ? prev.filter((c) => c.id !== clip.id)
        : [...prev, clip]
    );
  }, []);

  const removeClip = useCallback((id: number) => {
    setSelectedClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const trimClip = useCallback((id: number, start: number, end: number) => {
    setSelectedClips((prev) =>
      prev.map((c) => c.id === id ? { ...c, trimStart: start, trimEnd: end } : c)
    );
  }, []);

  const setKeywordThumbnail = useCallback(
    (kw: string, thumbnail: string | null, videoId: number | null) => {
      setKeywords((prev) =>
        prev.map((k) => (k.keyword === kw ? { ...k, thumbnail, videoId } : k))
      );
    },
    []
  );

  const updateOverlay = useCallback((index: number, patch: Partial<TextOverlay>) => {
    setOverlays((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...patch } : o))
    );
  }, []);

  const addOverlay = useCallback(() => {
    setOverlays((prev) => [...prev, { ...DEFAULT_OVERLAY }]);
  }, []);

  const removeOverlay = useCallback((index: number) => {
    setOverlays((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onGenerate = useCallback(async () => {
    if (!audioFileId || (keywords.length < 1 && selectedClips.length < 1)) return;

    const title =
      keywords.map((k) => k.keyword).join(", ") || "selected scenes";

    try {
      setPhase("generating");
      setJobs([]);
      setPreviewOverride(null);

      // Fire N generate requests for bulk
      const requests = Array.from({ length: bulkCount }, () =>
        fetch("/api/reels/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords: keywords.map((k) => k.keyword),
            audioFileId,
            duration,
            title,
            songStartTime,
            overlays,
            subtitlesEnabled,
            selectedClips: selectedClips.map((c) => ({
              url: c.url,
              duration: c.duration,
              trim_start: c.trimStart,
              trim_end: c.trimEnd,
            })),
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Generation failed");
          }
          return res.json() as Promise<{ job_id: string }>;
        })
      );

      const responses = await Promise.all(requests);
      const jobIds = responses.map((r) => r.job_id);

      setJobs(jobIds.map((jobId) => ({ jobId, status: null })));
      setApprovalJobIndex(0);
      startPolling(jobIds);
    } catch (err) {
      setPhase("compose");
      toast.error(err instanceof Error ? err.message : "Generation failed");
    }
  }, [
    audioFileId,
    keywords,
    selectedClips,
    duration,
    subtitlesEnabled,
    bulkCount,
    overlays,
    songStartTime,
    startPolling,
  ]);

  const onApproveClips = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(`/api/reels/clips/${jobId}/approve`, { method: "POST" });
        if (!res.ok) throw new Error("Approve failed");

        // Check if there are more jobs awaiting approval
        setJobs((prev) => {
          const nextAwaitingIdx = prev.findIndex(
            (j, i) =>
              i !== prev.findIndex((jj) => jj.jobId === jobId) &&
              j.status?.status === "awaiting_clip_approval"
          );
          if (nextAwaitingIdx >= 0) {
            setApprovalJobIndex(nextAwaitingIdx);
            setPhase("approval");
          } else {
            setPhase("rendering");
          }
          return prev;
        });
      } catch {
        toast.error("Failed to approve clips");
      }
    },
    []
  );

  const onReset = useCallback(() => {
    stopPolling();
    setPhase("compose");
    setJobs([]);
    setApprovalJobIndex(0);
    setPreviewOverride(null);
  }, [stopPolling]);

  const value: StudioContextValue = {
    audioFileId,
    audioName,
    songStartTime,
    keywords,
    selectedClips,
    duration,
    subtitlesEnabled,
    bulkCount,
    overlays,
    phase,
    jobs,
    approvalJobIndex,
    previewOverride,
    vibePreset,

    setAudio,
    clearAudio,
    setSongStartTime,
    addKeyword,
    removeKeyword,
    setKeywordThumbnail,
    toggleClip,
    removeClip,
    trimClip,
    setDuration,
    setSubtitlesEnabled,
    setBulkCount,
    setOverlays,
    updateOverlay,
    addOverlay,
    removeOverlay,
    setPhase,
    setPreviewOverride,
    setVibePreset,
    onGenerate,
    onApproveClips,
    onReset,
  };

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
