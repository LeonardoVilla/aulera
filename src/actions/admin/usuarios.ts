"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export async function alterarRole(userId: string, role: Role) {
  const admin = await requireAdmin();

  if (userId === admin.id && role !== "ADMIN") {
    return {
      error:
        "Você não pode remover seu próprio acesso de administrador. Peça a outro admin para fazer essa alteração.",
    };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "Usuário não encontrado." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "user.role.change",
      targetType: "User",
      targetId: userId,
      metadata: { from: target.role, to: role },
    },
  });

  revalidatePath("/admin/usuarios");
  return { error: null };
}
