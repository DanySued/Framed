'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Loader2, Trash2, Upload, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWizard } from '../WizardContext';
import { StepNav } from './StepNav';

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

export function AudioStep() {
  const {
    selectedAudioId, setSelectedAudioId,
    songStartTime, setSongStartTime,
    duration,
    setSelectedAudioDuration,
    goNext,
  } = useWizard();

  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAudioId, setDeletingAudioId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPlayStartRef = useRef<number>(0);

  const selectedAudio = audioFiles.find((a) => a.id === selectedAudioId) ?? null;
  const maxStartTime = selectedAudio ? Math.max(0, selectedAudio.duration - duration) : 0;
  const effectiveSongStartTime = Math.min(songStartTime, maxStartTime);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const stopPreview = () => {
    if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; }
    if (previewIntervalRef.current) { clearInterval(previewIntervalRef.current); previewIntervalRef.current = null; }
    if (audioRef.current) audioRef.current.pause();
    setIsPreviewPlaying(false);
    setIsPreviewLoading(false);
    setPreviewProgress(0);
  };

  const togglePreview = () => {
    if (isPreviewPlaying || isPreviewLoading) { stopPreview(); return; }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = effectiveSongStartTime;
    setIsPreviewLoading(true);
    audio.play();
    previewTimerRef.current = setTimeout(() => {
      audio.pause();
      setIsPreviewPlaying(false);
    }, duration * 1000);
  };

  useEffect(() => {
    if (!isPreviewPlaying) {
      if (previewIntervalRef.current) { clearInterval(previewIntervalRef.current); previewIntervalRef.current = null; }
      return;
    }
    previewPlayStartRef.current = Date.now();
    previewIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - previewPlayStartRef.current) / 1000;
      setPreviewProgress(Math.min(elapsed, duration));
    }, 80);
    return () => { if (previewIntervalRef.current) { clearInterval(previewIntervalRef.current); previewIntervalRef.current = null; } };
  }, [isPreviewPlaying, duration]);

  useEffect(() => {
    const loadAudio = async () => {
      setIsLoadingAudio(true);
      setAudioError(null);
      try {
        const res = await fetch('/api/reels/audio');
        if (!res.ok) throw new Error('Failed to load audio files');
        const data = await res.json();
        setAudioFiles(data.audio_files || []);
      } catch (err) {
        setAudioError(err instanceof Error ? err.message : 'Failed to load audio');
      } finally {
        setIsLoadingAudio(false);
      }
    };
    loadAudio();
  }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setAudioError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/reels/upload-audio', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const newAudio = await res.json();
      setAudioFiles((prev) => [newAudio, ...prev]);
      setSelectedAudioId(newAudio.id);
      setSelectedAudioDuration(newAudio.duration);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    setDeletingAudioId(audioId);
    setAudioError(null);
    try {
      const res = await fetch(`/api/reels/audio/${audioId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete audio');
      }
      setAudioFiles((prev) => prev.filter((a) => a.id !== audioId));
      if (selectedAudioId === audioId) {
        setSelectedAudioId('');
        setSelectedAudioDuration(0);
      }
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Failed to delete audio');
    } finally {
      setDeletingAudioId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pick a track</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose the audio that will play under your reel.</p>
      </div>

      {audioError && <ErrorBanner message={audioError} />}

      {isLoadingAudio ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[54px] w-full rounded-xl" />)}
        </div>
      ) : audioFiles.length > 0 ? (
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {audioFiles.map((audio) => (
              <motion.label
                key={audio.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
                }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                whileHover={{}}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn(
                  'flex items-center p-3.5 rounded-xl border cursor-pointer transition-all',
                  selectedAudioId === audio.id
                    ? 'bg-primary/10 border-primary/40 shadow-[0_0_12px_rgba(212,168,75,0.12)]'
                    : 'bg-secondary/50 border-border hover:border-primary/20 hover:bg-secondary'
                )}
              >
                <input
                  type="radio"
                  name="audio"
                  value={audio.id}
                  checked={selectedAudioId === audio.id}
                  onChange={(e) => {
                    stopPreview();
                    setSongStartTime(0);
                    setSelectedAudioId(e.target.value);
                    setSelectedAudioDuration(audio.duration);
                  }}
                  className="mr-3 accent-primary"
                />
                <Music className={cn('w-4 h-4 mr-2.5 transition-colors', selectedAudioId === audio.id ? 'text-primary' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{audio.filename}</div>
                  <div className="text-xs text-muted-foreground">{audio.duration}s</div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.preventDefault(); handleDeleteAudio(audio.id); }}
                  disabled={deletingAudioId === audio.id}
                  className="ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 shrink-0"
                  aria-label={`Delete ${audio.filename}`}
                >
                  {deletingAudioId === audio.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </motion.button>
              </motion.label>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border bg-secondary/30 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
            <Music className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No audio tracks yet</p>
          <p className="text-xs text-muted-foreground mb-4">Upload an MP3, WAV, or M4A file to get started</p>
        </motion.div>
      )}

      {selectedAudio && (
        <div className="p-4 bg-secondary/50 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Song start time</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {formatTime(effectiveSongStartTime)} → {formatTime(Math.min(effectiveSongStartTime + duration, selectedAudio.duration))}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxStartTime}
            value={effectiveSongStartTime}
            onChange={(e) => { stopPreview(); setSongStartTime(Number(e.target.value)); }}
            disabled={maxStartTime === 0}
            className="w-full accent-primary disabled:opacity-40"
          />
          {(isPreviewPlaying || isPreviewLoading) && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatTime(effectiveSongStartTime + previewProgress)}</span>
                <span>{formatTime(effectiveSongStartTime + duration)}</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(previewProgress / duration) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Full track: {formatTime(selectedAudio.duration)}</span>
            <button
              onClick={togglePreview}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                isPreviewPlaying || isPreviewLoading
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {isPreviewLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading…</>
                : isPreviewPlaying
                  ? <><Square className="w-3 h-3" /> Stop</>
                  : <><Play className="w-3 h-3" /> Preview {duration}s</>
              }
            </button>
          </div>
          <audio
            ref={audioRef}
            src={`/api/reels/audio/${selectedAudio.id}`}
            preload="metadata"
            onPlaying={() => { setIsPreviewLoading(false); setIsPreviewPlaying(true); }}
            onEnded={() => setIsPreviewPlaying(false)}
          />
        </div>
      )}

      <motion.label
        whileHover={isUploading ? {} : { scale: 1.02, boxShadow: '0 0 12px rgba(212,168,75,0.15)' }}
        whileTap={isUploading ? {} : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors',
          isUploading
            ? 'bg-secondary/60 border-border text-muted-foreground cursor-not-allowed opacity-70'
            : 'bg-secondary hover:bg-secondary/80 hover:border-primary/30 border-border text-foreground cursor-pointer'
        )}
      >
        {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><Upload className="w-3.5 h-3.5" /> Upload Audio</>}
        <input
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/x-m4a,audio/mp3,.mp3,.wav,.m4a,.ogg"
          onChange={handleAudioUpload}
          className="hidden"
          disabled={isLoadingAudio || isUploading}
        />
      </motion.label>

      <StepNav
        onNext={goNext}
        nextDisabled={!selectedAudioId}
        nextLabel="Next →"
        hideBack
      />
    </div>
  );
}
