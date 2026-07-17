"use client";

import { ChangeEvent, CSSProperties, ReactNode } from "react";
import { QrCode, UploadCloud, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeAvailableField } from "@/features/events/events.types";
import {
  BadgeFieldLayoutMap,
  BadgeVisibleMap,
} from "../_lib/events-page.types";
import { resolveAssetUrl } from "../_lib/events-page.utils";

export function ImageUploadCard({
  label,
  hint,
  preview,
  onChange,
  onRemove,
}: {
  label: string;
  hint: string;
  preview: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8FF]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div>
          <p className="text-sm font-extrabold text-[#4B4B4B]">{label}</p>
          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">{hint}</p>
        </div>

        {preview ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
            aria-label="حذف الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <label className="group flex h-44 cursor-pointer items-center justify-center bg-white transition hover:bg-[#A88042]/5">
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042] transition group-hover:scale-105">
              <UploadCloud className="h-7 w-7" />
            </div>

            <p className="mt-3 text-sm font-extrabold text-[#4B4B4B]">
              رفع صورة
            </p>

            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
              اضغط للاختيار
            </p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </label>
    </div>
  );
}

export function ColorPickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-[#4B4B4B]">{label}</label>

      <div className="flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 transition focus-within:border-[#A88042] focus-within:ring-4 focus-within:ring-[#A88042]/10">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />

        <input
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-left text-sm font-extrabold text-[#4B4B4B] outline-none"
        />
      </div>

      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

export function BadgeOption({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-black/10 bg-white px-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#A88042]"
      />

      <span className="text-sm font-extrabold text-[#4B4B4B]">{label}</span>
    </label>
  );
}

export function BadgeLayoutControls({
  title,
  enabled,
  x,
  y,
  fontSize,
  onXChange,
  onYChange,
  onFontSizeChange,
}: {
  title: string;
  enabled: boolean;
  x: string;
  y: string;
  fontSize: string;
  onXChange: (value: string) => void;
  onYChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <p className="mb-3 text-sm font-black text-[#4B4B4B]">{title}</p>

      <div className="grid grid-cols-3 gap-2">
        <MiniNumberInput
          label="X"
          value={x}
          onChange={onXChange}
          disabled={!enabled}
        />

        <MiniNumberInput
          label="Y"
          value={y}
          onChange={onYChange}
          disabled={!enabled}
        />

        <MiniNumberInput
          label="حجم الخط"
          value={fontSize}
          onChange={onFontSizeChange}
          disabled={!enabled}
        />
      </div>
    </div>
  );
}

export function BadgeQrLayoutControls({
  title,
  enabled,
  x,
  y,
  width,
  height,
  onXChange,
  onYChange,
  onWidthChange,
  onHeightChange,
}: {
  title: string;
  enabled: boolean;
  x: string;
  y: string;
  width: string;
  height: string;
  onXChange: (value: string) => void;
  onYChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <p className="mb-3 text-sm font-black text-[#4B4B4B]">{title}</p>

      <div className="grid grid-cols-4 gap-2">
        <MiniNumberInput
          label="X"
          value={x}
          onChange={onXChange}
          disabled={!enabled}
        />

        <MiniNumberInput
          label="Y"
          value={y}
          onChange={onYChange}
          disabled={!enabled}
        />

        <MiniNumberInput
          label="العرض"
          value={width}
          onChange={onWidthChange}
          disabled={!enabled}
        />

        <MiniNumberInput
          label="الارتفاع"
          value={height}
          onChange={onHeightChange}
          disabled={!enabled}
        />
      </div>
    </div>
  );
}

function MiniNumberInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-center text-[11px] font-black text-[#4B4B4B]/45">
        {label}
      </span>

      <input
        type="number"
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-black/10 bg-white px-2 text-center text-sm font-black text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:opacity-50"
      />
    </label>
  );
}

export function BadgeEditorPreview({
  enabled,
  widthMm,
  heightMm,
  backgroundColor,
  textColor,
  backgroundImageUrl,
  availableFields,
  visibleFields,
  layout,
}: {
  enabled: boolean;
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  textColor: string;
  backgroundImageUrl: string;
  availableFields: BadgeAvailableField[];
  visibleFields: BadgeVisibleMap;
  layout: BadgeFieldLayoutMap;
}) {
  return (
    <div className="w-full overflow-auto rounded-2xl border border-black/10 bg-[#F8F8FF] p-5">
      <div
        className="relative mx-auto overflow-hidden border border-black/20 bg-white shadow-sm"
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

        {availableFields.map((field) => {
          if (!visibleFields[field.key]) return null;

          const fieldLayout = layout[field.key] ?? {
            x: 10,
            y: 10,
            fontSize: 12,
          };

          if (field.type === "QR" || field.key === "qrCode") {
            return (
              <div
                key={field.key}
                className="absolute z-10 grid place-items-center bg-white p-[1mm]"
                style={{
                  left: `${fieldLayout.x}mm`,
                  top: `${fieldLayout.y}mm`,
                  width: `${fieldLayout.width ?? 25}mm`,
                  height: `${fieldLayout.height ?? 25}mm`,
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
              className="absolute z-10 truncate text-right font-black leading-tight"
              style={{
                left: `${fieldLayout.x}mm`,
                top: `${fieldLayout.y}mm`,
                width: `${fieldLayout.width ?? 70}mm`,
                fontSize: `${fieldLayout.fontSize ?? 12}pt`,
                color: textColor,
              }}
            >
              {field.labelAr || field.labelEn || field.key}
            </div>
          );
        })}
      </div>
    </div>
  );
}
