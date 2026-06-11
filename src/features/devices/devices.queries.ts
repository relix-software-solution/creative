import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  activateDevice,
  createDevice,
  deleteDevice,
  getDevice,
  getDevices,
  revokeDevice,
  rotateDeviceApiKey,
  suspendDevice,
  updateDevice,
} from "./devices.api";
import {
  CreateDevicePayload,
  DevicesListParams,
  UpdateDevicePayload,
} from "./devices.types";

export const devicesKeys = {
  all: ["devices"] as const,
  lists: () => [...devicesKeys.all, "list"] as const,
  list: (params: DevicesListParams) =>
    [...devicesKeys.lists(), params] as const,
  details: () => [...devicesKeys.all, "detail"] as const,
  detail: (id: string) => [...devicesKeys.details(), id] as const,
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

function invalidateDevices(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: devicesKeys.lists(),
  });
}

export function useDevices(params: DevicesListParams = {}) {
  return useQuery({
    queryKey: devicesKeys.list(params),
    queryFn: () => getDevices(params),
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: devicesKeys.detail(id),
    queryFn: () => getDevice(id),
    enabled: Boolean(id),
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => createDevice(payload),

    onSuccess: () => {
      toast.success("تم إنشاء الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDevicePayload;
    }) => updateDevice(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRotateDeviceApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotateDeviceApiKey(id),

    onSuccess: () => {
      toast.success("تم تدوير مفتاح الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useActivateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateDevice(id),

    onSuccess: () => {
      toast.success("تم تفعيل الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSuspendDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendDevice(id),

    onSuccess: () => {
      toast.success("تم إيقاف الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeDevice(id),

    onSuccess: () => {
      toast.success("تم إلغاء الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),

    onSuccess: () => {
      toast.success("تم حذف الجهاز بنجاح");
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
