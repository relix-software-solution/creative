"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Download,
  Loader2,
  MapPinned,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminSettings } from "@/features/admin-settings/admin-settings.queries";
import { useEvents } from "@/features/events/events.queries";
import { downloadEventReportExcel } from "@/features/reports/reports.api";
import {
  useCheckpointsReport,
  useEventOverview,
  useMovementsByHour,
  useMovementsByType,
  useRegistrationsByType,
  useStaffPerformanceReport,
} from "@/features/reports/reports.queries";
import type {
  ReportBreakdownItem,
  ReportCheckpointItem,
  ReportStaffPerformanceItem,
} from "@/features/reports/reports.types";

const numberFormatter = new Intl.NumberFormat("ar-SY");

function formatNumber(value?: number | null) {
  return numberFormatter.format(value ?? 0);
}

function formatPercent(value?: number | null) {
  return `${new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 1 }).format(value ?? 0)}%`;
}

function toDateTimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-SY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function movementLabel(type?: string, result?: string) {
  const typeLabel = type === "ENTRY" ? "دخول" : type === "EXIT" ? "خروج" : type || "—";
  const resultLabel =
    result === "ALLOWED"
      ? "مسموح"
      : result === "DENIED"
        ? "مرفوض"
        : result === "WARNING"
          ? "تحذير"
          : result || "";
  return `${typeLabel}${resultLabel ? ` · ${resultLabel}` : ""}`;
}

function registrationTypeLabel(item: ReportBreakdownItem) {
  return (
    item.attendeeTypeNameAr ||
    item.attendeeTypeNameEn ||
    item.attendeeTypeCode ||
    "نوع حضور"
  );
}

