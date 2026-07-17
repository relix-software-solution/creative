"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  Loader2,
  MessageCircleMore,
  Phone,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { CSSProperties, ReactNode, useMemo, useState } from "react";

import { usePublicEvent } from "@/features/public-events/public-events.queries";
import {
  getPublicRegistrationStorageKey,
  StoredPublicRegistrationSuccess,
} from "@/features/public-events/public-registration-result";
import {
  PublicEvent,
  PublicEventBranding,
  PublicRegistrationField,
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

const fallbackCompanyWhatsappNumber = "963985311777";

function normalizeFieldKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

function isBaseFieldKey(key: string) {
  const normalizedKey = normalizeFieldKey(key);

  return normalizedKey === "fullname" || normalizedKey === "phone";
}

function normalizeWhatsappNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function sanitizeFileName(value: string) {
  const sanitized = value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "ticket";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getStatusLabel(status?: string) {
  if (status === "ACTIVE") {
    return "فعّال";
  }

  if (status === "PENDING") {
    return "بانتظار التفعيل";
  }

  if (status === "CANCELLED") {
    return "ملغي";
  }

  if (status === "BLOCKED") {
    return "محظور";
  }

  return status || "تم التسجيل";
}

function getSafeText(value?: string | null) {
  if (!value || !value.trim()) {
    return "—";
  }

  return value;
}

function getEventInfo(data?: PublicEventResponse | null) {
  if (!data) {
    return null;
  }

  return data.event || data;
}

function getBranding(data?: PublicEventResponse | null) {
  if (!data) {
    return null;
  }

  return (
    data.branding || data.eventBranding || getEventInfo(data)?.branding || null
  );
}

function resolveAssetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

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

function getStoredSuccessData(eventId: string) {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(getPublicRegistrationStorageKey(eventId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredPublicRegistrationSuccess;
  } catch {
    return null;
  }
}

function formatFieldValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

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
    .filter((field) => !isBaseFieldKey(field.key))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getFieldDirection(type?: string) {
  if (type === "EMAIL" || type === "PHONE" || type === "NUMBER") {
    return "ltr";
  }

  return "rtl";
}

function getSuccessFieldValue({
  field,
  successData,
  customFields,
}: {
  field: PublicRegistrationField;
  successData: StoredPublicRegistrationSuccess;
  customFields: Record<string, unknown>;
}) {
  const normalizedKey = normalizeFieldKey(field.key);

  if (normalizedKey === "email") {
    return successData.email;
  }

  if (normalizedKey === "companyname") {
    return successData.companyName;
  }

  if (normalizedKey === "jobtitle") {
    return successData.jobTitle;
  }

  if (normalizedKey === "externalid") {
    return successData.externalId;
  }

  if (normalizedKey === "notes") {
    return successData.notes;
  }

  return customFields[field.key];
}

function isExpired(value?: string | null) {
  if (!value) {
    return false;
  }

  const expirationTime = new Date(value).getTime();

  if (Number.isNaN(expirationTime)) {
    return false;
  }

  return expirationTime <= Date.now();
}

function createBrowserDownload({
  blob,
  fileName,
}: {
  blob: Blob;
  fileName: string;
}) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 5_000);
}

export default function PublicRegistrationSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const eventQuery = usePublicEvent(eventId);
  const eventData = eventQuery.data as PublicEventResponse | undefined;

  const event = useMemo(() => getEventInfo(eventData), [eventData]);

  const theme = useMemo(() => getTheme(eventData), [eventData]);

  const logoUrl = useMemo(() => getLogoUrl(eventData), [eventData]);

  const backgroundUrl = useMemo(() => getBackgroundUrl(eventData), [eventData]);

  const eventTitle = event?.titleAr?.trim() || event?.titleEn?.trim() || "";

  const [successData] = useState<StoredPublicRegistrationSuccess | null>(() =>
    getStoredSuccessData(eventId),
  );

  const [secondaryHover, setSecondaryHover] = useState(false);

  const [whatsappHover, setWhatsappHover] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const [downloadError, setDownloadError] = useState("");

  const registrationReference =
    successData?.publicId || successData?.registrationId || "ticket";

  const digitalTicketImageUrl = useMemo(() => {
    const rawUrl =
      successData?.digitalTicketImageUrl ||
      successData?.digitalTicketUrl ||
      successData?.digitalTicket?.imageUrl ||
      successData?.digitalTicket?.generatedImageUrl ||
      successData?.digitalTicket?.url ||
      "";

    return resolveAssetUrl(rawUrl);
  }, [
    successData?.digitalTicketImageUrl,
    successData?.digitalTicketUrl,
    successData?.digitalTicket?.imageUrl,
    successData?.digitalTicket?.generatedImageUrl,
    successData?.digitalTicket?.url,
  ]);

  const companyWhatsappNumber = useMemo(() => {
    const configuredNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || fallbackCompanyWhatsappNumber;

    return normalizeWhatsappNumber(configuredNumber);
  }, []);

  const ticketRequestToken =
    successData?.whatsappRequest?.ticketRequestToken?.trim() || "";

  const whatsappRequestExpired = isExpired(
    successData?.whatsappRequest?.expiresAt,
  );

  /**
   * لا نستخدم whatsappRequest.url القادم من الباك.
   *
   * نحن نبني رسالة WhatsApp هنا داخل الفرونت،
   * ونضع داخلها ticketRequestToken حتى يستطيع
   * Webhook في الباك التحقق من الطلب وإرسال الصورة.
   */
  const whatsappMessage = useMemo(() => {
    const lines = [
      `الاسم: ${successData?.fullName || "—"}`,
      `رقم التسجيل: ${registrationReference}`,
    ];

    if (eventTitle) {
      lines.push(`الفعالية: ${eventTitle}`);
    }

    return lines.join("\n");
  }, [eventTitle, registrationReference, successData?.fullName]);

  const whatsappRequestUrl = useMemo(() => {
    if (
      !companyWhatsappNumber ||
      whatsappRequestExpired ||
      successData?.whatsappRequest?.enabled === false
    ) {
      return "";
    }

    return `https://wa.me/${companyWhatsappNumber}?text=${encodeURIComponent(
      whatsappMessage,
    )}`;
  }, [
    companyWhatsappNumber,
    whatsappMessage,
    whatsappRequestExpired,
    successData?.whatsappRequest?.enabled,
  ]);

  const extraFields = useMemo(() => {
    const attendeeTypeId =
      successData?.attendeeTypeId || eventData?.attendeeTypes?.[0]?.id || "";

    return getVisibleExtraFields(eventData?.registrationFields, attendeeTypeId);
  }, [
    eventData?.registrationFields,
    eventData?.attendeeTypes,
    successData?.attendeeTypeId,
  ]);

  const configuredFieldKeys = useMemo(
    () => new Set(extraFields.map((field) => normalizeFieldKey(field.key))),
    [extraFields],
  );

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
    backgroundColor: theme.primary,
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

  const whatsappButtonStyle: CSSProperties = {
    ...radiusMd,
    backgroundColor: whatsappHover ? "#168A46" : "#20A957",
    boxShadow: whatsappHover
      ? "0 20px 50px rgba(32,169,87,0.38)"
      : "0 16px 38px rgba(32,169,87,0.28)",
  };

  async function downloadDigitalTicket() {
    if (!digitalTicketImageUrl || isDownloading) {
      return;
    }

    setIsDownloading(true);
    setDownloadError("");

    const safeReference = sanitizeFileName(registrationReference);

    const fileName = `digital-ticket-${safeReference}.png`;

    try {
      const response = await fetch(digitalTicketImageUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json") ||
        contentType.includes("text/html")
      ) {
        throw new Error("The server did not return an image");
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("The downloaded image is empty");
      }

      createBrowserDownload({
        blob,
        fileName,
      });
    } catch (error) {
      console.error("Digital ticket download failed:", error);

      setDownloadError(
        "تعذر تحميل البطاقة. تأكد أن رابط الصورة يعمل وأن الباك يسمح بطلبات CORS من الفرونت.",
      );
    } finally {
      setIsDownloading(false);
    }
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
          className="relative z-10 max-w-lg border border-white/15 bg-black/45 p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          style={radiusLg}
        >
          <h1 className="text-2xl font-extrabold">
            لا توجد نتيجة تسجيل محفوظة
          </h1>

          <p className="mt-3 text-sm font-bold leading-7 text-white/70">
            افتح صفحة التسجيل وأرسل الطلب من جديد.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/register/${eventId}`}
              className="inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-extrabold text-white"
              style={primaryButtonStyle}
            >
              <RotateCcw className="h-5 w-5" />
              الرجوع للتسجيل
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 border px-6 text-sm font-extrabold"
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
          alt={eventTitle}
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

                <h1 className="text-2xl font-extrabold leading-tight text-white md:text-4xl">
                  {eventTitle || "بطاقة الدخول"}
                </h1>

                {event?.titleAr && event?.titleEn ? (
                  <p
                    dir="ltr"
                    className="mt-2 text-right text-sm font-bold md:text-lg"
                    style={{ color: theme.text }}
                  >
                    {event.titleEn}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="w-full lg:col-start-2">
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
                    label="رقم الموبايل"
                    value={getSafeText(successData.phone)}
                    theme={theme}
                    dir="ltr"
                  />

                  {successData.email && !configuredFieldKeys.has("email") ? (
                    <InfoCard
                      label="البريد الإلكتروني"
                      value={successData.email}
                      theme={theme}
                      dir="ltr"
                      breakAll
                    />
                  ) : null}

                  {successData.companyName &&
                  !configuredFieldKeys.has("companyname") ? (
                    <InfoCard
                      label="اسم الشركة"
                      value={successData.companyName}
                      theme={theme}
                    />
                  ) : null}

                  {successData.jobTitle &&
                  !configuredFieldKeys.has("jobtitle") ? (
                    <InfoCard
                      label="المسمى الوظيفي"
                      value={successData.jobTitle}
                      theme={theme}
                    />
                  ) : null}

                  {extraFields.map((field) => (
                    <InfoCard
                      key={field.id}
                      label={field.labelAr || field.labelEn || field.key}
                      value={formatFieldValue(
                        getSuccessFieldValue({
                          field,
                          successData,
                          customFields,
                        }),
                      )}
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
                    valueStyle={{
                      color: theme.text,
                    }}
                  />
                </div>

                {event?.startsAt ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InfoCard
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="تاريخ الفعالية"
                      value={formatDate(event.startsAt)}
                      theme={theme}
                    />
                  </div>
                ) : null}

                <div
                  className="mt-5 border border-emerald-400/20 bg-emerald-500/10 p-5"
                  style={radiusLg}
                >
                  <div className="flex items-start gap-3">
                    <MessageCircleMore className="mt-1 h-6 w-6 shrink-0 text-emerald-300" />

                    <div>
                      <h2 className=" text-base text-white font-extrabold">
                        استلام بطاقة الدخول على WhatsApp
                      </h2>

                      <p className="mt-2 text-sm font-bold leading-7 text-white/65">
                        اضغط الزر ثم أرسل الرسالة الجاهزة. بعد إرسالها سيتولى
                        الباك إرسال البطاقة تلقائيًا.
                      </p>
                    </div>
                  </div>

                  {whatsappRequestExpired ? (
                    <div
                      className="mt-4 border border-amber-300/25 bg-amber-400/10 p-4 text-center text-sm font-bold text-amber-100"
                      style={radiusMd}
                    >
                      انتهت صلاحية طلب البطاقة.
                    </div>
                  ) : whatsappRequestUrl ? (
                    <a
                      href={whatsappRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                      onMouseEnter={() => setWhatsappHover(true)}
                      onMouseLeave={() => setWhatsappHover(false)}
                      className="mt-4 inline-flex min-h-[54px] w-full items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold transition hover:-translate-y-0.5"
                      style={whatsappButtonStyle}
                    >
                      <MessageCircleMore className="h-5 w-5" />
                      طلب بطاقة الدخول عبر WhatsApp
                    </a>
                  ) : (
                    <div
                      className="mt-4 border border-red-300/20 bg-red-500/10 p-4 text-center text-sm font-bold leading-7 text-red-200"
                      style={radiusMd}
                    >
                      تعذر إنشاء رابط WhatsApp.
                    </div>
                  )}
                </div>
              </section>

              <aside className="w-full lg:col-start-1 lg:row-start-1">
                <div
                  className="flex h-full min-h-[390px] flex-col justify-center border border-white/15 bg-black/52 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                  style={radiusLg}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center border border-white/10 bg-white/10"
                      style={radiusMd}
                    >
                      <Download
                        className="h-9 w-9"
                        style={{
                          color: theme.background,
                        }}
                      />
                    </div>

                    <h2 className="mt-5 text-2xl text-white font-extrabold">
                      تحميل بطاقة الدخول
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-white/65">
                      احفظ البطاقة على جهازك وأبرز رمز QR عند بوابة الفعالية.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-4">
                    <button
                      type="button"
                      onClick={downloadDigitalTicket}
                      disabled={!digitalTicketImageUrl || isDownloading}
                      className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold transition hover:-translate-y-0.5  disabled:opacity-50"
                      style={primaryButtonStyle}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}

                      {isDownloading
                        ? "جاري تحميل البطاقة..."
                        : "تحميل بطاقة الدخول PNG"}
                    </button>

                    <Link
                      href={`/register/${eventId}`}
                      onMouseEnter={() => setSecondaryHover(true)}
                      onMouseLeave={() => setSecondaryHover(false)}
                      className="inline-flex min-h-[54px] items-center justify-center gap-2 border px-5 py-4 text-sm font-extrabold transition hover:-translate-y-0.5"
                      style={secondaryButtonStyle}
                    >
                      <RotateCcw className="h-5 w-5" />
                      تسجيل شخص آخر
                    </Link>
                  </div>

                  {!digitalTicketImageUrl ? (
                    <div
                      className="mt-5 border border-amber-300/25 bg-amber-400/10 p-4 text-center text-sm font-bold leading-7 text-amber-100"
                      style={radiusMd}
                    >
                      لم يرجع الباك رابط صورة بطاقة الدخول.
                    </div>
                  ) : null}

                  {downloadError ? (
                    <div
                      className="mt-5 border border-red-300/25 bg-red-500/10 p-4 text-center text-sm font-bold leading-7 text-red-200"
                      style={radiusMd}
                    >
                      {downloadError}
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
  icon?: ReactNode;
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
