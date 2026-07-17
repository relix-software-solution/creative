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
import {
  StaffVisitor,
  StaffVisitorAttendeeType,
  StaffBadgeTemplate,
} from "@/features/staff-visitors/staff-visitors.api";

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
  | "LOCAL_SYNCED";

export type CachedStaffVisitor = StaffVisitor & {
  eventId: string;
  attendeeTypeId?: string | null;
  searchText: string;
  syncStatus: CachedStaffVisitorSyncStatus;
  offlineLocalId?: string | null;
  offlineOperationId?: string | null;
  updatedAt: string;
};

export type QueuedStaffVisitorRegistration = {
  id?: number;
  operationId: string;
  localId: string;

  eventId: string;
  attendeeTypeId: string;

  fullName: string;
  phone?: string | null;
  email?: string | null;
  customFields?: Record<string, unknown>;

  offlineQrToken: string;
  offlineQrImageUrl: string;

  attendeeType?: PublicAttendeeType | null;

  status: QueuedScanStatus;
  errorMessage?: string | null;

  createdAtDevice: string;
  createdAt: string;
  syncedAt?: string | null;

  backendRegistrationId?: string | null;
  backendPublicId?: string | null;
  response?: PublicRegisterResponse | null;
};

class StaffScannerDatabase extends Dexie {
  scans!: Table<QueuedStaffScan, number>;
  eventCaches!: Table<CachedStaffScannerEvent, string>;
  assets!: Table<CachedStaffScannerAsset, string>;
  visitors!: Table<CachedStaffVisitor, string>;
  visitorRegistrations!: Table<QueuedStaffVisitorRegistration, number>;
  badgeTemplates!: Table<CachedStaffBadgeTemplate, string>;

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
  }
}

export const staffScannerDb = new StaffScannerDatabase();

export type SyncQueuedScansResult = {
  total: number;
  synced: number;
  failed: number;
};

export type SyncQueuedVisitorRegistrationsResult = {
  total: number;
  synced: number;
  failed: number;
};

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
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

