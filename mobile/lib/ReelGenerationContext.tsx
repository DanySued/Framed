import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { apiFetch } from './api';

export interface JobStatus {
  job_id: string;
  reel_id: string | null;
  status: 'queued' | 'processing' | 'awaiting_clip_approval' | 'done' | 'failed';
  progress: number;
  phase: 1 | 2;
  phase_progress: number;
  error_message: string | null;
  clip_count: number | null;
  created_at: string;
  completed_at: string | null;
  srt_path: string | null;
}

export interface TextOverlayItem {
  text: string;
  x: number;
  y: number;
  font: 'sans' | 'serif' | 'mono';
  bold: boolean;
  italic: boolean;
}

interface ReelGenerationContextValue {
  jobs: JobStatus[];
  isGenerating: boolean;
  error: string | null;
  startGeneration: (
    count: number,
    keywords: string[],
    audioFileId: string,
    duration: number,
    title: string,
    songStartTime?: number,
    options?: { overlays?: TextOverlayItem[]; subtitlesEnabled?: boolean }
  ) => Promise<void>;
  approveClips: (jobId: string) => Promise<void>;
  replaceClip: (jobId: string, index: number) => Promise<void>;
  reset: () => void;
}

const ReelGenerationContext = createContext<ReelGenerationContextValue | null>(null);

const POLL_INTERVAL = 2000;

export function ReelGenerationProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activePollers = useRef<Set<string>>(new Set());
  const pollerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const startPolling = useCallback((jobId: string) => {
    activePollers.current.add(jobId);

    const poll = async () => {
      if (!activePollers.current.has(jobId)) return;
      try {
        const res = await apiFetch(`/reels/job/${jobId}`);
        if (!res.ok) throw new Error('Poll failed');
        const data: JobStatus = await res.json();

        setJobs((prev) =>
          prev.map((j) => (j.job_id === jobId ? data : j))
        );

        if (data.status === 'queued' || data.status === 'processing') {
          const timer = setTimeout(poll, POLL_INTERVAL);
          pollerTimers.current.set(jobId, timer);
        } else {
          pollerTimers.current.delete(jobId);
          activePollers.current.delete(jobId);
          if (activePollers.current.size === 0) setIsGenerating(false);
        }
      } catch {
        pollerTimers.current.delete(jobId);
        activePollers.current.delete(jobId);
        if (activePollers.current.size === 0) setIsGenerating(false);
      }
    };

    poll();
  }, []);

  const startGeneration = useCallback(
    async (count, keywords, audioFileId, duration, title, songStartTime = 0, options = {}) => {
      setError(null);
      setIsGenerating(true);
      setJobs([]);
      pollerTimers.current.forEach((t) => clearTimeout(t));
      pollerTimers.current.clear();
      activePollers.current.clear();

      try {
        const requests = Array.from({ length: count }, (_, i) =>
          apiFetch('/reels/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keywords,
              audio_file_id: audioFileId,
              duration,
              title: count > 1 ? `${title} ${i + 1}` : title,
              song_start_time: songStartTime,
              overlays: options.overlays ?? [],
              subtitles_enabled: options.subtitlesEnabled ?? false,
            }),
          })
        );

        const responses = await Promise.all(requests);
        const newJobs: JobStatus[] = [];

        for (const res of responses) {
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.detail ?? 'Generation failed');
          }
          newJobs.push(await res.json());
        }

        setJobs(newJobs);
        newJobs.forEach((job) => startPolling(job.job_id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
        setIsGenerating(false);
      }
    },
    [startPolling]
  );

  const approveClips = useCallback(async (jobId: string) => {
    const res = await apiFetch(`/reels/clips/${jobId}/approve`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail ?? 'Failed to approve clips');
    }
    setIsGenerating(true);
    startPolling(jobId);
  }, [startPolling]);

  const replaceClip = useCallback(async (jobId: string, index: number) => {
    const res = await apiFetch(`/reels/clips/${jobId}/replace/${index}`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail ?? 'Failed to replace clip');
    }
  }, []);

  const reset = useCallback(() => {
    pollerTimers.current.forEach((t) => clearTimeout(t));
    pollerTimers.current.clear();
    activePollers.current.clear();
    setJobs([]);
    setIsGenerating(false);
    setError(null);
  }, []);

  return (
    <ReelGenerationContext.Provider value={{ jobs, isGenerating, error, startGeneration, approveClips, replaceClip, reset }}>
      {children}
    </ReelGenerationContext.Provider>
  );
}

export function useReelGenerationContext() {
  const ctx = useContext(ReelGenerationContext);
  if (!ctx) throw new Error('useReelGenerationContext must be inside ReelGenerationProvider');
  return ctx;
}
