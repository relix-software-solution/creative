import { PublicRegistrationSuccessData } from "./public-events.types";

type UnknownRecord = Record<string, unknown>;

export type StoredWhatsappRequest = {
  enabled: boolean;
  url?: string | null;
  ticketRequestToken?: string | null;
  expiresAt?: string | null;
};

export type StoredDigitalTicket = {
  status?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  generatedImageUrl?: string | null;
};

export type StoredPublicRegistrationSuccess = PublicRegistrationSuccessData & {
  eventId?: string;

  whatsappRequest?: StoredWhatsappRequest | null;

  /**
   * digitalTicketImageUrl موجود أصلًا داخل
   * PublicRegistrationSuccessData بصيغة:
   *
   * digitalTicketImageUrl?: string
   *
   * لذلك لا نعيد تعريفه هنا باستخدام null.
   */
  digitalTicketUrl?: string | null;
  digitalTicket?: StoredDigitalTicket | null;
};

export function getPublicRegistrationStorageKey(eventId: string) {
  return `public-registration-success:${eventId}`;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

/**
 * ترجع نصًا فارغًا عندما لا توجد قيمة.
 *
 * تستخدم للحقول المطلوبة مثل:
 * registrationId
 * publicId
 * fullName
 */
function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

/**
 * ترجع undefined بدل null.
 *
 * تستخدم للحقول المعرفة في PublicRegistrationSuccessData
 * بصيغة:
 *
 * field?: string
 */
function firstOptionalString(...values: unknown[]): string | undefined {
  const value = firstString(...values);

  return value || undefined;
}

/**
 * ترجع null عندما لا توجد قيمة.
 *
 * تستخدم فقط مع الأنواع التي تسمح بـ null.
 */
function firstNullableString(...values: unknown[]): string | null {
  const value = firstString(...values);

  return value || null;
}

function firstBoolean(fallbackValue: boolean, ...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallbackValue;
}

function unwrapResponse(response: unknown): UnknownRecord {
  const firstLevel = asRecord(response);

  if (!firstLevel) {
    return {};
  }

  const secondLevel = asRecord(firstLevel.data);

  if (!secondLevel) {
    return firstLevel;
  }

  const thirdLevel = asRecord(secondLevel.data);

  if (thirdLevel) {
    return thirdLevel;
  }

  return secondLevel;
}

function readCustomFields(
  registration: UnknownRecord,
  root: UnknownRecord,
  submittedCustomFields?: Record<string, unknown>,
): Record<string, unknown> {
  return (
    asRecord(registration.customFields) ||
    asRecord(root.customFields) ||
    submittedCustomFields ||
    {}
  );
}

export function normalizePublicRegistrationSuccess(
  eventId: string,
  response: unknown,
  submittedCustomFields?: Record<string, unknown>,
  submittedAttendeeTypeId?: string,
): StoredPublicRegistrationSuccess {
  const root = unwrapResponse(response);

  const registration =
    asRecord(root.registration) ||
    asRecord(root.visitor) ||
    asRecord(root.result) ||
    root;

  const digitalTicket =
    asRecord(root.digitalTicket) ||
    asRecord(registration.digitalTicket) ||
    asRecord(root.ticket) ||
    null;

  const whatsappRequest =
    asRecord(root.whatsappRequest) ||
    asRecord(registration.whatsappRequest) ||
    null;

  const qr = asRecord(root.qr) || asRecord(registration.qr) || null;

  const registrationId = firstString(
    registration.registrationId,
    registration.id,
    root.registrationId,
    root.id,
  );

  const publicId = firstString(
    registration.publicId,
    root.publicId,
    registration.registrationCode,
    root.registrationCode,
  );

  /**
   * هذا الحقل موجود في PublicRegistrationSuccessData
   * كـ string | undefined، لذلك نستخدم firstOptionalString.
   */
  const digitalTicketImageUrl = firstOptionalString(
    root.digitalTicketImageUrl,
    root.digitalTicketUrl,

    digitalTicket?.imageUrl,
    digitalTicket?.generatedImageUrl,
    digitalTicket?.url,
    digitalTicket?.fileUrl,
    digitalTicket?.downloadUrl,

    registration.digitalTicketImageUrl,
    registration.digitalTicketUrl,
  );

  const ticketRequestToken = firstNullableString(
    whatsappRequest?.ticketRequestToken,
    whatsappRequest?.token,
    root.ticketRequestToken,
    registration.ticketRequestToken,
  );

  const whatsappRequestUrl = firstNullableString(
    whatsappRequest?.url,
    whatsappRequest?.whatsappUrl,
  );

  const whatsappRequestEnabled = firstBoolean(
    Boolean(ticketRequestToken || whatsappRequestUrl),
    whatsappRequest?.enabled,
  );

  const normalized: StoredPublicRegistrationSuccess = {
    eventId,

    registrationId,
    publicId,

    fullName: firstString(
      registration.fullName,
      registration.name,
      root.fullName,
      root.name,
    ),

    phone: firstString(
      registration.phone,
      registration.mobile,
      root.phone,
      root.mobile,
    ),

    email: firstNullableString(registration.email, root.email),

    companyName: firstNullableString(
      registration.companyName,
      root.companyName,
    ),

    jobTitle: firstNullableString(registration.jobTitle, root.jobTitle),

    externalId: firstNullableString(registration.externalId, root.externalId),

    notes: firstNullableString(registration.notes, root.notes),

    status: firstString(registration.status, root.status, "ACTIVE"),

    attendeeTypeId: firstString(
      registration.attendeeTypeId,
      root.attendeeTypeId,
      submittedAttendeeTypeId,
    ),

    customFields: readCustomFields(registration, root, submittedCustomFields),

    /**
     * هذه الحقول لا تقبل null حسب public-events.types.ts.
     */
    qrToken: firstOptionalString(
      registration.qrToken,
      root.qrToken,
      qr?.token,
      qr?.value,
    ),

    qrImageUrl: firstOptionalString(
      registration.qrImageUrl,
      root.qrImageUrl,
      qr?.imageUrl,
      qr?.url,
    ),

    digitalTicketImageUrl,

    /**
     * هذا حقل إضافي خاص بالتخزين، ويسمح بـ null.
     */
    digitalTicketUrl: digitalTicketImageUrl || null,

    digitalTicket: digitalTicket
      ? {
          status: firstNullableString(
            digitalTicket.status,
            root.digitalTicketStatus,
          ),

          imageUrl: firstNullableString(
            digitalTicket.imageUrl,
            digitalTicket.generatedImageUrl,
            digitalTicket.url,
            digitalTicket.fileUrl,
            digitalTicket.downloadUrl,
            digitalTicketImageUrl,
          ),

          generatedImageUrl: firstNullableString(
            digitalTicket.generatedImageUrl,
          ),

          url: firstNullableString(
            digitalTicket.url,
            digitalTicket.imageUrl,
            digitalTicketImageUrl,
          ),
        }
      : digitalTicketImageUrl
        ? {
            status: "READY",
            imageUrl: digitalTicketImageUrl,
            url: digitalTicketImageUrl,
          }
        : null,

    whatsappRequest: {
      enabled: whatsappRequestEnabled,
      url: whatsappRequestUrl,
      ticketRequestToken,

      expiresAt: firstNullableString(
        whatsappRequest?.expiresAt,
        root.whatsappRequestExpiresAt,
      ),
    },
  };

  return normalized;
}
