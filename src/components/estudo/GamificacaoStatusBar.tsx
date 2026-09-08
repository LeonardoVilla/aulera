import { xpToNextLevel } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";

export function GamificacaoStatusBar({
  xp,
  level,
  currentStreak,
}: {
  xp: number;
  level: number;
  currentStreak: number;
}) {
  const xpTarget = xpToNextLevel(level);
  const xpIntoLevel = xp % xpTarget;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpTarget) * 100));

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 font-semibold text-orange-600 dark:text-orange-400">
        🔥 {currentStreak}
      </span>
      <div className="flex min-w-[140px] flex-col gap-1">
        <span className="text-xs font-medium">
          Nível {level} &middot; {xpIntoLevel}/{xpTarget} XP
        </span>
        <Progress value={percent} className="h-2" />
      </div>
    </div>
  );
}
