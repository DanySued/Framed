import Link from "next/link";
import { Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

interface AudioCardProps {
  id: string;
  filename: string;
  duration: number; // seconds
}

export function AudioCard({ id, filename, duration }: AudioCardProps) {
  return (
    <Link href={`/reels?audioId=${id}`} className="shrink-0 w-48 group">
      <Card className="h-full hover:border-primary/50 transition-colors duration-150">
        <CardContent className="pt-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            <Music2 className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-foreground truncate leading-tight">{filename}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatDuration(duration)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
