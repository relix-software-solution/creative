import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { CreateScanPayload, ScanResult } from "./scans.types";

export type CreateScanInput = {
  payload: CreateScanPayload;
  deviceApiKey?: string | null;
};

function toDeviceScanPayload(payload: CreateScanPayload) {
  return {
    operationId: payload.operationId,

    eventId: payload.eventId,
    staffSessionId: payload.staffSessionId,
    checkpointId: payload.checkpointId,

    qrToken: payload.qrToken,
    registrationId: payload.registrationId ?? undefined,

    type: payload.type,
    scannedAtDevice: payload.scannedAtDevice,

    payload: payload.payload,
  };
}

function assertRequiredPayload(payload: CreateScanPayload) {
  const requiredValues: Array<[string, unknown]> = [
    ["operationId", payload.operationId],
    ["eventId", payload.eventId],
    ["deviceId", payload.deviceId],
    ["staffSessionId", payload.staffSessionId],
    ["checkpointId", payload.checkpointId],
    ["qrToken", payload.qrToken],
    ["type", payload.type],
    ["scannedAtDevice", payload.scannedAtDevice],
  ];

  for (const [field, value] of requiredValues) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${field} is required`);
    }
  }
}

export async function createScan(input: CreateScanInput) {
  const { payload } = input;

  assertRequiredPayload(payload);

  const deviceApiKey = input.deviceApiKey?.trim();

  if (deviceApiKey) {
    const response = await adminClient.post(
      "/device/scans",
      toDeviceScanPayload(payload),
      {
        headers: {
          "X-Device-Api-Key": deviceApiKey,
        },
      },
    );

    return unwrapApiData<ScanResult>(response.data);
  }

  const response = await adminClient.post("/scans", {
    operationId: payload.operationId,

    eventId: payload.eventId,
    deviceId: payload.deviceId,
    staffSessionId: payload.staffSessionId,
    checkpointId: payload.checkpointId,

    qrToken: payload.qrToken,
    registrationId: payload.registrationId ?? undefined,

    type: payload.type,
    scannedAtDevice: payload.scannedAtDevice,

    payload: payload.payload,
  });

  return unwrapApiData<ScanResult>(response.data);
}
