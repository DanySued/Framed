'use client';

import { motion } from 'motion/react';
import { Check, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_LABELS, useWizard } from './WizardContext';

export function WizardSidePanel() {
  const {
    currentStep, goToStep,
    duration, setDuration,
    isBulk, setIsBulk,
    reelCount, setReelCount,
    subtitlesEnabled, setSubtitlesEnabled,
  } = useWizard();

  return (
    <aside className="w-full md:w-72 shrink-0 border-r border-border bg-secondary/20 flex flex-col">
      {/* Step nav */}
      <nav className="p-5 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Steps
        </p>
        <ol className="space-y-1">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <li key={label}>
                <button
                  onClick={() => goToStep(i)}
                  className={cn(
                    'group w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0 transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isDone
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary border border-border text-muted-foreground'
                    )}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="step-indicator"
                      className="w-1 h-4 rounded-full bg-primary shrink-0"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        {currentStep < STEP_LABELS.length - 1 && (
          <button
            onClick={() => goToStep(currentStep + 1)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Skip this step
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </nav>

      {/* Ambient settings */}
      <div className="p-5 space-y-5 overflow-y-auto flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Settings
        </p>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Duration</label>
            <span className="text-xs font-semibold text-foreground tabular-nums">{duration}s</span>
          </div>
          <input
            type="range"
            min="3"
            max="60"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">Bulk creation</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsBulk(!isBulk)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors focus:outline-none shrink-0',
                isBulk ? 'bg-primary' : 'bg-secondary border border-border'
              )}
              aria-label="Toggle bulk creation"
            >
              <motion.span
                animate={{ x: isBulk ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow block"
              />
            </motion.button>
          </div>
          {isBulk && (
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setReelCount(n)}
                  className={cn(
                    'py-1.5 rounded-md text-xs font-semibold border transition-colors',
                    reelCount === n
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground">Auto subtitles</span>
              <span className="text-[10px] text-muted-foreground">Burn captions + .srt export</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors focus:outline-none shrink-0',
                subtitlesEnabled ? 'bg-sky-500' : 'bg-secondary border border-border'
              )}
              aria-label="Toggle auto subtitles"
            >
              <motion.span
                animate={{ x: subtitlesEnabled ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow block"
              />
            </motion.button>
          </div>
        </div>
      </div>
    </aside>
  );
}
