import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { QrResponse, ValidateQrPayload, ValidateQrResponse } from "./qr.types";

export async function generateRegistrationQr(registrationId: string) {
  const response = await adminClient.post(
    `/qr/registrations/${registrationId}/generate`,
  );

  return unwrapApiData<QrResponse>(response.data);
}

export async function getRegistrationQr(registrationId: string) {
  const response = await adminClient.get(`/qr/registrations/${registrationId}`);

  return unwrapApiData<QrResponse>(response.data);
}

export async function createRegistrationQrImage(registrationId: string) {
  const response = await adminClient.post(
    `/qr/registrations/${registrationId}/image`,
  );

  return unwrapApiData<QrResponse>(response.data);
}

export async function validateQr(payload: ValidateQrPayload) {
  const response = await adminClient.post("/qr/validate", payload);
  return unwrapApiData<ValidateQrResponse>(response.data);
}

export async function revokeRegistrationQr(registrationId: string) {
  const response = await adminClient.post(
    `/qr/registrations/${registrationId}/revoke`,
  );

  return unwrapApiData<QrResponse>(response.data);
}
