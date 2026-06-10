import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPublicEvent,
  getPublicEvents,
  registerToPublicEvent,
} from "./public-events.api";
import {
  PublicEventsListParams,
  PublicRegisterPayload,
} from "./public-events.types";

export const publicEventsKeys = {
  all: ["public-events"] as const,
  lists: () => [...publicEventsKeys.all, "list"] as const,
  list: (params: PublicEventsListParams) =>
    [...publicEventsKeys.lists(), params] as const,
  details: () => [...publicEventsKeys.all, "detail"] as const,
  detail: (id: string) => [...publicEventsKeys.details(), id] as const,
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    const message = response.response?.data?.message;

    if (Array.isArray(message)) return message[0] ?? "حدث خطأ غير متوقع";
    if (typeof message === "string") return message;
  }

  return "حدث خطأ غير متوقع";
}

export function usePublicEvents(params: PublicEventsListParams = {}) {
  return useQuery({
    queryKey: publicEventsKeys.list(params),
    queryFn: () => getPublicEvents(params),
  });
}

export function usePublicEvent(id: string) {
  return useQuery({
    queryKey: publicEventsKeys.detail(id),
    queryFn: () => getPublicEvent(id),
    enabled: Boolean(id),
  });
}

export function useRegisterToPublicEvent(eventId: string) {
  return useMutation({
    mutationFn: (payload: PublicRegisterPayload) =>
      registerToPublicEvent(eventId, payload),

    onSuccess: () => {
      toast.success("تم إرسال طلب التسجيل بنجاح");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
