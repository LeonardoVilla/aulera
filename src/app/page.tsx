import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-6 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
        Estudos dirigidos para concursos e processos seletivos
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Pílulas de estudo em Tecnologia da Informação e Direito, com
        correção de questões por IA e trilhas geradas a partir do edital.
      </p>
      <Button asChild size="lg">
        <Link href="/login">Começar agora</Link>
      </Button>
    </div>
  );
}
