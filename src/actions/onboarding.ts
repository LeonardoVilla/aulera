"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const onboardingSchema = z.object({
  groupSlug: z.enum(["ti", "direito"]),
  dailyMinutesTarget: z.coerce.number().int().min(10).max(480),
});

export async function salvarPerfilInicial(formData: FormData) {
  const user = await requireUser();

  const parsed = onboardingSchema.parse({
    groupSlug: formData.get("groupSlug"),
    dailyMinutesTarget: formData.get("dailyMinutesTarget"),
  });

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: parsed.groupSlug },
  });

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
    },
  });

  redirect("/dashboard");
}
