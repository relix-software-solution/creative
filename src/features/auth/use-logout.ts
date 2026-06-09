"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutRequest } from "./auth.api";
import { useAuthStore } from "@/stores/auth-store";

export function useLogout() {
  const router = useRouter();

  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      if (!refreshToken) return null;
      return logoutRequest(refreshToken);
    },

    onSuccess: () => {
      clearAuth();
      toast.success("تم تسجيل الخروج بنجاح");
      router.replace("/login");
    },

    onError: () => {
      clearAuth();
      toast.warning("تم إنهاء الجلسة محليًا");
      router.replace("/login");
    },
  });
}
