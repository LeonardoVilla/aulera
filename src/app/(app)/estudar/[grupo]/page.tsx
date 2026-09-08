import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { INTENSITY_LABELS, INTENSITY_SLUGS } from "@/lib/constants";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const INTENSITY_EMOJI: Record<keyof typeof INTENSITY_LABELS, string> = {
  CURTA: "⚡",
  ALMOCO: "🍽️",
  FOCO: "🎯",
};

export default async function EstudarGrupoPage({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  const user = await requireOnboardedUser();
  const { grupo } = await params;

  const group = await prisma.studyGroup.findUnique({ where: { slug: grupo } });
  if (!group) notFound();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-muted-foreground">
          Escolha quanto tempo você tem agora.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {INTENSITY_SLUGS.map((slug) => {
          const enumKey = slug.toUpperCase() as keyof typeof INTENSITY_LABELS;
          return (
            <Link key={slug} href={`/estudar/${grupo}/${slug}`}>
              <Card
                className={
                  isGamificado
                    ? "h-full border-2 border-primary/30 transition-all hover:scale-[1.02] hover:border-primary hover:shadow-md"
                    : "h-full transition-colors hover:bg-accent"
                }
              >
                <CardHeader>
                  <CardTitle>
                    {isGamificado && (
                      <span aria-hidden className="mr-2">
                        {INTENSITY_EMOJI[enumKey]}
                      </span>
                    )}
                    {INTENSITY_LABELS[enumKey]}
                  </CardTitle>
                  <CardDescription>
                    {isGamificado ? "Clique para ganhar XP" : "Clique para começar"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
