import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { AdminDashboardSummary } from "./admin-dashboard.types";

export async function getAdminDashboardSummary() {
  const response = await adminClient.get("/admin/dashboard/summary");

  return unwrapApiData<AdminDashboardSummary>(response.data);
}
