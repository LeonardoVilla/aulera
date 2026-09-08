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
  const user = await requireOnboardedUser();
  const { grupo, duracao } = await params;

  const group = await prisma.studyGroup.findUnique({ where: { slug: grupo } });
  if (!group) notFound();

  if (!(duracao in INTENSITY_SLUG_TO_ENUM)) notFound();
  const intensity = INTENSITY_SLUG_TO_ENUM[duracao as IntensitySlug];

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  const availableQuestions = await prisma.question.count({
    where: { groupId: group.id, isActive: true, intensity: { has: intensity } },
  });

  const startSession = async () => {
    "use server";
    await iniciarSessao(grupo, intensity);
  };

  return (
    <div className="flex justify-center">
      <Card
        className={
          isGamificado
            ? "w-full max-w-md overflow-hidden border-none bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg"
            : "w-full max-w-md"
        }
      >
        <CardHeader>
          <CardTitle className={isGamificado ? "text-white" : undefined}>
            {isGamificado && <span aria-hidden className="mr-2">🎮</span>}
            {INTENSITY_LABELS[intensity]}
          </CardTitle>
          <CardDescription
            className={isGamificado ? "text-white/80" : undefined}
          >
            {group.name} — até {INTENSITY_QUESTION_COUNT[intensity]} questões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableQuestions === 0 ? (
            <p
              className={
                isGamificado ? "text-sm text-white/80" : "text-sm text-muted-foreground"
              }
            >
              Ainda não há questões cadastradas para esta combinação.
            </p>
          ) : (
            <form action={startSession}>
              <Button
                type="submit"
                className={
                  isGamificado
                    ? "w-full bg-white text-fuchsia-700 hover:bg-white/90"
                    : "w-full"
                }
              >
                {isGamificado ? "🚀 Começar e ganhar XP" : "Começar sessão"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
