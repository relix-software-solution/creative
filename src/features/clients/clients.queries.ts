import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "./clients.api";
import {
  ClientsListParams,
  CreateClientPayload,
  UpdateClientPayload,
} from "./clients.types";

export const clientsKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsKeys.all, "list"] as const,
  list: (params: ClientsListParams) =>
    [...clientsKeys.lists(), params] as const,
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

  return "حدث خطأ غير متوقع";
}

export function useClients(params: ClientsListParams) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => getClients(params),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClient(payload),

    onSuccess: () => {
      toast.success("تم إضافة العميل بنجاح");
      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateClientPayload;
    }) => updateClient(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل العميل بنجاح");
      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),

    onSuccess: () => {
      toast.success("تم حذف العميل بنجاح");
      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
