import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardPathForUser } from "@/lib/auth-routing";

export default async function NotFound() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("revure_user")?.value;
  const token = cookieStore.get("revure_token")?.value;

  let user = null;

  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch (error) {
      console.error("Failed to parse user cookie in not-found route:", error);
    }
  }

  if (user && token) {
    redirect(getDashboardPathForUser(user));
  }

  redirect("/");
}
