"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  useClientAnalytics,
  useClientEvent,
  useClientEvents,
} from "../client-portal.queries";
import type {
  ClientAnalyticsGranularity,
  ClientAttendanceFilter,
  ClientRegistrationSource,
  ClientRegistrationStatus,
} from "../client-portal.types";
import {
  clientRegistrationSourceLabels,
  clientRegistrationStatusLabels,
  formatClientDateOnly,
  formatClientNumber,
  getClientPortalErrorMessage,
} from "../client-portal.constants";
import {
  ClientRegistrationFilters,
  type ClientRegistrationFilterValues,
} from "./client-registration-filters";

const initialFilters: ClientRegistrationFilterValues = {
  searchInput: "",
  eventId: "",
  attendeeTypeId: "",
  status: "",
  source: "",
  attendance: "",
  eventCountry: "",
  from: "",
  to: "",
};

const granularityOptions = [
  { label: "يومي", value: "DAY" },
  { label: "أسبوعي", value: "WEEK" },
  { label: "شهري", value: "MONTH" },
];

const topLimitOptions = [
  { label: "أعلى 5 فعاليات", value: "5" },
  { label: "أعلى 10 فعاليات", value: "10" },
  { label: "أعلى 15 فعالية", value: "15" },
  { label: "أعلى 25 فعالية", value: "25" },
];

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  tone?: "gold" | "green" | "red" | "blue" | "purple" | "black";
};

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  gold: "bg-[#A88042]/10 text-[#A88042]",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  purple: "bg-violet-50 text-violet-700",
  black: "bg-black/8 text-black",
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "gold",
}: MetricCardProps) {
  return (
    <Card className="p-5">
      <div
        className={cn(
          "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl",
          toneClasses[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-[#4B4B4B]/55">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#252525]">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#4B4B4B]/45">
        {description}
      </p>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-[2rem] bg-black/[0.06]"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-[2rem] bg-black/[0.06]"
          />
        ))}
      </div>
    </div>
  );
}

function formatRate(value: number | null): string {
  return value === null ? "—" : `${formatClientNumber(value)}%`;
}

export function ClientAnalyticsPageContent() {
  const [filters, setFilters] =
    useState<ClientRegistrationFilterValues>(initialFilters);
  const [search, setSearch] = useState("");
  const [granularity, setGranularity] =
    useState<ClientAnalyticsGranularity>("DAY");
  const [topLimit, setTopLimit] = useState(10);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(filters.searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [filters.searchInput]);

  const eventsQuery = useClientEvents({
    page: 1,
    limit: 100,
    sortBy: "startsAt",
    sortDirection: "desc",
  });

  const selectedEventQuery = useClientEvent(
    filters.eventId,
    Boolean(filters.eventId),
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      eventId: filters.eventId || undefined,
      attendeeTypeId: filters.attendeeTypeId || undefined,
      status: (filters.status || undefined) as
        | ClientRegistrationStatus
        | undefined,
      source: (filters.source || undefined) as
        | ClientRegistrationSource
        | undefined,
      attendance: (filters.attendance || undefined) as
        | ClientAttendanceFilter
        | undefined,
      eventCountry: filters.eventCountry.trim() || undefined,
      from: filters.from
        ? new Date(`${filters.from}T00:00:00.000Z`).toISOString()
        : undefined,
      to: filters.to
        ? new Date(`${filters.to}T23:59:59.999Z`).toISOString()
        : undefined,
      granularity,
      topLimit,
    }),
    [filters, granularity, search, topLimit],
  );

  const analyticsQuery = useClientAnalytics(params);

  const activeFiltersCount = [
    search,
    filters.eventId,
    filters.attendeeTypeId,
    filters.status,
    filters.source,
    filters.attendance,
    filters.eventCountry,
    filters.from,
    filters.to,
  ].filter(Boolean).length;

  function updateFilter<K extends keyof ClientRegistrationFilterValues>(
    key: K,
    value: ClientRegistrationFilterValues[K],
  ) {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "eventId") next.attendeeTypeId = "";
      return next;
    });
  }

  function resetFilters() {
    setFilters(initialFilters);
    setSearch("");
    setGranularity("DAY");
    setTopLimit(10);
  }

  const statusChartData =
    analyticsQuery.data?.registrationsByStatus.map((item) => ({
      name: clientRegistrationStatusLabels[item.status],
      count: item.count,
    })) ?? [];

  const sourceChartData =
    analyticsQuery.data?.registrationsBySource.map((item) => ({
      name: clientRegistrationSourceLabels[item.source],
      count: item.count,
    })) ?? [];

  const timeChartData =
    analyticsQuery.data?.registrationsOverTime.map((item) => ({
      date: formatClientDateOnly(item.date),
      count: item.count,
    })) ?? [];

  const topEventsChartData =
    analyticsQuery.data?.topEvents.map((item) => ({
      name:
        (item.event.titleAr || item.event.titleEn || "فعالية").length > 24
          ? `${(item.event.titleAr || item.event.titleEn || "فعالية").slice(0, 24)}…`
          : item.event.titleAr || item.event.titleEn || "فعالية",
      registrations: item.registrations,
      attended: item.attended,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="بوابة العميل"
        title="التحليلات"
        description="حلّل التسجيلات والحضور حسب الفترة والفعالية والمصدر والحالة، مع مقارنة أفضل الفعاليات."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => analyticsQuery.refetch()}
            isLoading={analyticsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <ClientRegistrationFilters
        values={filters}
        events={eventsQuery.data?.items ?? []}
        attendeeTypes={selectedEventQuery.data?.attendeeTypes ?? []}
        eventsLoading={eventsQuery.isLoading}
        attendeeTypesLoading={selectedEventQuery.isLoading}
        activeFiltersCount={activeFiltersCount}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Select
            label="دقة الرسم الزمني"
            value={granularity}
            options={granularityOptions}
            onChange={(value) =>
              setGranularity(value as ClientAnalyticsGranularity)
            }
          />
          <Select
            label="عدد أفضل الفعاليات"
            value={String(topLimit)}
            options={topLimitOptions}
            onChange={(value) => setTopLimit(Number(value))}
          />
        </CardContent>
      </Card>

      {analyticsQuery.isLoading ? <AnalyticsSkeleton /> : null}

      {analyticsQuery.isError ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <BarChart3 className="mb-4 h-14 w-14 text-red-400" />
            <h2 className="text-xl font-extrabold text-[#252525]">
              تعذر تحميل التحليلات
            </h2>
            <p className="mt-2 max-w-xl text-sm font-bold leading-7 text-[#4B4B4B]/55">
              {getClientPortalErrorMessage(
                analyticsQuery.error,
                "حدث خطأ أثناء تحميل التحليلات",
              )}
            </p>
            <Button className="mt-5" onClick={() => analyticsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {analyticsQuery.data ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              من {formatClientDateOnly(analyticsQuery.data.period.from)} إلى{" "}
              {formatClientDateOnly(analyticsQuery.data.period.to)}
            </Badge>
            <Badge variant="muted">المنطقة الزمنية: UTC</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              title="إجمالي التسجيلات"
              value={formatClientNumber(
                analyticsQuery.data.overview.totalRegistrations,
              )}
              description="التسجيلات المطابقة لجميع الفلاتر"
              icon={Users}
              tone="gold"
            />
            <MetricCard
              title="التسجيلات الفعالة"
              value={formatClientNumber(
                analyticsQuery.data.overview.activeRegistrations,
              )}
              description="المسجلون بحالة فعالة"
              icon={CheckCircle2}
              tone="green"
            />
            <MetricCard
              title="الحضور الفريد"
              value={formatClientNumber(
                analyticsQuery.data.overview.uniqueCheckedIn,
              )}
              description="مسجلون لديهم دخول معتمد"
              icon={UserCheck}
              tone="blue"
            />
            <MetricCard
              title="الموجودون حاليًا"
              value={formatClientNumber(
                analyticsQuery.data.overview.currentInsideApprox,
              )}
              description="تقدير الدخول ناقص الخروج"
              icon={Activity}
              tone="purple"
            />
            <MetricCard
              title="نسبة الحضور"
              value={formatRate(analyticsQuery.data.overview.attendanceRate)}
              description="الحضور من التسجيلات الفعالة"
              icon={TrendingUp}
              tone="black"
            />
            <MetricCard
              title="نسبة الإلغاء"
              value={formatRate(analyticsQuery.data.overview.cancellationRate)}
              description="التسجيلات الملغاة من الإجمالي"
              icon={UserMinus}
              tone="red"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>التسجيلات عبر الزمن</CardTitle>
                <CardDescription>
                  تطور عدد التسجيلات خلال الفترة المحددة.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="التسجيلات"
                      stroke="#A88042"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التسجيلات حسب الحالة</CardTitle>
                <CardDescription>
                  توزيع التسجيلات على الحالات الحالية.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="التسجيلات" fill="#252525" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التسجيلات حسب المصدر</CardTitle>
                <CardDescription>
                  القنوات التي جاءت منها التسجيلات المطابقة.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="التسجيلات" fill="#A88042" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أفضل الفعاليات</CardTitle>
                <CardDescription>
                  مقارنة التسجيلات والحضور في أعلى الفعاليات.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {topEventsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topEventsChartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={65} tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="registrations" name="التسجيلات" fill="#252525" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="attended" name="الحضور" fill="#A88042" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <CalendarDays className="h-12 w-12 text-[#A88042]/40" />
                    <p className="mt-3 text-sm font-extrabold text-[#4B4B4B]/50">
                      لا توجد فعاليات تحتوي تسجيلات ضمن الفترة.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>مؤشرات إضافية</CardTitle>
              <CardDescription>
                مؤشرات تساعد على قراءة أداء الفعاليات خلال الفترة.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-5">
                <p className="text-xs font-extrabold text-[#4B4B4B]/45">
                  الفعاليات التي لديها تسجيلات
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#252525]">
                  {formatClientNumber(
                    analyticsQuery.data.overview.eventsWithRegistrations,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-5">
                <p className="text-xs font-extrabold text-[#4B4B4B]/45">
                  متوسط التسجيلات لكل فعالية
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#252525]">
                  {analyticsQuery.data.overview.averageRegistrationsPerEvent ===
                  null
                    ? "—"
                    : formatClientNumber(
                        analyticsQuery.data.overview
                          .averageRegistrationsPerEvent,
                      )}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-5">
                <p className="text-xs font-extrabold text-[#4B4B4B]/45">
                  إجمالي المغادرين الفريدين
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#252525]">
                  {formatClientNumber(
                    analyticsQuery.data.overview.uniqueExited,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
