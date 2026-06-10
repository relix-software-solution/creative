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
  RegistrationsListParams,
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

    onSuccess: () => {
      toast.success("تم تعديل التسجيل بنجاح");
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

    onSuccess: () => {
      toast.success("تم حذف التسجيل بنجاح");
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

    onSuccess: () => {
      toast.success("تم تفعيل التسجيل بنجاح");
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

    onSuccess: () => {
      toast.success("تم إلغاء التسجيل بنجاح");
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

    onSuccess: () => {
      toast.success("تم حظر التسجيل بنجاح");
      invalidateRegistrations(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
