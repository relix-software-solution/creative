"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
};

type PublicEventResponse = PublicEvent & {
  event?: PublicEvent;
  branding?: PublicEventBranding | null;
  eventBranding?: PublicEventBranding | null;
  attendeeTypes?: PublicEvent["attendeeTypes"];
  registrationFields?: PublicEvent["registrationFields"];
};

const fallbackTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#F8F8FF",
  text: "#4B4B4B",
  radius: "1.5rem",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function getLogoUrl(data?: PublicEventResponse | null) {
  return resolveAssetUrl(getBranding(data)?.logoUrl);
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

function buildRegistrationPayload({
  attendeeTypeId,
  baseForm,
  fields,
  fieldValues,
}: {
  attendeeTypeId: string;
  baseForm: BaseFormState;
  fields: PublicRegistrationField[];
  fieldValues: Record<string, unknown>;
}): PublicRegisterPayload {
  const payload: PublicRegisterPayload = {
    attendeeTypeId,
    fullName: baseForm.fullName.trim(),
    phone: baseForm.phone.trim(),
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
  const logoUrl = useMemo(() => getLogoUrl(eventData), [eventData]);
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
  });

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const attendeeTypes = useMemo(() => {
    const values = eventData?.attendeeTypes ?? event?.attendeeTypes ?? [];

    return values
      .filter((item) => item.isActive !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
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
      .filter((field) => field.attendeeTypeId === selectedAttendeeTypeId)
      .filter((field) => field.isActive !== false)
      .filter((field) => !isBaseFieldKey(field.key))
      .sort((a, b) => a.sortOrder - b.sortOrder);
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

    if (!baseForm.phone.trim()) {
      nextErrors.phone = "رقم الموبايل مطلوب";
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

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = buildRegistrationPayload({
      attendeeTypeId: selectedAttendeeTypeId,
      baseForm,
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

        /**
         * إذا كان البريد أو أي حقل ثابت اختياري لم يرجع ضمن response،
         * نحفظ القيمة المرسلة حتى تظهر بشكل صحيح في صفحة النجاح.
         */
        successData.email ??= payload.email ?? null;
        successData.companyName ??= payload.companyName ?? null;
        successData.jobTitle ??= payload.jobTitle ?? null;
        successData.externalId ??= payload.externalId ?? null;
        successData.notes ??= payload.notes ?? null;

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
            onChange={(event) =>
              updateFieldValue(field.key, event.target.value)
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
            onChange={(event) =>
              updateFieldValue(field.key, event.target.value)
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
              onChange={(event) =>
                updateFieldValue(field.key, event.target.checked)
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
          onChange={(event) => updateFieldValue(field.key, event.target.value)}
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

        {/* <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 30%, ${theme.primary}38, transparent 34%)`,
          }}
        /> */}

        <div
          dir="ltr"
          className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] px-4 py-10 lg:px-10"
        >
          {/* {logoUrl || eventTitle ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex justify-start">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={eventTitle || "Event logo"}
                    className="h-14 w-auto max-w-[180px] object-contain md:h-20 md:max-w-[260px]"
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 justify-end">
                {eventTitle ? (
                  <h1
                    dir="rtl"
                    className="w-full max-w-3xl text-right text-3xl font-extrabold leading-[1.3] text-white md:text-5xl"
                  >
                    {eventTitle}
                  </h1>
                ) : null}
              </div>
            </div>
          ) : (
            <div />
          )} */}

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
          className="mx-auto max-w-4xl border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.12)] md:p-8"
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
            <div className="grid gap-4 md:grid-cols-2">
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

              <BaseInput
                label="رقم الموبايل"
                labelEn="Mobile Number"
                required
                value={baseForm.phone}
                placeholder="ادخل رقم الواتساب الخاص بك "
                error={errors.phone}
                theme={theme}
                dir="rtl"
                inputMode="tel"
                onChange={(value) => updateBaseField("phone", value)}
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
        onChange={(event) => onChange(event.target.value)}
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
