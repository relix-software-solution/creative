"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getDefaultPathByRole, UserRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/stores/auth-store";

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
};

function RoleGuardContent({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  const role = user?.role;
  const isAllowed = Boolean(role && allowedRoles.includes(role));

  useEffect(() => {
    if (!role) return;

    if (!isAllowed) {
      router.replace(getDefaultPathByRole(role));
    }
  }, [isAllowed, role, router]);

  if (!role || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8FF]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-[#A88042]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <h1 className="text-lg font-extrabold text-[#4B4B4B]">
            جاري التحقق من الصلاحيات
          </h1>

          <p className="mt-2 text-sm font-bold text-[#4B4B4B]/55">
            يرجى الانتظار قليلًا...
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  return (
    <AuthGuard>
      <RoleGuardContent allowedRoles={allowedRoles}>
        {children}
      </RoleGuardContent>
    </AuthGuard>
  );
}
