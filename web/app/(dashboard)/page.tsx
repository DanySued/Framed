import { StartReelSection } from "@/components/dashboard/StartReelSection";
import { RecentRenders } from "@/components/dashboard/RecentRenders";
import { getRecentRenders, getClipLibrary } from "@/lib/dashboard-data";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";
import Link from "next/link";
import { Film, Layers, CheckCircle2 } from "lucide-react";

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
}

async function getAudio(): Promise<AudioFile[]> {
  try {
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/reels/audio`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getRenders(): Promise<DashboardRender[]> {
  try {
    return await getRecentRenders();
  } catch {
    return [];
  }
}

async function getClips() {
  try {
    return await getClipLibrary();
  } catch {
    return { clips: [], total: 0 };
  }
}

export default async function DashboardPage() {
  const [audio, renders, clipData] = await Promise.all([
    getAudio(),
    getRenders(),
    getClips(),
  ]);

  const done = renders.filter((r) => r.status === "done").length;
  const rendering = renders.filter((r) => r.status === "rendering").length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[rgba(255,255,255,0.07)]">
        <h1
          className="text-[15px] font-normal text-[rgba(245,240,232,0.85)]"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Dashboard
        </h1>
        <Link
          href="/reels"
          className="flex items-center gap-1.5 h-7 px-3 rounded text-[12px] font-medium bg-[var(--fr-gold)] text-[#0a0800] hover:bg-[var(--fr-gold-dim)] transition-colors"
        >
          + New reel
        </Link>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-stretch border-b border-[rgba(255,255,255,0.07)]">
        <StatCell
          icon={<Film className="w-3.5 h-3.5" />}
          label="Total reels"
          value={renders.length}
        />
        <StatCell
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="Completed"
          value={done}
          accent="green"
        />
        <StatCell
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Clips cached"
          value={clipData.total}
        />
        {rendering > 0 && (
          <StatCell
            icon={<span className="w-2 h-2 rounded-full bg-[var(--fr-gold)] animate-pulse inline-block" />}
            label="Rendering"
            value={rendering}
            accent="gold"
          />
        )}
      </div>

      {/* ── Content sections ── */}
      <div className="mt-6 space-y-6">
        <RecentRenders renders={renders} />
        <StartReelSection initialAudio={audio} />
      </div>
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "green" | "gold";
}) {
  const accentColor: Record<string, string> = {
    green: "text-[var(--fr-green)]",
    gold:  "text-[var(--fr-gold)]",
  };
  const valueColor = accentColor[accent ?? ""] ?? "text-[rgba(245,240,232,0.85)]";

  return (
    <div className="flex-1 flex flex-col gap-1 px-5 py-4 border-r border-[rgba(255,255,255,0.07)] last:border-r-0">
      <div className="flex items-center gap-1.5 text-[rgba(245,240,232,0.3)]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.08em]">{label}</span>
      </div>
      <span className={`text-[22px] font-light tabular-nums leading-none ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
