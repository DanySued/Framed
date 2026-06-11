import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const authed = await getSession();
  if (authed) redirect("/studio");

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--fr-black)" }}
    >
      <LoginForm />
    </main>
  );
}
