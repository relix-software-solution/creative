import Dexie, { Table } from "dexie";
import {
  PublicAttendeeType,
  PublicEvent,
  PublicRegisterPayload,
  PublicRegisterResponse,
} from "@/features/public-events/public-events.types";
import {
  CreateScanPayload,
  QueuedScanStatus,
  QueuedStaffScan,
} from "@/features/scans/scans.types";
import { StaffOfflineSyncError } from "@/features/staff-offline/staff-offline.types";
import {
  getStaffOfflineVisitorsSnapshot,
  getStaffVisitorChanges,
  StaffBadgeTemplate,
  StaffVisitor,
  StaffVisitorAttendeeType,
  UpdateStaffVisitorPayload,
  UpdateStaffVisitorResponse,
} from "@/features/staff-visitors/staff-visitors.api";
import { createOfflineQrImageDataUrl } from "./staff-offline-qr-image";

export type CachedStaffBadgeTemplate = {
  eventId: string;
  template: StaffBadgeTemplate | null;
  savedAt: string;
};

export type CachedStaffScannerEvent = {
  eventId: string;
  data: PublicEvent | unknown;
  savedAt: string;
};

export type CachedStaffScannerAsset = {
  url: string;
  dataUrl: string;
  contentType?: string | null;
  savedAt: string;
};

export type CachedStaffVisitorSyncStatus =
  | "CACHED"
  | "LOCAL_PENDING"
  | "LOCAL_SYNCED"
  | "LOCAL_FAILED";

export type CachedStaffVisitor = StaffVisitor & {
  eventId: string;
  snapshotId?: string | null;
  attendeeTypeId?: string | null;

  searchText: string;
  syncStatus: CachedStaffVisitorSyncStatus;

  offlineLocalId?: string | null;
  offlineOperationId?: string | null;

  /*
   * الرمز القصير المطبوع على البادج الأوفلاين.
   */
  offlineQrToken?: string | null;

  /*
   * الرمز الكامل الموقع، لا يُطبع.
   */
  offlineSignedQr?: string | null;

  canonicalQrToken?: string | null;

  qrLookupKeys?: string[];

  updatedAt: string;
};

export type StaffVisitorsSnapshotStatus =
  | "IDLE"
  | "DOWNLOADING"
  | "PAUSED_OFFLINE"
  | "COMPLETED"
  | "FAILED";

export type CachedStaffVisitorsSnapshot = {
  eventId: string;

  serverRevision?: string | null;

  snapshotId: string | null;
  snapshotAsOf: string | null;
  changeCursor?: string | null;

  nextCursor: string | null;

  downloadedCount: number;
  totalCount: number | null;

  pageSize: number;

  status: StaffVisitorsSnapshotStatus;

  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;

  lastError: string | null;
};

export type QueuedStaffVisitorRegistration = {
  id?: number;

  operationId: string;
  localId: string;
  publicId: string;

  eventId: string;
  attendeeTypeId: string;

  issuerDeviceId: string;
  issuerKeyVersion: number;

  fullName: string;
  phone?: string | null;
  email?: string | null;

  customFields?: Record<string, unknown>;

  /**
   * القيمة العشوائية القصيرة الموجودة داخل
   * Payload الخاص بـSigned Offline QR.
   */
  offlineQrToken: string;

  /**
   * التوكن الكامل:
   *
   * base64url(payload).base64url(signature)
   */
  signedOfflineQr: string;

  offlineQrImageUrl: string;

  attendeeType?: PublicAttendeeType | null;

  status: QueuedScanStatus;

  errorCode?: string | null;
  errorMessage?: string | null;
  retryable?: boolean | null;

  attemptCount?: number;
  lastAttemptAt?: string | null;

  createdAtDevice: string;
  createdAt: string;
  syncedAt?: string | null;

  backendRegistrationId?: string | null;
  backendPublicId?: string | null;

  canonicalQrToken?: string | null;

  response?: PublicRegisterResponse | null;
};

export type QueuedStaffVisitorUpdate = {
  id?: number;

  operationId: string;

  eventId: string;
  registrationId: string;

  /**
   * تاريخ نسخة السيرفر التي بدأ الموظف التعديل انطلاقًا منها.
   */
  expectedUpdatedAt: string | null;

  changes: UpdateStaffVisitorPayload;

  status: QueuedScanStatus;

  retryable?: boolean | null;

  errorCode?: string | null;
  errorMessage?: string | null;

  attemptCount: number;
  lastAttemptAt?: string | null;

  createdAt: string;
  updatedAt: string;
  syncedAt?: string | null;

  response?: UpdateStaffVisitorResponse | null;
};

class StaffScannerDatabase extends Dexie {
  scans!: Table<QueuedStaffScan, number>;
  eventCaches!: Table<CachedStaffScannerEvent, string>;
  assets!: Table<CachedStaffScannerAsset, string>;
  visitors!: Table<CachedStaffVisitor, string>;

  visitorRegistrations!: Table<QueuedStaffVisitorRegistration, number>;

  visitorSnapshots!: Table<CachedStaffVisitorsSnapshot, string>;

  badgeTemplates!: Table<CachedStaffBadgeTemplate, string>;

  visitorUpdates!: Table<QueuedStaffVisitorUpdate, number>;

  constructor() {
    super("creative-staff-scanner-db");

    this.version(1).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, type, status, createdAt, syncedAt",
    });

    this.version(2).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, createdAt, syncedAt",
    });

    this.version(3).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, createdAt, syncedAt",

      eventCaches: "eventId, savedAt",
      assets: "url, savedAt",

      visitors:
        "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, updatedAt",

      visitorRegistrations:
        "++id, operationId, localId, eventId, attendeeTypeId, status, createdAt, syncedAt",
    });

    this.version(4).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, createdAt, syncedAt",

      eventCaches: "eventId, savedAt",
      assets: "url, savedAt",

      visitors:
        "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, updatedAt",

      visitorRegistrations:
        "++id, operationId, localId, eventId, attendeeTypeId, status, createdAt, syncedAt",

      badgeTemplates: "eventId, savedAt",
    });

    /*
     * Version 5:
     *
     * - retryable
     * - attemptCount
     * - lastAttemptAt
     * - issuerDeviceId
     * - canonicalQrToken
     *
     * لم نضع unique index على operationId لأن قواعد البيانات
     * القديمة قد تحتوي بيانات مكررة، ووضع unique أثناء الترقية
     * قد يؤدي إلى فشل فتح IndexedDB بالكامل.
     */
    this.version(5).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, retryable, createdAt, lastAttemptAt, syncedAt",

      eventCaches: "eventId, savedAt",
      assets: "url, savedAt",

      visitors:
        "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, updatedAt",

      visitorRegistrations:
        "++id, operationId, localId, eventId, attendeeTypeId, issuerDeviceId, status, retryable, createdAt, lastAttemptAt, syncedAt",

      badgeTemplates: "eventId, savedAt",
    });

    this.version(6).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, retryable, createdAt, lastAttemptAt, syncedAt",

      eventCaches: "eventId, savedAt",
      assets: "url, savedAt",

      visitors:
        "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, updatedAt",

      visitorSnapshots: "eventId, snapshotId, status, updatedAt, completedAt",

      visitorRegistrations:
        "++id, operationId, localId, eventId, attendeeTypeId, issuerDeviceId, status, retryable, createdAt, lastAttemptAt, syncedAt",

      badgeTemplates: "eventId, savedAt",
    });

    this.version(7).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, registrationId, type, status, retryable, createdAt, lastAttemptAt, syncedAt",

      eventCaches: "eventId, savedAt",
      assets: "url, savedAt",

      visitors:
        "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, updatedAt",

      visitorSnapshots: "eventId, snapshotId, status, updatedAt, completedAt",

      visitorRegistrations:
        "++id, operationId, localId, eventId, attendeeTypeId, issuerDeviceId, status, retryable, createdAt, lastAttemptAt, syncedAt",

      visitorUpdates:
        "++id, operationId, eventId, registrationId, status, retryable, createdAt, updatedAt, lastAttemptAt, syncedAt",

      badgeTemplates: "eventId, savedAt",
    });
    this.version(8)
      .stores({
        visitors:
          "id, eventId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, *qrLookupKeys, updatedAt",
      })
      .upgrade(async (transaction) => {
        const visitorsTable = transaction.table("visitors") as Table<
          CachedStaffVisitor,
          string
        >;

        await visitorsTable.toCollection().modify((visitor) => {
          visitor.qrLookupKeys = buildVisitorQrLookupKeys(visitor);
        });
      });
    this.version(9)
      .stores({
        visitors:
          "id, eventId, snapshotId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, *qrLookupKeys, updatedAt",
      })
      .upgrade(async (transaction) => {
        const visitorsTable = transaction.table("visitors") as Table<
          CachedStaffVisitor,
          string
        >;

        await visitorsTable.toCollection().modify((visitor) => {
          visitor.snapshotId = visitor.snapshotId ?? null;
          visitor.qrLookupKeys = buildVisitorQrLookupKeys(visitor);
        });
      });

    this.version(10)
      .stores({
        visitors:
          "id, eventId, snapshotId, publicId, fullName, phone, email, status, attendeeTypeId, searchText, syncStatus, *qrLookupKeys, updatedAt",
        visitorSnapshots:
          "eventId, snapshotId, status, updatedAt, completedAt",
      })
      .upgrade(async (transaction) => {
        const snapshotsTable = transaction.table("visitorSnapshots") as Table<
          CachedStaffVisitorsSnapshot,
          string
        >;

        await snapshotsTable.toCollection().modify((snapshot) => {
          const legacyCursor =
            snapshot.changeCursor ?? snapshot.serverRevision ?? "0";

          /*
           * الإصدارات القديمة خزنت Revision مركبًا مثل:
           * eventId:count:updatedAt
           *
           * Delta API يقبل Cursor رقميًا فقط، لذلك نبدأ من الصفر مع إبقاء
           * الـSnapshot المحلي الحالي بدل إجبار الموظف على تنزيله من جديد.
           */
          const normalizedCursor = /^\d+$/.test(String(legacyCursor).trim())
            ? String(legacyCursor).trim()
            : "0";

          snapshot.changeCursor = normalizedCursor;
          snapshot.serverRevision = normalizedCursor;
        });
      });
  }
}

export const staffScannerDb = new StaffScannerDatabase();

export type SyncQueuedScansResult = {
  total: number;
  synced: number;
  failed: number;
  permanentFailed: number;
  skipped: number;
  busy?: boolean;
};

export type SyncQueuedVisitorRegistrationsResult = {
  total: number;
  synced: number;
  failed: number;
  permanentFailed: number;
  skipped: number;
  busy?: boolean;
};

type QueueErrorDetails = {
  message: string;
  code: string;
  retryable: boolean;
  httpStatus?: number;
};

