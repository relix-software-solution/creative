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
  Device,
  DevicesListParams,
  DevicesListResponse,
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

function invalidateDevices(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: devicesKeys.lists(),
  });
}

function updateDeviceInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  device: Device,
) {
  queryClient.setQueriesData<DevicesListResponse>(
    {
      queryKey: devicesKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((item) =>
          item.id === device.id ? { ...item, ...device } : item,
        ),
      };
    },
  );
}

function removeDeviceFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  queryClient.setQueriesData<DevicesListResponse>(
    {
      queryKey: devicesKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      const nextItems = oldData.items.filter((device) => device.id !== id);
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
}

export function useDevices(params: DevicesListParams = {}) {
  return useQuery({
    queryKey: devicesKeys.list(params),
    queryFn: () => getDevices(params),
    placeholderData: (previousData) => previousData,
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

    onSuccess: (device) => {
      toast.success("تم تعديل الجهاز بنجاح");
      updateDeviceInLists(queryClient, device);
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

    onSuccess: (response) => {
      toast.success("تم تدوير مفتاح الجهاز بنجاح");
      updateDeviceInLists(queryClient, response.device);
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

    onSuccess: ({ device }) => {
      toast.success("تم تفعيل الجهاز بنجاح");

      if (device) {
        updateDeviceInLists(queryClient, device);
      }

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

    onSuccess: ({ device }) => {
      toast.success("تم إيقاف الجهاز بنجاح");

      if (device) {
        updateDeviceInLists(queryClient, device);
      }

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

    onSuccess: ({ id, device }) => {
      toast.success("تم إلغاء الجهاز بنجاح");

      if (device?.status === "REVOKED") {
        removeDeviceFromLists(queryClient, id);
      } else if (device) {
        updateDeviceInLists(queryClient, device);
      } else {
        removeDeviceFromLists(queryClient, id);
      }

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

    onSuccess: ({ id }) => {
      toast.success("تم حذف الجهاز بنجاح");
      removeDeviceFromLists(queryClient, id);
      invalidateDevices(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
