"use client";

import { toPng } from "html-to-image";
import { Printer, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  StaffVisitor,
  StaffVisitorBadgeResponse,
} from "@/features/staff-visitors/staff-visitors.api";
import { AutoFitBadgeText } from "@/features/staff-scanner/components/AutoFitBadgeText";
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
  fontWeight?: string | number;

  textColor?: string;
  boldColor?: string;

  textAlign?: "left" | "center" | "right";

  /**
   * يمكن إضافته من إعدادات قالب البادج.
   * الاسم الكامل يأخذ سطرين افتراضيًا.
   */
  maxLines?: number;

  /**
   * نسبة ارتفاع السطر.
   */
  lineHeight?: number;
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

function normalizeBadgeFieldKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s_.:\-/]+/g, "");
}

function hasBadgeValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return false;
    }

    /*
     * هذه قيم Placeholder وليست بيانات حقيقية.
     *
     * الباك أو formatCustomValue قد يعيدان إحداها
     * عند عدم وجود قيمة مباشرة في Registration.
     */
    const emptyPlaceholders = new Set([
      "—",
      "–",
      "-",
      "--",
      "null",
      "undefined",
      "n/a",
      "na",
    ]);

    return !emptyPlaceholders.has(normalizedValue);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function firstBadgeValue(...values: unknown[]) {
  return values.find((value) => hasBadgeValue(value));
}

function findCustomFieldValue(
  customFields: Record<string, unknown> | null | undefined,
  requestedKey: string,
) {
  if (!customFields) {
    return undefined;
  }

  /*
   * أولًا نحاول بالمفتاح نفسه.
   */
  if (requestedKey in customFields) {
    return customFields[requestedKey];
  }

  /*
   * ثم ندعم اختلاف كتابة المفاتيح:
   *
   * jobTitle
   * job_title
   * job-title
   * job.title
   */
  const normalizedRequestedKey = normalizeBadgeFieldKey(requestedKey);

  const matchingKey = Object.keys(customFields).find((customFieldKey) => {
    return normalizeBadgeFieldKey(customFieldKey) === normalizedRequestedKey;
  });

  return matchingKey ? customFields[matchingKey] : undefined;
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

  if (
    layoutRecord.fields &&
    typeof layoutRecord.fields === "object" &&
    !Array.isArray(layoutRecord.fields)
  ) {
    return layoutRecord.fields;
  }

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
  const exactField = fields.find((field) => field.key === key);

  if (exactField) {
    return exactField;
  }

  const normalizedKey = normalizeBadgeFieldKey(key);

  return fields.find((field) => {
    return normalizeBadgeFieldKey(field.key) === normalizedKey;
  });
}

