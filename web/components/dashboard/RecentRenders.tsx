import Link from "next/link";
import { Plus } from "lucide-react";
import { RenderCard } from "./RenderCard";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";

interface RecentRendersProps {
  renders: DashboardRender[];
}

export function RecentRenders({ renders }: RecentRendersProps) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-normal text-foreground"
        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
      >
        Recent reels
      </h2>

      {renders.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No reels yet.{" "}
          <Link href="/reels" className="text-primary hover:underline underline-offset-4">
            <Plus className="inline w-3.5 h-3.5 -mt-0.5" /> Create your first reel.
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {renders.map((r) => (
            <RenderCard key={r.id} render={r} />
          ))}
        </div>
      )}
    </section>
  );
}
