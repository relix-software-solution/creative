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
  email: string;
  companyName: string;
  jobTitle: string;
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

function getOptionLabel(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.labelAr || option.labelEn || option.value;
}

function getOptionValue(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.value;
}

function getEventInfo(data?: PublicEventResponse | null): PublicEvent | null {
  if (!data) return null;

  return data.event || data;
}

function getBranding(data?: PublicEventResponse | null) {
  if (!data) return null;

  return (
    data.branding || data.eventBranding || getEventInfo(data)?.branding || null
  );
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000";

  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
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
  return resolveAssetUrl(getBranding(data)?.logoUrl) || "/logo.png";
}

function getBackgroundUrl(data?: PublicEventResponse | null) {
  return (
    resolveAssetUrl(getBranding(data)?.backgroundImageUrl) ||
    "/images/exhibition-bg.jpg"
  );
}

function getInputStyle(theme: ReturnType<typeof getTheme>): CSSProperties {
  return {
    borderRadius: theme.radius,
    color: theme.text,
    "--tw-ring-color": `${theme.primary}1A`,
  } as CSSProperties;
}

function getFocusStyle(theme: ReturnType<typeof getTheme>): CSSProperties {
  return {
    borderColor: theme.primary,
  };
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
    email: "",
    companyName: "",
    jobTitle: "",
  });

  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const attendeeTypes = useMemo(() => {
    return eventData?.attendeeTypes ?? event?.attendeeTypes ?? [];
  }, [eventData?.attendeeTypes, event?.attendeeTypes]);

  const defaultAttendeeType = attendeeTypes[0];
  const selectedAttendeeTypeId = defaultAttendeeType?.id || "";

  const visibleFields = useMemo(() => {
    const fields =
      eventData?.registrationFields ?? event?.registrationFields ?? [];

    if (!selectedAttendeeTypeId) return [];

    return fields
      .filter((field) => field.attendeeTypeId === selectedAttendeeTypeId)
      .filter((field) => field.isActive !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [
    eventData?.registrationFields,
    event?.registrationFields,
    selectedAttendeeTypeId,
  ]);

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
    if (!event?.startsAt) return;
    const eventStartsAt = event.startsAt as string;

    function updateCountdown() {
      const targetTime = new Date(eventStartsAt).getTime();
      const now = Date.now();
      const distance = Math.max(targetTime - now, 0);

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
      });
    }

    updateCountdown();

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [event?.startsAt]);

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

  function updateCustomField(key: string, value: unknown) {
    setCustomFields((current) => ({
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
        "التسجيل غير متاح حاليًا. لم يتم إعداد نوع حضور افتراضي لهذه الفعالية.";
    }

    if (!baseForm.fullName.trim()) {
      nextErrors.fullName = "الاسم الكامل مطلوب";
    }

    if (!baseForm.phone.trim()) {
      nextErrors.phone = "رقم الهاتف مطلوب";
    }

    if (
      baseForm.email.trim() &&
      !/^\S+@\S+\.\S+$/.test(baseForm.email.trim())
    ) {
      nextErrors.email = "البريد الإلكتروني غير صحيح";
    }

    visibleFields.forEach((field) => {
      const value = customFields[field.key];

      if (field.isRequired) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          value === false;

        if (isEmpty) {
          nextErrors[field.key] = `${field.labelAr} مطلوب`;
        }
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    if (!validateForm()) return;

    registerMutation.mutate(
      {
        attendeeTypeId: selectedAttendeeTypeId,
        fullName: baseForm.fullName.trim(),
        phone: baseForm.phone.trim(),
        email: baseForm.email.trim() || undefined,
        companyName: baseForm.companyName.trim() || undefined,
        jobTitle: baseForm.jobTitle.trim() || undefined,
        externalId: undefined,
        notes: undefined,
        customFields,
      },
      {
        onSuccess: (data) => {
          const successData = normalizePublicRegistrationSuccess(
            eventId,
            data,
            customFields,
            selectedAttendeeTypeId,
          );

          sessionStorage.setItem(
            getPublicRegistrationStorageKey(eventId),
            JSON.stringify(successData),
          );

          router.push(`/register/${eventId}/success`);
        },
      },
    );
  }

  function renderError(key: string) {
    if (!errors[key]) return null;

    return <p className="text-sm font-bold text-red-600">{errors[key]}</p>;
  }

  function renderField(field: PublicRegistrationField) {
    const value = customFields[field.key];

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
            onChange={(event) =>
              updateCustomField(field.key, event.target.value)
            }
            placeholder={field.placeholderAr ?? ""}
            className={`${inputClass} resize-none py-3`}
            style={{
              ...getInputStyle(theme),
              ...getFocusStyle(theme),
            }}
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
            onChange={(event) =>
              updateCustomField(field.key, event.target.value)
            }
            className={`${inputClass} h-12`}
            style={{
              ...getInputStyle(theme),
              ...getFocusStyle(theme),
            }}
          >
            <option value="">اختر</option>

            {(field.options ?? []).map((option) => (
              <option
                key={getOptionValue(option)}
                value={getOptionValue(option)}
              >
                {getOptionLabel(option)}
              </option>
            ))}
          </select>

          {renderError(field.key)}
        </div>
      );
    }

    if (field.type === "CHECKBOX") {
      return (
        <div key={field.id} className="space-y-2 md:col-span-2">
          <label
            className="flex min-h-[48px] items-center gap-3 border border-black/10 bg-white/80 px-4"
            style={{
              borderRadius: theme.radius,
              color: theme.text,
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) =>
                updateCustomField(field.key, event.target.checked)
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

    return (
      <div key={field.id} className="space-y-2">
        {commonLabel}

        <input
          type={inputType}
          value={String(value ?? "")}
          onChange={(event) => updateCustomField(field.key, event.target.value)}
          placeholder={field.placeholderAr ?? ""}
          className={`${inputClass} h-12`}
          style={{
            ...getInputStyle(theme),
            ...getFocusStyle(theme),
          }}
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
        <div className="absolute inset-0">
          <img
            src={backgroundUrl}
            alt={event.titleAr}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-black/55" />

        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 30%, ${theme.primary}38, transparent 34%)`,
          }}
        />

        <div
          dir="ltr"
          className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] px-4 py-10 lg:px-10"
        >
          <div className="grid grid-cols-2 items-start gap-4">
            <div className="flex justify-start">
              <img
                src={logoUrl}
                alt={event.titleAr}
                className="h-14 w-auto max-w-[180px] object-contain md:h-20 md:max-w-[260px]"
              />
            </div>

            <div className="flex justify-end">
              <h1
                dir="rtl"
                className="w-full max-w-3xl text-right text-3xl font-extrabold leading-[1.3] text-white md:text-5xl"
              >
                {event.titleAr}
              </h1>
            </div>
          </div>

          <div />

          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-2">
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
                  يبدأ المعرض خلال
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

            <div className="flex justify-end">
              <div className="w-full max-w-3xl">
                <p
                  dir="rtl"
                  className="mb-6 w-full text-right text-lg font-bold leading-9 text-white md:text-2xl md:leading-[2.2]"
                >
                  {event.descriptionAr ||
                    event.descriptionEn ||
                    "يرجى إكمال بيانات التسجيل للحصول على QR الدخول الخاص بك."}
                </p>

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

            <p
              className="mt-2 text-sm font-bold leading-7 opacity-60"
              style={{ color: theme.text }}
            >
              املأ بياناتك الأساسية لإتمام التسجيل والحصول على QR الدخول.
            </p>
          </div>

          {!selectedAttendeeTypeId ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
              لا يمكن التسجيل حاليًا. يجب على الأدمن إعداد نوع حضور افتراضي
              مفعّل لهذه الفعالية مثل VISITOR.
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit}>
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
                label="رقم الهاتف"
                labelEn="Phone Number"
                required
                value={baseForm.phone}
                placeholder="+963944123456"
                error={errors.phone}
                theme={theme}
                dir="ltr"
                inputMode="tel"
                onChange={(value) => updateBaseField("phone", value)}
              />
            </div>

            <div className="grid gap-4">
              <BaseInput
                label="البريد الإلكتروني"
                labelEn="Email Address"
                required
                value={baseForm.email}
                placeholder="name@example.com"
                error={errors.email}
                theme={theme}
                dir="ltr"
                type="email"
                onChange={(value) => updateBaseField("email", value)}
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
              بالضغط على إتمام التسجيل، سيتم إنشاء QR الدخول الخاص بك.
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        className="h-12 w-full border border-black/10 bg-white/80 px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:bg-white focus:ring-4"
        style={
          {
            borderRadius: theme.radius,
            color: theme.text,
            "--tw-ring-color": `${theme.primary}1A`,
            borderColor: error ? "#DC2626" : undefined,
          } as CSSProperties
        }
      />

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
