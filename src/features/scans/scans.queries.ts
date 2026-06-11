import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createScan } from "./scans.api";
import { CreateScanPayload } from "./scans.types";

type CreateScanMutationInput = {
  payload: CreateScanPayload;
  deviceApiKey?: string | null;
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

export function useCreateScan() {
  return useMutation({
    mutationFn: (input: CreateScanMutationInput) => createScan(input),

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
