import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { iniciarSessao } from "@/actions/sessoes";
import {
  INTENSITY_LABELS,
  INTENSITY_QUESTION_COUNT,
  INTENSITY_SLUG_TO_ENUM,
  type IntensitySlug,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function EstudarDuracaoPage({
  params,
}: {
  params: Promise<{ grupo: string; duracao: string }>;
}) {
  await requireOnboardedUser();
  const { grupo, duracao } = await params;

  const group = await prisma.studyGroup.findUnique({ where: { slug: grupo } });
  if (!group) notFound();

  if (!(duracao in INTENSITY_SLUG_TO_ENUM)) notFound();
  const intensity = INTENSITY_SLUG_TO_ENUM[duracao as IntensitySlug];

  const availableQuestions = await prisma.question.count({
    where: { groupId: group.id, isActive: true, intensity: { has: intensity } },
  });

  const startSession = async () => {
    "use server";
    await iniciarSessao(grupo, intensity);
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{INTENSITY_LABELS[intensity]}</CardTitle>
          <CardDescription>
            {group.name} — até {INTENSITY_QUESTION_COUNT[intensity]} questões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableQuestions === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há questões cadastradas para esta combinação.
            </p>
          ) : (
            <form action={startSession}>
              <Button type="submit" className="w-full">
                Começar sessão
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
