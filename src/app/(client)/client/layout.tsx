import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { ClientShell } from "@/components/layout/client/client-shell";
import { USER_ROLES } from "@/lib/auth/roles";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.CLIENT_VIEWER]}>
      <ClientShell>{children}</ClientShell>
    </RoleGuard>
  );
}
