import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBadgeTemplate,
  createEvent,
  deleteEvent,
  deleteEventBranding,
  getBadgeAvailableFields,
  getBadgeTemplateByEvent,
  getEventBranding,
  getEvents,
  updateBadgeTemplate,
  updateEvent,
} from "./events.api";
import {
  BadgeTemplatePayload,
  CreateEventPayload,
  EventsListParams,
  EventsListResponse,
  UpdateEventPayload,
} from "./events.types";

export const eventsKeys = {
  all: ["events"] as const,

  lists: () => [...eventsKeys.all, "list"] as const,

  list: (params: EventsListParams) => [...eventsKeys.lists(), params] as const,

  branding: (eventId: string) =>
    [...eventsKeys.all, "branding", eventId] as const,

  badgeTemplate: (eventId: string) =>
    [...eventsKeys.all, "badge-template", eventId] as const,

  availableBadgeFields: (eventId: string) =>
    [...eventsKeys.all, "badge-available-fields", eventId] as const,
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

function invalidateEvents(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({
    queryKey: eventsKeys.all,
  });
}

export function useEvents(params: EventsListParams) {
  return useQuery({
    queryKey: eventsKeys.list(params),
    queryFn: () => getEvents(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),

    onSuccess: () => {
      toast.success("تم إنشاء الفعالية بنجاح");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },

    /*
     * نحدّث القائمة حتى لو نجح إنشاء الفعالية وفشل رفع Branding.
     */
    onSettled: () => {
      invalidateEvents(queryClient);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateEventPayload;
    }) => updateEvent(id, payload),

    onSuccess: (data, variables) => {
      toast.success("تم تعديل الفعالية بنجاح");

      if (data.branding) {
        queryClient.setQueryData(
          eventsKeys.branding(variables.id),
          data.branding,
        );
      }
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },

    onSettled: () => {
      invalidateEvents(queryClient);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف الفعالية بنجاح");

      queryClient.setQueriesData<EventsListResponse>(
        {
          queryKey: eventsKeys.lists(),
        },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          const nextItems = oldData.items.filter((event) => event.id !== id);
          const currentTotal = oldData.total ?? oldData.items.length;
          const nextTotal = Math.max(currentTotal - 1, 0);
          const limit = oldData.limit || 20;

          return {
            ...oldData,
            items: nextItems,
            total: nextTotal,
            totalPages: Math.max(Math.ceil(nextTotal / limit), 1),
          };
        },
      );

      invalidateEvents(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useEventBranding(eventId: string) {
  return useQuery({
    queryKey: eventsKeys.branding(eventId),
    queryFn: () => getEventBranding(eventId),
    enabled: Boolean(eventId),
    retry: false,
  });
}

export function useDeleteEventBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEventBranding(eventId),

    onSuccess: (_data, eventId) => {
      toast.success("تم حذف الهوية البصرية بالكامل");

      queryClient.setQueryData(eventsKeys.branding(eventId), null);

      queryClient.setQueriesData<EventsListResponse>(
        {
          queryKey: eventsKeys.lists(),
        },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,
            items: oldData.items.map((event) => {
              if (event.id !== eventId) {
                return event;
              }

              return {
                ...event,
                branding: null,
                eventBranding: null,
              };
            }),
          };
        },
      );

      invalidateEvents(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useEventBadgeTemplate(eventId: string) {
  return useQuery({
    queryKey: eventsKeys.badgeTemplate(eventId),
    queryFn: () => getBadgeTemplateByEvent(eventId),
    enabled: Boolean(eventId),
    retry: false,
  });
}

export function useCreateBadgeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BadgeTemplatePayload) => createBadgeTemplate(payload),

    onSuccess: () => {
      toast.success("تم إنشاء قالب البادج بنجاح");
      invalidateEvents(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateBadgeTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: BadgeTemplatePayload;
    }) => updateBadgeTemplate(eventId, payload),

    onSuccess: () => {
      toast.success("تم تعديل قالب البادج بنجاح");
      invalidateEvents(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useBadgeAvailableFields(eventId: string) {
  return useQuery({
    queryKey: eventsKeys.availableBadgeFields(eventId),
    queryFn: () => getBadgeAvailableFields(eventId),
    enabled: Boolean(eventId),
    retry: false,
  });
}
