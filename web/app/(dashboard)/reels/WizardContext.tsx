'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { TextOverlayItem } from '@/lib/ReelGenerationContext';

export interface TextOverlay extends TextOverlayItem {
  id: string;
}

export interface SelectedClip {
  id: number;
  url: string;
  duration: number;
}

interface WizardState {
  // Keywords
  keywords: string[];
  setKeywords: (kw: string[]) => void;

  // Selected video clips
  selectedClips: SelectedClip[];
  setSelectedClips: React.Dispatch<React.SetStateAction<SelectedClip[]>>;

  // Audio
  selectedAudioId: string;
  setSelectedAudioId: (id: string) => void;
  songStartTime: number;
  setSongStartTime: (t: number) => void;
  selectedAudioDuration: number;
  setSelectedAudioDuration: (d: number) => void;

  // Settings (live in side panel, not a step)
  duration: number;
  setDuration: (d: number) => void;
  isBulk: boolean;
  setIsBulk: (b: boolean) => void;
  reelCount: number;
  setReelCount: (n: number) => void;
  subtitlesEnabled: boolean;
  setSubtitlesEnabled: (b: boolean) => void;

  // Text overlay
  overlays: TextOverlay[];
  setOverlays: React.Dispatch<React.SetStateAction<TextOverlay[]>>;
  noText: boolean;
  setNoText: (b: boolean) => void;
  selectedOverlayId: string;
  setSelectedOverlayId: (id: string) => void;
  nextOverlayIdRef: React.MutableRefObject<number>;

  // Navigation
  currentStep: number;
  direction: 1 | -1;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
}

const WizardContext = createContext<WizardState | null>(null);

export const STEP_LABELS = ['Keywords', 'Select Video', 'Audio', 'Text Overlay', 'Generate'];
export const TOTAL_STEPS = STEP_LABELS.length;

export function WizardProvider({ children }: { children: ReactNode }) {
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [songStartTime, setSongStartTime] = useState(0);
  const [selectedAudioDuration, setSelectedAudioDuration] = useState(0);

  const [keywords, setKeywords] = useState<string[]>([]);

  const [duration, setDuration] = useState(15);
  const [isBulk, setIsBulk] = useState(false);
  const [reelCount, setReelCount] = useState(3);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

  const [overlays, setOverlays] = useState<TextOverlay[]>([
    { id: '1', text: '', x: 50, y: 82, font: 'sans', bold: false, italic: false },
  ]);
  const [noText, setNoText] = useState(true);
  const [selectedOverlayId, setSelectedOverlayId] = useState('1');
  const nextOverlayIdRef = useRef(2);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goNext = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  return (
    <WizardContext.Provider value={{
      selectedAudioId, setSelectedAudioId,
      songStartTime, setSongStartTime,
      selectedAudioDuration, setSelectedAudioDuration,
      keywords, setKeywords,
      duration, setDuration,
      isBulk, setIsBulk,
      reelCount, setReelCount,
      subtitlesEnabled, setSubtitlesEnabled,
      overlays, setOverlays,
      noText, setNoText,
      selectedOverlayId, setSelectedOverlayId,
      nextOverlayIdRef,
      currentStep, direction,
      goNext, goBack, goToStep,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be inside WizardProvider');
  return ctx;
}