type BrowserLockManager = {
  request<T>(
    name: string,
    options: {
      mode: "exclusive";
      ifAvailable: true;
    },
    callback: (lock: unknown | null) => Promise<T | null>,
  ): Promise<T | null>;
};

const STAFF_VISITORS_SNAPSHOT_PAGE_SIZE = 500;

const STAFF_VISITORS_SNAPSHOT_YIELD_MS = 20;

const OFFLINE_SYNC_LOCK_NAME = "creative-staff-scanner-offline-sync";

const FALLBACK_LOCK_KEY = "creative-staff-scanner:offline-sync-lock";

const FALLBACK_LOCK_TTL_MS = 90_000;
const STALE_SYNCING_TIMEOUT_MS = 5 * 60_000;
const LOCAL_SYNCED_GRACE_PERIOD_MS = 24 * 60 * 60_000;

const RETRYABLE_HTTP_STATUSES = new Set([401, 403, 408, 425, 429]);

const PERMANENT_QUEUE_STATUSES: QueuedScanStatus[] = ["PERMANENT_FAILED"];

const RETRYABLE_QUEUE_STATUSES: QueuedScanStatus[] = ["PENDING", "FAILED"];

function createRandomId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeVisitorChangeCursor(value: unknown) {
  const cursor = typeof value === "string" ? value.trim() : "";

  return /^\d+$/.test(cursor) ? cursor : "0";
}

function parseDateMs(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function getVisitorUpdatedAt(visitor: StaffVisitor) {
  const visitorRecord = visitor as StaffVisitor & {
    updatedAt?: string | null;
  };

  const registeredAt = parseDateMs(visitorRecord.registeredAt);
  const createdAt = parseDateMs(visitorRecord.createdAt);
  const updatedAt = parseDateMs(visitorRecord.updatedAt);

  const timestamp = updatedAt ?? registeredAt ?? createdAt;

  return timestamp
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();
}

function buildVisitorSearchText(visitor: StaffVisitor) {
  return normalizeSearchValue(
    [
      visitor.id,
      visitor.publicId,
      visitor.fullName,
      visitor.phone,
      visitor.email,
      visitor.status,

      visitor.attendeeType?.id,
      visitor.attendeeType?.code,
      visitor.attendeeType?.nameAr,
      visitor.attendeeType?.nameEn,

      JSON.stringify(visitor.customFields ?? {}),
    ].join(" "),
  );
}

function toStaffVisitorAttendeeType(
  attendeeType?: PublicAttendeeType | StaffVisitorAttendeeType | null,
): StaffVisitorAttendeeType | null {
  if (!attendeeType) {
    return null;
  }

  return {
    id: attendeeType.id,
    code: attendeeType.code ?? null,
    nameAr: attendeeType.nameAr ?? null,
    nameEn: attendeeType.nameEn ?? null,
  };
}

function normalizeCachedVisitor(
  eventId: string,
  visitor: StaffVisitor,
  syncStatus: CachedStaffVisitorSyncStatus = "CACHED",
  snapshotId: string | null = null,
): CachedStaffVisitor {
  const attendeeTypeId =
    visitor.attendeeType?.id ?? visitor.attendeeTypeId ?? null;

  const normalized: CachedStaffVisitor = {
    ...visitor,

    eventId,
    snapshotId: syncStatus === "CACHED" ? snapshotId : null,
    attendeeTypeId,

    searchText: buildVisitorSearchText(visitor),
    syncStatus,

    qrLookupKeys: [],

    updatedAt: getVisitorUpdatedAt(visitor),
  };

  normalized.qrLookupKeys = buildVisitorQrLookupKeys(normalized);

  return normalized;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readAllQrTokens(value: unknown): string[] {
  const tokens = new Set<string>();

  function add(candidate: unknown) {
    if (typeof candidate !== "string") {
      return;
    }

    const token = candidate.trim();

    if (token) {
      tokens.add(token);
    }
  }

  function visit(candidate: unknown) {
    if (typeof candidate === "string") {
      add(candidate);
      return;
    }

    const record = asRecord(candidate);

    if (!record) {
      return;
    }

    add(record.qrToken);
    add(record.canonicalQrToken);
    add(record.compactQrToken);
    add(record.token);
    add(record.signedToken);
    add(record.value);

    if (record.qr && record.qr !== candidate) {
      visit(record.qr);
    }
  }

  visit(value);

  return [...tokens];
}

function buildVisitorQrLookupKeys(
  visitor: StaffVisitor & {
    offlineQrToken?: string | null;
    offlineSignedQr?: string | null;
    canonicalQrToken?: string | null;
  },
) {
  return [
    ...new Set([
      ...readAllQrTokens(visitor.qrToken),
      ...readAllQrTokens(visitor.qr),

      /*
       * الرمز القصير المطبوع.
       */
      ...readAllQrTokens(visitor.offlineQrToken),

      /*
       * الرمز الكامل القديم.
       */
      ...readAllQrTokens(visitor.offlineSignedQr),

      ...readAllQrTokens(visitor.canonicalQrToken),
    ]),
  ];
}

function readQrToken(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  return (
    firstString(
      record.qrToken,
      record.canonicalQrToken,
      record.compactQrToken,
      record.token,
      record.value,
      record.signedToken,
    ) ?? ""
  );
}

function readQrImageUrl(value: unknown): string {
  const record = asRecord(value);

  if (!record) {
    return "";
  }

  return (
    firstString(
      record.imageUrl,
      record.publicUrl,
      record.qrImageUrl,
      record.relativePath,
      record.path,
      record.url,
      record.fileUrl,
      record.qrUrl,
    ) ?? ""
  );
}

function getHttpErrorDetails(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }

  const response = (
    error as {
      response?: {
        status?: number;

        data?: {
          code?: string;
          errorCode?: string;
          message?: string | string[];
          error?: string;
        };
      };
    }
  ).response;

  if (!response) {
    return null;
  }

  const responseMessage = response.data?.message;

  const message = Array.isArray(responseMessage)
    ? responseMessage[0]
    : responseMessage || response.data?.error;

  const code =
    response.data?.errorCode ||
    response.data?.code ||
    (response.status ? `HTTP_${response.status}` : "HTTP_ERROR");

  return {
    status: response.status,
    code,
    message,
  };
}

function classifyQueueError(error: unknown): QueueErrorDetails {
  if (error instanceof StaffOfflineSyncError) {
    return {
      message: error.message || "Offline synchronization failed",
      code: error.code,
      retryable: error.retryable,
      httpStatus: error.httpStatus,
    };
  }

  const http = getHttpErrorDetails(error);

  if (http?.status) {
    const retryable =
      RETRYABLE_HTTP_STATUSES.has(http.status) || http.status >= 500;

    return {
      message: http.message || `HTTP ${http.status}`,
      code: http.code,
      retryable,
      httpStatus: http.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "Network error",
      code: "NETWORK_OR_UNKNOWN_ERROR",
      retryable: true,
    };
  }

  return {
    message: "Unknown synchronization error",
    code: "UNKNOWN_SYNC_ERROR",
    retryable: true,
  };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(blob);
  });
}

function toCreateScanPayload(scan: QueuedStaffScan): CreateScanPayload {
  return {
    operationId: scan.operationId,

    eventId: scan.eventId,
    deviceId: scan.deviceId,
    staffSessionId: scan.staffSessionId,
    checkpointId: scan.checkpointId,

    qrToken: scan.qrToken ?? "",

    type: scan.type,
    scannedAtDevice: scan.scannedAtDevice,

    payload: scan.payload,
  };
}

function readSyncMetadata(response: PublicRegisterResponse) {
  const responseRecord = asRecord(response);
  const sync = asRecord(responseRecord?.sync);

  return {
    canonicalRegistrationId: firstString(
      sync?.canonicalRegistrationId,
      response.registration?.id,
      response.id,
    ),

    canonicalPublicId: firstString(
      sync?.canonicalPublicId,
      response.registration?.publicId,
      response.publicId,
    ),

    canonicalQrToken: firstString(
      sync?.canonicalQrToken,
      readQrToken(response.qr),
      readQrToken(response.qrToken),
    ),

    signedOfflineQr: firstString(sync?.signedOfflineQr),
  };
}

function toStaffVisitorFromRegisterResponse(
  response: PublicRegisterResponse,
  queued: QueuedStaffVisitorRegistration,
): StaffVisitor {
  const registration = response.registration ?? response;

  const sync = readSyncMetadata(response);

  const id =
    firstString(sync.canonicalRegistrationId, registration.id, response.id) ??
    queued.localId;

  const publicId =
    firstString(
      sync.canonicalPublicId,
      registration.publicId,
      response.publicId,
      queued.publicId,
    ) ?? null;

  const qrToken =
    firstString(
      sync.canonicalQrToken,

      readQrToken(response.qrToken),
      readQrToken(response.qr),

      response.qr?.qrToken,
      response.qr?.token,
      response.qr?.value,
      response.qr?.signedToken,

      queued.offlineQrToken,
    ) ?? "";

  const qrImageUrl =
    firstString(
      readQrImageUrl(response.qrToken),
      readQrImageUrl(response.qr),

      response.qrImageUrl,
      response.imageUrl,
      response.publicUrl,

      response.qr?.qrImageUrl,
      response.qr?.imageUrl,
      response.qr?.publicUrl,

      queued.offlineQrImageUrl,
    ) ?? "";

  return {
    id,
    publicId,

    fullName: registration.fullName || response.fullName || queued.fullName,

    phone: registration.phone ?? response.phone ?? queued.phone ?? null,

    email: registration.email ?? response.email ?? queued.email ?? null,

    status: registration.status || response.status || "ACTIVE",

    customFields:
      registration.customFields ||
      response.customFields ||
      queued.customFields ||
      {},

    registeredAt: new Date().toISOString(),
    createdAt: queued.createdAtDevice,

    attendeeType: toStaffVisitorAttendeeType(queued.attendeeType),

    qrToken: qrToken || null,
    qrImageUrl: qrImageUrl || null,

    qr: qrToken
      ? {
          qrToken,
          token: qrToken,
          qrImageUrl: qrImageUrl || null,
          imageUrl: qrImageUrl || null,
          publicUrl: qrImageUrl || null,
          status: sync.canonicalQrToken ? "ACTIVE" : "OFFLINE_VERIFIED",
        }
      : null,
  };
}

async function generateLocalQrImage(qrToken: string, fallback?: string | null) {
  if (!qrToken) {
    return fallback ?? "";
  }

  try {
    return await createOfflineQrImageDataUrl(qrToken);
  } catch {
    return fallback ?? "";
  }
}

async function bulkPutVisitorsInChunks(
  visitors: CachedStaffVisitor[],
  chunkSize = 500,
) {
  for (let index = 0; index < visitors.length; index += chunkSize) {
    const chunk = visitors.slice(index, index + chunkSize);

    await staffScannerDb.visitors.bulkPut(chunk);
  }
}

