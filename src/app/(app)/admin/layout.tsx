import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-4 border-b pb-3 text-sm">
        <Link href="/admin" className="font-medium hover:underline">
          Admin
        </Link>
        <Link
          href="/admin/integracoes"
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Integrações
        </Link>
        <Link
          href="/admin/usuarios"
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Usuários
        </Link>
      </nav>
      {children}
    </div>
  );
}
