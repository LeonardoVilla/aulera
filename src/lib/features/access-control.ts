import "server-only";
import { prisma } from "@/lib/prisma";

export type FeatureAccessResult = {
  allowed: boolean;
  /** Limite numérico configurado no PlanFeature, ou null se a feature não é numérica/não está configurada (nesse caso, acesso é liberado por padrão). */
  limit: number | null;
  /** Uso atual informado pelo chamador, quando aplicável. */
  currentUsage?: number;
  /** Código do plano efetivo do usuário (FREE quando não há assinatura). */
  planCode: string;
};

/**
 * Verifica se um usuário pode acessar/usar uma feature limitada por plano
 * (ex: "max_editais_ativos", "trilha_profundidade_dias",
 * "correcoes_discursivas_mes").
 *
 * Busca a assinatura mais recente do usuário; se não houver nenhuma, ou se a
 * mais recente não estiver em um status "utilizável" (ACTIVE/TRIALING),
 * considera o usuário no plano FREE.
 *
 * `currentUsage`, quando informado, é comparado contra o limite configurado
 * no PlanFeature (interpretado como número) para decidir `allowed`. Se não
 * for informado, `allowed` reflete apenas se a feature existe/está
 * habilitada para o plano (limite > 0 ou não numérico).
 */
export async function canAccessFeature(
  userId: string,
  featureKey: string,
  currentUsage?: number,
): Promise<FeatureAccessResult> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { features: true } } },
  });

  const plan =
    subscription?.plan ??
    (await prisma.plan.findUnique({
      where: { code: "FREE" },
      include: { features: true },
    }));

  if (!plan) {
    // Não deveria acontecer se o seed rodou, mas falha de forma segura.
    return { allowed: false, limit: null, currentUsage, planCode: "FREE" };
  }

  const feature = plan.features.find((f) => f.key === featureKey);

  if (!feature) {
    // Feature não configurada para este plano: não há limite conhecido,
    // então liberamos por padrão em vez de bloquear silenciosamente.
    return { allowed: true, limit: null, currentUsage, planCode: plan.code };
  }

  const limit = Number(feature.value);
  if (Number.isNaN(limit)) {
    // Valor não numérico (ex: feature booleana/flag futura): liberado.
    return { allowed: true, limit: null, currentUsage, planCode: plan.code };
  }

  if (currentUsage === undefined) {
    return { allowed: limit > 0, limit, planCode: plan.code };
  }

  return {
    allowed: currentUsage < limit,
    limit,
    currentUsage,
    planCode: plan.code,
  };
}
