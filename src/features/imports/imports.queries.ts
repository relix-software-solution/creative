import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRegistrationsImport,
  getImportJob,
  getImportRows,
  getImports,
  previewRegistrationsImport,
} from "./imports.api";
import {
  CreateRegistrationsImportPayload,
  ImportRowsListParams,
  ImportsListParams,
  PreviewRegistrationsImportPayload,
} from "./imports.types";

export const importsKeys = {
  all: ["imports"] as const,
  lists: () => [...importsKeys.all, "list"] as const,
  list: (params: ImportsListParams) =>
    [...importsKeys.lists(), params] as const,
  details: () => [...importsKeys.all, "detail"] as const,
  detail: (id: string) => [...importsKeys.details(), id] as const,
  rows: (id: string, params: ImportRowsListParams) =>
    [...importsKeys.detail(id), "rows", params] as const,
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
    if (typeof message === "string" && message.trim()) return message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "حدث خطأ غير متوقع";
}

export function useImports(params: ImportsListParams) {
  return useQuery({
    queryKey: importsKeys.list(params),
    queryFn: () => getImports(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: (query) => {
      const hasRunningJob = query.state.data?.items.some(
        (job) => job.status === "PENDING" || job.status === "PROCESSING",
      );

      return hasRunningJob ? 3000 : false;
    },
  });
}

export function useImportJob(id: string) {
  return useQuery({
    queryKey: importsKeys.detail(id),
    queryFn: () => getImportJob(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (status === "PENDING" || status === "PROCESSING") {
        return 3000;
      }

      return false;
    },
  });
}

export function useImportRows(
  importJobId: string,
  params: ImportRowsListParams,
) {
  return useQuery({
    queryKey: importsKeys.rows(importJobId, params),
    queryFn: () => getImportRows(importJobId, params),
    enabled: Boolean(importJobId),
    placeholderData: (previousData) => previousData,
    refetchInterval: (query) => {
      const hasPendingRows = query.state.data?.items.some(
        (row) => row.status === "PENDING",
      );

      return hasPendingRows ? 3000 : false;
    },
  });
}

export function usePreviewRegistrationsImport() {
  return useMutation({
    mutationFn: (payload: PreviewRegistrationsImportPayload) =>
      previewRegistrationsImport(payload),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreateRegistrationsImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationsImportPayload) =>
      createRegistrationsImport(payload),

    onSuccess: ({ queued }) => {
      toast.success(
        queued
          ? "تم رفع الملف وبدأت المعالجة بالخلفية"
          : "تم رفع الملف ومعالجته",
      );

      queryClient.invalidateQueries({
        queryKey: importsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
