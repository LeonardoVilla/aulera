"use server";

import { prisma } from "@/lib/prisma";
import { geminiProvider } from "@/lib/ai/gemini-provider";
import { logAIUsage } from "@/lib/ai/usage-tracker";
import type { Difficulty, StudyIntensity } from "@/generated/prisma/enums";

const FALLBACK_SUBJECT_BY_GROUP: Record<string, string> = {
  ti: "Conhecimentos Gerais de TI",
  direito: "Direito Constitucional",
};

export async function gerarQuestoesParaSessao(params: {
  groupId: string;
  groupSlug: string;
  groupName: string;
  intensity: StudyIntensity;
  missingCount: number;
  userId: string;
}) {
  const { groupId, groupSlug, groupName, intensity, missingCount, userId } =
    params;

  const subject = await prisma.subject.findFirst({
    where: { groupId },
    orderBy: { createdAt: "asc" },
  });

  const subjectName = subject?.name ?? FALLBACK_SUBJECT_BY_GROUP[groupSlug];
  const difficulty: Difficulty = "MEDIO";

  const startedAt = Date.now();
  try {
    const generated = await geminiProvider.generateObjectiveQuestions({
      groupName,
      subjectName,
      difficulty,
      quantity: missingCount,
    });

    await logAIUsage({
      userId,
      operation: "gerar_questao",
      model: "gemini-3.6-flash",
      latencyMs: Date.now() - startedAt,
      success: true,
    });

    const created = await prisma.$transaction(
      generated.map((q) =>
        prisma.question.create({
          data: {
            groupId,
            subjectId: subject?.id,
            type: "MULTIPLA_ESCOLHA",
            difficulty,
            intensity: [intensity],
            statement: q.statement,
            options: q.options,
            correctOptionId: q.correctOptionId,
            generatedBy: "gemini",
          },
        }),
      ),
    );

    return created;
  } catch (error) {
    await logAIUsage({
      userId,
      operation: "gerar_questao",
      model: "gemini-3.6-flash",
      latencyMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
