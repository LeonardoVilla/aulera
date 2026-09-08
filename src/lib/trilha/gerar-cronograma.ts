import "server-only";
import { prisma } from "@/lib/prisma";
import { canAccessFeature } from "@/lib/features/access-control";
import type { StudyIntensity } from "@/generated/prisma/enums";

const DEFAULT_PREVIEW_DAYS = 14;

type WeeklyAvailability = Partial<
  Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    ("manha" | "almoco" | "noite")[]
  >
>;

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function intensityForDay(slotsCount: number): StudyIntensity {
  if (slotsCount >= 3) return "FOCO";
  if (slotsCount === 2) return "ALMOCO";
  return "CURTA";
}

/**
 * Gera a trilha de estudos (Trilha + TrilhaItem[]) para um edital já
 * parseado, distribuindo as disciplinas do edital ao longo dos dias
 * disponíveis até a data da prova, respeitando a disponibilidade semanal do
 * aluno e o teto de profundidade permitido pelo plano de assinatura.
 *
 * Regra de negócio: disciplinas com mais questões no edital recebem mais
 * TrilhaItem (mais dias de estudo dedicados a elas), proporcionalmente ao
 * peso/numQuestions. Dias sem disponibilidade declarada assumem 1 slot
 * (intensidade CURTA) como fallback, para nunca gerar uma trilha vazia.
 */
export async function gerarTrilhaParaEdital(params: {
  userId: string;
  editalId: string;
}): Promise<{ trilhaId: string }> {
  const { userId, editalId } = params;

  const edital = await prisma.edital.findUniqueOrThrow({
    where: { id: editalId },
    include: { subjects: true },
  });

  if (edital.userId !== userId) {
    throw new Error("Edital não pertence ao usuário atual.");
  }
  if (edital.status !== "CONCLUIDO") {
    throw new Error("O edital ainda não terminou de ser processado.");
  }
  if (edital.subjects.length === 0) {
    throw new Error(
      "Não foi possível identificar disciplinas neste edital para montar uma trilha.",
    );
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  const access = await canAccessFeature(userId, "trilha_profundidade_dias");
  const maxDays = access.limit ?? DEFAULT_PREVIEW_DAYS;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = edital.examDate;
  const daysUntilExam = examDate
    ? Math.max(
        1,
        Math.ceil((examDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
      )
    : DEFAULT_PREVIEW_DAYS;

  const trilhaDurationDays = Math.min(daysUntilExam, maxDays);

  const weeklyAvailability =
    (profile?.weeklyAvailability as WeeklyAvailability | null) ?? null;

  // Distribui um TrilhaItem por dia disponível, ciclando pelas disciplinas
  // do edital proporcionalmente ao número de questões (mais questões = mais
  // dias dedicados). Constrói uma "fila ponderada" de disciplinas repetindo
  // cada uma na proporção do seu peso relativo.
  const totalQuestions = edital.subjects.reduce(
    (sum, s) => sum + (s.numQuestions ?? 1),
    0,
  );
  const weightedSubjectQueue: string[] = [];
  for (const subject of edital.subjects) {
    const share = (subject.numQuestions ?? 1) / totalQuestions;
    const slots = Math.max(1, Math.round(share * trilhaDurationDays));
    for (let i = 0; i < slots; i++) {
      weightedSubjectQueue.push(subject.id);
    }
  }

  const trilha = await prisma.$transaction(async (tx) => {
    const createdTrilha = await tx.trilha.create({
      data: {
        userId,
        editalId,
        title: `Trilha — ${edital.cargo ?? edital.orgao ?? edital.originalFileName}`,
        targetDate: examDate,
      },
    });

    const items = [];
    for (let dayOffset = 0, queueIndex = 0; dayOffset < trilhaDurationDays; dayOffset++) {
      const scheduledDate = addDays(today, dayOffset);
      const weekdayKey = WEEKDAY_KEYS[scheduledDate.getDay()];
      const slots = weeklyAvailability?.[weekdayKey]?.length ?? 1;

      const subjectId =
        weightedSubjectQueue[queueIndex % weightedSubjectQueue.length];
      queueIndex++;

      items.push({
        trilhaId: createdTrilha.id,
        scheduledDate,
        order: dayOffset,
        subjectId,
        intensity: intensityForDay(slots),
      });
    }

    await tx.trilhaItem.createMany({ data: items });

    return createdTrilha;
  });

  return { trilhaId: trilha.id };
}
