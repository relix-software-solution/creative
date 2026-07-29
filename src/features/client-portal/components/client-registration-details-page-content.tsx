"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useClientRegistration } from "../client-portal.queries";
import {
  clientAttendanceStatusLabels,
  clientEventStatusLabels,
  clientEventTypeLabels,
  clientRegistrationSourceLabels,
  clientRegistrationStatusLabels,
  formatClientDate,
  getClientAttendanceVariant,
  getClientEventStatusVariant,
  getClientPortalErrorMessage,
  getClientRegistrationStatusVariant,
} from "../client-portal.constants";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/8 bg-[#F8F8FF] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A88042]/10 text-[#A88042]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-[#4B4B4B]/45">{label}</p>
        <p className="mt-1 break-words text-sm font-extrabold text-[#252525]">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-[2rem] bg-black/[0.06]" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[2rem] bg-black/[0.06]" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-black/[0.06]" />
      </div>
    </div>
  );
}

export function ClientRegistrationDetailsPageContent({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const registrationQuery = useClientRegistration(registrationId);

  if (registrationQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (registrationQuery.isError || !registrationQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="بوابة العميل"
          title="تفاصيل التسجيل"
          description="تعذر تحميل التسجيل المطلوب أو أنه غير متاح ضمن حسابك."
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Button>
          }
        />

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <Users className="mb-4 h-14 w-14 text-red-400" />
            <h2 className="text-xl font-extrabold text-[#252525]">
              التسجيل غير متاح
            </h2>
            <p className="mt-2 max-w-xl text-sm font-bold leading-7 text-[#4B4B4B]/55">
              {getClientPortalErrorMessage(
                registrationQuery.error,
                "تعذر تحميل تفاصيل التسجيل",
              )}
            </p>
            <Button className="mt-5" onClick={() => registrationQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const registration = registrationQuery.data;
  const eventTitle = registration.event.titleAr || registration.event.titleEn;
  const attendeeTypeName =
    registration.attendeeType?.nameAr ||
    registration.attendeeType?.nameEn ||
    registration.attendeeType?.code;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`رقم التسجيل ${registration.publicId}`}
        title={registration.fullName}
        description={`تفاصيل التسجيل والحضور في فعالية ${eventTitle || "الفعالية"}.`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Button>
            <Button
              variant="outline"
              onClick={() => registrationQuery.refetch()}
              isLoading={registrationQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={getClientRegistrationStatusVariant(registration.status)}>
          {clientRegistrationStatusLabels[registration.status]}
        </Badge>
        <Badge variant={getClientAttendanceVariant(registration.attendance.status)}>
          {clientAttendanceStatusLabels[registration.attendance.status]}
        </Badge>
        <Badge variant="muted">
          {clientRegistrationSourceLabels[registration.source]}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>بيانات المسجل</CardTitle>
            <CardDescription>
              معلومات الاتصال والعمل المسجلة ضمن الفعالية.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon={UserRound} label="الاسم الكامل" value={registration.fullName} />
            <DetailRow icon={Phone} label="رقم الهاتف" value={registration.phone} />
            <DetailRow icon={Mail} label="البريد الإلكتروني" value={registration.email} />
            <DetailRow icon={Building2} label="الشركة" value={registration.companyName} />
            <DetailRow icon={BriefcaseBusiness} label="المسمى الوظيفي" value={registration.jobTitle} />
            <DetailRow icon={BadgeCheck} label="فئة الحضور" value={attendeeTypeName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل الحضور</CardTitle>
            <CardDescription>
              الحالة الحالية وأوقات الدخول والخروج المعتمدة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-[#A88042]/20 bg-[#A88042]/7 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold text-[#4B4B4B]/45">
                    الحالة الحالية
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#252525]">
                    {clientAttendanceStatusLabels[registration.attendance.status]}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-[#A88042]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                icon={Clock3}
                label="أول دخول"
                value={formatClientDate(registration.attendance.firstCheckedInAt)}
              />
              <DetailRow
                icon={Clock3}
                label="آخر دخول"
                value={formatClientDate(registration.attendance.lastEntryAt)}
              />
              <DetailRow
                icon={Clock3}
                label="آخر خروج"
                value={formatClientDate(registration.attendance.lastCheckedOutAt)}
              />
              <DetailRow
                icon={CalendarClock}
                label="تاريخ التسجيل"
                value={formatClientDate(registration.registeredAt)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{eventTitle || "الفعالية"}</CardTitle>
              <CardDescription>
                بيانات الفعالية المرتبطة بهذا التسجيل.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getClientEventStatusVariant(registration.event.status)}>
                {clientEventStatusLabels[registration.event.status]}
              </Badge>
              <Badge variant="gold">
                {clientEventTypeLabels[registration.event.type]}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <DetailRow
              icon={CalendarClock}
              label="بداية الفعالية"
              value={formatClientDate(registration.event.startsAt)}
            />
            <DetailRow
              icon={CalendarClock}
              label="نهاية الفعالية"
              value={formatClientDate(registration.event.endsAt)}
            />
            <DetailRow
              icon={Clock3}
              label="المنطقة الزمنية"
              value={registration.event.timezone}
            />
          </div>

          {registration.event.venues.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {registration.event.venues.map((venue) => (
                <div
                  key={venue.id}
                  className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-5"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#A88042]" />
                    <div>
                      <p className="font-extrabold text-[#252525]">
                        {venue.nameAr || venue.nameEn || "مكان الفعالية"}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/55">
                        {[venue.addressAr || venue.addressEn, venue.city, venue.country]
                          .filter(Boolean)
                          .join("، ") || "لا يوجد عنوان مسجل"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
