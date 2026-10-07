"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRoundCheck,
  X,
} from "lucide-react";

import { usePublicEvents } from "@/features/public-events/public-events.queries";
import { PublicEvent } from "@/features/public-events/public-events.types";

const EVENT_FILTERS = [
  { value: "ALL", label: "الكل" },
  { value: "EXHIBITION", label: "المعارض" },
  { value: "CONFERENCE", label: "المؤتمرات" },
  { value: "WORKSHOP", label: "ورش العمل" },
] as const;

type EventFilter = (typeof EVENT_FILTERS)[number]["value"];

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

function matchesSearch(event: PublicEvent, term: string) {
  if (!term) return true;

  const haystack = [
    event.titleAr,
    event.titleEn,
    event.descriptionAr,
    event.descriptionEn,
    event.client?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return haystack.includes(term.toLocaleLowerCase());
}

function BrandMark() {
  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-[0_14px_35px_rgba(0,0,0,0.22)]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_30%,rgba(168,128,66,0.95),transparent_16%),radial-gradient(circle_at_58%_30%,rgba(168,128,66,0.8),transparent_12%),radial-gradient(circle_at_45%_62%,rgba(168,128,66,0.65),transparent_14%),radial-gradient(circle_at_70%_68%,rgba(168,128,66,0.42),transparent_10%)]" />
      <span className="relative text-base font-black text-[#C59B55]">C</span>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.05)]">
      <div className="h-56 animate-pulse bg-black/[0.08]" />
      <div className="space-y-4 p-6">
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-black/[0.08]" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-black/[0.06]" />
        <div className="space-y-2 pt-3">
          <div className="h-3 animate-pulse rounded-full bg-black/[0.05]" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-black/[0.05]" />
        </div>
        <div className="h-12 animate-pulse rounded-2xl bg-black/[0.08]" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<EventFilter>("ALL");

  const eventsQuery = usePublicEvents({
    page: 1,
    limit: 20,
  });

  const events = eventsQuery.data?.items ?? [];

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim();

    return events.filter((event) => {
      const typeMatches =
        activeFilter === "ALL" || event.type === activeFilter;

      return typeMatches && matchesSearch(event, normalizedSearch);
    });
  }, [activeFilter, events, searchTerm]);

  const hasFilters = searchTerm.trim().length > 0 || activeFilter !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilter("ALL");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#F8F8FF] text-[#3E3E3E]"
    >
      <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-[#F8F8FF]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link
            href="/"
            aria-label="Creative Group"
            className="flex items-center gap-3 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-[#A88042]/50"
          >
            <BrandMark />
            <div className="leading-tight">
              <p className="text-[15px] font-black tracking-tight text-[#303030]">
                Creative Group
              </p>
              <p className="mt-1 text-[11px] font-extrabold text-[#A88042]">
                For Event Services
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-black/[0.06] bg-white/70 p-1.5 text-sm font-extrabold text-[#4B4B4B]/65 shadow-sm md:flex">
            <a
              href="#events"
              className="rounded-xl px-4 py-2 transition hover:bg-[#A88042]/10 hover:text-[#8F6D37]"
            >
              الفعاليات
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl px-4 py-2 transition hover:bg-[#A88042]/10 hover:text-[#8F6D37]"
            >
              كيف يعمل التسجيل؟
            </a>
            <a
              href="#features"
              className="rounded-xl px-4 py-2 transition hover:bg-[#A88042]/10 hover:text-[#8F6D37]"
            >
              المزايا
            </a>
          </nav>

          <a
            href="#events"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-4 text-xs font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A88042] sm:px-5 sm:text-sm"
          >
            التسجيل الآن
            <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_12%,rgba(168,128,66,0.18),transparent_31%),radial-gradient(circle_at_86%_18%,rgba(0,0,0,0.065),transparent_24%),radial-gradient(circle_at_74%_88%,rgba(168,128,66,0.11),transparent_30%)]" />
        <div className="pointer-events-none absolute left-1/2 top-14 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-[#A88042]/10" />
        <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[320px] w-[320px] -translate-x-1/2 rounded-full border border-[#A88042]/10" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 lg:min-h-[690px] lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#A88042]/20 bg-white/70 px-4 py-2 text-xs font-black text-[#8F6D37] shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              تجربة تسجيل أسرع وأكثر وضوحاً
            </div>

            <h1 className="text-[2.6rem] font-black leading-[1.18] tracking-tight text-[#303030] sm:text-5xl md:text-6xl">
              بوابتك السريعة إلى
              <span className="relative mx-2 inline-block text-[#A88042]">
                الفعاليات
                <span className="absolute -bottom-2 right-0 h-2 w-full rounded-full bg-[#A88042]/12" />
              </span>
              والمعارض
            </h1>

            <p className="mt-7 max-w-2xl text-base font-bold leading-8 text-[#4B4B4B]/62 md:text-lg">
              اختر الفعالية، أدخل بياناتك مرة واحدة، واحصل على رمز الدخول الخاص
              بك. تجربة مصممة لتقليل الانتظار وجعل الوصول إلى الحدث أكثر سلاسة.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#events"
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-7 text-sm font-black text-white shadow-[0_18px_45px_rgba(168,128,66,0.28)] transition hover:-translate-y-0.5 hover:bg-[#8F6D37]"
              >
                استعرض الفعاليات
                <ArrowLeft className="h-5 w-5" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white/80 px-7 text-sm font-black text-[#404040] shadow-sm backdrop-blur transition hover:border-[#A88042]/40 hover:text-[#8F6D37]"
              >
                كيف يتم التسجيل؟
                <TicketCheck className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-[1.4rem] border border-black/[0.07] bg-white/80 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.04)] backdrop-blur">
                <p className="text-2xl font-black text-[#303030]">
                  {eventsQuery.isLoading ? "…" : events.length}
                </p>
                <p className="mt-1 text-[11px] font-extrabold text-[#4B4B4B]/45 sm:text-xs">
                  فعاليات متاحة
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/[0.07] bg-white/80 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.04)] backdrop-blur">
                <p className="text-2xl font-black text-[#303030]">QR</p>
                <p className="mt-1 text-[11px] font-extrabold text-[#4B4B4B]/45 sm:text-xs">
                  دخول سريع
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-black/[0.07] bg-white/80 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.04)] backdrop-blur">
                <p className="text-2xl font-black text-[#303030]">3</p>
                <p className="mt-1 text-[11px] font-extrabold text-[#4B4B4B]/45 sm:text-xs">
                  خطوات فقط
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-10 h-72 w-72 rounded-full bg-[#A88042]/14 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.6rem] border border-white/70 bg-black p-4 shadow-[0_38px_110px_rgba(0,0,0,0.2)]">
              <div className="relative min-h-[500px] overflow-hidden rounded-[2.15rem] bg-[radial-gradient(circle_at_18%_15%,rgba(168,128,66,0.38),transparent_27%),radial-gradient(circle_at_82%_72%,rgba(168,128,66,0.16),transparent_26%),linear-gradient(145deg,#090909,#1C1C1C)] p-7 text-white sm:p-9">
                <div className="absolute -left-16 top-10 h-48 w-48 rounded-full border border-white/[0.05]" />
                <div className="absolute -left-7 top-20 h-32 w-32 rounded-full border border-[#C59B55]/10" />

                <div className="flex items-center justify-between">
                  <div className="rounded-full border border-[#C59B55]/25 bg-[#C59B55]/10 px-4 py-2 text-[11px] font-black tracking-wide text-[#D7B16D]">
                    CREATIVE EVENT ACCESS
                  </div>
                  <BrandMark />
                </div>

                <div className="mt-20">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.06] shadow-2xl">
                    <QrCode className="h-11 w-11 text-[#D7B16D]" />
                  </div>

                  <h2 className="mt-7 max-w-md text-4xl font-black leading-[1.2] tracking-tight">
                    تسجيل بسيط.
                    <br />
                    دخول أسرع.
                  </h2>

                  <p className="mt-4 max-w-sm text-sm font-bold leading-7 text-white/55">
                    رحلة واضحة من اختيار الفعالية وحتى إبراز رمز الدخول عند
                    البوابة.
                  </p>
                </div>

                <div className="mt-14 grid grid-cols-3 gap-3">
                  {[
                    ["01", "اختر"],
                    ["02", "سجّل"],
                    ["03", "ادخل"],
                  ].map(([number, label]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                    >
                      <p className="text-xs font-black text-[#D7B16D]">
                        {number}
                      </p>
                      <p className="mt-2 text-sm font-black text-white/85">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="events"
        className="scroll-mt-24 border-y border-black/[0.06] bg-white/55 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A88042]">
                Available Events
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#303030] md:text-4xl">
                اختر فعاليتك وابدأ التسجيل
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-[#4B4B4B]/55">
                استخدم البحث أو التصفية للوصول بسرعة إلى الفعالية المطلوبة.
              </p>
            </div>

            {!eventsQuery.isLoading && !eventsQuery.isError ? (
              <div className="rounded-2xl border border-black/[0.06] bg-[#F8F8FF] px-4 py-3 text-xs font-extrabold text-[#4B4B4B]/55">
                {filteredEvents.length} من {events.length} فعالية
              </div>
            ) : null}
          </div>

          <div className="mt-9 rounded-[2rem] border border-black/[0.07] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.045)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="relative block flex-1">
                <span className="sr-only">ابحث عن فعالية</span>
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]/35" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث باسم الفعالية أو الجهة المنظمة..."
                  className="h-13 w-full rounded-2xl border border-black/[0.07] bg-[#F8F8FF] pr-12 pl-11 text-sm font-bold text-[#3E3E3E] outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042]/45 focus:ring-4 focus:ring-[#A88042]/10"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#4B4B4B]/40 transition hover:bg-black/[0.05] hover:text-[#3E3E3E]"
                    aria-label="مسح البحث"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>

              <div
                className="flex flex-wrap gap-2"
                aria-label="تصفية نوع الفعالية"
              >
                {EVENT_FILTERS.map((filter) => {
                  const active = activeFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setActiveFilter(filter.value)}
                      className={`h-11 rounded-2xl px-4 text-xs font-black transition ${
                        active
                          ? "bg-black text-white shadow-md"
                          : "border border-black/[0.07] bg-white text-[#4B4B4B]/60 hover:border-[#A88042]/30 hover:text-[#8F6D37]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {eventsQuery.isLoading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </div>
          ) : eventsQuery.isError ? (
            <div className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-lg font-black text-red-700">
                تعذر تحميل الفعاليات حالياً
              </p>
              <p className="mt-2 text-sm font-bold text-red-600/70">
                أعد المحاولة بعد لحظات.
              </p>
              <button
                type="button"
                onClick={() => eventsQuery.refetch()}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-red-700 px-5 text-sm font-black text-white transition hover:bg-red-800"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-black/[0.07] bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                <CalendarDays className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-black text-[#303030]">
                لا توجد فعاليات متاحة حالياً
              </p>
              <p className="mt-2 text-sm font-bold text-[#4B4B4B]/50">
                ستظهر الفعاليات هنا فور فتح التسجيل العام.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-black/[0.07] bg-white p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-[#A88042]" />
              <p className="mt-4 text-lg font-black text-[#303030]">
                لم نجد فعالية مطابقة
              </p>
              <p className="mt-2 text-sm font-bold text-[#4B4B4B]/50">
                جرّب تغيير كلمة البحث أو نوع الفعالية.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-2xl border border-black/[0.08] px-5 py-2.5 text-sm font-black text-[#3E3E3E] transition hover:border-[#A88042]/35 hover:text-[#8F6D37]"
              >
                عرض كل الفعاليات
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event, index) => (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.055)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_95px_rgba(0,0,0,0.1)]"
                >
                  <div className="relative flex h-56 items-end overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(168,128,66,0.52),transparent_27%),radial-gradient(circle_at_82%_78%,rgba(168,128,66,0.18),transparent_30%),linear-gradient(140deg,#090909,#242424)] p-6">
                    <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 group-hover:bg-white/[0.025]" />
                    <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/30 px-3.5 py-2 text-[11px] font-black text-[#E0BC78] backdrop-blur">
                      {getEventTypeLabel(event.type)}
                    </div>
                    <div className="absolute right-5 top-5 flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] px-2 text-xs font-black text-white/60">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="relative">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C59B55]">
                        Creative Event
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-[1.25] text-white">
                        {event.titleAr}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    {event.titleEn ? (
                      <p className="text-sm font-extrabold text-[#A88042]">
                        {event.titleEn}
                      </p>
                    ) : null}

                    <p className="mt-4 line-clamp-2 min-h-[56px] text-sm font-bold leading-7 text-[#4B4B4B]/58">
                      {getDescription(event)}
                    </p>

                    <div className="mt-5 space-y-3 rounded-2xl bg-[#F8F8FF] p-4">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-[#4B4B4B]/65">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#A88042] shadow-sm">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <span>{formatDate(event.startsAt)}</span>
                      </div>

                      <div className="flex items-center gap-2.5 text-sm font-bold text-[#4B4B4B]/65">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#A88042] shadow-sm">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="line-clamp-1">
                          {event.client?.name || "Creative Group Event"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/register/${event.id}`}
                      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-black text-white transition group-hover:bg-[#A88042]"
                    >
                      التسجيل في الفعالية
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A88042]">
            Simple Journey
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#303030] md:text-4xl">
            من اختيار الفعالية إلى البوابة بثلاث خطوات
          </h2>
          <p className="mt-4 text-sm font-bold leading-7 text-[#4B4B4B]/55">
            صممنا رحلة التسجيل لتكون واضحة حتى على الهاتف، بدون خطوات جانبية
            أو انتقالات غير ضرورية.
          </p>
        </div>

        <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
          {[
            {
              number: "01",
              icon: CalendarDays,
              title: "اختر الفعالية",
              text: "ابحث عن المعرض أو المؤتمر المناسب واطلع على معلوماته الأساسية.",
            },
            {
              number: "02",
              icon: UserRoundCheck,
              title: "أدخل بياناتك",
              text: "أكمل نموذج التسجيل بالحقول المطلوبة للفعالية ونوع الحضور.",
            },
            {
              number: "03",
              icon: QrCode,
              title: "احصل على QR",
              text: "احتفظ برمز الدخول وقدّمه عند البوابة لإتمام عملية الدخول بسرعة.",
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white p-7 shadow-[0_22px_65px_rgba(0,0,0,0.045)]"
              >
                <span className="absolute left-6 top-5 text-5xl font-black text-black/[0.035]">
                  {step.number}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-black text-[#303030]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/55">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-24 relative overflow-hidden bg-[#0B0B0B] py-20 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(168,128,66,0.18),transparent_26%),radial-gradient(circle_at_88%_80%,rgba(168,128,66,0.13),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C59B55]">
                Why Creative Group
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                تجربة مصممة للزائر،
                <br />
                وليست مجرد نموذج تسجيل.
              </h2>
            </div>

            <p className="max-w-2xl text-sm font-bold leading-8 text-white/50 lg:justify-self-end">
              الواجهة العامة تعرض للزائر فقط ما يحتاجه فعلاً: الفعاليات،
              معلوماتها، التسجيل، ورمز الدخول. بدون تشتيت أو روابط تشغيل داخلية.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "QR لكل زائر",
                text: "رمز دخول مخصص لكل تسجيل مع تجربة مناسبة للاستخدام على الهاتف.",
              },
              {
                icon: ShieldCheck,
                title: "دخول أكثر تنظيماً",
                text: "ربط التسجيل مع آلية التحقق عند نقاط الدخول لتقليل الازدحام.",
              },
              {
                icon: CheckCircle2,
                title: "رحلة واضحة",
                text: "محتوى مركز، حالات واضحة، وأزرار مباشرة تقود الزائر للخطوة التالية.",
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 transition hover:-translate-y-1 hover:border-[#C59B55]/30 hover:bg-white/[0.075]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C59B55]/10 text-[#D7B16D]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{feature.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-white/50">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:flex-row sm:p-8">
            <div>
              <p className="text-lg font-black">جاهز للتسجيل؟</p>
              <p className="mt-2 text-sm font-bold text-white/45">
                اختر فعاليتك المتاحة وابدأ خلال دقائق.
              </p>
            </div>
            <a
              href="#events"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-6 text-sm font-black text-white transition hover:bg-[#C59B55] sm:w-auto"
            >
              عرض الفعاليات
              <ArrowLeft className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.07] bg-[#F8F8FF]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-black text-[#303030]">
                Creative Group For Event Services
              </p>
              <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                Registration & Event Access
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-extrabold text-[#4B4B4B]/50">
            <a href="#events" className="transition hover:text-[#A88042]">
              الفعاليات
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-[#A88042]"
            >
              طريقة التسجيل
            </a>
            <a href="#features" className="transition hover:text-[#A88042]">
              المزايا
            </a>
          </div>

          <p className="text-xs font-bold text-[#4B4B4B]/40">
            © Creative Group. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
