"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { geminiProvider } from "@/lib/ai/gemini-provider";
import { logAIUsage } from "@/lib/ai/usage-tracker";
import type { Difficulty } from "@/generated/prisma/enums";

const DEFAULT_QUANTITY = 10;
// Se já existem pelo menos esse número de questões ativas para a
// combinação grupo+banca, reaproveitamos aleatoriamente em vez de gerar
// novas sempre — a "atualização periódica" acontece quando o estoque
// fica abaixo desse limiar.
const MIN_POOL_SIZE = 30;

const FALLBACK_SUBJECT_BY_GROUP: Record<string, string> = {
  ti: "Conhecimentos Gerais de TI",
  direito: "Direito Constitucional",
};

async function gerarQuestoesPorBanca(params: {
  groupId: string;
  groupSlug: string;
  groupName: string;
  subjectId?: string;
  subjectName: string;
  examBoardId: string;
  examBoardName: string;
  quantity: number;
  userId: string;
}) {
  const {
    groupId,
    subjectId,
    subjectName,
    groupName,
    examBoardId,
    examBoardName,
    quantity,
    userId,
  } = params;

  const difficulty: Difficulty = "MEDIO";
  const startedAt = Date.now();

  try {
    const generated = await geminiProvider.generateObjectiveQuestions({
      groupName,
      subjectName,
      difficulty,
      quantity,
      examBoardName,
    });

    await logAIUsage({
      userId,
      operation: "gerar_simulado_banca",
      model: "gemini-3.6-flash",
      latencyMs: Date.now() - startedAt,
      success: true,
    });

    const created = await prisma.$transaction(
      generated.map((q) =>
        prisma.question.create({
          data: {
            groupId,
            subjectId,
            type: "MULTIPLA_ESCOLHA",
            difficulty,
            intensity: ["FOCO"],
            statement: q.statement,
            options: q.options,
            correctOptionId: q.correctOptionId,
            generatedBy: "gemini",
            examBoardId,
          },
        }),
      ),
    );

    return created;
  } catch (error) {
    await logAIUsage({
      userId,
      operation: "gerar_simulado_banca",
      model: "gemini-3.6-flash",
      latencyMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function gerarSimuladoPorBanca(params: {
  groupSlug: string;
  examBoardSlug: string;
  quantity?: number;
  subjectId?: string;
}) {
  const user = await requireUser();
  const quantity = params.quantity ?? DEFAULT_QUANTITY;

  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { slug: params.groupSlug },
  });

  const examBoard = await prisma.examBoard.findUniqueOrThrow({
    where: { slug: params.examBoardSlug },
  });

  const subject = params.subjectId
    ? await prisma.subject.findUnique({ where: { id: params.subjectId } })
    : await pickRandomSubject(group.id);

  const subjectName = subject?.name ?? FALLBACK_SUBJECT_BY_GROUP[group.slug] ?? group.name;

  const existingCount = await prisma.question.count({
    where: {
      groupId: group.id,
      examBoardId: examBoard.id,
      isActive: true,
    },
  });

  let questions;

  if (existingCount >= MIN_POOL_SIZE) {
    // Estoque suficiente: reaproveita aleatoriamente em vez de gerar novas.
    questions = await pickRandomQuestions({
      groupId: group.id,
      examBoardId: examBoard.id,
      quantity,
    });
  } else {
    // Estoque insuficiente: gera novas via IA para completar o simulado.
    try {
      const generated = await gerarQuestoesPorBanca({
        groupId: group.id,
        groupSlug: group.slug,
        groupName: group.name,
        subjectId: subject?.id,
        subjectName,
        examBoardId: examBoard.id,
        examBoardName: examBoard.name,
        quantity,
        userId: user.id,
      });

      // Combina com questões já existentes daquela banca+grupo, se houver,
      // para variar o simulado além das recém-geradas.
      const reused = await pickRandomQuestions({
        groupId: group.id,
        examBoardId: examBoard.id,
        quantity: Math.max(0, quantity - generated.length),
        excludeIds: generated.map((q) => q.id),
      });

      questions = [...generated, ...reused];
    } catch {
      // Se a geração via IA falhar, tenta reaproveitar o que já existir.
      questions = await pickRandomQuestions({
        groupId: group.id,
        examBoardId: examBoard.id,
        quantity,
      });
    }
  }

  if (questions.length === 0) {
    throw new Error(
      "Não foi possível gerar ou encontrar questões para este simulado. Tente novamente mais tarde.",
    );
  }

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.studySession.create({
      data: {
        userId: user.id,
        groupId: group.id,
        intensity: "FOCO",
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

async function pickRandomSubject(groupId: string) {
  const subjects = await prisma.subject.findMany({ where: { groupId } });
  if (subjects.length === 0) return null;
  return subjects[Math.floor(Math.random() * subjects.length)];
}

async function pickRandomQuestions(params: {
  groupId: string;
  examBoardId: string;
  quantity: number;
  excludeIds?: string[];
}) {
  const { groupId, examBoardId, quantity, excludeIds = [] } = params;
  if (quantity <= 0) return [];

  const pool = await prisma.question.findMany({
    where: {
      groupId,
      examBoardId,
      isActive: true,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    },
  });

  // Embaralha e pega os N primeiros.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, quantity);
}
