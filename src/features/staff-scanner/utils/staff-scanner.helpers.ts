import {
  PublicAttendeeType,
  PublicEvent,
  PublicRegistrationField,
  PublicRegisterResponse,
} from "@/features/public-events/public-events.types";
import { ScanResult, ScanType } from "@/features/scans/scans.types";
import { StaffAssignment } from "@/features/staff/staff.types";
import { StaffVisitor } from "@/features/staff-visitors/staff-visitors.api";
import {
  StaffScannerPublicEventResponse,
  StaffScannerTheme,
  StaffScannerVisitor,
} from "./staff-scanner.types";

const fallbackTheme: StaffScannerTheme = {
  primary: "#A88042",
  primaryHover: "#8F6F35",
  background: "#F7F7FB",
  text: "#2F3137",
  radius: "1.5rem",
};

function getBackendOrigin() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

export function resolveAssetUrl(value?: string | null) {
  if (!value) return "";

  if (/^(data|blob):/i.test(value)) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return value;
  }

  if (/^https?:\/\/localhost:3000\/uploads\//i.test(value)) {
    return value.replace(/^https?:\/\/localhost:3000/i, "");
  }

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith("/")) {
    return `${getBackendOrigin()}${value}`;
  }

  return `${getBackendOrigin()}/${value}`;
}

export function getPublicEventInfo(
  data?: StaffScannerPublicEventResponse,
): PublicEvent | null {
  if (!data) return null;

  if (data.event) return data.event;

  if (data.data?.event) return data.data.event;

  return data as PublicEvent;
}

export function getTheme(data?: StaffScannerPublicEventResponse) {
  const event = getPublicEventInfo(data);

  const branding =
    data?.branding ||
    data?.data?.branding ||
    event?.branding ||
    event?.eventBranding ||
    null;

  const theme = branding?.theme;

  return {
    primary: theme?.primary || fallbackTheme.primary,
    primaryHover: theme?.primaryHover || fallbackTheme.primaryHover,
    background: theme?.background || fallbackTheme.background,
    text: theme?.text || fallbackTheme.text,
    radius: theme?.radius || fallbackTheme.radius,
  } satisfies StaffScannerTheme;
}

export function getLogoUrl(data?: StaffScannerPublicEventResponse) {
  const event = getPublicEventInfo(data);

  const branding =
    data?.branding ||
    data?.data?.branding ||
    event?.branding ||
    event?.eventBranding ||
    null;

  return resolveAssetUrl(branding?.logoUrl);
}

export function getBackgroundUrl(data?: StaffScannerPublicEventResponse) {
  const event = getPublicEventInfo(data);

  const branding =
    data?.branding ||
    data?.data?.branding ||
    event?.branding ||
    event?.eventBranding ||
    null;

  return resolveAssetUrl(branding?.backgroundImageUrl);
}

export function getAttendeeTypes(data?: StaffScannerPublicEventResponse) {
  const event = getPublicEventInfo(data);

  return (
    data?.attendeeTypes ||
    data?.data?.attendeeTypes ||
    event?.attendeeTypes ||
    []
  );
}

export function getRegistrationFields(data?: StaffScannerPublicEventResponse) {
  const event = getPublicEventInfo(data);

  return (
    data?.registrationFields ||
    data?.data?.registrationFields ||
    event?.registrationFields ||
    []
  );
}

