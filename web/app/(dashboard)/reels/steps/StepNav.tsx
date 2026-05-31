'use client';

import { ChevronLeft } from 'lucide-react';
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
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        {showSkip && (
          <button
            onClick={onSkip ?? onNext}
            className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'px-5 py-2 rounded-xl text-sm font-semibold transition-all',
            nextDisabled
              ? 'bg-secondary border border-border text-muted-foreground cursor-not-allowed opacity-50'
              : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
          )}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
