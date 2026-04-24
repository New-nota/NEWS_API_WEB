import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/users";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
