import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";

export type StaffVisitorAttendeeType = {
  id: string;
  code?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
};

export type StaffVisitorQrObject = {
  id?: string | null;
  registrationId?: string | null;

  qrToken?: string | null;
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
  validFrom?: string | null;
  validUntil?: string | null;
};

export type StaffVisitor = {
  id: string;
  publicId?: string | null;
  status?: string | null;

  fullName: string;
  phone?: string | null;
  email?: string | null;

  customFields?: Record<string, unknown> | null;
  registeredAt?: string | null;
  createdAt?: string | null;

  attendeeType?: StaffVisitorAttendeeType | null;

  qrToken?: string | StaffVisitorQrObject | null;
  qr?: StaffVisitorQrObject | null;

  qrImageUrl?: string | null;
  imageUrl?: string | null;
  publicUrl?: string | null;
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
  widthMm?: number | string | null;
  heightMm?: number | string | null;
  backgroundImageUrl?: string | null;
  backgroundImageRelativePath?: string | null;
  colors?: Record<string, unknown> | null;
  layout?: Record<string, unknown> | null;
  selectedFields?: string[] | null;
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
  const limit = options.limit ?? 200;
  const maxPages = options.maxPages ?? 200;

  let page = 1;
  let totalPages: number | undefined;
  const allItems: StaffVisitor[] = [];

  while (page <= maxPages) {
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

    if (typeof totalPages === "number" && page >= totalPages) break;
    if (items.length < limit) break;
    if (items.length === 0) break;

    page += 1;
  }

  return {
    event: null,
    visitors: {
      items: allItems,
      page: 1,
      limit: allItems.length,
      total: allItems.length,
      totalPages: 1,
    },
  } satisfies StaffVisitorsResponse;
}
