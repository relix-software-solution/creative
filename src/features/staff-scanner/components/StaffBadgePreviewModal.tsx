"use client";

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

type BadgeFieldLayout = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  bold?: boolean;
  fontWeight?: string;
  textColor?: string;
  boldColor?: string;
};

type BadgeLayoutRecord = {
  fields?: Record<string, BadgeFieldLayout>;
  [key: string]: unknown;
};

type NormalizedBadgeField = {
  key: string;
  label: string;
  value: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getColor(
  colors: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
) {
  const value = colors?.[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

function getTemplateLayout(
  layout: Record<string, unknown> | null | undefined,
): Record<string, BadgeFieldLayout> {
  if (!layout) {
    return {};
  }

  const layoutRecord = layout as BadgeLayoutRecord;

  /*
   * الشكل الرسمي المحفوظ من الباك:
   *
   * {
   *   fields: {
   *     fullName: { x, y, width, fontSize },
   *     qrCode: { x, y, width, height }
   *   }
   * }
   */
  if (
    layoutRecord.fields &&
    typeof layoutRecord.fields === "object" &&
    !Array.isArray(layoutRecord.fields)
  ) {
    return layoutRecord.fields;
  }

  /*
   * دعم نسخ قديمة قد تكون خزنت Field Layout مباشرة.
   */
  const directFields = Object.entries(layout).filter(([, value]) => {
    return Boolean(asRecord(value));
  });

  return Object.fromEntries(
    directFields.map(([key, value]) => [key, value as BadgeFieldLayout]),
  );
}

function getQrImageUrl(data: StaffVisitorBadgeResponse | null) {
  return resolveAssetUrl(
    data?.qr?.imageUrl ||
      data?.qr?.publicUrl ||
      data?.qr?.qrImageUrl ||
      data?.qr?.relativePath ||
      data?.registration?.qrImageUrl ||
      "",
  );
}

function getBadgeFields(
  data: StaffVisitorBadgeResponse | null,
): NormalizedBadgeField[] {
  return (
    data?.fields?.map((field) => ({
      key: field.key,

      label: field.labelAr || field.labelEn || field.label || field.key,

      value: field.value,
    })) ?? []
  );
}

function findField(fields: NormalizedBadgeField[], key: string) {
  return fields.find((field) => field.key === key);
}

function getFieldValue(
  key: string,
  data: StaffVisitorBadgeResponse | null,
  visitor: StaffVisitor | null,
  qrImageUrl: string,
) {
  const fromResolvedFields = findField(getBadgeFields(data), key);

  if (fromResolvedFields) {
    return fromResolvedFields.value;
  }

  const registration = data?.registration ?? visitor;

  const fixedValues: Record<string, unknown> = {
    fullName: registration?.fullName,
    phone: registration?.phone,
    email: registration?.email,
    publicId: registration?.publicId,

    companyName: registration?.companyName,
    jobTitle: registration?.jobTitle,
    externalId: registration?.externalId,

    "attendeeType.code": registration?.attendeeType?.code,

    "attendeeType.nameAr": registration?.attendeeType?.nameAr,

    "attendeeType.nameEn": registration?.attendeeType?.nameEn,

    qrCode: qrImageUrl,

    qrToken: data?.qr?.qrToken || data?.qr?.token || "",
  };

  if (key in fixedValues) {
    return fixedValues[key] ?? null;
  }

  return registration?.customFields?.[key] ?? null;
}

function getSelectedFieldKeys(
  selectedFields: unknown,
  layoutFields: Record<string, BadgeFieldLayout>,
) {
  if (Array.isArray(selectedFields)) {
    const keys = selectedFields
      .map((field) => {
        if (typeof field === "string") {
          return field;
        }

        const record = asRecord(field);

        if (!record) {
          return "";
        }

        if (record.visible === false) {
          return "";
        }

        return typeof record.key === "string" ? record.key : "";
      })
      .filter(Boolean);

    if (keys.length > 0) {
      return keys;
    }
  }

  return Object.keys(layoutFields);
}

function isQrField(key: string) {
  return key === "qrCode";
}

function normalizeNumber(value: unknown, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildFieldHtml(options: {
  fieldKey: string;
  value: unknown;
  layout: BadgeFieldLayout;
  qrImageUrl: string;
  defaultTextColor: string;
}) {
  const { fieldKey, value, layout, qrImageUrl, defaultTextColor } = options;

  const x = normalizeNumber(layout.x, 10);
  const y = normalizeNumber(layout.y, 10);
  const width = normalizeNumber(layout.width, isQrField(fieldKey) ? 26 : 70);

  if (isQrField(fieldKey)) {
    const height = normalizeNumber(layout.height, 26);

    return `
      <div
        class="badge-field qr-field"
        style="
          left:${x}mm;
          top:${y}mm;
          width:${width}mm;
          height:${height}mm;
        "
      >
        ${
          qrImageUrl
            ? `<img src="${escapeHtml(qrImageUrl)}" alt="QR" />`
            : `<span>QR</span>`
        }
      </div>
    `;
  }

  const fontSize = normalizeNumber(layout.fontSize, 14);

  const bold = layout.bold === true || layout.fontWeight === "bold";

  const textColor =
    (bold ? layout.boldColor : layout.textColor) ||
    layout.textColor ||
    defaultTextColor;

  return `
    <div
      class="badge-field text-field"
      style="
        left:${x}mm;
        top:${y}mm;
        width:${width}mm;
        font-size:${fontSize}pt;
        font-weight:${bold ? 900 : 700};
        color:${escapeHtml(textColor)};
      "
    >
      ${escapeHtml(formatCustomValue(value))}
    </div>
  `;
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

  const widthMm = normalizeNumber(template?.widthMm, 90);

  const heightMm = normalizeNumber(template?.heightMm, 120);

  const colors = template?.colors as Record<string, unknown> | null;

  const backgroundColor = getColor(colors, "background", theme.background);

  const textColor = getColor(colors, "text", theme.text);

  const backgroundImageUrl = resolveAssetUrl(
    template?.backgroundImageUrl || template?.backgroundImageRelativePath || "",
  );

  const qrImageUrl = getQrImageUrl(data);

  const layoutFields = getTemplateLayout(template?.layout);

  const selectedFieldKeys = getSelectedFieldKeys(
    template?.selectedFields,
    layoutFields,
  );

  const visitorName =
    data?.registration?.fullName ||
    scannerVisitor?.fullName ||
    visitor?.fullName ||
    "زائر";

  const previewScale = Math.min(
    3.2,
    420 / Math.max(widthMm, 1),
    590 / Math.max(heightMm, 1),
  );

  const previewWidth = widthMm * previewScale;
  const previewHeight = heightMm * previewScale;

  function printBadge() {
    if (!template) {
      return;
    }

    const fieldsHtml = selectedFieldKeys
      .map((fieldKey) => {
        const layout = layoutFields[fieldKey];

        if (!layout) {
          return "";
        }

        const value = getFieldValue(fieldKey, data, visitor, qrImageUrl);

        return buildFieldHtml({
          fieldKey,
          value,
          layout,
          qrImageUrl,
          defaultTextColor: textColor,
        });
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=520,height=760");

    if (!printWindow) {
      return;
    }

    printWindow.document.open();

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

              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html,
            body {
              width: ${widthMm}mm;
              height: ${heightMm}mm;

              margin: 0;
              padding: 0;

              overflow: hidden;

              background: #ffffff;

              font-family: Arial, Tahoma, sans-serif;
            }

            .badge {
              position: relative;

              width: ${widthMm}mm;
              height: ${heightMm}mm;

              overflow: hidden;

              background-color: ${escapeHtml(backgroundColor)};

              ${
                backgroundImageUrl
                  ? `
                    background-image: url("${escapeHtml(backgroundImageUrl)}");
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                  `
                  : ""
              }
            }

            .badge-background {
              position: absolute;
              inset: 0;

              width: 100%;
              height: 100%;

              object-fit: cover;

              z-index: 0;
            }

            .badge-field {
              position: absolute;
              z-index: 2;
            }

            .text-field {
              direction: rtl;
              text-align: right;

              display: flex;
              align-items: center;
              justify-content: flex-end;

              min-height: 7mm;

              overflow: hidden;

              line-height: 1.15;

              word-break: break-word;
              overflow-wrap: anywhere;
            }

            .qr-field {
              display: flex;
              align-items: center;
              justify-content: center;

              background: #ffffff;

              padding: 1mm;

              overflow: hidden;
            }

            .qr-field img {
              display: block;

              width: 100%;
              height: 100%;

              object-fit: contain;
            }
          </style>
        </head>

        <body>
          <div class="badge">
            ${
              backgroundImageUrl
                ? `
                  <img
                    class="badge-background"
                    src="${escapeHtml(backgroundImageUrl)}"
                    alt=""
                  />
                `
                : ""
            }

            ${fieldsHtml}
          </div>

          <script>
            async function waitForImages() {
              const images = Array.from(document.images);

              await Promise.all(
                images.map(function (image) {
                  if (image.complete) {
                    return Promise.resolve();
                  }

                  return new Promise(function (resolve) {
                    image.addEventListener(
                      "load",
                      resolve,
                      { once: true }
                    );

                    image.addEventListener(
                      "error",
                      resolve,
                      { once: true }
                    );
                  });
                })
              );
            }

            window.addEventListener(
              "load",
              async function () {
                await waitForImages();

                window.setTimeout(function () {
                  window.focus();
                  window.print();
                }, 150);
              }
            );
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
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
            إغلاق
          </Button>

          <Button
            onClick={printBadge}
            disabled={!template}
            style={{
              backgroundColor: theme.primary,
            }}
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </>
      }
    >
      {!template ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-black leading-7 text-amber-800">
          لا يوجد قالب بادج محفوظ لهذه الفعالية.
        </div>
      ) : (
        <div className="flex justify-center overflow-auto rounded-3xl bg-black/5 p-5">
          <div
            className="relative shrink-0 overflow-hidden border border-black/15 shadow-xl"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,

              backgroundColor,

              backgroundImage: backgroundImageUrl
                ? `url("${backgroundImageUrl}")`
                : undefined,

              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {selectedFieldKeys.map((fieldKey) => {
              const layout = layoutFields[fieldKey];

              if (!layout) {
                return null;
              }

              const x = normalizeNumber(layout.x, 10) * previewScale;

              const y = normalizeNumber(layout.y, 10) * previewScale;

              const width =
                normalizeNumber(layout.width, isQrField(fieldKey) ? 26 : 70) *
                previewScale;

              if (isQrField(fieldKey)) {
                const height =
                  normalizeNumber(layout.height, 26) * previewScale;

                return (
                  <div
                    key={fieldKey}
                    className="absolute z-10 grid place-items-center bg-white p-1"
                    style={{
                      left: x,
                      top: y,
                      width,
                      height,
                    }}
                  >
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-black">QR</span>
                    )}
                  </div>
                );
              }

              const fontSize =
                normalizeNumber(layout.fontSize, 14) * previewScale * 0.3528;

              const bold = layout.bold === true || layout.fontWeight === "bold";

              const fieldTextColor =
                (bold ? layout.boldColor : layout.textColor) ||
                layout.textColor ||
                textColor;

              const value = getFieldValue(fieldKey, data, visitor, qrImageUrl);

              return (
                <div
                  key={fieldKey}
                  className="absolute z-10 flex items-center justify-end overflow-hidden text-right leading-tight"
                  style={{
                    left: x,
                    top: y,
                    width,

                    minHeight: Math.max(fontSize * 1.45, 18),

                    color: fieldTextColor,

                    fontSize,
                    fontWeight: bold ? 900 : 700,
                  }}
                >
                  <span
                    className="block w-full overflow-hidden break-words"
                    style={{
                      lineHeight: 1.15,

                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {formatCustomValue(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
