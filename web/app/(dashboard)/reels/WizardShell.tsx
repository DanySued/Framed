'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { STEP_LABELS, useWizard } from './WizardContext';
import { AudioStep } from './steps/AudioStep';
import { KeywordsStep } from './steps/KeywordsStep';
import { SettingsStep } from './steps/SettingsStep';
import { TextStep } from './steps/TextStep';
import { GenerateStep } from './steps/GenerateStep';

const STEPS = [AudioStep, KeywordsStep, SettingsStep, TextStep, GenerateStep];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  }),
};

export function WizardShell() {
  const { currentStep, direction } = useWizard();
  const StepComponent = STEPS[currentStep];

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      {/* Progress header */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-1 last:flex-none">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0 transition-all duration-300',
                    i < currentStep
                      ? 'bg-primary scale-90'
                      : i === currentStep
                        ? 'bg-primary ring-2 ring-primary/30 scale-125'
                        : 'bg-border'
                  )}
                />
                {i < STEP_LABELS.length - 1 && (
                  <div className={cn('flex-1 h-px transition-colors duration-300', i < currentStep ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {STEP_LABELS.length}{' '}
            <span className="text-foreground font-medium">— {STEP_LABELS[currentStep]}</span>
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="max-w-lg mx-auto px-6 py-8"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
