"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DRAFT_KEY = "framed:studio:draft";

interface DraftSnapshot {
  selectedClips: PickedClip[];
  keywords: SceneKeyword[];
  audioFileId: string | null;
  audioName: string | null;
  songStartTime: number;
  duration: number;
  subtitlesEnabled: boolean;
  transitionsEnabled: boolean;
  bulkCount: number;
  overlays: TextOverlay[];
  vibePreset: string | null;
  savedAt: number; // epoch ms
}

function loadDraft(): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

function saveDraft(snap: DraftSnapshot) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
  } catch {}
}

function deleteDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

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

type HistoryEntry = Omit<DraftSnapshot, "savedAt">;
const MAX_HISTORY = 50;

interface StudioState {
  // Undo/redo
  canUndo: boolean;
  canRedo: boolean;

  // Audio
  audioFileId: string | null;
  audioName: string | null;
  songStartTime: number;

  // Scenes
  keywords: SceneKeyword[];
  selectedClips: PickedClip[];

  // Reel settings
  duration: number; // 15–60
  subtitlesEnabled: boolean;
  transitionsEnabled: boolean;
  bulkCount: number; // 1–5

  // Text overlays
  overlays: TextOverlay[];

  // Cinematic filter preset (CSS filter string or null)
  vibePreset: string | null;

  // Workflow phase
  phase: StudioPhase;

  // Generation jobs
  jobs: JobEntry[];
  approvalJobIndex: number;
  previewOverride: string | null;

  // Playback
  isPlaying: boolean;
  currentTime: number;     // seconds along the full clip sequence
  activeClipIndex: number; // derived from currentTime
  totalDuration: number;   // sum of effective clip durations
}

interface StudioActions {
  undo: () => void;
  redo: () => void;

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
  setTransitionsEnabled: (v: boolean) => void;
  setBulkCount: (n: number) => void;

  setOverlays: (overlays: TextOverlay[]) => void;
  updateOverlay: (index: number, patch: Partial<TextOverlay>) => void;
  addOverlay: () => void;
  removeOverlay: (index: number) => void;

  setVibePreset: (v: string | null) => void;

  setPhase: (p: StudioPhase) => void;
  setPreviewOverride: (src: string | null) => void;

  // Draft persistence
  draftRestoredAt: number | null; // epoch ms when draft was loaded, null if fresh
  clearDraft: () => void;

  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (t: number) => void;

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
  // Hydrate from draft on first render (localStorage is client-only)
  const draft = typeof window !== "undefined" ? loadDraft() : null;
  const hasDraft = draft !== null && (draft.selectedClips.length > 0 || draft.keywords.length > 0);

  const [audioFileId, setAudioFileId] = useState<string | null>(draft?.audioFileId ?? null);
  const [audioName, setAudioName] = useState<string | null>(draft?.audioName ?? null);
  const [songStartTime, setSongStartTime] = useState(draft?.songStartTime ?? 0);
  const [keywords, setKeywords] = useState<SceneKeyword[]>(draft?.keywords ?? []);
  const [selectedClips, setSelectedClips] = useState<PickedClip[]>(draft?.selectedClips ?? []);
  const [duration, setDuration] = useState(draft?.duration ?? 30);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(draft?.subtitlesEnabled ?? false);
  const [transitionsEnabled, setTransitionsEnabled] = useState(draft?.transitionsEnabled ?? true);
  const [bulkCount, setBulkCount] = useState(draft?.bulkCount ?? 1);
  const [overlays, setOverlays] = useState<TextOverlay[]>(draft?.overlays ?? [{ ...DEFAULT_OVERLAY }]);
  const [phase, setPhase] = useState<StudioPhase>("compose");
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [approvalJobIndex, setApprovalJobIndex] = useState(0);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [vibePreset, setVibePreset] = useState<string | null>(draft?.vibePreset ?? null);
  const [draftRestoredAt] = useState<number | null>(hasDraft ? (draft?.savedAt ?? Date.now()) : null);

  // ── Playback clock ─────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  // Keep a ref of selectedClips for rAF without stale closure
  const clipsRef = useRef(selectedClips);
  useEffect(() => { clipsRef.current = selectedClips; }, [selectedClips]);

