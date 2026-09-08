"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alterarRole } from "@/actions/admin/usuarios";
import type { Role } from "@/generated/prisma/enums";

export function RoleSelectForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = role !== currentRole;

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={(value) => setRole(value as Role)}>
        <SelectTrigger className="w-32" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALUNO">Aluno</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!dirty || isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await alterarRole(userId, role);
            if (result.error) {
              setError(result.error);
              setRole(currentRole);
            } else {
              router.refresh();
            }
          });
        }}
      >
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
