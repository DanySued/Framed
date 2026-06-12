"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "./StudioContext";
import Waveform from "./Waveform";

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

export default function AudioPanel() {
  const { audioFileId, setAudio, clearAudio } = useStudio();
  const [tracks, setTracks] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingOver, setDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTracks = useCallback(async () => {
    try {
      const res = await fetch("/api/reels/audio");
      if (!res.ok) throw new Error("Failed to load audio");
      const data: { audio_files: AudioFile[] } = await res.json();
      setTracks(data.audio_files || []);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTracks();
  }, [loadTracks]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("audio/")) {
        toast.error("Audio files only");
        return;
      }
      setUploading(true);

      // Optimistic placeholder
      const tempId = `temp-${Date.now()}`;
      const tempTrack: AudioFile = { id: tempId, filename: file.name, duration: 0 };
      setTracks((prev) => [tempTrack, ...prev]);

      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/reels/upload-audio", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const uploaded: AudioFile = await res.json();
        setTracks((prev) => prev.map((t) => (t.id === tempId ? uploaded : t)));
        setAudio(uploaded.id, uploaded.filename);
      } catch (err) {
        setTracks((prev) => prev.filter((t) => t.id !== tempId));
        toast.error("Upload failed — try again");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [setAudio]
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (audioFileId === id) clearAudio();
      try {
        await fetch(`/api/reels/audio/${id}`, { method: "DELETE" });
      } catch {
        toast.error("Delete failed");
        await loadTracks();
      }
    },
    [audioFileId, clearAudio, loadTracks]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const formatDuration = (s: number) => {
    if (!s) return "";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <aside
      className="flex flex-col min-h-[280px] lg:h-full overflow-hidden"
      style={{ borderLeft: "1px solid var(--fr-line)", borderBottom: "1px solid var(--fr-line)" }}
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
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6875rem", color: "var(--fr-gold)" }}>02</span>
          Audio
        </h2>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <span className="fr-caption">Loading…</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex items-center justify-center h-20 px-5">
            <span className="fr-caption" style={{ textAlign: "center" }}>
              No audio files yet
            </span>
          </div>
        ) : (
          <ul>
            {tracks.map((track) => {
              const selected = track.id === audioFileId;
              return (
                <li
                  key={track.id}
                  className="group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderLeft: selected
                      ? "2px solid var(--fr-gold)"
                      : "2px solid transparent",
                    background: selected
                      ? "rgba(82,214,196,0.06)"
                      : "transparent",
                    borderBottom: "1px solid var(--fr-line)",
                  }}
                >
                  <button
                    onClick={() => {
                      if (selected) clearAudio();
                      else setAudio(track.id, track.filename);
                    }}
                    data-no-lift
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    aria-pressed={selected}
                  >
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontSize: "0.8125rem",
                        color: selected ? "var(--fr-ivory)" : "var(--fr-muted)",
                        transition: "color 150ms ease",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {track.filename}
                    </span>
                    {track.duration > 0 && (
                      <span
                        className="fr-caption shrink-0"
                        style={{ fontSize: "0.6875rem" }}
                      >
                        {formatDuration(track.duration)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDelete(track.id, e)}
                    data-no-lift
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0"
                    style={{
                      color: "var(--fr-muted)",
                      lineHeight: 1,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                    }}
                    aria-label={`Delete ${track.filename}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Waveform for selected track */}
      {audioFileId && (
        <div style={{ borderTop: "1px solid var(--fr-line)" }}>
          <Waveform audioId={audioFileId} />
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="shrink-0 transition-colors cursor-pointer"
        style={{
          borderTop: "1px solid var(--fr-line)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: draggingOver
            ? "rgba(82,214,196,0.08)"
            : "transparent",
        }}
      >
        <Upload
          size={13}
          style={{ color: uploading ? "var(--fr-gold)" : "var(--fr-muted)", flexShrink: 0 }}
        />
        <span
          className="fr-overline"
          style={{ fontSize: "0.6875rem", letterSpacing: "0.1em" }}
        >
          {uploading ? "Uploading…" : "Upload track"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </aside>
  );
}
