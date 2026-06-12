"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStudio } from "./StudioContext";

const BAR_COUNT = 80;
const CANVAS_HEIGHT = 56;

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
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Draw bars
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

    // Canvas can't resolve CSS variables — read the accent token off :root.
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--fr-gold").trim() ||
      "#52d6c4";

    for (let i = 0; i < BAR_COUNT; i++) {
      const amp = amplitudes[i] ?? 0;
      const barH = Math.max(2, amp * (H - 8));
      const x = i * (barW + 1);
      const y = (H - barH) / 2;

      ctx.fillStyle = i <= playedBar ? "var(--fr-gold, #c9a45c)" : "rgba(138,130,118,0.35)";
      ctx.fillRect(x, y, barW, barH);
    }
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

  const playPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`/api/reels/audio/${audioId}`);
    audio.currentTime = songStartTime;
    audioRef.current = audio;
    audio.play().catch(() => {});
    // Stop after 15s
    const timeout = setTimeout(() => audio.pause(), 15000);
    audio.onpause = () => clearTimeout(timeout);
    audio.onended = () => clearTimeout(timeout);
  }, [audioId, songStartTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Fallback slider if decode failed
  if (error) {
    return (
      <div style={{ padding: "12px 20px" }}>
        <label
          className="fr-overline"
          style={{ display: "block", marginBottom: 6, fontSize: "0.6875rem" }}
        >
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
        <span className="fr-caption" style={{ fontSize: "0.6875rem" }}>
          {formatTime(songStartTime)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 20px 10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span className="fr-overline" style={{ fontSize: "0.6875rem" }}>
          Start
        </span>
        <button
          onClick={playPreview}
          className="fr-caption"
          style={{
            fontSize: "0.6875rem",
            color: "var(--fr-gold)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          preview ▶
        </button>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6875rem",
            color: "var(--fr-muted)",
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {formatTime(songStartTime)}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{ cursor: "col-resize", position: "relative", height: CANVAS_HEIGHT }}
        onPointerDown={(e) => {
          dragging.current = true;
          seekFromEvent(e);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => { if (dragging.current) seekFromEvent(e); }}
        onPointerUp={(e) => {
          if (dragging.current) {
            dragging.current = false;
            playPreview();
          }
        }}
      >
        {amplitudes.length === 0 ? (
          <div
            style={{
              height: CANVAS_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="fr-caption" style={{ fontSize: "0.6875rem" }}>
              Decoding…
            </span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: CANVAS_HEIGHT, display: "block" }}
          />
        )}
      </div>
    </div>
  );
}
