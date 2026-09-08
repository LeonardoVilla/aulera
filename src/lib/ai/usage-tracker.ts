import { prisma } from "@/lib/prisma";

export async function logAIUsage(params: {
  userId?: string;
  operation: string;
  model: string;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}) {
  await prisma.aIUsageLog.create({
    data: {
      userId: params.userId,
      operation: params.operation,
      model: params.model,
      latencyMs: params.latencyMs,
      success: params.success,
      errorMessage: params.errorMessage,
    },
  });
}
