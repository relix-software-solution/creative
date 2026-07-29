"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  QrCode,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useClientEvent } from "../client-portal.queries";
import {
  clientEventStatusLabels,
  clientEventTypeLabels,
  formatClientDate,
  formatClientNumber,
  getClientEventStatusVariant,
  getClientPortalErrorMessage,
} from "../client-portal.constants";

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-[2rem] bg-black/[0.06]" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-black/[0.06]" />
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-black/[0.06]" />
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/8 bg-[#F8F8FF] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A88042]/10 text-[#A88042]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-[#4B4B4B]/45">{label}</p>
        <p className="mt-1 break-words text-sm font-extrabold leading-6 text-[#252525]">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ClientEventDetailsPageContent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const eventQuery = useClientEvent(eventId);
  const event = eventQuery.data;

  if (eventQuery.isLoading) return <DetailsSkeleton />;

  if (eventQuery.isError || !event) {
    return (
      <Card>
        <CardContent className="flex min-h-[28rem] flex-col items-center justify-center text-center">
          <CalendarClock className="mb-4 h-14 w-14 text-red-400" />
          <h1 className="text-2xl font-extrabold text-[#252525]">
            تعذر تحميل تفاصيل الفعالية
          </h1>
          <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-[#4B4B4B]/55">
            {getClientPortalErrorMessage(
              eventQuery.error,
              "الفعالية غير موجودة أو لا تملك صلاحية الوصول إليها",
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/client/events")}>
              <ArrowRight className="h-4 w-4" />
              العودة للفعاليات
            </Button>
            <Button onClick={() => eventQuery.refetch()}>إعادة المحاولة</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const description = event.descriptionAr || event.descriptionEn;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="تفاصيل الفعالية"
        title={event.titleAr}
        description={event.titleEn || "عرض معلومات الفعالية ومكانها وفئات الحضور."}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/client/events")}
            >
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => eventQuery.refetch()}
              isLoading={eventQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-l from-black via-[#252525] to-[#A88042] p-6 text-white lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getClientEventStatusVariant(event.status)}>
                  {clientEventStatusLabels[event.status]}
                </Badge>
                <Badge className="bg-white/10 text-white ring-white/20">
                  {clientEventTypeLabels[event.type]}
                </Badge>
              </div>
              <h2 className="mt-5 text-2xl font-extrabold leading-10 lg:text-3xl">
                {event.titleAr}
              </h2>
              {event.titleEn ? (
                <p className="mt-2 text-sm font-bold text-white/55" dir="ltr">
                  {event.titleEn}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[32rem]">
              {[
                ["التسجيلات", event._count.registrations],
                ["فئات الحضور", event._count.attendeeTypes],
                ["المواقع", event._count.venues],
                ["نقاط الدخول", event._count.checkpoints],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-extrabold">
                    {formatClientNumber(Number(value))}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#A88042]" />
                <CardTitle>وصف الفعالية</CardTitle>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm font-bold leading-8 text-[#4B4B4B]/65">
                {description || "لا يوجد وصف مضاف لهذه الفعالية."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#A88042]" />
                <CardTitle>أماكن الفعالية</CardTitle>
              </div>
              <CardDescription>
                المواقع والعناوين المرتبطة بهذه الفعالية.
              </CardDescription>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {event.venues.length > 0 ? (
                  event.venues.map((venue) => (
                    <div key={venue.id} className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                      <h3 className="font-extrabold text-[#252525]">{venue.nameAr}</h3>
                      {venue.nameEn ? (
                        <p className="mt-1 text-xs font-bold text-[#4B4B4B]/40" dir="ltr">
                          {venue.nameEn}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/60">
                        {[venue.addressAr || venue.addressEn, venue.city, venue.country]
                          .filter(Boolean)
                          .join("، ") || "لا يوجد عنوان تفصيلي"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm font-bold text-[#4B4B4B]/45 md:col-span-2">
                    لم تتم إضافة مكان لهذه الفعالية.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <Tags className="h-5 w-5 text-[#A88042]" />
                <CardTitle>فئات الحضور</CardTitle>
              </div>
              <CardDescription>الفئات المتاحة ضمن تسجيلات الفعالية.</CardDescription>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {event.attendeeTypes.length > 0 ? (
                  event.attendeeTypes.map((attendeeType) => (
                    <div key={attendeeType.id} className="rounded-2xl border border-black/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-extrabold text-[#252525]">{attendeeType.nameAr}</h3>
                        <Badge variant={attendeeType.isActive === false ? "muted" : "success"}>
                          {attendeeType.isActive === false ? "غير فعالة" : "فعالة"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[#A88042]">{attendeeType.code}</p>
                      <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/55">
                        {attendeeType.descriptionAr ||
                          attendeeType.descriptionEn ||
                          "لا يوجد وصف لهذه الفئة."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm font-bold text-[#4B4B4B]/45 sm:col-span-2">
                    لا توجد فئات حضور مرتبطة بالفعالية.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <CardTitle>الجدول الزمني</CardTitle>
              <DetailRow icon={CalendarClock} label="تبدأ" value={formatClientDate(event.startsAt)} />
              <DetailRow icon={Clock3} label="تنتهي" value={formatClientDate(event.endsAt)} />
              <DetailRow icon={ShieldCheck} label="المنطقة الزمنية" value={event.timezone || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <CardTitle>سياسات الدخول</CardTitle>
              <DetailRow
                icon={Repeat2}
                label="إعادة الدخول"
                value={event.allowReEntry ? "مسموحة" : "غير مسموحة"}
              />
              <DetailRow
                icon={Users}
                label="استراتيجية منع التكرار"
                value={event.duplicateStrategy || "—"}
              />
              <DetailRow
                icon={QrCode}
                label="صلاحية QR"
                value={
                  event.qrValidFrom || event.qrValidUntil
                    ? `${formatClientDate(event.qrValidFrom)} — ${formatClientDate(event.qrValidUntil)}`
                    : "تتبع مدة الفعالية"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <CardTitle>حالة الإتاحة</CardTitle>
              </div>
              <p className="mt-4 text-sm font-bold leading-7 text-[#4B4B4B]/60">
                {event.isActive
                  ? "الفعالية مفعّلة ويمكن عرض بياناتها ضمن بوابة العميل."
                  : "الفعالية غير مفعّلة حاليًا، لكن بياناتها التاريخية ما تزال ظاهرة ضمن حسابك."}
              </p>
              <Badge className="mt-4" variant={event.isActive ? "success" : "muted"}>
                {event.isActive ? "مفعّلة" : "غير مفعّلة"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