function getFieldValue(
  key: string,
  data: StaffVisitorBadgeResponse | null,
  visitor: StaffVisitor | null,
  qrImageUrl: string,
) {
  /*
   * أولًا: القيمة المحلولة من الباك.
   * لا نعتمدها إذا كانت null أو فارغة.
   */
  const fromResolvedFields = findField(getBadgeFields(data), key);

  const resolvedFieldValue = fromResolvedFields?.value;

  if (hasBadgeValue(resolvedFieldValue)) {
    return resolvedFieldValue;
  }

  /*
   * لا نستخدم:
   *
   * data?.registration ?? visitor
   *
   * لأن وجود registration من الباك كان يلغي visitor
   * حتى لو كانت customFields موجودة فقط داخل visitor.
   */
  const serverRegistration = data?.registration ?? null;
  const cachedVisitor = visitor ?? null;

  /*
   * الحقول الأساسية الحقيقية.
   */
  const fixedValues: Record<string, unknown> = {
    fullName: firstBadgeValue(
      serverRegistration?.fullName,
      cachedVisitor?.fullName,
    ),

    phone: firstBadgeValue(serverRegistration?.phone, cachedVisitor?.phone),

    publicId: firstBadgeValue(
      serverRegistration?.publicId,
      cachedVisitor?.publicId,
    ),

    "attendeeType.code": firstBadgeValue(
      serverRegistration?.attendeeType?.code,
      cachedVisitor?.attendeeType?.code,
    ),

    "attendeeType.nameAr": firstBadgeValue(
      serverRegistration?.attendeeType?.nameAr,
      cachedVisitor?.attendeeType?.nameAr,
    ),

    "attendeeType.nameEn": firstBadgeValue(
      serverRegistration?.attendeeType?.nameEn,
      cachedVisitor?.attendeeType?.nameEn,
    ),

    qrCode: qrImageUrl,

    qrToken: firstBadgeValue(data?.qr?.qrToken, data?.qr?.token),
  };

  if (key in fixedValues && hasBadgeValue(fixedValues[key])) {
    return fixedValues[key];
  }

  /*
   * الحقول الجديدة الديناميكية.
   *
   * نبحث أولًا داخل customFields القادمة من الباك،
   * ثم داخل visitor الموجود في البحث أو IndexedDB.
   */
  const serverCustomFieldValue = findCustomFieldValue(
    serverRegistration?.customFields,
    key,
  );

  const cachedCustomFieldValue = findCustomFieldValue(
    cachedVisitor?.customFields,
    key,
  );

  const customFieldValue = firstBadgeValue(
    serverCustomFieldValue,
    cachedCustomFieldValue,
  );

  if (hasBadgeValue(customFieldValue)) {
    return customFieldValue;
  }

  /*
   * توافق مع التسجيلات القديمة التي كانت تخزن
   * هذه القيم مباشرة داخل Registration.
   */
  const legacyValues: Record<string, unknown> = {
    email: firstBadgeValue(serverRegistration?.email, cachedVisitor?.email),

    companyName: firstBadgeValue(
      serverRegistration?.companyName,
      cachedVisitor?.companyName,
    ),

    jobTitle: firstBadgeValue(
      serverRegistration?.jobTitle,
      cachedVisitor?.jobTitle,
    ),

    externalId: firstBadgeValue(
      serverRegistration?.externalId,
      cachedVisitor?.externalId,
    ),

    notes: firstBadgeValue(serverRegistration?.notes, cachedVisitor?.notes),
  };

  if (key in legacyValues && hasBadgeValue(legacyValues[key])) {
    return legacyValues[key];
  }

  return null;
}

function getSelectedFieldKeys(
  selectedFields: unknown,
  layoutFields: Record<string, BadgeFieldLayout>,
) {
  const layoutKeys = Object.keys(layoutFields);

  if (!Array.isArray(selectedFields)) {
    return layoutKeys;
  }

  const visibleKeys: string[] = [];
  const mentionedKeys = new Set<string>();
  const hiddenKeys = new Set<string>();

  for (const field of selectedFields) {
    if (typeof field === "string") {
      const key = field.trim();

      if (!key) {
        continue;
      }

      mentionedKeys.add(key);
      visibleKeys.push(key);

      continue;
    }

    const record = asRecord(field);

    const key = typeof record?.key === "string" ? record.key.trim() : "";

    if (!key) {
      continue;
    }

    mentionedKeys.add(key);

    if (record?.visible === false) {
      hiddenKeys.add(key);
      continue;
    }

    visibleKeys.push(key);
  }

  /*
   * بعض القوالب القديمة قد تحتوي الحقل داخل layout
   * لكنه غير موجود داخل selectedFields.
   *
   * نعرضه ما دام لم يتم إخفاؤه صراحةً.
   */
  const legacyLayoutKeys = layoutKeys.filter((key) => {
    return !mentionedKeys.has(key) && !hiddenKeys.has(key);
  });

  return [...new Set([...visibleKeys, ...legacyLayoutKeys])].filter((key) => {
    return Boolean(layoutFields[key]);
  });
}

function isQrField(key: string) {
  return key === "qrCode";
}

