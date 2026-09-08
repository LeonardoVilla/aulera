"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { INTENSITY_QUESTION_COUNT } from "@/lib/constants";
import {
  gerarQuestoesParaSessao,
  gerarQuestaoDiscursivaParaSessao,
} from "@/actions/questoes";
import { applyGamificationForSession } from "@/lib/gamification";
import { geminiProvider } from "@/lib/ai/gemini-provider";
import { logAIUsage } from "@/lib/ai/usage-tracker";
import type { StudyIntensity } from "@/generated/prisma/enums";

const DISCURSIVE_COUNT_BY_INTENSITY: Record<StudyIntensity, number> = {
  CURTA: 0,
  ALMOCO: 0,
  FOCO: 1,
};

export async function iniciarSessao(
  groupSlug: string,
  intensity: StudyIntensity,
  trilhaItemId?: string,
) {
  const user = await requireUser();

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: groupSlug },
  });

  const desiredCount = INTENSITY_QUESTION_COUNT[intensity];

  let questions = await prisma.question.findMany({
    where: {
      groupId: group.id,
      isActive: true,
      type: "MULTIPLA_ESCOLHA",
      intensity: { has: intensity },
    },
    take: desiredCount,
  });

  if (questions.length < desiredCount) {
    const missingCount = desiredCount - questions.length;
    try {
      const generated = await gerarQuestoesParaSessao({
        groupId: group.id,
        groupSlug: group.slug,
        groupName: group.name,
        intensity,
        missingCount,
        userId: user.id,
      });
      questions = [...questions, ...generated];
    } catch {
      // Segue com as questões fixture disponíveis se a geração via IA falhar.
    }
  }

  const discursiveCount = DISCURSIVE_COUNT_BY_INTENSITY[intensity];
  const discursiveQuestions = [];
  for (let i = 0; i < discursiveCount; i++) {
    const discursiveQuestion = await gerarQuestaoDiscursivaParaSessao({
      groupId: group.id,
      groupSlug: group.slug,
      groupName: group.name,
      intensity,
      userId: user.id,
    });
    if (discursiveQuestion) discursiveQuestions.push(discursiveQuestion);
  }
  questions = [...questions, ...discursiveQuestions];

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
        trilhaItemId,
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

const discursiveAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  textAnswer: z.string().min(1),
});

export async function responderQuestaoDiscursiva(formData: FormData) {
  const user = await requireUser();

  const parsed = discursiveAnswerSchema.parse({
    sessionId: formData.get("sessionId"),
    questionId: formData.get("questionId"),
    textAnswer: formData.get("textAnswer"),
  });

  const question = await prisma.question.findUniqueOrThrow({
    where: { id: parsed.questionId },
  });

  await prisma.answer.update({
    where: {
      sessionId_questionId: {
        sessionId: parsed.sessionId,
        questionId: parsed.questionId,
      },
      userId: user.id,
    },
    data: {
      textAnswer: parsed.textAnswer,
      answeredAt: new Date(),
    },
  });

  try {
    const rubricData = question.rubric
      ? (JSON.parse(question.rubric) as {
          rubric: string;
          expectedTopics: string[];
        })
      : { rubric: "", expectedTopics: [] as string[] };

    const startedAt = Date.now();
    const grade = await geminiProvider.gradeDiscursive({
      statement: question.statement,
      rubric: rubricData.rubric,
      expectedTopics: rubricData.expectedTopics,
      studentAnswer: parsed.textAnswer,
    });

    await logAIUsage({
      userId: user.id,
      operation: "corrigir_discursiva",
      model: "gemini-3.6-flash",
      latencyMs: Date.now() - startedAt,
      success: true,
    });

    const answer = await prisma.answer.findUniqueOrThrow({
      where: {
        sessionId_questionId: {
          sessionId: parsed.sessionId,
          questionId: parsed.questionId,
        },
      },
    });

    await prisma.aICorrection.upsert({
      where: { answerId: answer.id },
      update: {
        score: grade.score,
        feedback: grade.feedback,
        strengths: grade.strengths,
        weaknesses: grade.weaknesses,
        model: "gemini-3.6-flash",
      },
      create: {
        answerId: answer.id,
        score: grade.score,
        feedback: grade.feedback,
        strengths: grade.strengths,
        weaknesses: grade.weaknesses,
        model: "gemini-3.6-flash",
      },
    });
  } catch (error) {
    await logAIUsage({
      userId: user.id,
      operation: "corrigir_discursiva",
      model: "gemini-3.6-flash",
      latencyMs: 0,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }

  redirect(`/sessao/${parsed.sessionId}`);
}

export async function finalizarSessao(sessionId: string) {
  const user = await requireUser();

  const session = await prisma.studySession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { answers: { include: { correction: true } } },
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

  const discursiveCorrections = session.answers
    .map((a) => a.correction)
    .filter((c) => c !== null);
  const scoreDiscursive =
    discursiveCorrections.length > 0
      ? discursiveCorrections.reduce((sum, c) => sum + c.score, 0) /
        discursiveCorrections.length
      : null;

  await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      status: "FINALIZADA",
      finishedAt: new Date(),
      scoreDiscursive,
      scoreObjective,
    },
  });

  await applyGamificationForSession(sessionId);

  if (session.trilhaItemId) {
    await prisma.trilhaItem.update({
      where: { id: session.trilhaItemId },
      data: { status: "CONCLUIDO", completedAt: new Date() },
    });
  }

  redirect(`/sessao/${sessionId}/resultado`);
}
