"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { usePublicEvents } from "@/features/public-events/public-events.queries";
import { PublicEvent } from "@/features/public-events/public-events.types";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getEventTypeLabel(type?: string | null) {
  if (type === "EXHIBITION") return "معرض";
  if (type === "CONFERENCE") return "مؤتمر";
  if (type === "WORKSHOP") return "ورشة عمل";
  return "فعالية";
}

function getDescription(event: PublicEvent) {
  return (
    event.descriptionAr ||
    event.descriptionEn ||
    "فعالية متاحة للتسجيل عبر منصة Creative Group."
  );
}

export default function LandingPage() {
  const eventsQuery = usePublicEvents({
    page: 1,
    limit: 20,
  });

  const events = eventsQuery.data?.items ?? [];

  return (
    <main className="min-h-screen bg-[#F8F8FF] text-[#4B4B4B]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#F8F8FF]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_30%,rgba(168,128,66,0.95),transparent_16%),radial-gradient(circle_at_58%_30%,rgba(168,128,66,0.8),transparent_12%),radial-gradient(circle_at_45%_62%,rgba(168,128,66,0.65),transparent_14%),radial-gradient(circle_at_70%_68%,rgba(168,128,66,0.42),transparent_10%)]" />
              <span className="relative text-lg font-extrabold text-[#A88042]">
                C
              </span>
            </div>

            <div>
              <p className="text-base font-extrabold text-[#4B4B4B]">
                Creative Group
              </p>
              <p className="text-xs font-bold text-[#A88042]">
                For Event Services
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-extrabold text-[#4B4B4B]/70 md:flex">
            <a href="#events" className="transition hover:text-[#A88042]">
              المعارض
            </a>
            <a href="#features" className="transition hover:text-[#A88042]">
              المزايا
            </a>
            <a href="#about" className="transition hover:text-[#A88042]">
              عن المنصة
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-2xl bg-black px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#4B4B4B]"
          >
            دخول الإدارة
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(168,128,66,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(0,0,0,0.06),transparent_24%),radial-gradient(circle_at_75%_90%,rgba(168,128,66,0.12),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#A88042]/25 bg-[#A88042]/10 px-4 py-2 text-xs font-extrabold text-[#A88042]">
              <Sparkles className="h-4 w-4" />
              منصة تسجيل ودخول ذكية للفعاليات
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.25] text-[#4B4B4B] md:text-6xl">
              سجّل حضورك للمعارض والفعاليات بسهولة واحصل على QR الخاص بك.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-bold leading-8 text-[#4B4B4B]/65 md:text-lg">
              اختر المعرض المناسب، املأ بياناتك، واستلم رمز الدخول الخاص بك
              لتجربة دخول منظمة وسريعة بإدارة Creative Group.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#events"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-7 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37]"
              >
                استعرض المعارض
                <ArrowLeft className="h-5 w-5" />
              </a>

              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-7 text-sm font-extrabold text-[#4B4B4B] transition hover:border-[#A88042]/60 hover:text-[#A88042]"
              >
                لوحة الإدارة
                <ShieldCheck className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                <QrCode className="mb-3 h-6 w-6 text-[#A88042]" />
                <p className="text-sm font-extrabold">QR فوري</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#4B4B4B]/55">
                  رمز دخول خاص لكل مسجل.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                <CheckCircle2 className="mb-3 h-6 w-6 text-[#A88042]" />
                <p className="text-sm font-extrabold">تسجيل سهل</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#4B4B4B]/55">
                  خطوات واضحة وسريعة.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                <ShieldCheck className="mb-3 h-6 w-6 text-[#A88042]" />
                <p className="text-sm font-extrabold">دخول منظم</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#4B4B4B]/55">
                  تحقق سريع عند البوابات.
                </p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -right-8 -top-8 h-72 w-72 rounded-full bg-[#A88042]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[3rem] border border-white/60 bg-black p-5 shadow-[0_35px_100px_rgba(0,0,0,0.22)]">
              <div className="flex h-[560px] flex-col justify-between rounded-[2.4rem] bg-[radial-gradient(circle_at_25%_20%,rgba(168,128,66,0.35),transparent_28%),linear-gradient(135deg,#0B0B0B,#1E1E1E)] p-8 text-white">
                <div className="flex justify-end">
                  <div className="rounded-full border border-[#A88042]/30 bg-[#A88042]/10 px-4 py-2 text-xs font-extrabold text-[#C59B55]">
                    Creative Event Ops
                  </div>
                </div>

                <div>
                  <QrCode className="mb-6 h-20 w-20 text-[#C59B55]" />
                  <h2 className="text-4xl font-extrabold leading-[1.25]">
                    Registration
                    <br />& QR Access
                  </h2>
                  <p className="mt-4 max-w-sm text-sm font-bold leading-7 text-white/55">
                    منصة جاهزة لإدارة التسجيل والدخول للمعارض والمؤتمرات.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-2xl font-extrabold">
                      {eventsQuery.isLoading ? "..." : events.length}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      فعاليات
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-2xl font-extrabold">QR</p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      دخول ذكي
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-2xl font-extrabold">24/7</p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      تشغيل
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="events" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-extrabold text-[#A88042]">
            Available Events
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#4B4B4B] md:text-4xl">
            المعارض والفعاليات المتاحة للتسجيل
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-[#4B4B4B]/60">
            اختر المعرض المناسب وابدأ التسجيل للحصول على رمز الدخول الخاص بك.
          </p>
        </div>

        {eventsQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-black/10 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
              <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                جاري تحميل الفعاليات...
              </p>
            </div>
          </div>
        ) : eventsQuery.isError ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg font-extrabold text-red-700">
              تعذر تحميل الفعاليات
            </p>
            <p className="mt-2 text-sm font-bold text-red-600/70">
              تأكد من تشغيل الباك وأن endpoint /public/events يعمل بدون تسجيل
              دخول.
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center">
            <p className="text-lg font-extrabold text-[#4B4B4B]">
              لا توجد فعاليات متاحة حاليًا
            </p>
            <p className="mt-2 text-sm font-bold text-[#4B4B4B]/55">
              عند نشر فعاليات عامة من لوحة الإدارة ستظهر هنا.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.12)]"
              >
                <div className="relative flex h-64 items-end overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(168,128,66,0.45),transparent_28%),linear-gradient(135deg,#0B0B0B,#242424)] p-5">
                  <div className="absolute left-5 top-5 rounded-full bg-[#A88042] px-4 py-2 text-xs font-extrabold text-white">
                    {getEventTypeLabel(event.type)}
                  </div>

                  <div className="relative">
                    <p className="text-xs font-extrabold text-[#C59B55]">
                      Creative Event
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold leading-[1.25] text-white">
                      {event.titleAr}
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-extrabold text-[#4B4B4B]">
                    {event.titleAr}
                  </h3>

                  {event.titleEn ? (
                    <p className="mt-1 text-sm font-bold text-[#A88042]">
                      {event.titleEn}
                    </p>
                  ) : null}

                  <p className="mt-4 min-h-[56px] text-sm font-bold leading-7 text-[#4B4B4B]/60">
                    {getDescription(event)}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-black/10 pt-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                      <CalendarDays className="h-5 w-5 text-[#A88042]" />
                      {formatDate(event.startsAt)}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-[#4B4B4B]/65">
                      <MapPin className="h-5 w-5 text-[#A88042]" />
                      {event.client?.name || "Creative Group Event"}
                    </div>
                  </div>

                  <Link
                    href={`/register/${event.id}`}
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-extrabold text-white transition hover:bg-[#A88042]"
                  >
                    التسجيل في الفعالية
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="features" className="bg-black py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-3 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <QrCode className="mb-5 h-9 w-9 text-[#C59B55]" />
            <h3 className="text-xl font-extrabold">QR لكل زائر</h3>
            <p className="mt-3 text-sm font-bold leading-7 text-white/55">
              كل تسجيل يحصل على رمز دخول خاص قابل للتحقق من أجهزة السكانر.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <ShieldCheck className="mb-5 h-9 w-9 text-[#C59B55]" />
            <h3 className="text-xl font-extrabold">تنظيم دخول احترافي</h3>
            <p className="mt-3 text-sm font-bold leading-7 text-white/55">
              ربط الحضور بأنواع حضور ونقاط دخول لضمان تجربة سلسة.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <Sparkles className="mb-5 h-9 w-9 text-[#C59B55]" />
            <h3 className="text-xl font-extrabold">تجربة فاخرة</h3>
            <p className="mt-3 text-sm font-bold leading-7 text-white/55">
              واجهة عامة أنيقة وهوية متناسقة مع Creative Group.
            </p>
          </div>
        </div>
      </section>

      <footer id="about" className="border-t border-black/10 bg-[#F8F8FF] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-center md:flex-row md:items-center md:justify-between md:text-right lg:px-8">
          <p className="text-sm font-extrabold text-[#4B4B4B]">
            Creative Group For Event Services
          </p>
          <p className="text-xs font-bold text-[#4B4B4B]/50">
            © Creative Group. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
