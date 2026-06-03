'use client';

import { KeywordEngine } from '@/components/reels/KeywordEngine';
import { useWizard } from '../WizardContext';
import { StepNav } from './StepNav';

export function KeywordsStep() {
  const { keywords, setKeywords, goNext } = useWizard();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl">What&apos;s it about?</h1>
        <p className="text-sm text-muted-foreground mt-1">Add keywords that describe the footage you want.</p>
      </div>

      <KeywordEngine keywords={keywords} onKeywordsChange={setKeywords} />

      <StepNav
        onNext={goNext}
        nextDisabled={keywords.length === 0}
        nextLabel="Next →"
      />
    </div>
  );
}
