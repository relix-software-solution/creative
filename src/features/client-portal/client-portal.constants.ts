import type {
  ClientAttendanceStatus,
  ClientEventStatus,
  ClientEventType,
  ClientRegistrationSource,
  ClientRegistrationStatus,
} from "./client-portal.types";

export const clientEventStatusLabels: Record<ClientEventStatus, string> = {
  DRAFT: "مسودة",
  SCHEDULED: "مجدولة",
  ACTIVE: "نشطة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  ARCHIVED: "مؤرشفة",
};

export const clientEventTypeLabels: Record<ClientEventType, string> = {
  EXHIBITION: "معرض",
  CONFERENCE: "مؤتمر",
  WORKSHOP: "ورشة عمل",
  SUMMIT: "قمة",
  FESTIVAL: "مهرجان",
  CAREER_FAIR: "معرض توظيف",
  OTHER: "أخرى",
};

export const clientRegistrationStatusLabels: Record<
  ClientRegistrationStatus,
  string
> = {
  PENDING: "بانتظار المراجعة",
  ACTIVE: "فعالة",
  CANCELLED: "ملغاة",
  BLOCKED: "محظورة",
  ARCHIVED: "مؤرشفة",
};

export const clientRegistrationSourceLabels: Record<
  ClientRegistrationSource,
  string
> = {
  ONLINE: "تسجيل إلكتروني",
  ONSITE: "تسجيل ميداني",
  EXCEL_IMPORT: "استيراد Excel",
  OFFLINE_DEVICE: "جهاز دون اتصال",
  ADMIN: "الإدارة",
  PUBLIC: "الرابط العام",
};

export const clientAttendanceStatusLabels: Record<
  ClientAttendanceStatus,
  string
> = {
  NOT_CHECKED_IN: "لم يدخل",
  INSIDE: "داخل الفعالية",
  EXITED: "غادر",
};

export const clientNumberFormatter = new Intl.NumberFormat("ar-SY");

export const clientDateFormatter = new Intl.DateTimeFormat("ar-SY", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const clientDateOnlyFormatter = new Intl.DateTimeFormat("ar-SY", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatClientNumber(value: number): string {
  return clientNumberFormatter.format(value);
}

export function formatClientDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : clientDateFormatter.format(date);
}

export function formatClientDateOnly(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : clientDateOnlyFormatter.format(date);
}

export function getClientEventStatusVariant(
  status: ClientEventStatus,
): "success" | "gold" | "danger" | "warning" | "muted" {
  if (status === "ACTIVE" || status === "COMPLETED") return "success";
  if (status === "SCHEDULED") return "gold";
  if (status === "CANCELLED") return "danger";
  if (status === "DRAFT") return "warning";
  return "muted";
}

export function getClientRegistrationStatusVariant(
  status: ClientRegistrationStatus,
): "success" | "danger" | "warning" | "muted" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED" || status === "BLOCKED") return "danger";
  return "muted";
}

export function getClientAttendanceVariant(
  status: ClientAttendanceStatus,
): "success" | "gold" | "muted" {
  if (status === "INSIDE") return "success";
  if (status === "EXITED") return "gold";
  return "muted";
}

export function getClientPortalErrorMessage(
  error: unknown,
  fallback = "حدث خطأ غير متوقع",
): string {
  if (error && typeof error === "object" && "response" in error) {
    const message = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === "string") return message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
