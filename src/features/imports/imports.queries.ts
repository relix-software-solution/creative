import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRegistrationsImport,
  getImportJob,
  getImportRows,
  getImports,
} from "./imports.api";
import {
  CreateRegistrationsImportPayload,
  ImportRowsListParams,
  ImportsListParams,
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
    if (typeof message === "string") return message;
  }

  return "حدث خطأ غير متوقع";
}

export function useImports(params: ImportsListParams) {
  return useQuery({
    queryKey: importsKeys.list(params),
    queryFn: () => getImports(params),
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
  });
}

export function useCreateRegistrationsImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationsImportPayload) =>
      createRegistrationsImport(payload),

    onSuccess: () => {
      toast.success("تم رفع ملف التسجيلات وبدء عملية الاستيراد");
      queryClient.invalidateQueries({
        queryKey: importsKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
