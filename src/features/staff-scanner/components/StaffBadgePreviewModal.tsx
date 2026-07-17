import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  StaffVisitor,
  StaffVisitorBadgeResponse,
} from "@/features/staff-visitors/staff-visitors.api";
import {
  escapePrintValue,
  formatCustomValue,
  getVisitorInfoFromStaffVisitor,
  resolveAssetUrl,
} from "../utils/staff-scanner.helpers";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

function getColor(
  colors: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
) {
  const value = colors?.[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

function getQrImageUrl(data: StaffVisitorBadgeResponse | null) {
  return resolveAssetUrl(
    data?.qr?.imageUrl ||
      data?.qr?.publicUrl ||
      data?.qr?.qrImageUrl ||
      data?.qr?.relativePath ||
      "",
  );
}

function getBadgeRows(data: StaffVisitorBadgeResponse | null) {
  return (
    data?.fields
      ?.filter((field) => {
        return !["qrCode", "qrToken", "token", "publicId"].includes(field.key);
      })
      .map((field) => ({
        label: field.labelAr || field.labelEn || field.label || field.key,
        value: formatCustomValue(field.value),
      }))
      .filter((row) => row.value && row.value !== "—") ?? []
  );
}

export function StaffBadgePreviewModal({
  open,
  theme,
  data,
  visitor,
  eventTitle,
  onClose,
}: {
  open: boolean;
  theme: StaffScannerTheme;
  data: StaffVisitorBadgeResponse | null;
  visitor: StaffVisitor | null;
  eventTitle: string;
  onClose: () => void;
}) {
  const scannerVisitor = visitor
    ? getVisitorInfoFromStaffVisitor(visitor)
    : null;

  const template = data?.template;

  const widthMm = Number(template?.widthMm) || 100;
  const heightMm = Number(template?.heightMm) || 150;

  const primary = getColor(template?.colors, "primary", theme.primary);
  const primaryHover = getColor(
    template?.colors,
    "primaryHover",
    theme.primaryHover,
  );
  const background = getColor(template?.colors, "background", theme.background);
  const text = getColor(template?.colors, "text", theme.text);

  const qrImageUrl = getQrImageUrl(data);

  const visitorName =
    data?.registration?.fullName || scannerVisitor?.fullName || "زائر";

  const attendeeTypeName =
    data?.registration?.attendeeType?.nameAr ||
    data?.registration?.attendeeType?.nameEn ||
    data?.registration?.attendeeType?.code ||
    scannerVisitor?.attendeeTypeName ||
    "زائر";

  const backgroundImageUrl = resolveAssetUrl(
    template?.backgroundImageUrl || template?.backgroundImageRelativePath || "",
  );

  const rows = getBadgeRows(data);

  function printBadge() {
    const printWindow = window.open("", "_blank", "width=520,height=760");

    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>${escapePrintValue(visitorName)}</title>
          <style>
            @page {
              size: ${widthMm}mm ${heightMm}mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: ${widthMm}mm;
              min-height: ${heightMm}mm;
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: Arial, sans-serif;
              color: ${text};
            }

            .badge {
              position: relative;
              width: ${widthMm}mm;
              min-height: ${heightMm}mm;
              overflow: hidden;
              background: ${background};
              ${
                backgroundImageUrl
                  ? `background-image: linear-gradient(rgba(255,255,255,0.74), rgba(255,255,255,0.88)), url("${escapePrintValue(
                      backgroundImageUrl,
                    )}");`
                  : ""
              }
              background-size: cover;
              background-position: center;
            }

            .top {
              padding: 9mm 8mm 6mm;
              text-align: center;
              color: #fff;
              background: linear-gradient(135deg, ${primary}, ${primaryHover});
              border-bottom-left-radius: 9mm;
              border-bottom-right-radius: 9mm;
            }

            .event {
              font-size: 12px;
              font-weight: 900;
              line-height: 1.5;
              opacity: 0.92;
            }

            .name {
              margin-top: 4mm;
              font-size: 28px;
              font-weight: 900;
              line-height: 1.25;
              word-break: break-word;
            }

            .type {
              display: inline-block;
              margin-top: 3mm;
              padding: 2mm 5mm;
              border-radius: 999px;
              background: rgba(255,255,255,0.16);
              font-size: 13px;
              font-weight: 900;
            }

            .content {
              padding: 7mm;
            }

            .qr-wrap {
              display: flex;
              justify-content: center;
              margin-bottom: 6mm;
            }

            .qr {
              width: 48mm;
              height: 48mm;
              object-fit: contain;
              border: 1px solid rgba(0,0,0,0.08);
              border-radius: 5mm;
              padding: 3mm;
              background: #fff;
              box-shadow: 0 6px 18px rgba(0,0,0,0.08);
            }

            .rows {
              display: grid;
              gap: 2.5mm;
            }

            .row {
              border-radius: 4mm;
              background: rgba(255,255,255,0.86);
              padding: 2.8mm 3.5mm;
              border: 1px solid rgba(0,0,0,0.06);
            }

            .label {
              font-size: 10px;
              font-weight: 800;
              color: rgba(0,0,0,0.45);
            }

            .value {
              margin-top: 1.4mm;
              font-size: 14px;
              font-weight: 900;
              color: ${text};
              line-height: 1.35;
              word-break: break-word;
            }
          </style>
        </head>

        <body>
          <div class="badge">
            <div class="top">
              <div class="event">${escapePrintValue(eventTitle)}</div>
              <div class="name">${escapePrintValue(visitorName)}</div>
              <div class="type">${escapePrintValue(attendeeTypeName)}</div>
            </div>

            <div class="content">
              ${
                qrImageUrl
                  ? `
                    <div class="qr-wrap">
                      <img class="qr" src="${escapePrintValue(qrImageUrl)}" alt="QR" />
                    </div>
                  `
                  : ""
              }

              <div class="rows">
                ${rows
                  .map(
                    (row) => `
                      <div class="row">
                        <div class="label">${escapePrintValue(row.label)}</div>
                        <div class="value">${escapePrintValue(row.value)}</div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="معاينة البادج"
      description="راجع معلومات البادج قبل الطباعة."
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            إغلاق
          </Button>

          <Button onClick={printBadge} style={{ backgroundColor: primary }}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </>
      }
    >
      <div className="flex justify-center overflow-auto rounded-3xl bg-black/5 p-5">
        <div
          className="overflow-hidden bg-white shadow-xl"
          style={{
            width: `${Math.min(widthMm * 3.2, 360)}px`,
            minHeight: `${Math.min(heightMm * 3.2, 540)}px`,
            borderRadius: 28,
            color: text,
            background,
            backgroundImage: backgroundImageUrl
              ? `linear-gradient(rgba(255,255,255,0.74), rgba(255,255,255,0.88)), url(${backgroundImageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="px-5 py-6 text-center text-white"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${primaryHover})`,
              borderBottomLeftRadius: 34,
              borderBottomRightRadius: 34,
            }}
          >
            <p className="text-xs font-black opacity-80">{eventTitle}</p>

            <h2 className="mt-3 break-words text-3xl font-black leading-tight">
              {visitorName}
            </h2>

            <p className="mt-3 inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-black">
              {attendeeTypeName}
            </p>
          </div>

          <div className="p-5">
            {qrImageUrl ? (
              <div className="mb-5 flex justify-center">
                <img
                  src={qrImageUrl}
                  alt="QR"
                  className="h-44 w-44 rounded-3xl bg-white object-contain p-3 shadow"
                />
              </div>
            ) : null}

            <div className="grid gap-3">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-black/5 bg-white/80 p-3"
                >
                  <p className="text-xs font-black opacity-45">{row.label}</p>

                  <p className="mt-1 break-words text-sm font-black">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
