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
  User,
  UsersListParams,
  UsersListResponse,
} from "./users.types";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...usersKeys.lists(), params] as const,
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

    if (Array.isArray(message)) return message[0] ?? "حدث خطأ غير متوقع";
    if (typeof message === "string") return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return "حدث خطأ غير متوقع";
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: usersKeys.lists(),
  });
}

function updateUserInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  user: User,
) {
  queryClient.setQueriesData<UsersListResponse>(
    {
      queryKey: usersKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((item) =>
          item.id === user.id ? { ...item, ...user } : item,
        ),
      };
    },
  );
}

function removeUserFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  queryClient.setQueriesData<UsersListResponse>(
    {
      queryKey: usersKeys.lists(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      const nextItems = oldData.items.filter((user) => user.id !== id);
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

export function useUsers(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
    placeholderData: (previousData) => previousData,
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

    onSuccess: (user) => {
      toast.success("تم تعديل المستخدم بنجاح");
      updateUserInLists(queryClient, user);
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

    onSuccess: ({ user }) => {
      toast.success("تم تفعيل المستخدم بنجاح");

      if (user) {
        updateUserInLists(queryClient, user);
      }

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

    onSuccess: ({ user }) => {
      toast.success("تم إيقاف المستخدم بنجاح");

      if (user) {
        updateUserInLists(queryClient, user);
      }

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

    onSuccess: ({ id, user }) => {
      toast.success("تم حذف المستخدم بنجاح");

      if (user?.status === "DELETED" || user?.deletedAt) {
        removeUserFromLists(queryClient, id);
      } else if (user) {
        updateUserInLists(queryClient, user);
      } else {
        removeUserFromLists(queryClient, id);
      }

      invalidateUsers(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
