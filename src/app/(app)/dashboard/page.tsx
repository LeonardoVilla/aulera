import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardGamificado } from "@/components/estudo/DashboardGamificado";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: { primaryGroup: true },
  });

  const groupSlug = profile?.primaryGroup?.slug;

  if (profile?.themePreference === "GAMIFICADO") {
    const badgeCount = await prisma.userBadge.count({
      where: { studentProfileId: profile.id },
    });

    return (
      <DashboardGamificado
        userName={user.name ?? ""}
        groupName={profile.primaryGroup?.name ?? "não definido"}
        groupSlug={groupSlug}
        xp={profile.xp}
        level={profile.level}
        currentStreak={profile.currentStreak}
        longestStreak={profile.longestStreak}
        badgeCount={badgeCount}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
        <p className="text-muted-foreground">
          Grupo de estudo: {profile?.primaryGroup?.name ?? "não definido"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={groupSlug ? `/estudar/${groupSlug}` : "#"}>
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Estudar agora</CardTitle>
              <CardDescription>
                Escolha uma sessão rápida, de almoço ou focada.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/simulados">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Simulados por Banca</CardTitle>
              <CardDescription>
                Questões inéditas no estilo Cesgranrio, FGV, Cebraspe e outras
                bancas.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Meu edital</CardTitle>
            <CardDescription>
              Envie um edital e gere sua trilha personalizada. (em breve)
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
            <CardDescription>
              Acompanhe seu desempenho nas sessões de estudo. (em breve)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
