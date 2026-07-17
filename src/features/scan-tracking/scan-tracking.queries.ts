import { useQuery } from "@tanstack/react-query";
import { getScanTrackingList } from "./scan-tracking.api";
import {
  ScanTrackingItem,
  ScanTrackingListParams,
  ScanTrackingListResponse,
} from "./scan-tracking.types";

export type {
  ScanTrackingItem,
  ScanTrackingListParams,
  ScanTrackingListResponse,
};

export const scanTrackingKeys = {
  all: ["scan-tracking"] as const,
  lists: () => [...scanTrackingKeys.all, "list"] as const,
  list: (params: ScanTrackingListParams) =>
    [...scanTrackingKeys.lists(), params] as const,
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
