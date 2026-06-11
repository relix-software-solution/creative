import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateDevicePayload,
  Device,
  DevicesListParams,
  DevicesListResponse,
  DeviceSecretResponse,
  UpdateDevicePayload,
} from "./devices.types";

function normalizeDevicesList(data: unknown): DevicesListResponse {
  const value = unwrapApiData<DevicesListResponse | Device[]>(data);

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

export async function getDevices(params: DevicesListParams = {}) {
  const response = await adminClient.get("/devices", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      eventId: params.eventId || undefined,
      status: params.status || undefined,
    },
  });

  return normalizeDevicesList(response.data);
}

export async function getDevice(id: string) {
  const response = await adminClient.get(`/devices/${id}`);
  return unwrapApiData<Device>(response.data);
}

export async function createDevice(payload: CreateDevicePayload) {
  const response = await adminClient.post("/devices", payload);
  return unwrapApiData<DeviceSecretResponse>(response.data);
}

export async function updateDevice(id: string, payload: UpdateDevicePayload) {
  const response = await adminClient.patch(`/devices/${id}`, payload);
  return unwrapApiData<Device>(response.data);
}

export async function rotateDeviceApiKey(id: string) {
  const response = await adminClient.post(`/devices/${id}/rotate-api-key`);
  return unwrapApiData<DeviceSecretResponse>(response.data);
}

export async function activateDevice(id: string) {
  const response = await adminClient.post(`/devices/${id}/activate`);
  return unwrapApiData<Device>(response.data);
}

export async function suspendDevice(id: string) {
  const response = await adminClient.post(`/devices/${id}/suspend`);
  return unwrapApiData<Device>(response.data);
}

export async function revokeDevice(id: string) {
  const response = await adminClient.post(`/devices/${id}/revoke`);
  return unwrapApiData<Device>(response.data);
}

export async function deleteDevice(id: string) {
  const response = await adminClient.delete(`/devices/${id}`);
  return unwrapApiData<Device>(response.data);
}
