import { Download, Film } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BadgeProps } from "@/components/ui/badge";
import type { DashboardRender } from "@/app/api/dashboard/renders/route";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_VARIANT: Record<DashboardRender["status"], BadgeProps["variant"]> = {
  done: "success",
  rendering: "default",
  failed: "destructive",
  draft: "secondary",
};

const STATUS_LABEL: Record<DashboardRender["status"], string> = {
  done: "Done",
  rendering: "Rendering",
  failed: "Failed",
  draft: "Draft",
};

interface RenderCardProps {
  render: DashboardRender;
}

export function RenderCard({ render }: RenderCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] w-full max-h-40 bg-fr-black flex items-center justify-center overflow-hidden">
        {render.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={render.thumbnail_url}
            alt={render.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-fr-black">
            <Film className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={STATUS_VARIANT[render.status]}>{STATUS_LABEL[render.status]}</Badge>
        </div>
      </div>

      <CardContent className="pt-3 space-y-1">
        <p className="text-sm font-medium text-foreground truncate leading-tight">{render.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {render.render_duration != null && (
            <span className="tabular-nums">{formatDuration(render.render_duration)}</span>
          )}
          {render.render_duration != null && <span>·</span>}
          <span>{relativeTime(render.created_at)}</span>
        </div>
      </CardContent>

      {render.signed_url && (
        <CardFooter className="pt-0">
          <Button asChild size="sm" variant="outline" className="w-full">
            <a href={render.signed_url} download>
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
