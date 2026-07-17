import { Download, Printer, QrCode, ScanLine, X } from "lucide-react";
import { CSSProperties, ReactNode } from "react";
import {
  formatCustomValue,
  getStatusLabel,
} from "../utils/staff-scanner.helpers";
import {
  StaffScannerTheme,
  StaffScannerVisitor,
  StaffScannerVisitorSource,
} from "../utils/staff-scanner.types";
import { StaffVisitorPrintBadge } from "./StaffVisitorPrintBadge";

export function StaffVisitorCard({
  source,
  theme,
  visitor,
  eventTitle,
  checkpointName,
  qrImageUrl,
  qrToken,
  extraFields,
  isGeneratingQr,
  isSubmittingScan,
  isPrintingBadge,
  canScan,
  onScan,
  onGenerateQr,
  onPrintBadge,
  onClear,
}: {
  source: StaffScannerVisitorSource;
  theme: StaffScannerTheme;
  visitor: StaffScannerVisitor;
  eventTitle: string;
  checkpointName: string;
  qrImageUrl: string;
  qrToken: string;
  extraFields: { key: string; label: string; value: unknown }[];
  isGeneratingQr: boolean;
  isSubmittingScan: boolean;
  isPrintingBadge?: boolean;
  canScan: boolean;
  onScan: (() => void) | null;
  onGenerateQr: () => void;
  onPrintBadge?: () => void;
  onClear: () => void;
}) {
  function downloadQr() {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${visitor.publicId || visitor.fullName || "visitor-qr"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function printBadge() {
    if (onPrintBadge) {
      onPrintBadge();
      return;
    }

    window.print();
  }

  const mainFields = [
    {
      label: "الهاتف",
      value: visitor.phone || "—",
      dir: "ltr" as const,
    },
    {
      label: "البريد",
      value: visitor.email || "—",
      dir: "ltr" as const,
    },
    {
      label: "نوع الحضور",
      value: visitor.attendeeTypeName,
    },
    {
      label: "الحالة",
      value: getStatusLabel(visitor.status),
    },
  ];

  const visibleExtraFields = extraFields.slice(0, 4);

  return (
    <div className="mt-5 print:bg-transparent">
      <StaffVisitorPrintBadge
        theme={theme}
        visitor={visitor}
        eventTitle={eventTitle}
        qrImageUrl={qrImageUrl}
        extraFields={extraFields}
      />

      <article
        className="mx-auto w-full max-w-5xl overflow-hidden border border-black/10 bg-amber-600 shadow-[0_18px_55px_rgba(0,0,0,0.08)] print:hidden"
        style={{
          borderRadius: `calc(${theme.radius} + 0.35rem)`,
          color: theme.text,
        }}
      >
        <header
          className="relative px-4 py-4 text-white sm:px-5"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
          }}
        >
          <button
            type="button"
            onClick={onClear}
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-2xl bg-black/20 text-white transition hover:bg-black/30"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-12 text-center">
            <p className="text-[11px] font-black leading-5 text-white/75">
              {eventTitle}
            </p>

            <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight sm:text-3xl">
              {visitor.fullName}
            </h2>

            <p className="mt-1 text-xs font-extrabold text-white/80">
              {checkpointName}
            </p>
          </div>
        </header>

        <div
          className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_260px]"
          style={{ backgroundColor: theme.background }}
        >
          <section className="min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {mainFields.map((field) => (
                <CompactInfo
                  key={field.label}
                  theme={theme}
                  label={field.label}
                  value={field.value}
                  dir={field.dir}
                />
              ))}
            </div>

            {visibleExtraFields.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {visibleExtraFields.map((field) => (
                  <CompactInfo
                    key={field.key}
                    theme={theme}
                    label={field.label}
                    value={formatCustomValue(field.value)}
                  />
                ))}
              </div>
            ) : null}

            {extraFields.length > visibleExtraFields.length ? (
              <p className="text-center text-xs font-bold opacity-45">
                +{extraFields.length - visibleExtraFields.length} حقول إضافية
              </p>
            ) : null}

            {source === "created" ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-xs font-black leading-6 text-emerald-700">
                تم إنشاء التسجيل بنجاح. يمكنك الآن تجهيز QR أو طباعة البادج.
              </p>
            ) : null}
          </section>

          <aside className="mx-auto w-full max-w-[240px] rounded-[1.4rem] bg-white p-3 text-center shadow-sm">
            <p
              className="mb-2 text-xs font-black"
              style={{ color: theme.text }}
            >
              QR الخاص بالزائر
            </p>

            <div className="mx-auto grid min-h-[150px] w-full place-items-center rounded-[1.2rem] border border-black/5 bg-white">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Visitor QR"
                  className="h-32 w-32 object-contain sm:h-36 sm:w-36"
                />
              ) : qrToken ? (
                <div className="mx-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
                  يوجد QR Token ولكن لا توجد صورة QR.
                </div>
              ) : (
                <div className="mx-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
                  لم يتم إرجاع QR لهذا التسجيل.
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-center gap-2 border-t border-black/10 bg-white p-3">
          {onScan ? (
            <IconAction
              title="تسجيل دخول"
              label="دخول"
              disabled={!canScan || isSubmittingScan}
              onClick={onScan}
              style={{ backgroundColor: "#111827", color: "#fff" }}
            >
              <ScanLine className="h-4 w-4" />
            </IconAction>
          ) : null}

          <IconAction
            title="تجهيز QR"
            label=""
            disabled={isGeneratingQr}
            onClick={onGenerateQr}
            style={{ backgroundColor: theme.primary, color: "#fff" }}
          >
            <QrCode className="h-4 w-4" />
          </IconAction>

          <IconAction
            title="معاينة وطباعة البادج"
            label=""
            disabled={Boolean(isPrintingBadge)}
            onClick={printBadge}
          >
            <Printer className="h-4 w-4" />
          </IconAction>

          <IconAction
            title="تحميل QR"
            label=""
            disabled={!qrImageUrl}
            onClick={downloadQr}
          >
            <Download className="h-4 w-4" />
          </IconAction>
        </footer>
      </article>
    </div>
  );
}

function CompactInfo({
  theme,
  label,
  value,
  dir,
}: {
  theme: StaffScannerTheme;
  label: string;
  value?: ReactNode;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div
      className="min-w-0 rounded-2xl bg-white px-3 py-3 text-center shadow-sm"
      style={{ borderRadius: theme.radius }}
    >
      <p className="text-[11px] font-black text-black/35">{label}</p>

      <p
        dir={dir}
        className="mt-1 truncate text-sm font-black"
        style={{ color: theme.text }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function IconAction({
  title,
  label,
  disabled,
  onClick,
  children,
  style,
}: {
  title: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black/10 bg-white px-2 text-xs font-black text-[#4B4B4B] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 sm:max-w-[120px] sm:flex-none sm:px-4"
      style={style}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
