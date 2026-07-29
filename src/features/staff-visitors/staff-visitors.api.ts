import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import type { BadgeTemplateSelectedField } from "@/features/badge-templates/badge-templates.types";

export type StaffVisitorAttendeeType = {
  id: string;
  code?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
};

export type StaffVisitorQrObject = {
  id?: string | null;
  registrationId?: string | null;
  tokenId?: string | null;

  qrToken?: string | null;
  compactQrToken?: string | null;
  token?: string | null;
  value?: string | null;
  signedToken?: string | null;

  imageUrl?: string | null;
  publicUrl?: string | null;
  qrImageUrl?: string | null;
  relativePath?: string | null;
  url?: string | null;
  path?: string | null;
  fileUrl?: string | null;
  qrUrl?: string | null;

  status?: string | null;
  /*
   * رمز O2 القصير المطبوع لتسجيلات الستاف الأوفلاين.
   */
  offlineQrToken?: string | null;

  /*
   * التوقيع الكامل محفوظ للتحقق والمزامنة فقط.
   * لا يُستخدم لتوليد صورة QR.
   */
  offlineSignedQr?: string | null;

  canonicalQrToken?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  generatedAt?: string | null;
  updatedAt?: string | null;
};

export type StaffVisitor = {
  id: string;
  publicId?: string | null;

  status?: string | null;
  source?: string | null;

  attendeeTypeId?: string | null;

  fullName: string;
  phone?: string | null;
  email?: string | null;

  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;

  customFields?: Record<string, unknown> | null;

  registeredAt?: string | null;
  syncedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  attendeeType?: StaffVisitorAttendeeType | null;

  qrToken?: string | StaffVisitorQrObject | null;
  qr?: StaffVisitorQrObject | null;

  qrImageUrl?: string | null;
  imageUrl?: string | null;
  publicUrl?: string | null;

  /*
   * رمز O2 القصير المستخدم لتوليد وطباعة QR
   * الخاص بالتسجيل المحلي.
   */
  offlineQrToken?: string | null;

  /*
   * التوكن الكامل الموقّع محفوظ للمزامنة والتحقق،
   * وليس لتوليد صورة QR.
   */
  offlineSignedQr?: string | null;

  /*
   * رمز QR الرسمي المختصر القادم من الباك.
   */
  canonicalQrToken?: string | null;

  qrLookupKeys?: string[];
};

