import { Metadata } from "next";
import { notFound } from "next/navigation";

interface ReelMeta {
  id: string;
  slug: string;
  title: string;
  keywords: string;
  duration: number;
  created_at: string | null;
}

async function getFilm(slug: string): Promise<ReelMeta | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/reels/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const film = await getFilm(slug);
  if (!film) return { title: "Film not found — framed" };
  const title = film.title || film.keywords.split(",")[0]?.trim() || "untitled";
  return {
    title: `${title} — framed`,
    description: `A cinematic reel made with framed · ${film.duration}s`,
    openGraph: {
      title: `${title} — framed`,
      description: `A cinematic reel made with framed`,
      type: "video.other",
      videos: [{ url: `/api/reels/public/${slug}/video` }],
    },
  };
}

export default async function PublicFilmPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const film = await getFilm(slug);
  if (!film) notFound();

  const title = film.title || film.keywords.split(",")[0]?.trim() || "untitled";
  const videoSrc = `/api/reels/public/${slug}/video`;
  const date = film.created_at
    ? new Date(film.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#04110e",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px 48px",
      gap: 28,
    }}>
      {/* Film */}
      <div style={{
        position: "relative",
        height: "min(82vh, 560px)",
        aspectRatio: "9 / 16",
        borderRadius: 12,
        overflow: "hidden",
        background: "#060909",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      }}>
        <video
          src={videoSrc}
          controls
          autoPlay
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Meta */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "1.125rem",
          fontStyle: "italic",
          fontWeight: 400,
          color: "#e8e0d0",
          margin: 0,
          letterSpacing: "0.02em",
        }}>
          {title}
        </h1>
        {date && (
          <p style={{ fontFamily: "monospace", fontSize: "0.5625rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            {date}
          </p>
        )}
      </div>

      {/* Watermark */}
      <a
        href="/studio"
        style={{
          fontFamily: "monospace",
          fontSize: "0.5rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(82,214,196,0.5)",
          textDecoration: "none",
          transition: "color 150ms ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(82,214,196,0.9)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(82,214,196,0.5)"; }}
      >
        made with framed
      </a>
    </div>
  );
}
