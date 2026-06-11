import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaffAssignment,
  deleteStaffAssignment,
  endStaffSession,
  getStaffSession,
  getStaffSessions,
  getStaffAssignments,
  startStaffSession,
} from "./staff-ops.api";
import {
  CreateStaffAssignmentPayload,
  StaffAssignmentsListParams,
  StaffSessionsListParams,
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

export function useStaffAssignments(params: StaffAssignmentsListParams = {}) {
  return useQuery({
    queryKey: staffOpsKeys.assignmentsList(params),
    queryFn: () => getStaffAssignments(params),
  });
}

export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffAssignmentPayload) =>
      createStaffAssignment(payload),

    onSuccess: () => {
      toast.success("تم إنشاء تكليف الموظف بنجاح");
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

    onSuccess: () => {
      toast.success("تم تعطيل التكليف بنجاح");
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

    onSuccess: () => {
      toast.success("تم إنهاء جلسة الموظف بنجاح");
      invalidateSessions(queryClient);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
