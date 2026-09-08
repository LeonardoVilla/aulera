import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SimuladosPage() {
  const user = await requireOnboardedUser();

  const [examBoards, profile] = await Promise.all([
    prisma.examBoard.findMany({ orderBy: { name: "asc" } }),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isGamificado && <span aria-hidden className="mr-2">🏆</span>}
          Simulados por Banca
        </h1>
        <p className="text-muted-foreground">
          Questões inéditas geradas por IA, fiéis ao estilo histórico de cada
          banca examinadora.
        </p>
      </div>

      {examBoards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma banca disponível no momento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examBoards.map((board) => (
            <Link key={board.id} href={`/simulados/${board.slug}`}>
              <Card
                className={
                  isGamificado
                    ? "h-full border-2 border-primary/30 transition-all hover:scale-[1.02] hover:border-primary hover:shadow-md"
                    : "h-full transition-colors hover:bg-accent"
                }
              >
                <CardHeader>
                  <CardTitle>
                    {isGamificado && <span aria-hidden className="mr-2">🎖️</span>}
                    {board.name}
                  </CardTitle>
                  <CardDescription>
                    {board.description ??
                      "Simulado no estilo desta banca examinadora."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
