import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAttendeeType,
  deleteAttendeeType,
  getAttendeeTypes,
  updateAttendeeType,
} from "./attendee-types.api";
import {
  AttendeeTypesListParams,
  AttendeeTypesListResponse,
  CreateAttendeeTypePayload,
  UpdateAttendeeTypePayload,
} from "./attendee-types.types";

export const attendeeTypesKeys = {
  all: ["attendee-types"] as const,
  lists: () => [...attendeeTypesKeys.all, "list"] as const,
  list: (params: AttendeeTypesListParams) =>
    [...attendeeTypesKeys.lists(), params] as const,
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

export function useAttendeeTypes(params: AttendeeTypesListParams) {
  return useQuery({
    queryKey: attendeeTypesKeys.list(params),
    queryFn: () => getAttendeeTypes(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateAttendeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttendeeTypePayload) =>
      createAttendeeType(payload),

    onSuccess: () => {
      toast.success("تم إضافة نوع الحضور بنجاح");

      queryClient.invalidateQueries({
        queryKey: attendeeTypesKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateAttendeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAttendeeTypePayload;
    }) => updateAttendeeType(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل نوع الحضور بنجاح");

      queryClient.invalidateQueries({
        queryKey: attendeeTypesKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteAttendeeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAttendeeType(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف نوع الحضور بنجاح");

      queryClient.setQueriesData<AttendeeTypesListResponse>(
        {
          queryKey: attendeeTypesKeys.lists(),
        },
        (oldData) => {
          if (!oldData) return oldData;

          const nextItems = oldData.items.filter((type) => type.id !== id);
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
        queryKey: attendeeTypesKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
