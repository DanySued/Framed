"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, LogOut, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

type ApiStatus = "checking" | "online" | "offline";

function ApiStatusIndicator({ status }: { status: ApiStatus }) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span className="hidden sm:inline">Checking…</span>
      </div>
    );
  }
  if (status === "online") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="hidden sm:inline">API Online</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      <span className="hidden sm:inline">API Offline</span>
    </div>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health/backend", { cache: "no-store" });
        setApiStatus(res.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="shrink-0 relative flex items-center h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <Link href="/reels" className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <Clapperboard className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground tracking-tight">Framed</span>
      </Link>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <ApiStatusIndicator status={apiStatus} />
        <div className="h-4 w-px bg-border" />
        <Link
          href="/settings"
          className={cn(
            "flex items-center px-2 h-8 rounded-md transition-colors duration-150",
            pathname === "/settings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07]"
          )}
        >
          <Settings className="w-4 h-4" />
        </Link>
        <button
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/login"))}
          className="flex items-center px-2 h-8 rounded-md transition-colors duration-150 text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.07]"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
