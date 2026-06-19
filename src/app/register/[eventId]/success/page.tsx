"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  Loader2,
  Mail,
  Phone,
  QrCode,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CSSProperties, useMemo, useRef, useState } from "react";
import { usePublicEvent } from "@/features/public-events/public-events.queries";
import { getPublicRegistrationStorageKey } from "@/features/public-events/public-registration-result";
import {
  PublicEvent,
  PublicEventBranding,
  PublicRegistrationSuccessData,
} from "@/features/public-events/public-events.types";

type PublicEventResponse = PublicEvent & {
  event?: PublicEvent & {
    client?: {
      id: string;
      name: string;
    } | null;
  };
  branding?: PublicEventBranding | null;
  eventBranding?: PublicEventBranding | null;
};

const fallbackTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#0B0B0B",
  text: "#FFFFFF",
  radius: "1.5rem",
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getStatusLabel(status?: string) {
  if (status === "ACTIVE") return "فعّال";
  if (status === "PENDING") return "بانتظار التفعيل";
  if (status === "CANCELLED") return "ملغي";
  if (status === "BLOCKED") return "محظور";

  return status || "تم التسجيل";
}

function getSafeText(value?: string | null) {
  if (!value || !value.trim()) return "—";

  return value;
}

function getEventInfo(data?: PublicEventResponse | null) {
  if (!data) return null;

  return data.event || data;
}

