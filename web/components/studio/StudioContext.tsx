"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

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

export type StudioPhase =
  | "compose"
  | "generating"
  | "approval"
  | "rendering"
  | "done";

interface StudioState {
  // Audio
  audioFileId: string | null;
  audioName: string | null;
  songStartTime: number;

  // Scenes
  keywords: SceneKeyword[];

  // Reel settings
  duration: number; // 15–60
  subtitlesEnabled: boolean;
  bulkCount: number; // 1–5

  // Text overlays
  overlays: TextOverlay[];

  // Workflow phase
  phase: StudioPhase;
}

interface StudioActions {
  setAudio: (id: string, name: string) => void;
  clearAudio: () => void;
  setSongStartTime: (t: number) => void;

  addKeyword: (kw: string) => void;
  removeKeyword: (kw: string) => void;
  setKeywordThumbnail: (kw: string, thumbnail: string | null, videoId: number | null) => void;

  setDuration: (d: number) => void;
  setSubtitlesEnabled: (v: boolean) => void;
  setBulkCount: (n: number) => void;

  setOverlays: (overlays: TextOverlay[]) => void;
  updateOverlay: (index: number, patch: Partial<TextOverlay>) => void;
  addOverlay: () => void;
  removeOverlay: (index: number) => void;

  setPhase: (p: StudioPhase) => void;

  /** Called by ControlBar Generate button — stub for Task 4 */
  onGenerate: () => void;
}

type StudioContextValue = StudioState & StudioActions;

const StudioContext = createContext<StudioContextValue | null>(null);

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
  const [duration, setDuration] = useState(30);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [overlays, setOverlays] = useState<TextOverlay[]>([{ ...DEFAULT_OVERLAY }]);
  const [phase, setPhase] = useState<StudioPhase>("compose");

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

  const onGenerate = useCallback(() => {
    // Task 4 will implement this
    console.log("[Studio] onGenerate stub — wired in Task 4");
  }, []);

  const value: StudioContextValue = {
    audioFileId,
    audioName,
    songStartTime,
    keywords,
    duration,
    subtitlesEnabled,
    bulkCount,
    overlays,
    phase,

    setAudio,
    clearAudio,
    setSongStartTime,
    addKeyword,
    removeKeyword,
    setKeywordThumbnail,
    setDuration,
    setSubtitlesEnabled,
    setBulkCount,
    setOverlays,
    updateOverlay,
    addOverlay,
    removeOverlay,
    setPhase,
    onGenerate,
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
