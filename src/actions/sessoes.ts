"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { INTENSITY_QUESTION_COUNT } from "@/lib/constants";
import type { StudyIntensity } from "@/generated/prisma/enums";

export async function iniciarSessao(groupSlug: string, intensity: StudyIntensity) {
  const user = await requireUser();

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: groupSlug },
  });

  const desiredCount = INTENSITY_QUESTION_COUNT[intensity];

  const questions = await prisma.question.findMany({
    where: {
      groupId: group.id,
      isActive: true,
      intensity: { has: intensity },
    },
    take: desiredCount,
  });

  if (questions.length === 0) {
    throw new Error(
      "Nenhuma questão disponível para este grupo ainda. Tente novamente mais tarde.",
    );
  }

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.studySession.create({
      data: {
        userId: user.id,
        groupId: group.id,
        intensity,
      },
    });

    await tx.answer.createMany({
      data: questions.map((q, index) => ({
        sessionId: created.id,
        questionId: q.id,
        userId: user.id,
        order: index,
      })),
    });

    return created;
  });

  redirect(`/sessao/${session.id}`);
}

const answerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  selectedOptionId: z.string(),
});

export async function responderQuestaoObjetiva(formData: FormData) {
  const user = await requireUser();

  const parsed = answerSchema.parse({
    sessionId: formData.get("sessionId"),
    questionId: formData.get("questionId"),
    selectedOptionId: formData.get("selectedOptionId"),
  });

  const question = await prisma.question.findUniqueOrThrow({
    where: { id: parsed.questionId },
  });

  const isCorrect = question.correctOptionId === parsed.selectedOptionId;

  await prisma.answer.update({
    where: {
      sessionId_questionId: {
        sessionId: parsed.sessionId,
        questionId: parsed.questionId,
      },
      userId: user.id,
    },
    data: {
      selectedOptionId: parsed.selectedOptionId,
      isCorrect,
      answeredAt: new Date(),
    },
  });

  redirect(`/sessao/${parsed.sessionId}`);
}

export async function finalizarSessao(sessionId: string) {
  const user = await requireUser();

  const session = await prisma.studySession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { answers: true },
  });

  if (session.userId !== user.id) {
    throw new Error("Sessão não pertence ao usuário atual.");
  }

  const objectiveAnswers = session.answers.filter((a) => a.isCorrect !== null);
  const scoreObjective =
    objectiveAnswers.length > 0
      ? (objectiveAnswers.filter((a) => a.isCorrect).length /
          objectiveAnswers.length) *
        100
      : null;

  await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      status: "FINALIZADA",
      finishedAt: new Date(),
      scoreObjective,
    },
  });

  redirect(`/sessao/${sessionId}/resultado`);
}
