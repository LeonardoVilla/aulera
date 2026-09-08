"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { gerarTrilhaParaEdital } from "@/lib/trilha/gerar-cronograma";
import { iniciarSessao } from "@/actions/sessoes";
import type { StudyIntensity } from "@/generated/prisma/enums";

export async function gerarTrilha(editalId: string) {
  const user = await requireUser();

  const { trilhaId } = await gerarTrilhaParaEdital({
    userId: user.id,
    editalId,
  });

  redirect(`/trilha/${trilhaId}`);
}

/**
 * Inicia a sessão de estudo do dia a partir de um item de trilha, vinculando
 * a StudySession criada ao TrilhaItem (para depois marcar como concluído
 * quando a sessão for finalizada). Reaproveita o mesmo motor de sessão das
 * "pílulas" avulsas (iniciarSessao), apenas passando o grupo do item.
 */
export async function iniciarSessaoDoItem(trilhaItemId: string) {
  const user = await requireUser();

  const item = await prisma.trilhaItem.findUniqueOrThrow({
    where: { id: trilhaItemId },
    include: { trilha: true, subject: { include: { group: true } } },
  });

  if (item.trilha.userId !== user.id) {
    throw new Error("Item de trilha não pertence ao usuário atual.");
  }

  const groupSlug = item.subject?.group.slug;
  if (!groupSlug) {
    throw new Error("Não foi possível determinar o grupo de estudo deste item.");
  }

  await iniciarSessao(groupSlug, item.intensity as StudyIntensity, trilhaItemId);
}
