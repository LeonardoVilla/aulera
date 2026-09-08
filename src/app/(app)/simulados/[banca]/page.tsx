import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { gerarSimuladoPorBanca } from "@/actions/simulados";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SimuladoBancaPage({
  params,
}: {
  params: Promise<{ banca: string }>;
}) {
  const user = await requireOnboardedUser();
  const { banca } = await params;

  const examBoard = await prisma.examBoard.findUnique({
    where: { slug: banca },
  });
  if (!examBoard) notFound();

  const [groups, profile] = await Promise.all([
    prisma.studyGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isGamificado && <span aria-hidden className="mr-2">🎖️</span>}
          {examBoard.name}
        </h1>
        <p className="text-muted-foreground">
          {examBoard.description ??
            "Escolha um grupo de estudo para começar o simulado no estilo desta banca."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const startSimulado = async () => {
            "use server";
            await gerarSimuladoPorBanca({
              groupSlug: group.slug,
              examBoardSlug: examBoard.slug,
              quantity: 18,
            });
          };

          return (
            <Card
              key={group.id}
              className={
                isGamificado
                  ? "w-full overflow-hidden border-none bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg"
                  : "w-full"
              }
            >
              <CardHeader>
                <CardTitle className={isGamificado ? "text-white" : undefined}>
                  {group.name}
                </CardTitle>
                <CardDescription
                  className={isGamificado ? "text-white/80" : undefined}
                >
                  Simulado completo (~18 questões) no estilo {examBoard.name}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={startSimulado}>
                  <Button
                    type="submit"
                    className={
                      isGamificado
                        ? "w-full bg-white text-fuchsia-700 hover:bg-white/90"
                        : "w-full"
                    }
                  >
                    {isGamificado ? "🚀 Começar e ganhar XP" : "Começar simulado"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
