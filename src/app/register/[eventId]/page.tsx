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
import { usePublicEvent } from "@/features/public-events/public-events.queries";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function RegisterPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const eventQuery = usePublicEvent(eventId);
  const event = eventQuery.data;

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

          <form className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  الاسم الكامل
                </label>
                <input
                  placeholder="مثال: محمد أحمد"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  رقم الهاتف
                </label>
                <input
                  placeholder="+963944123456"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-left text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  البريد الإلكتروني
                </label>
                <input
                  placeholder="name@example.com"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-left text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-extrabold text-[#4B4B4B]">
                  الشركة
                </label>
                <input
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
                placeholder="مثال: مدير تسويق"
                className="h-12 w-full rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 text-sm font-bold outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
              />
            </div>

            <button
              type="button"
              className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37]"
            >
              <CheckCircle2 className="h-5 w-5" />
              إرسال طلب التسجيل
            </button>

            <p className="text-center text-xs font-bold leading-6 text-[#4B4B4B]/45">
              بالضغط على إرسال، سيتم حفظ بياناتك لإنشاء QR الدخول الخاص بك.
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
