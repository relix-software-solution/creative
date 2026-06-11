import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  activateRegistration,
  blockRegistration,
  cancelRegistration,
  createRegistration,
  deleteRegistration,
  getRegistrations,
  updateRegistration,
} from "./registrations.api";
import {
  CreateRegistrationPayload,
  Registration,
  RegistrationsListParams,
  RegistrationsListResponse,
  UpdateRegistrationPayload,
} from "./registrations.types";

export const registrationsKeys = {
  all: ["registrations"] as const,
  lists: () => [...registrationsKeys.all, "list"] as const,
  list: (params: RegistrationsListParams) =>
    [...registrationsKeys.lists(), params] as const,
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

function updateRegistrationInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  registration: Registration,
) {
  queryClient.setQueriesData<RegistrationsListResponse>(
    {
      queryKey: registrationsKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((item) =>
          item.id === registration.id ? { ...item, ...registration } : item,
        ),
      };
    },
  );
}

function removeRegistrationFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  queryClient.setQueriesData<RegistrationsListResponse>(
    {
      queryKey: registrationsKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      const nextItems = oldData.items.filter((item) => item.id !== id);
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

function invalidateRegistrations(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: registrationsKeys.lists(),
  });
}

export function useRegistrations(params: RegistrationsListParams) {
  return useQuery({
    queryKey: registrationsKeys.list(params),
    queryFn: () => getRegistrations(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationPayload) =>
      createRegistration(payload),

    onSuccess: () => {
      toast.success("تم إنشاء التسجيل بنجاح");
      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRegistrationPayload;
    }) => updateRegistration(id, payload),

    onSuccess: (registration) => {
      toast.success("تم تعديل التسجيل بنجاح");
      updateRegistrationInLists(queryClient, registration);
      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRegistration(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف التسجيل بنجاح");
      removeRegistrationFromLists(queryClient, id);
      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useActivateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateRegistration(id),

    onSuccess: ({ registration }) => {
      toast.success("تم تفعيل التسجيل بنجاح");

      if (registration) {
        updateRegistrationInLists(queryClient, registration);
      }

      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelRegistration(id),

    onSuccess: ({ registration }) => {
      toast.success("تم إلغاء التسجيل بنجاح");

      if (registration) {
        updateRegistrationInLists(queryClient, registration);
      }

      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useBlockRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blockRegistration(id),

    onSuccess: ({ registration }) => {
      toast.success("تم حظر التسجيل بنجاح");

      if (registration) {
        updateRegistrationInLists(queryClient, registration);
      }

      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
