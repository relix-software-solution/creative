"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  exportClientRegistrations,
  getClientAnalytics,
  getClientDashboardSummary,
  getClientEvent,
  getClientEvents,
  getClientRegistration,
  getClientRegistrations,
} from "./client-portal.api";
import {
  ClientAnalyticsQuery,
  ClientEventsListParams,
  ClientRegistrationsListParams,
} from "./client-portal.types";

export const clientPortalKeys = {
  all: ["client-portal"] as const,

  summary: () => [...clientPortalKeys.all, "summary"] as const,

  events: () => [...clientPortalKeys.all, "events"] as const,
  eventsList: (params: ClientEventsListParams) =>
    [...clientPortalKeys.events(), "list", params] as const,
  event: (eventId: string) =>
    [...clientPortalKeys.events(), "details", eventId] as const,

  registrations: () => [...clientPortalKeys.all, "registrations"] as const,
  registrationsList: (params: ClientRegistrationsListParams) =>
    [...clientPortalKeys.registrations(), "list", params] as const,
  registration: (registrationId: string) =>
    [
      ...clientPortalKeys.registrations(),
      "details",
      registrationId,
    ] as const,

  analytics: (params: ClientAnalyticsQuery) =>
    [...clientPortalKeys.all, "analytics", params] as const,
};

function getErrorMessage(error: unknown): string {
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

function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1_000);
}

export function useClientDashboardSummary() {
  return useQuery({
    queryKey: clientPortalKeys.summary(),
    queryFn: getClientDashboardSummary,
  });
}

export function useClientEvents(
  params: ClientEventsListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: clientPortalKeys.eventsList(params),
    queryFn: () => getClientEvents(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useClientEvent(eventId: string, enabled = true) {
  return useQuery({
    queryKey: clientPortalKeys.event(eventId),
    queryFn: () => getClientEvent(eventId),
    enabled: enabled && Boolean(eventId),
  });
}

export function useClientRegistrations(
  params: ClientRegistrationsListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: clientPortalKeys.registrationsList(params),
    queryFn: () => getClientRegistrations(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useClientRegistration(
  registrationId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: clientPortalKeys.registration(registrationId),
    queryFn: () => getClientRegistration(registrationId),
    enabled: enabled && Boolean(registrationId),
  });
}

export function useClientAnalytics(
  params: ClientAnalyticsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: clientPortalKeys.analytics(params),
    queryFn: () => getClientAnalytics(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useExportClientRegistrations() {
  return useMutation({
    mutationFn: (params: ClientRegistrationsListParams) =>
      exportClientRegistrations(params),

    onSuccess: (result) => {
      if (!result) {
        toast.info("لا توجد تسجيلات مطابقة للتصدير");
        return;
      }

      downloadBlob(result.blob, result.filename);
      toast.success("تم تجهيز ملف Excel بنجاح");
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
