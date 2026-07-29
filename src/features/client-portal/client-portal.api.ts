import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  ClientAnalytics,
  ClientAnalyticsQuery,
  ClientDashboardSummary,
  ClientEventDetails,
  ClientEventsListParams,
  ClientEventsListResponse,
  ClientRegistrationDetails,
  ClientRegistrationExportResult,
  ClientRegistrationsListParams,
  ClientRegistrationsListResponse,
} from "./client-portal.types";

function getDownloadFilename(
  contentDisposition: string | undefined,
  fallback: string,
): string {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
    } catch {
      return utf8Match[1].replace(/["']/g, "");
    }
  }

  const regularMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i,
  );

  return regularMatch?.[1]?.trim() || fallback;
}

export async function getClientDashboardSummary() {
  const response = await adminClient.get("/client/dashboard/summary");

  return unwrapApiData<ClientDashboardSummary>(response.data);
}

export async function getClientEvents(
  params: ClientEventsListParams = {},
) {
  const response = await adminClient.get("/client/events", {
    params,
  });

  return unwrapApiData<ClientEventsListResponse>(response.data);
}

export async function getClientEvent(eventId: string) {
  const response = await adminClient.get(`/client/events/${eventId}`);

  return unwrapApiData<ClientEventDetails>(response.data);
}

export async function getClientRegistrations(
  params: ClientRegistrationsListParams = {},
) {
  const response = await adminClient.get("/client/registrations", {
    params,
  });

  return unwrapApiData<ClientRegistrationsListResponse>(response.data);
}

export async function getClientRegistration(registrationId: string) {
  const response = await adminClient.get(
    `/client/registrations/${registrationId}`,
  );

  return unwrapApiData<ClientRegistrationDetails>(response.data);
}

export async function getClientAnalytics(
  params: ClientAnalyticsQuery = {},
) {
  const response = await adminClient.get("/client/analytics", {
    params,
  });

  return unwrapApiData<ClientAnalytics>(response.data);
}

export async function exportClientRegistrations(
  params: ClientRegistrationsListParams = {},
): Promise<ClientRegistrationExportResult | null> {
  const response = await adminClient.get("/client/registrations/export", {
    params,
    responseType: "blob",
  });

  if (response.status === 204) {
    return null;
  }

  const fallbackFilename = `client-registrations-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  const contentDisposition = response.headers["content-disposition"] as
    | string
    | undefined;

  return {
    blob: response.data as Blob,
    filename: getDownloadFilename(contentDisposition, fallbackFilename),
  };
}
