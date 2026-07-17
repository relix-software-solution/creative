"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Phone,
  Search,
  X,
} from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/max";
import type { CountryCode } from "libphonenumber-js";

import {
  usePublicEvent,
  useRegisterToPublicEvent,
} from "@/features/public-events/public-events.queries";
import {
  PublicEvent,
  PublicEventBranding,
  PublicRegisterPayload,
  PublicRegistrationField,
  PublicRegistrationFieldOption,
} from "@/features/public-events/public-events.types";
import {
  getPublicRegistrationStorageKey,
  normalizePublicRegistrationSuccess,
} from "@/features/public-events/public-registration-result";

type BaseFormState = {
  fullName: string;
  phone: string;
  phoneCountry: CountryCode;
};

type PublicEventResponse = PublicEvent & {
  event?: PublicEvent;
  branding?: PublicEventBranding | null;
  eventBranding?: PublicEventBranding | null;
  attendeeTypes?: PublicEvent["attendeeTypes"];
  registrationFields?: PublicEvent["registrationFields"];
};

type CountryOption = {
  country: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

type PhoneValidationResult =
  | {
      valid: true;
      internationalNumber: string;
    }
  | {
      valid: false;
      message: string;
    };

const fallbackTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#F8F8FF",
  text: "#4B4B4B",
  radius: "1.5rem",
};

const DEFAULT_COUNTRY: CountryCode = "SY";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const arabicRegionNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["ar"], {
        type: "region",
      })
    : null;

function getCountryFlag(country: CountryCode) {
  return country
    .toUpperCase()
    .split("")
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}

function getCountryName(country: CountryCode) {
  const name = arabicRegionNames?.of(country);

  if (!name || name === country) {
    return country;
  }

  return name;
}

const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((country) => ({
    country,
    name: getCountryName(country),
    callingCode: getCountryCallingCode(country),
    flag: getCountryFlag(country),
  }))
  .sort((first, second) =>
    first.name.localeCompare(second.name, "ar", {
      sensitivity: "base",
    }),
  );

function normalizeFieldKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

function isBaseFieldKey(key: string) {
  const normalizedKey = normalizeFieldKey(key);

  return normalizedKey === "fullname" || normalizedKey === "phone";
}

function getOptionLabel(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") {
    return option;
  }

  return option.labelAr || option.labelEn || option.value;
}

function getOptionValue(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") {
    return option;
  }

  return option.value;
}

