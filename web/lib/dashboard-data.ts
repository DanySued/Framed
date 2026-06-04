import type { DashboardRender } from "@/app/api/dashboard/renders/route";

interface SupabaseProject {
  id: string;
  title: string;
  status: "draft" | "rendering" | "done" | "failed";
  thumbnail_url: string | null;
  created_at: string;
}

interface SupabaseRender {
  project_id: string;
  storage_path: string;
  duration: number;
}

function sbFetch(path: string, init?: RequestInit) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

export interface DashboardClip {
  id: string;
  pexels_id: string;
  preview_url: string;
  width: number;
  height: number;
}

export interface ClipLibraryData {
  clips: DashboardClip[];
  total: number;
}

export async function getClipLibrary(): Promise<ClipLibraryData> {
  const [clipsRes, countRes] = await Promise.all([
    sbFetch(
      "/clips?select=id,pexels_id,preview_url,width,height&order=created_at.desc&limit=24"
    ),
    sbFetch("/clips?select=id", {
      headers: { Prefer: "count=exact", Range: "0-0" },
    }),
  ]);

  if (!clipsRes.ok) {
    const msg = await clipsRes.text();
    throw new Error(msg);
  }

  const clips: DashboardClip[] = await clipsRes.json();

  let total = clips.length;
  const range = countRes.headers.get("Content-Range");
  if (range) {
    const match = range.match(/\/(\d+)$/);
    if (match) total = parseInt(match[1], 10);
  }

  return { clips, total };
}

export async function getRecentRenders(): Promise<DashboardRender[]> {
  const projRes = await sbFetch(
    "/projects?select=id,title,status,thumbnail_url,created_at&order=created_at.desc&limit=20"
  );
  if (!projRes.ok) {
    const msg = await projRes.text();
    throw new Error(msg);
  }
  const projects: SupabaseProject[] = await projRes.json();

  if (projects.length === 0) return [];

  const ids = projects.map((p) => `"${p.id}"`).join(",");
  const renderRes = await sbFetch(
    `/renders?select=project_id,storage_path,duration&project_id=in.(${ids})&order=created_at.desc`
  );
  if (!renderRes.ok) {
    const msg = await renderRes.text();
    throw new Error(msg);
  }
  const renders: SupabaseRender[] = await renderRes.json();

  const latestRender = new Map<string, SupabaseRender>();
  for (const r of renders) {
    if (!latestRender.has(r.project_id)) latestRender.set(r.project_id, r);
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? "";

  return Promise.all(
    projects.map(async (p) => {
      const render = latestRender.get(p.id);
      let signedUrl: string | null = null;

      if (p.status === "done" && render?.storage_path) {
        const signRes = await sbFetch(
          `/storage/v1/object/sign/framed-renders/${encodeURIComponent(render.storage_path)}`,
          {
            method: "POST",
            body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 7 }),
          }
        );
        if (signRes.ok) {
          const { signedURL } = await signRes.json();
          signedUrl = signedURL ? `${supabaseUrl}${signedURL}` : null;
        }
      }

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        thumbnail_url: p.thumbnail_url,
        created_at: p.created_at,
        render_duration: render?.duration ?? null,
        signed_url: signedUrl,
      };
    })
  );
}
