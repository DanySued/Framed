"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, LogOut, Clapperboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </span>
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
      <Link href="/reels" className="flex items-center gap-2 shrink-0 group">
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 ring-1 ring-primary/30 group-hover:bg-primary/25 group-hover:ring-primary/50 group-hover:shadow-[0_0_14px_rgba(212,168,75,0.3)] transition-all duration-200"
        >
          <Clapperboard className="w-3.5 h-3.5 text-primary" />
        </motion.div>
        <span className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors duration-150">Framed</span>
      </Link>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={apiStatus}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ApiStatusIndicator status={apiStatus} />
          </motion.div>
        </AnimatePresence>
        <div className="h-4 w-px bg-border" />
        <Link
          href="/settings"
          className={cn(
            "relative flex items-center px-2 h-8 rounded-md transition-all duration-150",
            pathname === "/settings"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07]"
          )}
        >
          <Settings className="w-4 h-4" />
          {pathname === "/settings" && (
            <motion.span
              layoutId="nav-active-dot"
              className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </Link>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/login"))}
          className="flex items-center px-2 h-8 rounded-md transition-colors duration-150 text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.07]"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
}
