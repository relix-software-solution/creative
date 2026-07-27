import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaffAssignment,
  deleteStaffAssignment,
  endStaffSession,
  getMyStaffAssignment,
  getStaffAssignments,
  startMyStaffSession,
} from "./staff.api";
import {
  CreateStaffAssignmentPayload,
  StaffAssignmentsListParams,
} from "./staff.types";

export const staffKeys = {
  all: ["staff"] as const,

  assignments: () => [...staffKeys.all, "assignments"] as const,
  assignmentsList: (params: StaffAssignmentsListParams) =>
    [...staffKeys.assignments(), params] as const,

  myAssignment: () => [...staffKeys.all, "my-assignment"] as const,
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

export function useStaffAssignments(params: StaffAssignmentsListParams = {}) {
  return useQuery({
    queryKey: staffKeys.assignmentsList(params),
    queryFn: () => getStaffAssignments(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffAssignmentPayload) =>
      createStaffAssignment(payload),

    onSuccess: () => {
      toast.success("تم إنشاء تكليف الموظف بنجاح");

      queryClient.invalidateQueries({
        queryKey: staffKeys.assignments(),
      });
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

      queryClient.invalidateQueries({
        queryKey: staffKeys.assignments(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useMyStaffAssignment(enabled = true) {
  return useQuery({
    queryKey: staffKeys.myAssignment(),
    queryFn: getMyStaffAssignment,

    enabled,

    retry: false,

    /*
     * لا نعيد الطلب لمجرد التركيز على الصفحة.
     */
    refetchOnWindowFocus: false,

    /*
     * عند رجوع الإنترنت تستطيع الصفحة إعادة تفعيل الاستعلام.
     */
    refetchOnReconnect: true,

    networkMode: "online",
  });
}

export function useStartMyStaffSession() {
  return useMutation({
    mutationFn: startMyStaffSession,

    onSuccess: () => {
      toast.success("تم تجهيز جلسة السكانر");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useEndStaffSession() {
  return useMutation({
    mutationFn: (id: string) => endStaffSession(id),

    onSuccess: () => {
      toast.success("تم إنهاء الجلسة بنجاح");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
