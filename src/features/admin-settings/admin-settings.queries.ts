import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminSettings, updateAdminSettings } from "./admin-settings.api";

export const adminSettingsKey = ["admin-settings"] as const;

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? "تعذر حفظ الإعدادات";
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error ? error.message : "تعذر حفظ الإعدادات";
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminSettingsKey,
    queryFn: getAdminSettings,
    staleTime: 60_000,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(adminSettingsKey, settings);
      queryClient.invalidateQueries({ queryKey: ["notification-center"] });
      toast.success("تم حفظ إعدادات النظام");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
