import Link from "next/link";
import { xpToNextLevel } from "@/lib/gamification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function DashboardGamificado({
  userName,
  groupName,
  groupSlug,
  xp,
  level,
  currentStreak,
  longestStreak,
  badgeCount,
}: {
  userName: string;
  groupName: string;
  groupSlug: string | undefined;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
}) {
  const xpTarget = xpToNextLevel(level);
  const xpIntoLevel = xp % xpTarget;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpTarget) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Olá, {userName} <span aria-hidden>👋</span>
        </h1>
        <p className="text-muted-foreground">Grupo de estudo: {groupName}</p>
      </div>

      <Card className="overflow-hidden border-none bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg">
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center gap-1 text-center sm:items-start sm:text-left">
            <span className="text-xs uppercase tracking-wide text-white/80">
              Nível
            </span>
            <span className="text-4xl font-bold">{level}</span>
            <div className="mt-1 w-full space-y-1">
              <Progress value={percent} className="h-2 bg-white/25 [&>div]:bg-white" />
              <span className="text-xs text-white/80">
                {xpIntoLevel}/{xpTarget} XP para o próximo nível
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-xs uppercase tracking-wide text-white/80">
              Sequência
            </span>
            <span className="text-4xl font-bold">
              🔥 {currentStreak}
            </span>
            <span className="text-xs text-white/80">
              recorde: {longestStreak} dias
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 text-center sm:items-end sm:text-right">
            <span className="text-xs uppercase tracking-wide text-white/80">
              Conquistas
            </span>
            <span className="text-4xl font-bold">🏅 {badgeCount}</span>
            <Link
              href="/conta/conquistas"
              className="text-xs text-white underline underline-offset-2 hover:text-white/80"
            >
              ver todas
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={groupSlug ? `/estudar/${groupSlug}` : "#"}>
          <Card className="h-full border-2 border-primary/30 transition-all hover:scale-[1.02] hover:border-primary hover:shadow-md">
            <CardHeader>
              <CardTitle>🚀 Estudar agora</CardTitle>
              <CardDescription>
                Escolha uma sessão rápida, de almoço ou focada e ganhe XP.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/simulados">
          <Card className="h-full transition-all hover:scale-[1.02] hover:bg-accent hover:shadow-md">
            <CardHeader>
              <CardTitle>🏆 Simulados por Banca</CardTitle>
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
        <Link href="/conta/conquistas">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>🏅 Conquistas</CardTitle>
              <CardDescription>
                Veja seus badges conquistados e os que faltam.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
