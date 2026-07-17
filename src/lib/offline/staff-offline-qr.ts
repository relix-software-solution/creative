export type OfflineVisitorQrPayload = {
  v: 1;
  type: "OFFLINE_STAFF_VISITOR";
  eventId: string;
  localId: string;
  operationId: string;
  publicId: string;
  fullName: string;
  createdAtDevice: string;
  nonce: string;
};

function base64UrlEncode(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return window
    .btoa(unescape(encodeURIComponent(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createOfflineVisitorQrToken(input: {
  eventId: string;
  localId: string;
  operationId: string;
  publicId: string;
  fullName: string;
  createdAtDevice: string;
}) {
  const payload: OfflineVisitorQrPayload = {
    v: 1,
    type: "OFFLINE_STAFF_VISITOR",
    eventId: input.eventId,
    localId: input.localId,
    operationId: input.operationId,
    publicId: input.publicId,
    fullName: input.fullName,
    createdAtDevice: input.createdAtDevice,
    nonce: randomId(),
  };

  return `offline-visitor-v1.${base64UrlEncode(JSON.stringify(payload))}`;
}
