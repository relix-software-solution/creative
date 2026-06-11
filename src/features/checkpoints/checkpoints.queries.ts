import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCheckpoint,
  deleteCheckpoint,
  getCheckpoints,
  updateCheckpoint,
} from "./checkpoints.api";
import {
  CheckpointsListParams,
  CheckpointsListResponse,
  CreateCheckpointPayload,
  UpdateCheckpointPayload,
} from "./checkpoints.types";

export const checkpointsKeys = {
  all: ["checkpoints"] as const,
  lists: () => [...checkpointsKeys.all, "list"] as const,
  list: (params: CheckpointsListParams) =>
    [...checkpointsKeys.lists(), params] as const,
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

export function useCheckpoints(params: CheckpointsListParams) {
  return useQuery({
    queryKey: checkpointsKeys.list(params),
    queryFn: () => getCheckpoints(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckpointPayload) => createCheckpoint(payload),

    onSuccess: () => {
      toast.success("تم إضافة نقطة المسح بنجاح");

      queryClient.invalidateQueries({
        queryKey: checkpointsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCheckpointPayload;
    }) => updateCheckpoint(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل نقطة المسح بنجاح");

      queryClient.invalidateQueries({
        queryKey: checkpointsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCheckpoint(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف نقطة المسح بنجاح");

      queryClient.setQueriesData<CheckpointsListResponse>(
        {
          queryKey: checkpointsKeys.lists(),
        },
        (oldData) => {
          if (!oldData) return oldData;

          const nextItems = oldData.items.filter(
            (checkpoint) => checkpoint.id !== id,
          );

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
        queryKey: checkpointsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
