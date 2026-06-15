"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  usePublicEvent,
  useRegisterToPublicEvent,
} from "@/features/public-events/public-events.queries";
import {
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

function getOptionLabel(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.labelAr || option.labelEn || option.value;
}

function getOptionValue(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.value;
}

export default function RegisterPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const router = useRouter();

  const eventQuery = usePublicEvent(eventId);
  const registerMutation = useRegisterToPublicEvent(eventId);

  const event = eventQuery.data;
  const formSectionRef = useRef<HTMLElement | null>(null);

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
    return event?.attendeeTypes ?? [];
  }, [event?.attendeeTypes]);

  const defaultAttendeeType = attendeeTypes[0];
  const selectedAttendeeTypeId = defaultAttendeeType?.id || "";

  const visibleFields = useMemo(() => {
    const fields = event?.registrationFields ?? [];

    if (!selectedAttendeeTypeId) return [];

    return fields
      .filter((field) => field.attendeeTypeId === selectedAttendeeTypeId)
      .filter((field) => field.isActive !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [event?.registrationFields, selectedAttendeeTypeId]);

  useEffect(() => {
    if (!event?.startsAt) return;

    const startsAt = event.startsAt as string;

    function updateCountdown() {
      const targetTime = new Date(startsAt).getTime();
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
          const successData = normalizePublicRegistrationSuccess(eventId, data);

          sessionStorage.setItem(
            getPublicRegistrationStorageKey(eventId),
            JSON.stringify(successData),
          );

          router.push(`/register/${eventId}/success`);
        },
      },
    );
  }

  function renderField(field: PublicRegistrationField) {
    const value = customFields[field.key];

    const commonLabel = (
      <label className="text-sm font-extrabold text-[#4B4B4B]">
        {field.labelAr}
        {field.isRequired ? <span className="text-red-600"> *</span> : null}
      </label>
    );

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
            className="w-full resize-none rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 py-3 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
          />

          {errors[field.key] ? (
            <p className="text-sm font-bold text-red-600">
              {errors[field.key]}
            </p>
          ) : null}
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
            className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
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

          {errors[field.key] ? (
            <p className="text-sm font-bold text-red-600">
              {errors[field.key]}
            </p>
          ) : null}
        </div>
      );
    }

    if (field.type === "CHECKBOX") {
      return (
        <div key={field.id} className="space-y-2 md:col-span-2">
          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) =>
                updateCustomField(field.key, event.target.checked)
              }
              className="h-5 w-5 accent-[#A88042]"
            />

            <span className="text-sm font-extrabold text-[#4B4B4B]">
              {field.labelAr}
              {field.isRequired ? (
                <span className="text-red-600"> *</span>
              ) : null}
            </span>
          </label>

          {errors[field.key] ? (
            <p className="text-sm font-bold text-red-600">
              {errors[field.key]}
            </p>
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
      <div key={field.id} className="space-y-2">
        {commonLabel}

        <input
          type={inputType}
          value={String(value ?? "")}
          onChange={(event) => updateCustomField(field.key, event.target.value)}
          placeholder={field.placeholderAr ?? ""}
          className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
        />

        {errors[field.key] ? (
          <p className="text-sm font-bold text-red-600">{errors[field.key]}</p>
        ) : null}
      </div>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F8FF]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

          <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
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
    <main className="min-h-screen bg-[#F8F8FF] text-[#4B4B4B]">
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/exhibition-bg.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(168,128,66,0.22),transparent_32%)]" />

        <div
          dir="ltr"
          className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr_auto] px-4 py-10  lg:px-10"
        >
          {/* Top: logo left / title right */}
          <div className="grid grid-cols-2 items-start">
            <div className="flex justify-start">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-14 w-auto object-contain md:h-20"
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

          {/* Bottom: countdown aligned with logo / text button aligned with title */}
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="flex justify-start">
              <div className="rounded-[1.75rem] border border-white/15 bg-black/25 p-4 backdrop-blur-md">
                <p className="mb-3 text-center text-sm font-extrabold text-[#C59B55]">
                  يبدأ المعرض خلال
                </p>

                <div className="flex items-center gap-3 text-center">
                  <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-3xl font-extrabold text-white">
                      {countdown.days}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/65">يوم</p>
                  </div>

                  <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-3xl font-extrabold text-white">
                      {String(countdown.hours).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/65">ساعة</p>
                  </div>

                  <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-3xl font-extrabold text-white">
                      {String(countdown.minutes).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/65">
                      دقيقة
                    </p>
                  </div>

                  <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <p className="text-3xl font-extrabold text-white">
                      {String(countdown.seconds).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/65">
                      ثانية
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
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
                    className="flex h-14 min-w-[190px] items-center justify-center rounded-2xl bg-[#A88042] px-8 text-base font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37]"
                  >
                    سجل الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section
        ref={formSectionRef}
        className="relative z-20 bg-[#F8F8FF] px-4 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.12)] md:p-8">
          <div className="mb-6">
            <p className="text-sm font-extrabold text-[#A88042]">
              Registration Form
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
              تسجيل الحضور
            </h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
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
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  الاسم الكامل <span className="text-red-600">*</span>
                </label>

                <input
                  value={baseForm.fullName}
                  onChange={(event) =>
                    updateBaseField("fullName", event.target.value)
                  }
                  placeholder="مثال: محمد أحمد"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />

                {errors.fullName ? (
                  <p className="text-sm font-bold text-red-600">
                    {errors.fullName}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  رقم الهاتف <span className="text-red-600">*</span>
                </label>

                <input
                  value={baseForm.phone}
                  onChange={(event) =>
                    updateBaseField("phone", event.target.value)
                  }
                  placeholder="+963944123456"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-left text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />

                {errors.phone ? (
                  <p className="text-sm font-bold text-red-600">
                    {errors.phone}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  البريد الإلكتروني
                </label>

                <input
                  value={baseForm.email}
                  onChange={(event) =>
                    updateBaseField("email", event.target.value)
                  }
                  placeholder="name@example.com"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-left text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />

                {errors.email ? (
                  <p className="text-sm font-bold text-red-600">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  الشركة
                </label>

                <input
                  value={baseForm.companyName}
                  onChange={(event) =>
                    updateBaseField("companyName", event.target.value)
                  }
                  placeholder="اسم الشركة"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-[#4B4B4B]">
                المسمى الوظيفي
              </label>

              <input
                value={baseForm.jobTitle}
                onChange={(event) =>
                  updateBaseField("jobTitle", event.target.value)
                }
                placeholder="مثال: مدير تسويق"
                className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
              />
            </div>

            {visibleFields.length > 0 ? (
              <div className="grid gap-4 border-t border-black/10 pt-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <p className="text-sm font-extrabold text-[#A88042]">
                    بيانات إضافية
                  </p>
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
              className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              إتمام التسجيل
            </button>

            <p className="text-center text-xs font-bold leading-6 text-[#4B4B4B]/45">
              بالضغط على إتمام التسجيل، سيتم إنشاء QR الدخول الخاص بك.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
