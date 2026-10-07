import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationLogs,
  getNotificationSummary,
  getNotificationTemplates,
  retryFailedNotifications,
  retryNotificationLog,
  setNotificationTemplateActive,
} from "./notification-center.api";
import type {
  NotificationLogsParams,
  NotificationSummaryParams,
  NotificationTemplatesParams,
} from "./notification-center.types";

export const notificationCenterKeys = {
  all: ["notification-center"] as const,
  summary: (params: NotificationSummaryParams) => [...notificationCenterKeys.all, "summary", params] as const,
  logs: (params: NotificationLogsParams) => [...notificationCenterKeys.all, "logs", params] as const,
  templates: (params: NotificationTemplatesParams) => [...notificationCenterKeys.all, "templates", params] as const,
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? "حدث خطأ غير متوقع";
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع";
}

export function useNotificationSummary(
  params: NotificationSummaryParams,
  refetchIntervalMs = 30_000,
) {
  return useQuery({
    queryKey: notificationCenterKeys.summary(params),
    queryFn: () => getNotificationSummary(params),
    refetchInterval: refetchIntervalMs,
  });
}

export function useNotificationLogs(
  params: NotificationLogsParams,
  refetchIntervalMs = 30_000,
) {
  return useQuery({
    queryKey: notificationCenterKeys.logs(params),
    queryFn: () => getNotificationLogs(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: refetchIntervalMs,
  });
}

export function useNotificationTemplates(params: NotificationTemplatesParams) {
  return useQuery({
    queryKey: notificationCenterKeys.templates(params),
    queryFn: () => getNotificationTemplates(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useRetryNotificationLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryNotificationLog,
    onSuccess: () => {
      toast.success("تمت إعادة جدولة الإشعار للإرسال");
      queryClient.invalidateQueries({ queryKey: notificationCenterKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRetryFailedNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedNotifications,
    onSuccess: (result) => {
      toast.success(`تمت جدولة ${result.queued} إشعار لإعادة المحاولة`);
      queryClient.invalidateQueries({ queryKey: notificationCenterKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSetNotificationTemplateActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, isActive }: { templateId: string; isActive: boolean }) =>
      setNotificationTemplateActive(templateId, isActive),
    onSuccess: (_result, variables) => {
      toast.success(variables.isActive ? "تم تفعيل القالب" : "تم تعطيل القالب");
      queryClient.invalidateQueries({ queryKey: notificationCenterKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
