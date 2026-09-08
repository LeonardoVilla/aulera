import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@/generated/prisma/enums";

// Route Handlers do App Router expõem o corpo cru via req.text()/req.arrayBuffer()
// (diferente do Pages Router, não há bodyParser interceptando), então nenhuma
// configuração extra é necessária para validar a assinatura do Stripe aqui.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "INCOMPLETE";
  }
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : null;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planCode = session.metadata?.planCode;

  if (!userId || !planCode) {
    console.error(
      "checkout.session.completed sem metadata.userId/planCode; ignorando.",
    );
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { code: planCode } });
  if (!plan) {
    console.error(`Plano com code=${planCode} não encontrado; ignorando webhook.`);
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const existing = await prisma.subscription.findFirst({ where: { userId } });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId: plan.id,
        stripeCustomerId: stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: stripeSubscriptionId ?? existing.stripeSubscriptionId,
        status: "ACTIVE",
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: "ACTIVE",
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) {
    console.warn(
      `customer.subscription.updated para stripeSubscriptionId=${subscription.id} sem registro local; ignorando.`,
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodEnd: getCurrentPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) {
    console.warn(
      `customer.subscription.deleted para stripeSubscriptionId=${subscription.id} sem registro local; ignorando.`,
    );
    return;
  }

  // Decisão de produto: ao cancelar de vez a assinatura no Stripe, rebaixamos
  // o usuário para o plano FREE localmente (em vez de deixá-lo "preso" a um
  // plano pago sem cobrança ativa), mantendo o histórico de status CANCELED.
  const freePlan = await prisma.plan.findUnique({ where: { code: "FREE" } });

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: "CANCELED",
      ...(freePlan ? { planId: freePlan.id } : {}),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceWithSub = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const stripeSubscriptionId =
    typeof invoiceWithSub.subscription === "string"
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id ?? null;

  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;

  const existing = stripeSubscriptionId
    ? await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
      })
    : stripeCustomerId
      ? await prisma.subscription.findFirst({
          where: { stripeCustomerId },
          orderBy: { createdAt: "desc" },
        })
      : null;

  if (!existing) {
    console.warn(
      "invoice.payment_failed sem Subscription local correspondente; ignorando.",
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "PAST_DUE" },
  });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurada.");
    return NextResponse.json(
      { error: "Webhook secret não configurado." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Header stripe-signature ausente." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`Falha ao validar assinatura do webhook Stripe: ${message}`);
    return NextResponse.json(
      { error: `Assinatura inválida: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Erro ao processar webhook Stripe (${event.type}):`, err);
    return NextResponse.json(
      { error: "Erro ao processar evento." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
