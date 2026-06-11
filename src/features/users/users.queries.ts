import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  activateUser,
  createUser,
  deleteUser,
  getUsers,
  resetUserPassword,
  suspendUser,
  updateUser,
} from "./users.api";
import {
  CreateUserPayload,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  UsersListParams,
} from "./users.types";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
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

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: usersKeys.lists(),
  });
}

export function useUsers(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),

    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل المستخدم بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateUser(id),

    onSuccess: () => {
      toast.success("تم تفعيل المستخدم بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendUser(id),

    onSuccess: () => {
      toast.success("تم إيقاف المستخدم بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ResetUserPasswordPayload;
    }) => resetUserPassword(id, payload),

    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),

    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
