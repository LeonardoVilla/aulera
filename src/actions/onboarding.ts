"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { ThemePreference } from "@/generated/prisma/enums";

const onboardingSchema = z.object({
  groupSlug: z.enum(["ti", "direito"]),
  dailyMinutesTarget: z.coerce.number().int().min(10).max(480),
});

const THEME_HINT_COOKIE = "theme-preference-hint";

function readThemePreferenceHint(rawValue: string | undefined): ThemePreference {
  return rawValue === "GAMIFICADO" ? "GAMIFICADO" : "CLASSICO";
}

export async function salvarPerfilInicial(formData: FormData) {
  const user = await requireUser();

  const parsed = onboardingSchema.parse({
    groupSlug: formData.get("groupSlug"),
    dailyMinutesTarget: formData.get("dailyMinutesTarget"),
  });

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: parsed.groupSlug },
  });

  const existingProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  // A preferência de tema escolhida na tela de login (antes de existir um
  // StudentProfile) é lida de um cookie e aplicada apenas na criação do
  // perfil — se o usuário já tiver um perfil (ex: reonboarding), não
  // sobrescrevemos uma escolha já feita em /conta/perfil.
  const cookieStore = await cookies();
  const themePreferenceHint = readThemePreferenceHint(
    cookieStore.get(THEME_HINT_COOKIE)?.value,
  );

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      primaryGroupId: group.id,
      dailyMinutesTarget: parsed.dailyMinutesTarget,
      onboardedAt: new Date(),
    },
    create: {
      userId: user.id,
      primaryGroupId: group.id,
      dailyMinutesTarget: parsed.dailyMinutesTarget,
      onboardedAt: new Date(),
      themePreference: themePreferenceHint,
    },
  });

  if (!existingProfile) {
    cookieStore.delete(THEME_HINT_COOKIE);
  }

  redirect("/dashboard");
}