function buildVisitorSearchText(visitor: StaffVisitor) {
  return normalizeSearchValue(
    [
      visitor.id,
      visitor.publicId,
      visitor.fullName,
      visitor.phone,
      visitor.email,
      visitor.status,
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
  if (!attendeeType) return null;

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
): CachedStaffVisitor {
  const attendeeTypeId = visitor.attendeeType?.id ?? null;

  return {
    ...visitor,
    eventId,
    attendeeTypeId,
    searchText: buildVisitorSearchText(visitor),
    syncStatus,
    updatedAt: new Date().toISOString(),
  };
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

function readQrToken(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return (
      firstString(
        record.qrToken,
        record.token,
        record.value,
        record.signedToken,
      ) ?? ""
    );
  }

  return "";
}

function readQrImageUrl(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

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

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: {
            message?: string | string[];
            error?: string;
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return `[${response?.status ?? "ERR"}] ${message[0] ?? "Sync failed"}`;
    }

    if (typeof message === "string") {
      return `[${response?.status ?? "ERR"}] ${message}`;
    }

    if (response?.data?.error) {
      return `[${response?.status ?? "ERR"}] ${response.data.error}`;
    }

    if (response?.status) {
      return `HTTP ${response.status}`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Sync failed";
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
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
    registrationId: scan.registrationId ?? undefined,
    type: scan.type,
    scannedAtDevice: scan.scannedAtDevice,
    payload: scan.payload,
  };
}

function toStaffVisitorFromRegisterResponse(
  response: PublicRegisterResponse,
  queued: QueuedStaffVisitorRegistration,
): StaffVisitor {
  const registration = response.registration ?? response;

  const id =
    firstString(
      registration.id,
      response.id,
      registration.publicId,
      response.publicId,
    ) ?? queued.localId;

  const publicId =
    firstString(registration.publicId, response.publicId) ?? null;

  const qrToken =
    firstString(
      readQrToken(response.qrToken),
      readQrToken(response.qr),
      response.qr?.qrToken,
      response.qr?.token,
      response.qr?.value,
      response.qr?.signedToken,
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
  };
}

/**
 * Scans queue
 */
export async function addScanToQueue(
  scan: Omit<QueuedStaffScan, "id" | "status" | "createdAt" | "syncedAt">,
) {
  const existing = await staffScannerDb.scans
    .where("operationId")
    .equals(scan.operationId)
    .first();

  if (existing) return existing.id;

  return staffScannerDb.scans.add({
    ...scan,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    syncedAt: null,
    errorMessage: null,
  });
}

export async function getPendingScansCount() {
  return staffScannerDb.scans
    .where("status")
    .anyOf(["PENDING", "FAILED"])
    .count();
}

export async function getQueuedScans() {
  return staffScannerDb.scans.orderBy("createdAt").reverse().toArray();
}

export async function getPendingQueuedScans() {
  const scans = await staffScannerDb.scans
    .where("status")
    .anyOf(["PENDING", "FAILED"])
    .toArray();

  return scans.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export async function markScanAsSynced(id: number) {
  return staffScannerDb.scans.update(id, {
    status: "SYNCED",
    syncedAt: new Date().toISOString(),
    errorMessage: null,
  });
}

export async function markScanAsFailed(id: number, errorMessage: string) {
  return staffScannerDb.scans.update(id, {
    status: "FAILED",
    errorMessage,
  });
}

export async function clearSyncedScans() {
  return staffScannerDb.scans.where("status").equals("SYNCED").delete();
}

export async function syncQueuedScans(options: {
  submitScan: (payload: CreateScanPayload) => Promise<unknown>;
}) {
  const pendingScans = await getPendingQueuedScans();

  const result: SyncQueuedScansResult = {
    total: pendingScans.length,
    synced: 0,
    failed: 0,
  };

  for (const scan of pendingScans) {
    if (!scan.id) continue;

    try {
      await options.submitScan(toCreateScanPayload(scan));
      await markScanAsSynced(scan.id);
      result.synced += 1;
    } catch (error) {
      await markScanAsFailed(scan.id, getErrorMessage(error));
      result.failed += 1;
    }
  }

  return result;
}

/**
 * Event branding / public event cache
 */
export async function cachePublicEventForStaffScanner(
  eventId: string,
  data: PublicEvent | unknown,
) {
  if (!eventId || !data) return;

  await staffScannerDb.eventCaches.put({
    eventId,
    data,
    savedAt: new Date().toISOString(),
  });
}

export async function getCachedPublicEvent(eventId: string) {
  if (!eventId) return null;

  return staffScannerDb.eventCaches.get(eventId);
}

export async function cacheScannerAsset(url: string) {
  if (!url || url.startsWith("data:")) return null;

  const response = await fetch(url, {
    cache: "reload",
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
  if (!url) return null;

  return staffScannerDb.assets.get(url);
}

/**
 * Visitors cache/search
 */
export async function replaceCachedStaffVisitorsForEvent(
  eventId: string,
  visitors: StaffVisitor[],
) {
  if (!eventId) return;

  const localPendingVisitors = await staffScannerDb.visitors
    .where("eventId")
    .equals(eventId)
    .and((visitor) => visitor.syncStatus === "LOCAL_PENDING")
    .toArray();

  const cachedVisitors = visitors.map((visitor) =>
    normalizeCachedVisitor(eventId, visitor, "CACHED"),
  );

  await staffScannerDb.transaction("rw", staffScannerDb.visitors, async () => {
    await staffScannerDb.visitors.where("eventId").equals(eventId).delete();

    if (cachedVisitors.length > 0) {
      await staffScannerDb.visitors.bulkPut(cachedVisitors);
    }

    if (localPendingVisitors.length > 0) {
      await staffScannerDb.visitors.bulkPut(localPendingVisitors);
    }
  });
}

export async function getCachedStaffVisitorsCount(eventId: string) {
  if (!eventId) return 0;

  return staffScannerDb.visitors.where("eventId").equals(eventId).count();
}

export async function cacheStaffVisitors(
  eventId: string,
  visitors: StaffVisitor[],
) {
  if (!eventId || visitors.length === 0) return;

  const cachedVisitors = visitors.map((visitor) =>
    normalizeCachedVisitor(eventId, visitor, "CACHED"),
  );

  await staffScannerDb.visitors.bulkPut(cachedVisitors);
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
    ? visitors.filter((visitor) => visitor.searchText.includes(query))
    : visitors;

  const sorted = filtered.sort((a, b) => {
    if (a.syncStatus === "LOCAL_PENDING" && b.syncStatus !== "LOCAL_PENDING") {
      return -1;
    }

    if (a.syncStatus !== "LOCAL_PENDING" && b.syncStatus === "LOCAL_PENDING") {
      return 1;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    event: {
      id: eventId,
    },
    visitors: {
      items: sorted.slice(0, limit),
      page: 1,
      limit,
      total: filtered.length,
      totalPages: 1,
    },
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
  offlineQrToken: string;
  offlineQrImageUrl: string;
}) {
  const now = new Date().toISOString();
  const operationId = createLocalId("visitor-registration");
  const localId = createLocalId("offline-visitor");

  const queued: QueuedStaffVisitorRegistration = {
    operationId,
    localId,

    eventId: options.eventId,
    attendeeTypeId: options.payload.attendeeTypeId,

    fullName: options.payload.fullName,
    phone: options.payload.phone ?? null,
    email: options.payload.email ?? null,
    customFields: options.payload.customFields ?? {},

    attendeeType: options.attendeeType ?? null,
    offlineQrToken: options.offlineQrToken,
    offlineQrImageUrl: options.offlineQrImageUrl,

    status: "PENDING",
    errorMessage: null,

    createdAtDevice: now,
    createdAt: now,
    syncedAt: null,

    backendRegistrationId: null,
    backendPublicId: null,
    response: null,
  };

  const localVisitor: CachedStaffVisitor = {
    id: localId,
    publicId: `OFFLINE-${Date.now().toString().slice(-8)}`,
    fullName: options.payload.fullName,
    phone: options.payload.phone ?? null,
    email: options.payload.email ?? null,
    status: "PENDING_OFFLINE",
    customFields: options.payload.customFields ?? {},
    registeredAt: now,
    createdAt: now,
    attendeeType: toStaffVisitorAttendeeType(options.attendeeType),
    qrToken: options.offlineQrToken,
    qr: {
      qrToken: options.offlineQrToken,
      qrImageUrl: options.offlineQrImageUrl,
      status: "OFFLINE_PENDING",
    },
    qrImageUrl: options.offlineQrImageUrl,

    eventId: options.eventId,
    attendeeTypeId: options.payload.attendeeTypeId,
    searchText: "",
    syncStatus: "LOCAL_PENDING",
    offlineLocalId: localId,
    offlineOperationId: operationId,
    updatedAt: now,
  };

  localVisitor.searchText = buildVisitorSearchText(localVisitor);

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
  return staffScannerDb.visitorRegistrations
    .where("status")
    .anyOf(["PENDING", "FAILED"])
    .count();
}

export async function getPendingOfflineWorkCount() {
  const [scansCount, visitorsCount] = await Promise.all([
    getPendingScansCount(),
    getPendingOfflineVisitorRegistrationsCount(),
  ]);

  return scansCount + visitorsCount;
}

export async function getPendingQueuedVisitorRegistrations() {
  const registrations = await staffScannerDb.visitorRegistrations
    .where("status")
    .anyOf(["PENDING", "FAILED"])
    .toArray();

  return registrations.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export async function syncQueuedVisitorRegistrations(options: {
  registerVisitor: (
    eventId: string,
    payload: PublicRegisterPayload,
  ) => Promise<PublicRegisterResponse>;
}) {
  const pendingRegistrations = await getPendingQueuedVisitorRegistrations();

  const result: SyncQueuedVisitorRegistrationsResult = {
    total: pendingRegistrations.length,
    synced: 0,
    failed: 0,
  };

  for (const queued of pendingRegistrations) {
    if (!queued.id) continue;

    try {
      const response = await options.registerVisitor(queued.eventId, {
        attendeeTypeId: queued.attendeeTypeId,
        fullName: queued.fullName,
        phone: queued.phone ?? "",
        email: queued.email ?? undefined,
        customFields: queued.customFields ?? {},
        externalId: queued.operationId,
        offlineOperationId: queued.operationId,
        offlineQrToken: queued.offlineQrToken,
        notes: "Created offline from staff scanner and synced later.",
      });

      const syncedVisitor = toStaffVisitorFromRegisterResponse(
        response,
        queued,
      );
      const cachedSyncedVisitor = normalizeCachedVisitor(
        queued.eventId,
        syncedVisitor,
        "LOCAL_SYNCED",
      );

      cachedSyncedVisitor.offlineLocalId = queued.localId;
      cachedSyncedVisitor.offlineOperationId = queued.operationId;

      await staffScannerDb.transaction(
        "rw",
        staffScannerDb.visitorRegistrations,
        staffScannerDb.visitors,
        async () => {
          await staffScannerDb.visitors.delete(queued.localId);
          await staffScannerDb.visitors.put(cachedSyncedVisitor);

          await staffScannerDb.visitorRegistrations.update(queued.id!, {
            status: "SYNCED",
            syncedAt: new Date().toISOString(),
            errorMessage: null,
            backendRegistrationId: syncedVisitor.id,
            backendPublicId: syncedVisitor.publicId ?? null,
            response,
          });
        },
      );

      result.synced += 1;
    } catch (error) {
      await staffScannerDb.visitorRegistrations.update(queued.id, {
        status: "FAILED",
        errorMessage: getErrorMessage(error),
      });

      await staffScannerDb.visitors.update(queued.localId, {
        status: "FAILED_OFFLINE_SYNC",
        syncStatus: "LOCAL_PENDING",
        updatedAt: new Date().toISOString(),
      });

      result.failed += 1;
    }
  }

  return result;
}
export async function hydrateVisitorQrImagesFromCache(
  visitors: StaffVisitor[],
) {
  const hydrated = await Promise.all(
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

  return hydrated;
}
export async function saveCachedStaffBadgeTemplate(
  eventId: string,
  template: StaffBadgeTemplate | null | undefined,
) {
  if (!eventId || !template) return;

  await staffScannerDb.badgeTemplates.put({
    eventId,
    template,
    savedAt: new Date().toISOString(),
  });
}

export async function getCachedStaffBadgeTemplate(eventId: string) {
  if (!eventId) return null;

  return staffScannerDb.badgeTemplates.get(eventId);
}
