import { useQuery } from "@tanstack/react-query";
import {
  getScanTrackingFilters,
  getScanTrackingList,
  getVisitorScanTracking,
  getVisitorScanTrackingDetail,
} from "./scan-tracking.api";
import {
  ScanTrackingItem,
  ScanTrackingListParams,
  ScanTrackingListResponse,
  VisitorScanTrackingParams,
} from "./scan-tracking.types";

export type {
  ScanTrackingItem,
  ScanTrackingListParams,
  ScanTrackingListResponse,
  VisitorPresenceState,
  VisitorScanResult,
  VisitorScanTrackingDetail,
  VisitorScanTrackingParams,
  VisitorScanTrackingResponse,
  VisitorScanTrackingRow,
  VisitorScanTrackingSummary,
  VisitorScanTimelineItem,
} from "./scan-tracking.types";

export const scanTrackingKeys = {
  all: ["scan-tracking"] as const,
  lists: () => [...scanTrackingKeys.all, "legacy-list"] as const,
  list: (params: ScanTrackingListParams) =>
    [...scanTrackingKeys.lists(), params] as const,
  visitors: () => [...scanTrackingKeys.all, "visitors"] as const,
  visitorList: (params: VisitorScanTrackingParams) =>
    [...scanTrackingKeys.visitors(), "list", params] as const,
  visitorDetail: (registrationId: string, params: VisitorScanTrackingParams) =>
    [...scanTrackingKeys.visitors(), "detail", registrationId, params] as const,
  filters: () => [...scanTrackingKeys.all, "filters"] as const,
};

export function useScanTrackingList(
  params: ScanTrackingListParams = {},
  enabled = true,
) {
  return useQuery<ScanTrackingListResponse>({
    queryKey: scanTrackingKeys.list(params),
    queryFn: () => getScanTrackingList(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useVisitorScanTracking(
  params: VisitorScanTrackingParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: scanTrackingKeys.visitorList(params),
    queryFn: () => getVisitorScanTracking(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useVisitorScanTrackingDetail(
  registrationId: string,
  params: VisitorScanTrackingParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: scanTrackingKeys.visitorDetail(registrationId, params),
    queryFn: () => getVisitorScanTrackingDetail(registrationId, params),
    enabled: enabled && Boolean(registrationId),
  });
}

export function useScanTrackingFilters() {
  return useQuery({
    queryKey: scanTrackingKeys.filters(),
    queryFn: getScanTrackingFilters,
    staleTime: 60_000,
  });
}
