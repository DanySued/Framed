'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Download, ChevronLeft, ChevronRight, CheckCircle, Loader2,
  AlertCircle, Square, Trash2,
} from 'lucide-react';
import { JobStatus, useReelGenerationContext } from '@/lib/ReelGenerationContext';
import { triggerDownload } from '@/lib/download';
import { ErrorBanner } from '@/components/ui/error-banner';
import { cn } from '@/lib/utils';
import { useWizard } from '../WizardContext';

const REEL_TITLE = 'Generated Reel';

function StatusLabel({ status, phase, progress }: { status: JobStatus['status']; phase?: 1 | 2; progress?: number }) {
  let processingLabel = phase === 2 ? 'Rendering' : 'Preparing clips';
  if (phase === 2 && progress !== undefined && progress >= 96) processingLabel = 'Generating subtitles';
  const labels: Record<JobStatus['status'], string> = {
    queued: 'Queued',
    processing: processingLabel,
    awaiting_clip_approval: 'Review Clips',
    done: 'Complete',
    failed: 'Failed',
  };
  const colors: Record<JobStatus['status'], string> = {
    queued: 'text-muted-foreground',
    processing: 'text-fp-green',
    awaiting_clip_approval: 'text-fp-yellow',
    done: 'text-emerald-400',
    failed: 'text-destructive',
  };
  return <span className={`text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
}

function ProgressBar({ phaseProgress, status }: { phaseProgress: number; status: JobStatus['status'] }) {
  const isDone = status === 'done';
  const isFailed = status === 'failed';
  const [displayed, setDisplayed] = useState(phaseProgress);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const step = () => {
      setDisplayed((prev) => {
        const diff = phaseProgress - prev;
        if (Math.abs(diff) < 0.15) return phaseProgress;
        return prev + diff * 0.07;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [phaseProgress]);

  const barColor = isFailed ? 'from-red-500 to-red-600' : isDone ? 'from-emerald-500 to-green-500' : 'from-fr-gold-dim to-fr-gold';
  const width = isFailed ? 100 : isDone ? 100 : Math.max(displayed, 2);

  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${barColor} relative overflow-hidden`} style={{ width: `${width}%` }}>
        {!isDone && !isFailed && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'progress-shimmer 1.3s ease-in-out infinite' }} />
        )}
      </div>
    </div>
  );
}

function VideoPreview({ reelId, label }: { reelId: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className="rounded-xl overflow-hidden bg-black border border-border shadow-2xl" style={{ width: '100%', maxWidth: '280px', aspectRatio: '9 / 16' }}>
        <video key={reelId} src={`/api/reels/download/${reelId}`} controls className="w-full h-full object-contain" preload="metadata" />
      </div>
    </div>
  );
}

