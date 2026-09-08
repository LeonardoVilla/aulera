import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnswerWithQuestion = {
  id: string;
  isCorrect: boolean | null;
  selectedOptionId: string | null;
  question: {
    statement: string;
    correctOptionId: string | null;
    options: unknown;
  };
};

export function ResultadoHeaderGamificado({
  groupName,
  correctCount,
  total,
  scoreObjective,
  earnedXpHint,
}: {
  groupName: string;
  correctCount: number;
  total: number;
  scoreObjective: number | null | undefined;
  earnedXpHint?: number;
}) {
  const isGreatResult = total > 0 && correctCount / total >= 0.7;

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <span className="text-3xl" aria-hidden>
            {isGreatResult ? "🎉" : "💪"}
          </span>
          Resultado — {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-4xl font-bold">
          {correctCount} / {total}{" "}
          <span className="text-lg font-normal text-white/80">corretas</span>
        </p>
        <p className="text-white/90">
          {scoreObjective?.toFixed(0)}% de aproveitamento
          {typeof earnedXpHint === "number" && ` · +${earnedXpHint} XP`}
        </p>
      </CardContent>
    </Card>
  );
}

export function RespostaCardGamificada({ answer }: { answer: AnswerWithQuestion }) {
  const options =
    (answer.question.options as { id: string; text: string }[] | null) ?? [];
  const selectedOption = options.find((o) => o.id === answer.selectedOptionId);
  const correctOption = options.find(
    (o) => o.id === answer.question.correctOptionId,
  );

  return (
    <Card
      className={
        "border-2 " +
        (answer.isCorrect
          ? "border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/20"
          : "border-rose-400/60 bg-rose-50/60 dark:bg-rose-950/20")
      }
    >
      <CardContent className="space-y-1 pt-6 text-sm">
        <p className="font-medium">{answer.question.statement}</p>
        <p
          className={
            "flex items-center gap-1 font-semibold " +
            (answer.isCorrect
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400")
          }
        >
          <span aria-hidden>{answer.isCorrect ? "✅" : "❌"}</span>
          Sua resposta:{" "}
          {selectedOption
            ? `${selectedOption.id}) ${selectedOption.text}`
            : "não respondida"}
        </p>
        {!answer.isCorrect && correctOption && (
          <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span aria-hidden>💡</span>
            Correta: {correctOption.id}) {correctOption.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function VoltarDashboardGamificado() {
  return (
    <Button
      asChild
      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold hover:from-violet-700 hover:to-fuchsia-700"
    >
      <Link href="/dashboard">Voltar ao dashboard 🚀</Link>
    </Button>
  );
}
