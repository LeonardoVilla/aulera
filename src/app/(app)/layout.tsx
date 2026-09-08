import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { GamificacaoStatusBar } from "@/components/estudo/GamificacaoStatusBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardedUser();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  const isGamificado = profile?.themePreference === "GAMIFICADO";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/dashboard" className="font-semibold hover:underline">
          Estudos para Concursos
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {isGamificado && (
            <GamificacaoStatusBar
              xp={profile?.xp ?? 0}
              level={profile?.level ?? 1}
              currentStreak={profile?.currentStreak ?? 0}
            />
          )}
          <Link href="/conta/perfil" className="text-muted-foreground hover:text-foreground hover:underline">
            {user.name}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
