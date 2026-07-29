import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createClient,
  createClientAccessAccount,
  createClientWithAccessAccount,
  deleteClientPermanently,
  getClientAccessAccount,
  getClients,
  resetClientAccessAccountPassword,
  setClientActiveStatus,
  updateClient,
  updateClientAccessAccount,
} from "./clients.api";
import {
  ClientsListParams,
  ClientsListResponse,
  CreateClientPayload,
  CreateClientWithAccessAccountPayload,
  SaveClientAccessAccountPayload,
  SetClientActiveStatusPayload,
  UpdateClientPayload,
} from "./clients.types";

export const clientsKeys = {
  all: ["clients"] as const,
  lists: () => [...clientsKeys.all, "list"] as const,
  list: (params: ClientsListParams) =>
    [...clientsKeys.lists(), params] as const,
  accessAccounts: () => [...clientsKeys.all, "access-account"] as const,
  accessAccount: (clientId: string) =>
    [...clientsKeys.accessAccounts(), clientId] as const,
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

export function useClients(params: ClientsListParams) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => getClients(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useClientAccessAccount(
  clientId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: clientsKeys.accessAccount(clientId ?? ""),
    queryFn: () => getClientAccessAccount(clientId as string),
    enabled: Boolean(clientId) && enabled,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * محفوظ للتوافق مع أي شاشة قديمة.
 */
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

export function useCreateClientWithAccessAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClientWithAccessAccountPayload) =>
      createClientWithAccessAccount(payload),

    onSuccess: ({ client }) => {
      toast.success("تم إنشاء العميل وحساب الدخول بنجاح");

      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: clientsKeys.accessAccount(client.id),
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
      toast.success("تم تعديل بيانات العميل بنجاح");

      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSaveClientAccessAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      accountExists,
      account,
      newPassword,
    }: SaveClientAccessAccountPayload) => {
      if (!accountExists) {
        if (!newPassword) {
          throw new Error("كلمة المرور مطلوبة لإنشاء حساب الدخول");
        }

        return createClientAccessAccount(clientId, {
          fullName: account.fullName,
          email: account.email,
          phone: account.phone || undefined,
          password: newPassword,
        });
      }

      const updatedAccount = await updateClientAccessAccount(clientId, {
        fullName: account.fullName,
        email: account.email,
        phone: account.phone || null,
      });

      if (newPassword) {
        await resetClientAccessAccountPassword(clientId, newPassword);
      }

      return {
        accessAccount: updatedAccount,
      };
    },

    onSuccess: (_data, variables) => {
      toast.success(
        variables.accountExists
          ? variables.newPassword
            ? "تم تحديث حساب الدخول وكلمة المرور بنجاح"
            : "تم تحديث حساب الدخول بنجاح"
          : "تم إنشاء حساب الدخول للعميل بنجاح",
      );

      queryClient.invalidateQueries({
        queryKey: clientsKeys.accessAccount(variables.clientId),
      });
    },

    onError: (error, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientsKeys.accessAccount(variables.clientId),
      });

      toast.error(getErrorMessage(error));
    },
  });
}

export function useSetClientActiveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: SetClientActiveStatusPayload) =>
      setClientActiveStatus(id, isActive),

    onSuccess: ({ client }) => {
      toast.success(
        client.isActive
          ? "تم تفعيل العميل بنجاح"
          : "تم تعطيل العميل بنجاح",
      );

      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: clientsKeys.accessAccount(client.id),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteClientPermanently() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClientPermanently(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف العميل نهائيًا");

      queryClient.setQueriesData<ClientsListResponse>(
        {
          queryKey: clientsKeys.lists(),
        },
        (oldData) => {
          if (!oldData) return oldData;

          const nextItems = oldData.items.filter(
            (client) => client.id !== id,
          );
          const currentTotal = oldData.total ?? oldData.items.length;
          const nextTotal = Math.max(currentTotal - 1, 0);
          const limit = oldData.limit || 20;

          return {
            ...oldData,
            items: nextItems,
            total: nextTotal,
            totalPages:
              nextTotal === 0 ? 0 : Math.ceil(nextTotal / limit),
          };
        },
      );

      queryClient.removeQueries({
        queryKey: clientsKeys.accessAccount(id),
      });

      queryClient.invalidateQueries({
        queryKey: clientsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