function normalizeNumber(value: unknown, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getTextAlignment(layout: BadgeFieldLayout) {
  return layout.textAlign === "left" ||
    layout.textAlign === "center" ||
    layout.textAlign === "right"
    ? layout.textAlign
    : "right";
}

function getJustifyContent(textAlign: "left" | "center" | "right") {
  if (textAlign === "left") {
    return "flex-start";
  }

  if (textAlign === "center") {
    return "center";
  }

  return "flex-end";
}

function getFieldMaxLines(_fieldKey: string, layout: BadgeFieldLayout): number {
  /*
   * جميع الحقول النصية يمكنها استخدام سطرين افتراضيًا.
   * يمكن رفع العدد من إعدادات القالب عبر maxLines.
   */
  const defaultLines = 2;

  const configuredLines = Math.floor(
    normalizeNumber(layout.maxLines, defaultLines),
  );

  return Math.min(6, Math.max(1, configuredLines));
}

function getFieldLineHeight(
  _fieldKey: string,
  layout: BadgeFieldLayout,
): number {
  const defaultLineHeight = 1.06;

  return Math.min(
    1.5,
    Math.max(0.85, normalizeNumber(layout.lineHeight, defaultLineHeight)),
  );
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), {
      once: true,
    });

    image.addEventListener("error", () => resolve(), {
      once: true,
    });
  });
}

