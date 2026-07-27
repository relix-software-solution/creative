import {
  prepareStaffDeviceOfflineKey,
  signStaffOfflinePayload,
} from "./staff-device-offline-key";

/**
 * الصيغة المختصرة الجديدة:
 *
 * 0: version
 * 1: eventId
 * 2: issuerDeviceId
 * 3: issuerKeyVersion
 * 4: offlineRegistrationOperationId
 * 5: offlineQrToken
 * 6: attendeeTypeId
 * 7: issuedAt بالثواني
 * 8: validUntil بالثواني
 *
 * حذفنا:
 * - أسماء الحقول الطويلة
 * - displayName
 * - offlineRegistrationId
 * - تواريخ ISO الطويلة
 */
export type OfflineVisitorQrPayload = readonly [
  version: 2,
  eventId: string,
  issuerDeviceId: string,
  issuerKeyVersion: number,
  offlineRegistrationOperationId: string,
  offlineQrToken: string,
  attendeeTypeId: string,
  issuedAtSeconds: number,
  validUntilSeconds: number,
];

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * 16 bytes عشوائية = 128-bit.
 *
 * أصغر بكثير من UUID مع prefix،
 * وتبقى مناسبة كهوية عشوائية آمنة.
 */
function createCompactOfflineQrToken() {
  const bytes = new Uint8Array(16);

  crypto.getRandomValues(bytes);

  return bytesToBase64Url(bytes);
}

function normalizeIssuedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function normalizeValidUntil(value: string) {
  const parsed = new Date(value);

  /*
   * نعطي الرمز ساعة واحدة على الأقل.
   */
  const minimum = new Date(Date.now() + 60 * 60 * 1000);

  if (Number.isNaN(parsed.getTime()) || parsed <= minimum) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  return parsed;
}

function toUnixSeconds(value: Date) {
  return Math.floor(value.getTime() / 1000);
}

export async function createOfflineVisitorQrToken(input: {
  eventId: string;
  issuerDeviceId: string;

  localId: string;
  operationId: string;

  attendeeTypeId: string;
  fullName: string;

  createdAtDevice: string;
  validUntil: string;

  online: boolean;

  provisionPublicKey: (payload: {
    publicKey: string;
    keyVersion: number;
  }) => Promise<unknown>;
}) {
  const key = await prepareStaffDeviceOfflineKey({
    deviceId: input.issuerDeviceId,
    online: input.online,
    provisionPublicKey: input.provisionPublicKey,
  });

  const offlineQrToken = createCompactOfflineQrToken();

  const issuedAt = normalizeIssuedAt(input.createdAtDevice);
  const validUntil = normalizeValidUntil(input.validUntil);

  const payload: OfflineVisitorQrPayload = [
    2,
    input.eventId,
    input.issuerDeviceId,
    key.keyVersion,
    input.operationId,
    offlineQrToken,
    input.attendeeTypeId,
    toUnixSeconds(issuedAt),
    toUnixSeconds(validUntil),
  ];

  const signedOfflineQr = await signStaffOfflinePayload({
    privateKey: key.privateKey,

    /*
     * في حال signStaffOfflinePayload يقبل unknown مباشرة،
     * احذف الـcast واترك payload فقط.
     */
    payload: payload as unknown as Record<string, unknown>,
  });

  return {
    signedOfflineQr,
    offlineQrToken,
    issuerKeyVersion: key.keyVersion,
    payload,
  };
}