function statusVariant(status?: string): "success" | "gold" | "muted" | "danger" {
  if (status === "ACTIVE" || status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "gold";
  if (status === "ARCHIVED") return "muted";
  return "muted";
}

export default function ReportsPage() {
  const [eventId, setEventId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const settingsQuery = useAdminSettings();
  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const events = useMemo(() => eventsQuery.data?.items ?? [], [eventsQuery.data?.items]);
  const selectedEvent = events.find((event) => event.id === eventId);

  useEffect(() => {
    if (eventId || events.length === 0) return;

    const timeout = window.setTimeout(() => setEventId(events[0].id), 0);
    return () => window.clearTimeout(timeout);
  }, [eventId, events]);

  useEffect(() => {
    if (!selectedEvent) return;

    const timeout = window.setTimeout(() => {
      const start = new Date(selectedEvent.startsAt);
      const end = new Date(selectedEvent.endsAt);
      const defaultRangeDays = settingsQuery.data?.reportDefaultRangeDays ?? 30;
      const cappedEnd = new Date(
        Math.min(end.getTime(), start.getTime() + defaultRangeDays * 24 * 60 * 60 * 1000),
      );

      setFrom(toDateTimeLocal(start));
      setTo(toDateTimeLocal(cappedEnd));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [selectedEvent, settingsQuery.data?.reportDefaultRangeDays]);

  const dateParams = useMemo(
    () => ({ from: toIso(from), to: toIso(to) }),
    [from, to],
  );

  const overviewQuery = useEventOverview(eventId);
  const registrationsByTypeQuery = useRegistrationsByType(eventId);
  const movementsByTypeQuery = useMovementsByType(eventId);
  const movementsByHourQuery = useMovementsByHour(eventId, dateParams);
  const checkpointsQuery = useCheckpointsReport(eventId);
  const staffPerformanceQuery = useStaffPerformanceReport(eventId);

  const overview = overviewQuery.data;
  const registrationsByType = registrationsByTypeQuery.data ?? [];
  const movementsByType = movementsByTypeQuery.data ?? [];
  const movementsByHour = movementsByHourQuery.data ?? [];
  const checkpoints = checkpointsQuery.data ?? [];
  const staffPerformance = staffPerformanceQuery.data ?? [];

  const isLoading =
    eventsQuery.isLoading ||
    overviewQuery.isLoading ||
    registrationsByTypeQuery.isLoading ||
    movementsByTypeQuery.isLoading ||
    movementsByHourQuery.isLoading ||
    checkpointsQuery.isLoading ||
    staffPerformanceQuery.isLoading;

  const isFetching =
    overviewQuery.isFetching ||
    registrationsByTypeQuery.isFetching ||
    movementsByTypeQuery.isFetching ||
    movementsByHourQuery.isFetching ||
    checkpointsQuery.isFetching ||
    staffPerformanceQuery.isFetching;

  const isError =
    overviewQuery.isError ||
    registrationsByTypeQuery.isError ||
    movementsByTypeQuery.isError ||
    movementsByHourQuery.isError ||
    checkpointsQuery.isError ||
    staffPerformanceQuery.isError;

  const currentInside =
    overview?.attendance.currentInside ?? overview?.attendance.currentInsideApprox ?? 0;

  const filteredCheckpoints = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return checkpoints;
    return checkpoints.filter((item) =>
      `${item.checkpointNameAr} ${item.checkpointNameEn ?? ""} ${item.checkpointCode ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [checkpoints, search]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staffPerformance;
    return staffPerformance.filter((item) => item.fullName.toLowerCase().includes(term));
  }, [staffPerformance, search]);

  const registrationChart = registrationsByType.map((item) => ({
    name: registrationTypeLabel(item),
    total: item.total ?? 0,
    active: item.active ?? 0,
  }));

  const movementChart = movementsByHour.map((item) => ({
    ...item,
    label: formatHour(item.hour),
  }));

  function refetchReports() {
    overviewQuery.refetch();
    registrationsByTypeQuery.refetch();
    movementsByTypeQuery.refetch();
    movementsByHourQuery.refetch();
    checkpointsQuery.refetch();
    staffPerformanceQuery.refetch();
  }

  async function exportExcel() {
    if (!eventId || isExporting) return;

    try {
      setIsExporting(true);
      const result = await downloadEventReportExcel(eventId, dateParams);
      const url = window.URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("تم تجهيز تقرير Excel حسب الفلترة الحالية");
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      toast.error(
        Array.isArray(message)
          ? message[0] ?? "تعذر تصدير التقرير"
          : typeof message === "string"
            ? message
            : "تعذر تصدير التقرير",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Reports"
        title="التقارير التشغيلية"
        description="قراءة حقيقية للتسجيل والحضور والحركة وأداء نقاط الدخول والموظفين لكل فعالية."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportExcel} disabled={!eventId} isLoading={isExporting}>
              <Download className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button variant="outline" onClick={() => window.print()} disabled={!eventId}>
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button variant="outline" onClick={refetchReports} disabled={!eventId || isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        }
      />

      <Card className="border-black/5 shadow-sm print:hidden">
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_minmax(0,.8fr)_auto] xl:items-end">
            <Select
              label="الفعالية"
              value={eventId}
              placeholder="اختر الفعالية"
              onChange={setEventId}
              options={events.map((event) => ({
                label: event.titleAr || event.titleEn || event.id,
                value: event.id,
              }))}
            />
            <Input
              label="من"
              type="datetime-local"
              value={from}
              icon={<CalendarDays className="h-4 w-4" />}
              onChange={(event) => setFrom(event.target.value)}
            />
            <Input
              label="إلى"
              type="datetime-local"
              value={to}
              icon={<Clock3 className="h-4 w-4" />}
              onChange={(event) => setTo(event.target.value)}
            />
            <Button variant="outline" onClick={refetchReports} disabled={!eventId || isFetching}>
              <BarChart3 className="h-4 w-4" />
              تطبيق
            </Button>
          </div>
          <p className="mt-3 text-xs font-bold leading-6 text-[#4B4B4B]/55">
            تصدير Excel يستخدم الفعالية والفترة المحددتين ويولد Sheets مستقلة للملخص، التسجيلات، الحركات، نقاط الدخول وأداء الموظفين.
          </p>
        </CardContent>
      </Card>

      {!eventId ? (
        <CenteredState icon={<BarChart3 className="h-10 w-10" />} text="اختر فعالية لعرض التقرير." />
      ) : isLoading ? (
        <CenteredState icon={<Loader2 className="h-9 w-9 animate-spin" />} text="جاري بناء التقرير..." />
      ) : isError || !overview ? (
        <CenteredState
          danger
          icon={<AlertTriangle className="h-9 w-9" />}
          text="تعذر تحميل بيانات التقرير."
          action={<Button variant="danger" onClick={refetchReports}>إعادة المحاولة</Button>}
        />
      ) : (
        <>
          <Card className="overflow-hidden border-black/5 bg-gradient-to-l from-[#111] to-[#2a2115] text-white shadow-sm">
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(overview.event.status ?? undefined)}>
                    {overview.event.status ?? "—"}
                  </Badge>
                  <Badge variant="black">تقرير مباشر</Badge>
                </div>
                <h2 className="text-2xl font-extrabold">{overview.event.titleAr}</h2>
                <p className="mt-2 text-sm text-white/60">
                  {formatDateTime(overview.event.startsAt)} — {formatDateTime(overview.event.endsAt)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4">
                <p className="text-xs font-bold text-white/50">نسبة الحضور</p>
                <p className="mt-1 text-3xl font-extrabold text-[#D6B06A]">
                  {formatPercent(overview.attendance.attendanceRate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="إجمالي التسجيلات" value={overview.registrations.total} icon={<UsersRound />} />
            <MetricCard label="دخلوا مرة على الأقل" value={overview.attendance.uniqueCheckedIn} icon={<CheckCircle2 />} />
            <MetricCard label="داخل الفعالية الآن" value={currentInside} icon={<DoorOpen />} emphasized />
            <MetricCard label="إجمالي الحركات" value={overview.movements.total} icon={<Activity />} />
            <MetricCard label="QR فعّال" value={overview.qr.active} icon={<QrCode />} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="border-black/5 shadow-sm">
              <CardContent>
                <CardTitle>الحركة حسب الساعة</CardTitle>
                <CardDescription>المسموح والمرفوض ضمن النطاق الزمني المحدد.</CardDescription>
                <div className="mt-6 h-[320px]">
                  {movementChart.length === 0 ? (
                    <EmptyState text="لا توجد حركات ضمن هذا النطاق." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={movementChart} margin={{ top: 8, right: 0, left: 0, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,.07)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={28} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="مسموح" dataKey="allowed" fill="#A88042" radius={[6, 6, 0, 0]} />
                        <Bar name="مرفوض" dataKey="denied" fill="#DC2626" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-black/5 shadow-sm">
              <CardContent>
                <CardTitle>التسجيلات حسب نوع الحضور</CardTitle>
                <CardDescription>إجمالي التسجيلات والتسجيلات الفعالة لكل فئة.</CardDescription>
                <div className="mt-6 h-[320px]">
                  {registrationChart.length === 0 ? (
                    <EmptyState text="لا توجد أنواع حضور مسجلة." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={registrationChart} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,.07)" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar name="الإجمالي" dataKey="total" fill="#111111" radius={[0, 6, 6, 0]} />
                        <Bar name="فعال" dataKey="active" fill="#A88042" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <StatusCard label="تسجيلات فعالة" value={overview.registrations.active} variant="success" />
            <StatusCard label="ملغاة" value={overview.registrations.cancelled} variant="muted" />
            <StatusCard label="محظورة" value={overview.registrations.blocked} variant="danger" />
            <StatusCard label="QR ملغى / منتهي" value={overview.qr.revoked + overview.qr.expired} variant="warning" />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="border-black/5 shadow-sm">
              <CardContent>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>تفصيل الحركات</CardTitle>
                    <CardDescription>دخول وخروج حسب نتيجة التحقق.</CardDescription>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-[#A88042]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {movementsByType.map((item, index) => (
                    <div key={`${item.type}-${item.result}-${index}`} className="rounded-2xl border border-black/5 bg-[#F8F8FF] p-4">
                      <p className="text-sm font-extrabold text-[#4B4B4B]">{movementLabel(item.type, item.result)}</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#A88042]">{formatNumber(item.count)}</p>
                    </div>
                  ))}
                  {movementsByType.length === 0 ? <EmptyState text="لا توجد حركات." /> : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-black/5 shadow-sm">
              <CardContent>
                <CardTitle>ملخص التحقق</CardTitle>
                <CardDescription>مؤشرات قبول ورفض عمليات المسح.</CardDescription>
                <div className="mt-5 space-y-4">
                  <ProgressMetric label="مسموح" value={overview.movements.allowed} total={overview.movements.total} />
                  <ProgressMetric label="مرفوض" value={overview.movements.denied} total={overview.movements.total} danger />
                  <ProgressMetric label="تحذيرات" value={overview.movements.warnings} total={overview.movements.total} warning />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-[#F8F8FF] p-4 text-center">
                      <p className="text-xs font-bold text-[#4B4B4B]/55">عمليات الدخول</p>
                      <p className="mt-1 text-xl font-extrabold">{formatNumber(overview.movements.entries)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F8F8FF] p-4 text-center">
                      <p className="text-xs font-bold text-[#4B4B4B]/55">عمليات الخروج</p>
                      <p className="mt-1 text-xl font-extrabold">{formatNumber(overview.movements.exits)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="flex items-center gap-3 print:hidden">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث في نقاط الدخول أو الموظفين..."
              icon={<Search className="h-4 w-4" />}
              className="max-w-lg"
            />
          </div>

          <section className="grid gap-4 2xl:grid-cols-2">
            <Card className="overflow-hidden border-black/5 shadow-sm">
              <CardContent>
                <CardTitle>أداء نقاط الدخول</CardTitle>
                <CardDescription>الحركة والقبول والرفض في كل نقطة.</CardDescription>
                <div className="mt-5 overflow-x-auto rounded-3xl border border-black/5">
                  <CheckpointTable items={filteredCheckpoints} />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-black/5 shadow-sm">
              <CardContent>
                <CardTitle>أداء الموظفين</CardTitle>
                <CardDescription>الجلسات والحركات وآخر نشاط للـStaff.</CardDescription>
                <div className="mt-5 overflow-x-auto rounded-3xl border border-black/5">
                  <StaffTable items={filteredStaff} />
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <Card className={`border-black/5 p-5 shadow-sm ${emphasized ? "bg-[#111] text-white" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-bold ${emphasized ? "text-white/55" : "text-[#4B4B4B]/55"}`}>{label}</p>
          <p className={`mt-2 text-3xl font-extrabold ${emphasized ? "text-[#D6B06A]" : "text-[#4B4B4B]"}`}>{formatNumber(value)}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${emphasized ? "bg-white/10 text-[#D6B06A]" : "bg-[#A88042]/10 text-[#A88042]"}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatusCard({ label, value, variant }: { label: string; value: number; variant: "success" | "warning" | "danger" | "muted" }) {
  return (
    <Card className="border-black/5 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold text-[#4B4B4B]">{label}</span>
        <Badge variant={variant}>{formatNumber(value)}</Badge>
      </div>
    </Card>
  );
}

function ProgressMetric({ label, value, total, danger, warning }: { label: string; value: number; total: number; danger?: boolean; warning?: boolean }) {
  const percent = total === 0 ? 0 : Math.min((value / total) * 100, 100);
  const barClass = danger ? "bg-red-500" : warning ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{formatNumber(value)} · {formatPercent(percent)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CheckpointTable({ items }: { items: ReportCheckpointItem[] }) {
  if (items.length === 0) return <EmptyState text="لا توجد نقاط دخول مطابقة." />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#F8F8FF]">
          <TableHead>النقطة</TableHead>
          <TableHead className="text-center">الحركات</TableHead>
          <TableHead className="text-center">دخول</TableHead>
          <TableHead className="text-center">خروج</TableHead>
          <TableHead className="text-center">مرفوض</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.checkpointId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-[#A88042]" />
                <div>
                  <p className="font-extrabold">{item.checkpointNameAr || item.checkpointNameEn}</p>
                  <p className="text-xs text-[#4B4B4B]/45">{item.checkpointCode || "—"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-bold">{formatNumber(item.totalMovements)}</TableCell>
            <TableCell className="text-center">{formatNumber(item.entries)}</TableCell>
            <TableCell className="text-center">{formatNumber(item.exits)}</TableCell>
            <TableCell className="text-center"><Badge variant={item.denied > 0 ? "danger" : "success"}>{formatNumber(item.denied)}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StaffTable({ items }: { items: ReportStaffPerformanceItem[] }) {
  if (items.length === 0) return <EmptyState text="لا توجد بيانات موظفين مطابقة." />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#F8F8FF]">
          <TableHead>الموظف</TableHead>
          <TableHead className="text-center">الحركات</TableHead>
          <TableHead className="text-center">مسموح</TableHead>
          <TableHead className="text-center">مرفوض</TableHead>
          <TableHead>آخر نشاط</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.staffUserId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#A88042]" />
                <div>
                  <p className="font-extrabold">{item.fullName}</p>
                  {item.activeSessionsCount > 0 ? <Badge variant="success">جلسة فعالة</Badge> : null}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-bold">{formatNumber(item.totalMovements)}</TableCell>
            <TableCell className="text-center">{formatNumber(item.allowed)}</TableCell>
            <TableCell className="text-center">{formatNumber(item.denied)}</TableCell>
            <TableCell className="text-xs font-bold text-[#4B4B4B]/65">{formatDateTime(item.lastSeenAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-28 items-center justify-center rounded-2xl bg-[#F8F8FF] p-5 text-sm font-bold text-[#4B4B4B]/55">{text}</div>;
}

function CenteredState({ icon, text, danger, action }: { icon: ReactNode; text: string; danger?: boolean; action?: ReactNode }) {
  return (
    <div className={`flex min-h-[340px] items-center justify-center rounded-[2rem] border ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-black/10 bg-[#F8F8FF] text-[#A88042]"}`}>
      <div className="text-center">
        <div className="mx-auto flex justify-center">{icon}</div>
        <p className={`mt-3 text-base font-extrabold ${danger ? "text-red-700" : "text-[#4B4B4B]"}`}>{text}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
