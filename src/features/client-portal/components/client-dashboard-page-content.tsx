"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
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
import {
  useClientDashboardSummary,
  useClientEvents,
  useClientRegistrations,
} from "@/features/client-portal/client-portal.queries";
import type {
  ClientAttendanceStatus,
  ClientEventStatus,
  ClientRegistrationStatus,
} from "@/features/client-portal/client-portal.types";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("ar-SY");

const dateFormatter = new Intl.DateTimeFormat("ar-SY", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const eventStatusLabels: Record<ClientEventStatus, string> = {
  DRAFT: "مسودة",
  SCHEDULED: "مجدولة",
  ACTIVE: "نشطة",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  ARCHIVED: "مؤرشفة",
};

const registrationStatusLabels: Record<ClientRegistrationStatus, string> = {
  PENDING: "بانتظار المراجعة",
  ACTIVE: "فعالة",
  CANCELLED: "ملغاة",
  BLOCKED: "محظورة",
  ARCHIVED: "مؤرشفة",
};

const attendanceStatusLabels: Record<ClientAttendanceStatus, string> = {
  NOT_CHECKED_IN: "لم يدخل",
  INSIDE: "داخل الفعالية",
  EXITED: "غادر",
};

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}

function getEventStatusVariant(status: ClientEventStatus) {
  if (status === "ACTIVE" || status === "COMPLETED") return "success";
  if (status === "SCHEDULED") return "gold";
  if (status === "CANCELLED") return "danger";
  if (status === "DRAFT") return "warning";
  return "muted";
}

function getRegistrationStatusVariant(status: ClientRegistrationStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED" || status === "BLOCKED") return "danger";
  return "muted";
}

function getAttendanceVariant(status: ClientAttendanceStatus) {
  if (status === "INSIDE") return "success";
  if (status === "EXITED") return "gold";
  return "muted";
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const message = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? "تعذر تحميل بيانات لوحة العميل";
    }

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "تعذر تحميل بيانات لوحة العميل";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="جاري تحميل لوحة العميل">
      <div className="h-36 animate-pulse rounded-[2rem] bg-black/8" />
      <div className="h-72 animate-pulse rounded-[2.5rem] bg-black/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-[2rem] bg-black/8"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[2rem] bg-black/8" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-black/8" />
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: typeof CalendarDays;
  tone?: "gold" | "black" | "green" | "blue" | "amber" | "purple";
};

const metricToneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  gold: "bg-[#A88042]/12 text-[#A88042] group-hover:bg-[#A88042] group-hover:text-white",
  black: "bg-black/8 text-black group-hover:bg-black group-hover:text-white",
  green:
    "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
  blue: "bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
  amber:
    "bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
  purple:
    "bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "gold",
}: MetricCardProps) {
  return (
    <Card className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#A88042]/35 hover:shadow-[0_24px_70px_rgba(168,128,66,0.13)]">
      <div
        className={cn(
          "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition",
          metricToneClasses[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      <p className="text-sm font-bold text-[#4B4B4B]/60">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#252525]">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#4B4B4B]/45">
        {description}
      </p>
    </Card>
  );
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-[#F8F8FF] p-6 text-center">
      <div>
        <CircleDot className="mx-auto h-9 w-9 text-[#A88042]/70" />
        <p className="mt-3 text-sm font-extrabold text-[#4B4B4B]/65">
          {message}
        </p>
      </div>
    </div>
  );
}

export function ClientDashboardPageContent() {
  const summaryQuery = useClientDashboardSummary();
  const eventsQuery = useClientEvents({
    page: 1,
    limit: 4,
    sortBy: "startsAt",
    sortDirection: "desc",
  });
  const registrationsQuery = useClientRegistrations({
    page: 1,
    limit: 5,
    sortBy: "registeredAt",
    sortDirection: "desc",
  });

  const isInitialLoading =
    summaryQuery.isLoading || eventsQuery.isLoading || registrationsQuery.isLoading;

  const isFetching =
    summaryQuery.isFetching || eventsQuery.isFetching || registrationsQuery.isFetching;

  const firstError =
    summaryQuery.error ?? eventsQuery.error ?? registrationsQuery.error;

  function refetchDashboard() {
    void Promise.all([
      summaryQuery.refetch(),
      eventsQuery.refetch(),
      registrationsQuery.refetch(),
    ]);
  }

  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  if (!summaryQuery.data || firstError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Client Portal"
          title="لوحة متابعة العميل"
          description="تعذر تحميل بيانات حساب العميل في الوقت الحالي."
        />

        <Card>
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <Activity className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-extrabold text-[#252525]">
              لم نتمكن من تحميل اللوحة
            </h2>
            <p className="mt-2 max-w-lg text-sm font-bold leading-7 text-[#4B4B4B]/55">
              {getErrorMessage(firstError)}
            </p>
            <Button className="mt-6" onClick={refetchDashboard}>
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = summaryQuery.data;
  const recentEvents = eventsQuery.data?.items ?? [];
  const recentRegistrations = registrationsQuery.data?.items ?? [];
  const attendanceRate = Math.min(
    Math.max(summary.attendance.attendanceRate || 0, 0),
    100,
  );

  const eventBreakdown = [
    { label: "نشطة", value: summary.events.active, className: "bg-emerald-500" },
    {
      label: "مجدولة",
      value: summary.events.scheduled,
      className: "bg-[#A88042]",
    },
    {
      label: "مكتملة",
      value: summary.events.completed,
      className: "bg-sky-500",
    },
    { label: "مسودة", value: summary.events.draft, className: "bg-amber-400" },
    {
      label: "ملغاة",
      value: summary.events.cancelled,
      className: "bg-red-500",
    },
    {
      label: "مؤرشفة",
      value: summary.events.archived,
      className: "bg-slate-400",
    },
  ];

  const registrationBreakdown = [
    {
      label: "فعالة",
      value: summary.registrations.active,
      className: "bg-emerald-500",
    },
    {
      label: "قيد الانتظار",
      value: summary.registrations.pending,
      className: "bg-amber-400",
    },
    {
      label: "ملغاة",
      value: summary.registrations.cancelled,
      className: "bg-red-500",
    },
    {
      label: "محظورة",
      value: summary.registrations.blocked,
      className: "bg-violet-500",
    },
    {
      label: "مؤرشفة",
      value: summary.registrations.archived,
      className: "bg-slate-400",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Client Portal"
        title={`مرحبًا بك في لوحة ${summary.client.name}`}
        description="نظرة مباشرة على فعالياتك، التسجيلات، وحالة الحضور ضمن حساب العميل الخاص بك."
        actions={
          <Button
            variant="outline"
            onClick={refetchDashboard}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
            {isFetching ? "جاري التحديث..." : "تحديث البيانات"}
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-[2.5rem] bg-black p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.2)] lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,128,66,0.36),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_25%),linear-gradient(135deg,rgba(168,128,66,0.08),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border border-[#A88042]/20" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full border border-[#A88042]/20" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-center">
          <div>
            <Badge className="mb-5 border border-[#A88042]/30 bg-[#A88042]/15 text-[#D6B06E] ring-0">
              بيانات محدثة حتى {formatDate(summary.generatedAt)}
            </Badge>

            <h2 className="max-w-3xl text-3xl font-extrabold leading-tight text-white lg:text-5xl">
              تابع أداء فعالياتك وحضور زوارك من مكان واحد.
            </h2>

            <p className="mt-5 max-w-2xl text-sm font-bold leading-8 text-white/60 lg:text-base">
              جميع الأرقام في هذه الصفحة معزولة لحساب العميل الحالي، مع وصول سريع
              إلى الفعاليات والتسجيلات والتحليلات التفصيلية.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/client/events"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37]"
              >
                <CalendarDays className="h-4 w-4" />
                عرض الفعاليات
              </Link>

              <Link
                href="/client/analytics"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:border-[#A88042] hover:bg-[#A88042]/20"
              >
                <BarChart3 className="h-4 w-4" />
                التحليلات
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/50">نسبة الحضور</p>
                <p className="mt-2 text-4xl font-extrabold text-white">
                  {attendanceRate.toFixed(2)}%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#A88042] transition-[width] duration-700"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-white/45">دخلوا مرة واحدة</p>
                <p className="mt-2 text-2xl font-extrabold text-white">
                  {formatNumber(summary.attendance.uniqueCheckedIn)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-white/45">داخل الفعاليات تقريبًا</p>
                <p className="mt-2 text-2xl font-extrabold text-[#D6B06E]">
                  {formatNumber(summary.attendance.currentInsideApprox)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="إجمالي الفعاليات"
          value={formatNumber(summary.events.total)}
          description="كل الفعاليات المرتبطة بالحساب"
          icon={CalendarDays}
          tone="gold"
        />
        <MetricCard
          title="الفعاليات النشطة"
          value={formatNumber(summary.events.active)}
          description="فعاليات قيد التشغيل حاليًا"
          icon={CalendarCheck2}
          tone="green"
        />
        <MetricCard
          title="إجمالي التسجيلات"
          value={formatNumber(summary.registrations.total)}
          description="كامل المسجلين ضمن الفعاليات"
          icon={Users}
          tone="black"
        />
        <MetricCard
          title="التسجيلات الفعالة"
          value={formatNumber(summary.registrations.active)}
          description="التسجيلات المؤهلة للحضور"
          icon={ClipboardList}
          tone="blue"
        />
        <MetricCard
          title="الحضور الفريد"
          value={formatNumber(summary.attendance.uniqueCheckedIn)}
          description="زوار لديهم دخول مسموح"
          icon={LogIn}
          tone="purple"
        />
        <MetricCard
          title="الخروج الفريد"
          value={formatNumber(summary.attendance.uniqueExited)}
          description="زوار لديهم خروج مسجل"
          icon={LogOut}
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>توزيع الفعاليات</CardTitle>
                <CardDescription>
                  حالة جميع الفعاليات الموجودة ضمن حسابك.
                </CardDescription>
              </div>
              <Badge variant="gold">{formatNumber(summary.events.total)}</Badge>
            </div>

            <div className="space-y-4">
              {eventBreakdown.map((item) => {
                const percentage =
                  summary.events.total === 0
                    ? 0
                    : (item.value / summary.events.total) * 100;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-extrabold text-[#4B4B4B]">
                        {item.label}
                      </span>
                      <span className="font-extrabold text-[#4B4B4B]/55">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          item.className,
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>توزيع التسجيلات</CardTitle>
                <CardDescription>
                  حالة التسجيلات المرتبطة بجميع فعاليات العميل.
                </CardDescription>
              </div>
              <Badge variant="black">
                {formatNumber(summary.registrations.total)}
              </Badge>
            </div>

            <div className="space-y-4">
              {registrationBreakdown.map((item) => {
                const percentage =
                  summary.registrations.total === 0
                    ? 0
                    : (item.value / summary.registrations.total) * 100;

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-extrabold text-[#4B4B4B]">
                        {item.label}
                      </span>
                      <span className="font-extrabold text-[#4B4B4B]/55">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          item.className,
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>أحدث الفعاليات</CardTitle>
                <CardDescription>
                  آخر الفعاليات المرتبطة بحساب العميل.
                </CardDescription>
              </div>

              <Link
                href="/client/events"
                className="inline-flex items-center gap-1 text-sm font-extrabold text-[#A88042] transition hover:text-[#8F6D37]"
              >
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <EmptyList message="لا توجد فعاليات مرتبطة بهذا الحساب بعد." />
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/client/events/${event.id}`}
                    className="block rounded-2xl border border-black/8 bg-[#F8F8FF] p-4 transition hover:border-[#A88042]/35 hover:bg-[#A88042]/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold text-[#252525]">
                          {event.titleAr || event.titleEn || "فعالية بدون عنوان"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[#4B4B4B]/50">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDate(event.startsAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {formatNumber(event._count.registrations)} تسجيل
                          </span>
                        </div>
                      </div>

                      <Badge variant={getEventStatusVariant(event.status)}>
                        {eventStatusLabels[event.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>أحدث التسجيلات</CardTitle>
                <CardDescription>
                  آخر الزوار الذين تم تسجيلهم ضمن فعالياتك.
                </CardDescription>
              </div>

              <Link
                href="/client/registrations"
                className="inline-flex items-center gap-1 text-sm font-extrabold text-[#A88042] transition hover:text-[#8F6D37]"
              >
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {recentRegistrations.length === 0 ? (
              <EmptyList message="لا توجد تسجيلات مرتبطة بهذا الحساب بعد." />
            ) : (
              <div className="space-y-3">
                {recentRegistrations.map((registration) => (
                  <Link
                    key={registration.id}
                    href={`/client/registrations/${registration.id}`}
                    className="block rounded-2xl border border-black/8 bg-[#F8F8FF] p-4 transition hover:border-[#A88042]/35 hover:bg-[#A88042]/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#252525]">
                          {registration.fullName}
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/50">
                          {registration.event.titleAr ||
                            registration.event.titleEn ||
                            "فعالية بدون عنوان"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge
                            variant={getRegistrationStatusVariant(
                              registration.status,
                            )}
                          >
                            {registrationStatusLabels[registration.status]}
                          </Badge>
                          <Badge
                            variant={getAttendanceVariant(
                              registration.attendance.status,
                            )}
                          >
                            {attendanceStatusLabels[registration.attendance.status]}
                          </Badge>
                        </div>
                      </div>

                      <span className="shrink-0 text-[11px] font-bold text-[#4B4B4B]/40">
                        {formatDate(registration.registeredAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