function getEventInfo(data?: PublicEventResponse | null): PublicEvent | null {
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

  return url.startsWith("/") ? url : `/${url}`;
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

function getBackgroundUrl(data?: PublicEventResponse | null) {
  return resolveAssetUrl(getBranding(data)?.backgroundImageUrl);
}

function getInputStyle(
  theme: ReturnType<typeof getTheme>,
  hasError = false,
): CSSProperties {
  return {
    borderRadius: theme.radius,
    color: theme.text,
    borderColor: hasError ? "#DC2626" : undefined,
    "--tw-ring-color": `${theme.primary}1A`,
  } as CSSProperties;
}

function isEmptyFieldValue(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === false;
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function removeNonDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getPossibleNationalLengths(country: CountryCode) {
  const lengths: number[] = [];

  for (let length = 4; length <= 15; length += 1) {
    const result = validatePhoneNumberLength("1".repeat(length), country);

    if (result === undefined) {
      lengths.push(length);
    }
  }

  return lengths;
}

function getLengthDescription(country: CountryCode) {
  const lengths = getPossibleNationalLengths(country);

  if (lengths.length === 0) {
    return "عدد الخانات يختلف حسب الدولة";
  }

  if (lengths.length === 1) {
    return `${lengths[0]} خانات`;
  }

  if (lengths.length === 2) {
    return `${lengths[0]} أو ${lengths[1]} خانات`;
  }

  const minimum = Math.min(...lengths);
  const maximum = Math.max(...lengths);

  return `من ${minimum} إلى ${maximum} خانات`;
}

function getMaximumNationalLength(country: CountryCode) {
  const lengths = getPossibleNationalLengths(country);

  return lengths.length > 0 ? Math.max(...lengths) : 15;
}

function validateCountryPhone(
  nationalNumber: string,
  country: CountryCode,
): PhoneValidationResult {
  const value = nationalNumber.trim();

  if (!value) {
    return {
      valid: false,
      message: "رقم الموبايل مطلوب",
    };
  }

  const digits = removeNonDigits(value);

  if (!digits) {
    return {
      valid: false,
      message: "أدخل أرقامًا صحيحة فقط",
    };
  }

  const parsedPhone = parsePhoneNumberFromString(value, country);

  if (!parsedPhone || !parsedPhone.isValid()) {
    const lengthResult = validatePhoneNumberLength(value, country);

    if (lengthResult === "TOO_SHORT") {
      return {
        valid: false,
        message: `الرقم قصير. المطلوب ${getLengthDescription(country)}`,
      };
    }

    if (lengthResult === "TOO_LONG") {
      return {
        valid: false,
        message: `الرقم أطول من المسموح. المطلوب ${getLengthDescription(
          country,
        )}`,
      };
    }

    if (lengthResult === "INVALID_LENGTH") {
      return {
        valid: false,
        message: `عدد الخانات غير صحيح. المطلوب ${getLengthDescription(
          country,
        )}`,
      };
    }

    return {
      valid: false,
      message: "رقم الموبايل غير صالح للدولة المختارة",
    };
  }

  if (parsedPhone.country && parsedPhone.country !== country) {
    return {
      valid: false,
      message: "رقم الموبايل لا يتوافق مع الدولة المختارة",
    };
  }

  return {
    valid: true,
    internationalNumber: parsedPhone.number,
  };
}

function normalizePhoneInput({
  value,
  country,
  currentValue,
}: {
  value: string;
  country: CountryCode;
  currentValue: string;
}) {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("+")) {
    const parsedInternationalPhone = parsePhoneNumberFromString(trimmedValue);

    if (parsedInternationalPhone?.country) {
      return {
        country: parsedInternationalPhone.country,
        nationalNumber: parsedInternationalPhone.nationalNumber,
      };
    }
  }

  const digits = removeNonDigits(value);
  const maximumLength = getMaximumNationalLength(country);

  /**
   * نسمح بخانة إضافية مؤقتًا إذا كتب المستخدم صفر البداية،
   * ثم نحذفه عند مغادرة الحقل بعد تحليل الرقم.
   */
  const allowedLength = digits.startsWith("0")
    ? maximumLength + 1
    : maximumLength;

  if (digits.length > allowedLength) {
    return {
      country,
      nationalNumber: currentValue,
    };
  }

  return {
    country,
    nationalNumber: digits,
  };
}

function getPhoneHint(nationalNumber: string, country: CountryCode) {
  const callingCode = getCountryCallingCode(country);
  const lengthDescription = getLengthDescription(country);

  if (!nationalNumber) {
    return `أدخل الرقم المحلي (${lengthDescription}) بدون رمز الدولة.`;
  }

  const parsedPhone = parsePhoneNumberFromString(nationalNumber, country);

  if (parsedPhone?.isValid()) {
    return `الرقم النهائي: ${parsedPhone.number}`;
  }

  return `رمز الدولة +${callingCode} — المطلوب ${lengthDescription}`;
}

function buildRegistrationPayload({
  attendeeTypeId,
  baseForm,
  normalizedPhone,
  fields,
  fieldValues,
}: {
  attendeeTypeId: string;
  baseForm: BaseFormState;
  normalizedPhone: string;
  fields: PublicRegistrationField[];
  fieldValues: Record<string, unknown>;
}): PublicRegisterPayload {
  const payload: PublicRegisterPayload = {
    attendeeTypeId,
    fullName: baseForm.fullName.trim(),
    phone: normalizedPhone,
    customFields: {},
  };

  fields.forEach((field) => {
    const value = fieldValues[field.key];
    const normalizedKey = normalizeFieldKey(field.key);

    if (normalizedKey === "email") {
      payload.email = toOptionalString(value);
      return;
    }

    if (normalizedKey === "companyname") {
      payload.companyName = toOptionalString(value);
      return;
    }

    if (normalizedKey === "jobtitle") {
      payload.jobTitle = toOptionalString(value);
      return;
    }

    if (normalizedKey === "externalid") {
      payload.externalId = toOptionalString(value);
      return;
    }

    if (normalizedKey === "notes") {
      payload.notes = toOptionalString(value);
      return;
    }

    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === "string" && !value.trim()) {
      return;
    }

    payload.customFields![field.key] = value;
  });

  if (Object.keys(payload.customFields ?? {}).length === 0) {
    delete payload.customFields;
  }

  return payload;
}

