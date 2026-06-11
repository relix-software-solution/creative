import {
  PublicQrTokenObject,
  PublicRegistrationSuccessData,
  PublicRegisterResponse,
} from "./public-events.types";

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

function readQrToken(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (value && typeof value === "object") {
    const tokenObject = value as PublicQrTokenObject;

    return (
      firstString(
        tokenObject.qrToken,
        tokenObject.token,
        tokenObject.value,
        tokenObject.signedToken,
      ) ?? ""
    );
  }

  return "";
}

function readQrImageUrl(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const tokenObject = value as PublicQrTokenObject;

  return (
    firstString(
      tokenObject.imageUrl,
      tokenObject.publicUrl,
      tokenObject.qrImageUrl,
    ) ?? ""
  );
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

  const publicId =
    firstString(response.registration?.publicId, response.publicId) ?? "";

  const fullName =
    firstString(response.registration?.fullName, response.fullName) ?? "—";

  const phone =
    firstString(response.registration?.phone, response.phone) ?? null;

  const email =
    firstString(response.registration?.email, response.email) ?? null;

  const companyName =
    firstString(response.registration?.companyName, response.companyName) ??
    null;

  const jobTitle =
    firstString(response.registration?.jobTitle, response.jobTitle) ?? null;

  const qrToken =
    firstString(
      readQrToken(response.qrToken),
      readQrToken(response.qr),
      response.qr?.qrToken,
      response.qr?.token,
    ) ?? "";

  const qrImageUrl =
    firstString(
      readQrImageUrl(response.qrToken),
      readQrImageUrl(response.qr),
      response.qrImageUrl,
      response.imageUrl,
      response.publicUrl,
    ) ?? "";

  return {
    eventId,
    registrationId,
    publicId,
    fullName,
    phone,
    email,
    companyName,
    jobTitle,
    status: response.registration?.status ?? response.status,
    qrToken,
    qrImageUrl,
  };
}

export function getPublicRegistrationStorageKey(eventId: string) {
  return `creative-public-registration-success:${eventId}`;
}