  function clipEffDur(c: PickedClip) {
    const raw = c.duration ?? 5;
    return (c.trimEnd ?? raw) - (c.trimStart ?? 0);
  }

  const totalDuration = selectedClips.reduce((s, c) => s + clipEffDur(c), 0);

  const activeClipIndex = (() => {
    let elapsed = 0;
    for (let i = 0; i < selectedClips.length; i++) {
      elapsed += clipEffDur(selectedClips[i]);
      if (currentTime < elapsed) return i;
    }
    return Math.max(0, selectedClips.length - 1);
  })();

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      return;
    }
    function tick(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.1); // cap dt at 100ms
      lastTsRef.current = ts;
      const total = clipsRef.current.reduce((s, c) => s + clipEffDur(c), 0);
      const next = Math.min(currentTimeRef.current + dt, total);
      currentTimeRef.current = next;
      frameRef.current++;
      if (frameRef.current % 2 === 0) setCurrentTime(next); // ~30fps state updates
      if (next >= total) {
        setIsPlaying(false);
        currentTimeRef.current = 0;
        setCurrentTime(0);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  // Reset playback when clips change
  useEffect(() => {
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
  }, [selectedClips.length]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((v) => !v), []);
  const seek = useCallback((t: number) => {
    currentTimeRef.current = t;
    setCurrentTime(t);
  }, []);

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

        // Auto-approve any jobs waiting for clip approval
        for (let i = 0; i < results.length; i++) {
          if (results[i]?.status === "awaiting_clip_approval") {
            fetch(`/api/reels/clips/${jobIds[i]}/approve`, { method: "POST" }).catch(() => {});
          }
        }

        const newPhase = derivePhase(results);
        setPhase(newPhase);

        if (newPhase === "done" || newPhase === "compose") {
          stopPolling();
          if (newPhase === "compose") {
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

  // ── Draft persistence ──────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (phase !== "compose") return; // don't overwrite draft during generation
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft({
        selectedClips, keywords, audioFileId, audioName, songStartTime,
        duration, subtitlesEnabled, transitionsEnabled, bulkCount, overlays, vibePreset,
        savedAt: Date.now(),
      });
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [selectedClips, keywords, audioFileId, audioName, songStartTime,
      duration, subtitlesEnabled, transitionsEnabled, bulkCount, overlays, vibePreset, phase]);

  const clearDraft = useCallback(() => {
    deleteDraft();
    setSelectedClips([]);
    setKeywords([]);
    setAudioFileId(null);
    setAudioName(null);
    setSongStartTime(0);
    setDuration(30);
    setSubtitlesEnabled(false);
    setTransitionsEnabled(true);
    setBulkCount(1);
    setOverlays([{ ...DEFAULT_OVERLAY }]);
    setVibePreset(null);
  }, []);

  // ── Undo / Redo ────────────────────────────────────────────────
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  // Always-current snapshot ref (updated after every render)
  const historySnapshotRef = useRef<HistoryEntry>({
    selectedClips, keywords, audioFileId, audioName, songStartTime,
    duration, subtitlesEnabled, transitionsEnabled, bulkCount, overlays, vibePreset,
  });
  useEffect(() => {
    historySnapshotRef.current = {
      selectedClips, keywords, audioFileId, audioName, songStartTime,
      duration, subtitlesEnabled, transitionsEnabled, bulkCount, overlays, vibePreset,
    };
  }, [selectedClips, keywords, audioFileId, audioName, songStartTime,
      duration, subtitlesEnabled, transitionsEnabled, bulkCount, overlays, vibePreset]);

  // Immediate push — call before discrete mutations (toggle, remove, reorder…)
  const pushHistory = useCallback(() => {
    const entry = { ...historySnapshotRef.current };
    setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), entry]);
    setFuture([]);
  }, []);

  // Debounced push — call on continuous mutations (trim drag, overlay drag)
  // Captures the pre-gesture state on first call, pushes it after 400ms silence
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebouncedSnap = useRef<HistoryEntry | null>(null);
  const pushHistoryDebounced = useCallback(() => {
    if (!historyDebounceRef.current) {
      // First call in this gesture — capture pre-mutation state
      historyDebouncedSnap.current = { ...historySnapshotRef.current };
    }
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      const snap = historyDebouncedSnap.current;
      if (snap) {
        setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), snap]);
        setFuture([]);
      }
      historyDebounceRef.current = null;
      historyDebouncedSnap.current = null;
    }, 400);
  }, []);

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    setSelectedClips(entry.selectedClips);
    setKeywords(entry.keywords);
    setAudioFileId(entry.audioFileId);
    setAudioName(entry.audioName);
    setSongStartTime(entry.songStartTime);
    setDuration(entry.duration);
    setSubtitlesEnabled(entry.subtitlesEnabled);
    setTransitionsEnabled(entry.transitionsEnabled);
    setBulkCount(entry.bulkCount);
    setOverlays(entry.overlays);
    setVibePreset(entry.vibePreset);
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      setFuture((f) => [{ ...historySnapshotRef.current }, ...f.slice(0, MAX_HISTORY - 1)]);
      restoreEntry(entry);
      return rest;
    });
  }, [restoreEntry]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[0];
      const rest = prev.slice(1);
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), { ...historySnapshotRef.current }]);
      restoreEntry(entry);
      return rest;
    });
  }, [restoreEntry]);

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
    pushHistory();
    setKeywords((prev) => prev.filter((k) => k.keyword !== kw));
    setSelectedClips((prev) => prev.filter((c) => c.keyword !== kw));
  }, [pushHistory]);

  const toggleClip = useCallback((clip: PickedClip) => {
    pushHistory();
    setSelectedClips((prev) =>
      prev.some((c) => c.id === clip.id)
        ? prev.filter((c) => c.id !== clip.id)
        : [...prev, clip]
    );
  }, [pushHistory]);

  const removeClip = useCallback((id: number) => {
    pushHistory();
    setSelectedClips((prev) => prev.filter((c) => c.id !== id));
  }, [pushHistory]);

  const trimClip = useCallback((id: number, start: number, end: number) => {
    pushHistoryDebounced();
    setSelectedClips((prev) =>
      prev.map((c) => c.id === id ? { ...c, trimStart: start, trimEnd: end } : c)
    );
  }, [pushHistoryDebounced]);

  const reorderClips = useCallback((from: number, to: number) => {
    if (from === to) return;
    pushHistory();
    setSelectedClips((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, [pushHistory]);

  const setKeywordThumbnail = useCallback(
    (kw: string, thumbnail: string | null, videoId: number | null) => {
      setKeywords((prev) =>
        prev.map((k) => (k.keyword === kw ? { ...k, thumbnail, videoId } : k))
      );
    },
    []
  );

  const updateOverlay = useCallback((index: number, patch: Partial<TextOverlay>) => {
    pushHistoryDebounced();
    setOverlays((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...patch } : o))
    );
  }, [pushHistoryDebounced]);

  const addOverlay = useCallback(() => {
    pushHistory();
    setOverlays((prev) => [...prev, { ...DEFAULT_OVERLAY }]);
  }, [pushHistory]);

  const removeOverlay = useCallback((index: number) => {
    pushHistory();
    setOverlays((prev) => prev.filter((_, i) => i !== index));
  }, [pushHistory]);

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
            transitionsEnabled,
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
    deleteDraft();
  }, [stopPolling]);

  const value: StudioContextValue = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    audioFileId,
    audioName,
    songStartTime,
    keywords,
    selectedClips,
    duration,
    subtitlesEnabled,
    transitionsEnabled,
    bulkCount,
    overlays,
    phase,
    jobs,
    approvalJobIndex,
    previewOverride,
    vibePreset,

    isPlaying,
    currentTime,
    activeClipIndex,
    totalDuration,

    setAudio,
    clearAudio,
    setSongStartTime,
    addKeyword,
    removeKeyword,
    setKeywordThumbnail,
    toggleClip,
    removeClip,
    trimClip,
    reorderClips,
    setDuration,
    setSubtitlesEnabled,
    setTransitionsEnabled,
    setBulkCount,
    setOverlays,
    updateOverlay,
    addOverlay,
    removeOverlay,
    setPhase,
    setPreviewOverride,
    setVibePreset,
    draftRestoredAt,
    clearDraft,
    play,
    pause,
    togglePlay,
    seek,
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
