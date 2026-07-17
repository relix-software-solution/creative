import { CSSProperties } from "react";
import { PublicRegistrationField } from "@/features/public-events/public-events.types";
import { getOptionLabel, getOptionValue } from "../utils/staff-scanner.helpers";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

function BilingualLabel({
  ar,
  en,
  required,
  theme,
}: {
  ar: string;
  en?: string | null;
  required?: boolean;
  theme: StaffScannerTheme;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-extrabold" style={{ color: theme.text }}>
        {ar}
        {required ? <span className="mr-1 text-red-600">*</span> : null}
      </label>

      {en ? (
        <span
          dir="ltr"
          className="text-left text-xs font-extrabold uppercase tracking-wide opacity-45"
          style={{ color: theme.text }}
        >
          {en}
        </span>
      ) : null}
    </div>
  );
}

export function StaffBaseInput({
  ar,
  en,
  value,
  placeholder,
  error,
  required,
  theme,
  onChange,
  type = "text",
  dir,
  inputMode,
  className = "",
}: {
  ar: string;
  en?: string;
  value: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  theme: StaffScannerTheme;
  onChange: (value: string) => void;
  type?: string;
  dir?: "rtl" | "ltr";
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search";
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <BilingualLabel ar={ar} en={en} required={required} theme={theme} />

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        className="h-12 w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-black/5"
        style={
          {
            borderRadius: theme.radius,
            color: theme.text,
            borderColor: error ? "#DC2626" : undefined,
            "--tw-ring-color": `${theme.primary}1A`,
          } as CSSProperties
        }
      />

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

export function StaffDynamicField({
  field,
  value,
  error,
  theme,
  disabled,
  onChange,
}: {
  field: PublicRegistrationField;
  value: unknown;
  error?: string;
  theme: StaffScannerTheme;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}) {
  const labelAr = field.labelAr || field.labelEn || field.key;
  const labelEn = field.labelEn || field.key;

  const inputStyle = {
    borderRadius: theme.radius,
    color: theme.text,
    borderColor: error ? "#DC2626" : undefined,
    "--tw-ring-color": `${theme.primary}1A`,
  } as CSSProperties;

  if (field.type === "TEXTAREA") {
    return (
      <div className="space-y-2 md:col-span-2">
        <BilingualLabel
          ar={labelAr}
          en={labelEn}
          required={field.isRequired}
          theme={theme}
        />

        <textarea
          rows={3}
          value={String(value ?? "")}
          disabled={disabled}
          placeholder={field.placeholderAr || field.placeholderEn || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-none border border-black/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-black/5"
          style={inputStyle}
        />

        {error ? (
          <p className="text-sm font-bold text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }

  if (field.type === "SELECT") {
    const options = Array.isArray(field.options) ? field.options : [];

    return (
      <div className="space-y-2">
        <BilingualLabel
          ar={labelAr}
          en={labelEn}
          required={field.isRequired}
          theme={theme}
        />

        <select
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-black/5"
          style={inputStyle}
        >
          <option value="">
            {field.placeholderAr || field.placeholderEn || "اختر"}
          </option>

          {options.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>

        {error ? (
          <p className="text-sm font-bold text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }

  if (field.type === "CHECKBOX") {
    return (
      <div className="space-y-2 md:col-span-2">
        <label
          className="flex min-h-12 items-center gap-3 border border-black/10 bg-white/80 px-4 py-3 text-sm font-bold"
          style={{
            borderRadius: theme.radius,
            color: theme.text,
            borderColor: error ? "#DC2626" : undefined,
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            className="h-5 w-5"
            style={{ accentColor: theme.primary }}
          />

          <span>
            {labelAr}
            {field.isRequired ? (
              <span className="mr-1 text-red-600">*</span>
            ) : null}
          </span>

          {labelEn ? (
            <span
              dir="ltr"
              className="mr-auto text-xs font-extrabold uppercase tracking-wide opacity-45"
            >
              {labelEn}
            </span>
          ) : null}
        </label>

        {error ? (
          <p className="text-sm font-bold text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }

  const inputType =
    field.type === "EMAIL"
      ? "email"
      : field.type === "PHONE"
        ? "tel"
        : field.type === "NUMBER"
          ? "number"
          : field.type === "DATE"
            ? "date"
            : "text";

  return (
    <div className="space-y-2">
      <BilingualLabel
        ar={labelAr}
        en={labelEn}
        required={field.isRequired}
        theme={theme}
      />

      <input
        type={inputType}
        value={String(value ?? "")}
        disabled={disabled}
        placeholder={field.placeholderAr || field.placeholderEn || ""}
        onChange={(event) => onChange(event.target.value)}
        dir={field.type === "EMAIL" || field.type === "PHONE" ? "ltr" : "rtl"}
        className="h-12 w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-black/5"
        style={inputStyle}
      />

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
