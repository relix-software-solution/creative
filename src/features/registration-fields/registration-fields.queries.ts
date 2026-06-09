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

export function useRegistrationFields(params: RegistrationFieldsListParams) {
  return useQuery({
    queryKey: registrationFieldsKeys.list(params),
    queryFn: () => getRegistrationFields(params),
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

    onSuccess: () => {
      toast.success("تم حذف حقل التسجيل بنجاح");
      queryClient.invalidateQueries({
        queryKey: registrationFieldsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
