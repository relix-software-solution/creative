"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Loader2,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  ScanLine,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminDashboardSummary } from "@/features/admin-dashboard/admin-dashboard.queries";
import {
  AdminDashboardEventSummary,
  AdminDashboardRecentMovement,
} from "@/features/admin-dashboard/admin-dashboard.types";

const numberFormatter = new Intl.NumberFormat("ar-SY");

function formatNumber(value: number | undefined | null) {
  return numberFormatter.format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-SY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-SY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("ar-SY", {
    weekday: "short",
    day: "2-digit",
  }).format(date);
}

function formatHourLabel(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ar-SY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "ACTIVE" || status === "DELIVERED" || status === "SENT") {
    return "success";
  }

  if (status === "SCHEDULED" || status === "PENDING") return "gold";
  if (status === "CANCELLED" || status === "BLOCKED" || status === "FAILED") {
    return "danger";
  }

  if (status === "DRAFT") return "warning";

  return "muted";
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "فعال",
    SCHEDULED: "مجدول",
    DRAFT: "مسودة",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغى",
    ARCHIVED: "مؤرشف",
    PENDING: "معلق",
    BLOCKED: "محظور",
  };

  return labels[status] ?? status;
}

function formatMovementType(type: string) {
  const labels: Record<string, string> = {
    ENTRY: "دخول",
    EXIT: "خروج",
    CHECKPOINT: "نقطة مرور",
    BOOTH_VISIT: "زيارة جناح",
    SESSION_ATTENDANCE: "حضور جلسة",
    VIP_ACCESS: "وصول VIP",
  };

  return labels[type] ?? type;
}

function formatMovementResult(result: string) {
  const labels: Record<string, string> = {
    ALLOWED: "مسموح",
    DENIED: "مرفوض",
    WARNING: "تحذير",
  };

  return labels[result] ?? result;
}

function getMovementVariant(
  result: string,
): "success" | "warning" | "danger" | "muted" {
  if (result === "ALLOWED") return "success";
  if (result === "DENIED") return "danger";
  if (result === "WARNING") return "warning";
  return "muted";
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-black/10 bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#A88042]" />
        <p className="mt-4 text-sm font-extrabold text-[#4B4B4B]/60">
          جاري تحميل بيانات التشغيل الحقيقية...
        </p>
      </div>
    </div>
  );
}

