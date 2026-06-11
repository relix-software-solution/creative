import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createRegistrationQrImage,
  generateRegistrationQr,
  getRegistrationQr,
  revokeRegistrationQr,
  validateQr,
} from "./qr.api";
import { ValidateQrPayload } from "./qr.types";

export const qrKeys = {
  all: ["qr"] as const,
  registration: (registrationId: string) =>
    [...qrKeys.all, "registration", registrationId] as const,
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

export function useRegistrationQr(registrationId: string) {
  return useQuery({
    queryKey: qrKeys.registration(registrationId),
    queryFn: () => getRegistrationQr(registrationId),
    enabled: Boolean(registrationId),
  });
}

export function useGenerateRegistrationQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      generateRegistrationQr(registrationId),

    onSuccess: (data) => {
      toast.success("تم توليد QR بنجاح");

      if (data.registrationId) {
        queryClient.invalidateQueries({
          queryKey: qrKeys.registration(data.registrationId),
        });
      }
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

      if (data.registrationId) {
        queryClient.invalidateQueries({
          queryKey: qrKeys.registration(data.registrationId),
        });
      }
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

      if (data.registrationId) {
        queryClient.invalidateQueries({
          queryKey: qrKeys.registration(data.registrationId),
        });
      }
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
      if (
        data.valid === true ||
        data.allowed === true ||
        data.success === true ||
        data.decision === "ALLOWED"
      ) {
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
