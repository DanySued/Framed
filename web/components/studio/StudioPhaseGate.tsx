"use client";

import { useStudio, StudioPhase } from "./StudioContext";

interface Props {
  phases: StudioPhase[];
  children: React.ReactNode;
}

export default function StudioPhaseGate({ phases, children }: Props) {
  const { phase } = useStudio();
  if (!phases.includes(phase)) return null;
  return <>{children}</>;
}
