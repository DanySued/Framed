export interface StudioTemplate {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  keywords: string[];         // search terms, first is primary
  vibe: string | null;        // CSS filter string matching VIBE_PRESETS
  duration: number;           // suggested duration in seconds
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: "golden-hour",
    name: "Golden Hour",
    tagline: "warm dusk light",
    emoji: "◑",
    keywords: ["golden hour walk", "sunset park"],
    vibe: "saturate(1.3) sepia(0.2) contrast(1.08) brightness(1.05)",
    duration: 30,
  },
  {
    id: "neon-night",
    name: "Neon Night",
    tagline: "electric city after dark",
    emoji: "◕",
    keywords: ["neon lights night city", "urban night street"],
    vibe: "saturate(1.7) contrast(1.12) hue-rotate(-15deg)",
    duration: 30,
  },
  {
    id: "coastal-dream",
    name: "Coastal Dream",
    tagline: "faded film, sea air",
    emoji: "◔",
    keywords: ["ocean beach waves", "coastal morning"],
    vibe: "saturate(0.7) contrast(0.88) brightness(1.08) sepia(0.08)",
    duration: 30,
  },
  {
    id: "noir",
    name: "Noir",
    tagline: "stark contrast, deep shadows",
    emoji: "●",
    keywords: ["street portrait", "city people monochrome"],
    vibe: "grayscale(0.85) contrast(1.25) brightness(0.9)",
    duration: 25,
  },
];
