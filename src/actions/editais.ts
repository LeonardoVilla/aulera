"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { uploadEditalPdf } from "@/lib/blob";
import { extractTextFromPdf } from "@/lib/pdf/extract-text";
import { geminiProvider } from "@/lib/ai/gemini-provider";
import { logAIUsage } from "@/lib/ai/usage-tracker";
import type { ParsedEdital } from "@/lib/ai/schemas/edital.schema";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Cria um novo Edital a partir de um upload de PDF e, na mesma execução da
 * Server Action, dispara o processamento completo (extração de texto +
 * parsing via IA). Isso é uma simplificação intencional do MVP: não há fila
 * assíncrona, então para editais muito grandes (muitas páginas) esta ação
 * pode se aproximar do timeout de execução da function da Vercel. Uma
 * otimização futura seria mover o processamento para um job em background
 * (ex: Vercel Queue / Inngest / trigger separado) e deixar esta action
 * apenas enfileirar o trabalho.
 */
export async function criarEdital(formData: FormData) {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione um arquivo PDF para enviar.");
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("O arquivo deve ser um PDF.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("O arquivo excede o tamanho máximo permitido (15MB).");
  }

  const { url } = await uploadEditalPdf(file, user.id);

  const edital = await prisma.edital.create({
    data: {
      userId: user.id,
      originalFileName: file.name,
      blobUrl: url,
      status: "PENDENTE",
    },
  });

  await processarEdital(edital.id);

  revalidatePath("/editais");
  redirect(`/editais/${edital.id}`);
}

/**
 * Executa o pipeline completo de processamento de um Edital já criado:
 * extração de texto do PDF, parsing estruturado via Gemini, e persistência
 * das disciplinas/cronograma no banco. Pode ser chamada tanto logo após a
 * criação do Edital quanto manualmente para reprocessar um edital que falhou.
 */
export async function processarEdital(editalId: string) {
  const edital = await prisma.edital.findUnique({ where: { id: editalId } });
  if (!edital) {
    throw new Error("Edital não encontrado.");
  }

  try {
    await prisma.edital.update({
      where: { id: editalId },
      data: { status: "EXTRAINDO_TEXTO", errorMessage: null },
    });

    const response = await fetch(edital.blobUrl);
    if (!response.ok) {
      throw new Error(
        `Não foi possível baixar o PDF do edital (HTTP ${response.status}).`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const rawText = await extractTextFromPdf(arrayBuffer);

    await prisma.edital.update({
      where: { id: editalId },
      data: { rawText, status: "PARSEANDO_IA" },
    });

    const startedAt = Date.now();
    let parsed: ParsedEdital;
    try {
      parsed = await geminiProvider.parseEdital({ rawText });
      await logAIUsage({
        userId: edital.userId,
        operation: "parsear_edital",
        model: "gemini-3.6-flash",
        latencyMs: Date.now() - startedAt,
        success: true,
      });
    } catch (error) {
      await logAIUsage({
        userId: edital.userId,
        operation: "parsear_edital",
        model: "gemini-3.6-flash",
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    const examDate = findFirstScheduleDate(parsed, [
      "PROVA_OBJETIVA",
      "PROVA_DISCURSIVA",
    ]);
    const registrationDeadline = findFirstScheduleDate(parsed, ["INSCRICAO"]);
    const resultDate = findFirstScheduleDate(parsed, ["RESULTADO"]);

    await prisma.$transaction(async (tx) => {
      await tx.editalSubject.deleteMany({ where: { editalId } });
      await tx.editalScheduleEvent.deleteMany({ where: { editalId } });

      await tx.edital.update({
        where: { id: editalId },
        data: {
          parsedJson: parsed,
          orgao: parsed.orgao,
          cargo: parsed.cargo,
          examDate,
          registrationDeadline,
          resultDate,
          status: "CONCLUIDO",
          parsedAt: new Date(),
        },
      });

      if (parsed.disciplinas.length > 0) {
        await tx.editalSubject.createMany({
          data: parsed.disciplinas.map((d) => ({
            editalId,
            block: d.bloco,
            name: d.nome,
            numQuestions: d.numQuestoes,
            weight: d.peso,
          })),
        });
      }

      if (parsed.cronograma.length > 0) {
        await tx.editalScheduleEvent.createMany({
          data: parsed.cronograma.map((e) => ({
            editalId,
            label: e.evento,
            startDate: new Date(`${e.dataInicio}T00:00:00.000Z`),
            endDate: e.dataFim ? new Date(`${e.dataFim}T00:00:00.000Z`) : null,
            kind: e.tipo,
          })),
        });
      }
    });

    revalidatePath(`/editais/${editalId}`);
    revalidatePath("/editais");
  } catch (error) {
    await prisma.edital.update({
      where: { id: editalId },
      data: {
        status: "ERRO",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    revalidatePath(`/editais/${editalId}`);
  }
}

function findFirstScheduleDate(
  parsed: ParsedEdital,
  kinds: string[],
): Date | null {
  const event = parsed.cronograma.find((e) => kinds.includes(e.tipo));
  if (!event) return null;
  return new Date(`${event.dataInicio}T00:00:00.000Z`);
}

export async function reprocessarEdital(editalId: string) {
  const user = await requireUser();

  const edital = await prisma.edital.findUnique({ where: { id: editalId } });
  if (!edital || edital.userId !== user.id) {
    throw new Error("Edital não encontrado.");
  }

  await processarEdital(editalId);
  revalidatePath(`/editais/${editalId}`);
  redirect(`/editais/${editalId}`);
}
