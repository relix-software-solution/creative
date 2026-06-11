import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { CreateScanPayload, ScanResult } from "./scans.types";

type CreateScanInput = {
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
    type: payload.type,
    scannedAtDevice: payload.scannedAtDevice,
    payload: payload.payload,
  };
}

export async function createScan(input: CreateScanInput) {
  const { payload, deviceApiKey } = input;

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

  const response = await adminClient.post("/scans", payload);

  return unwrapApiData<ScanResult>(response.data);
}