function isLocalSyncedVisitorRecent(visitor: CachedStaffVisitor) {
  if (visitor.syncStatus !== "LOCAL_SYNCED") {
    return false;
  }

  const updatedAt = parseDateMs(visitor.updatedAt);

  if (!updatedAt) {
    return false;
  }

  return Date.now() - updatedAt < LOCAL_SYNCED_GRACE_PERIOD_MS;
}

function scanDependsOnRegistration(
  scan: QueuedStaffScan,
  registration: QueuedStaffVisitorRegistration,
) {
  return Boolean(
    scan.registrationId === registration.localId ||
    scan.qrToken === registration.signedOfflineQr ||
    scan.qrToken === registration.offlineQrToken ||
    asRecord(scan.payload)?.offlineRegistrationOperationId ===
      registration.operationId,
  );
}

async function getDependentScans(registration: QueuedStaffVisitorRegistration) {
  const scans = await staffScannerDb.scans
    .where("eventId")
    .equals(registration.eventId)
    .toArray();

  return scans.filter((scan) => {
    return (
      scan.status !== "SYNCED" && scanDependsOnRegistration(scan, registration)
    );
  });
}

async function updateDependentScansAfterRegistrationSync(
  registration: QueuedStaffVisitorRegistration,
  canonicalRegistrationId: string,
  effectiveQrToken: string,
) {
  const scans = await getDependentScans(registration);

  if (scans.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  const updatedScans = scans.map((scan) => {
    const payload = {
      ...(scan.payload ?? {}),

      offlineRegistrationOperationId: registration.operationId,

      offlineRegistrationId: registration.localId,

      canonicalRegistrationId,

      registrationResolvedAt: now,
    };

    return {
      ...scan,

      registrationId: canonicalRegistrationId,

      qrToken: effectiveQrToken || scan.qrToken || registration.signedOfflineQr,

      payload,

      status:
        scan.status === "PERMANENT_FAILED"
          ? scan.status
          : ("PENDING" as QueuedScanStatus),

      retryable: scan.status === "PERMANENT_FAILED" ? false : true,

      errorCode: scan.status === "PERMANENT_FAILED" ? scan.errorCode : null,

      errorMessage:
        scan.status === "PERMANENT_FAILED" ? scan.errorMessage : null,
    };
  });

  await staffScannerDb.scans.bulkPut(updatedScans);
}

async function permanentlyFailDependentScans(
  registration: QueuedStaffVisitorRegistration,
  error: QueueErrorDetails,
) {
  const scans = await getDependentScans(registration);

  if (scans.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  const updatedScans = scans.map((scan) => ({
    ...scan,

    status: "PERMANENT_FAILED" as QueuedScanStatus,

    retryable: false,

    errorCode: "PARENT_OFFLINE_REGISTRATION_FAILED",

    errorMessage: `Registration ${registration.operationId} failed: ${error.message}`,

    lastAttemptAt: now,
  }));

  await staffScannerDb.scans.bulkPut(updatedScans);
}

function getNavigatorLockManager() {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return null;
  }

  return (
    (
      navigator as Navigator & {
        locks?: BrowserLockManager;
      }
    ).locks ?? null
  );
}

function readFallbackLock(): {
  owner: string;
  expiresAt: number;
} | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FALLBACK_LOCK_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      owner?: unknown;
      expiresAt?: unknown;
    };

    if (
      typeof parsed.owner !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      owner: parsed.owner,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function acquireFallbackLock(owner: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return true;
  }

  const current = readFallbackLock();

  if (current && current.owner !== owner && current.expiresAt > Date.now()) {
    return false;
  }

  const next = {
    owner,
    expiresAt: Date.now() + FALLBACK_LOCK_TTL_MS,
  };

  try {
    window.localStorage.setItem(FALLBACK_LOCK_KEY, JSON.stringify(next));

    const confirmed = readFallbackLock();

    return confirmed?.owner === owner;
  } catch {
    /*
     * عند منع localStorage لا نوقف المزامنة كليًا.
     * IndexedDB statuses وoperationId يبقيان طبقة حماية إضافية.
     */
    return true;
  }
}

export type DownloadStaffVisitorsSnapshotResult = {
  eventId: string;

  status: StaffVisitorsSnapshotStatus;

  downloadedCount: number;
  totalCount: number | null;

  completed: boolean;
  pausedOffline: boolean;

  snapshotId: string | null;
  snapshotAsOf: string | null;
  changeCursor: string | null;
  nextCursor: string | null;
};

function releaseFallbackLock(owner: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const current = readFallbackLock();

    if (current?.owner === owner) {
      window.localStorage.removeItem(FALLBACK_LOCK_KEY);
    }
  } catch {
    // Best effort.
  }
}

async function runWithOfflineSyncLock<T>(
  task: () => Promise<T>,
): Promise<T | null> {
  const lockManager = getNavigatorLockManager();

  if (lockManager) {
    return lockManager.request(
      OFFLINE_SYNC_LOCK_NAME,
      {
        mode: "exclusive",
        ifAvailable: true,
      },
      async (lock) => {
        if (!lock) {
          return null;
        }

        return task();
      },
    );
  }

  const owner = createRandomId("sync-lock");

  if (!acquireFallbackLock(owner)) {
    return null;
  }

  try {
    return await task();
  } finally {
    releaseFallbackLock(owner);
  }
}

async function resetStaleSyncingScans() {
  const syncing = await staffScannerDb.scans
    .where("status")
    .equals("SYNCING")
    .toArray();

  const now = Date.now();

  const stale = syncing.filter((item) => {
    const lastAttemptAt =
      parseDateMs(item.lastAttemptAt) ?? parseDateMs(item.createdAt) ?? 0;

    return now - lastAttemptAt > STALE_SYNCING_TIMEOUT_MS;
  });

  if (stale.length === 0) {
    return;
  }

  await staffScannerDb.scans.bulkPut(
    stale.map((item) => ({
      ...item,

      status: "FAILED" as QueuedScanStatus,

      retryable: true,

      errorCode: "STALE_SYNC_RECOVERED",

      errorMessage: "Previous synchronization attempt was interrupted.",

      lastAttemptAt: new Date().toISOString(),
    })),
  );
}

async function resetStaleSyncingRegistrations() {
  const syncing = await staffScannerDb.visitorRegistrations
    .where("status")
    .equals("SYNCING")
    .toArray();

  const now = Date.now();

  const stale = syncing.filter((item) => {
    const lastAttemptAt =
      parseDateMs(item.lastAttemptAt) ?? parseDateMs(item.createdAt) ?? 0;

    return now - lastAttemptAt > STALE_SYNCING_TIMEOUT_MS;
  });

  if (stale.length === 0) {
    return;
  }

  await staffScannerDb.visitorRegistrations.bulkPut(
    stale.map((item) => ({
      ...item,

      status: "FAILED" as QueuedScanStatus,

      retryable: true,

      errorCode: "STALE_SYNC_RECOVERED",

      errorMessage: "Previous synchronization attempt was interrupted.",

      lastAttemptAt: new Date().toISOString(),
    })),
  );
}

async function resetStaleSyncingOperations() {
  await Promise.all([
    resetStaleSyncingScans(),
    resetStaleSyncingRegistrations(),
  ]);
}

/**
 * Scan queue
 */
export async function addScanToQueue(
  scan: Omit<
    QueuedStaffScan,
    | "id"
    | "status"
    | "createdAt"
    | "syncedAt"
    | "attemptCount"
    | "lastAttemptAt"
    | "errorCode"
    | "errorMessage"
    | "retryable"
  >,
) {
  const existing = await staffScannerDb.scans
    .where("operationId")
    .equals(scan.operationId)
    .first();

  if (existing) {
    return existing.id;
  }

  return staffScannerDb.scans.add({
    ...scan,

    status: "PENDING",

    retryable: true,

    attemptCount: 0,
    lastAttemptAt: null,

    createdAt: new Date().toISOString(),
    syncedAt: null,

    errorCode: null,
    errorMessage: null,
  });
}

export async function getPendingScansCount() {
  await resetStaleSyncingScans();

  const [pending, failed, syncing] = await Promise.all([
    staffScannerDb.scans.where("status").equals("PENDING").count(),

    staffScannerDb.scans
      .where("status")
      .equals("FAILED")
      .and((scan) => scan.retryable !== false)
      .count(),

    staffScannerDb.scans.where("status").equals("SYNCING").count(),
  ]);

  return pending + failed + syncing;
}

export async function getPermanentFailedScansCount() {
  return staffScannerDb.scans
    .where("status")
    .anyOf(PERMANENT_QUEUE_STATUSES)
    .count();
}

export async function getQueuedScans() {
  return staffScannerDb.scans.orderBy("createdAt").reverse().toArray();
}

async function getUnresolvedVisitorRegistrations() {
  return staffScannerDb.visitorRegistrations
    .where("status")
    .anyOf(["PENDING", "FAILED", "SYNCING"])
    .filter((registration) => {
      return registration.status !== "FAILED"
        ? true
        : registration.retryable !== false;
    })
    .toArray();
}

