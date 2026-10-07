import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import type {
  AdminSettings,
  UpdateAdminSettingsPayload,
} from "./admin-settings.types";

export async function getAdminSettings() {
  const response = await adminClient.get("/admin/settings");
  return unwrapApiData<AdminSettings>(response.data);
}

export async function updateAdminSettings(payload: UpdateAdminSettingsPayload) {
  const response = await adminClient.patch("/admin/settings", payload);
  return unwrapApiData<AdminSettings>(response.data);
}
