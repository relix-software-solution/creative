"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  usePublicEvent,
  useRegisterToPublicEvent,
} from "@/features/public-events/public-events.queries";
import {
  PublicRegistrationField,
  PublicRegistrationFieldOption,
} from "@/features/public-events/public-events.types";

type BaseFormState = {
  attendeeTypeId: string;
  fullName: string;
  phone: string;
  email: string;
  companyName: string;
  jobTitle: string;
  externalId: string;
  notes: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getOptionLabel(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.labelAr || option.labelEn || option.value;
}

function getOptionValue(option: PublicRegistrationFieldOption | string) {
  if (typeof option === "string") return option;
  return option.value;
}

function readRegistrationId(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const value = data as {
    id?: string;
    publicId?: string;
    registration?: {
      id?: string;
      publicId?: string;
    };
  };

  return (
    value.publicId ||
    value.id ||
    value.registration?.publicId ||
    value.registration?.id ||
    ""
  );
}

export default function RegisterPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const eventQuery = usePublicEvent(eventId);
  const registerMutation = useRegisterToPublicEvent(eventId);

  const event = eventQuery.data;

  const [baseForm, setBaseForm] = useState<BaseFormState>({
    attendeeTypeId: "",
    fullName: "",
    phone: "",
    email: "",
    companyName: "",
    jobTitle: "",
    externalId: "",
    notes: "",
  });

  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successRegistrationId, setSuccessRegistrationId] = useState("");

  const attendeeTypes = event?.attendeeTypes ?? [];

  const selectedAttendeeTypeId =
    baseForm.attendeeTypeId || attendeeTypes[0]?.id || "";

  const visibleFields = useMemo(() => {
    const fields = event?.registrationFields ?? [];

    return fields
      .filter((field) => field.attendeeTypeId === selectedAttendeeTypeId)
      .filter((field) => field.isActive !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [event?.registrationFields, selectedAttendeeTypeId]);

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
      nextErrors.attendeeTypeId = "نوع الحضور مطلوب";
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

  function resetForm() {
    setBaseForm({
      attendeeTypeId: selectedAttendeeTypeId,
      fullName: "",
      phone: "",
      email: "",
      companyName: "",
      jobTitle: "",
      externalId: "",
      notes: "",
    });
    setCustomFields({});
    setErrors({});
  }

  function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    if (!validateForm()) return;

    registerMutation.mutate(
      {
        attendeeTypeId: selectedAttendeeTypeId,
        fullName: baseForm.fullName.trim(),
        phone: baseForm.phone.trim() || undefined,
        email: baseForm.email.trim() || undefined,
        companyName: baseForm.companyName.trim() || undefined,
        jobTitle: baseForm.jobTitle.trim() || undefined,
        externalId: baseForm.externalId.trim() || undefined,
        notes: baseForm.notes.trim() || undefined,
        customFields,
      },
      {
        onSuccess: (data) => {
          setSuccessRegistrationId(readRegistrationId(data));
          resetForm();
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
        <label
          key={field.id}
          className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4"
        >
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
            {field.isRequired ? <span className="text-red-600"> *</span> : null}
          </span>
        </label>
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
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#4B4B4B] transition hover:text-[#A88042]"
          >
            <ArrowRight className="h-5 w-5" />
            العودة للرئيسية
          </Link>

          <div className="text-left">
            <p className="text-sm font-extrabold">Creative Group</p>
            <p className="text-xs font-bold text-[#A88042]">
              Event Registration
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <aside className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="relative flex h-72 items-end overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(168,128,66,0.45),transparent_28%),linear-gradient(135deg,#0B0B0B,#242424)] p-6">
            <div className="absolute right-4 top-4 rounded-full bg-[#A88042] px-4 py-2 text-xs font-extrabold text-white">
              {event.type || "EVENT"}
            </div>

            <div>
              <p className="text-xs font-extrabold text-[#C59B55]">
                Creative Event
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-[1.25] text-white">
                {event.titleAr}
              </h1>
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-extrabold text-[#4B4B4B]">
              {event.titleAr}
            </h1>

            {event.titleEn ? (
              <p className="mt-1 text-sm font-bold text-[#A88042]">
                {event.titleEn}
              </p>
            ) : null}

            <p className="mt-4 text-sm font-bold leading-7 text-[#4B4B4B]/60">
              {event.descriptionAr ||
                event.descriptionEn ||
                "يرجى إكمال بيانات التسجيل للحصول على QR الدخول الخاص بك."}
            </p>

            <div className="mt-6 space-y-3 border-t border-black/10 pt-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                <CalendarDays className="h-5 w-5 text-[#A88042]" />
                {formatDate(event.startsAt)}
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                <MapPin className="h-5 w-5 text-[#A88042]" />
                {event.client?.name || "Creative Group Event"}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
              <div className="flex gap-3">
                <QrCode className="mt-1 h-5 w-5 shrink-0 text-[#A88042]" />
                <p className="text-sm font-bold leading-7 text-[#4B4B4B]/65">
                  بعد إكمال التسجيل سيتم إنشاء QR خاص بك لاستخدامه عند الدخول.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          {successRegistrationId ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <h2 className="text-2xl font-extrabold text-[#4B4B4B]">
                تم إرسال طلب التسجيل بنجاح
              </h2>

              <p className="mt-3 max-w-md text-sm font-bold leading-7 text-[#4B4B4B]/60">
                تم حفظ بياناتك بنجاح. احتفظ برقم التسجيل التالي لاستخدامه عند
                الحاجة.
              </p>

              <div className="mt-6 rounded-2xl border border-black/10 bg-[#F8F8FF] px-5 py-4">
                <p className="text-xs font-bold text-[#4B4B4B]/50">
                  رقم التسجيل
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-lg font-extrabold text-[#A88042]"
                >
                  {successRegistrationId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSuccessRegistrationId("")}
                className="mt-6 h-12 rounded-2xl bg-black px-6 text-sm font-extrabold text-white transition hover:bg-[#A88042]"
              >
                تسجيل شخص آخر
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm font-extrabold text-[#A88042]">
                  Registration Form
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
                  تسجيل الحضور
                </h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
                  املأ البيانات التالية لإتمام طلب التسجيل في الفعالية.
                </p>
              </div>

              <form className="grid gap-4" onSubmit={handleSubmit}>
                {attendeeTypes.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-[#4B4B4B]">
                      نوع الحضور
                    </label>
                    <select
                      value={selectedAttendeeTypeId}
                      onChange={(event) => {
                        updateBaseField("attendeeTypeId", event.target.value);
                        setCustomFields({});
                      }}
                      className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                    >
                      {attendeeTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.nameAr}
                        </option>
                      ))}
                    </select>
                    {errors.attendeeTypeId ? (
                      <p className="text-sm font-bold text-red-600">
                        {errors.attendeeTypeId}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
                    لا توجد أنواع حضور مفعّلة لهذه الفعالية. لا يمكن التسجيل
                    حاليًا.
                  </div>
                )}

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

                <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-[#4B4B4B]">
                      رقم خارجي
                    </label>
                    <input
                      value={baseForm.externalId}
                      onChange={(event) =>
                        updateBaseField("externalId", event.target.value)
                      }
                      placeholder="اختياري"
                      className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                    />
                  </div>
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

                <div className="space-y-2">
                  <label className="text-sm font-extrabold text-[#4B4B4B]">
                    ملاحظات
                  </label>
                  <textarea
                    rows={3}
                    value={baseForm.notes}
                    onChange={(event) =>
                      updateBaseField("notes", event.target.value)
                    }
                    placeholder="ملاحظات اختيارية..."
                    className="w-full resize-none rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 py-3 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    registerMutation.isPending || attendeeTypes.length === 0
                  }
                  className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  إرسال طلب التسجيل
                </button>

                <p className="text-center text-xs font-bold leading-6 text-[#4B4B4B]/45">
                  بالضغط على إرسال، سيتم حفظ بياناتك لإنشاء QR الدخول الخاص بك.
                </p>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
