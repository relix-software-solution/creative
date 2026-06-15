"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Home,
  Loader2,
  Mail,
  Phone,
  QrCode,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicEvent } from "@/features/public-events/public-events.queries";
import { getPublicRegistrationStorageKey } from "@/features/public-events/public-registration-result";
import { PublicRegistrationSuccessData } from "@/features/public-events/public-events.types";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status?: string) {
  if (status === "ACTIVE") return "فعّال";
  if (status === "PENDING") return "بانتظار التفعيل";
  if (status === "CANCELLED") return "ملغي";
  if (status === "BLOCKED") return "محظور";
  return status || "تم التسجيل";
}

function getAbsoluteImageUrl(value?: string) {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

  const backendOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

function getSafeText(value?: string | null) {
  if (!value || !value.trim()) return "—";
  return value;
}

export default function PublicRegistrationSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const eventQuery = usePublicEvent(eventId);

  const [successData, setSuccessData] =
    useState<PublicRegistrationSuccessData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(
      getPublicRegistrationStorageKey(eventId),
    );

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PublicRegistrationSuccessData;
      setSuccessData(parsed);
    } catch {
      setSuccessData(null);
    }
  }, [eventId]);

  const event = eventQuery.data;

  const qrImageUrl = useMemo(
    () => getAbsoluteImageUrl(successData?.qrImageUrl),
    [successData?.qrImageUrl],
  );

  const qrValue = successData?.qrToken?.trim() || "";

  function downloadRenderedQr() {
    const svg = qrContainerRef.current?.querySelector("svg");

    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `registration-${successData?.registrationId || "qr"}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (eventQuery.isLoading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-4">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/exhibition-bg.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 rounded-[2rem] border border-white/15 bg-black/40 p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#C59B55]" />
          <p className="mt-3 text-sm font-bold text-white/75">
            جاري تحميل نتيجة التسجيل...
          </p>
        </div>
      </main>
    );
  }

  if (!successData) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-4">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/exhibition-bg.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-lg rounded-[2rem] border border-white/15 bg-black/45 p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#A88042]/20 text-[#C59B55]">
            <QrCode className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-extrabold">
            لا توجد نتيجة تسجيل محفوظة
          </h1>

          <p className="mt-3 text-sm font-bold leading-7 text-white/70">
            افتح صفحة التسجيل وأرسل الطلب من جديد. قد تظهر هذه الرسالة إذا تم
            تحديث الصفحة بعد وقت طويل أو فتح الرابط من جهاز آخر.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/register/${eventId}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-6 text-sm font-extrabold text-white transition hover:bg-[#8F6D37]"
            >
              <RotateCcw className="h-5 w-5" />
              الرجوع للتسجيل
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 text-sm font-extrabold text-white transition hover:bg-white/15"
            >
              <Home className="h-5 w-5" />
              الرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0B] text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/exhibition-bg.jpg')",
        }}
      />

      {/* Strong overlay */}
      <div className="absolute inset-0 bg-black/72" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,128,66,0.18),transparent_30%)]" />

      {/* Content */}
      <section className="relative z-10 min-h-screen px-4 py-6 lg:px-8 ">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center ">
          <div className="w-full rounded-[2rem] border border-white/15 bg-black/38 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-6 lg:p-7">
            {/* Mobile: stacked / Desktop: info right + qr left */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Right Side - Information */}
              <section className="w-full lg:col-start-2 lg:row-start-1">
                <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-xs font-extrabold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      تم التسجيل بنجاح
                    </div>

                    <h1 className="text-3xl font-extrabold leading-[1.25] text-white md:text-5xl">
                      {event?.titleAr || "الفعالية"}
                    </h1>

                    {event?.titleEn ? (
                      <p className="mt-2 text-sm font-bold text-[#D8B06B] md:text-lg">
                        {event.titleEn}
                      </p>
                    ) : null}
                  </div>

                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-[#A88042]/15 text-[#D8B06B] sm:flex">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <UserRound className="h-4 w-4 text-[#D8B06B]" />
                      اسم المسجل
                    </div>
                    <p className="text-lg font-extrabold text-white">
                      {getSafeText(successData.fullName)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 text-xs font-bold text-white/65">
                      حالة التسجيل
                    </div>
                    <p className="text-lg font-extrabold text-emerald-300">
                      {getStatusLabel(successData.status)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <Phone className="h-4 w-4 text-[#D8B06B]" />
                      رقم الهاتف
                    </div>
                    <p
                      dir="ltr"
                      className="text-left text-base font-extrabold text-white"
                    >
                      {getSafeText(successData.phone)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <Mail className="h-4 w-4 text-[#D8B06B]" />
                      البريد الإلكتروني
                    </div>
                    <p
                      dir="ltr"
                      className="break-all text-left text-base font-extrabold text-white"
                    >
                      {getSafeText(successData.email)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <Building2 className="h-4 w-4 text-[#D8B06B]" />
                      الشركة
                    </div>
                    <p className="text-base font-extrabold text-white">
                      {getSafeText(successData.companyName)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <BriefcaseBusiness className="h-4 w-4 text-[#D8B06B]" />
                      المسمى الوظيفي
                    </div>
                    <p className="text-base font-extrabold text-white">
                      {getSafeText(successData.jobTitle)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/28 p-4 backdrop-blur-xl md:col-span-2">
                    <div className="mb-2 text-xs font-bold text-white/65">
                      رقم التسجيل
                    </div>
                    <p
                      dir="ltr"
                      className="break-all text-lg font-extrabold text-[#D8B06B]"
                    >
                      {successData.publicId || successData.registrationId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <CalendarDays className="h-4 w-4 text-[#D8B06B]" />
                      تاريخ الفعالية
                    </div>
                    <p className="text-sm font-extrabold text-white">
                      {formatDate(event?.startsAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/65">
                      <ShieldCheck className="h-4 w-4 text-[#D8B06B]" />
                      الجهة المنظمة
                    </div>
                    <p className="text-sm font-extrabold text-white">
                      {event?.client?.name || "Creative Group Event"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Left Side - QR */}
              <aside className="w-full lg:col-start-1 lg:row-start-1 ">
                <div className="flex h-full flex-col rounded-[2rem] border border-white/15 bg-black/50 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                  <div className="mb-5 text-right">
                    <div className="mb-2 flex items-center justify-end gap-2">
                      <p className="text-xl font-extrabold text-white">
                        رمز الدخول
                      </p>
                      <QrCode className="h-5 w-5 text-[#D8B06B]" />
                    </div>

                    <p className="text-xs font-bold leading-6 text-white/75">
                      استخدم هذا الرمز عند بوابة الدخول، ولا تشاركه مع أحد.
                    </p>
                  </div>

                  {/* QR left / buttons right on laptop */}
                  <div className="grid flex-1 items-center gap-5 md:grid-cols-[auto_1fr]">
                    {/* QR Card - Left */}
                    <div className="flex justify-center md:justify-start">
                      <div className="relative rounded-[1.5rem] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        <div className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#B58A45] text-white shadow-lg">
                          <ShieldCheck className="h-5 w-5" />
                        </div>

                        {qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt="Registration QR"
                            className="h-48 w-48 rounded-2xl object-contain md:h-52 md:w-52"
                          />
                        ) : qrValue ? (
                          <div
                            ref={qrContainerRef}
                            className="rounded-2xl bg-white"
                          >
                            <QRCodeSVG
                              value={qrValue}
                              size={205}
                              includeMargin
                            />
                          </div>
                        ) : (
                          <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 px-5 text-center md:h-52 md:w-52">
                            <p className="max-w-[200px] text-sm font-extrabold leading-7 text-red-700">
                              لم يرجع qrToken من الخادم. لا يمكن إنشاء QR صالح
                              للمسح.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Right */}
                    <div className="flex flex-col justify-center gap-3">
                      {qrImageUrl ? (
                        <a
                          href={qrImageUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#B58A45] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#B58A45]/25 transition hover:-translate-y-0.5 hover:bg-[#9E763A] hover:shadow-[#B58A45]/35"
                        >
                          <Download className="h-5 w-5" />
                          تحميل QR
                        </a>
                      ) : qrValue ? (
                        <button
                          type="button"
                          onClick={downloadRenderedQr}
                          className="inline-flex h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#B58A45] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#B58A45]/25 transition hover:-translate-y-0.5 hover:bg-[#9E763A] hover:shadow-[#B58A45]/35"
                        >
                          <Download className="h-5 w-5" />
                          تحميل QR
                        </button>
                      ) : null}

                      <Link
                        href={`/register/${eventId}`}
                        className="inline-flex h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/25  px-5 py-4 text-sm font-extrabold text-[#1E1E1E] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#F3F3F3]"
                      >
                        <RotateCcw className="h-5 w-5" />
                        تسجيل شخص آخر
                      </Link>
                    </div>
                  </div>

                  {!qrValue && !qrImageUrl ? (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-sm font-extrabold leading-7 text-red-200">
                      يجب أن يرجع الباك qrToken كـ string أو qrImageUrl.
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
