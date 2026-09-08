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
