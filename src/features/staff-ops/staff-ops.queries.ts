import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaffAssignment,
  deleteStaffAssignment,
  endStaffSession,
  getStaffAssignments,
  getStaffSession,
  getStaffSessions,
  startStaffSession,
} from "./staff-ops.api";
import {
  CreateStaffAssignmentPayload,
  StaffAssignment,
  StaffAssignmentsListParams,
  StaffAssignmentsListResponse,
  StaffSessionsListParams,
  StaffSession,
  StaffSessionsListResponse,
  StartStaffSessionPayload,
} from "./staff-ops.types";

export const staffOpsKeys = {
  all: ["staff-ops"] as const,

  assignments: () => [...staffOpsKeys.all, "assignments"] as const,
  assignmentsList: (params: StaffAssignmentsListParams) =>
    [...staffOpsKeys.assignments(), params] as const,

  sessions: () => [...staffOpsKeys.all, "sessions"] as const,
  sessionsList: (params: StaffSessionsListParams) =>
    [...staffOpsKeys.sessions(), params] as const,
  sessionDetail: (id: string) =>
    [...staffOpsKeys.sessions(), "detail", id] as const,
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

function invalidateAssignments(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: staffOpsKeys.assignments(),
  });
}

function invalidateSessions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: staffOpsKeys.sessions(),
  });
}

function removeAssignmentFromLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  queryClient.setQueriesData<StaffAssignmentsListResponse>(
    {
      queryKey: staffOpsKeys.assignments(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      const nextItems = oldData.items.filter(
        (assignment) => assignment.id !== id,
      );
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

function updateAssignmentInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  assignment: StaffAssignment,
) {
  queryClient.setQueriesData<StaffAssignmentsListResponse>(
    {
      queryKey: staffOpsKeys.assignments(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((item) =>
          item.id === assignment.id ? { ...item, ...assignment } : item,
        ),
      };
    },
  );
}

function updateSessionInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  session: StaffSession,
) {
  queryClient.setQueriesData<StaffSessionsListResponse>(
    {
      queryKey: staffOpsKeys.sessions(),
    },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: oldData.items.map((item) =>
          item.id === session.id ? { ...item, ...session } : item,
        ),
      };
    },
  );
}

export function useStaffAssignments(params: StaffAssignmentsListParams = {}) {
  return useQuery({
    queryKey: staffOpsKeys.assignmentsList(params),
    queryFn: () => getStaffAssignments(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffAssignmentPayload) =>
      createStaffAssignment(payload),

    onSuccess: (assignment) => {
      toast.success("تم إنشاء تكليف الموظف بنجاح");
      updateAssignmentInLists(queryClient, assignment);
      invalidateAssignments(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStaffAssignment(id),

    onSuccess: ({ id }) => {
      toast.success("تم تعطيل التكليف بنجاح");
      removeAssignmentFromLists(queryClient, id);
      invalidateAssignments(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useStaffSessions(params: StaffSessionsListParams = {}) {
  return useQuery({
    queryKey: staffOpsKeys.sessionsList(params),
    queryFn: () => getStaffSessions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useStaffSession(id: string) {
  return useQuery({
    queryKey: staffOpsKeys.sessionDetail(id),
    queryFn: () => getStaffSession(id),
    enabled: Boolean(id),
  });
}

export function useStartStaffSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartStaffSessionPayload) =>
      startStaffSession(payload),

    onSuccess: () => {
      toast.success("تم بدء جلسة الموظف بنجاح");
      invalidateSessions(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useEndStaffSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => endStaffSession(id),

    onSuccess: (session) => {
      toast.success("تم إنهاء جلسة الموظف بنجاح");
      updateSessionInLists(queryClient, session);
      invalidateSessions(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
