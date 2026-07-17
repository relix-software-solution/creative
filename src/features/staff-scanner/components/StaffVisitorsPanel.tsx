import { Loader2, Printer, ScanLine, Search, UserPlus } from "lucide-react";
import { CSSProperties, FormEvent, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicRegistrationField } from "@/features/public-events/public-events.types";
import { StaffVisitor } from "@/features/staff-visitors/staff-visitors.queries";
import {
  formatCustomValue,
  getExtraFields,
  getStatusLabel,
} from "../utils/staff-scanner.helpers";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

type VisitorBadgeField = {
  key: string;
  label: string;
  value: unknown;
};

type VisitorBadgeLayoutField = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
};

type VisitorBadge = {
  templateId?: string;
  widthMm?: number;
  heightMm?: number;
  backgroundImageUrl?: string | null;
  colors?: {
    primary?: string | null;
    text?: string | null;
    background?: string | null;
  } | null;
  layout?: {
    fields?: Record<string, VisitorBadgeLayoutField>;
  } | null;
  fields?: VisitorBadgeField[];
};

type StaffVisitorWithBadge = StaffVisitor & {
  badge?: VisitorBadge | null;
  qr?: {
    qrToken?: string | null;
    imageUrl?: string | null;
    relativePath?: string | null;
    status?: string | null;
  } | null;
};

type StaffVisitorWithLegacyAttendeeType = StaffVisitor & {
  attendeeTypeName?: string | null;
  attendee_type_name?: string | null;
  attendee_type?: {
    nameAr?: string | null;
    nameEn?: string | null;
    code?: string | null;
  } | null;
};

