import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession } from "@/lib/auth";
import { StartReelSection } from "@/components/dashboard/StartReelSection";
import { RecentRenders } from "@/components/dashboard/RecentRenders";
import { ClipLibrarySection } from "@/components/dashboard/ClipLibrarySection";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";
import { getRecentRenders, getClipLibrary } from "@/lib/dashboard-data";
import type { ClipLibraryData } from "@/lib/dashboard-data";

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

async function getClips(): Promise<ClipLibraryData> {
  try {
    return await getClipLibrary();
  } catch {
    return { clips: [], total: 0 };
  }
}

export default async function DashboardPage() {
  const jar = await cookies();
  const session = jar.get("__session")?.value;
  if (!isValidSession(session)) {
    redirect("/login");
  }

  const [audio, renders, clipData] = await Promise.all([
    getAudio(),
    getRenders(),
    getClips(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <StartReelSection initialAudio={audio} />
      <RecentRenders renders={renders} />
      <ClipLibrarySection data={clipData} />
    </div>
  );
}
