import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { criarCheckoutSession, criarPortalSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Período de teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelada",
  INCOMPLETE: "Incompleta",
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireUser();
  const { checkout } = await searchParams;

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  const planCode = subscription?.plan.code ?? "FREE";
  const planName = subscription?.plan.name ?? "Gratuito";
  const isPaidActive =
    planCode !== "FREE" &&
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minha assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie seu plano e forma de pagamento.
        </p>
      </div>

      {checkout === "sucesso" && (
        <p className="rounded-md border border-green-600/30 bg-green-600/10 px-4 py-2 text-sm text-green-700 dark:text-green-400">
          Pagamento confirmado! Pode levar alguns instantes para sua
          assinatura ser atualizada aqui.
        </p>
      )}
      {checkout === "cancelado" && (
        <p className="rounded-md border border-amber-600/30 bg-amber-600/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          Checkout cancelado. Nenhuma cobrança foi feita.
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plano atual: {planName}</CardTitle>
            {subscription && (
              <Badge variant="secondary">
                {STATUS_LABEL[subscription.status] ?? subscription.status}
              </Badge>
            )}
          </div>
          <CardDescription>
            {planCode === "FREE"
              ? "Você está no plano gratuito. Faça upgrade para desbloquear mais editais, trilhas mais longas e correções discursivas."
              : "Obrigado por assinar! Gerencie seu método de pagamento e histórico de faturas no portal do cliente Stripe."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd
                ? "Cancelamento agendado para "
                : "Próxima renovação em "}
              {subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}
            </p>
          )}

          {isPaidActive ? (
            <form action={criarPortalSession}>
              <Button type="submit" className="w-full">
                Gerenciar assinatura
              </Button>
            </form>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <form action={criarCheckoutSession.bind(null, "BASICO")}>
                <Button type="submit" variant="outline" className="w-full">
                  Assinar Básico — R$19,90/mês
                </Button>
              </form>
              <form action={criarCheckoutSession.bind(null, "PREMIUM")}>
                <Button type="submit" className="w-full">
                  Assinar Premium — R$39,90/mês
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
