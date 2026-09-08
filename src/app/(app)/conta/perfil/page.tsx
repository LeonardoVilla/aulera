import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { atualizarPreferenciaTema, atualizarGrupoPrincipal } from "@/actions/perfil";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ atualizado?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { atualizado } = await searchParams;

  const [profile, groups] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: { primaryGroup: true },
    }),
    prisma.studyGroup.findMany({ orderBy: { name: "asc" } }),
  ]);

  const temaAtual = profile?.themePreference ?? "CLASSICO";
  const grupoAtualSlug = profile?.primaryGroup?.slug;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-muted-foreground">
          Escolha como a plataforma deve se comportar visualmente para você.
        </p>
      </div>

      {atualizado === "1" && (
        <p className="rounded-md border border-green-600/30 bg-green-600/10 px-4 py-2 text-sm text-green-700 dark:text-green-400">
          Preferência atualizada com sucesso.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grupo de estudo</CardTitle>
          <CardDescription>
            Define o grupo padrão em &quot;Estudar agora&quot; e nos cards do
            dashboard. Trocar de grupo não apaga seu histórico de sessões,
            trilhas ou editais já enviados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={atualizarGrupoPrincipal} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex cursor-pointer flex-col gap-2 rounded-md border p-4 text-sm hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="groupSlug"
                      value={group.slug}
                      defaultChecked={group.slug === grupoAtualSlug}
                    />
                    {group.name}
                  </span>
                  {group.description && (
                    <span className="text-muted-foreground">
                      {group.description}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <Button type="submit" className="w-full">
              Salvar grupo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema visual</CardTitle>
          <CardDescription>
            O tema Gamificado destaca XP, nível, sequência de estudos (streak)
            e conquistas. O tema Clássico mantém o visual neutro atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={atualizarPreferenciaTema} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className="flex cursor-pointer flex-col gap-2 rounded-md border p-4 text-sm hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="themePreference"
                    value="CLASSICO"
                    defaultChecked={temaAtual === "CLASSICO"}
                  />
                  Clássico
                </span>
                <span className="text-muted-foreground">
                  Visual neutro e minimalista.
                </span>
              </label>

              <label className="flex cursor-pointer flex-col gap-2 rounded-md border p-4 text-sm hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent">
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="themePreference"
                    value="GAMIFICADO"
                    defaultChecked={temaAtual === "GAMIFICADO"}
                  />
                  🎮 Gamificado
                </span>
                <span className="text-muted-foreground">
                  XP, níveis, streaks 🔥 e conquistas 🏅.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full">
              Salvar preferência
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/conta/conquistas">Ver minhas conquistas</Link>
      </Button>

      <Button asChild variant="outline" className="w-full">
        <Link href="/conta/assinatura">Gerenciar assinatura</Link>
      </Button>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/dashboard">← Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
