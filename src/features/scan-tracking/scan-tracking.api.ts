import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  ScanTrackingFiltersResponse,
  ScanTrackingItem,
  ScanTrackingListParams,
  ScanTrackingListResponse,
  VisitorScanTrackingDetail,
  VisitorScanTrackingParams,
  VisitorScanTrackingResponse,
} from "./scan-tracking.types";

const LEGACY_SCAN_TRACKING_ENDPOINT = "/scans/raw";
const VISITOR_SCAN_TRACKING_ENDPOINT = "/scan-tracking/visitors";

function toIsoDate(value?: string) {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

function normalizeItems(value: unknown): ScanTrackingItem[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value as ScanTrackingItem[];
  }

  if (typeof value === "object") {
    const objectValue = value as {
      items?: ScanTrackingItem[];
      data?: ScanTrackingItem[] | { items?: ScanTrackingItem[] };
      scans?: ScanTrackingItem[];
      scanEvents?: ScanTrackingItem[];
      rawScans?: ScanTrackingItem[];
    };

    if (Array.isArray(objectValue.items)) return objectValue.items;
    if (Array.isArray(objectValue.scans)) return objectValue.scans;
    if (Array.isArray(objectValue.scanEvents)) return objectValue.scanEvents;
    if (Array.isArray(objectValue.rawScans)) return objectValue.rawScans;
    if (Array.isArray(objectValue.data)) return objectValue.data;

    if (
      objectValue.data &&
      typeof objectValue.data === "object" &&
      Array.isArray(objectValue.data.items)
    ) {
      return objectValue.data.items;
    }
  }

  return [];
}

function normalizeScansList(data: unknown): ScanTrackingListResponse {
  const value = unwrapApiData<
    | ScanTrackingListResponse
    | ScanTrackingItem[]
    | {
        items?: ScanTrackingItem[];
        scans?: ScanTrackingItem[];
        scanEvents?: ScanTrackingItem[];
        rawScans?: ScanTrackingItem[];
        data?: ScanTrackingItem[] | { items?: ScanTrackingItem[] };
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      }
  >(data);

  const items = normalizeItems(value);

  if (Array.isArray(value)) {
    return {
      items,
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  if (value && typeof value === "object") {
    const objectValue = value as {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };
    };

    const page = objectValue.page ?? objectValue.meta?.page ?? 1;
    const limit = objectValue.limit ?? objectValue.meta?.limit ?? 20;
    const total = objectValue.total ?? objectValue.meta?.total ?? items.length;

    return {
      items,
      page,
      limit,
      total,
      totalPages:
        objectValue.totalPages ??
        objectValue.meta?.totalPages ??
        Math.max(Math.ceil(total / limit), 1),
    };
  }

  return {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };
}

function visitorParams(params: VisitorScanTrackingParams = {}) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 25,
    search: params.search?.trim() || undefined,
    eventId: params.eventId?.trim() || undefined,
    attendeeTypeId: params.attendeeTypeId?.trim() || undefined,
    type: params.type?.trim() || undefined,
    result: params.result?.trim() || undefined,
    state: params.state?.trim() || undefined,
    from: toIsoDate(params.from),
    to: toIsoDate(params.to),
  };
}

function parseFilename(contentDisposition?: string) {
  if (!contentDisposition) return "visitor-tracking.xlsx";

  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  return (
    contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    "visitor-tracking.xlsx"
  );
}

export async function getScanTrackingList(params: ScanTrackingListParams = {}) {
  const response = await adminClient.get(LEGACY_SCAN_TRACKING_ENDPOINT, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search?.trim() || undefined,
      eventId: params.eventId?.trim() || undefined,
      checkpointId: params.checkpointId?.trim() || undefined,
      deviceId: params.deviceId?.trim() || undefined,
      staffSessionId: params.staffSessionId?.trim() || undefined,
      type: params.type?.trim() || undefined,
      decision: params.decision?.trim() || undefined,
      status: params.status?.trim() || undefined,
      from: toIsoDate(params.from),
      to: toIsoDate(params.to),
    },
  });

  return normalizeScansList(response.data);
}

export async function getVisitorScanTracking(
  params: VisitorScanTrackingParams = {},
) {
  const response = await adminClient.get(VISITOR_SCAN_TRACKING_ENDPOINT, {
    params: visitorParams(params),
  });

  return unwrapApiData<VisitorScanTrackingResponse>(response.data);
}

export async function getVisitorScanTrackingDetail(
  registrationId: string,
  params: VisitorScanTrackingParams = {},
) {
  const response = await adminClient.get(
    `${VISITOR_SCAN_TRACKING_ENDPOINT}/${registrationId}`,
    {
      params: visitorParams({ ...params, page: undefined, limit: undefined }),
    },
  );

  return unwrapApiData<VisitorScanTrackingDetail>(response.data);
}

export async function getScanTrackingFilters() {
  const response = await adminClient.get("/scan-tracking/filters");

  return unwrapApiData<ScanTrackingFiltersResponse>(response.data);
}

export async function exportVisitorScanTracking(
  params: VisitorScanTrackingParams = {},
) {
  const response = await adminClient.get(
    `${VISITOR_SCAN_TRACKING_ENDPOINT}/export`,
    {
      params: visitorParams({ ...params, page: undefined, limit: undefined }),
      responseType: "blob",
    },
  );

  return {
    blob: response.data as Blob,
    filename: parseFilename(response.headers["content-disposition"]),
  };
}
