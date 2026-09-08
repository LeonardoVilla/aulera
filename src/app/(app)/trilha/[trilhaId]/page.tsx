import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { iniciarSessaoDoItem } from "@/actions/trilhas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const INTENSITY_LABEL: Record<string, string> = {
  CURTA: "Sessão rápida",
  ALMOCO: "Horário de almoço",
  FOCO: "Estudo focado",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  PENDENTE: { label: "Pendente", variant: "outline" },
  CONCLUIDO: { label: "Concluído", variant: "default" },
  PULADO: { label: "Pulado", variant: "secondary" },
};

export default async function TrilhaPage({
  params,
}: {
  params: Promise<{ trilhaId: string }>;
}) {
  const user = await requireOnboardedUser();
  const { trilhaId } = await params;

  const trilha = await prisma.trilha.findUnique({
    where: { id: trilhaId },
    include: {
      edital: true,
      items: {
        include: { subject: true },
        orderBy: { scheduledDate: "asc" },
      },
    },
  });

  if (!trilha || trilha.userId !== user.id) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{trilha.title}</h1>
        <p className="text-muted-foreground">
          {trilha.targetDate
            ? `Prova em ${trilha.targetDate.toLocaleDateString("pt-BR")}`
            : "Trilha de estudos"}
          {" · "}
          {trilha.items.length} dias planejados
        </p>
      </div>

      <div className="space-y-3">
        {trilha.items.map((item) => {
          const isToday =
            item.scheduledDate.toDateString() === today.toDateString();
          const isPast = item.scheduledDate < today && item.status === "PENDENTE";
          const status = STATUS_BADGE[item.status];

          const startSession = async () => {
            "use server";
            await iniciarSessaoDoItem(item.id);
          };

          return (
            <Card
              key={item.id}
              className={isToday ? "border-2 border-primary" : undefined}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-medium">
                    {item.scheduledDate.toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                    {item.subject && ` — ${item.subject.name}`}
                  </CardTitle>
                  <CardDescription>
                    {INTENSITY_LABEL[item.intensity]}
                    {isPast && " · atrasado"}
                  </CardDescription>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </CardHeader>
              {item.status === "PENDENTE" && (
                <CardContent>
                  <form action={startSession}>
                    <Button type="submit" size="sm" variant={isToday ? "default" : "outline"}>
                      Iniciar sessão
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
