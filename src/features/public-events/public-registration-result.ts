import {
  PublicRegistrationSuccessData,
  PublicRegisterResponse,
} from "./public-events.types";

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function normalizePublicRegistrationSuccess(
  eventId: string,
  response: PublicRegisterResponse,
): PublicRegistrationSuccessData {
  const registrationId =
    firstString(
      response.registration?.publicId,
      response.publicId,
      response.registration?.id,
      response.id,
    ) ?? "";

  const fullName =
    firstString(response.registration?.fullName, response.fullName) ?? "—";

  const qrToken =
    firstString(response.qr?.qrToken, response.qr?.token, response.qrToken) ??
    "";

  const qrImageUrl =
    firstString(
      response.qr?.imageUrl,
      response.qr?.publicUrl,
      response.qr?.qrImageUrl,
      response.qrImageUrl,
      response.imageUrl,
      response.publicUrl,
    ) ?? "";

  return {
    eventId,
    registrationId,
    publicId: response.registration?.publicId ?? response.publicId,
    fullName,
    status: response.registration?.status ?? response.status,
    qrToken,
    qrImageUrl,
  };
}

export function getPublicRegistrationStorageKey(eventId: string) {
  return `creative-public-registration-success:${eventId}`;
}
