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

export default async function EstudarGrupoPage({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  await requireOnboardedUser();
  const { grupo } = await params;

  const group = await prisma.studyGroup.findUnique({ where: { slug: grupo } });
  if (!group) notFound();

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
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle>{INTENSITY_LABELS[enumKey]}</CardTitle>
                  <CardDescription>Clique para começar</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
