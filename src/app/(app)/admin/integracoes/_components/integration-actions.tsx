"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { alternarIntegracao, testarConexao } from "@/actions/admin/integracoes";

export function TestarConexaoButton({ provider }: { provider: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean } | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await testarConexao(provider);
            setMessage(result);
            router.refresh();
          });
        }}
      >
        {isPending ? "Testando..." : "Testar conexão"}
      </Button>
      {message && (
        <span
          className={
            message.ok
              ? "text-xs text-green-600 dark:text-green-400"
              : "text-xs text-destructive"
          }
        >
          {message.ok ? "Conexão OK" : "Falha na conexão"}
        </span>
      )}
    </div>
  );
}

export function ToggleIntegracaoButton({
  provider,
  enabled,
}: {
  provider: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={enabled ? "secondary" : "default"}
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await alternarIntegracao(provider, !enabled);
          router.refresh();
        });
      }}
    >
      {isPending ? "Salvando..." : enabled ? "Desativar" : "Ativar"}
    </Button>
  );
}
