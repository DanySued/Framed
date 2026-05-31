'use client';

import { WizardProvider } from './WizardContext';
import { WizardShell } from './WizardShell';

export default function ReelsPage() {
  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}
