"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { meRequest } from "./auth.api";
import { useAuthStore } from "@/stores/auth-store";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.logout);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    async function checkAuth() {
      if (!accessToken && !useAuthStore.getState().refreshToken) {
        clearAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (user) {
        setIsChecking(false);
        return;
      }

      try {
        const currentUser = await meRequest();
        setUser(currentUser);
        setIsChecking(false);
      } catch {
        clearAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    checkAuth();
  }, [accessToken, clearAuth, hasHydrated, pathname, router, setUser, user]);

  if (!hasHydrated || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8FF]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-[#A88042]">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <h1 className="text-lg font-extrabold text-[#4B4B4B]">
            جاري التحقق من الجلسة
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
