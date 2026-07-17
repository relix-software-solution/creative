import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createNotificationTemplate,
  deactivateNotificationTemplate,
  getEventRegistrationQrTemplate,
  updateNotificationTemplate,
} from "./notification-templates.api";
import {
  CreateNotificationTemplatePayload,
  NotificationTemplate,
  UpdateNotificationTemplatePayload,
} from "./notification-templates.types";

export const notificationTemplatesKeys = {
  all: ["notification-templates"] as const,

  eventRegistrationQr: (eventId: string, locale: "AR" | "EN" = "AR") =>
    [
      ...notificationTemplatesKeys.all,
      "event",
      eventId,
      "registration-qr",
      "WHATSAPP",
      locale,
    ] as const,
};

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

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "حدث خطأ غير متوقع";
}

export function useEventRegistrationQrTemplate(
  eventId: string,
  locale: "AR" | "EN" = "AR",
  enabled = true,
) {
  return useQuery({
    queryKey: notificationTemplatesKeys.eventRegistrationQr(eventId, locale),

    queryFn: () => getEventRegistrationQrTemplate(eventId, locale),

    enabled: Boolean(eventId) && enabled,
    retry: false,
  });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationTemplatePayload) =>
      createNotificationTemplate(payload),

    onSuccess: (template) => {
      toast.success("تم إنشاء رسالة WhatsApp بنجاح");

      queryClient.setQueryData<NotificationTemplate>(
        notificationTemplatesKeys.eventRegistrationQr(
          template.eventId,
          template.locale === "EN" ? "EN" : "AR",
        ),
        template,
      );

      queryClient.invalidateQueries({
        queryKey: notificationTemplatesKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      eventId,
      locale,
      payload,
    }: {
      templateId: string;
      eventId: string;
      locale: "AR" | "EN";
      payload: UpdateNotificationTemplatePayload;
    }) => updateNotificationTemplate(templateId, payload),

    onSuccess: (template, variables) => {
      toast.success("تم تعديل رسالة WhatsApp بنجاح");

      queryClient.setQueryData<NotificationTemplate>(
        notificationTemplatesKeys.eventRegistrationQr(
          variables.eventId,
          variables.locale,
        ),
        template,
      );

      queryClient.invalidateQueries({
        queryKey: notificationTemplatesKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeactivateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
    }: {
      templateId: string;
      eventId: string;
      locale: "AR" | "EN";
    }) => deactivateNotificationTemplate(templateId),

    onSuccess: (_data, variables) => {
      toast.success("تم تعطيل رسالة WhatsApp");

      queryClient.setQueryData<NotificationTemplate | null>(
        notificationTemplatesKeys.eventRegistrationQr(
          variables.eventId,
          variables.locale,
        ),
        (current) =>
          current
            ? {
                ...current,
                isActive: false,
              }
            : null,
      );

      queryClient.invalidateQueries({
        queryKey: notificationTemplatesKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
