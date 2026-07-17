"use client";

import { useId, type ChangeEventHandler, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeAvailableField } from "@/features/events/events.types";
import {
  BadgeFieldLayoutMap,
  BadgeVisibleMap,
  ImageChangeHandler,
  ImageRemoveHandler,
} from "../_lib/events-page.types";
import { resolveAssetUrl, toNumber } from "../_lib/events-page.utils";

export type BadgeState = {
  badgeEnabled: boolean;
  setBadgeEnabled: (value: boolean) => void;

  badgeName: string;
  setBadgeName: (value: string) => void;

  badgeWidthMm: string;
  setBadgeWidthMm: (value: string) => void;

  badgeHeightMm: string;
  setBadgeHeightMm: (value: string) => void;

  badgePrimaryColor: string;
  setBadgePrimaryColor: (value: string) => void;

  badgeTextColor: string;
  setBadgeTextColor: (value: string) => void;

  badgeBackgroundColor: string;
  setBadgeBackgroundColor: (value: string) => void;

  badgeBackgroundPreview: string;

  visibleFields: BadgeVisibleMap;
  setVisibleFields: (value: BadgeVisibleMap) => void;

  fieldLayout: BadgeFieldLayoutMap;
  setFieldLayout: (value: BadgeFieldLayoutMap) => void;
};

function getFieldLabel(field: BadgeAvailableField) {
  if (field.key === "fullName") return "الاسم الكامل";
  if (field.key === "qrCode") return "رمز QR";

  return field.labelAr || field.labelEn || field.key;
}

function getPreviewText(field: BadgeAvailableField) {
  if (field.key === "fullName") return "الاسم الكامل للزائر";
  if (field.key === "qrCode") return "QR";
  if (field.key === "companyName") return "اسم الشركة";
  if (field.key === "jobTitle") return "المسمى الوظيفي";
  if (field.key === "email") return "visitor@example.com";
  if (field.key === "phone") return "0999999999";

  return field.labelAr || field.labelEn || field.key;
}

function isQrField(field: BadgeAvailableField) {
  return field.key === "qrCode" || field.type === "QR";
}

function isBaseField(field: BadgeAvailableField) {
  return field.key === "fullName" || field.key === "qrCode";
}

function isCustomField(field: BadgeAvailableField) {
  return String(field.source).toUpperCase() === "CUSTOM";
}

function getDefaultLayout(field: BadgeAvailableField, index = 0) {
  if (isQrField(field)) {
    return {
      x: 58,
      y: 78,
      width: 26,
      height: 26,
    };
  }

  if (field.key === "fullName") {
    return {
      x: 10,
      y: 20,
      width: 70,
      fontSize: 18,
    };
  }

  return {
    x: 10,
    y: 34 + index * 10,
    width: 70,
    fontSize: 12,
  };
}

function setLayoutValue({
  fieldKey,
  layout,
  setLayout,
  patch,
}: {
  fieldKey: string;
  layout: BadgeFieldLayoutMap;
  setLayout: (value: BadgeFieldLayoutMap) => void;
  patch: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  }>;
}) {
  setLayout({
    ...layout,
    [fieldKey]: {
      ...(layout[fieldKey] ?? { x: 10, y: 10 }),
      ...patch,
    },
  });
}

