import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  ReportBreakdownItem,
  ReportCheckpointItem,
  ReportDateRangeParams,
  ReportHourItem,
  ReportOverview,
  ReportStaffPerformanceItem,
} from "./reports.types";

function normalizeList<T>(data: unknown): T[] {
  const value = unwrapApiData<T[] | { items?: T[]; data?: T[] }>(data);

  if (Array.isArray(value)) return value;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;

  return [];
}

export async function getEventOverview(eventId: string) {
  const response = await adminClient.get(`/reports/events/${eventId}/overview`);

  return unwrapApiData<ReportOverview>(response.data);
}

export async function getRegistrationsByType(eventId: string) {
  const response = await adminClient.get(
    `/reports/events/${eventId}/registrations-by-type`,
  );

  return normalizeList<ReportBreakdownItem>(response.data);
}

export async function getMovementsByType(eventId: string) {
  const response = await adminClient.get(
    `/reports/events/${eventId}/movements-by-type`,
  );

  return normalizeList<ReportBreakdownItem>(response.data);
}

export async function getMovementsByHour(
  eventId: string,
  params: ReportDateRangeParams = {},
) {
  const response = await adminClient.get(
    `/reports/events/${eventId}/movements-by-hour`,
    {
      params,
    },
  );

  return normalizeList<ReportHourItem>(response.data);
}

export async function getCheckpointsReport(eventId: string) {
  const response = await adminClient.get(
    `/reports/events/${eventId}/checkpoints`,
  );

  return normalizeList<ReportCheckpointItem>(response.data);
}

export async function getStaffPerformanceReport(eventId: string) {
  const response = await adminClient.get(
    `/reports/events/${eventId}/staff-performance`,
  );

  return normalizeList<ReportStaffPerformanceItem>(response.data);
}
