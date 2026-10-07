import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import type {
  NotificationLogsParams,
  NotificationLogsResponse,
  NotificationSummary,
  NotificationSummaryParams,
  NotificationTemplatesParams,
  NotificationTemplatesResponse,
} from "./notification-center.types";

function normalizeLogsResponse(data: unknown): NotificationLogsResponse {
  const value = unwrapApiData<
    NotificationLogsResponse & { pages?: number }
  >(data);
  const total = value.total ?? value.items?.length ?? 0;
  const limit = value.limit ?? 20;
  const page = value.page ?? 1;

  return {
    items: value.items ?? [],
    total,
    limit,
    page,
    totalPages:
      value.totalPages ?? value.pages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

function normalizeTemplatesResponse(data: unknown): NotificationTemplatesResponse {
  const value = unwrapApiData<
    NotificationTemplatesResponse & { pages?: number }
  >(data);
  const total = value.total ?? value.items?.length ?? 0;
  const limit = value.limit ?? 20;
  const page = value.page ?? 1;

  return {
    items: value.items ?? [],
    total,
    limit,
    page,
    totalPages:
      value.totalPages ?? value.pages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

export async function getNotificationSummary(params: NotificationSummaryParams = {}) {
  const response = await adminClient.get("/notifications/summary", { params });
  return unwrapApiData<NotificationSummary>(response.data);
}

export async function getNotificationLogs(params: NotificationLogsParams = {}) {
  const response = await adminClient.get("/notifications/logs", { params });
  return normalizeLogsResponse(response.data);
}

export async function retryNotificationLog(id: string) {
  const response = await adminClient.post(`/notifications/logs/${id}/retry`);
  return unwrapApiData<{ queued: boolean; logId: string; jobId?: string }>(response.data);
}

export async function retryFailedNotifications(payload: { sinceMinutes?: number; limit?: number }) {
  const response = await adminClient.post("/notifications/retry-failed", payload);
  return unwrapApiData<{ queued: number; logIds: string[] }>(response.data);
}

export async function getNotificationTemplates(params: NotificationTemplatesParams = {}) {
  const response = await adminClient.get("/notifications/templates", { params });
  return normalizeTemplatesResponse(response.data);
}

export async function setNotificationTemplateActive(templateId: string, isActive: boolean) {
  const response = await adminClient.patch(`/notifications/templates/${templateId}`, { isActive });
  return unwrapApiData(response.data);
}
