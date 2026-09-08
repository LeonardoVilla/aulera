import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EditalStatus } from "@/generated/prisma/enums";

const STATUS_LABEL: Record<EditalStatus, string> = {
  PENDENTE: "Pendente",
  EXTRAINDO_TEXTO: "Extraindo texto",
  PARSEANDO_IA: "Analisando com IA",
  CONCLUIDO: "Concluído",
  ERRO: "Erro",
};

const STATUS_CLASSNAME: Record<EditalStatus, string> = {
  PENDENTE: "bg-muted text-muted-foreground",
  EXTRAINDO_TEXTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PARSEANDO_IA:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CONCLUIDO:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ERRO: "bg-destructive/10 text-destructive",
};

export default async function EditaisPage() {
  const user = await requireOnboardedUser();

  const editais = await prisma.edital.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Meus editais</h1>
          <p className="text-muted-foreground">
            Envie o PDF de um edital de concurso para extrair automaticamente
            o conteúdo programático e o cronograma.
          </p>
        </div>
        <Link href="/editais/novo">
          <Button>Enviar novo edital</Button>
        </Link>
      </div>

      {editais.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não enviou nenhum edital.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editais.map((edital) => (
            <Link key={edital.id} href={`/editais/${edital.id}`}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {edital.originalFileName}
                    </CardTitle>
                    <Badge className={STATUS_CLASSNAME[edital.status]}>
                      {STATUS_LABEL[edital.status]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {edital.orgao ?? edital.cargo ? (
                      <>
                        {edital.orgao ?? "Órgão não identificado"}
                        {edital.cargo ? ` — ${edital.cargo}` : ""}
                      </>
                    ) : (
                      "Aguardando processamento"
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
