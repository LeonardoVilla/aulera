import { signIn } from "@/lib/auth";
import { isMicrosoftLoginEnabled } from "@/lib/auth.config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta para começar a estudar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl ?? "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full">
              Entrar com Google
            </Button>
          </form>

          {isMicrosoftLoginEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("microsoft-entra-id", {
                  redirectTo: callbackUrl ?? "/dashboard",
                });
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                Entrar com Microsoft
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
