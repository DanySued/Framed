'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useWizard } from './WizardContext';
import { KeywordsStep } from './steps/KeywordsStep';
import { SelectVideoStep } from './steps/SelectVideoStep';
import { AudioStep } from './steps/AudioStep';
import { TextStep } from './steps/TextStep';
import { GenerateStep } from './steps/GenerateStep';
import { WizardSidePanel } from './WizardSidePanel';

const STEPS = [KeywordsStep, SelectVideoStep, AudioStep, TextStep, GenerateStep];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  }),
};

export function WizardShell() {
  const { currentStep, direction } = useWizard();
  const StepComponent = STEPS[currentStep];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-56px)]">
      <WizardSidePanel />

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-12">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-2xl px-6"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
