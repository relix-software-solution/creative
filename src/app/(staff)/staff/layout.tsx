import Link from "next/link";
import { ReactNode } from "react";
import { QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { USER_ROLES } from "@/lib/auth/roles";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.STAFF,
      ]}
    >
      <main className="min-h-screen bg-[#F8F8FF] text-[#4B4B4B]">
        <div className="mx-auto   ">{children}</div>
      </main>
    </RoleGuard>
  );
}
