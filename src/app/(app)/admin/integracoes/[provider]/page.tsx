import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { salvarApiKey } from "@/actions/admin/integracoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini (Google AI)",
  stripe: "Stripe",
  vercel_blob: "Vercel Blob",
};

export default async function IntegracaoProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  await requireAdmin();
  const { provider } = await params;

  const displayName = PROVIDER_LABELS[provider];
  if (!displayName) {
    notFound();
  }

  const integration = await prisma.integration.findUnique({
    where: { provider },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/admin/integracoes"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar para integrações
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          Trocar chave — {displayName}
        </h1>
        <p className="text-muted-foreground">
          A chave é armazenada de forma cifrada. Depois de salva, ela nunca é
          exibida novamente por completo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova chave de API</CardTitle>
          <CardDescription>
            {integration?.keyLastFour
              ? `Chave atual termina em: •••• ${integration.keyLastFour}`
              : "Nenhuma chave configurada ainda."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={salvarApiKey} className="space-y-4">
            <input type="hidden" name="provider" value={provider} />
            <div className="space-y-2">
              <Label htmlFor="apiKey">Nova chave</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder="Cole a nova chave aqui"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Salvar nova chave
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
