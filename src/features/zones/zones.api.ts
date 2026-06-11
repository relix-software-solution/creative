import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateZonePayload,
  UpdateZonePayload,
  Zone,
  ZonesListParams,
  ZonesListResponse,
} from "./zones.types";

type DeleteZoneResponse = {
  id?: string;
  message?: string;
  zone?: Zone;
};

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

  const items = value.items ?? [];
  const limit = value.limit ?? 20;
  const total = value.total ?? items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
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

  const data = unwrapApiData<DeleteZoneResponse | Zone>(response.data);

  if (data && typeof data === "object" && "zone" in data && data.zone?.id) {
    return {
      id: data.zone.id,
      zone: data.zone,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      zone: data as Zone,
    };
  }

  return { id };
}
