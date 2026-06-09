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

export function useCheckpoints(params: CheckpointsListParams) {
  return useQuery({
    queryKey: checkpointsKeys.list(params),
    queryFn: () => getCheckpoints(params),
  });
}

export function useCreateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckpointPayload) => createCheckpoint(payload),

    onSuccess: () => {
      toast.success("تم إضافة نقطة الدخول بنجاح");
      queryClient.invalidateQueries({ queryKey: checkpointsKeys.lists() });
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
      toast.success("تم تعديل نقطة الدخول بنجاح");
      queryClient.invalidateQueries({ queryKey: checkpointsKeys.lists() });
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

    onSuccess: () => {
      toast.success("تم حذف نقطة الدخول بنجاح");
      queryClient.invalidateQueries({ queryKey: checkpointsKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
