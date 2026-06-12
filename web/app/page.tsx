import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Auth temporarily disabled — go straight to the studio.
  redirect("/studio");
}
