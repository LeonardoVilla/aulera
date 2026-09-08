import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { reprocessarEdital } from "@/actions/editais";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BLOCK_LABEL: Record<string, string> = {
  BASICO: "Conhecimentos Básicos",
  GERAL: "Conhecimentos Gerais",
  ESPECIFICO: "Conhecimentos Específicos",
};

const EVENT_KIND_LABEL: Record<string, string> = {
  INSCRICAO: "Inscrição",
  PROVA_OBJETIVA: "Prova objetiva",
  PROVA_DISCURSIVA: "Prova discursiva",
  GABARITO: "Gabarito",
  RECURSO: "Recurso",
  RESULTADO: "Resultado",
  OUTRO: "Outro",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export default async function EditalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOnboardedUser();
  const { id } = await params;

  const edital = await prisma.edital.findFirst({
    where: { id, userId: user.id },
    include: {
      subjects: { orderBy: [{ block: "asc" }, { name: "asc" }] },
      scheduleEvents: { orderBy: { startDate: "asc" } },
    },
  });

  if (!edital) {
    notFound();
  }

  const isProcessing =
    edital.status === "PENDENTE" ||
    edital.status === "EXTRAINDO_TEXTO" ||
    edital.status === "PARSEANDO_IA";

  return (
    <div className="space-y-6">
      {/*
        MVP: sem polling/websocket. Enquanto o edital está em processamento,
        recarregamos a página automaticamente a cada alguns segundos via
        meta refresh — simples e suficiente para este estágio do produto.
      */}
      {isProcessing && (
        <meta httpEquiv="refresh" content="4" />
      )}

      <div>
        <h1 className="text-2xl font-semibold">{edital.originalFileName}</h1>
        <p className="text-muted-foreground">
          Enviado em {dateFormatter.format(edital.createdAt)}
        </p>
      </div>

      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processando edital...</CardTitle>
            <CardDescription>
              {edital.status === "PENDENTE" &&
                "Aguardando início do processamento."}
              {edital.status === "EXTRAINDO_TEXTO" &&
                "Extraindo o texto do PDF."}
              {edital.status === "PARSEANDO_IA" &&
                "Analisando o conteúdo com IA para identificar órgão, cargo, disciplinas e cronograma."}
              {" "}
              Esta página atualiza automaticamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {edital.status === "ERRO" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Falha no processamento
            </CardTitle>
            <CardDescription>
              {edital.errorMessage ?? "Ocorreu um erro desconhecido."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server";
                await reprocessarEdital(edital.id);
              }}
            >
              <Button type="submit" variant="outline">
                Tentar novamente
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {edital.status === "CONCLUIDO" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Resumo
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  Concluído
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Órgão</span>
                <p className="font-medium">
                  {edital.orgao ?? "Não identificado"}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Cargo</span>
                <p className="font-medium">
                  {edital.cargo ?? "Não identificado"}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Inscrições até
                </span>
                <p className="font-medium">
                  {edital.registrationDeadline
                    ? dateFormatter.format(edital.registrationDeadline)
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Data da prova
                </span>
                <p className="font-medium">
                  {edital.examDate
                    ? dateFormatter.format(edital.examDate)
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Resultado
                </span>
                <p className="font-medium">
                  {edital.resultDate
                    ? dateFormatter.format(edital.resultDate)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo programático</CardTitle>
              <CardDescription>
                {edital.subjects.length} disciplina(s) identificada(s).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edital.subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma disciplina identificada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bloco</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Questões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {edital.subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          {BLOCK_LABEL[subject.block] ?? subject.block}
                        </TableCell>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell className="text-right">
                          {subject.numQuestions ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cronograma</CardTitle>
              <CardDescription>
                {edital.scheduleEvents.length} evento(s) identificado(s).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edital.scheduleEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento de cronograma identificado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {edital.scheduleEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.label}</TableCell>
                        <TableCell>
                          {EVENT_KIND_LABEL[event.kind] ?? event.kind}
                        </TableCell>
                        <TableCell>
                          {dateFormatter.format(event.startDate)}
                          {event.endDate
                            ? ` – ${dateFormatter.format(event.endDate)}`
                            : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
