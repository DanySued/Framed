import { NextResponse } from "next/server";

export interface DashboardRender {
  id: string;
  title: string;
  status: "draft" | "rendering" | "done" | "failed";
  thumbnail_url: string | null;
  created_at: string;
  render_duration: number | null;
  signed_url: string | null;
}

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

export async function GET() {
  try {
    const projRes = await sbFetch(
      "/projects?select=id,title,status,thumbnail_url,created_at&order=created_at.desc&limit=20"
    );
    if (!projRes.ok) {
      const msg = await projRes.text();
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    const projects: SupabaseProject[] = await projRes.json();

    if (projects.length === 0) return NextResponse.json([]);

    const ids = projects.map((p) => `"${p.id}"`).join(",");
    const renderRes = await sbFetch(
      `/renders?select=project_id,storage_path,duration&project_id=in.(${ids})&order=created_at.desc`
    );
    if (!renderRes.ok) {
      const msg = await renderRes.text();
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    const renders: SupabaseRender[] = await renderRes.json();

    // Keep latest render per project (already ordered desc)
    const latestRender = new Map<string, SupabaseRender>();
    for (const r of renders) {
      if (!latestRender.has(r.project_id)) latestRender.set(r.project_id, r);
    }

    // Generate signed URLs for done projects with a storage_path
    const results: DashboardRender[] = await Promise.all(
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
            const base = process.env.SUPABASE_URL ?? "";
            signedUrl = signedURL ? `${base}/storage/v1${signedURL}` : null;
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

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