export function getVisibleFields(
  fields: PublicRegistrationField[],
  attendeeTypeId: string,
) {
  return fields
    .filter((field) => {
      if (field.isActive === false) return false;

      return field.attendeeTypeId === attendeeTypeId;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getEventTitle(assignment?: StaffAssignment | null) {
  return assignment?.event?.titleAr || assignment?.event?.titleEn || "المعرض";
}

export function getCheckpointName(assignment?: StaffAssignment | null) {
  return (
    assignment?.checkpoint?.nameAr ||
    assignment?.checkpoint?.nameEn ||
    "بوابة الدخول"
  );
}

export function getDeviceLabel(assignment?: StaffAssignment | null) {
  return (
    assignment?.device?.name ||
    assignment?.device?.code ||
    "Staff Scanner Device"
  );
}

export function getDeviceApiKey(assignment?: StaffAssignment | null) {
  if (!assignment) return null;

  const assignmentRecord = assignment as unknown as Record<string, unknown>;
  const deviceRecord = isObject(assignmentRecord.device)
    ? assignmentRecord.device
    : null;

  const key = firstText(
    assignmentRecord.deviceApiKey,
    assignmentRecord.rawDeviceApiKey,
    assignmentRecord.apiKey,

    deviceRecord?.rawApiKey,
    deviceRecord?.apiKey,
    deviceRecord?.deviceApiKey,
    deviceRecord?.plainApiKey,
    deviceRecord?.secret,
  );

  return key || null;
}

export function getDefaultScanType(assignment?: StaffAssignment | null) {
  const type = assignment?.checkpoint?.type || "";

  if (type.toUpperCase().includes("EXIT")) return "EXIT" satisfies ScanType;

  return "ENTRY" satisfies ScanType;
}

export function createOperationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `scan-${crypto.randomUUID()}`;
  }

  return `scan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function extractQrToken(value: string) {
  const text = value.trim();

  if (!text) return "";

  try {
    const parsed = JSON.parse(text);

    if (isObject(parsed)) {
      return firstText(
        parsed.qrToken,
        parsed.token,
        parsed.signedToken,
        parsed.value,
      );
    }
  } catch {
    // raw QR token
  }

  return text;
}

export function getQrTokenFromQrResponse(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (!isObject(value)) return "";

  const direct = firstText(
    value.qrToken,
    value.token,
    value.signedToken,
    value.value,
  );

  if (direct) return direct;

  const qr = value.qr;
  if (qr) {
    const nested = getQrTokenFromQrResponse(qr);
    if (nested) return nested;
  }

  const data = value.data;
  if (data) {
    const nested = getQrTokenFromQrResponse(data);
    if (nested) return nested;
  }

  return "";
}

export function getQrImageFromQrResponse(value: unknown): string {
  if (!value || !isObject(value)) return "";

  const direct = firstText(
    value.relativePath,
    value.path,
    value.qrImageUrl,
    value.publicUrl,
    value.imageUrl,
    value.url,
    value.fileUrl,
    value.qrUrl,
  );

  if (direct) return resolveAssetUrl(direct);

  const qr = value.qr;
  if (qr) {
    const nested = getQrImageFromQrResponse(qr);
    if (nested) return nested;
  }

  const data = value.data;
  if (data) {
    const nested = getQrImageFromQrResponse(data);
    if (nested) return nested;
  }

  return "";
}

export function getRegistrationCandidate(scanResult?: ScanResult | null) {
  if (!scanResult) return null;

  return (
    scanResult.registration ||
    scanResult.attendee ||
    scanResult.visitor ||
    scanResult.data?.registration ||
    scanResult.data?.attendee ||
    scanResult.data?.visitor ||
    null
  );
}

export function getRegistrationIdFromScan(scanResult?: ScanResult | null) {
  const registration = getRegistrationCandidate(scanResult);

  const qr = scanResult?.qr as
    | {
        registrationId?: string | null;
      }
    | null
    | undefined;

  const dataQr = scanResult?.data?.qr as
    | {
        registrationId?: string | null;
      }
    | null
    | undefined;

  return registration?.id || qr?.registrationId || dataQr?.registrationId || "";
}

export function getVisitorInfoFromScan(
  scanResult: ScanResult,
): StaffScannerVisitor {
  const registration = getRegistrationCandidate(scanResult);

  const qrToken = getQrTokenFromQrResponse(scanResult);
  const qrImageUrl = getQrImageFromQrResponse(scanResult);

  const attendeeType = registration?.attendeeType;

  return {
    id: registration?.id || "",
    registrationId: registration?.id || "",
    publicId: registration?.publicId || null,

    fullName:
      registration?.fullName ||
      registration?.name ||
      registration?.visitorName ||
      registration?.attendeeName ||
      "زائر",

    phone: registration?.phone || registration?.mobile || null,
    email: registration?.email || null,
    status: registration?.status || scanResult.status || null,

    attendeeTypeName:
      attendeeType?.nameAr ||
      attendeeType?.nameEn ||
      attendeeType?.code ||
      null,
    attendeeTypeCode: attendeeType?.code || null,

    customFields: {
      ...(registration?.customFields ?? {}),
      ...(registration?.companyName || registration?.company
        ? { company: registration.companyName || registration.company }
        : {}),
      ...(registration?.jobTitle || registration?.position
        ? { jobTitle: registration.jobTitle || registration.position }
        : {}),
    },

    qrToken,
    qrImageUrl,
  };
}

export function getVisitorInfoFromStaffVisitor(
  visitor: StaffVisitor,
): StaffScannerVisitor {
  const qrToken = getVisitorQrToken(visitor);
  const qrImageUrl = getVisitorQrImageUrl(visitor);

  return {
    id: visitor.id,
    registrationId: visitor.id,
    publicId: visitor.publicId || null,

    fullName: visitor.fullName,
    phone: visitor.phone || null,
    email: visitor.email || null,
    status: visitor.status || null,

    attendeeTypeName:
      visitor.attendeeType?.nameAr ||
      visitor.attendeeType?.nameEn ||
      visitor.attendeeType?.code ||
      null,

    attendeeTypeCode: visitor.attendeeType?.code || null,
    customFields: visitor.customFields || null,

    qrToken,
    qrImageUrl,
  };
}

export function getVisitorQrToken(visitor?: StaffVisitor | null) {
  if (!visitor) return "";

  const direct = typeof visitor.qrToken === "string" ? visitor.qrToken : "";

  if (direct) return direct;

  return (
    getQrTokenFromQrResponse(visitor.qrToken) ||
    getQrTokenFromQrResponse(visitor.qr)
  );
}

export function getVisitorQrImageUrl(visitor?: StaffVisitor | null) {
  if (!visitor) return "";

  return (
    resolveAssetUrl(visitor.qrImageUrl) ||
    resolveAssetUrl(visitor.imageUrl) ||
    resolveAssetUrl(visitor.publicUrl) ||
    getQrImageFromQrResponse(visitor.qrToken) ||
    getQrImageFromQrResponse(visitor.qr)
  );
}

export function getExtraFields(
  customFields: Record<string, unknown>,
  registrationFields: PublicRegistrationField[],
) {
  const entries = Object.entries(customFields ?? {}).filter(([, value]) => {
    return value !== undefined && value !== null && value !== "";
  });

  return entries.map(([key, value]) => {
    const field = registrationFields.find((item) => item.key === key);

    return {
      key,
      label: field?.labelAr || field?.labelEn || key,
      value,
    };
  });
}

export function formatCustomValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";

  if (typeof value === "boolean") return value ? "نعم" : "لا";

  if (Array.isArray(value)) {
    return value.map(formatCustomValue).join("، ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  return String(value);
}

type RegistrationFieldOption =
  | string
  | {
      labelAr?: string | null;
      labelEn?: string | null;
      label?: string | null;
      value?: string | number | boolean | null;
    };

export function getOptionLabel(option: RegistrationFieldOption) {
  if (typeof option === "string") return option;

  return (
    option.labelAr ||
    option.labelEn ||
    option.label ||
    String(option.value ?? "")
  );
}

export function getOptionValue(option: RegistrationFieldOption) {
  if (typeof option === "string") return option;

  return String(
    option.value ?? option.labelAr ?? option.labelEn ?? option.label ?? "",
  );
}

export function getStatusLabel(status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "فعال";
    case "PENDING":
      return "قيد الانتظار";
    case "CANCELLED":
      return "ملغي";
    case "BLOCKED":
      return "محظور";
    case "ARCHIVED":
      return "مؤرشف";
    default:
      return status || "—";
  }
}

export function isAllowedResult(scanResult?: ScanResult | null) {
  if (!scanResult) return false;

  return (
    scanResult.allowed === true ||
    scanResult.success === true ||
    scanResult.decision === "ALLOWED" ||
    scanResult.status === "ALLOWED"
  );
}

export function getResultMessage(scanResult?: ScanResult | null) {
  if (!scanResult) return "لم يتم تنفيذ عملية المسح";

  return (
    scanResult.message ||
    scanResult.reason ||
    scanResult.scanEvent?.reason ||
    "تم رفض الدخول"
  );
}

export function getResultTime(scanResult?: ScanResult | null) {
  return (
    scanResult?.scanEvent?.scannedAtDevice ||
    scanResult?.scanEvent?.createdAt ||
    scanResult?.movement?.createdAt ||
    ""
  );
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ar-SY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function cleanCustomFields(
  fields: PublicRegistrationField[],
  values: Record<string, unknown>,
) {
  const cleaned: Record<string, unknown> = {};

  fields.forEach((field) => {
    const value = values[field.key];

    if (value === undefined || value === null || value === "") return;

    cleaned[field.key] = value;
  });

  return cleaned;
}

export function buildVisitorFromRegisterResponse(
  data: PublicRegisterResponse,
  fallback: {
    attendeeTypeId: string;
    attendeeType?: PublicAttendeeType;
    fullName: string;
    phone: string;
    email: string;
    customFields: Record<string, unknown>;
  },
): StaffScannerVisitor {
  const registration = data.registration || data;

  const qrToken =
    getQrTokenFromQrResponse(data.qrToken) ||
    getQrTokenFromQrResponse(data.qr) ||
    "";

  const qrImageUrl =
    resolveAssetUrl(data.qrImageUrl) ||
    resolveAssetUrl(data.imageUrl) ||
    resolveAssetUrl(data.publicUrl) ||
    getQrImageFromQrResponse(data.qr) ||
    "";

  return {
    id: registration.id || data.id || "",
    registrationId: registration.id || data.id || "",
    publicId: registration.publicId || data.publicId || null,

    fullName: registration.fullName || data.fullName || fallback.fullName,
    phone: registration.phone || data.phone || fallback.phone,
    email: registration.email || data.email || fallback.email,
    status: registration.status || data.status || "ACTIVE",

    attendeeTypeName:
      fallback.attendeeType?.nameAr ||
      fallback.attendeeType?.nameEn ||
      fallback.attendeeType?.code ||
      null,

    attendeeTypeCode: fallback.attendeeType?.code || null,
    customFields:
      registration.customFields || data.customFields || fallback.customFields,

    qrToken,
    qrImageUrl,
  };
}

export function escapePrintValue(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