export type StaffVisitorsResponse = {
  event?: {
    id: string;
    titleAr?: string | null;
    titleEn?: string | null;
  } | null;

  visitors: {
    items: StaffVisitor[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type StaffOfflineStateResponse = {
  eventId: string;

  visitorsRevision: string;
  visitorsCount: number;
  visitorsUpdatedAt: string | null;

  badgeTemplateRevision: string;
  badgeTemplate: StaffBadgeTemplate | null;

  generatedAt: string;
};

export type StaffVisitorsParams = {
  page?: number;
  limit?: number;
  search?: string;
  phone?: string;
  email?: string;
  status?: string;
  attendeeTypeId?: string;
};

export type StaffVisitorQrResponse = {
  qrToken?: string | null;
  compactQrToken?: string | null;
  offlineQrToken?: string | null;
  token?: string | null;
  signedToken?: string | null;
  value?: string | null;

  imageUrl?: string | null;
  publicUrl?: string | null;
  qrImageUrl?: string | null;
  relativePath?: string | null;

  status?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;

  qr?: StaffVisitorQrObject | null;
  registration?: StaffVisitor | null;
};

export type StaffBadgeTemplate = {
  id?: string | null;
  eventId?: string | null;

  widthMm?: number | string | null;
  heightMm?: number | string | null;

  backgroundImageUrl?: string | null;
  backgroundImageRelativePath?: string | null;

  colors?: Record<string, unknown> | null;
  layout?: Record<string, unknown> | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  selectedFields?: string[] | BadgeTemplateSelectedField[] | null;
};

export type StaffBadgeField = {
  key: string;

  label?: string | null;
  labelAr?: string | null;
  labelEn?: string | null;

  value?: unknown;
};

export type StaffVisitorBadgeResponse = {
  template?: StaffBadgeTemplate | null;
  registration?: StaffVisitor | null;
  qr?: StaffVisitorQrObject | null;
  fields?: StaffBadgeField[];
};

/**
 * Metadata الخاصة بعملية تنزيل Snapshot.
 */
export type StaffOfflineVisitorsSnapshotMetadata = {
  version: number;
  id: string;
  eventId: string;
  snapshotAsOf: string;

  pageSize: number;
  returnedCount: number;

  /**
   * الباك يرجع العدد في الصفحة الأولى فقط.
   * في الصفحات التالية يمكن أن تكون null.
   */
  totalCount: number | null;

  hasMore: boolean;
  nextCursor: string | null;
};

export type StaffOfflineVisitorsSnapshotEvent = {
  id: string;

  titleAr?: string | null;
  titleEn?: string | null;

  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  updatedAt?: string | null;
};

export type StaffOfflineVisitorsSnapshotResponse = {
  snapshot: StaffOfflineVisitorsSnapshotMetadata;
  event: StaffOfflineVisitorsSnapshotEvent;

  badgeTemplate: StaffBadgeTemplate | null;

  visitors: StaffVisitor[];
};

export type StaffOfflineVisitorsSnapshotParams = {
  cursor?: string | null;
  limit?: number;

  /**
   * يسمح بإلغاء الطلب عندما ينقطع الإنترنت
   * أو يتم فك الصفحة.
   */
  signal?: AbortSignal;
};

export type UpdateStaffVisitorPayload = {
  expectedUpdatedAt?: string;

  fullName?: string;
  phone?: string;
  email?: string | null;

  companyName?: string;
  jobTitle?: string;

  customFields?: Record<string, unknown>;
  notes?: string;
};

export type UpdateStaffVisitorResponse = {
  id: string;
  publicId?: string | null;

  status?: string | null;

  fullName: string;
  phone?: string | null;
  email?: string | null;

  companyName?: string | null;
  jobTitle?: string | null;

  customFields?: Record<string, unknown> | null;
  attendeeType?: StaffVisitorAttendeeType | null;

  updatedAt: string;
};

export async function getStaffVisitors(params: StaffVisitorsParams = {}) {
  const response = await adminClient.get("/staff/visitors", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,

      search: params.search?.trim() || undefined,
      phone: params.phone?.trim() || undefined,
      email: params.email?.trim() || undefined,
      status: params.status?.trim() || undefined,
      attendeeTypeId: params.attendeeTypeId?.trim() || undefined,
    },
  });

  return unwrapApiData<StaffVisitorsResponse>(response.data);
}

/**
 * تنزيل دفعة واحدة من Offline Snapshot.
 *
 * لا تقوم هذه الدالة بعمل loop داخلي.
 * إدارة الـcursor والحفظ والاستكمال ستكون داخل طبقة IndexedDB.
 */
export async function getStaffOfflineVisitorsSnapshot(
  params: StaffOfflineVisitorsSnapshotParams = {},
) {
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  if (!online) {
    throw new Error("OFFLINE_SNAPSHOT_REQUEST_BLOCKED");
  }

  const response = await adminClient.get("/staff/visitors/offline-snapshot", {
    params: {
      limit: Math.min(Math.max(params.limit ?? 500, 50), 500),

      cursor: params.cursor?.trim() || undefined,
    },

    signal: params.signal,
  });

  return unwrapApiData<StaffOfflineVisitorsSnapshotResponse>(response.data);
}

export async function getStaffOfflineState(signal?: AbortSignal) {
  const response = await adminClient.get("/staff/visitors/offline-state", {
    signal,

    params: {
      _ts: Date.now(),
    },
  });

  return unwrapApiData<StaffOfflineStateResponse>(response.data);
}

export async function generateStaffVisitorQr(registrationId: string) {
  const response = await adminClient.post(
    `/staff/visitors/${registrationId}/qr`,
  );

  return unwrapApiData<StaffVisitorQrResponse>(response.data);
}

export async function getStaffVisitorBadge(
  eventId: string,
  registrationId: string,
) {
  const response = await adminClient.get(
    `/badge-templates/events/${eventId}/registrations/${registrationId}`,
  );

  return unwrapApiData<StaffVisitorBadgeResponse>(response.data);
}

/**
 * الطريقة القديمة المبنية على page/limit.
 *
 * نتركها مؤقتًا حتى ننتهي من ربط Snapshot الجديد بالصفحة،
 * وبعد نجاح الاختبار سنحذف استخدامها من StaffScannerPage.
 */
export async function getAllStaffVisitorsForOffline(
  options: {
    limit?: number;
    maxPages?: number;

    onPage?: (info: {
      page: number;
      totalPages?: number;
      pageItems: number;
      totalItems: number;
    }) => void;
  } = {},
) {
  const limit = options.limit ?? 20;
  const maxPages = options.maxPages ?? 1000;

  let page = 1;
  let totalPages: number | undefined;

  const allItems: StaffVisitor[] = [];

  while (page <= maxPages) {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;

    if (!online) {
      break;
    }

    const response = await getStaffVisitors({
      page,
      limit,
    });

    const items = response.visitors?.items ?? [];

    allItems.push(...items);

    totalPages = response.visitors?.totalPages;

    options.onPage?.({
      page,
      totalPages,
      pageItems: items.length,
      totalItems: allItems.length,
    });

    if (typeof totalPages === "number" && page >= totalPages) {
      break;
    }

    if (items.length < limit || items.length === 0) {
      break;
    }

    page += 1;
  }

  return {
    event: null,

    visitors: {
      items: allItems,

      page: 1,
      limit: allItems.length,

      total: allItems.length,
      totalPages: allItems.length === 0 ? 0 : 1,
    },
  } satisfies StaffVisitorsResponse;
}

export async function updateStaffVisitor(
  registrationId: string,
  payload: UpdateStaffVisitorPayload,
) {
  const response = await adminClient.patch(
    `/staff/visitors/${registrationId}`,
    payload,
  );

  return unwrapApiData<UpdateStaffVisitorResponse>(response.data);
}
