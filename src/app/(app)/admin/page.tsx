import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminHomePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel administrativo</h1>
        <p className="text-muted-foreground">
          Área restrita a administradores da plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/integracoes">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Status, chaves de API e uso agregado de IA dos provedores
                externos (Gemini, Stripe, Vercel Blob).
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/usuarios">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Consulte usuários cadastrados e gerencie permissões de
                administrador.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