function getBranding(data?: PublicEventResponse | null) {
  if (!data) return null;

  return (
    data.branding || data.eventBranding || getEventInfo(data)?.branding || null
  );
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000";

  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

function getTheme(data?: PublicEventResponse | null) {
  const theme = getBranding(data)?.theme;

  return {
    primary: theme?.primary || fallbackTheme.primary,
    primaryHover: theme?.primaryHover || fallbackTheme.primaryHover,
    background: theme?.background || fallbackTheme.background,
    text: theme?.text || fallbackTheme.text,
    radius: theme?.radius || fallbackTheme.radius,
  };
}

function getLogoUrl(data?: PublicEventResponse | null) {
  return resolveAssetUrl(getBranding(data)?.logoUrl);
}

function getBackgroundUrl(data?: PublicEventResponse | null) {
  return resolveAssetUrl(getBranding(data)?.backgroundImageUrl);
}

function getQrImageUrl(value?: string | null) {
  return resolveAssetUrl(value);
}

function getStoredSuccessData(eventId: string) {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(getPublicRegistrationStorageKey(eventId));

  if (!raw) return null;

  try {
    return JSON.parse(raw) as PublicRegistrationSuccessData;
  } catch {
    return null;
  }
}

function formatCustomFieldValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";

  if (Array.isArray(value)) {
    return value.length ? value.map(String).join("، ") : "—";
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getVisibleExtraFields(
  fields: PublicEventResponse["registrationFields"] | undefined,
  attendeeTypeId?: string,
) {
  return (fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter(
      (field) => !attendeeTypeId || field.attendeeTypeId === attendeeTypeId,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getFieldDirection(type?: string) {
  if (type === "EMAIL" || type === "PHONE" || type === "NUMBER") return "ltr";
  return "rtl";
}

export default function PublicRegistrationSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const eventQuery = usePublicEvent(eventId);
  const eventData = eventQuery.data as PublicEventResponse | undefined;

  const event = useMemo(() => getEventInfo(eventData), [eventData]);
  const theme = useMemo(() => getTheme(eventData), [eventData]);
  const logoUrl = useMemo(() => getLogoUrl(eventData), [eventData]);
  const backgroundUrl = useMemo(() => getBackgroundUrl(eventData), [eventData]);

  const [successData] = useState<PublicRegistrationSuccessData | null>(() =>
    getStoredSuccessData(eventId),
  );

  const [primaryHover, setPrimaryHover] = useState(false);
  const [secondaryHover, setSecondaryHover] = useState(false);

  const qrImageUrl = useMemo(
    () => getQrImageUrl(successData?.qrImageUrl),
    [successData?.qrImageUrl],
  );

  const qrValue = successData?.qrToken?.trim() || "";

  const extraFields = useMemo(() => {
    const attendeeTypeId =
      successData?.attendeeTypeId || eventData?.attendeeTypes?.[0]?.id || "";

    return getVisibleExtraFields(eventData?.registrationFields, attendeeTypeId);
  }, [
    eventData?.registrationFields,
    eventData?.attendeeTypes,
    successData?.attendeeTypeId,
  ]);

  const customFields = successData?.customFields ?? {};

  const pageStyle: CSSProperties = {
    backgroundColor: theme.background,
    color: theme.text,
  };

  const radiusLg: CSSProperties = {
    borderRadius: `calc(${theme.radius} + 0.75rem)`,
  };

  const radiusMd: CSSProperties = {
    borderRadius: theme.radius,
  };

  const primaryButtonStyle: CSSProperties = {
    ...radiusMd,
    backgroundColor: primaryHover ? theme.primaryHover : theme.primary,
    boxShadow: `0 18px 44px ${theme.primary}40`,
  };

  const secondaryButtonStyle: CSSProperties = {
    ...radiusMd,
    borderColor: `${theme.primary}66`,
    backgroundColor: secondaryHover
      ? `${theme.primary}22`
      : "rgba(255,255,255,0.10)",
    color: "#FFFFFF",
  };

  function downloadRenderedQr() {
    const svg = qrContainerRef.current?.querySelector("svg");

    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `registration-${successData?.registrationId || "qr"}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (eventQuery.isLoading) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        style={pageStyle}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : null}

        <div className="absolute inset-0 bg-black/72" />

        <div
          className="relative z-10 border border-white/15 bg-black/45 p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          style={radiusLg}
        >
          <Loader2
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: theme.primary }}
          />

          <p className="mt-3 text-sm font-bold text-white/75">
            جاري تحميل نتيجة التسجيل...
          </p>
        </div>
      </main>
    );
  }

  if (!successData) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
        style={pageStyle}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : null}

        <div className="absolute inset-0 bg-black/72" />

        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${theme.primary}2E, transparent 34%)`,
          }}
        />

        <div
          className="relative z-10 max-w-lg border border-white/15 bg-black/45 p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          style={radiusLg}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={event?.titleAr || "Logo"}
              className="mx-auto mb-5 max-h-20 max-w-[220px] object-contain"
            />
          ) : (
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-white/10"
              style={radiusMd}
            >
              <QrCode className="h-8 w-8" style={{ color: theme.primary }} />
            </div>
          )}

          <h1 className="text-2xl font-extrabold">
            لا توجد نتيجة تسجيل محفوظة
          </h1>

          <p className="mt-3 text-sm font-bold leading-7 text-white/70">
            افتح صفحة التسجيل وأرسل الطلب من جديد. قد تظهر هذه الرسالة إذا تم
            تحديث الصفحة بعد وقت طويل أو فتح الرابط من جهاز آخر.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/register/${eventId}`}
              className="inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-extrabold text-white transition"
              style={primaryButtonStyle}
            >
              <RotateCcw className="h-5 w-5" />
              الرجوع للتسجيل
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 border px-6 text-sm font-extrabold transition"
              style={secondaryButtonStyle}
            >
              <Home className="h-5 w-5" />
              الرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      style={pageStyle}
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt={event?.titleAr || ""}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${theme.background}, #070707)`,
          }}
        />
      )}

      <div className="absolute inset-0 bg-black/72" />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.primary}2E, transparent 32%)`,
        }}
      />

      <section className="relative z-10 min-h-screen px-4 py-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
          <div
            className="w-full border border-white/15 bg-black/40 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-6 lg:p-7"
            style={radiusLg}
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="min-w-0 text-right">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-xs font-extrabold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  تم التسجيل بنجاح
                </div>

                <h1 className="truncate text-2xl font-extrabold text-white md:text-4xl">
                  {event?.titleAr || "الفعالية"}
                </h1>

                {event?.titleEn ? (
                  <p
                    className="mt-2 truncate text-sm font-bold md:text-lg"
                    style={{ color: theme.primary }}
                  >
                    {event.titleEn}
                  </p>
                ) : null}
              </div>

              <div className="hidden shrink-0 items-center justify-center sm:flex">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={event?.titleAr || "Logo"}
                    className="max-h-20 max-w-[180px] object-contain"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center border border-white/10 bg-white/10"
                    style={radiusMd}
                  >
                    <ShieldCheck
                      className="h-8 w-8"
                      style={{ color: theme.primary }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="w-full lg:col-start-2 lg:row-start-1">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<UserRound className="h-4 w-4" />}
                    label="اسم المسجل"
                    value={getSafeText(successData.fullName)}
                    theme={theme}
                  />

                  <InfoCard
                    label="حالة التسجيل"
                    value={getStatusLabel(successData.status)}
                    theme={theme}
                    valueClassName="text-emerald-300"
                  />

                  <InfoCard
                    icon={<Phone className="h-4 w-4" />}
                    label="رقم الهاتف"
                    value={getSafeText(successData.phone)}
                    theme={theme}
                    dir="ltr"
                  />

                  <InfoCard
                    icon={<Mail className="h-4 w-4" />}
                    label="البريد الإلكتروني"
                    value={getSafeText(successData.email)}
                    theme={theme}
                    dir="ltr"
                    breakAll
                  />

                  {extraFields.map((field) => (
                    <InfoCard
                      key={field.id}
                      label={field.labelAr || field.labelEn || field.key}
                      value={formatCustomFieldValue(customFields[field.key])}
                      theme={theme}
                      dir={getFieldDirection(field.type)}
                      breakAll={
                        field.type === "EMAIL" ||
                        field.type === "PHONE" ||
                        field.type === "NUMBER"
                      }
                    />
                  ))}

                  <InfoCard
                    label="رقم التسجيل"
                    value={successData.publicId || successData.registrationId}
                    theme={theme}
                    dir="ltr"
                    breakAll
                    className="md:col-span-2"
                    valueStyle={{ color: theme.primary }}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="تاريخ الفعالية"
                    value={formatDate(event?.startsAt)}
                    theme={theme}
                  />
                </div>
              </section>

              <aside className="w-full lg:col-start-1 lg:row-start-1">
                <div
                  className="flex h-full flex-col border border-white/15 bg-black/52 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                  style={radiusLg}
                >
                  <div className="mb-5 text-right">
                    <div className="mb-2 flex items-center justify-end gap-2">
                      <p className="text-xl font-extrabold text-white">
                        رمز الدخول
                      </p>

                      <QrCode
                        className="h-5 w-5"
                        style={{ color: theme.primary }}
                      />
                    </div>

                    <p className="text-xs font-bold leading-6 text-white">
                      استخدم هذا الرمز عند بوابة الدخول، ولا تشاركه مع أحد.
                    </p>
                  </div>

                  <div className="grid flex-1 items-center gap-8 md:grid-cols-[auto_1fr]">
                    <div className="flex justify-center md:justify-start max-md:mb-4">
                      <div
                        className="relative bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                        style={radiusMd}
                      >
                        <div
                          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center text-white shadow-lg"
                          style={{
                            borderRadius: `calc(${theme.radius} / 1.5)`,
                            backgroundColor: theme.primary,
                          }}
                        >
                          <ShieldCheck className="h-5 w-5" />
                        </div>

                        {qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt="Registration QR"
                            className="h-48 w-48 object-contain md:h-52 md:w-52"
                            style={radiusMd}
                          />
                        ) : qrValue ? (
                          <div
                            ref={qrContainerRef}
                            className="bg-white"
                            style={radiusMd}
                          >
                            <QRCodeSVG
                              value={qrValue}
                              size={205}
                              includeMargin
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-48 w-48 items-center justify-center border border-dashed border-red-200 bg-red-50 px-5 text-center md:h-52 md:w-52"
                            style={radiusMd}
                          >
                            <p className="max-w-[200px] text-sm font-extrabold leading-7 text-red-700">
                              لم يرجع qrToken من الخادم. لا يمكن إنشاء QR صالح
                              للمسح.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4 md:pr-4">
                      {qrImageUrl ? (
                        <a
                          href={qrImageUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={() => setPrimaryHover(true)}
                          onMouseLeave={() => setPrimaryHover(false)}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                          style={primaryButtonStyle}
                        >
                          <Download className="h-5 w-5" />
                          تحميل QR
                        </a>
                      ) : qrValue ? (
                        <button
                          type="button"
                          onClick={downloadRenderedQr}
                          onMouseEnter={() => setPrimaryHover(true)}
                          onMouseLeave={() => setPrimaryHover(false)}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                          style={primaryButtonStyle}
                        >
                          <Download className="h-5 w-5" />
                          تحميل QR
                        </button>
                      ) : null}

                      <Link
                        href={`/register/${eventId}`}
                        onMouseEnter={() => setSecondaryHover(true)}
                        onMouseLeave={() => setSecondaryHover(false)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-4 text-sm font-extrabold transition hover:-translate-y-0.5"
                        style={secondaryButtonStyle}
                      >
                        <RotateCcw className="h-5 w-5" />
                        تسجيل شخص آخر
                      </Link>
                    </div>
                  </div>

                  {!qrValue && !qrImageUrl ? (
                    <div
                      className="mt-4 border border-red-400/30 bg-red-500/10 p-4 text-center text-sm font-extrabold leading-7 text-red-200"
                      style={radiusMd}
                    >
                      يجب أن يرجع الباك qrToken كـ string أو qrImageUrl.
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
  theme,
  dir,
  breakAll,
  className = "",
  valueClassName = "text-white",
  valueStyle,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  theme: ReturnType<typeof getTheme>;
  dir?: "rtl" | "ltr";
  breakAll?: boolean;
  className?: string;
  valueClassName?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div
      className={`border border-white/10 bg-black/28 p-4 backdrop-blur-xl ${className}`}
      style={{
        borderRadius: theme.radius,
      }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
        {icon ? <span style={{ color: theme.primary }}>{icon}</span> : null}
        {label}
      </div>

      <p
        dir={dir}
        className={`text-base font-extrabold ${breakAll ? "break-all" : ""} ${
          dir === "ltr" ? "text-left" : ""
        } ${valueClassName}`}
        style={valueStyle}
      >
        {value || "—"}
      </p>
    </div>
  );
}
