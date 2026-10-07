import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardSummary } from "./admin-dashboard.api";

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
  summary: () => [...adminDashboardKeys.all, "summary"] as const,
};

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: adminDashboardKeys.summary(),
    queryFn: getAdminDashboardSummary,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
