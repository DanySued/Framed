import type { DashboardClip } from "@/lib/dashboard-data";

interface ClipTileProps {
  clip: DashboardClip;
}

export function ClipTile({ clip }: ClipTileProps) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-md bg-fr-black group cursor-default"
      title={`Pexels ID: ${clip.pexels_id}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={clip.preview_url}
        alt={`Pexels clip ${clip.pexels_id}`}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      <span
        className="absolute bottom-1 right-1 text-[10px] leading-none font-medium px-1.5 py-0.5 rounded"
        style={{
          background: "color-mix(in srgb, var(--fr-black) 70%, transparent)",
          color: "var(--fr-gold)",
        }}
      >
        {clip.width}×{clip.height}
      </span>
    </div>
  );
}
