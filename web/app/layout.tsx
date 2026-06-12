import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { dmSans, instrumentSerif, geistMono } from "@/lib/fonts";
import { Grain } from "@/components/fx/Grain";
import "./globals.css";

export const metadata: Metadata = {
  title: "Framed",
  description: "Cinematic reels from keywords and music.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body
        className="h-full antialiased"
        style={{ backgroundColor: "var(--fr-black)", color: "var(--fr-ivory)" }}
      >
        <Grain />
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster
            richColors={false}
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--fr-surface)",
                border: "1px solid var(--fr-line)",
                color: "var(--fr-ivory)",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                animation: "fr-slide-in 0.3s ease-out",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
