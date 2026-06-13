"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, Music } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "./StudioContext";
import Waveform from "./Waveform";

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

function cleanFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")       // remove extension
    .replace(/[-_]+/g, " ")          // dashes/underscores → spaces
    .replace(/\s+\d{4,}\s*$/, "")   // strip trailing numeric IDs
    .trim();
}

function formatDuration(s: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
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

  const triggerUpload = () => fileInputRef.current?.click();

  const UploadButton = (
    <button
      onClick={triggerUpload}
      onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={handleDrop}
      disabled={uploading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "11px 16px",
        background: draggingOver ? "rgba(82,214,196,0.1)" : "transparent",
        border: `1px solid ${draggingOver ? "var(--fr-gold)" : "var(--fr-line-2)"}`,
        color: uploading ? "var(--fr-gold)" : "var(--fr-muted)",
        cursor: uploading ? "default" : "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (!uploading) {
          e.currentTarget.style.borderColor = "rgba(82,214,196,0.5)";
          e.currentTarget.style.color = "var(--fr-ivory)";
        }
      }}
      onMouseLeave={(e) => {
        if (!uploading) {
          e.currentTarget.style.borderColor = draggingOver ? "var(--fr-gold)" : "var(--fr-line-2)";
          e.currentTarget.style.color = "var(--fr-muted)";
        }
      }}
      aria-label="Upload audio track"
    >
      <Upload size={13} style={{ flexShrink: 0 }} />
      {uploading ? "Uploading…" : "Upload track"}
    </button>
  );

  return (
    <aside
      className="flex flex-col lg:h-full overflow-hidden"
      style={{ borderBottom: "1px solid var(--fr-line)" }}
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

      {/* Upload button — at top when no tracks */}
      {!loading && tracks.length === 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          {UploadButton}
        </div>
      )}

      {/* Track list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <span className="fr-caption">Loading…</span>
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--fr-muted)",
                fontStyle: "italic",
                fontFamily: "var(--font-display), Georgia, serif",
                lineHeight: 1.6,
              }}
            >
              drop an audio file or upload a track
            </p>
          </div>
        ) : (
          <ul style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {tracks.map((track) => {
              const selected = track.id === audioFileId;
              const cleanName = cleanFilename(track.filename);
              return (
                <li
                  key={track.id}
                  className="group"
                  style={{
                    border: `1px solid ${selected ? "var(--fr-gold)" : "var(--fr-line)"}`,
                    background: selected ? "rgba(82,214,196,0.05)" : "var(--fr-surface)",
                    transition: "border-color 150ms ease, background 150ms ease",
                    overflow: "hidden",
                  }}
                >
                  {/* Track main row */}
                  <button
                    onClick={() => {
                      if (selected) clearAudio();
                      else setAudio(track.id, track.filename);
                    }}
                    data-no-lift
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 16px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    aria-pressed={selected}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: selected ? "rgba(82,214,196,0.12)" : "rgba(255,255,255,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 150ms ease",
                      }}
                    >
                      <Music
                        size={16}
                        style={{ color: selected ? "var(--fr-gold)" : "var(--fr-muted)" }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 500,
                          color: selected ? "var(--fr-ivory)" : "var(--fr-muted)",
                          fontFamily: "var(--font-sans)",
                          lineHeight: 1.3,
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "color 150ms ease",
                          textTransform: "capitalize",
                        }}
                      >
                        {cleanName || track.filename}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {track.duration > 0 && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: "0.6875rem",
                              color: selected ? "rgba(82,214,196,0.7)" : "rgba(255,255,255,0.25)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {formatDuration(track.duration)}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.5625rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: selected ? "var(--fr-gold)" : "rgba(255,255,255,0.18)",
                            fontFamily: "var(--font-mono), monospace",
                          }}
                        >
                          {selected ? "selected" : track.id.startsWith("temp-") ? "uploading…" : "mp3"}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(track.id, e)}
                      data-no-lift
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      style={{
                        color: "var(--fr-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                      aria-label={`Delete ${track.filename}`}
                    >
                      <X size={13} />
                    </button>
                  </button>

                  {/* Waveform — inline, only for selected track */}
                  {selected && (
                    <div
                      style={{
                        borderTop: "1px solid rgba(82,214,196,0.12)",
                        padding: "0 16px 14px",
                      }}
                    >
                      <Waveform audioId={track.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upload button — below track list when tracks exist */}
      {!loading && tracks.length > 0 && (
        <div style={{ padding: "0 20px 20px", marginTop: 4 }}>
          {UploadButton}
        </div>
      )}

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
    </aside>
  );
}
