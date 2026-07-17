import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { QrResponse, ValidateQrPayload, ValidateQrResponse } from "./qr.types";

function isJsonContentType(contentType?: string) {
  return contentType?.includes("application/json");
}

async function parseBlobJson<T>(blob: Blob) {
  const text = await blob.text();

  if (!text.trim()) return {} as T;

  return JSON.parse(text) as T;
}

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
    undefined,
    {
      responseType: "blob",
    },
  );

  const contentType = response.headers["content-type"] as string | undefined;

  if (isJsonContentType(contentType)) {
    const data = await parseBlobJson<unknown>(response.data);
    return unwrapApiData<QrResponse>(data);
  }

  const objectUrl = URL.createObjectURL(response.data);

  return {
    registrationId,
    objectUrl,
    imageUrl: objectUrl,
    publicUrl: objectUrl,
    status: "ACTIVE",
  } satisfies QrResponse;
}

export async function validateQr(payload: ValidateQrPayload) {
  const response = await adminClient.post("/qr/validate", payload);

  return unwrapApiData<ValidateQrResponse>(response.data);
}

export async function revokeRegistrationQr(registrationId: string) {
  const response = await adminClient.post(
    `/qr/registrations/${registrationId}/revoke`,
  );

  const data = unwrapApiData<QrResponse>(response.data);

  return {
    ...data,
    registrationId:
      data.registrationId || data.qr?.registrationId || registrationId,
    status: "REVOKED",
    qrToken: "",
    token: "",
    imageUrl: "",
    publicUrl: "",
    qrImageUrl: "",
    objectUrl: "",
    relativePath: "",
    qr: data.qr
      ? {
          ...data.qr,
          status: "REVOKED",
          qrToken: "",
          token: "",
          imageUrl: "",
          publicUrl: "",
          qrImageUrl: "",
          objectUrl: "",
          relativePath: "",
        }
      : undefined,
  } satisfies QrResponse;
}
