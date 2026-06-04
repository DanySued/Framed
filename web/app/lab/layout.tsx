import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import TopBar from "@/components/layout/TopBar";
import { Toaster } from "sonner";

function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const sig = token.slice(0, dot);
  const message = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return sig === expected;
}

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
