import Dexie, { Table } from "dexie";

type StoredStaffDeviceOfflineKey = {
  id: string;
  deviceId: string;
  keyVersion: number;

  privateKey: CryptoKey;
  publicKeyPem: string;

  createdAt: string;
  provisionedAt?: string | null;
};

type ProvisionPublicKey = (input: {
  publicKey: string;
  keyVersion: number;
}) => Promise<unknown>;

class StaffDeviceOfflineKeyDatabase extends Dexie {
  keys!: Table<StoredStaffDeviceOfflineKey, string>;

  constructor() {
    super("creative-staff-device-offline-keys");

    this.version(1).stores({
      keys: "id, deviceId, keyVersion, createdAt, provisionedAt",
    });
  }
}

const keyDb = new StaffDeviceOfflineKeyDatabase();

function createKeyId(deviceId: string, keyVersion: number) {
  return `${deviceId}:${keyVersion}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function arrayBufferToBase64Url(value: ArrayBuffer) {
  return bytesToBase64Url(new Uint8Array(value));
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function spkiToPem(spki: ArrayBuffer) {
  const base64 = bytesToBase64(new Uint8Array(spki));

  const lines = base64.match(/.{1,64}/g) ?? [];

  return [
    "-----BEGIN PUBLIC KEY-----",
    ...lines,
    "-----END PUBLIC KEY-----",
  ].join("\n");
}

async function createUniqueKeyVersion(deviceId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const random = new Uint32Array(1);

    crypto.getRandomValues(random);

    const keyVersion = random[0] & 0x7fffffff;

    if (keyVersion < 1) {
      continue;
    }

    const existing = await keyDb.keys.get(createKeyId(deviceId, keyVersion));

    if (!existing) {
      return keyVersion;
    }
  }

  throw new Error("Could not create offline key version");
}

async function getLatestDeviceKey(deviceId: string) {
  const keys = await keyDb.keys.where("deviceId").equals(deviceId).toArray();

  return (
    keys.sort((left, right) => right.keyVersion - left.keyVersion)[0] ?? null
  );
}

async function generateDeviceKey(
  deviceId: string,
): Promise<StoredStaffDeviceOfflineKey> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("WEB_CRYPTO_NOT_SUPPORTED");
  }

  let generated: CryptoKeyPair;

  try {
    const result = await crypto.subtle.generateKey(
      {
        name: "Ed25519",
      },
      true,
      ["sign", "verify"],
    );

    if (!("privateKey" in result)) {
      throw new Error("Ed25519 key pair was not generated");
    }

    generated = result;
  } catch {
    throw new Error("ED25519_NOT_SUPPORTED");
  }

  const [pkcs8, spki] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", generated.privateKey),

    crypto.subtle.exportKey("spki", generated.publicKey),
  ]);

  /*
   * نعيد استيراد المفتاح الخاص كـ non-extractable.
   * بعد هذه النقطة لا يمكن للـ JavaScript تصديره مرة أخرى.
   */
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "Ed25519",
    },
    false,
    ["sign"],
  );

  const keyVersion = await createUniqueKeyVersion(deviceId);

  const stored: StoredStaffDeviceOfflineKey = {
    id: createKeyId(deviceId, keyVersion),
    deviceId,
    keyVersion,
    privateKey,
    publicKeyPem: spkiToPem(spki),
    createdAt: new Date().toISOString(),
    provisionedAt: null,
  };

  try {
    await keyDb.keys.put(stored);
  } catch {
    throw new Error("BROWSER_CANNOT_STORE_OFFLINE_PRIVATE_KEY");
  }

  return stored;
}

function shouldRefreshProvisioning(provisionedAt?: string | null) {
  if (!provisionedAt) {
    return true;
  }

  const provisionedAtMs = new Date(provisionedAt).getTime();

  if (Number.isNaN(provisionedAtMs)) {
    return true;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;

  return Date.now() - provisionedAtMs > oneDayMs;
}

export async function prepareStaffDeviceOfflineKey(input: {
  deviceId: string;
  online: boolean;
  provisionPublicKey: ProvisionPublicKey;
}) {
  if (!input.deviceId) {
    throw new Error("DEVICE_ID_REQUIRED");
  }

  let stored = await getLatestDeviceKey(input.deviceId);

  if (!stored) {
    if (!input.online) {
      throw new Error("OFFLINE_KEY_REQUIRES_FIRST_ONLINE_SETUP");
    }

    stored = await generateDeviceKey(input.deviceId);
  }

  if (!input.online) {
    if (!stored.provisionedAt) {
      throw new Error("OFFLINE_KEY_WAS_NOT_PROVISIONED");
    }

    return stored;
  }

  if (shouldRefreshProvisioning(stored.provisionedAt)) {
    await input.provisionPublicKey({
      publicKey: stored.publicKeyPem,
      keyVersion: stored.keyVersion,
    });

    const provisionedAt = new Date().toISOString();

    await keyDb.keys.update(stored.id, {
      provisionedAt,
    });

    stored = {
      ...stored,
      provisionedAt,
    };
  }

  return stored;
}

export async function signStaffOfflinePayload(input: {
  privateKey: CryptoKey;
  payload: Record<string, unknown>;
}) {
  const encodedPayload = textToBase64Url(JSON.stringify(input.payload));

  const signature = await crypto.subtle.sign(
    {
      name: "Ed25519",
    },
    input.privateKey,
    new TextEncoder().encode(encodedPayload),
  );

  return `${encodedPayload}.${arrayBufferToBase64Url(signature)}`;
}
