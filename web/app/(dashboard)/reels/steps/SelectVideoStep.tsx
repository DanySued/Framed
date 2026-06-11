'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, RefreshCw, Film } from 'lucide-react';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWizard, SelectedClip } from '../WizardContext';
import { StepNav } from './StepNav';

interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  width: number;
  height: number;
}

export function SelectVideoStep() {
  const { keywords, selectedClips, setSelectedClips, duration, goNext } = useWizard();

  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Target number of clips for a reel — same heuristic as the backend (one clip per ~4s)
  const targetCount = Math.max(1, Math.round(duration / 4));

  useEffect(() => {
    if (keywords.length === 0) {
      setVideos([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/reels/pexels/search?keywords=${encodeURIComponent(keywords.join(','))}&per_page=20`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Pexels search failed');
        }
        const data: { videos: PexelsVideo[] } = await res.json();
        if (!cancelled) setVideos(data.videos);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [keywords, reloadKey]);

  const isSelected = (id: number) => selectedClips.some((c) => c.id === id);

  const toggle = (v: PexelsVideo) => {
    setSelectedClips((prev) => {
      if (prev.some((c) => c.id === v.id)) {
        return prev.filter((c) => c.id !== v.id);
      }
      // Cap selection at targetCount; oldest selection drops if at cap
      const next: SelectedClip = { id: v.id, url: v.url, duration: v.duration };
      if (prev.length >= targetCount) return [...prev.slice(1), next];
      return [...prev, next];
    });
  };

  const noKeywords = keywords.length === 0;
  const selectionComplete = selectedClips.length === targetCount;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl">Pick your footage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose <span className="text-foreground font-medium">{targetCount}</span> clip{targetCount !== 1 ? 's' : ''} for your {duration}s reel.
          </p>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={noKeywords || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          Reshuffle
        </button>
      </div>

      {/* Selection counter */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/40">
        <span className="text-xs text-muted-foreground">
          Keywords: <span className="text-foreground font-medium">{keywords.join(', ') || '—'}</span>
        </span>
        <span className="text-xs font-semibold text-foreground tabular-nums">
          {selectedClips.length} / {targetCount}
        </span>
      </div>

      {error && <ErrorBanner message={error} />}

      {noKeywords ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-secondary/30 text-center">
          <Film className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No keywords yet</p>
          <p className="text-xs text-muted-foreground mt-1">Go back and add a few to search for footage.</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] w-full rounded-xl" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-secondary/30 text-center">
          <Film className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No matches</p>
          <p className="text-xs text-muted-foreground mt-1">Try broader keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {videos.map((v) => {
            const selected = isSelected(v.id);
            const selIndex = selectedClips.findIndex((c) => c.id === v.id);
            return (
              <motion.button
                key={v.id}
                type="button"
                onClick={() => toggle(v)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'group relative aspect-[9/16] rounded-xl overflow-hidden border-2 bg-black transition-all',
                  selected
                    ? 'border-primary shadow-[0_0_18px_rgba(212,168,75,0.35)]'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <video
                  src={v.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                />
                <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
                  <span className="text-[10px] font-medium text-white/80 tabular-nums">
                    {v.duration}s
                  </span>
                  {selected && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {selIndex + 1}
                    </span>
                  )}
                </div>
                {!selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white/60 bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      <StepNav
        onNext={goNext}
        nextDisabled={!selectionComplete}
        nextLabel={selectionComplete ? 'Next →' : `Pick ${targetCount - selectedClips.length} more`}
      />
    </div>
  );
}