function BilingualLabel({
  ar,
  en,
  required,
  color,
}: {
  ar: string;
  en?: string | null;
  required?: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-extrabold" style={{ color }}>
        {ar}

        {required ? <span className="text-red-600"> *</span> : null}
      </label>

      {en ? (
        <span
          dir="ltr"
          className="text-left text-xs font-extrabold uppercase tracking-wide opacity-45"
          style={{ color }}
        >
          {en}
        </span>
      ) : null}
    </div>
  );
}

export default function RegisterPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const router = useRouter();

  const eventQuery = usePublicEvent(eventId);
  const registerMutation = useRegisterToPublicEvent(eventId);

  const eventData = eventQuery.data as PublicEventResponse | undefined;

  const event = useMemo(() => getEventInfo(eventData), [eventData]);

  const formSectionRef = useRef<HTMLElement | null>(null);

  const theme = useMemo(() => getTheme(eventData), [eventData]);

  const backgroundUrl = useMemo(() => getBackgroundUrl(eventData), [eventData]);

  const eventTitle = event?.titleAr?.trim() || event?.titleEn?.trim() || "";

  const eventDescription =
    event?.descriptionAr?.trim() || event?.descriptionEn?.trim() || "";

  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [baseForm, setBaseForm] = useState<BaseFormState>({
    fullName: "",
    phone: "",
    phoneCountry: DEFAULT_COUNTRY,
  });

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  const attendeeTypes = useMemo(() => {
    const values = eventData?.attendeeTypes ?? event?.attendeeTypes ?? [];

    return values
      .filter((item) => item.isActive !== false)
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }, [eventData?.attendeeTypes, event?.attendeeTypes]);

  const defaultAttendeeType = attendeeTypes[0];

  const selectedAttendeeTypeId = defaultAttendeeType?.id || "";

  const visibleFields = useMemo(() => {
    const fields =
      eventData?.registrationFields ?? event?.registrationFields ?? [];

    if (!selectedAttendeeTypeId) {
      return [];
    }

    return fields
      .filter(
        (field) =>
          !field.attendeeTypeId ||
          field.attendeeTypeId === selectedAttendeeTypeId,
      )
      .filter((field) => field.isActive !== false)
      .filter((field) => !isBaseFieldKey(field.key))
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }, [
    eventData?.registrationFields,
    event?.registrationFields,
    selectedAttendeeTypeId,
  ]);

  const hasValidStartDate = (() => {
    if (!event?.startsAt) {
      return false;
    }

    return !Number.isNaN(new Date(event.startsAt).getTime());
  })();

  const pageStyle: CSSProperties = {
    backgroundColor: theme.background,
    color: theme.text,
  };

  const primaryButtonStyle: CSSProperties = {
    backgroundColor: isButtonHovered ? theme.primaryHover : theme.primary,
    borderRadius: theme.radius,
    boxShadow: `0 18px 40px ${theme.primary}40`,
  };

  const cardStyle: CSSProperties = {
    borderRadius: `calc(${theme.radius} + 0.75rem)`,
    color: theme.text,
  };

  useEffect(() => {
    if (!event?.startsAt || !hasValidStartDate) {
      return;
    }

    const eventStartsAt = event.startsAt;

    function updateCountdown() {
      const targetTime = new Date(eventStartsAt).getTime();
      const distance = Math.max(targetTime - Date.now(), 0);

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),

        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),

        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),

        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }

    updateCountdown();

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [event?.startsAt, hasValidStartDate]);

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function updateBaseField<Key extends keyof BaseFormState>(
    key: Key,
    value: BaseFormState[Key],
  ) {
    setBaseForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function updatePhoneCountry(country: CountryCode) {
    setBaseForm((current) => ({
      ...current,
      phone: "",
      phoneCountry: country,
    }));

    setErrors((current) => ({
      ...current,
      phone: "",
    }));
  }

  function updatePhoneNumber(value: string) {
    const normalized = normalizePhoneInput({
      value,
      country: baseForm.phoneCountry,
      currentValue: baseForm.phone,
    });

    setBaseForm((current) => ({
      ...current,
      phoneCountry: normalized.country,
      phone: normalized.nationalNumber,
    }));

    setErrors((current) => ({
      ...current,
      phone: "",
    }));
  }

  function normalizePhoneAfterBlur() {
    const parsedPhone = parsePhoneNumberFromString(
      baseForm.phone,
      baseForm.phoneCountry,
    );

    if (!parsedPhone?.isValid()) {
      return;
    }

    setBaseForm((current) => ({
      ...current,
      phoneCountry: parsedPhone.country || current.phoneCountry,
      phone: parsedPhone.nationalNumber,
    }));
  }

  function updateFieldValue(key: string, value: unknown) {
    setFieldValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!selectedAttendeeTypeId) {
      nextErrors.attendeeTypeId =
        "التسجيل غير متاح حاليًا. لم يتم إعداد نوع حضور مفعّل لهذه الفعالية.";
    }

    if (!baseForm.fullName.trim()) {
      nextErrors.fullName = "الاسم الكامل مطلوب";
    }

    const phoneValidation = validateCountryPhone(
      baseForm.phone,
      baseForm.phoneCountry,
    );

    if (!phoneValidation.valid) {
      nextErrors.phone = phoneValidation.message;
    }

    visibleFields.forEach((field) => {
      const value = fieldValues[field.key];

      if (field.isRequired && isEmptyFieldValue(value)) {
        nextErrors[field.key] =
          `${field.labelAr || field.labelEn || field.key} مطلوب`;

        return;
      }

      const isEmailField =
        field.type === "EMAIL" || normalizeFieldKey(field.key) === "email";

      const emailValue = toOptionalString(value);

      if (isEmailField && emailValue && !emailPattern.test(emailValue)) {
        nextErrors[field.key] = "البريد الإلكتروني غير صحيح";
      }
    });

    setErrors(nextErrors);

    return {
      valid: Object.keys(nextErrors).length === 0,

      normalizedPhone: phoneValidation.valid
        ? phoneValidation.internationalNumber
        : "",
    };
  }

  function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    const validation = validateForm();

    if (!validation.valid || !validation.normalizedPhone) {
      return;
    }

    const payload = buildRegistrationPayload({
      attendeeTypeId: selectedAttendeeTypeId,
      baseForm,
      normalizedPhone: validation.normalizedPhone,
      fields: visibleFields,
      fieldValues,
    });

    registerMutation.mutate(payload, {
      onSuccess: (data) => {
        const successData = normalizePublicRegistrationSuccess(
          eventId,
          data,
          payload.customFields,
          selectedAttendeeTypeId,
        );

        successData.email ??= payload.email ?? null;
        successData.companyName ??= payload.companyName ?? null;
        successData.jobTitle ??= payload.jobTitle ?? null;
        successData.externalId ??= payload.externalId ?? null;
        successData.notes ??= payload.notes ?? null;

        successData.phone ||= validation.normalizedPhone;

        sessionStorage.setItem(
          getPublicRegistrationStorageKey(eventId),
          JSON.stringify(successData),
        );

        router.push(`/register/${eventId}/success`);
      },
    });
  }

  function renderError(key: string) {
    if (!errors[key]) {
      return null;
    }

    return <p className="text-sm font-bold text-red-600">{errors[key]}</p>;
  }

  function renderField(field: PublicRegistrationField) {
    const value = fieldValues[field.key];
    const fieldError = errors[field.key];

    const commonLabel = (
      <BilingualLabel
        ar={field.labelAr || field.key}
        en={field.labelEn}
        required={field.isRequired}
        color={theme.text}
      />
    );

    const inputClass =
      "w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4";

    if (field.type === "TEXTAREA") {
      return (
        <div key={field.id} className="space-y-2 md:col-span-2">
          {commonLabel}

          <textarea
            rows={3}
            value={String(value ?? "")}
            required={field.isRequired}
            onChange={(changeEvent) =>
              updateFieldValue(field.key, changeEvent.target.value)
            }
            placeholder={field.placeholderAr ?? ""}
            className={`${inputClass} resize-none py-3`}
            style={getInputStyle(theme, Boolean(fieldError))}
          />

          {renderError(field.key)}
        </div>
      );
    }

    if (field.type === "SELECT") {
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}

          <select
            value={String(value ?? "")}
            required={field.isRequired}
            onChange={(changeEvent) =>
              updateFieldValue(field.key, changeEvent.target.value)
            }
            className={`${inputClass} h-12`}
            style={getInputStyle(theme, Boolean(fieldError))}
          >
            <option value="">اختر</option>

            {(field.options ?? []).map((option) => {
              const optionValue = getOptionValue(option);

              return (
                <option key={optionValue} value={optionValue}>
                  {getOptionLabel(option)}
                </option>
              );
            })}
          </select>

          {renderError(field.key)}
        </div>
      );
    }

    if (field.type === "CHECKBOX") {
      return (
        <div key={field.id} className="space-y-2 md:col-span-2">
          <label
            className="flex min-h-[48px] items-center gap-3 border bg-white/80 px-4"
            style={{
              borderRadius: theme.radius,
              borderColor: fieldError ? "#DC2626" : "rgba(0,0,0,0.10)",
              color: theme.text,
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(value)}
              required={field.isRequired}
              onChange={(changeEvent) =>
                updateFieldValue(field.key, changeEvent.target.checked)
              }
              className="h-5 w-5"
              style={{
                accentColor: theme.primary,
              }}
            />

            <span className="flex flex-1 items-center justify-between gap-3 text-sm font-extrabold">
              <span>
                {field.labelAr || field.key}

                {field.isRequired ? (
                  <span className="text-red-600"> *</span>
                ) : null}
              </span>

              {field.labelEn ? (
                <span
                  dir="ltr"
                  className="text-left text-xs font-extrabold uppercase tracking-wide opacity-45"
                >
                  {field.labelEn}
                </span>
              ) : null}
            </span>
          </label>

          {renderError(field.key)}
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

    const inputDirection =
      field.type === "EMAIL" ||
      field.type === "PHONE" ||
      field.type === "NUMBER"
        ? "ltr"
        : undefined;

    return (
      <div key={field.id} className="space-y-2">
        {commonLabel}

        <input
          type={inputType}
          value={String(value ?? "")}
          required={field.isRequired}
          dir={inputDirection}
          onChange={(changeEvent) =>
            updateFieldValue(field.key, changeEvent.target.value)
          }
          placeholder={field.placeholderAr ?? ""}
          className={`${inputClass} h-12`}
          style={getInputStyle(theme, Boolean(fieldError))}
        />

        {renderError(field.key)}
      </div>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={pageStyle}
      >
        <div
          className="border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
          style={cardStyle}
        >
          <Loader2
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: theme.primary }}
          />

          <p className="mt-3 text-sm font-bold opacity-60">
            جاري تحميل بيانات الفعالية...
          </p>
        </div>
      </main>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F8FF] px-4">
        <div className="max-w-md rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-extrabold text-red-700">
            تعذر تحميل الفعالية
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-red-600/70">
            تأكد أن رابط التسجيل صحيح وأن الفعالية متاحة.
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-extrabold text-white"
          >
            العودة للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={pageStyle}>
      <section className="relative min-h-screen overflow-hidden">
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
              background: `linear-gradient(135deg, ${theme.background}, ${theme.primary}45)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-black/45" />

        <div
          dir="ltr"
          className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] px-4 py-10 lg:px-10"
        >
          <div />

          <div />

          <div
            className={`grid grid-cols-1 items-end gap-8 ${
              hasValidStartDate ? "lg:grid-cols-2" : ""
            }`}
          >
            {hasValidStartDate ? (
              <div className="flex justify-start">
                <div
                  className="border border-white/15 bg-black/25 p-4 backdrop-blur-md"
                  style={{
                    borderRadius: `calc(${theme.radius} + 0.25rem)`,
                  }}
                >
                  <p
                    className="mb-3 text-center text-sm font-extrabold"
                    style={{ color: theme.primary }}
                  >
                    تبدأ الفعالية خلال
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-center sm:flex sm:items-center">
                    <CountdownBox label="يوم" value={countdown.days} />

                    <CountdownBox
                      label="ساعة"
                      value={String(countdown.hours).padStart(2, "0")}
                    />

                    <CountdownBox
                      label="دقيقة"
                      value={String(countdown.minutes).padStart(2, "0")}
                    />

                    <CountdownBox
                      label="ثانية"
                      value={String(countdown.seconds).padStart(2, "0")}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <div className="w-full max-w-3xl">
                {eventDescription ? (
                  <p
                    dir="rtl"
                    className="mb-6 w-full text-right text-lg font-bold leading-9 text-white md:text-2xl md:leading-[2.2]"
                  >
                    {eventDescription}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                    className="flex h-14 min-w-[190px] items-center justify-center px-8 text-base font-extrabold text-white transition"
                    style={primaryButtonStyle}
                  >
                    سجل الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={formSectionRef}
        className="relative z-20 px-4 py-20 lg:px-8"
        style={{ backgroundColor: theme.background }}
      >
        <div
          className="mx-auto max-w-4xl overflow-visible border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.12)] md:p-8"
          style={cardStyle}
        >
          <div className="mb-6">
            <p
              className="text-sm font-extrabold"
              style={{ color: theme.primary }}
            >
              Registration Form
            </p>

            <h2
              className="mt-2 text-2xl font-extrabold"
              style={{ color: theme.text }}
            >
              تسجيل الحضور
            </h2>
          </div>

          {!selectedAttendeeTypeId ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
              لا يمكن التسجيل حاليًا. يجب على الأدمن إعداد نوع حضور مفعّل لهذه
              الفعالية.
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid items-start gap-5 md:grid-cols-2">
              <BaseInput
                label="الاسم الكامل"
                labelEn="Full Name"
                required
                value={baseForm.fullName}
                placeholder="مثال: محمد أحمد"
                error={errors.fullName}
                theme={theme}
                onChange={(value) => updateBaseField("fullName", value)}
              />

              <CountryPhoneInput
                country={baseForm.phoneCountry}
                value={baseForm.phone}
                error={errors.phone}
                theme={theme}
                onCountryChange={updatePhoneCountry}
                onChange={updatePhoneNumber}
                onBlur={normalizePhoneAfterBlur}
              />
            </div>

            {visibleFields.length > 0 ? (
              <div className="grid gap-4 border-t border-black/10 pt-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className="text-sm font-extrabold"
                      style={{ color: theme.primary }}
                    >
                      بيانات إضافية
                    </p>

                    <span
                      dir="ltr"
                      className="text-xs font-extrabold uppercase tracking-wide opacity-60"
                      style={{ color: theme.primary }}
                    >
                      Additional Information
                    </span>
                  </div>
                </div>

                {visibleFields.map((field) => renderField(field))}
              </div>
            ) : null}

            {errors.attendeeTypeId ? (
              <p className="text-sm font-bold text-red-600">
                {errors.attendeeTypeId}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={registerMutation.isPending || !selectedAttendeeTypeId}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
              className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 px-5 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={primaryButtonStyle}
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              إتمام التسجيل
            </button>

            <p
              className="text-center text-xs font-bold leading-6 opacity-45"
              style={{ color: theme.text }}
            >
              بالضغط على إتمام التسجيل، سيتم إنشاء رمز الدخول الخاص بك.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function CountryPhoneInput({
  country,
  value,
  error,
  theme,
  onCountryChange,
  onChange,
  onBlur,
}: {
  country: CountryCode;
  value: string;
  error?: string;
  theme: ReturnType<typeof getTheme>;
  onCountryChange: (country: CountryCode) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedCountry =
    COUNTRY_OPTIONS.find((option) => option.country === country) ??
    COUNTRY_OPTIONS.find((option) => option.country === DEFAULT_COUNTRY) ??
    COUNTRY_OPTIONS[0];

  const filteredCountries = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    const numericSearch = removeNonDigits(search);

    if (!search) {
      return COUNTRY_OPTIONS;
    }

    return COUNTRY_OPTIONS.filter((option) => {
      return (
        option.name.toLowerCase().includes(search) ||
        option.country.toLowerCase().includes(search) ||
        (numericSearch &&
          option.callingCode.toLowerCase().includes(numericSearch))
      );
    });
  }, [searchValue]);

  const callingCode = getCountryCallingCode(country);
  const phoneHint = getPhoneHint(value, country);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  function handleCountrySelection(countryCode: CountryCode) {
    onCountryChange(countryCode);
    setSearchValue("");
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="relative z-40 min-w-0 space-y-2"
    >
      <div dir="rtl">
        <BilingualLabel
          ar="رقم الموبايل"
          en="Mobile Number"
          required
          color={theme.text}
        />
      </div>

      {/* حقل الهاتف الكامل */}
      <div
        dir="ltr"
        className="flex h-12 w-full min-w-0 items-stretch border bg-white/80 transition focus-within:bg-white focus-within:ring-4"
        style={
          {
            borderRadius: theme.radius,
            borderColor: error ? "#DC2626" : "rgba(0,0,0,0.10)",
            boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.08)" : undefined,
            "--tw-ring-color": `${theme.primary}1A`,
          } as CSSProperties
        }
      >
        {/* زر الدولة */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-[140px] shrink-0 items-center gap-2 border-r border-black/10 px-3 text-left outline-none transition hover:bg-black/[0.025] sm:w-[170px]"
          style={{
            borderTopLeftRadius: theme.radius,
            borderBottomLeftRadius: theme.radius,
            color: theme.text,
          }}
        >
          <span className="shrink-0 text-lg leading-none">
            {selectedCountry.flag}
          </span>

          <span className="min-w-0 flex-1">
            <span
              dir="rtl"
              className="block truncate text-right text-xs font-extrabold sm:text-sm"
            >
              {selectedCountry.name}
            </span>
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 opacity-40 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* رمز الدولة */}
        <div
          className="flex shrink-0 items-center border-r border-black/10 px-3 text-sm font-extrabold"
          style={{ color: theme.primary }}
        >
          +{callingCode}
        </div>

        {/* الرقم المحلي */}
        <div className="relative min-w-0 flex-1">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            dir="ltr"
            value={value}
            placeholder={country === "SY" ? "990000000" : "Local number"}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className="h-full w-full min-w-0 bg-transparent py-0 pl-10 pr-3 text-left text-sm font-bold outline-none placeholder:text-black/30"
            style={{ color: theme.text }}
          />
        </div>
      </div>

      {/* قائمة الدول */}
      {isOpen ? (
        <div
          dir="ltr"
          className="absolute left-0 top-[calc(100%+8px)] z-[999] w-full min-w-[320px] overflow-hidden border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
          style={{
            maxWidth: "430px",
            borderRadius: `calc(${theme.radius} + 0.2rem)`,
          }}
        >
          {/* البحث */}
          <div className="border-b border-black/10 bg-white p-3">
            <div
              className="flex h-10 items-center gap-2 border border-black/10 bg-[#F8F8FF] px-3"
              style={{ borderRadius: theme.radius }}
            >
              <Search
                className="h-4 w-4 shrink-0 opacity-40"
                style={{ color: theme.text }}
              />

              <input
                ref={searchInputRef}
                value={searchValue}
                dir="rtl"
                placeholder="ابحث باسم الدولة أو رمز الاتصال"
                onChange={(event) => setSearchValue(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold outline-none placeholder:text-black/30"
                style={{ color: theme.text }}
              />

              {searchValue ? (
                <button
                  type="button"
                  aria-label="مسح البحث"
                  onClick={() => setSearchValue("")}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
                >
                  <X className="h-4 w-4 opacity-40" />
                </button>
              ) : null}
            </div>
          </div>

          {/* السكرول يبقى داخل هذه المنطقة فقط */}
          <div
            className="overscroll-contain p-2"
            style={{
              height: "260px",
              maxHeight: "260px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {filteredCountries.length ? (
              filteredCountries.map((option) => {
                const selected = option.country === country;

                return (
                  <button
                    key={option.country}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleCountrySelection(option.country)}
                    className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition last:mb-0 hover:bg-black/[0.035]"
                    style={{
                      backgroundColor: selected
                        ? `${theme.primary}14`
                        : "transparent",
                      color: theme.text,
                    }}
                  >
                    <span className="w-7 shrink-0 text-center text-lg">
                      {option.flag}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        dir="rtl"
                        className="block truncate text-right text-sm font-extrabold"
                      >
                        {option.name}
                      </span>

                      <span
                        dir="ltr"
                        className="mt-0.5 block text-left text-[11px] font-bold opacity-45"
                      >
                        {option.country} · +{option.callingCode}
                      </span>
                    </span>

                    {selected ? (
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${theme.primary}18`,
                          color: theme.primary,
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <div>
                  <p
                    className="text-sm font-extrabold"
                    style={{ color: theme.text }}
                  >
                    لم يتم العثور على دولة
                  </p>

                  <p
                    className="mt-1 text-xs font-bold opacity-45"
                    style={{ color: theme.text }}
                  >
                    ابحث باسم الدولة أو رمز الاتصال.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <p
        dir="rtl"
        className={`text-xs font-bold leading-5 ${
          error ? "text-red-600" : "opacity-50"
        }`}
        style={error ? undefined : { color: theme.text }}
      >
        {error || phoneHint}
      </p>
    </div>
  );
}

function CountdownBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-3xl font-extrabold text-white">{value}</p>

      <p className="mt-1 text-xs font-bold text-white/65">{label}</p>
    </div>
  );
}

function BaseInput({
  label,
  labelEn,
  value,
  placeholder,
  error,
  required,
  theme,
  onChange,
  type = "text",
  dir,
  inputMode,
}: {
  label: string;
  labelEn?: string;
  value: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  theme: ReturnType<typeof getTheme>;
  onChange: (value: string) => void;
  type?: string;
  dir?: "rtl" | "ltr";
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search";
}) {
  return (
    <div className="space-y-2">
      <BilingualLabel
        ar={label}
        en={labelEn}
        required={required}
        color={theme.text}
      />

      <input
        type={type}
        value={value}
        required={required}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        className="h-12 w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4"
        style={getInputStyle(theme, Boolean(error))}
      />

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