export function GenerateStep() {
  const {
    selectedAudioId, songStartTime, selectedAudioDuration,
    keywords, duration, isBulk, reelCount, subtitlesEnabled,
    overlays, noText, selectedClips,
    goBack, goToStep,
  } = useWizard();

  const maxStartTime = Math.max(0, selectedAudioDuration - duration);
  const effectiveSongStartTime = Math.min(songStartTime, maxStartTime);

  const { jobs, isGenerating, error, startGeneration, approveClips, replaceClip, reset } = useReelGenerationContext();

  const isActive = jobs.length > 0 || isGenerating;
  const awaitingApprovalJobs = jobs.filter((j) => j.status === 'awaiting_clip_approval');
  const isAwaitingApproval = awaitingApprovalJobs.length > 0;
  const allSettled = jobs.length > 0 && jobs.every((j) => j.status === 'done' || j.status === 'failed');
  const currentPhase: 1 | 2 = jobs.some((j) => j.phase === 2) ? 2 : 1;
  const doneJobs = jobs.filter((j) => j.status === 'done' && j.reel_id);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [clipVersions, setClipVersions] = useState<Record<string, number>>({});
  const [replacingClips, setReplacingClips] = useState<Set<string>>(new Set());
  const [approvingJob, setApprovingJob] = useState<string | null>(null);
  const [clipError, setClipError] = useState<string | null>(null);
  const [cleanupState, setCleanupState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; freed_mb: number; dirs_cleaned: number }
  >({ status: 'idle' });

  const clipKey = (jobId: string, index: number) => `${jobId}-${index}`;

  const handleGenerate = async () => {
    setValidationError(null);
    setPreviewIndex(0);
    const activeOverlays = noText
      ? []
      : overlays.map(({ text, x, y, font, bold, italic }) => ({ text, x, y, font, bold, italic }));
    await startGeneration(
      isBulk ? reelCount : 1,
      keywords,
      selectedAudioId,
      duration,
      REEL_TITLE,
      effectiveSongStartTime,
      { overlays: activeOverlays, subtitlesEnabled }
    );
  };

  const handleReplaceClip = async (jobId: string, index: number) => {
    const key = clipKey(jobId, index);
    setReplacingClips((prev) => new Set(prev).add(key));
    setClipError(null);
    try {
      await replaceClip(jobId, index);
      setClipVersions((prev) => ({ ...prev, [key]: Date.now() }));
    } catch (err) {
      setClipError(err instanceof Error ? err.message : 'Replace failed');
    } finally {
      setReplacingClips((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const handleApproveClips = async (jobId: string) => {
    setApprovingJob(jobId);
    setClipError(null);
    try {
      await approveClips(jobId);
    } catch (err) {
      setClipError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setApprovingJob(null);
    }
  };

  const handleDownload = (reelId: string, index?: number) => {
    const suffix = index !== undefined ? `-${index + 1}` : '';
    triggerDownload(`/api/reels/download/${reelId}`, `${REEL_TITLE.replace(/\s+/g, '_')}${suffix}.mp4`);
  };

  const handleDownloadAll = () => {
    doneJobs.forEach((job, i) => setTimeout(() => handleDownload(job.reel_id!, i), i * 600));
  };

  const handleCleanup = async () => {
    setCleanupState({ status: 'loading' });
    try {
      const res = await fetch('/api/reels/cleanup-temp', { method: 'POST' });
      const data = await res.json();
      setCleanupState({ status: 'done', freed_mb: data.freed_mb ?? 0, dirs_cleaned: data.dirs_cleaned ?? 0 });
    } catch {
      setCleanupState({ status: 'idle' });
    }
  };

  const handleCreateNew = () => {
    reset();
    goToStep(0);
  };

  const summaryRows = [
    { label: 'Keywords', value: keywords.join(', ') },
    { label: 'Duration', value: `${duration}s` },
    { label: 'Reels', value: String(isBulk ? reelCount : 1) },
    { label: 'Subtitles', value: subtitlesEnabled ? 'On' : 'Off' },
    { label: 'Text overlay', value: noText ? 'None' : `${overlays.filter(o => o.text).length} layer(s)` },
  ];

  // Pre-generate state
  if (!isActive) {
    return (
      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
        >
          <h1 className="text-xl">Ready to generate</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your settings and hit generate.</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
          className="bg-secondary/50 rounded-xl border border-border p-4 space-y-2 text-sm overflow-hidden"
        >
          {summaryRows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.25 }}
              className="flex justify-between"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{row.value}</span>
            </motion.div>
          ))}
        </motion.div>

        {(validationError || error) && <ErrorBanner message={validationError || error!} />}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
          className="flex items-center justify-between pt-1"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCleanup}
            disabled={cleanupState.status === 'loading'}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            {cleanupState.status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {cleanupState.status === 'loading' ? 'Cleaning…' : cleanupState.status === 'done' ? `Freed ${cleanupState.freed_mb} MB` : 'Free Up Space'}
          </motion.button>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
          className="flex items-center justify-between pt-4"
        >
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(212,168,75,0.45)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-primary hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-primary/25"
          >
            {isBulk ? `Generate ${reelCount} Reels` : 'Generate Reel'}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Generating state
  if (isActive && !allSettled && !isAwaitingApproval) {
    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-border bg-secondary hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive text-muted-foreground transition-colors"
          >
            <Square className="w-3 h-3" />
            Stop
          </motion.button>
        </div>

        <div className="flex flex-col items-center gap-5 py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" style={{ animationDuration: '3s' }} />
          <div className="text-center">
            <h2 className="text-base font-semibold font-sans text-foreground">
              {currentPhase === 2
                ? jobs.length > 1 ? `Rendering ${jobs.length} reels…` : 'Rendering reel…'
                : jobs.length > 1 ? `Preparing clips for ${jobs.length} reels…` : 'Preparing clips…'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {currentPhase === 2 ? 'Compositing, scaling, mixing audio…' : 'Searching and trimming footage from Pexels'}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Phase {currentPhase} of 2</p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-5 bg-secondary/50 rounded-xl border border-border flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">Starting up…</span>
          </div>
        ) : (
          jobs.map((job, i) => (
            <div key={job.job_id} className="p-5 bg-secondary/50 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {job.status === 'done' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : job.status === 'failed' ? <AlertCircle className="w-4 h-4 text-destructive" /> : <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span className="text-sm font-medium text-foreground">{jobs.length > 1 ? `Reel ${i + 1} of ${jobs.length}` : 'Reel'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusLabel status={job.status} phase={job.phase} progress={job.progress} />
                  <span className="text-sm font-semibold text-foreground tabular-nums">{Math.round(job.phase_progress ?? job.progress)}%</span>
                </div>
              </div>
              <ProgressBar phaseProgress={job.phase_progress ?? job.progress} status={job.status} />
              {job.error_message && <p className="mt-2 text-xs text-destructive">{job.error_message}</p>}
            </div>
          ))
        )}
      </div>
    );
  }

  // Clip approval state
  if (isActive && isAwaitingApproval) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-base font-semibold font-sans text-foreground">Review your clips</h2>
          <p className="text-xs text-muted-foreground mt-1">Watch each clip — replace any you don&apos;t like, then approve to render the reel.</p>
        </div>

        {clipError && <ErrorBanner message={clipError} />}

        {awaitingApprovalJobs.map((job, jobIdx) => {
          const clipCount = job.clip_count ?? 0;
          return (
            <div key={job.job_id} className="space-y-4">
              {awaitingApprovalJobs.length > 1 && (
                <p className="text-xs font-medium text-muted-foreground">Reel {jobIdx + 1} of {awaitingApprovalJobs.length}</p>
              )}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(clipCount, 3)}, 1fr)` }}>
                {Array.from({ length: clipCount }, (_, i) => {
                  const key = clipKey(job.job_id, i);
                  const version = clipVersions[key] ?? 0;
                  const isReplacing = replacingClips.has(key);
                  return (
                    <div key={i} className="flex flex-col gap-2 bg-secondary/50 rounded-xl border border-border p-2">
                      <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '9 / 16' }}>
                        {isReplacing ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : (
                          <video key={version} src={`/api/reels/clips/${job.job_id}/${i}?v=${version}`} className="w-full h-full object-cover" controls preload="metadata" muted />
                        )}
                      </div>
                      <button
                        onClick={() => handleReplaceClip(job.job_id, i)}
                        disabled={isReplacing || approvingJob === job.job_id}
                        className="w-full py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {isReplacing ? <><Loader2 className="w-3 h-3 animate-spin" /> Finding…</> : 'Replace Clip'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <motion.button
                whileHover={approvingJob === job.job_id || replacingClips.size > 0 ? {} : { scale: 1.02, boxShadow: '0 0 20px rgba(212,168,75,0.4)' }}
                whileTap={approvingJob === job.job_id || replacingClips.size > 0 ? {} : { scale: 0.97 }}
                onClick={() => handleApproveClips(job.job_id)}
                disabled={approvingJob === job.job_id || replacingClips.size > 0}
                className="w-full px-6 py-3 bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-primary/25"
              >
                {approvingJob === job.job_id ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting render…</> : 'Approve & Generate Reel'}
              </motion.button>
            </div>
          );
        })}

        {jobs.filter((j) => j.status === 'processing' || j.status === 'queued').map((job) => (
          <div key={job.job_id} className="p-4 bg-secondary/50 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs font-medium text-foreground">Preparing clips…</span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(job.phase_progress ?? job.progress)}%</span>
            </div>
            <ProgressBar phaseProgress={job.phase_progress ?? job.progress} status={job.status} />
          </div>
        ))}
      </div>
    );
  }

  // Done state
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </motion.div>
        <h2 className="text-base font-semibold font-sans text-foreground">
          {doneJobs.length} of {jobs.length} reel{jobs.length !== 1 ? 's' : ''} ready
        </h2>
      </motion.div>

      {doneJobs.length > 0 && (
        <>
          {doneJobs.length === 1 ? (
            <div className="flex flex-col items-center gap-5">
              <VideoPreview reelId={doneJobs[0].reel_id!} />
              <div className="flex items-center gap-3">
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => handleDownload(doneJobs[0].reel_id!)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download Reel
                </motion.button>
                {doneJobs[0].srt_path && (
                  <button
                    onClick={() => triggerDownload(`/api/reels/download/${doneJobs[0].reel_id}/srt`, `${REEL_TITLE.replace(/\s+/g, '_')}.srt`)}
                    className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    .srt
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-center text-sm text-muted-foreground mb-4">{previewIndex + 1} / {doneJobs.length}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                  disabled={previewIndex === 0}
                  className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="flex-1 flex justify-center">
                  <VideoPreview reelId={doneJobs[previewIndex].reel_id!} label={`Reel ${previewIndex + 1}`} />
                </div>
                <button
                  onClick={() => setPreviewIndex((p) => Math.min(doneJobs.length - 1, p + 1))}
                  disabled={previewIndex === doneJobs.length - 1}
                  className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-5">
                {doneJobs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewIndex(i)}
                    className={cn('h-1.5 rounded-full transition-all duration-200', i === previewIndex ? 'bg-primary w-5' : 'bg-border hover:bg-muted-foreground w-1.5')}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => handleDownload(doneJobs[previewIndex].reel_id!, previewIndex)}
                  className="px-5 py-2.5 bg-secondary border border-border hover:bg-secondary/80 text-foreground font-medium rounded-xl flex items-center gap-2 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download This
                </button>
                {doneJobs[previewIndex].srt_path && (
                  <button
                    onClick={() => triggerDownload(`/api/reels/download/${doneJobs[previewIndex].reel_id}/srt`, `${REEL_TITLE.replace(/\s+/g, '_')}_${previewIndex + 1}.srt`)}
                    className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium rounded-xl flex items-center gap-2 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    .srt
                  </button>
                )}
                <button
                  onClick={handleDownloadAll}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center gap-2 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download All ({doneJobs.length})
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {jobs.map((job, i) =>
        job.status === 'failed' ? (
          <ErrorBanner key={job.job_id} message={`${jobs.length > 1 ? `Reel ${i + 1} failed: ` : 'Failed: '}${job.error_message || 'Generation failed'}`} />
        ) : null
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleCreateNew}
        className="w-full px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold rounded-xl transition-colors"
      >
        Create New Reel
      </motion.button>
    </motion.div>
  );
}
