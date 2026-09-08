import { prisma } from "@/lib/prisma";

const XP_PER_CORRECT_ANSWER = 10;
const XP_PER_ANSWERED = 2;

export function xpToNextLevel(level: number): number {
  return level * 100;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  return level;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isConsecutiveDay(previous: Date, current: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff = current.setHours(0, 0, 0, 0) - previous.setHours(0, 0, 0, 0);
  return diff === oneDayMs;
}

export async function applyGamificationForSession(sessionId: string) {
  const session = await prisma.studySession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { answers: true },
  });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) return;

  const answeredCount = session.answers.filter((a) => a.answeredAt).length;
  const correctCount = session.answers.filter((a) => a.isCorrect).length;
  const earnedXp =
    answeredCount * XP_PER_ANSWERED + correctCount * XP_PER_CORRECT_ANSWER;

  const newXp = profile.xp + earnedXp;
  const newLevel = levelFromXp(newXp);

  const today = new Date();
  let currentStreak = profile.currentStreak;

  if (!profile.lastStudyDate) {
    currentStreak = 1;
  } else if (isSameDay(profile.lastStudyDate, today)) {
    // já estudou hoje, mantém streak
  } else if (isConsecutiveDay(new Date(profile.lastStudyDate), new Date(today))) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(profile.longestStreak, currentStreak);

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      xp: newXp,
      level: newLevel,
      currentStreak,
      longestStreak,
      lastStudyDate: today,
    },
  });

  await awardBadgesIfEligible({
    studentProfileId: profile.id,
    userId: session.userId,
    currentStreak,
    isPerfectSession: answeredCount > 0 && correctCount === answeredCount,
  });

  return { earnedXp, newXp, newLevel, currentStreak };
}

async function awardBadge(studentProfileId: string, badgeCode: string) {
  const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
  if (!badge) return;

  await prisma.userBadge.upsert({
    where: {
      studentProfileId_badgeId: { studentProfileId, badgeId: badge.id },
    },
    update: {},
    create: { studentProfileId, badgeId: badge.id },
  });
}

async function awardBadgesIfEligible(params: {
  studentProfileId: string;
  userId: string;
  currentStreak: number;
  isPerfectSession: boolean;
}) {
  const totalSessions = await prisma.studySession.count({
    where: { userId: params.userId, status: "FINALIZADA" },
  });
  if (totalSessions >= 1) {
    await awardBadge(params.studentProfileId, "primeira_sessao");
  }

  const totalAnswered = await prisma.answer.count({
    where: { userId: params.userId, answeredAt: { not: null } },
  });
  if (totalAnswered >= 100) {
    await awardBadge(params.studentProfileId, "100_questoes");
  }

  if (params.currentStreak >= 7) {
    await awardBadge(params.studentProfileId, "streak_7");
  }
  if (params.currentStreak >= 30) {
    await awardBadge(params.studentProfileId, "streak_30");
  }

  if (params.isPerfectSession) {
    await awardBadge(params.studentProfileId, "gabarito");
  }
}
