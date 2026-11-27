import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "admin") {
    redirect("/admin/users");
  }

  redirect("/dashboard");
}
