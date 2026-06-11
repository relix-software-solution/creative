import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateDevicePayload,
  Device,
  DeviceActionResponse,
  DevicesListParams,
  DevicesListResponse,
  DeviceSecretResponse,
  UpdateDevicePayload,
} from "./devices.types";

function shouldShowDevice(device: Device, params: DevicesListParams) {
  if (params.status) return true;

  return device.status !== "REVOKED";
}

function normalizeDevicesList(
  data: unknown,
  params: DevicesListParams,
): DevicesListResponse {
  const value = unwrapApiData<DevicesListResponse | Device[]>(data);

  if (Array.isArray(value)) {
    const items = value.filter((device) => shouldShowDevice(device, params));

    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter((device) =>
    shouldShowDevice(device, params),
  );

  const limit = value.limit ?? 20;
  const total = params.status ? (value.total ?? items.length) : items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

function normalizeDeviceActionResponse(data: unknown, fallbackId: string) {
  const value = unwrapApiData<DeviceActionResponse | Device>(data);

  if (
    value &&
    typeof value === "object" &&
    "device" in value &&
    value.device?.id
  ) {
    return {
      id: value.device.id,
      device: value.device,
    };
  }

  if (value && typeof value === "object" && "id" in value && value.id) {
    return {
      id: value.id,
      device: value as Device,
    };
  }

  return {
    id: fallbackId,
  };
}

export async function getDevices(params: DevicesListParams = {}) {
  const response = await adminClient.get("/devices", {
    params,
  });

  return normalizeDevicesList(response.data, params);
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

  return normalizeDeviceActionResponse(response.data, id);
}

export async function suspendDevice(id: string) {
  const response = await adminClient.post(`/devices/${id}/suspend`);

  return normalizeDeviceActionResponse(response.data, id);
}

export async function revokeDevice(id: string) {
  const response = await adminClient.post(`/devices/${id}/revoke`);

  return normalizeDeviceActionResponse(response.data, id);
}

export async function deleteDevice(id: string) {
  const response = await adminClient.delete(`/devices/${id}`);

  return normalizeDeviceActionResponse(response.data, id);
}
