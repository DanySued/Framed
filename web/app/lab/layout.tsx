import TopBar from "@/components/layout/TopBar";
import { Toaster } from "sonner";

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
