import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResultadoHeaderGamificado,
  RespostaCardGamificada,
  VoltarDashboardGamificado,
} from "@/components/estudo/ResultadoGamificado";

export default async function ResultadoSessaoPage({
  params,
}: {
  params: Promise<{ sessaoId: string }>;
}) {
  const user = await requireUser();
  const { sessaoId } = await params;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  const session = await prisma.studySession.findUnique({
    where: { id: sessaoId },
    include: {
      group: true,
      answers: { include: { question: true }, orderBy: { order: "asc" } },
    },
  });

  if (!session || session.userId !== user.id) notFound();

  const correctCount = session.answers.filter((a) => a.isCorrect).length;
  const total = session.answers.length;

  if (isGamificado) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <ResultadoHeaderGamificado
          groupName={session.group.name}
          correctCount={correctCount}
          total={total}
          scoreObjective={session.scoreObjective}
        />

        <div className="space-y-3">
          {session.answers.map((a) => (
            <RespostaCardGamificada key={a.id} answer={a} />
          ))}
        </div>

        <VoltarDashboardGamificado />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resultado — {session.group.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-semibold">
            {correctCount} / {total} corretas
          </p>
          <p className="text-muted-foreground">
            {session.scoreObjective?.toFixed(0)}% de aproveitamento
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {session.answers.map((a) => {
          const options =
            (a.question.options as { id: string; text: string }[] | null) ??
            [];
          const selectedOption = options.find(
            (o) => o.id === a.selectedOptionId,
          );
          const correctOption = options.find(
            (o) => o.id === a.question.correctOptionId,
          );

          return (
            <Card key={a.id}>
              <CardContent className="space-y-1 pt-6 text-sm">
                <p className="font-medium">{a.question.statement}</p>
                <p
                  className={
                    a.isCorrect ? "text-green-600" : "text-destructive"
                  }
                >
                  Sua resposta:{" "}
                  {selectedOption
                    ? `${selectedOption.id}) ${selectedOption.text}`
                    : "não respondida"}
                </p>
                {!a.isCorrect && correctOption && (
                  <p className="text-green-600">
                    Correta: {correctOption.id}) {correctOption.text}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button asChild className="w-full">
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
