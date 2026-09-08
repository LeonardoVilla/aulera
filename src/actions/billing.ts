"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { getStripePriceId, type PaidPlanCode, isPaidPlanCode } from "@/lib/stripe/plans";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Garante que o usuário tenha um customer no Stripe, reaproveitando o
 * `stripeCustomerId` já salvo em qualquer Subscription existente do usuário
 * (o schema não tem unique em `userId` sozinho, então buscamos a mais
 * recente com `findFirst`). Se não houver nenhuma Subscription ainda,
 * criamos o customer no Stripe e uma Subscription inicial em TRIALING
 * apontando para o plano FREE, apenas para ter onde persistir o
 * `stripeCustomerId` antes do checkout ser concluído.
 */
async function ensureStripeCustomerId(
  userId: string,
  email: string,
): Promise<string> {
  const existing = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  const freePlan = await prisma.plan.findUnique({ where: { code: "FREE" } });
  if (!freePlan) {
    throw new Error("Plano FREE não encontrado. Rode o seed do banco.");
  }

  const anySubscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (anySubscription) {
    await prisma.subscription.update({
      where: { id: anySubscription.id },
      data: { stripeCustomerId: customer.id },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        stripeCustomerId: customer.id,
        status: "TRIALING",
      },
    });
  }

  return customer.id;
}

export async function criarCheckoutSession(planCode: PaidPlanCode) {
  const user = await requireUser();

  if (!isPaidPlanCode(planCode)) {
    throw new Error("Plano inválido para checkout.");
  }

  if (!user.email) {
    throw new Error("Usuário sem e-mail cadastrado, não é possível criar checkout.");
  }

  const customerId = await ensureStripeCustomerId(user.id, user.email);
  const priceId = getStripePriceId(planCode);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/conta/assinatura?checkout=sucesso`,
    cancel_url: `${appUrl}/conta/assinatura?checkout=cancelado`,
    metadata: {
      userId: user.id,
      planCode,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        planCode,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe não retornou URL de checkout.");
  }

  redirect(session.url);
}

export async function criarPortalSession() {
  const user = await requireUser();

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error(
      "Nenhum customer Stripe encontrado para este usuário. Assine um plano primeiro.",
    );
  }

  const appUrl = getAppUrl();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/conta/assinatura`,
  });

  redirect(portalSession.url);
}
