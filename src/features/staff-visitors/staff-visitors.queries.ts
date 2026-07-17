import { useQuery } from "@tanstack/react-query";
import {
  getStaffVisitors,
  StaffVisitor,
  StaffVisitorBadgeResponse,
  StaffVisitorQrResponse,
  StaffVisitorsParams,
  StaffVisitorsResponse,
} from "./staff-visitors.api";

export type {
  StaffVisitor,
  StaffVisitorBadgeResponse,
  StaffVisitorQrResponse,
  StaffVisitorsParams,
  StaffVisitorsResponse,
};

export const staffVisitorsKeys = {
  all: ["staff-visitors"] as const,
  lists: () => [...staffVisitorsKeys.all, "list"] as const,
  list: (params: StaffVisitorsParams) =>
    [...staffVisitorsKeys.lists(), params] as const,
};

export function useStaffVisitors(
  params: StaffVisitorsParams = {},
  enabled = true,
) {
  return useQuery<StaffVisitorsResponse>({
    queryKey: staffVisitorsKeys.list(params),
    queryFn: () => getStaffVisitors(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
