import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const auth = await loginRequest(payload);

      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      });

      const user = await meRequest();
      setUser(user);

      return user;
    },

    onSuccess: () => {
      toast.success("تم تسجيل الدخول بنجاح");
      router.replace("/dashboard");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
