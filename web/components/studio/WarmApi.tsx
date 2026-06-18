"use client";

import { useEffect } from "react";

// Fire-and-forget wake-up for the Render free-tier backend on studio load,
// so the cold start happens in the background instead of on the user's first
// clip search. Renders nothing.
export default function WarmApi() {
  useEffect(() => {
    fetch("/api/warm", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
