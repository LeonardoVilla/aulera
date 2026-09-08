import { requireUser } from "@/lib/auth-guards";
import { salvarPerfilInicial } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vamos configurar seus estudos</CardTitle>
          <CardDescription>
            Escolha seu grupo de estudo e sua meta diária de tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={salvarPerfilInicial} className="space-y-6">
            <div className="space-y-3">
              <Label>Grupo de estudo</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-center rounded-md border p-4 text-sm font-medium hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent">
                  <input
                    type="radio"
                    name="groupSlug"
                    value="ti"
                    defaultChecked
                    className="sr-only"
                  />
                  Analista de TI
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-md border p-4 text-sm font-medium hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent">
                  <input
                    type="radio"
                    name="groupSlug"
                    value="direito"
                    className="sr-only"
                  />
                  Direito
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyMinutesTarget">
                Meta diária de estudo (minutos)
              </Label>
              <Input
                id="dailyMinutesTarget"
                name="dailyMinutesTarget"
                type="number"
                min={10}
                max={480}
                defaultValue={60}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
