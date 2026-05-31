'use client';

import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useWizard } from '../WizardContext';

interface StepNavProps {
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
  onSkip?: () => void;
  hideBack?: boolean;
}

export function StepNav({
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  showSkip = false,
  onSkip,
  hideBack = false,
}: StepNavProps) {
  const { currentStep, goBack } = useWizard();

  return (
    <div className="flex items-center justify-between pt-8">
      {!hideBack && currentStep > 0 ? (
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        {showSkip && (
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSkip ?? onNext}
            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </motion.button>
        )}
        <motion.button
          whileHover={nextDisabled ? {} : { scale: 1.03, boxShadow: '0 0 20px rgba(212,168,75,0.35)' }}
          whileTap={nextDisabled ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'px-5 py-2 rounded-xl text-sm font-semibold transition-all',
            nextDisabled
              ? 'bg-secondary border border-border text-muted-foreground cursor-not-allowed opacity-50'
              : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20'
          )}
        >
          {nextLabel}
        </motion.button>
      </div>
    </div>
  );
}
