import {
  BadgeAvailableField,
  DuplicateStrategy,
  EventBranding,
  EventItem,
  EventType,
} from "@/features/events/events.types";
import { EventFormValues } from "@/features/events/events.schema";

export type PendingAction =
  | "create"
  | "update"
  | "delete"
  | "deleteBranding"
  | null;

export const PAGE_LIMIT = 20;

export const eventTypeLabels: Record<EventType, string> = {
  EXHIBITION: "معرض",
  CONFERENCE: "مؤتمر",
  WORKSHOP: "ورشة عمل",
  OTHER: "أخرى",
};

export const duplicateStrategyLabels: Record<DuplicateStrategy, string> = {
  PHONE: "حسب الهاتف",
  EMAIL: "حسب البريد",
  EXTERNAL_ID: "حسب الرقم الخارجي",
};

export const defaultTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#F8F8FF",
  text: "#4B4B4B",
  radius: "1.5rem",
};

export const defaultBadgeAvailableFields: BadgeAvailableField[] = [
  {
    key: "fullName",
    labelAr: "الاسم الكامل",
    labelEn: "Full Name",
    source: "FIXED",
    type: "TEXT",
    required: true,
  },
  {
    key: "qrCode",
    labelAr: "رمز QR",
    labelEn: "QR Code",
    source: "SYSTEM",
    type: "QR",
    required: false,
  },
];

function getBackendOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";

  /*
   * إذا كانت NEXT_PUBLIC_API_URL تنتهي بـ /api،
   * نحذفها لأن ملفات uploads غالبًا تُخدم من أصل السيرفر.
   */
  return configuredOrigin
    .replace(/\/+$/, "")
    .replace(/\/api\/v\d+$/i, "")
    .replace(/\/api$/i, "");
}

export function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export function toIsoOrUndefined(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function cleanOptional(value?: string) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

export function resolveAssetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const backendOrigin = getBackendOrigin();
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${backendOrigin}${normalizedPath}`;
}

export function getBranding(event?: EventItem | null) {
  if (!event) {
    return null;
  }

  return event.branding || event.eventBranding || null;
}

export function hasPersistedBranding(branding?: EventBranding | null): boolean {
  if (!branding) {
    return false;
  }

  return Boolean(
    branding.id ||
    branding.logoUrl ||
    branding.backgroundImageUrl ||
    branding.theme?.primary ||
    branding.theme?.primaryHover ||
    branding.theme?.background ||
    branding.theme?.text ||
    branding.theme?.radius,
  );
}

export function getEventLogo(event: EventItem) {
  return getBranding(event)?.logoUrl || "";
}

export function getDefaultFormValues(): EventFormValues {
  return {
    clientId: "",
    type: "EXHIBITION",
    titleAr: "",
    titleEn: "",
    descriptionAr: "",
    descriptionEn: "",
    startsAt: "",
    endsAt: "",
    timezone: "Asia/Damascus",
    allowReEntry: true,
    duplicateStrategy: "PHONE",
    qrValidFrom: "",
    qrValidUntil: "",
    themePrimary: defaultTheme.primary,
    themePrimaryHover: defaultTheme.primaryHover,
    themeBackground: defaultTheme.background,
    themeText: defaultTheme.text,
    themeRadius: defaultTheme.radius,
  };
}

export function toNumber(value: string, fallback: number) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return numberValue;
}
