import { responderQuestaoObjetiva } from "@/actions/sessoes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProgressoLudico({
  answeredCount,
  total,
}: {
  answeredCount: number;
  total: number;
}) {
  return (
    <div className="flex w-full max-w-xl items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={
            "h-3 flex-1 rounded-full transition-colors duration-300 " +
            (i < answeredCount
              ? "bg-gradient-to-r from-emerald-400 to-green-500"
              : i === answeredCount
                ? "animate-pulse bg-orange-300"
                : "bg-muted")
          }
        />
      ))}
    </div>
  );
}

export function QuestaoObjetivaGamificada({
  sessaoId,
  questionId,
  statement,
  options,
  questionNumber,
  total,
}: {
  sessaoId: string;
  questionId: string;
  statement: string;
  options: { id: string; text: string }[];
  questionNumber: number;
  total: number;
}) {
  return (
    <Card className="w-full max-w-xl border-2 border-violet-300/50 bg-gradient-to-br from-violet-50 via-white to-orange-50 shadow-md dark:border-violet-500/30 dark:from-violet-950/30 dark:via-background dark:to-orange-950/20">
      <CardHeader>
        <span className="w-fit rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">
          Questão {questionNumber} de {total}
        </span>
        <CardTitle className="text-lg font-medium">{statement}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={responderQuestaoObjetiva} className="space-y-3">
          <input type="hidden" name="sessionId" value={sessaoId} />
          <input type="hidden" name="questionId" value={questionId} />

          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-transparent bg-white/70 p-3 text-sm shadow-sm transition-all hover:scale-[1.01] hover:border-violet-400 hover:bg-violet-50 has-[:checked]:border-violet-600 has-[:checked]:bg-violet-100 dark:bg-card/70 dark:hover:bg-violet-950/40 dark:has-[:checked]:bg-violet-950/60"
            >
              <input
                type="radio"
                name="selectedOptionId"
                value={opt.id}
                required
                className="mt-1"
              />
              <span>
                <strong className="mr-1 text-violet-700 dark:text-violet-300">
                  {opt.id})
                </strong>
                {opt.text}
              </span>
            </label>
          ))}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold hover:from-violet-700 hover:to-fuchsia-700"
          >
            Responder ✨
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
