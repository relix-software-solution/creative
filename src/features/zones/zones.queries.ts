import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createZone, deleteZone, getZones, updateZone } from "./zones.api";
import {
  CreateZonePayload,
  UpdateZonePayload,
  ZonesListParams,
} from "./zones.types";

export const zonesKeys = {
  all: ["zones"] as const,
  lists: () => [...zonesKeys.all, "list"] as const,
  list: (params: ZonesListParams) => [...zonesKeys.lists(), params] as const,
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

export function useZones(params: ZonesListParams) {
  return useQuery({
    queryKey: zonesKeys.list(params),
    queryFn: () => getZones(params),
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateZonePayload) => createZone(payload),

    onSuccess: () => {
      toast.success("تم إضافة المنطقة بنجاح");
      queryClient.invalidateQueries({ queryKey: zonesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateZonePayload }) =>
      updateZone(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل المنطقة بنجاح");
      queryClient.invalidateQueries({ queryKey: zonesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteZone(id),

    onSuccess: () => {
      toast.success("تم حذف المنطقة بنجاح");
      queryClient.invalidateQueries({ queryKey: zonesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