export async function getPendingQueuedScans() {
  await resetStaleSyncingScans();

  const [scans, unresolvedRegistrations] = await Promise.all([
    staffScannerDb.scans
      .where("status")
      .anyOf(RETRYABLE_QUEUE_STATUSES)
      .filter((scan) => scan.retryable !== false)
      .toArray(),

    getUnresolvedVisitorRegistrations(),
  ]);

  const filteredScans = scans.filter((scan) => {
    return !unresolvedRegistrations.some((registration) =>
      scanDependsOnRegistration(scan, registration),
    );
  });

  return filteredScans.sort((left, right) => {
    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

export async function markScanAsSynced(id: number) {
  return staffScannerDb.scans.update(id, {
    status: "SYNCED",

    retryable: false,

    syncedAt: new Date().toISOString(),

    errorCode: null,
    errorMessage: null,
  });
}

export async function markScanAsFailed(
  id: number,
  errorMessage: string,
  options?: {
    errorCode?: string;
    retryable?: boolean;
  },
) {
  const retryable = options?.retryable ?? true;

  return staffScannerDb.scans.update(id, {
    status: retryable ? "FAILED" : "PERMANENT_FAILED",

    retryable,

    errorCode: options?.errorCode ?? "SCAN_SYNC_FAILED",

    errorMessage,
  });
}

export async function clearSyncedScans() {
  return staffScannerDb.scans.where("status").equals("SYNCED").delete();
}

export async function syncQueuedScans(options: {
  submitScan: (payload: CreateScanPayload) => Promise<unknown>;
}) {
  const executed = await runWithOfflineSyncLock(
    async (): Promise<SyncQueuedScansResult> => {
      await resetStaleSyncingOperations();

      const pendingScans = await getPendingQueuedScans();

      const result: SyncQueuedScansResult = {
        total: pendingScans.length,
        synced: 0,
        failed: 0,
        permanentFailed: 0,
        skipped: 0,
      };

      for (const scan of pendingScans) {
        if (!scan.id) {
          result.skipped += 1;
          continue;
        }

        const attemptAt = new Date().toISOString();

        await staffScannerDb.scans.update(scan.id, {
          status: "SYNCING",

          attemptCount: (scan.attemptCount ?? 0) + 1,

          lastAttemptAt: attemptAt,

          errorCode: null,
          errorMessage: null,
        });

        try {
          await options.submitScan(toCreateScanPayload(scan));

          await markScanAsSynced(scan.id);

          result.synced += 1;
        } catch (error) {
          const classified = classifyQueueError(error);

          await markScanAsFailed(scan.id, classified.message, {
            errorCode: classified.code,
            retryable: classified.retryable,
          });

          if (classified.retryable) {
            result.failed += 1;
          } else {
            result.permanentFailed += 1;
          }
        }
      }

      return result;
    },
  );

  if (!executed) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      permanentFailed: 0,
      skipped: 0,
      busy: true,
    } satisfies SyncQueuedScansResult;
  }

  return executed;
}

/**
 * Event branding / public event cache
 */
export async function cachePublicEventForStaffScanner(
  eventId: string,
  data: PublicEvent | unknown,
) {
  if (!eventId || !data) {
    return;
  }

  await staffScannerDb.eventCaches.put({
    eventId,
    data,
    savedAt: new Date().toISOString(),
  });
}

export async function getCachedPublicEvent(eventId: string) {
  if (!eventId) {
    return null;
  }

  return staffScannerDb.eventCaches.get(eventId);
}

export async function cacheScannerAsset(
  url: string,
  options?: {
    version?: string | null;
  },
) {
  if (!url || url.startsWith("data:")) {
    return null;
  }

  const version = options?.version?.trim();

  const requestUrl = version
    ? `${url}${url.includes("?") ? "&" : "?"}staffCacheVersion=${encodeURIComponent(
        version,
      )}`
    : url;

  const response = await fetch(requestUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to cache asset: ${response.status}`);
  }

  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);

  const asset: CachedStaffScannerAsset = {
    url,
    dataUrl,

    contentType: blob.type || response.headers.get("content-type"),

    savedAt: new Date().toISOString(),
  };

  await staffScannerDb.assets.put(asset);

  return asset;
}

export async function getCachedScannerAsset(url: string) {
  if (!url) {
    return null;
  }

  return staffScannerDb.assets.get(url);
}

function waitForBrowserFrame(delay = STAFF_VISITORS_SNAPSHOT_YIELD_MS) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

function isBrowserOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function isLikelyNetworkFailure(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as {
    code?: unknown;
    message?: unknown;
    response?: unknown;
  };

  /*
   * وجود response يعني أن السيرفر رد فعلًا،
   * وبالتالي الخطأ ليس مجرد انقطاع شبكة.
   */
  if (record.response) {
    return false;
  }

  const code = typeof record.code === "string" ? record.code.toUpperCase() : "";

  const message =
    typeof record.message === "string" ? record.message.toLowerCase() : "";

  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    message.includes("network error") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("network request failed") ||
    message.includes("err_internet_disconnected") ||
    message.includes("timeout")
  );
}

export async function getCachedStaffVisitorsSnapshot(eventId: string) {
  if (!eventId) {
    return null;
  }

  return staffScannerDb.visitorSnapshots.get(eventId);
}

export async function setCachedStaffVisitorsServerRevision(
  eventId: string,
  serverRevision: string,
) {
  if (!eventId || !serverRevision) {
    return;
  }

  const snapshot = await staffScannerDb.visitorSnapshots.get(eventId);

  if (!snapshot) {
    return;
  }

  await staffScannerDb.visitorSnapshots.put({
    ...snapshot,

    serverRevision,

    updatedAt: new Date().toISOString(),
  });
}

export async function clearCachedStaffVisitorsSnapshot(eventId: string) {
  if (!eventId) {
    return;
  }

  await staffScannerDb.transaction(
    "rw",
    staffScannerDb.visitorSnapshots,
    staffScannerDb.visitors,
    async () => {
      const localVisitors = await staffScannerDb.visitors
        .where("eventId")
        .equals(eventId)
        .and((visitor) => visitor.syncStatus !== "CACHED")
        .toArray();

      await staffScannerDb.visitors.where("eventId").equals(eventId).delete();

      if (localVisitors.length > 0) {
        await staffScannerDb.visitors.bulkPut(localVisitors);
      }

      await staffScannerDb.visitorSnapshots.delete(eventId);
    },
  );
}

export async function downloadStaffVisitorsSnapshot(options: {
  eventId: string;

  forceRestart?: boolean;

  signal?: AbortSignal;

  onProgress?: (progress: {
    eventId: string;

    downloadedCount: number;
    totalCount: number | null;

    pageItems: number;

    status: StaffVisitorsSnapshotStatus;
  }) => void;
}): Promise<DownloadStaffVisitorsSnapshotResult> {
  const eventId = options.eventId.trim();

  if (!eventId) {
    throw new Error("EVENT_ID_IS_REQUIRED");
  }

  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (!isBrowserOnline()) {
    const existing = await getCachedStaffVisitorsSnapshot(eventId);

    return {
      eventId,

      status: "PAUSED_OFFLINE",

      downloadedCount: existing?.downloadedCount ?? 0,
      totalCount: existing?.totalCount ?? null,

      completed: existing?.status === "COMPLETED",
      pausedOffline: true,

      snapshotId: existing?.snapshotId ?? null,
      snapshotAsOf: existing?.snapshotAsOf ?? null,
      changeCursor: existing?.changeCursor ?? null,
      nextCursor: existing?.nextCursor ?? null,
    };
  }

  /*
   * forceRestart يعني بدء Snapshot جديد،
   * لكنه لا يعني حذف الزوار الحاليين.
   *
   * المخزن القديم يبقى صالحًا للسكان والطباعة
   * إلى أن يكتمل المخزن الجديد بالكامل.
   */
  const existingSnapshot = options.forceRestart
    ? null
    : await getCachedStaffVisitorsSnapshot(eventId);

  if (existingSnapshot?.status === "COMPLETED" && !options.forceRestart) {
    return {
      eventId,

      status: "COMPLETED",

      downloadedCount: existingSnapshot.downloadedCount,
      totalCount: existingSnapshot.totalCount,

      completed: true,
      pausedOffline: false,

      snapshotId: existingSnapshot.snapshotId,
      snapshotAsOf: existingSnapshot.snapshotAsOf,
      changeCursor: existingSnapshot.changeCursor ?? null,
      nextCursor: null,
    };
  }

  let snapshotId = existingSnapshot?.snapshotId ?? null;
  let snapshotAsOf = existingSnapshot?.snapshotAsOf ?? null;
  let changeCursor = existingSnapshot?.changeCursor ?? null;

  let nextCursor = existingSnapshot?.nextCursor ?? null;

  let downloadedCount = existingSnapshot?.downloadedCount ?? 0;
  let totalCount = existingSnapshot?.totalCount ?? null;

  const startedAt = existingSnapshot?.startedAt ?? new Date().toISOString();

  await staffScannerDb.visitorSnapshots.put({
    eventId,

    snapshotId,
    snapshotAsOf,
    changeCursor,

    nextCursor,

    downloadedCount,
    totalCount,

    pageSize: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

    status: "DOWNLOADING",

    startedAt,
    updatedAt: new Date().toISOString(),
    completedAt: null,

    lastError: null,
  });

  try {
    while (true) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      if (!isBrowserOnline()) {
        const pausedAt = new Date().toISOString();

        await staffScannerDb.visitorSnapshots.put({
          eventId,

          snapshotId,
          snapshotAsOf,
          changeCursor,

          nextCursor,

          downloadedCount,
          totalCount,

          pageSize: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

          status: "PAUSED_OFFLINE",

          startedAt,
          updatedAt: pausedAt,
          completedAt: null,

          lastError: null,
        });

        options.onProgress?.({
          eventId,

          downloadedCount,
          totalCount,

          pageItems: 0,

          status: "PAUSED_OFFLINE",
        });

        return {
          eventId,

          status: "PAUSED_OFFLINE",

          downloadedCount,
          totalCount,

          completed: false,
          pausedOffline: true,

          snapshotId,
          snapshotAsOf,
          changeCursor,
          nextCursor,
        };
      }

      const response = await getStaffOfflineVisitorsSnapshot({
        cursor: nextCursor,

        limit: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

        signal: options.signal,
      });

      if (response.badgeTemplate) {
        await cacheStaffBadgeTemplateForOffline(
          eventId,
          response.badgeTemplate,
        );
      }

      if (response.snapshot.eventId !== eventId) {
        throw new Error("SNAPSHOT_EVENT_MISMATCH");
      }

      if (snapshotId && response.snapshot.id !== snapshotId) {
        throw new Error("SNAPSHOT_ID_MISMATCH");
      }

      if (snapshotAsOf && response.snapshot.snapshotAsOf !== snapshotAsOf) {
        throw new Error("SNAPSHOT_TIMESTAMP_MISMATCH");
      }

      snapshotId = response.snapshot.id;
      snapshotAsOf = response.snapshot.snapshotAsOf;

      if (
        changeCursor &&
        response.snapshot.changeCursor !== changeCursor
      ) {
        throw new Error("SNAPSHOT_CHANGE_CURSOR_MISMATCH");
      }

      changeCursor = response.snapshot.changeCursor;

      if (typeof response.snapshot.totalCount === "number") {
        totalCount = response.snapshot.totalCount;
      }
      const normalizedVisitors = response.visitors.map((visitor) =>
        normalizeCachedVisitor(eventId, visitor, "CACHED", snapshotId),
      );

      const pageItems = normalizedVisitors.length;

      const nextDownloadedCount = downloadedCount + pageItems;

      const nextSnapshotCursor = response.snapshot.nextCursor;

      const completed = !response.snapshot.hasMore || !nextSnapshotCursor;

      const now = new Date().toISOString();

      await staffScannerDb.transaction(
        "rw",

        staffScannerDb.visitors,
        staffScannerDb.visitorSnapshots,

        async () => {
          if (normalizedVisitors.length > 0) {
            await staffScannerDb.visitors.bulkPut(normalizedVisitors);
          }

          if (completed && snapshotId) {
            const staleVisitorIds = await staffScannerDb.visitors
              .where("eventId")
              .equals(eventId)
              .and((visitor) => {
                return (
                  visitor.syncStatus === "CACHED" &&
                  visitor.snapshotId !== snapshotId
                );
              })
              .primaryKeys();

            if (staleVisitorIds.length > 0) {
              await staffScannerDb.visitors.bulkDelete(staleVisitorIds);
            }
          }

          await staffScannerDb.visitorSnapshots.put({
            eventId,

            snapshotId,
            snapshotAsOf,
            changeCursor,

            nextCursor: completed ? null : nextSnapshotCursor,

            downloadedCount: nextDownloadedCount,
            totalCount,

            pageSize: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

            status: completed ? "COMPLETED" : "DOWNLOADING",

            startedAt,
            updatedAt: now,
            completedAt: completed ? now : null,

            lastError: null,
          });
        },
      );

      downloadedCount = nextDownloadedCount;
      nextCursor = completed ? null : nextSnapshotCursor;

      options.onProgress?.({
        eventId,

        downloadedCount,
        totalCount,

        pageItems,

        status: completed ? "COMPLETED" : "DOWNLOADING",
      });

      if (completed) {
        return {
          eventId,

          status: "COMPLETED",

          downloadedCount,
          totalCount,

          completed: true,
          pausedOffline: false,

          snapshotId,
          snapshotAsOf,
          changeCursor,
          nextCursor: null,
        };
      }

      await waitForBrowserFrame();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (!isBrowserOnline() || isLikelyNetworkFailure(error)) {
      const pausedAt = new Date().toISOString();

      await staffScannerDb.visitorSnapshots.put({
        eventId,

        snapshotId,
        snapshotAsOf,
        changeCursor,

        nextCursor,

        downloadedCount,
        totalCount,

        pageSize: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

        status: "PAUSED_OFFLINE",

        startedAt,
        updatedAt: pausedAt,
        completedAt: null,

        lastError: null,
      });

      return {
        eventId,

        status: "PAUSED_OFFLINE",

        downloadedCount,
        totalCount,

        completed: false,
        pausedOffline: true,

        snapshotId,
        snapshotAsOf,
        changeCursor,
        nextCursor,
      };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "UNKNOWN_SNAPSHOT_DOWNLOAD_ERROR";

    await staffScannerDb.visitorSnapshots.put({
      eventId,

      snapshotId,
      snapshotAsOf,
      changeCursor,

      nextCursor,

      downloadedCount,
      totalCount,

      pageSize: STAFF_VISITORS_SNAPSHOT_PAGE_SIZE,

      status: "FAILED",

      startedAt,
      updatedAt: new Date().toISOString(),
      completedAt: null,

      lastError: errorMessage,
    });

    throw error;
  }
}

export type SyncStaffVisitorChangesResult = {
  eventId: string;
  appliedChanges: number;
  deletedVisitors: number;
  upsertedVisitors: number;
  visitorsCount: number;
  latestCursor: string;
  nextCursor: string;
  requiresSnapshot: boolean;
};

export async function applyStaffVisitorChanges(
  eventId: string,
  response: Awaited<ReturnType<typeof getStaffVisitorChanges>>,
) {
  if (response.eventId !== eventId) {
    throw new Error("VISITOR_CHANGES_EVENT_MISMATCH");
  }

  const snapshot = await staffScannerDb.visitorSnapshots.get(eventId);

  if (!snapshot || snapshot.status !== "COMPLETED") {
    return {
      appliedChanges: 0,
      deletedVisitors: 0,
      upsertedVisitors: 0,
      requiresSnapshot: true,
    };
  }

  let deletedVisitors = 0;
  let upsertedVisitors = 0;

  await staffScannerDb.transaction(
    "rw",
    staffScannerDb.visitors,
    staffScannerDb.visitorSnapshots,
    async () => {
      for (const change of response.changes) {
        if (change.operation === "DELETE") {
          const existing = await staffScannerDb.visitors.get(
            change.registrationId,
          );

          /* Never delete an unsynced local operation because of a server
           * tombstone with a coincidentally matching ID. */
          if (
            existing &&
            existing.syncStatus !== "LOCAL_PENDING" &&
            existing.syncStatus !== "LOCAL_FAILED"
          ) {
            await staffScannerDb.visitors.delete(change.registrationId);
            deletedVisitors += 1;
          }

          continue;
        }

        if (!change.visitor) {
          continue;
        }

        const existing = await staffScannerDb.visitors.get(change.visitor.id);

        /* A local pending edit contains newer device-side values. Keep it
         * until its own update queue is synchronized. */
        if (
          existing?.syncStatus === "LOCAL_PENDING" ||
          existing?.syncStatus === "LOCAL_FAILED"
        ) {
          continue;
        }

        const normalized = normalizeCachedVisitor(
          eventId,
          change.visitor,
          "CACHED",
          snapshot.snapshotId,
        );

        await staffScannerDb.visitors.put(normalized);
        upsertedVisitors += 1;
      }

      const now = new Date().toISOString();

      await staffScannerDb.visitorSnapshots.put({
        ...snapshot,
        changeCursor: response.nextCursor,
        serverRevision: response.nextCursor,
        downloadedCount: response.visitorsCount,
        totalCount: response.visitorsCount,
        status: "COMPLETED",
        nextCursor: null,
        updatedAt: now,
        completedAt: snapshot.completedAt ?? now,
        lastError: null,
      });
    },
  );

  return {
    appliedChanges: response.changes.length,
    deletedVisitors,
    upsertedVisitors,
    requiresSnapshot: false,
  };
}

export async function syncStaffVisitorChanges(options: {
  eventId: string;
  signal?: AbortSignal;
  limit?: number;
}): Promise<SyncStaffVisitorChangesResult> {
  const eventId = options.eventId.trim();
  const snapshot = await staffScannerDb.visitorSnapshots.get(eventId);

  if (!snapshot || snapshot.status !== "COMPLETED") {
    return {
      eventId,
      appliedChanges: 0,
      deletedVisitors: 0,
      upsertedVisitors: 0,
      visitorsCount: snapshot?.totalCount ?? 0,
      latestCursor: normalizeVisitorChangeCursor(snapshot?.serverRevision),
      nextCursor: normalizeVisitorChangeCursor(snapshot?.changeCursor),
      requiresSnapshot: true,
    };
  }

  let after = normalizeVisitorChangeCursor(
    snapshot.changeCursor ?? snapshot.serverRevision,
  );
  let appliedChanges = 0;
  let deletedVisitors = 0;
  let upsertedVisitors = 0;
  let visitorsCount = snapshot.totalCount ?? snapshot.downloadedCount;
  let latestCursor = normalizeVisitorChangeCursor(
    snapshot.serverRevision ?? after,
  );

  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const response = await getStaffVisitorChanges({
      after,
      limit: options.limit ?? 500,
      signal: options.signal,
    });

    const applied = await applyStaffVisitorChanges(eventId, response);

    if (applied.requiresSnapshot) {
      return {
        eventId,
        appliedChanges,
        deletedVisitors,
        upsertedVisitors,
        visitorsCount,
        latestCursor,
        nextCursor: after,
        requiresSnapshot: true,
      };
    }

    appliedChanges += applied.appliedChanges;
    deletedVisitors += applied.deletedVisitors;
    upsertedVisitors += applied.upsertedVisitors;
    visitorsCount = response.visitorsCount;
    latestCursor = response.latestCursor;
    after = response.nextCursor;

    if (!response.hasMore) {
      return {
        eventId,
        appliedChanges,
        deletedVisitors,
        upsertedVisitors,
        visitorsCount,
        latestCursor,
        nextCursor: after,
        requiresSnapshot: false,
      };
    }
  }
}

/**
 * Visitors cache and search
 */
export async function replaceCachedStaffVisitorsForEvent(
  eventId: string,
  visitors: StaffVisitor[],
) {
  if (!eventId) {
    return;
  }

  const currentLocalVisitors = await staffScannerDb.visitors
    .where("eventId")
    .equals(eventId)
    .and((visitor) => visitor.syncStatus !== "CACHED")
    .toArray();

  const cachedVisitors = visitors.map((visitor) =>
    normalizeCachedVisitor(eventId, visitor, "CACHED"),
  );

  const mergedVisitors = new Map<string, CachedStaffVisitor>();

  /*
   * أولًا نضيف Snapshot السيرفر.
   */
  for (const visitor of cachedVisitors) {
    mergedVisitors.set(visitor.id, visitor);
  }

  /*
   * التسجيل المحلي المعلّق يجب أن يبقى دائمًا.
   *
   * التسجيل المحلي المتزامن يبقى مؤقتًا فقط عندما
   * لم يظهر بعد في Snapshot السيرفر، لمنع اختفائه
   * بسبب تأخر القراءة أو الـreplication.
   */
  for (const localVisitor of currentLocalVisitors) {
    if (
      localVisitor.syncStatus === "LOCAL_PENDING" ||
      localVisitor.syncStatus === "LOCAL_FAILED"
    ) {
      mergedVisitors.set(localVisitor.id, localVisitor);

      continue;
    }

    if (
      isLocalSyncedVisitorRecent(localVisitor) &&
      !mergedVisitors.has(localVisitor.id)
    ) {
      mergedVisitors.set(localVisitor.id, localVisitor);
    }
  }

  const finalVisitors = [...mergedVisitors.values()];

  /*
   * Dexie transaction تمنع مرحلة حذف ناجحة ثم كتابة
   * فاشلة من ترك قاعدة الزوار فارغة.
   */
  await staffScannerDb.transaction("rw", staffScannerDb.visitors, async () => {
    await staffScannerDb.visitors.where("eventId").equals(eventId).delete();

    await bulkPutVisitorsInChunks(finalVisitors);
  });
}

export async function getCachedStaffVisitorsCount(eventId: string) {
  if (!eventId) {
    return 0;
  }

  return staffScannerDb.visitors.where("eventId").equals(eventId).count();
}

export async function cacheStaffVisitors(
  eventId: string,
  visitors: StaffVisitor[],
  syncStatus: CachedStaffVisitorSyncStatus = "CACHED",
) {
  if (!eventId || visitors.length === 0) {
    return;
  }

  const cachedVisitors = visitors.map((visitor) =>
    normalizeCachedVisitor(eventId, visitor, syncStatus, null),
  );

  const existingVisitors = await staffScannerDb.visitors.bulkGet(
    cachedVisitors.map((visitor) => visitor.id),
  );

  const safeVisitors = cachedVisitors.map((visitor, index) => {
    const existing = existingVisitors[index];

    /*
     * نتيجة بحث Online لا يجوز أن تكتب فوق تعديل محلي لم يصل إلى السيرفر
     * بعد. Delta sync سيستبدل السجل بعد نجاح طابور التعديل.
     */
    if (
      existing?.eventId === eventId &&
      (existing.syncStatus === "LOCAL_PENDING" ||
        existing.syncStatus === "LOCAL_FAILED")
    ) {
      return existing;
    }

    return visitor;
  });

  await bulkPutVisitorsInChunks(safeVisitors);
}

export async function searchCachedStaffVisitors(
  eventId: string,
  search = "",
  limit = 20,
) {
  const query = normalizeSearchValue(search);

  const visitors = await staffScannerDb.visitors
    .where("eventId")
    .equals(eventId)
    .toArray();

  const filtered = query
    ? visitors.filter((visitor) => {
        return visitor.searchText.includes(query);
      })
    : visitors;

  const sorted = filtered.sort((left, right) => {
    const localPriority = (visitor: CachedStaffVisitor) => {
      if (visitor.syncStatus === "LOCAL_PENDING") {
        return 0;
      }

      if (visitor.syncStatus === "LOCAL_FAILED") {
        return 1;
      }

      if (visitor.syncStatus === "LOCAL_SYNCED") {
        return 2;
      }

      return 3;
    };

    const priorityDifference = localPriority(left) - localPriority(right);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });

  return {
    event: {
      id: eventId,
    },

    visitors: {
      items: sorted.slice(0, Math.max(1, limit)),

      page: 1,
      limit: Math.max(1, limit),

      total: filtered.length,

      totalPages:
        filtered.length === 0
          ? 0
          : Math.ceil(filtered.length / Math.max(1, limit)),
    },
  };
}

export async function findCachedStaffVisitorByQr(
  eventId: string,
  qrToken: string,
) {
  const token = qrToken.trim();

  if (!eventId || !token) {
    return null;
  }

  /*
   * البحث السريع باستخدام MultiEntry Index.
   */
  const indexedVisitor = await staffScannerDb.visitors
    .where("qrLookupKeys")
    .equals(token)
    .and((visitor) => visitor.eventId === eventId)
    .first();

  if (indexedVisitor) {
    return indexedVisitor;
  }

  /*
   * Fallback للسجلات القديمة أو السجلات التي لم
   * يتم بناء الفهرس لها بعد.
   */
  const eventVisitors = await staffScannerDb.visitors
    .where("eventId")
    .equals(eventId)
    .toArray();

  const visitor =
    eventVisitors.find((item) => {
      const keys = buildVisitorQrLookupKeys(item);

      return keys.includes(token);
    }) ?? null;

  if (visitor) {
    const qrLookupKeys = buildVisitorQrLookupKeys(visitor);

    await staffScannerDb.visitors.update(visitor.id, {
      qrLookupKeys,
    });

    return {
      ...visitor,
      qrLookupKeys,
    };
  }

  return null;
}

export async function saveCachedStaffVisitorQr(options: {
  eventId: string;
  registrationId: string;
  qrToken: string;
  qrImageUrl?: string | null;
}) {
  const eventId = options.eventId.trim();
  const registrationId = options.registrationId.trim();
  const qrToken = options.qrToken.trim();

  if (!eventId || !registrationId || !qrToken) {
    return null;
  }

  const visitor = await staffScannerDb.visitors.get(registrationId);

  if (!visitor || visitor.eventId !== eventId) {
    return null;
  }

  const generatedQrImageUrl =
    options.qrImageUrl?.trim() ||
    (await generateLocalQrImage(qrToken, visitor.qrImageUrl));

  const updatedVisitor: CachedStaffVisitor = {
    ...visitor,

    qrToken,

    /*
     * اترك هذا السطر فقط إذا كنت أضفت
     * canonicalQrToken داخل CachedStaffVisitor.
     */
    canonicalQrToken: qrToken,

    qrImageUrl: generatedQrImageUrl || null,

    qr: {
      ...(visitor.qr ?? {}),

      qrToken,
      token: qrToken,
      compactQrToken: qrToken,

      qrImageUrl: generatedQrImageUrl || null,
      imageUrl: generatedQrImageUrl || null,
      publicUrl: generatedQrImageUrl || null,

      status: "ACTIVE",
    },

    updatedAt: new Date().toISOString(),
  };

  updatedVisitor.searchText = buildVisitorSearchText(updatedVisitor);

  updatedVisitor.qrLookupKeys = buildVisitorQrLookupKeys(updatedVisitor);

  await staffScannerDb.visitors.put(updatedVisitor);

  return updatedVisitor;
}

/**
 * Offline visitor update queue
 */

function mergeVisitorUpdate(
  visitor: CachedStaffVisitor,
  changes: UpdateStaffVisitorPayload,
): CachedStaffVisitor {
  const updatedVisitor: CachedStaffVisitor = {
    ...visitor,

    ...(changes.fullName !== undefined ? { fullName: changes.fullName } : {}),

    ...(changes.phone !== undefined ? { phone: changes.phone } : {}),

    ...(changes.email !== undefined ? { email: changes.email } : {}),

    ...(changes.companyName !== undefined
      ? { companyName: changes.companyName }
      : {}),

    ...(changes.jobTitle !== undefined ? { jobTitle: changes.jobTitle } : {}),

    ...(changes.notes !== undefined ? { notes: changes.notes } : {}),

    ...(changes.customFields !== undefined
      ? { customFields: changes.customFields }
      : {}),

    syncStatus: "LOCAL_PENDING",

    /*
     * هذا تاريخ تعديل الجهاز، وليس تاريخ نسخة السيرفر.
     * expectedUpdatedAt يبقى محفوظًا داخل Queue.
     */
    updatedAt: new Date().toISOString(),
  };

  updatedVisitor.searchText = buildVisitorSearchText(updatedVisitor);

  return updatedVisitor;
}

export async function queueStaffVisitorUpdate(options: {
  eventId: string;
  registrationId: string;
  changes: UpdateStaffVisitorPayload;
}) {
  const eventId = options.eventId.trim();
  const registrationId = options.registrationId.trim();

  if (!eventId) {
    throw new Error("EVENT_ID_IS_REQUIRED");
  }

  if (!registrationId) {
    throw new Error("REGISTRATION_ID_IS_REQUIRED");
  }

  const visitor = await staffScannerDb.visitors.get(registrationId);

  if (!visitor || visitor.eventId !== eventId) {
    throw new Error("CACHED_VISITOR_NOT_FOUND");
  }

  /*
   * التسجيل المحلي الجديد لم يحصل بعد على ID رسمي من السيرفر.
   * تعديله يتم على نفس السجل المحلي، ولا ننشئ PATCH منفصلًا له.
   */
  const isOfflineLocalVisitor =
    visitor.id.startsWith("offline-visitor-") ||
    Boolean(visitor.offlineLocalId) ||
    Boolean(visitor.offlineOperationId);

  /*
   * أي تسجيل محلي لم يحصل على ID رسمي بعد،
   * سواء كان PENDING أو FAILED، يجب تعديل عملية
   * التسجيل الأصلية وعدم إرسال PATCH إلى السيرفر.
   */
  if (isOfflineLocalVisitor) {
    const updatedVisitor = mergeVisitorUpdate(visitor, options.changes);

    const queuedRegistration = await staffScannerDb.visitorRegistrations
      .where("localId")
      .equals(visitor.id)
      .first();

    if (!queuedRegistration?.id) {
      throw new Error("OFFLINE_REGISTRATION_QUEUE_NOT_FOUND");
    }

    await staffScannerDb.transaction(
      "rw",
      staffScannerDb.visitors,
      staffScannerDb.visitorRegistrations,
      async () => {
        await staffScannerDb.visitors.put({
          ...updatedVisitor,

          status: "PENDING_OFFLINE",
          syncStatus: "LOCAL_PENDING",

          updatedAt: new Date().toISOString(),
        });

        await staffScannerDb.visitorRegistrations.update(
          queuedRegistration.id!,
          {
            fullName: updatedVisitor.fullName,
            phone: updatedVisitor.phone ?? null,
            email: updatedVisitor.email ?? null,

            customFields: updatedVisitor.customFields ?? {},

            status: "PENDING",
            retryable: true,

            errorCode: null,
            errorMessage: null,

            lastAttemptAt: null,
            syncedAt: null,
          },
        );
      },
    );

    return {
      visitor: {
        ...updatedVisitor,
        status: "PENDING_OFFLINE",
        syncStatus: "LOCAL_PENDING",
      },

      queued: null,
      mergedIntoOfflineRegistration: true,
    };
  }

  const now = new Date().toISOString();

  /*
   * نعتمد تاريخ السيرفر الموجود قبل أول تعديل محلي.
   */
  const existingPendingUpdate = await staffScannerDb.visitorUpdates
    .where("registrationId")
    .equals(registrationId)
    .and((item) => {
      return (
        item.status === "PENDING" ||
        item.status === "FAILED" ||
        item.status === "SYNCING"
      );
    })
    .first();

  const expectedUpdatedAt =
    existingPendingUpdate?.expectedUpdatedAt ?? visitor.updatedAt ?? null;

  const mergedChanges: UpdateStaffVisitorPayload = {
    ...(existingPendingUpdate?.changes ?? {}),
    ...options.changes,

    customFields:
      options.changes.customFields !== undefined
        ? options.changes.customFields
        : existingPendingUpdate?.changes.customFields,
  };

  const updatedVisitor = mergeVisitorUpdate(visitor, mergedChanges);

  let queuedUpdate: QueuedStaffVisitorUpdate;

  await staffScannerDb.transaction(
    "rw",
    staffScannerDb.visitors,
    staffScannerDb.visitorUpdates,
    async () => {
      await staffScannerDb.visitors.put(updatedVisitor);

      if (existingPendingUpdate?.id) {
        queuedUpdate = {
          ...existingPendingUpdate,

          expectedUpdatedAt,
          changes: mergedChanges,

          status: "PENDING",
          retryable: true,

          errorCode: null,
          errorMessage: null,

          updatedAt: now,
          syncedAt: null,
        };

        await staffScannerDb.visitorUpdates.put(queuedUpdate);

        return;
      }

      queuedUpdate = {
        operationId: createRandomId("visitor-update"),

        eventId,
        registrationId,

        expectedUpdatedAt,
        changes: mergedChanges,

        status: "PENDING",
        retryable: true,

        errorCode: null,
        errorMessage: null,

        attemptCount: 0,
        lastAttemptAt: null,

        createdAt: now,
        updatedAt: now,
        syncedAt: null,

        response: null,
      };

      const id = await staffScannerDb.visitorUpdates.add(queuedUpdate);

      queuedUpdate.id = id;
    },
  );

  return {
    visitor: updatedVisitor,
    queued: queuedUpdate!,
    mergedIntoOfflineRegistration: false,
  };
}

export async function getPendingStaffVisitorUpdatesCount() {
  const [pending, failed, syncing] = await Promise.all([
    staffScannerDb.visitorUpdates.where("status").equals("PENDING").count(),

    staffScannerDb.visitorUpdates
      .where("status")
      .equals("FAILED")
      .and((item) => item.retryable !== false)
      .count(),

    staffScannerDb.visitorUpdates.where("status").equals("SYNCING").count(),
  ]);

  return pending + failed + syncing;
}

export async function getPermanentFailedStaffVisitorUpdatesCount() {
  return staffScannerDb.visitorUpdates
    .where("status")
    .equals("PERMANENT_FAILED")
    .count();
}

export async function getQueuedStaffVisitorUpdates() {
  return staffScannerDb.visitorUpdates.orderBy("createdAt").toArray();
}

export async function syncQueuedStaffVisitorUpdates(options: {
  updateVisitor: (
    registrationId: string,
    payload: UpdateStaffVisitorPayload,
  ) => Promise<UpdateStaffVisitorResponse>;
}) {
  const executed = await runWithOfflineSyncLock(async () => {
    const queuedUpdates = await staffScannerDb.visitorUpdates
      .where("status")
      .anyOf(["PENDING", "FAILED"])
      .filter((item) => item.retryable !== false)
      .sortBy("createdAt");

    const result = {
      total: queuedUpdates.length,
      synced: 0,
      failed: 0,
      permanentFailed: 0,
      skipped: 0,
    };

    for (const queued of queuedUpdates) {
      if (!queued.id) {
        result.skipped += 1;
        continue;
      }

      const attemptAt = new Date().toISOString();

      await staffScannerDb.visitorUpdates.update(queued.id, {
        status: "SYNCING",

        attemptCount: (queued.attemptCount ?? 0) + 1,

        lastAttemptAt: attemptAt,

        errorCode: null,
        errorMessage: null,
      });

      try {
        const response = await options.updateVisitor(queued.registrationId, {
          ...queued.changes,

          expectedUpdatedAt: queued.expectedUpdatedAt ?? undefined,
        });

        const currentVisitor = await staffScannerDb.visitors.get(
          queued.registrationId,
        );

        if (currentVisitor) {
          const syncedVisitor: CachedStaffVisitor = {
            ...currentVisitor,

            ...response,

            attendeeType: response.attendeeType ?? currentVisitor.attendeeType,

            customFields:
              response.customFields ?? currentVisitor.customFields ?? {},

            syncStatus: "LOCAL_SYNCED",

            updatedAt: response.updatedAt || new Date().toISOString(),
          };

          syncedVisitor.searchText = buildVisitorSearchText(syncedVisitor);

          await staffScannerDb.transaction(
            "rw",
            staffScannerDb.visitors,
            staffScannerDb.visitorUpdates,
            async () => {
              await staffScannerDb.visitors.put(syncedVisitor);

              await staffScannerDb.visitorUpdates.update(queued.id!, {
                status: "SYNCED",

                retryable: false,

                syncedAt: new Date().toISOString(),

                updatedAt: new Date().toISOString(),

                errorCode: null,
                errorMessage: null,

                response,
              });
            },
          );
        } else {
          await staffScannerDb.visitorUpdates.update(queued.id, {
            status: "SYNCED",
            retryable: false,
            syncedAt: new Date().toISOString(),
            response,
          });
        }

        result.synced += 1;
      } catch (error) {
        const classified = classifyQueueError(error);

        /*
         * 409 يعني أن نسخة السيرفر تغيرت بعد تنزيلها.
         * لا نعيد المحاولة تلقائيًا حتى لا نكتب فوق بيانات أحدث.
         */
        const conflict =
          classified.httpStatus === 409 ||
          classified.code === "VISITOR_UPDATE_CONFLICT";

        const retryable = conflict ? false : classified.retryable;

        await staffScannerDb.transaction(
          "rw",
          staffScannerDb.visitors,
          staffScannerDb.visitorUpdates,
          async () => {
            await staffScannerDb.visitorUpdates.update(queued.id!, {
              status: retryable ? "FAILED" : "PERMANENT_FAILED",

              retryable,

              errorCode: conflict ? "VISITOR_UPDATE_CONFLICT" : classified.code,

              errorMessage: classified.message,

              lastAttemptAt: new Date().toISOString(),

              updatedAt: new Date().toISOString(),
            });

            await staffScannerDb.visitors.update(queued.registrationId, {
              syncStatus: retryable ? "LOCAL_PENDING" : "LOCAL_FAILED",
            });
          },
        );

        if (retryable) {
          result.failed += 1;
        } else {
          result.permanentFailed += 1;
        }
      }
    }

    return result;
  });

  if (!executed) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      permanentFailed: 0,
      skipped: 0,
      busy: true,
    };
  }

  return {
    ...executed,
    busy: false,
  };
}

/**
 * Offline visitor registration queue
 */
export async function addOfflineVisitorRegistration(options: {
  eventId: string;
  payload: PublicRegisterPayload;
  attendeeType?: PublicAttendeeType | null;

  localId: string;
  operationId: string;
  publicId: string;
  createdAtDevice: string;

  issuerDeviceId: string;
  issuerKeyVersion: number;

  offlineQrToken: string;
  signedOfflineQr: string;
  offlineQrImageUrl: string;
}) {
  const existingByOperation = await staffScannerDb.visitorRegistrations
    .where("operationId")
    .equals(options.operationId)
    .first();

  if (existingByOperation) {
    const existingVisitor = await staffScannerDb.visitors.get(
      existingByOperation.localId,
    );

    return {
      queued: existingByOperation,
      visitor: existingVisitor ?? null,
    };
  }

  const existingByLocalId = await staffScannerDb.visitorRegistrations
    .where("localId")
    .equals(options.localId)
    .first();

  if (existingByLocalId) {
    const existingVisitor = await staffScannerDb.visitors.get(
      existingByLocalId.localId,
    );

    return {
      queued: existingByLocalId,
      visitor: existingVisitor ?? null,
    };
  }

  const queued: QueuedStaffVisitorRegistration = {
    operationId: options.operationId,
    localId: options.localId,
    publicId: options.publicId,

    eventId: options.eventId,
    attendeeTypeId: options.payload.attendeeTypeId,

    issuerDeviceId: options.issuerDeviceId,

    issuerKeyVersion: options.issuerKeyVersion,

    fullName: options.payload.fullName,
    phone: options.payload.phone ?? null,
    email: options.payload.email ?? null,

    customFields: options.payload.customFields ?? {},

    attendeeType: options.attendeeType ?? null,

    offlineQrToken: options.offlineQrToken,

    signedOfflineQr: options.signedOfflineQr,

    offlineQrImageUrl: options.offlineQrImageUrl,

    status: "PENDING",

    retryable: true,

    attemptCount: 0,
    lastAttemptAt: null,

    errorCode: null,
    errorMessage: null,

    createdAtDevice: options.createdAtDevice,

    createdAt: options.createdAtDevice,

    syncedAt: null,

    backendRegistrationId: null,
    backendPublicId: null,

    canonicalQrToken: null,

    response: null,
  };

  const localVisitor: CachedStaffVisitor = {
    id: options.localId,
    publicId: options.publicId,

    fullName: options.payload.fullName,

    phone: options.payload.phone ?? null,

    email: options.payload.email ?? null,

    status: "PENDING_OFFLINE",

    customFields: options.payload.customFields ?? {},

    registeredAt: options.createdAtDevice,

    createdAt: options.createdAtDevice,

    attendeeType: toStaffVisitorAttendeeType(options.attendeeType),

    /*
     * الرمز الأساسي هو الرمز القصير المطبوع.
     */
    qrToken: options.offlineQrToken,

    qr: {
      qrToken: options.offlineQrToken,
      token: options.offlineQrToken,
      value: options.offlineQrToken,

      /*
       * نحتفظ بالتوكن الكامل كقيمة إضافية،
       * لكن لا نستخدمه في صورة QR.
       */
      signedToken: options.signedOfflineQr,

      qrImageUrl: options.offlineQrImageUrl,
      offlineQrToken: options.offlineQrToken,

      offlineSignedQr: options.signedOfflineQr,

      canonicalQrToken: null,
      imageUrl: options.offlineQrImageUrl,
      publicUrl: options.offlineQrImageUrl,

      status: "OFFLINE_PENDING",
    },

    qrImageUrl: options.offlineQrImageUrl,

    eventId: options.eventId,

    attendeeTypeId: options.payload.attendeeTypeId,

    searchText: "",
    syncStatus: "LOCAL_PENDING",

    offlineLocalId: options.localId,

    offlineOperationId: options.operationId,

    /*
     * الرمز القصير الذي يجب استخدامه في صورة QR.
     */
    offlineQrToken: options.offlineQrToken,

    /*
     * الرمز الكامل يبقى للمزامنة والتحقق فقط.
     */
    offlineSignedQr: options.signedOfflineQr,

    canonicalQrToken: null,

    qrLookupKeys: [],

    updatedAt: options.createdAtDevice,
  };

  localVisitor.searchText = buildVisitorSearchText(localVisitor);

  localVisitor.qrLookupKeys = buildVisitorQrLookupKeys(localVisitor);

  await staffScannerDb.transaction(
    "rw",

    staffScannerDb.visitorRegistrations,
    staffScannerDb.visitors,

    async () => {
      await staffScannerDb.visitorRegistrations.add(queued);

      await staffScannerDb.visitors.put(localVisitor);
    },
  );

  return {
    queued,
    visitor: localVisitor,
  };
}

export async function getPendingOfflineVisitorRegistrationsCount() {
  await resetStaleSyncingRegistrations();

  const [pending, failed, syncing] = await Promise.all([
    staffScannerDb.visitorRegistrations
      .where("status")
      .equals("PENDING")
      .count(),

    staffScannerDb.visitorRegistrations
      .where("status")
      .equals("FAILED")
      .and((registration) => registration.retryable !== false)
      .count(),

    staffScannerDb.visitorRegistrations
      .where("status")
      .equals("SYNCING")
      .count(),
  ]);

  return pending + failed + syncing;
}

export async function getPermanentFailedOfflineVisitorRegistrationsCount() {
  return staffScannerDb.visitorRegistrations
    .where("status")
    .anyOf(PERMANENT_QUEUE_STATUSES)
    .count();
}

export async function getPendingOfflineWorkCount() {
  const [scansCount, registrationsCount, updatesCount] = await Promise.all([
    getPendingScansCount(),
    getPendingOfflineVisitorRegistrationsCount(),
    getPendingStaffVisitorUpdatesCount(),
  ]);

  return scansCount + registrationsCount + updatesCount;
}

export async function getPermanentFailedOfflineWorkCount() {
  const [scansCount, registrationsCount, updatesCount] = await Promise.all([
    getPermanentFailedScansCount(),
    getPermanentFailedOfflineVisitorRegistrationsCount(),
    getPermanentFailedStaffVisitorUpdatesCount(),
  ]);

  return scansCount + registrationsCount + updatesCount;
}

export async function getPendingQueuedVisitorRegistrations() {
  await resetStaleSyncingRegistrations();

  const registrations = await staffScannerDb.visitorRegistrations
    .where("status")
    .anyOf(RETRYABLE_QUEUE_STATUSES)
    .filter((registration) => registration.retryable !== false)
    .toArray();

  return registrations.sort((left, right) => {
    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

export async function syncQueuedVisitorRegistrations(options: {
  registerVisitor: (
    eventId: string,
    payload: PublicRegisterPayload,
  ) => Promise<PublicRegisterResponse>;
}) {
  const executed = await runWithOfflineSyncLock(
    async (): Promise<SyncQueuedVisitorRegistrationsResult> => {
      await resetStaleSyncingOperations();

      const pendingRegistrations = await getPendingQueuedVisitorRegistrations();

      const result: SyncQueuedVisitorRegistrationsResult = {
        total: pendingRegistrations.length,
        synced: 0,
        failed: 0,
        permanentFailed: 0,
        skipped: 0,
      };

      for (const queued of pendingRegistrations) {
        if (!queued.id) {
          result.skipped += 1;
          continue;
        }

        if (!queued.signedOfflineQr) {
          const legacyError: QueueErrorDetails = {
            code: "LEGACY_UNSIGNED_OFFLINE_QR",

            message:
              "LEGACY_UNSIGNED_OFFLINE_QR: يجب إعادة إنشاء التسجيل أثناء الاتصال.",

            retryable: false,
          };

          await staffScannerDb.transaction(
            "rw",

            staffScannerDb.visitorRegistrations,
            staffScannerDb.visitors,
            staffScannerDb.scans,

            async () => {
              await staffScannerDb.visitorRegistrations.update(queued.id!, {
                status: "PERMANENT_FAILED",

                retryable: false,

                errorCode: legacyError.code,

                errorMessage: legacyError.message,

                lastAttemptAt: new Date().toISOString(),
              });

              await staffScannerDb.visitors.update(queued.localId, {
                status: "FAILED_OFFLINE_SYNC",

                syncStatus: "LOCAL_FAILED",

                updatedAt: new Date().toISOString(),
              });

              await permanentlyFailDependentScans(queued, legacyError);
            },
          );

          result.permanentFailed += 1;
          continue;
        }

        const attemptAt = new Date().toISOString();

        await staffScannerDb.visitorRegistrations.update(queued.id, {
          status: "SYNCING",

          attemptCount: (queued.attemptCount ?? 0) + 1,

          lastAttemptAt: attemptAt,

          errorCode: null,
          errorMessage: null,
        });

        try {
          const response = await options.registerVisitor(queued.eventId, {
            attendeeTypeId: queued.attendeeTypeId,

            fullName: queued.fullName,

            phone: queued.phone ?? "",

            email: queued.email ?? undefined,

            customFields: queued.customFields ?? {},

            externalId: queued.operationId,

            offlineOperationId: queued.operationId,

            offlineRegistrationId: queued.localId,

            offlinePublicId: queued.publicId,

            offlineQrToken: queued.offlineQrToken,

            signedOfflineQr: queued.signedOfflineQr,

            notes:
              "Created securely offline from staff scanner and synced later.",
          });

          const syncMetadata = readSyncMetadata(response);

          const canonicalRegistrationId = firstString(
            syncMetadata.canonicalRegistrationId,
            response.registration?.id,
            response.id,
          );

          if (!canonicalRegistrationId) {
            throw new StaffOfflineSyncError(
              "Canonical registration ID is missing after synchronization.",
              {
                code: "CANONICAL_REGISTRATION_ID_MISSING",

                retryable: true,
              },
            );
          }

          const syncedVisitor = toStaffVisitorFromRegisterResponse(
            response,
            queued,
          );

          /*
           * البادج ربما طُبع أثناء Offline باستخدام signedOfflineQr.
           * لذلك نحافظ على نفس التوكن بعد المزامنة.
           *
           * canonicalQrToken يبقى محفوظًا كتوكن إضافي للسيرفر،
           * لكنه لا يستبدل التوكن المطبوع.
           */
          const canonicalQrToken =
            firstString(
              syncMetadata.canonicalQrToken,
              readQrToken(syncedVisitor.qrToken),
            ) ?? null;

          /*
           * بعد المزامنة نستخدم QR الرسمي المختصر.
           *
           * عند عدم وصوله لأي سبب، نستخدم رمز O2 المختصر.
           */
          const effectiveQrToken = canonicalQrToken || queued.offlineQrToken;

          const generatedQrImageUrl = await generateLocalQrImage(
            effectiveQrToken,
            syncedVisitor.qrImageUrl ?? queued.offlineQrImageUrl,
          );

          const visitorWithQr: StaffVisitor = {
            ...syncedVisitor,

            id: canonicalRegistrationId,

            qrToken: effectiveQrToken,

            qrImageUrl: generatedQrImageUrl || null,

            qr: {
              qrToken: effectiveQrToken,

              token: effectiveQrToken,

              qrImageUrl: generatedQrImageUrl || null,

              imageUrl: generatedQrImageUrl || null,

              publicUrl: generatedQrImageUrl || null,

              status: syncMetadata.canonicalQrToken
                ? "ACTIVE"
                : "OFFLINE_VERIFIED",
            },
          };
          const cachedSyncedVisitor = normalizeCachedVisitor(
            queued.eventId,
            visitorWithQr,
            "LOCAL_SYNCED",
          );

          cachedSyncedVisitor.offlineLocalId = queued.localId;

          cachedSyncedVisitor.offlineOperationId = queued.operationId;

          cachedSyncedVisitor.offlineSignedQr = queued.signedOfflineQr;
          cachedSyncedVisitor.offlineQrToken = queued.offlineQrToken;

          cachedSyncedVisitor.canonicalQrToken = canonicalQrToken;

          cachedSyncedVisitor.qrLookupKeys =
            buildVisitorQrLookupKeys(cachedSyncedVisitor);

          cachedSyncedVisitor.updatedAt = new Date().toISOString();

          const canonicalPublicId =
            firstString(
              syncMetadata.canonicalPublicId,
              syncedVisitor.publicId,
              queued.publicId,
            ) ?? null;

          await staffScannerDb.transaction(
            "rw",

            staffScannerDb.visitorRegistrations,
            staffScannerDb.visitors,
            staffScannerDb.scans,

            async () => {
              /*
               * نحذف النسخة المحلية فقط بعد تجهيز النسخة
               * القانونية الجديدة بالكامل.
               */
              if (queued.localId !== canonicalRegistrationId) {
                await staffScannerDb.visitors.delete(queued.localId);
              }

              await staffScannerDb.visitors.put(cachedSyncedVisitor);

              await updateDependentScansAfterRegistrationSync(
                queued,
                canonicalRegistrationId,
                effectiveQrToken,
              );

              await staffScannerDb.visitorRegistrations.update(queued.id!, {
                status: "SYNCED",
                retryable: false,
                syncedAt: new Date().toISOString(),

                errorCode: null,
                errorMessage: null,

                backendRegistrationId: canonicalRegistrationId,
                backendPublicId: canonicalPublicId,

                canonicalQrToken,

                response,
              });
            },
          );

          result.synced += 1;
        } catch (error) {
          const classified = classifyQueueError(error);

          await staffScannerDb.transaction(
            "rw",

            staffScannerDb.visitorRegistrations,
            staffScannerDb.visitors,
            staffScannerDb.scans,

            async () => {
              await staffScannerDb.visitorRegistrations.update(queued.id!, {
                status: classified.retryable ? "FAILED" : "PERMANENT_FAILED",

                retryable: classified.retryable,

                errorCode: classified.code,

                errorMessage: classified.message,

                lastAttemptAt: new Date().toISOString(),
              });

              await staffScannerDb.visitors.update(queued.localId, {
                status: classified.retryable
                  ? "PENDING_OFFLINE"
                  : "FAILED_OFFLINE_SYNC",

                syncStatus: classified.retryable
                  ? "LOCAL_PENDING"
                  : "LOCAL_FAILED",

                updatedAt: new Date().toISOString(),
              });

              if (!classified.retryable) {
                await permanentlyFailDependentScans(queued, classified);
              }
            },
          );

          if (classified.retryable) {
            result.failed += 1;
          } else {
            result.permanentFailed += 1;
          }
        }
      }

      return result;
    },
  );

  if (!executed) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      permanentFailed: 0,
      skipped: 0,
      busy: true,
    } satisfies SyncQueuedVisitorRegistrationsResult;
  }

  return executed;
}

/**
 * QR image cache hydration
 */
export async function hydrateVisitorQrImagesFromCache(
  visitors: StaffVisitor[],
) {
  return Promise.all(
    visitors.map(async (visitor) => {
      const remoteUrl =
        visitor.qrImageUrl || visitor.imageUrl || visitor.publicUrl || "";

      if (!remoteUrl || remoteUrl.startsWith("data:")) {
        return visitor;
      }

      const cached = await getCachedScannerAsset(remoteUrl);

      if (!cached?.dataUrl) {
        return visitor;
      }

      return {
        ...visitor,
        qrImageUrl: cached.dataUrl,
      };
    }),
  );
}

/**
 * Badge template cache
 */
export async function saveCachedStaffBadgeTemplate(
  eventId: string,
  template: StaffBadgeTemplate | null | undefined,
) {
  if (!eventId) {
    return;
  }

  await staffScannerDb.badgeTemplates.put({
    eventId,

    template: template ?? null,

    savedAt: new Date().toISOString(),
  });
}

export async function getCachedStaffBadgeTemplate(eventId: string) {
  if (!eventId) {
    return null;
  }

  return staffScannerDb.badgeTemplates.get(eventId);
}

export async function cacheStaffBadgeTemplateForOffline(
  eventId: string,
  template: StaffBadgeTemplate | null | undefined,
) {
  if (!eventId) {
    return null;
  }

  if (!template) {
    await saveCachedStaffBadgeTemplate(eventId, null);

    return null;
  }

  const remoteBackgroundUrl =
    template.backgroundImageUrl || template.backgroundImageRelativePath || "";

  let cachedBackgroundDataUrl = "";

  if (remoteBackgroundUrl) {
    const existingAsset = await getCachedScannerAsset(remoteBackgroundUrl);

    if (existingAsset?.dataUrl) {
      cachedBackgroundDataUrl = existingAsset.dataUrl;
    }

    const online = typeof navigator === "undefined" ? true : navigator.onLine;

    if (online) {
      try {
        const cachedAsset = await cacheScannerAsset(remoteBackgroundUrl, {
          version:
            typeof template.updatedAt === "string"
              ? template.updatedAt
              : String(template.updatedAt ?? ""),
        });

        if (cachedAsset?.dataUrl) {
          cachedBackgroundDataUrl = cachedAsset.dataUrl;
        }
      } catch {
        /*
         * إذا فشل تحميل الصورة، نحفظ القالب نفسه على الأقل.
         */
      }
    }
  }

  const offlineTemplate: StaffBadgeTemplate = {
    ...template,

    /*
     * عند نجاح تخزين الخلفية نحولها إلى Data URL،
     * حتى تعمل المعاينة والطباعة بدون اتصال.
     */
    backgroundImageUrl:
      cachedBackgroundDataUrl || template.backgroundImageUrl || null,

    backgroundImageRelativePath: template.backgroundImageRelativePath ?? null,
  };

  await saveCachedStaffBadgeTemplate(eventId, offlineTemplate);

  return offlineTemplate;
}
