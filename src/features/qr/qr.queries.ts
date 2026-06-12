import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRegistrationQrImage,
  generateRegistrationQr,
  getRegistrationQr,
  revokeRegistrationQr,
  validateQr,
} from "./qr.api";
import { QrResponse, ValidateQrPayload } from "./qr.types";

export const qrKeys = {
  all: ["qr"] as const,
  registration: (registrationId: string) =>
    [...qrKeys.all, "registration", registrationId] as const,
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

function getRegistrationId(data: QrResponse) {
  return data.registrationId || data.qr?.registrationId || "";
}

function updateQrCache(
  queryClient: ReturnType<typeof useQueryClient>,
  data: QrResponse,
) {
  const registrationId = getRegistrationId(data);

  if (!registrationId) return;

  queryClient.setQueryData(qrKeys.registration(registrationId), data);

  queryClient.invalidateQueries({
    queryKey: qrKeys.registration(registrationId),
  });
}

export function useRegistrationQr(registrationId: string) {
  return useQuery({
    queryKey: qrKeys.registration(registrationId),
    queryFn: () => getRegistrationQr(registrationId),
    enabled: Boolean(registrationId),
    retry: false,
  });
}

export function useGenerateRegistrationQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      generateRegistrationQr(registrationId),

    onSuccess: (data) => {
      toast.success("تم توليد QR بنجاح");
      updateQrCache(queryClient, data);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreateRegistrationQrImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      createRegistrationQrImage(registrationId),

    onSuccess: (data) => {
      toast.success("تم إنشاء صورة QR بنجاح");
      updateQrCache(queryClient, data);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRevokeRegistrationQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      revokeRegistrationQr(registrationId),

    onSuccess: (data) => {
      toast.success("تم إلغاء QR بنجاح");
      updateQrCache(queryClient, data);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useValidateQr() {
  return useMutation({
    mutationFn: (payload: ValidateQrPayload) => validateQr(payload),

    onSuccess: (data) => {
      const isValid =
        data.valid === true ||
        data.allowed === true ||
        data.success === true ||
        data.decision === "ALLOWED";

      if (isValid) {
        toast.success(data.message || "QR صالح");
        return;
      }

      toast.error(data.message || data.reason || "QR غير صالح");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
