import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDigitalTicketTemplate,
  deleteEventDigitalTicketTemplate,
  getEventDigitalTicketTemplate,
  previewDigitalTicketTemplate,
  updateEventDigitalTicketTemplate,
} from "./digital-ticket-templates.api";
import {
  DigitalTicketPreviewPayload,
  SaveDigitalTicketTemplatePayload,
} from "./digital-ticket-templates.types";

export const digitalTicketTemplateKeys = {
  all: ["digital-ticket-templates"] as const,

  event: (eventId: string) =>
    [...digitalTicketTemplateKeys.all, "event", eventId] as const,
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
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
      return message[0] ?? "حدث خطأ أثناء تنفيذ العملية";
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "حدث خطأ أثناء تنفيذ العملية";
}

export function useEventDigitalTicketTemplate(eventId: string, enabled = true) {
  return useQuery({
    queryKey: digitalTicketTemplateKeys.event(eventId),

    queryFn: () => getEventDigitalTicketTemplate(eventId),

    enabled: Boolean(eventId) && enabled,
    retry: false,
  });
}

export function useCreateDigitalTicketTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveDigitalTicketTemplatePayload) =>
      createDigitalTicketTemplate(payload),

    onSuccess: (template, payload) => {
      toast.success("تم إنشاء بطاقة الدخول بنجاح");

      queryClient.setQueryData(
        digitalTicketTemplateKeys.event(payload.eventId),
        template,
      );

      queryClient.invalidateQueries({
        queryKey: digitalTicketTemplateKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateDigitalTicketTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveDigitalTicketTemplatePayload) =>
      updateEventDigitalTicketTemplate(payload),

    onSuccess: (template, payload) => {
      toast.success("تم حفظ تعديلات بطاقة الدخول");

      queryClient.setQueryData(
        digitalTicketTemplateKeys.event(payload.eventId),
        template,
      );

      queryClient.invalidateQueries({
        queryKey: digitalTicketTemplateKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteDigitalTicketTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      deleteEventDigitalTicketTemplate(eventId),

    onSuccess: (_response, variables) => {
      toast.success("تم حذف قالب بطاقة الدخول");

      queryClient.setQueryData(
        digitalTicketTemplateKeys.event(variables.eventId),
        null,
      );

      queryClient.invalidateQueries({
        queryKey: digitalTicketTemplateKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePreviewDigitalTicketTemplate() {
  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: DigitalTicketPreviewPayload;
    }) => previewDigitalTicketTemplate(eventId, payload),

    onSuccess: () => {
      toast.success("تم إنشاء المعاينة الفعلية");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
