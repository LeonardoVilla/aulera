"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const perfilSchema = z.object({
  themePreference: z.enum(["CLASSICO", "GAMIFICADO"]),
});

export async function atualizarPreferenciaTema(formData: FormData) {
  const user = await requireUser();

  const parsed = perfilSchema.parse({
    themePreference: formData.get("themePreference"),
  });

  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      themePreference: parsed.themePreference,
    },
  });

  redirect("/conta/perfil?atualizado=1");
}

const grupoSchema = z.object({
  groupSlug: z.enum(["ti", "direito"]),
});

/**
 * Troca o grupo de estudo principal do usuário. Não afeta o histórico de
 * sessões, trilhas ou editais já existentes — apenas muda qual grupo é usado
 * como padrão em "Estudar agora" e nos cards do dashboard a partir de agora.
 */
export async function atualizarGrupoPrincipal(formData: FormData) {
  const user = await requireUser();

  const parsed = grupoSchema.parse({
    groupSlug: formData.get("groupSlug"),
  });

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: parsed.groupSlug },
  });

  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: { primaryGroupId: group.id },
  });

  redirect("/conta/perfil?atualizado=1");
}
