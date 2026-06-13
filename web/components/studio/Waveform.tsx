"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudio } from "./StudioContext";

const BAR_COUNT = 80;
const CANVAS_HEIGHT = 60;

interface Props {
  audioId: string;
}

export default function Waveform({ audioId }: Props) {
  const { songStartTime, setSongStartTime } = useStudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Decode audio and compute bar amplitudes
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);
    setAmplitudes([]);

    const decode = async () => {
      try {
        const res = await fetch(`/api/reels/audio/${audioId}`);
        if (!res.ok) throw new Error("fetch failed");
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const ctx = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const decoded = await ctx.decodeAudioData(buffer);
        if (cancelled) return;

        setDuration(decoded.duration);

        const data = decoded.getChannelData(0);
        const blockSize = Math.floor(data.length / BAR_COUNT);
        const bars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(data[i * blockSize + j]);
          }
          bars.push(sum / blockSize);
        }
        const max = Math.max(...bars, 0.001);
        setAmplitudes(bars.map((b) => b / max));
        ctx.close();
      } catch {
        if (!cancelled) setError(true);
      }
    };

    decode();
    return () => { cancelled = true; };
  }, [audioId]);

  // Draw bars + playhead
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || amplitudes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = CANVAS_HEIGHT;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, W, H);

    const playedRatio = duration > 0 ? songStartTime / duration : 0;
    const playedBar = Math.floor(playedRatio * BAR_COUNT);
    const barW = (W - BAR_COUNT + 1) / BAR_COUNT;

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--fr-gold").trim() ||
      "#52d6c4";

    for (let i = 0; i < BAR_COUNT; i++) {
      const amp = amplitudes[i] ?? 0;
      const barH = Math.max(2, amp * (H - 12));
      const x = i * (barW + 1);
      const y = (H - barH) / 2;

      ctx.fillStyle = i <= playedBar ? accent : "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
    }

    // Playhead vertical line
    const headX = playedRatio * W;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(headX - 1, 0, 2, H);
    ctx.globalAlpha = 1;
  }, [amplitudes, songStartTime, duration]);

  const seekFromEvent = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || duration === 0) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setSongStartTime(Math.round(ratio * duration));
    },
    [duration, setSongStartTime]
  );

  const stopPreview = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const playPreview = useCallback(() => {
    stopPreview();
    const audio = new Audio(`/api/reels/audio/${audioId}`);
    audio.currentTime = songStartTime;
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));
    const timeout = setTimeout(() => { audio.pause(); setIsPlaying(false); }, 15000);
    audio.onpause = () => { clearTimeout(timeout); setIsPlaying(false); };
    audio.onended = () => { clearTimeout(timeout); setIsPlaying(false); };
  }, [audioId, songStartTime, stopPreview]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div style={{ padding: "10px 0 4px" }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: "0.6875rem", color: "var(--fr-muted)", letterSpacing: "0.06em" }}>
          Start time
        </label>
        <input
          type="range"
          min={0}
          max={300}
          value={songStartTime}
          onChange={(e) => setSongStartTime(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--fr-gold)" }}
        />
        <span style={{ fontSize: "0.6875rem", color: "var(--fr-muted)", fontFamily: "monospace" }}>
          {formatTime(songStartTime)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 10 }}>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span
          style={{
            fontSize: "0.5625rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--fr-muted)",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          starts at{" "}
          <span style={{ color: "var(--fr-gold)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(songStartTime)}
          </span>
        </span>

        <button
          onClick={isPlaying ? stopPreview : playPreview}
          style={{
            fontSize: "0.6875rem",
            color: isPlaying ? "var(--fr-ivory)" : "var(--fr-gold)",
            background: isPlaying ? "rgba(82,214,196,0.15)" : "transparent",
            border: `1px solid ${isPlaying ? "var(--fr-gold)" : "transparent"}`,
            borderRadius: "20px",
            cursor: "pointer",
            padding: "2px 10px",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all 150ms ease",
          }}
          data-no-lift
        >
          {isPlaying ? "■ stop" : "▶ preview"}
        </button>
      </div>

      {/* Waveform canvas */}
      <div
        ref={containerRef}
        style={{
          cursor: "col-resize",
          position: "relative",
          height: CANVAS_HEIGHT,
          borderRadius: "8px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.03)",
        }}
        onPointerDown={(e) => {
          dragging.current = true;
          seekFromEvent(e);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => { if (dragging.current) seekFromEvent(e); }}
        onPointerUp={() => {
          if (dragging.current) {
            dragging.current = false;
            playPreview();
          }
        }}
        title="Drag to set start time"
      >
        {amplitudes.length === 0 ? (
          <div style={{ height: CANVAS_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--fr-muted)" }}>Decoding…</span>
          </div>
        ) : (
          <canvas ref={canvasRef} style={{ width: "100%", height: CANVAS_HEIGHT, display: "block" }} />
        )}
      </div>

      <p style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em", marginTop: 5, textAlign: "center" }}>
        drag to move start point · click to preview 15s
      </p>
    </div>
  );
}
