import "server-only";

/**
 * Planos pagos disponíveis para checkout via Stripe.
 * O plano FREE não tem price no Stripe (é grátis, sem checkout).
 */
export type PaidPlanCode = "BASICO" | "PREMIUM";

export function getStripePriceId(planCode: PaidPlanCode): string {
  const priceId =
    planCode === "BASICO"
      ? process.env.STRIPE_PRICE_BASICO
      : process.env.STRIPE_PRICE_PREMIUM;

  if (!priceId) {
    throw new Error(
      `Variável de ambiente STRIPE_PRICE_${planCode} não configurada. ` +
        `Crie o produto/preço no Dashboard do Stripe e preencha o .env.`,
    );
  }

  return priceId;
}

export function isPaidPlanCode(code: string): code is PaidPlanCode {
  return code === "BASICO" || code === "PREMIUM";
}
