import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { xpToNextLevel } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ConquistasPage() {
  const user = await requireOnboardedUser();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  const [earnedBadges, allBadges] = await Promise.all([
    prisma.userBadge.findMany({
      where: { studentProfileId: profile?.id ?? "" },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.badge.findMany({ orderBy: { code: "asc" } }),
  ]);

  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));
  const lockedBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpTarget = xpToNextLevel(level);
  const currentStreak = profile?.currentStreak ?? 0;
  const longestStreak = profile?.longestStreak ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Minhas conquistas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e badges conquistados.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/conta/perfil">Voltar ao perfil</Link>
        </Button>
      </div>

      <Card className="border-amber-400/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Nível {level}
          </CardTitle>
          <CardDescription>
            {xp} XP totais &middot; {currentStreak} 🔥 sequência atual &middot;{" "}
            {longestStreak} 🔥 recorde de sequência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(xp % xpTarget) / xpTarget * 100 || 0} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Conquistadas ({earnedBadges.length})
        </h2>
        {earnedBadges.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Você ainda não conquistou nenhum badge. Continue estudando!
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {earnedBadges.map((ub) => (
            <Card key={ub.id} className="border-primary/30">
              <CardContent className="flex items-start gap-3 pt-6">
                <span className="text-3xl leading-none">{ub.badge.icon}</span>
                <div>
                  <p className="font-medium">{ub.badge.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ub.badge.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {lockedBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-muted-foreground">
            A conquistar ({lockedBadges.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lockedBadges.map((badge) => (
              <Card key={badge.id} className="opacity-50 grayscale">
                <CardContent className="flex items-start gap-3 pt-6">
                  <span className="text-3xl leading-none">{badge.icon}</span>
                  <div>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
