import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IntegrationStatus } from "@/generated/prisma/enums";
import {
  TestarConexaoButton,
  ToggleIntegracaoButton,
} from "./_components/integration-actions";

const PROVIDERS: { provider: string; displayName: string }[] = [
  { provider: "gemini", displayName: "Gemini (Google AI)" },
  { provider: "stripe", displayName: "Stripe" },
  { provider: "vercel_blob", displayName: "Vercel Blob" },
];

const STATUS_BADGE: Record<
  IntegrationStatus,
  { label: string; className: string }
> = {
  OK: {
    label: "OK",
    className:
      "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  },
  ERRO: {
    label: "Erro",
    className:
      "bg-red-600/10 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  DESCONHECIDO: {
    label: "Desconhecido",
    className: "bg-muted text-muted-foreground",
  },
  DESATIVADO: {
    label: "Desativado",
    className: "bg-muted text-muted-foreground",
  },
};

function formatDate(date: Date | null): string {
  if (!date) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function IntegracoesPage() {
  await requireAdmin();

  const integrations = await prisma.integration.findMany();
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  const usageStats = await prisma.aIUsageLog.groupBy({
    by: ["operation"],
    _count: { _all: true },
    _avg: { latencyMs: true },
    _sum: { totalTokens: true },
  });

  const successStats = await prisma.aIUsageLog.groupBy({
    by: ["operation", "success"],
    _count: { _all: true },
  });

  const successByOperation = new Map<string, { success: number; total: number }>();
  for (const row of successStats) {
    const current = successByOperation.get(row.operation) ?? {
      success: 0,
      total: 0,
    };
    current.total += row._count._all;
    if (row.success) current.success += row._count._all;
    successByOperation.set(row.operation, current);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <p className="text-muted-foreground">
          Gerencie as chaves de API dos provedores externos e monitore o
          status de conexão.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map(({ provider, displayName }) => {
          const integration = byProvider.get(provider);
          const status = integration?.status ?? "DESCONHECIDO";
          const badge = STATUS_BADGE[status];
          const isEnabled = integration?.isEnabled ?? true;

          return (
            <Card key={provider}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {displayName}
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {integration?.keyLastFour
                        ? `Chave atual: •••• ${integration.keyLastFour}`
                        : "Nenhuma chave configurada — usando variável de ambiente, se houver."}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={isEnabled ? "" : "text-muted-foreground"}
                  >
                    {isEnabled ? "Habilitada" : "Desabilitada"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Última verificação: {formatDate(integration?.lastCheckedAt ?? null)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <TestarConexaoButton provider={provider} />
                  <ToggleIntegracaoButton
                    provider={provider}
                    enabled={isEnabled}
                  />
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/integracoes/${provider}`}>
                      Trocar chave
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso de IA (Gemini)</CardTitle>
          <CardDescription>
            Resumo agregado por operação, baseado nos registros de{" "}
            <code>AIUsageLog</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há registros de uso de IA.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Chamadas</TableHead>
                  <TableHead>Taxa de sucesso</TableHead>
                  <TableHead>Latência média</TableHead>
                  <TableHead>Tokens totais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageStats.map((row) => {
                  const success = successByOperation.get(row.operation);
                  const successRate = success
                    ? Math.round((success.success / success.total) * 100)
                    : null;
                  return (
                    <TableRow key={row.operation}>
                      <TableCell className="font-medium">
                        {row.operation}
                      </TableCell>
                      <TableCell>{row._count._all}</TableCell>
                      <TableCell>
                        {successRate === null ? "—" : `${successRate}%`}
                      </TableCell>
                      <TableCell>
                        {row._avg.latencyMs
                          ? `${Math.round(row._avg.latencyMs)} ms`
                          : "—"}
                      </TableCell>
                      <TableCell>{row._sum.totalTokens ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