export function EventBadgeSection({
  badge,
  availableFields,
  isSubmitting,
  onImageChange,
  onImageRemove,
}: {
  badge: BadgeState;
  availableFields: BadgeAvailableField[];
  isSubmitting: boolean;
  onImageChange: ImageChangeHandler;
  onImageRemove: ImageRemoveHandler;
}) {
  const baseFields = availableFields.filter(isBaseField);
  const customFields = availableFields.filter(
    (field) => !isBaseField(field) && isCustomField(field),
  );

  const fields = [...baseFields, ...customFields];

  return (
    <section className="h-full min-h-0 overflow-hidden" dir="ltr">
      <div
        className="h-full min-h-0 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 390px",
          gap: "14px",
        }}
      >
        <main
          className="min-h-0 min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white"
          dir="rtl"
        >
          <div className="flex h-full min-h-0 items-center justify-center overflow-hidden p-4">
            <BadgePreview
              enabled={badge.badgeEnabled}
              fields={fields}
              visibleFields={badge.visibleFields}
              widthMm={toNumber(badge.badgeWidthMm, 90)}
              heightMm={toNumber(badge.badgeHeightMm, 120)}
              backgroundColor={badge.badgeBackgroundColor}
              textColor={badge.badgeTextColor}
              backgroundImageUrl={badge.badgeBackgroundPreview}
              layout={badge.fieldLayout}
            />
          </div>
        </main>

        <aside
          className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-black/10 bg-[#F8F8FF] p-3"
          dir="rtl"
        >
          <div className="space-y-3">
            <ControlCard title="الحقول على البادج">
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-[11px] font-black text-[#4B4B4B]/45">
                    الحقول الأساسية
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {baseFields.map((field, index) => {
                      const checked = Boolean(badge.visibleFields[field.key]);

                      return (
                        <FieldToggle
                          key={field.key}
                          label={getFieldLabel(field)}
                          checked={checked}
                          disabled={isSubmitting}
                          onClick={() => {
                            const nextChecked = !checked;

                            badge.setVisibleFields({
                              ...badge.visibleFields,
                              [field.key]: nextChecked,
                            });

                            badge.setFieldLayout({
                              ...badge.fieldLayout,
                              [field.key]:
                                badge.fieldLayout[field.key] ??
                                getDefaultLayout(field, index),
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-black text-[#4B4B4B]/45">
                    الحقول الإضافية Custom
                  </p>

                  {customFields.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {customFields.map((field, index) => {
                        const fieldIndex = baseFields.length + index;
                        const checked = Boolean(badge.visibleFields[field.key]);

                        return (
                          <FieldToggle
                            key={field.key}
                            label={getFieldLabel(field)}
                            checked={checked}
                            disabled={isSubmitting}
                            onClick={() => {
                              const nextChecked = !checked;

                              badge.setVisibleFields({
                                ...badge.visibleFields,
                                [field.key]: nextChecked,
                              });

                              badge.setFieldLayout({
                                ...badge.fieldLayout,
                                [field.key]:
                                  badge.fieldLayout[field.key] ??
                                  getDefaultLayout(field, fieldIndex),
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-[#F8F8FF] px-3 py-3 text-xs font-bold leading-6 text-[#4B4B4B]/45">
                      لا يوجد حقول Custom مرجعة من API البادج.
                    </div>
                  )}
                </div>
              </div>
            </ControlCard>

            <ControlCard title="الألوان">
              <div className="grid grid-cols-2 gap-2">
                <ColorInput
                  label="لون النص"
                  value={badge.badgeTextColor}
                  onChange={badge.setBadgeTextColor}
                  disabled={isSubmitting}
                />

                <ColorInput
                  label="لون الخلفية"
                  value={badge.badgeBackgroundColor}
                  onChange={badge.setBadgeBackgroundColor}
                  disabled={isSubmitting}
                />

                <ColorInput
                  label="اللون الأساسي"
                  value={badge.badgePrimaryColor}
                  onChange={badge.setBadgePrimaryColor}
                  disabled={isSubmitting}
                  className="col-span-2"
                />
              </div>
            </ControlCard>

            <ControlCard title="إعدادات القالب">
              <div className="grid grid-cols-2 gap-2">
                <label className="col-span-2 flex h-10 items-center justify-between rounded-2xl border border-black/10 bg-white px-3">
                  <span className="text-xs font-black text-[#4B4B4B]">
                    تفعيل القالب
                  </span>

                  <input
                    type="checkbox"
                    checked={badge.badgeEnabled}
                    onChange={(event) =>
                      badge.setBadgeEnabled(event.target.checked)
                    }
                    disabled={isSubmitting}
                    className="h-4 w-4 accent-[#A88042]"
                  />
                </label>

                <TextInput
                  label="اسم القالب"
                  value={badge.badgeName}
                  onChange={badge.setBadgeName}
                  disabled={isSubmitting}
                  className="col-span-2"
                />

                <TextInput
                  label="العرض mm"
                  value={badge.badgeWidthMm}
                  onChange={badge.setBadgeWidthMm}
                  disabled={isSubmitting}
                  type="number"
                />

                <TextInput
                  label="الارتفاع mm"
                  value={badge.badgeHeightMm}
                  onChange={badge.setBadgeHeightMm}
                  disabled={isSubmitting}
                  type="number"
                />
              </div>
            </ControlCard>

            <ControlCard title="التحريك والمقاسات">
              <div className="space-y-2">
                {fields.map((field, index) => {
                  if (!badge.visibleFields[field.key]) return null;

                  const current =
                    badge.fieldLayout[field.key] ??
                    getDefaultLayout(field, index);

                  const qr = isQrField(field);

                  return (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-black/10 bg-white p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-[#4B4B4B]">
                            {getFieldLabel(field)}
                          </p>

                          <p className="mt-0.5 text-[10px] font-bold text-[#4B4B4B]/40">
                            القيم بالـ mm والخط بالـ pt
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#A88042]/10 px-2.5 py-1 text-[10px] font-black text-[#A88042]">
                          {isBaseField(field) ? "أساسي" : "Custom"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2" dir="ltr">
                        <MetricInput
                          label="X"
                          suffix="mm"
                          value={String(current.x ?? 10)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: { x: toNumber(value, 10) },
                            })
                          }
                        />

                        <MetricInput
                          label="Y"
                          suffix="mm"
                          value={String(current.y ?? 10)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: { y: toNumber(value, 10) },
                            })
                          }
                        />

                        <MetricInput
                          label={qr ? "W" : "Width"}
                          suffix="mm"
                          value={String(current.width ?? (qr ? 26 : 70))}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: {
                                width: toNumber(value, qr ? 26 : 70),
                              },
                            })
                          }
                        />

                        {qr ? (
                          <MetricInput
                            label="H"
                            suffix="mm"
                            value={String(current.height ?? 26)}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: { height: toNumber(value, 26) },
                              })
                            }
                          />
                        ) : (
                          <MetricInput
                            label="Font"
                            suffix="pt"
                            value={String(current.fontSize ?? 18)}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: { fontSize: toNumber(value, 18) },
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ControlCard>

            <ControlCard title="خلفية البادج">
              <SmallImageUpload
                preview={badge.badgeBackgroundPreview}
                onRemove={() => onImageRemove("badgeBackground")}
                onChange={(event) => onImageChange(event, "badgeBackground")}
                disabled={isSubmitting}
              />
            </ControlCard>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BadgePreview({
  enabled,
  fields,
  visibleFields,
  widthMm,
  heightMm,
  backgroundColor,
  textColor,
  backgroundImageUrl,
  layout,
}: {
  enabled: boolean;
  fields: BadgeAvailableField[];
  visibleFields: BadgeVisibleMap;
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  textColor: string;
  backgroundImageUrl: string;
  layout: BadgeFieldLayoutMap;
}) {
  return (
    <div className="flex max-h-full max-w-full items-center justify-center overflow-auto rounded-3xl bg-[#F8F8FF] p-3">
      <div
        className="relative shrink-0 overflow-hidden border border-black/20 bg-white shadow-sm"
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          backgroundColor,
          opacity: enabled ? 1 : 0.45,
        }}
      >
        {backgroundImageUrl ? (
          <img
            src={resolveAssetUrl(backgroundImageUrl)}
            alt="Badge background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {fields.map((field, index) => {
          if (!visibleFields[field.key]) return null;

          const current = layout[field.key] ?? getDefaultLayout(field, index);

          if (isQrField(field)) {
            return (
              <div
                key={field.key}
                className="absolute z-10 grid place-items-center bg-white p-[1mm]"
                style={{
                  left: `${current.x}mm`,
                  top: `${current.y}mm`,
                  width: `${current.width ?? 26}mm`,
                  height: `${current.height ?? 26}mm`,
                }}
              >
                <QRCodeSVG
                  value="BADGE-PREVIEW-QR"
                  width="100%"
                  height="100%"
                />
              </div>
            );
          }

          return (
            <div
              key={field.key}
              className="absolute z-10 flex items-center justify-end overflow-hidden text-right font-black leading-tight"
              style={{
                left: `${current.x}mm`,
                top: `${current.y}mm`,
                width: `${current.width ?? 70}mm`,
                minHeight: `${Math.max((current.fontSize ?? 14) * 0.5, 7)}mm`,
                color: textColor,
              }}
            >
              <span
                className="block w-full overflow-hidden break-words"
                style={{
                  fontSize: `${current.fontSize ?? 14}pt`,
                  lineHeight: 1.15,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  textWrap: "balance",
                }}
                title={getPreviewText(field)}
              >
                {getPreviewText(field)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldToggle({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 items-center justify-between gap-2 rounded-2xl border px-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#A88042]/40 bg-[#A88042]/10"
          : "border-black/10 bg-white hover:bg-[#F8F8FF]"
      }`}
    >
      <span className="truncate text-xs font-black text-[#4B4B4B]">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="h-4 w-4 shrink-0 accent-[#A88042]"
      />
    </button>
  );
}

function ControlCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-black text-[#4B4B4B]">{title}</h4>
        <span className="h-2 w-2 rounded-full bg-[#A88042]" />
      </div>

      {children}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "number";
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-right text-[11px] font-black text-[#4B4B4B]/50">
        {label}
      </span>

      <input
        type={type}
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-2xl border border-black/10 bg-[#F8F8FF] px-3 text-left text-sm font-bold text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10 disabled:opacity-50"
      />
    </label>
  );
}

function MetricInput({
  label,
  suffix,
  value,
  onChange,
  disabled,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block min-w-0 rounded-2xl border border-black/10 bg-[#F8F8FF] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wide text-[#4B4B4B]/45">
          {label}
        </span>

        <span className="text-[10px] font-black text-[#A88042]/70">
          {suffix}
        </span>
      </div>

      <input
        type="number"
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-2 text-center text-sm font-black text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:opacity-50"
      />
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const colorId = useId();

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 ${className}`}
      dir="ltr"
    >
      <div className="mb-2 flex items-center justify-between gap-2" dir="rtl">
        <span className="truncate text-[11px] font-black text-[#4B4B4B]/55">
          {label}
        </span>

        <label
          htmlFor={colorId}
          className="relative h-6 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-black/15 shadow-sm"
          style={{ backgroundColor: value || "#000000" }}
        >
          <input
            id={colorId}
            type="color"
            value={value || "#000000"}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <input
        type="text"
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#000000"
        className="h-9 w-full min-w-0 rounded-xl border border-black/10 bg-[#F8F8FF] px-3 text-left font-mono text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/30 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function SmallImageUpload({
  preview,
  onChange,
  onRemove,
  disabled,
}: {
  preview: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-black/15 bg-[#F8F8FF] p-2">
      {preview ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <img
            src={resolveAssetUrl(preview)}
            alt="Badge background"
            className="h-20 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-9 cursor-pointer items-center justify-center rounded-2xl bg-[#A88042] px-3 text-xs font-black text-white transition hover:bg-[#8F6D37]">
          رفع خلفية
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={onChange}
          />
        </label>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || !preview}
          className="h-9 rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          حذف
        </button>
      </div>
    </div>
  );
}
