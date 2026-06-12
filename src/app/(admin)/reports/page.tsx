"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  MapPinned,
  RefreshCw,
  Search,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useEvents } from "@/features/events/events.queries";
import {
  useCheckpointsReport,
  useEventOverview,
  useMovementsByHour,
  useMovementsByType,
  useRegistrationsByType,
  useStaffPerformanceReport,
} from "@/features/reports/reports.queries";
import {
  ReportBreakdownItem,
  ReportCheckpointItem,
  ReportHourItem,
  ReportOverview,
  ReportStaffPerformanceItem,
} from "@/features/reports/reports.types";

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function defaultFromDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return toDateTimeLocal(date);
}

function defaultToDate() {
  const date = new Date();
  date.setHours(23, 59, 0, 0);

  return toDateTimeLocal(date);
}

function toIso(value: string) {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

function formatNumber(value?: unknown) {
  if (typeof value !== "number") return "0";

  return new Intl.NumberFormat("ar-SY").format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ar-SY", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getItemLabel(item: ReportBreakdownItem) {
  return (
    item.labelAr ||
    item.nameAr ||
    item.label ||
    item.name ||
    item.labelEn ||
    item.nameEn ||
    item.type ||
    item.code ||
    item.id ||
    "—"
  );
}

function getItemCount(item: ReportBreakdownItem | ReportHourItem) {
  return item.count ?? item.total ?? item.value ?? 0;
}

function getCheckpointName(item: ReportCheckpointItem) {
  return (
    item.checkpointName ||
    item.nameAr ||
    item.nameEn ||
    item.code ||
    item.checkpointId ||
    item.id ||
    "—"
  );
}

function getStaffName(item: ReportStaffPerformanceItem) {
  return item.fullName || item.email || item.staffUserId || item.userId || "—";
}

function getOverviewMetric(
  overview: ReportOverview | undefined,
  keys: string[],
) {
  if (!overview) return 0;

  for (const key of keys) {
    const value = overview[key];

    if (typeof value === "number") return value;
  }

  return 0;
}

export default function ReportsPage() {
  const [eventId, setEventId] = useState("");
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);
  const [search, setSearch] = useState("");

  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const events = eventsQuery.data?.items ?? [];

  useEffect(() => {
    if (eventId || events.length === 0) return;

    setEventId(events[0].id);
  }, [eventId, events]);

  const dateParams = useMemo(
    () => ({
      from: toIso(from),
      to: toIso(to),
    }),
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

  const selectedEventName =
    events.find((event) => event.id === eventId)?.titleAr ||
    events.find((event) => event.id === eventId)?.titleEn ||
    "اختر فعالية";

  const filteredCheckpoints = useMemo(() => {
    if (!search.trim()) return checkpoints;

    const term = search.trim().toLowerCase();

    return checkpoints.filter((item) =>
      getCheckpointName(item).toLowerCase().includes(term),
    );
  }, [checkpoints, search]);

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffPerformance;

    const term = search.trim().toLowerCase();

    return staffPerformance.filter((item) =>
      getStaffName(item).toLowerCase().includes(term),
    );
  }, [staffPerformance, search]);

  function refetchReports() {
    overviewQuery.refetch();
    registrationsByTypeQuery.refetch();
    movementsByTypeQuery.refetch();
    movementsByHourQuery.refetch();
    checkpointsQuery.refetch();
    staffPerformanceQuery.refetch();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Reports"
        title="التقارير"
        description="ملخصات التسجيلات والحركة ونقاط المسح وأداء الموظفين حسب الفعالية."
        actions={
          <Button
            variant="outline"
            onClick={refetchReports}
            disabled={!eventId || isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>
        }
      />

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>فلترة التقرير</CardTitle>

              <CardDescription>
                اختر الفعالية ونطاق الوقت لتحليل حركة الدخول والخروج.
              </CardDescription>
            </div>

            <Badge variant={isFetching ? "warning" : "success"}>
              {isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>

          <div className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-center gap-3">
            <Select
              value={eventId}
              placeholder="اختر الفعالية"
              onChange={(value) => setEventId(value)}
              options={events.map((event) => ({
                label: event.titleAr || event.titleEn || event.id,
                value: event.id,
              }))}
            />

            <Input
              type="datetime-local"
              value={from}
              icon={<CalendarDays className="h-4 w-4" />}
              onChange={(event) => setFrom(event.target.value)}
            />

            <Input
              type="datetime-local"
              value={to}
              icon={<Clock3 className="h-4 w-4" />}
              onChange={(event) => setTo(event.target.value)}
            />

            <Button
              className="shrink-0"
              variant="outline"
              onClick={refetchReports}
              disabled={!eventId || isFetching}
            >
              <BarChart3 className="h-4 w-4" />
              عرض
            </Button>
          </div>
        </CardContent>
      </Card>

      {!eventId ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
          <div className="text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-[#A88042]" />

            <p className="mt-3 text-lg font-extrabold text-[#4B4B4B]">
              اختر فعالية لعرض التقارير
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

            <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
              جاري تحميل التقارير...
            </p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
          <div className="text-center">
            <p className="text-lg font-extrabold text-red-700">
              تعذر تحميل التقارير
            </p>

            <p className="mt-2 text-sm font-bold text-red-600/70">
              تحقق من الاتصال بالباك أو صلاحية الجلسة.
            </p>

            <Button className="mt-4" variant="danger" onClick={refetchReports}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
              <p className="text-sm font-bold text-[#4B4B4B]/60">التسجيلات</p>

              <div className="mt-3 flex items-center justify-between">
                <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
                  {formatNumber(
                    getOverviewMetric(overview, [
                      "totalRegistrations",
                      "registrations",
                      "total",
                    ]),
                  )}
                </h3>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <UsersRound className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
              <p className="text-sm font-bold text-[#4B4B4B]/60">الحركات</p>

              <div className="mt-3 flex items-center justify-between">
                <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
                  {formatNumber(
                    getOverviewMetric(overview, [
                      "totalMovements",
                      "movements",
                      "totalScans",
                    ]),
                  )}
                </h3>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
              <p className="text-sm font-bold text-[#4B4B4B]/60">نقاط المسح</p>

              <div className="mt-3 flex items-center justify-between">
                <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
                  {formatNumber(checkpoints.length)}
                </h3>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <MapPinned className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
              <p className="text-sm font-bold text-[#4B4B4B]/60">الفعالية</p>

              <h3 className="mt-3 truncate text-xl font-extrabold text-[#4B4B4B]">
                {selectedEventName}
              </h3>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="overflow-hidden border-black/5 shadow-sm">
              <CardContent>
                <div className="mb-5">
                  <CardTitle>التسجيلات حسب النوع</CardTitle>

                  <CardDescription>
                    توزيع الحضور حسب أنواع التسجيل.
                  </CardDescription>
                </div>

                {registrationsByType.length === 0 ? (
                  <EmptyState text="لا توجد بيانات تسجيلات." />
                ) : (
                  <SimpleBreakdownTable items={registrationsByType} />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-black/5 shadow-sm">
              <CardContent>
                <div className="mb-5">
                  <CardTitle>الحركات حسب النوع</CardTitle>

                  <CardDescription>
                    توزيع عمليات الدخول والخروج حسب النوع.
                  </CardDescription>
                </div>

                {movementsByType.length === 0 ? (
                  <EmptyState text="لا توجد بيانات حركات." />
                ) : (
                  <SimpleBreakdownTable items={movementsByType} />
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-black/5 shadow-sm">
            <CardContent>
              <div className="mb-5">
                <CardTitle>الحركات حسب الساعة</CardTitle>

                <CardDescription>
                  كثافة الحركة ضمن النطاق الزمني المحدد.
                </CardDescription>
              </div>

              {movementsByHour.length === 0 ? (
                <EmptyState text="لا توجد بيانات ضمن هذا النطاق." />
              ) : (
                <div className="overflow-hidden rounded-3xl border border-black/5">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="bg-[#F8F8FF]">
                        <TableHead className="w-[70%]">الوقت</TableHead>
                        <TableHead className="w-[30%] text-center">
                          العدد
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {movementsByHour.map((item, index) => (
                        <TableRow key={`${item.hour || item.date || index}`}>
                          <TableCell>
                            <p className="truncate font-bold">
                              {formatDateTime(
                                item.hour || item.date || item.label,
                              )}
                            </p>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="gold">
                              {formatNumber(getItemCount(item))}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-black/5 shadow-sm">
            <CardContent>
              <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle>تفاصيل نقاط المسح والموظفين</CardTitle>

                  <CardDescription>
                    راقب أداء نقاط الدخول وموظفي التشغيل.
                  </CardDescription>
                </div>

                <Input
                  value={search}
                  placeholder="بحث بالنقطة أو الموظف..."
                  icon={<Search className="h-4 w-4" />}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <MapPinned className="h-5 w-5 text-[#A88042]" />
                    <p className="font-extrabold text-[#4B4B4B]">نقاط المسح</p>
                  </div>

                  {filteredCheckpoints.length === 0 ? (
                    <EmptyState text="لا توجد نقاط مطابقة." />
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-black/5">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow className="bg-[#F8F8FF]">
                            <TableHead className="w-[55%]">النقطة</TableHead>
                            <TableHead className="w-[15%] text-center">
                              Scan
                            </TableHead>
                            <TableHead className="w-[15%] text-center">
                              دخول
                            </TableHead>
                            <TableHead className="w-[15%] text-center">
                              خروج
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {filteredCheckpoints.map((item, index) => (
                            <TableRow
                              key={`${item.id || item.checkpointId || index}`}
                            >
                              <TableCell>
                                <p className="truncate font-bold">
                                  {getCheckpointName(item)}
                                </p>

                                {item.code ? (
                                  <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                    {item.code}
                                  </p>
                                ) : null}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.scans ?? item.total)}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.entries)}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.exits)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[#A88042]" />
                    <p className="font-extrabold text-[#4B4B4B]">
                      أداء الموظفين
                    </p>
                  </div>

                  {filteredStaff.length === 0 ? (
                    <EmptyState text="لا توجد بيانات موظفين." />
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-black/5">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow className="bg-[#F8F8FF]">
                            <TableHead className="w-[55%]">الموظف</TableHead>
                            <TableHead className="w-[15%] text-center">
                              Scan
                            </TableHead>
                            <TableHead className="w-[15%] text-center">
                              جلسات
                            </TableHead>
                            <TableHead className="w-[15%] text-center">
                              إجمالي
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {filteredStaff.map((item, index) => (
                            <TableRow
                              key={`${item.id || item.staffUserId || index}`}
                            >
                              <TableCell>
                                <p className="truncate font-bold">
                                  {getStaffName(item)}
                                </p>

                                {item.email ? (
                                  <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                    {item.email}
                                  </p>
                                ) : null}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.scans)}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.sessions)}
                              </TableCell>

                              <TableCell className="text-center">
                                {formatNumber(item.total ?? item.movements)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-black/5 bg-[#F8F8FF]">
      <div className="text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-[#A88042]" />

        <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">{text}</p>
      </div>
    </div>
  );
}

function SimpleBreakdownTable({ items }: { items: ReportBreakdownItem[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/5">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="bg-[#F8F8FF]">
            <TableHead className="w-[70%]">النوع</TableHead>
            <TableHead className="w-[30%] text-center">العدد</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.id || item.code || item.type || index}`}>
              <TableCell>
                <p className="truncate font-bold">{getItemLabel(item)}</p>
              </TableCell>

              <TableCell className="text-center">
                <Badge variant="gold">{formatNumber(getItemCount(item))}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
