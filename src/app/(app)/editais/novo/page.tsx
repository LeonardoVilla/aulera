import { requireOnboardedUser } from "@/lib/auth-guards";
import { criarEdital } from "@/actions/editais";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default async function NovoEditalPage() {
  await requireOnboardedUser();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Enviar novo edital</h1>
        <p className="text-muted-foreground">
          Envie o PDF do edital do concurso. O sistema vai extrair o texto e
          usar IA para identificar órgão, cargo, conteúdo programático e
          cronograma automaticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivo do edital</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Server Actions com FormData lidam com multipart/form-data
              automaticamente no App Router — não é necessário configurar
              encType manualmente. */}
          <form action={criarEdital} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">PDF do edital (máx. 15MB)</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,application/pdf"
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar e processar
            </Button>
            <p className="text-xs text-muted-foreground">
              O processamento (extração de texto + análise por IA) acontece
              logo após o envio e pode levar alguns segundos, dependendo do
              tamanho do edital.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