export function StaffVisitorsPanel({
  theme,
  searchInput,
  setSearchInput,
  onSearch,
  isFetching,
  isError,
  searchEnabled,
  visitors,
  registrationFields,
  onCreate,
  onPrint,
  onGenerateQr,
  onScan,
  generatingVisitorId,
  scanningVisitorId,
  printingVisitorId,
}: {
  theme: StaffScannerTheme;
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearch: (event?: FormEvent<HTMLFormElement>) => void;
  isFetching: boolean;
  isError: boolean;
  searchEnabled: boolean;
  visitors: StaffVisitor[];
  registrationFields: PublicRegistrationField[];
  onCreate: () => void;
  onPrint: (visitor: StaffVisitor) => void | Promise<void>;
  onGenerateQr: (visitor: StaffVisitor) => void | Promise<void>;
  onScan: (visitor: StaffVisitor) => void | Promise<void>;
  generatingVisitorId?: string;
  scanningVisitorId?: string;
  printingVisitorId?: string;
}) {
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    onSearch(event);
  }

  function getAttendeeTypeName(visitor: StaffVisitor) {
    const visitorWithLegacyFields = visitor as StaffVisitorWithLegacyAttendeeType;

    return (
      visitor.attendeeType?.nameAr ||
      visitor.attendeeType?.nameEn ||
      visitor.attendeeType?.code ||
      visitorWithLegacyFields.attendeeTypeName ||
      visitorWithLegacyFields.attendee_type_name ||
      visitorWithLegacyFields.attendee_type?.nameAr ||
      visitorWithLegacyFields.attendee_type?.nameEn ||
      visitorWithLegacyFields.attendee_type?.code ||
      "—"
    );
  }

  function handlePrint(visitor: StaffVisitor) {
    const visitorWithBadge = visitor as StaffVisitorWithBadge;

    if (visitorWithBadge.badge) {
      printVisitorBadge(visitorWithBadge);
      return;
    }

    onPrint(visitor);
  }

  return (
    <section
      className="mt-5 border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-6"
      style={{ borderRadius: `calc(${theme.radius} + 0.5rem)` }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-right">
          <h3 className="text-lg font-extrabold" style={{ color: theme.text }}>
            الزوار والتسجيلات
          </h3>

          <p
            className="mt-1 text-xs font-bold opacity-55"
            style={{ color: theme.text }}
          >
            ابحث بالاسم أو الهاتف أو البريد، ثم نفّذ الإجراء.
          </p>
        </div>

        <Button
          type="button"
          onClick={onCreate}
          className="h-11 w-full sm:w-auto"
          style={{ backgroundColor: theme.primary }}
        >
          <UserPlus className="h-4 w-4" />
          تسجيل جديد
        </Button>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={handleSearch}
      >
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="اكتب اسم الزائر أو رقمه أو بريده..."
          className="h-12 w-full border border-black/10 bg-white px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:ring-4"
          style={
            {
              borderRadius: theme.radius,
              color: theme.text,
              "--tw-ring-color": `${theme.primary}1A`,
            } as CSSProperties
          }
        />

        <Button
          type="submit"
          disabled={isFetching}
          className="h-12 w-full sm:w-auto"
          style={{ backgroundColor: theme.primary }}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          بحث
        </Button>
      </form>

      {searchEnabled && isError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold leading-7 text-red-700">
          تعذر البحث عن الزوار. تأكد أن endpoint /staff/visitors مسموح لحساب
          الستاف.
        </div>
      ) : null}

      {searchEnabled && !isFetching && visitors.length === 0 ? (
        <div
          className="mt-4 border border-black/10 p-4 text-center text-sm font-bold opacity-65"
          style={{
            borderRadius: theme.radius,
            backgroundColor: theme.background,
            color: theme.text,
          }}
        >
          لا توجد نتائج مطابقة.
        </div>
      ) : null}

      {visitors.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visitors.map((visitor) => {
            const visitorWithBadge = visitor as StaffVisitorWithBadge;

            const extraFields = getExtraFields(
              visitor.customFields ?? {},
              registrationFields,
            );

            const isGenerating = generatingVisitorId === visitor.id;
            const isScanning = scanningVisitorId === visitor.id;
            const isPrinting = printingVisitorId === visitor.id;

            return (
              <article
                key={visitor.id}
                className="overflow-hidden border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderRadius: theme.radius }}
              >
                <div
                  className="border-b border-black/5 px-4 py-4 text-center"
                  style={{ backgroundColor: `${theme.primary}0D` }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h4
                      className="max-w-full truncate text-lg font-extrabold leading-7"
                      style={{ color: theme.text }}
                    >
                      {visitor.fullName || "—"}
                    </h4>

                    <Badge
                      variant={
                        visitor.status === "ACTIVE" ? "success" : "warning"
                      }
                    >
                      {getStatusLabel(visitor.status)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoItem label="الهاتف" dir="ltr">
                      {visitor.phone || "—"}
                    </InfoItem>

                    <InfoItem label="البريد" dir="ltr">
                      {visitor.email || "—"}
                    </InfoItem>

                    <InfoItem label="نوع الحضور">
                      {getAttendeeTypeName(visitor)}
                    </InfoItem>

                    <InfoItem label="الحالة">
                      {getStatusLabel(visitor.status)}
                    </InfoItem>
                  </div>

                  <div className="border-t border-black/5 pt-3">
                    <p
                      className="mb-2 text-center text-xs font-black opacity-55"
                      style={{ color: theme.text }}
                    >
                      الحقول الإضافية
                    </p>

                    {extraFields.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {extraFields.slice(0, 4).map((field) => (
                          <InfoItem key={field.key} label={field.label}>
                            {formatCustomValue(field.value)}
                          </InfoItem>
                        ))}

                        {extraFields.length > 4 ? (
                          <div className="col-span-2 rounded-xl bg-black/[0.03] px-3 py-2 text-center text-xs font-black opacity-45">
                            +{extraFields.length - 4} حقول أخرى
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-black/[0.03] px-3 py-2 text-center text-sm font-bold opacity-40">
                        —
                      </div>
                    )}
                  </div>

                  {visitorWithBadge.badge ? (
                    <div className="border-t border-black/5 pt-3">
                      <p
                        className="mb-3 text-center text-xs font-black opacity-55"
                        style={{ color: theme.text }}
                      >
                        معاينة البادج
                      </p>

                      <BadgePreview visitor={visitorWithBadge} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-black leading-6 text-amber-700">
                      لا يوجد قالب بادج مرتبط بهذه الفعالية بعد.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <ActionButton
                      title="عمل سكان لهذا الزائر"
                      label=""
                      disabled={isScanning || isGenerating || isPrinting}
                      onClick={() => onScan(visitor)}
                      className="h-11 min-w-0 px-2"
                      style={{
                        backgroundColor: "#111827",
                        color: "#fff",
                      }}
                    >
                      {isScanning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ScanLine className="h-4 w-4" />
                      )}
                    </ActionButton>

                    <ActionButton
                      title="معاينة وطباعة البادج"
                      label=""
                      disabled={isPrinting || isScanning || isGenerating}
                      onClick={() => handlePrint(visitor)}
                      className="h-11 min-w-0 px-2"
                    >
                      {isPrinting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function BadgePreview({ visitor }: { visitor: StaffVisitorWithBadge }) {
  const badge = visitor.badge;
  if (!badge) return null;

  const widthMm = badge.widthMm || 90;
  const heightMm = badge.heightMm || 120;
  const ratio = heightMm / widthMm;

  const previewWidth = 150;
  const previewHeight = previewWidth * ratio;

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden border border-black/10 bg-white shadow-sm"
        style={{
          width: previewWidth,
          height: previewHeight,
          borderRadius: 18,
          backgroundColor: badge.colors?.background || "#fff",
          color: badge.colors?.text || "#111827",
        }}
      >
        {badge.backgroundImageUrl ? (
          <img
            src={resolveAssetUrl(badge.backgroundImageUrl)}
            alt="Badge background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        <div className="absolute inset-0">
          {(badge.fields || []).map((field) => {
            const layout = badge.layout?.fields?.[field.key] || {};
            const isQr = field.key === "qrCode";

            const left = ((layout.x || 0) / widthMm) * previewWidth;
            const top = ((layout.y || 0) / heightMm) * previewHeight;
            const fieldWidth = ((layout.width || 40) / widthMm) * previewWidth;
            const fieldHeight =
              ((layout.height || 10) / heightMm) * previewHeight;
            const fontSize = Math.max(
              ((layout.fontSize || 10) / 120) * previewHeight,
              8,
            );

            if (isQr) {
              const qrUrl =
                typeof field.value === "string"
                  ? field.value
                  : visitor.qr?.relativePath || visitor.qr?.imageUrl || "";

              return (
                <div
                  key={field.key}
                  className="absolute grid place-items-center rounded-md bg-white p-1"
                  style={{
                    left,
                    top,
                    width: fieldWidth,
                    height: fieldHeight,
                  }}
                >
                  {qrUrl ? (
                    <img
                      src={resolveAssetUrl(qrUrl)}
                      alt="QR"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] font-black">QR</span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={field.key}
                className="absolute truncate text-right font-black"
                style={{
                  left,
                  top,
                  width: fieldWidth,
                  fontSize,
                  color: badge.colors?.text || "#111827",
                }}
                title={`${field.label}: ${formatBadgeValue(field.value)}`}
              >
                {formatBadgeValue(field.value)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  children,
  dir,
}: {
  label: string;
  children: ReactNode;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-black/5 bg-black/[0.025] px-3 py-3 text-center">
      <p className="mb-1 text-[11px] font-black text-[#4B4B4B]/40">{label}</p>

      <p
        dir={dir}
        className="truncate text-center text-sm font-extrabold text-[#2f2f2f]"
      >
        {children}
      </p>
    </div>
  );
}

function ActionButton({
  title,
  label,
  disabled,
  onClick,
  children,
  style,
  className = "",
}: {
  title: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (disabled) return;

        onClick();
      }}
      className={`pointer-events-auto relative z-10 inline-flex h-10 min-w-[74px] items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-black text-[#4B4B4B] transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={style}
    >
      {children}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.pathname.startsWith("/uploads/")) {
        return parsedUrl.pathname;
      }

      return url;
    } catch {
      return url;
    }
  }

  if (url.startsWith("/uploads/")) {
    return url;
  }

  if (url.startsWith("uploads/")) {
    return `/${url}`;
  }

  return `/uploads/${url.startsWith("/") ? url.slice(1) : url}`;
}

function formatBadgeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return formatCustomValue(value);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printVisitorBadge(visitor: StaffVisitorWithBadge) {
  const badge = visitor.badge;
  if (!badge) return;

  const widthMm = badge.widthMm || 90;
  const heightMm = badge.heightMm || 120;
  const backgroundUrl = resolveAssetUrl(badge.backgroundImageUrl);
  const textColor = badge.colors?.text || "#111827";
  const backgroundColor = badge.colors?.background || "#ffffff";

  const fieldsHtml = (badge.fields || [])
    .map((field) => {
      const layout = badge.layout?.fields?.[field.key] || {};
      const x = layout.x ?? 0;
      const y = layout.y ?? 0;
      const width = layout.width ?? 70;
      const height = layout.height ?? 10;
      const fontSize = layout.fontSize ?? 12;

      if (field.key === "qrCode") {
        const qrUrl = resolveAssetUrl(
          typeof field.value === "string"
            ? field.value
            : visitor.qr?.relativePath || visitor.qr?.imageUrl || "",
        );

        return `
          <div class="badge-field qr-field" style="
            left:${x}mm;
            top:${y}mm;
            width:${width}mm;
            height:${height}mm;
          ">
            ${
              qrUrl
                ? `<img src="${escapeHtml(qrUrl)}" alt="QR" />`
                : `<span>QR</span>`
            }
          </div>
        `;
      }

      return `
        <div class="badge-field text-field" style="
          left:${x}mm;
          top:${y}mm;
          width:${width}mm;
          font-size:${fontSize}pt;
          color:${escapeHtml(textColor)};
        ">
          ${escapeHtml(formatBadgeValue(field.value))}
        </div>
      `;
    })
    .join("");

  const html = `
    <!doctype html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>Badge - ${escapeHtml(visitor.fullName || "Visitor")}</title>
        <style>
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Arial, Tahoma, sans-serif;
          }

          .badge {
            position: relative;
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            overflow: hidden;
            background: ${escapeHtml(backgroundColor)};
          }

          .badge-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .badge-field {
            position: absolute;
            z-index: 2;
          }

          .text-field {
            direction: rtl;
            text-align: right;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
          }

          .qr-field {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            padding: 1.5mm;
          }

          .qr-field img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }

          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="badge">
          ${
            backgroundUrl
              ? `<img class="badge-bg" src="${escapeHtml(backgroundUrl)}" alt="" />`
              : ""
          }

          ${fieldsHtml}
        </div>

        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 350);
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=420,height=640");

  if (!printWindow) {
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
