import { useQuery } from "@tanstack/react-query";
import {
  getCheckpointsReport,
  getEventOverview,
  getMovementsByHour,
  getMovementsByType,
  getRegistrationsByType,
  getStaffPerformanceReport,
} from "./reports.api";
import { ReportDateRangeParams } from "./reports.types";

export const reportsKeys = {
  all: ["reports"] as const,

  event: (eventId: string) => [...reportsKeys.all, "event", eventId] as const,

  overview: (eventId: string) =>
    [...reportsKeys.event(eventId), "overview"] as const,

  registrationsByType: (eventId: string) =>
    [...reportsKeys.event(eventId), "registrations-by-type"] as const,

  movementsByType: (eventId: string) =>
    [...reportsKeys.event(eventId), "movements-by-type"] as const,

  movementsByHour: (eventId: string, params: ReportDateRangeParams) =>
    [...reportsKeys.event(eventId), "movements-by-hour", params] as const,

  checkpoints: (eventId: string) =>
    [...reportsKeys.event(eventId), "checkpoints"] as const,

  staffPerformance: (eventId: string) =>
    [...reportsKeys.event(eventId), "staff-performance"] as const,
};

export function useEventOverview(eventId: string) {
  return useQuery({
    queryKey: reportsKeys.overview(eventId),
    queryFn: () => getEventOverview(eventId),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}

export function useRegistrationsByType(eventId: string) {
  return useQuery({
    queryKey: reportsKeys.registrationsByType(eventId),
    queryFn: () => getRegistrationsByType(eventId),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}

export function useMovementsByType(eventId: string) {
  return useQuery({
    queryKey: reportsKeys.movementsByType(eventId),
    queryFn: () => getMovementsByType(eventId),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}

export function useMovementsByHour(
  eventId: string,
  params: ReportDateRangeParams,
) {
  return useQuery({
    queryKey: reportsKeys.movementsByHour(eventId, params),
    queryFn: () => getMovementsByHour(eventId, params),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}

export function useCheckpointsReport(eventId: string) {
  return useQuery({
    queryKey: reportsKeys.checkpoints(eventId),
    queryFn: () => getCheckpointsReport(eventId),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}

export function useStaffPerformanceReport(eventId: string) {
  return useQuery({
    queryKey: reportsKeys.staffPerformance(eventId),
    queryFn: () => getStaffPerformanceReport(eventId),
    enabled: Boolean(eventId),
    placeholderData: (previousData) => previousData,
  });
}
