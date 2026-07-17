import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBadgeTemplate,
  deleteBadgeTemplateByEvent,
  getBadgeAvailableFields,
  getBadgeTemplateByEvent,
  getBadgeTemplates,
  getResolvedBadgeData,
  updateBadgeTemplateByEvent,
} from "./badge-templates.api";
import { BadgeTemplatePayload } from "./badge-templates.types";

export const badgeTemplatesKeys = {
  all: ["badge-templates"] as const,
  lists: () => [...badgeTemplatesKeys.all, "list"] as const,
  list: () => [...badgeTemplatesKeys.lists()] as const,
  details: () => [...badgeTemplatesKeys.all, "detail"] as const,
  detailByEvent: (eventId: string) =>
    [...badgeTemplatesKeys.details(), "event", eventId] as const,
  availableFields: (eventId: string) =>
    [...badgeTemplatesKeys.all, "available-fields", eventId] as const,
  resolved: (eventId: string, registrationId: string) =>
    [...badgeTemplatesKeys.all, "resolved", eventId, registrationId] as const,
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

    if (Array.isArray(message)) return message[0] ?? "حدث خطأ غير متوقع";
    if (typeof message === "string") return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return "حدث خطأ غير متوقع";
}

export function useBadgeTemplates() {
  return useQuery({
    queryKey: badgeTemplatesKeys.list(),
    queryFn: getBadgeTemplates,
  });
}

export function useBadgeTemplateByEvent(eventId: string) {
  return useQuery({
    queryKey: badgeTemplatesKeys.detailByEvent(eventId),
    queryFn: () => getBadgeTemplateByEvent(eventId),
    enabled: Boolean(eventId),
    retry: false,
  });
}

export function useBadgeAvailableFields(eventId: string) {
  return useQuery({
    queryKey: badgeTemplatesKeys.availableFields(eventId),
    queryFn: () => getBadgeAvailableFields(eventId),
    enabled: Boolean(eventId),
  });
}

export function useResolvedBadgeData(eventId: string, registrationId: string) {
  return useQuery({
    queryKey: badgeTemplatesKeys.resolved(eventId, registrationId),
    queryFn: () => getResolvedBadgeData(eventId, registrationId),
    enabled: Boolean(eventId && registrationId),
    retry: false,
  });
}

export function useCreateBadgeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BadgeTemplatePayload) => createBadgeTemplate(payload),

    onSuccess: (data) => {
      toast.success("تم إنشاء قالب البادج بنجاح");

      queryClient.invalidateQueries({
        queryKey: badgeTemplatesKeys.all,
      });

      if (data.eventId) {
        queryClient.setQueryData(
          badgeTemplatesKeys.detailByEvent(data.eventId),
          data,
        );
      }
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateBadgeTemplateByEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: Omit<BadgeTemplatePayload, "eventId">;
    }) => updateBadgeTemplateByEvent(eventId, payload),

    onSuccess: (data, variables) => {
      toast.success("تم تعديل قالب البادج بنجاح");

      queryClient.invalidateQueries({
        queryKey: badgeTemplatesKeys.all,
      });

      queryClient.setQueryData(
        badgeTemplatesKeys.detailByEvent(variables.eventId),
        data,
      );
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteBadgeTemplateByEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteBadgeTemplateByEvent(eventId),

    onSuccess: (_data, eventId) => {
      toast.success("تم حذف قالب البادج بنجاح");

      queryClient.removeQueries({
        queryKey: badgeTemplatesKeys.detailByEvent(eventId),
      });

      queryClient.invalidateQueries({
        queryKey: badgeTemplatesKeys.all,
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
