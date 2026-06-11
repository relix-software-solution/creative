"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
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

  /**
   * مهم جدًا:
   * لا نستخدم registrationId ولا publicId كـ QR.
   * scanner يحتاج signed qrToken فقط.
   */
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
    link.download = `creative-registration-${
      successData?.registrationId || "qr"
    }.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (eventQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F8FF]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

          <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
            جاري تحميل نتيجة التسجيل...
          </p>
        </div>
      </main>
    );
  }

  if (!successData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F8FF] px-4">
        <div className="max-w-lg rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#A88042]/10 text-[#A88042]">
            <QrCode className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-[#4B4B4B]">
            لا توجد نتيجة تسجيل محفوظة
          </h1>

          <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/60">
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 text-sm font-extrabold text-[#4B4B4B] transition hover:border-[#A88042]/50 hover:text-[#A88042]"
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
              Registration Confirmed
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <aside className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(168,128,66,0.45),transparent_28%),linear-gradient(135deg,#0B0B0B,#242424)] p-7 text-white">
            <div className="flex justify-end">
              <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-extrabold text-emerald-300">
                تم التسجيل بنجاح
              </div>
            </div>

            <div>
              <CheckCircle2 className="mb-6 h-16 w-16 text-emerald-300" />

              <h1 className="text-4xl font-extrabold leading-[1.25]">
                Registration
                <br />
                Confirmed
              </h1>

              <p className="mt-4 max-w-sm text-sm font-bold leading-7 text-white/55">
                احتفظ برمز الدخول الخاص بك لاستخدامه عند بوابات الفعالية.
              </p>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm font-extrabold text-[#A88042]">
              بيانات الفعالية
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
              {event?.titleAr || "الفعالية"}
            </h2>

            {event?.titleEn ? (
              <p className="mt-1 text-sm font-bold text-[#4B4B4B]/50">
                {event.titleEn}
              </p>
            ) : null}

            <div className="mt-6 space-y-3 border-t border-black/10 pt-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                <CalendarDays className="h-5 w-5 text-[#A88042]" />
                {formatDate(event?.startsAt)}
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                <ShieldCheck className="h-5 w-5 text-[#A88042]" />
                {event?.client?.name || "Creative Group Event"}
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h2 className="text-3xl font-extrabold text-[#4B4B4B]">
              تم تسجيلك بنجاح
            </h2>

            <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/60">
              يرجى حفظ رقم التسجيل ورمز QR لاستخدامهما عند الدخول.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/50">
                <UserRound className="h-4 w-4 text-[#A88042]" />
                اسم المسجل
              </div>

              <p className="mt-2 text-lg font-extrabold text-[#4B4B4B]">
                {getSafeText(successData.fullName)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <p className="text-xs font-bold text-[#4B4B4B]/50">
                حالة التسجيل
              </p>

              <p className="mt-2 text-lg font-extrabold text-emerald-700">
                {getStatusLabel(successData.status)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/50">
                <Phone className="h-4 w-4 text-[#A88042]" />
                رقم الهاتف
              </div>

              <p dir="ltr" className="mt-2 text-left text-base font-extrabold">
                {getSafeText(successData.phone)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/50">
                <Mail className="h-4 w-4 text-[#A88042]" />
                البريد الإلكتروني
              </div>

              <p
                dir="ltr"
                className="mt-2 break-all text-left text-base font-extrabold"
              >
                {getSafeText(successData.email)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/50">
                <Building2 className="h-4 w-4 text-[#A88042]" />
                الشركة
              </div>

              <p className="mt-2 text-base font-extrabold">
                {getSafeText(successData.companyName)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/50">
                <BriefcaseBusiness className="h-4 w-4 text-[#A88042]" />
                المسمى الوظيفي
              </div>

              <p className="mt-2 text-base font-extrabold">
                {getSafeText(successData.jobTitle)}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4 sm:col-span-2">
              <p className="text-xs font-bold text-[#4B4B4B]/50">رقم التسجيل</p>

              <p
                dir="ltr"
                className="mt-2 break-all text-lg font-extrabold text-[#A88042]"
              >
                {successData.publicId || successData.registrationId}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-black/10 bg-[#F8F8FF] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  رمز الدخول QR
                </p>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/50">
                  استخدم هذا الرمز عند بوابة الدخول.
                </p>
              </div>

              <QrCode className="h-7 w-7 text-[#A88042]" />
            </div>

            <div className="flex justify-center rounded-[1.5rem] bg-white p-5">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Registration QR"
                  className="h-64 w-64 rounded-2xl object-contain"
                />
              ) : qrValue ? (
                <div
                  ref={qrContainerRef}
                  className="rounded-2xl border border-black/10 bg-white p-4"
                >
                  <QRCodeSVG value={qrValue} size={230} includeMargin />
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 px-5 text-center">
                  <p className="max-w-[230px] text-sm font-extrabold leading-7 text-red-700">
                    لم يرجع qrToken من الخادم. لا يمكن إنشاء QR صالح للمسح.
                  </p>
                </div>
              )}
            </div>

            {!qrValue && !qrImageUrl ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-extrabold leading-7 text-red-700">
                يجب أن يرجع الباك qrToken كـ string أو داخل object مثل token /
                qrToken.
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {qrImageUrl ? (
              <a
                href={qrImageUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white transition hover:bg-[#8F6D37]"
              >
                <Download className="h-5 w-5" />
                تحميل QR
              </a>
            ) : qrValue ? (
              <button
                type="button"
                onClick={downloadRenderedQr}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white transition hover:bg-[#8F6D37]"
              >
                <Download className="h-5 w-5" />
                تحميل QR
              </button>
            ) : (
              <div />
            )}

            <Link
              href={`/register/${eventId}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-sm font-extrabold text-[#4B4B4B] transition hover:border-[#A88042]/50 hover:text-[#A88042]"
            >
              <RotateCcw className="h-5 w-5" />
              تسجيل شخص آخر
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-extrabold text-white transition hover:bg-[#4B4B4B]"
            >
              <Home className="h-5 w-5" />
              الرئيسية
            </Link>
          </div>

          <p className="mt-5 text-center text-xs font-bold leading-6 text-[#4B4B4B]/45">
            بارك الله فيك، احرص على عدم مشاركة رمز QR مع أي شخص آخر لأنه خاص
            بتسجيلك فقط.
          </p>
        </section>
      </section>
    </main>
  );
}
