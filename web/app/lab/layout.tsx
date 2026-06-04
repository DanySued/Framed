import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { Toaster } from "sonner";
import { isValidSession } from "@/lib/auth";

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = jar.get("__session")?.value;
  if (!isValidSession(session)) {
    redirect("/login?next=/lab/dashboard");
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