function EventList({
  title,
  description,
  events,
  emptyText,
}: {
  title: string;
  description: string;
  events: AdminDashboardEventSummary[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#F8F8FF] p-8 text-center text-sm font-bold text-[#4B4B4B]/55">
              {emptyText}
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4 transition hover:border-[#A88042]/40 hover:bg-[#A88042]/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[#4B4B4B]">
                      {event.titleAr || event.titleEn || event.id}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/50">
                      {event.client.name}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(event.status)}>
                    {formatStatus(event.status)}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="text-[10px] font-bold text-[#4B4B4B]/45">
                      التسجيلات
                    </p>
                    <p className="mt-1 font-extrabold text-[#4B4B4B]">
                      {formatNumber(event.registrations)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="text-[10px] font-bold text-[#4B4B4B]/45">
                      النقاط
                    </p>
                    <p className="mt-1 font-extrabold text-[#4B4B4B]">
                      {formatNumber(event.checkpoints)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-3">
                    <p className="text-[10px] font-bold text-[#4B4B4B]/45">
                      الجلسات
                    </p>
                    <p className="mt-1 font-extrabold text-[#4B4B4B]">
                      {formatNumber(event.staffSessions)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-bold text-[#4B4B4B]/50">
                  {formatDate(event.startsAt)} — {formatDate(event.endsAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentMovementRow({ movement }: { movement: AdminDashboardRecentMovement }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-extrabold text-[#4B4B4B]">
            {movement.registration.fullName}
          </p>
          <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/50">
            {movement.event.titleAr || movement.event.titleEn || "—"}
          </p>
        </div>

        <Badge variant={getMovementVariant(movement.result)}>
          {formatMovementResult(movement.result)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#4B4B4B]/55">
        <span>{formatMovementType(movement.type)}</span>
        <span>{movement.checkpoint?.nameAr || movement.checkpoint?.code || "—"}</span>
        <span>{formatDateTime(movement.occurredAt)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const dashboardQuery = useAdminDashboardSummary();
  const dashboard = dashboardQuery.data;

  if (dashboardQuery.isLoading && !dashboard) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader
          eyebrow="Creative Group For Event Services"
          title="لوحة التحكم التشغيلية"
          description="تحميل مؤشرات التشغيل المباشرة من النظام..."
        />
        <DashboardLoading />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader
          eyebrow="Creative Group For Event Services"
          title="لوحة التحكم التشغيلية"
          description="تعذر تحميل بيانات لوحة التحكم من الخادم."
        />

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
            <p className="mt-4 text-lg font-extrabold text-red-700">
              تعذر تحميل بيانات الداشبورد
            </p>
            <p className="mt-2 text-sm font-bold text-red-600/70">
              تأكد أن مسار /admin/dashboard/summary متاح ثم أعد المحاولة.
            </p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => dashboardQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, live, alerts } = dashboard;
  const topEventMax = Math.max(
    ...dashboard.topEvents.map((event) => event.registrations),
    1,
  );
  const alertsTotal =
    alerts.failedNotificationsLast24Hours +
    alerts.suspendedDevices +
    alerts.failedImports;

  const stats = [
    {
      title: "الفعاليات",
      value: kpis.totalEvents,
      detail: `${formatNumber(kpis.activeEvents)} فعالة · ${formatNumber(kpis.upcomingEvents)} قادمة`,
      icon: CalendarDays,
    },
    {
      title: "إجمالي التسجيلات",
      value: kpis.totalRegistrations,
      detail: `${formatNumber(kpis.registrationsLast24Hours)} خلال آخر 24 ساعة`,
      icon: Users,
    },
    {
      title: "داخل الفعاليات الآن",
      value: kpis.currentlyInside,
      detail: `${formatNumber(live.uniqueCheckedIn)} قاموا بالدخول ضمن الفعاليات الفعالة`,
      icon: UserCheck,
    },
    {
      title: "عمليات المسح",
      value: kpis.totalScans,
      detail: `${formatNumber(kpis.scansLastHour)} خلال آخر ساعة`,
      icon: ScanLine,
    },
    {
      title: "الأجهزة المتصلة",
      value: kpis.onlineDevices,
      detail: `${formatNumber(kpis.activeDevices)} جهازًا مفعّلًا`,
      icon: MonitorSmartphone,
    },
    {
      title: "جلسات الموظفين",
      value: kpis.activeStaffSessions,
      detail: `${formatNumber(live.activeCheckpoints)} نقطة ضمن الفعاليات الفعالة`,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Creative Group For Event Services"
        title="لوحة التحكم التشغيلية"
        description="مؤشرات حقيقية ومباشرة من الفعاليات والتسجيلات وحركة الدخول والأجهزة والإشعارات."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => dashboardQuery.refetch()}
              disabled={dashboardQuery.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${dashboardQuery.isFetching ? "animate-spin" : ""}`}
              />
              تحديث
            </Button>
            <Button onClick={() => router.push("/events")}>
              <Plus className="h-4 w-4" />
              إضافة فعالية
            </Button>
          </>
        }
      />

      <section className="relative max-w-full overflow-hidden rounded-[2.5rem] bg-black p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,128,66,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.09),transparent_28%),linear-gradient(135deg,rgba(168,128,66,0.08),transparent_55%)]" />

        <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border border-[#A88042]/30 bg-[#A88042]/15 text-[#D6B06E] ring-0">
                Live Operations
              </Badge>
              <Badge className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 ring-0">
                {formatNumber(live.activeEventCount)} فعالية مباشرة
              </Badge>
            </div>

            <h1 className="max-w-4xl break-words text-3xl font-extrabold leading-tight text-white lg:text-5xl">
              التشغيل الفعلي للمنصة في مكان واحد.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/65 lg:text-base">
              البيانات المعروضة مرتبطة مباشرة بقاعدة البيانات ويتم تحديثها تلقائيًا كل 30 ثانية.
            </p>

            <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">داخل الآن</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {formatNumber(live.currentlyInside)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">آخر ساعة</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {formatNumber(live.movementsLastHour)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">نقاط فعالة</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {formatNumber(live.activeCheckpoints)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">نسبة الحضور</p>
                <p className="mt-2 text-2xl font-extrabold">
                  {live.attendanceRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/55">الإشغال الحالي</p>
                <h3 className="mt-1 text-2xl font-extrabold text-white">
                  {live.occupancyRate}%
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042] text-white shadow-lg shadow-[#A88042]/25">
                <Activity className="h-6 w-6" />
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#A88042] transition-all"
                style={{ width: `${Math.min(live.occupancyRate, 100)}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">تسجيلات الفعاليات المباشرة</p>
                <p className="mt-2 text-xl font-extrabold">
                  {formatNumber(live.activeEventRegistrations)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">آخر تحديث</p>
                <p className="mt-2 text-sm font-extrabold">
                  {formatDateTime(dashboard.generatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-[#A88042]/40 hover:shadow-[0_26px_80px_rgba(168,128,66,0.16)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042] transition group-hover:bg-[#A88042] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="text-sm font-bold text-[#4B4B4B]/60">
                {stat.title}
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">
                {formatNumber(stat.value)}
              </h3>
              <p className="mt-2 text-xs font-bold leading-5 text-[#4B4B4B]/45">
                {stat.detail}
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>التسجيلات خلال 7 أيام</CardTitle>
                <CardDescription>
                  عدد التسجيلات الجديدة يوميًا من قاعدة البيانات.
                </CardDescription>
              </div>
              <Badge variant="gold">Live data</Badge>
            </div>

            <div className="h-80" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.registrationTrend}>
                  <defs>
                    <linearGradient id="registrationFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A88042" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#A88042" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,75,75,0.10)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDayLabel}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(value) => formatNumber(Number(value))}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatDayLabel(String(value))}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="التسجيلات"
                    stroke="#A88042"
                    strokeWidth={3}
                    fill="url(#registrationFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6">
              <CardTitle>تنبيهات التشغيل</CardTitle>
              <CardDescription>
                الحالات التي تحتاج انتباهًا من فريق الإدارة.
              </CardDescription>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-extrabold text-red-700">
                      إشعارات فاشلة آخر 24 ساعة
                    </p>
                    <p className="mt-1 text-xs font-bold text-red-600/60">
                      إجمالي الفاشل: {formatNumber(alerts.failedNotifications)}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-red-700">
                  {formatNumber(alerts.failedNotificationsLast24Hours)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone className="h-5 w-5 text-amber-700" />
                  <p className="text-sm font-extrabold text-amber-800">
                    أجهزة موقوفة
                  </p>
                </div>
                <span className="text-2xl font-extrabold text-amber-800">
                  {formatNumber(alerts.suspendedDevices)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-[#A88042]" />
                  <div>
                    <p className="text-sm font-extrabold text-[#4B4B4B]">
                      عمليات استيراد
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#4B4B4B]/50">
                      {formatNumber(alerts.pendingImports)} قيد المعالجة
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-extrabold text-[#4B4B4B]">
                  {formatNumber(alerts.failedImports)}
                </span>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                <Badge variant={alertsTotal > 0 ? "warning" : "success"}>
                  {alertsTotal > 0
                    ? `${formatNumber(alertsTotal)} حالة تحتاج مراجعة`
                    : "لا توجد تنبيهات حرجة حاليًا"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <CardTitle>حركة الدخول والخروج</CardTitle>
                <CardDescription>
                  آخر 12 ساعة مع فصل الدخول والخروج والحركات المرفوضة.
                </CardDescription>
              </div>
              <Badge variant="black">12h</Badge>
            </div>

            <div className="h-80" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.movementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,75,75,0.10)" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHourLabel}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatDateTime(String(value))}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="entries" name="دخول" fill="#A88042" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="exits" name="خروج" fill="#111111" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="denied" name="مرفوض" fill="#DC2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <CardTitle>أعلى الفعاليات تسجيلًا</CardTitle>
                <CardDescription>ترتيب فعلي بحسب إجمالي التسجيلات.</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-[#A88042]" />
            </div>

            <div className="space-y-4">
              {dashboard.topEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm font-bold text-[#4B4B4B]/50">
                  لا توجد بيانات كافية بعد.
                </div>
              ) : (
                dashboard.topEvents.map((event, index) => (
                  <div key={event.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#4B4B4B]">
                          {index + 1}. {event.titleAr || event.titleEn || event.id}
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                          {event.client.name} · {formatNumber(event.movements)} حركة
                        </p>
                      </div>
                      <span className="shrink-0 text-lg font-extrabold text-[#A88042]">
                        {formatNumber(event.registrations)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-[#A88042]"
                        style={{
                          width: `${Math.max((event.registrations / topEventMax) * 100, 3)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <EventList
          title="الفعاليات الفعالة"
          description="الفعاليات الموجودة حاليًا بحالة ACTIVE."
          events={dashboard.events.active}
          emptyText="لا توجد فعاليات فعالة حاليًا."
        />
        <EventList
          title="الفعاليات القادمة"
          description="الفعاليات المجدولة القادمة حسب تاريخ البداية."
          events={dashboard.events.upcoming}
          emptyText="لا توجد فعاليات مجدولة حاليًا."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardContent>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>آخر التسجيلات</CardTitle>
                <CardDescription>
                  أحدث التسجيلات الحقيقية في جميع الفعاليات.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/registrations")}>
                عرض كل التسجيلات
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>نوع الحضور</TableHead>
                  <TableHead>الفعالية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>وقت التسجيل</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard.recentRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[#4B4B4B]/50">
                      لا توجد تسجيلات حتى الآن.
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard.recentRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.fullName}</TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {registration.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="gold">
                          {registration.attendeeType.nameAr ||
                            registration.attendeeType.nameEn ||
                            registration.attendeeType.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.event.titleAr || registration.event.titleEn || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(registration.status)}>
                          {formatStatus(registration.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(registration.registeredAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <CardTitle>آخر الحركات</CardTitle>
                <CardDescription>آخر نشاطات الدخول والخروج والمسح.</CardDescription>
              </div>
              <DoorOpen className="h-5 w-5 text-[#A88042]" />
            </div>

            <div className="space-y-3">
              {dashboard.recentMovements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm font-bold text-[#4B4B4B]/50">
                  لا توجد حركات مسجلة بعد.
                </div>
              ) : (
                dashboard.recentMovements.map((movement) => (
                  <RecentMovementRow key={movement.id} movement={movement} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-[#4B4B4B]">
                التحديث التلقائي مفعل
              </p>
              <p className="mt-1 text-sm font-bold text-[#4B4B4B]/55">
                يتم تحديث المؤشرات كل {dashboard.refreshRecommendedAfterSeconds} ثانية، وآخر استجابة وصلت في {formatDateTime(dashboard.generatedAt)}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/reports")}>
              <BarChart3 className="h-4 w-4" />
              التقارير التفصيلية
            </Button>
            <Button variant="outline" onClick={() => router.push("/events")}>
              <CalendarClock className="h-4 w-4" />
              إدارة الفعاليات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
