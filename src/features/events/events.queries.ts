import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEvent, deleteEvent, getEvents, updateEvent } from "./events.api";
import {
  CreateEventPayload,
  EventsListParams,
  EventsListResponse,
  UpdateEventPayload,
} from "./events.types";

export const eventsKeys = {
  all: ["events"] as const,
  lists: () => [...eventsKeys.all, "list"] as const,
  list: (params: EventsListParams) => [...eventsKeys.lists(), params] as const,
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

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "حدث خطأ غير متوقع";
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

      queryClient.invalidateQueries({
        queryKey: eventsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
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

    onSuccess: () => {
      toast.success("تم تعديل الفعالية بنجاح");

      queryClient.invalidateQueries({
        queryKey: eventsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
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
          if (!oldData) return oldData;

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

      queryClient.invalidateQueries({
        queryKey: eventsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
