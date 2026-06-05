import { Skeleton } from "@/components/ui/skeleton";
import type { ClipLibraryData } from "@/lib/dashboard-data";
import { ClipTile } from "./ClipTile";

interface ClipLibrarySectionProps {
  data: ClipLibraryData;
}

export function ClipLibrarySection({ data }: ClipLibrarySectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2
          className="text-xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Clip library
        </h2>
        <p className="text-sm text-muted-foreground">
          Reused Pexels clips across your reels
        </p>
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">
        {data.total} {data.total === 1 ? "clip" : "clips"} cached
      </p>

      {data.clips.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No clips cached yet. Generate a reel to start the library.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {data.clips.map((clip) => (
            <ClipTile key={clip.id} clip={clip} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ClipLibrarySkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-md" />
        ))}
      </div>
    </section>
  );
}
