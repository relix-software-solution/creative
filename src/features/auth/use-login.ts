import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDefaultPathByRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/stores/auth-store";
import { loginRequest, meRequest } from "./auth.api";
import { LoginPayload } from "./auth.types";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? "حدث خطأ غير متوقع";
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "تعذر تسجيل الدخول، تحقق من البيانات";
}

function isSafeNextUrl(nextUrl: string | null) {
  if (!nextUrl) return false;
  if (!nextUrl.startsWith("/")) return false;
  if (nextUrl.startsWith("//")) return false;
  if (nextUrl === "/login") return false;

  return true;
}

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const auth = await loginRequest(payload);

      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });

      try {
        const user = await meRequest();
        setUser(user);

        return user;
      } catch (error) {
        clearAuth();
        throw error;
      }
    },

    onSuccess: (user) => {
      const nextUrl = searchParams.get("next");
      const fallbackUrl = getDefaultPathByRole(user.role);

      toast.success("تم تسجيل الدخول بنجاح");

      router.replace(isSafeNextUrl(nextUrl) ? nextUrl! : fallbackUrl);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
