import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { responderQuestaoObjetiva, finalizarSessao } from "@/actions/sessoes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function SessaoPage({
  params,
}: {
  params: Promise<{ sessaoId: string }>;
}) {
  const user = await requireUser();
  const { sessaoId } = await params;

  const session = await prisma.studySession.findUnique({
    where: { id: sessaoId },
    include: {
      answers: {
        orderBy: { order: "asc" },
        include: { question: true },
      },
    },
  });

  if (!session || session.userId !== user.id) notFound();

  if (session.status === "FINALIZADA") {
    redirect(`/sessao/${sessaoId}/resultado`);
  }

  const pending = session.answers.find((a) => a.answeredAt === null);
  const answeredCount = session.answers.filter((a) => a.answeredAt !== null).length;
  const total = session.answers.length;

  if (!pending) {
    const finish = async () => {
      "use server";
      await finalizarSessao(sessaoId);
    };

    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Todas as questões respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={finish}>
              <Button type="submit" className="w-full">
                Ver resultado
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = pending.question;
  const options = (question.options as { id: string; text: string }[]) ?? [];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-xl space-y-2">
        <Progress value={(answeredCount / total) * 100} />
        <p className="text-sm text-muted-foreground">
          {answeredCount + 1} de {total}
        </p>
      </div>

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg font-normal">
            {question.statement}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={responderQuestaoObjetiva} className="space-y-3">
            <input type="hidden" name="sessionId" value={sessaoId} />
            <input type="hidden" name="questionId" value={question.id} />

            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  type="radio"
                  name="selectedOptionId"
                  value={opt.id}
                  required
                  className="mt-1"
                />
                <span>
                  <strong className="mr-1">{opt.id})</strong>
                  {opt.text}
                </span>
              </label>
            ))}

            <Button type="submit" className="w-full">
              Responder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