export function StaffBadgePreviewModal({
  open,
  theme,
  data,
  visitor,
  eventTitle: _eventTitle,
  onClose,
}: {
  open: boolean;
  theme: StaffScannerTheme;
  data: StaffVisitorBadgeResponse | null;
  visitor: StaffVisitor | null;
  eventTitle: string;
  onClose: () => void;
}) {
  const badgePrintRef = useRef<HTMLDivElement | null>(null);

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

  async function printBadge() {
    const badgeElement = badgePrintRef.current;

    if (!template || !badgeElement) {
      return;
    }

    try {
      const fontSet = (
        document as Document & {
          fonts?: FontFaceSet;
        }
      ).fonts;

      if (fontSet) {
        await fontSet.ready;
      }

      const sourceImages = Array.from(
        badgeElement.querySelectorAll("img"),
      ) as HTMLImageElement[];

      await Promise.all(sourceImages.map(waitForImage));

      /*
       * ننتظر حتى ينتهي AutoFitBadgeText من قياس الاسم
       * وتطبيق حجم الخط النهائي.
       */
      await waitForNextPaint();
      await waitForNextPaint();

      /*
       * نطبع نفس عنصر المعاينة نفسه، وليس HTML مختلفًا.
       */
      const badgeImage = await toPng(badgeElement, {
        pixelRatio: 4,
        cacheBust: true,
        backgroundColor,

        width: Math.round(previewWidth),
        height: Math.round(previewHeight),

        style: {
          margin: "0",
          border: "0",
          boxShadow: "none",
          transform: "none",
        },
      });

      const printFrame = document.createElement("iframe");

      printFrame.setAttribute("aria-hidden", "true");

      printFrame.style.position = "fixed";
      printFrame.style.left = "-10000px";
      printFrame.style.top = "0";

      printFrame.style.width = `${widthMm}mm`;
      printFrame.style.height = `${heightMm}mm`;

      printFrame.style.border = "0";
      printFrame.style.margin = "0";
      printFrame.style.padding = "0";

      document.body.appendChild(printFrame);

      const printDocument = printFrame.contentDocument;
      const printWindow = printFrame.contentWindow;

      if (!printDocument || !printWindow) {
        printFrame.remove();

        throw new Error("PRINT_FRAME_NOT_READY");
      }

      printDocument.open();

      printDocument.write(`
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

              *,
              *::before,
              *::after {
                box-sizing: border-box;

                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              html,
              body {
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;

                min-width: ${widthMm}mm !important;
                min-height: ${heightMm}mm !important;

                max-width: ${widthMm}mm !important;
                max-height: ${heightMm}mm !important;

                margin: 0 !important;
                padding: 0 !important;

                overflow: hidden !important;

                background: #ffffff;
              }

              body {
                position: relative;
              }

              .print-badge {
                position: absolute;
                inset: 0;

                display: block;

                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;

                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;

                object-fit: fill;
                image-rendering: auto;
              }

              @media print {
                html,
                body {
                  width: ${widthMm}mm !important;
                  height: ${heightMm}mm !important;

                  margin: 0 !important;
                  padding: 0 !important;
                }

                .print-badge {
                  width: ${widthMm}mm !important;
                  height: ${heightMm}mm !important;

                  transform: none !important;
                }
              }
            </style>
          </head>

          <body>
            <img
              id="badge-image"
              class="print-badge"
              src="${badgeImage}"
              alt=""
            />
          </body>
        </html>
      `);

      printDocument.close();

      const image = printDocument.getElementById(
        "badge-image",
      ) as HTMLImageElement | null;

      if (image) {
        await waitForImage(image);
      }

      await new Promise<void>((resolve) => {
        printWindow.requestAnimationFrame(() => {
          printWindow.requestAnimationFrame(() => resolve());
        });
      });

      let removed = false;

      const removeFrame = () => {
        if (removed) {
          return;
        }

        removed = true;

        if (printFrame.isConnected) {
          printFrame.remove();
        }
      };

      printWindow.addEventListener("afterprint", removeFrame, {
        once: true,
      });

      window.setTimeout(removeFrame, 60_000);

      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("Could not print badge preview:", error);
    }
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
            onClick={() => void printBadge()}
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
          {/*
           * الغلاف الخارجي للمعاينة فقط.
           * الظل والإطار لا يدخلان في الطباعة.
           */}
          <div
            className="shrink-0 border border-black/15 shadow-xl"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
            }}
          >
            {/*
             * هذا العنصر هو الذي يتحول إلى PNG ويُطبع.
             */}
            <div
              ref={badgePrintRef}
              className="relative h-full w-full overflow-hidden"
              style={{
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
                      className="absolute z-10 grid place-items-center bg-white"
                      style={{
                        left: x,
                        top: y,

                        width,
                        height,

                        padding: Math.max(1, previewScale),
                      }}
                    >
                      {qrImageUrl ? (
                        <img
                          src={qrImageUrl}
                          alt="QR"
                          className="h-full w-full object-contain"
                          style={{
                            imageRendering: "pixelated",
                          }}
                        />
                      ) : (
                        <span className="text-xs font-black">QR</span>
                      )}
                    </div>
                  );
                }

                const isFullName = fieldKey === "fullName";

                /*
                 * fontSize في القالب يعتبر Point تقريبًا.
                 *
                 * 1pt = 0.3528mm
                 * ثم نحوله إلى بكسل المعاينة باستخدام previewScale.
                 */
                const fontSize =
                  normalizeNumber(layout.fontSize, 14) * previewScale * 0.3528;

                /*
                 * نعطي جميع الحقول النصية مساحة مناسبة للاحتواء.
                 *
                 * عندما يكون layout.height محفوظًا في القالب،
                 * تبقى القيمة المحفوظة هي المستخدمة.
                 */
                const heightMm = normalizeNumber(
                  layout.height,
                  isFullName ? 13 : 10,
                );

                const height = heightMm * previewScale;

                const maxLines = getFieldMaxLines(fieldKey, layout);

                const lineHeight = getFieldLineHeight(fieldKey, layout);

                /*
                 * جميع الحقول، وليس الاسم فقط، يمكنها التصغير
                 * تلقائيًا حتى تظهر القيمة كاملة داخل المساحة.
                 */
                const minimumFontSize = Math.min(
                  fontSize,
                  Math.max(5 * previewScale * 0.3528, fontSize * 0.42),
                );

                const bold =
                  layout.bold === true ||
                  layout.fontWeight === "bold" ||
                  Number(layout.fontWeight) >= 700;

                const fieldTextColor =
                  (bold ? layout.boldColor : layout.textColor) ||
                  layout.textColor ||
                  textColor;

                const value = getFieldValue(
                  fieldKey,
                  data,
                  visitor,
                  qrImageUrl,
                );

                const formattedValue = formatCustomValue(value);

                const textAlign = getTextAlignment(layout);

                return (
                  <AutoFitBadgeText
                    key={fieldKey}
                    text={formattedValue}
                    maxFontSize={fontSize}
                    minFontSize={minimumFontSize}
                    maxLines={maxLines}
                    lineHeight={lineHeight}
                    className="absolute z-10"
                    style={{
                      left: x,
                      top: y,

                      width,
                      height,

                      paddingInline: Math.max(2, previewScale * 0.65),

                      color: fieldTextColor,

                      fontWeight: bold ? 900 : layout.fontWeight || 700,

                      textAlign,

                      justifyContent: getJustifyContent(textAlign),

                      direction: "rtl",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
