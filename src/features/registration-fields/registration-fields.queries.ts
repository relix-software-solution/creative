import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRegistrationField,
  deleteRegistrationField,
  getRegistrationFields,
  updateRegistrationField,
} from "./registration-fields.api";
import {
  CreateRegistrationFieldPayload,
  RegistrationFieldsListParams,
  RegistrationFieldsListResponse,
  UpdateRegistrationFieldPayload,
} from "./registration-fields.types";

export const registrationFieldsKeys = {
  all: ["registration-fields"] as const,
  lists: () => [...registrationFieldsKeys.all, "list"] as const,
  list: (params: RegistrationFieldsListParams) =>
    [...registrationFieldsKeys.lists(), params] as const,
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

export function useRegistrationFields(params: RegistrationFieldsListParams) {
  return useQuery({
    queryKey: registrationFieldsKeys.list(params),
    queryFn: () => getRegistrationFields(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateRegistrationField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationFieldPayload) =>
      createRegistrationField(payload),

    onSuccess: () => {
      toast.success("تم إضافة حقل التسجيل بنجاح");

      queryClient.invalidateQueries({
        queryKey: registrationFieldsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateRegistrationField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRegistrationFieldPayload;
    }) => updateRegistrationField(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل حقل التسجيل بنجاح");

      queryClient.invalidateQueries({
        queryKey: registrationFieldsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteRegistrationField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRegistrationField(id),

    onSuccess: ({ id }) => {
      toast.success("تم حذف حقل التسجيل بنجاح");

      queryClient.setQueriesData<RegistrationFieldsListResponse>(
        {
          queryKey: registrationFieldsKeys.lists(),
        },
        (oldData) => {
          if (!oldData) return oldData;

          const nextItems = oldData.items.filter((field) => field.id !== id);
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
        queryKey: registrationFieldsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
