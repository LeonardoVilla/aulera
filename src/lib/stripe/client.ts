import "server-only";
import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY não configurada. Defina-a no .env para habilitar o billing.",
    );
  }
  return new Stripe(secretKey);
}

// Instanciação preguiçosa: evita que módulos que apenas importam `stripe`
// (ex: durante a coleta de páginas do `next build`) quebrem quando as
// variáveis de ambiente do Stripe ainda não foram configuradas. O erro só
// é lançado quando o SDK é de fato usado em runtime (Server Action/Route
// Handler chamados).
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = globalForStripe.stripe ?? createStripeClient();
    if (process.env.NODE_ENV !== "production") {
      globalForStripe.stripe = client;
    }
    return Reflect.get(client as object, prop, receiver);
  },
});
