import { StartReelSection } from "@/components/dashboard/StartReelSection";
import { RecentRenders } from "@/components/dashboard/RecentRenders";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";

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
    const base = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/dashboard/renders`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function LabDashboardPage() {
  const [audio, renders] = await Promise.all([getAudio(), getRenders()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <StartReelSection initialAudio={audio} />
      <RecentRenders renders={renders} />
    </div>
  );
}
