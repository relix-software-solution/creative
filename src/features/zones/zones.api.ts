import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateZonePayload,
  UpdateZonePayload,
  Zone,
  ZonesListParams,
  ZonesListResponse,
} from "./zones.types";

function normalizeZonesList(data: unknown): ZonesListResponse {
  const value = unwrapApiData<ZonesListResponse | Zone[]>(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length,
      totalPages: 1,
    };
  }

  return {
    items: value.items ?? [],
    total: value.total,
    page: value.page,
    limit: value.limit,
    totalPages: value.totalPages,
  };
}

export async function getZones(params: ZonesListParams) {
  const response = await adminClient.get("/zones", {
    params,
  });

  return normalizeZonesList(response.data);
}

export async function getZone(id: string) {
  const response = await adminClient.get(`/zones/${id}`);
  return unwrapApiData<Zone>(response.data);
}

export async function createZone(payload: CreateZonePayload) {
  const response = await adminClient.post("/zones", payload);
  return unwrapApiData<Zone>(response.data);
}

export async function updateZone(id: string, payload: UpdateZonePayload) {
  const response = await adminClient.patch(`/zones/${id}`, payload);
  return unwrapApiData<Zone>(response.data);
}

export async function deleteZone(id: string) {
  const response = await adminClient.delete(`/zones/${id}`);
  return unwrapApiData<Zone>(response.data);
}
