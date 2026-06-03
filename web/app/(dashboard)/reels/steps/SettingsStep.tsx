'use client';

import { Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useWizard } from '../WizardContext';
import { StepNav } from './StepNav';

export function SettingsStep() {
  const {
    duration, setDuration,
    isBulk, setIsBulk,
    reelCount, setReelCount,
    subtitlesEnabled, setSubtitlesEnabled,
    goNext,
  } = useWizard();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure duration, quantity, and captions.</p>
      </div>

      <div className="space-y-4 bg-secondary/50 rounded-xl border border-border p-5">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Duration: <span className="text-foreground font-semibold">{duration}s</span>
          </label>
          <input
            type="range"
            min="3"
            max="60"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Bulk Creation</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Generate multiple reels with different footage</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsBulk(!isBulk)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
              isBulk ? 'bg-primary shadow-[0_0_10px_rgba(170,168,255,0.4)]' : 'bg-secondary border border-border'
            )}
            aria-label="Toggle bulk creation"
          >
            <motion.span
              animate={{ x: isBulk ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow block"
            />
          </motion.button>
        </div>

        <AnimatePresence>
          {isBulk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-0.5">
                <label className="block text-xs font-medium text-muted-foreground mb-2">Number of reels</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setReelCount(n)}
                      className={cn(
                        'py-2 rounded-xl text-sm font-semibold border transition-all',
                        reelCount === n
                          ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_8px_rgba(170,168,255,0.2)]'
                          : 'bg-secondary border-border text-muted-foreground hover:border-violet-400/30 hover:text-primary'
                      )}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h6" />
              </svg>
              <span className="text-sm font-medium text-foreground">Auto Subtitles</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transcribe audio with AI — burns captions into the video and exports a .srt file
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0',
              subtitlesEnabled ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-secondary border border-border'
            )}
            aria-label="Toggle auto subtitles"
          >
            <motion.span
              animate={{ x: subtitlesEnabled ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow block"
            />
          </motion.button>
        </div>
      </div>

      <StepNav onNext={goNext} nextLabel="Next →" />
    </div>
  );
}
