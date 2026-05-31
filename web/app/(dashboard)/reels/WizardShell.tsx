'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { STEP_LABELS, useWizard } from './WizardContext';
import { AudioStep } from './steps/AudioStep';
import { KeywordsStep } from './steps/KeywordsStep';
import { SettingsStep } from './steps/SettingsStep';
import { TextStep } from './steps/TextStep';
import { GenerateStep } from './steps/GenerateStep';

// cn is used by the unused variable linter check - keep import
void cn;

const STEPS = [AudioStep, KeywordsStep, SettingsStep, TextStep, GenerateStep];

const STEP_DOT_GLOW = '0 0 0 4px rgba(170,168,255,0.2)';
const STEP_DOT_NONE = '0 0 0 0px rgba(170,168,255,0)';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    filter: 'blur(2px)',
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
                <motion.div
                  animate={{
                    scale: i === currentStep ? 1.25 : i < currentStep ? 0.9 : 1,
                    backgroundColor: i <= currentStep ? 'var(--primary)' : 'var(--border)',
                    boxShadow: i === currentStep ? STEP_DOT_GLOW : STEP_DOT_NONE,
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-2 h-2 rounded-full shrink-0"
                />
                {i < STEP_LABELS.length - 1 && (
                  <div className="flex-1 h-px bg-border overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-primary rounded-full origin-left"
                      animate={{ scaleX: i < currentStep ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-xs text-muted-foreground"
          >
            Step {currentStep + 1} of {STEP_LABELS.length}{' '}
            <span className="text-foreground font-medium">— {STEP_LABELS[currentStep]}</span>
          </motion.p>
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
