import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export async function requireUser(): Promise<Session["user"]> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireAdmin(): Promise<Session["user"]> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireOnboardedUser(): Promise<Session["user"]> {
  const user = await requireUser();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile?.onboardedAt) {
    redirect("/onboarding");
  }
  return user;
}
