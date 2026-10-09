"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  DoorClosed,
  DoorOpen,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { exportVisitorScanTracking } from "@/features/scan-tracking/scan-tracking.api";
import {
  VisitorPresenceState,
  VisitorScanTrackingParams,
  VisitorScanTrackingRow,
  useScanTrackingFilters,
  useVisitorScanTracking,
} from "@/features/scan-tracking/scan-tracking.queries";

type FilterDraft = {
  search: string;
  eventId: string;
  state: string;
  result: string;
  type: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: FilterDraft = {
  search: "",
  eventId: "",
  state: "",
  result: "",
  type: "",
  from: "",
  to: "",
};

const STATE_OPTIONS = [
  { label: "كل حالات الزوار", value: "" },
  { label: "داخل الفعالية الآن", value: "INSIDE" },
  { label: "خارج الفعالية الآن", value: "OUTSIDE" },
  { label: "بدون دخول/خروج مسموح", value: "NO_ALLOWED_MOVEMENT" },
];

const RESULT_OPTIONS = [
  { label: "كل نتائج القراءة", value: "" },
  { label: "مسموح", value: "ALLOWED" },
  { label: "مرفوض", value: "DENIED" },
  { label: "تحذير", value: "WARNING" },
];

const MOVEMENT_OPTIONS = [
  { label: "كل أنواع الحركة", value: "" },
  { label: "دخول", value: "ENTRY" },
  { label: "خروج", value: "EXIT" },
  { label: "نقطة عبور", value: "CHECKPOINT" },
  { label: "زيارة جناح", value: "BOOTH_VISIT" },
  { label: "حضور جلسة", value: "SESSION_ATTENDANCE" },
  { label: "دخول VIP", value: "VIP_ACCESS" },
];

function toQueryParams(filters: FilterDraft): VisitorScanTrackingParams {
  return {
    search: filters.search.trim() || undefined,
    eventId: filters.eventId || undefined,
    state: filters.state || undefined,
    result: filters.result || undefined,
    type: filters.type || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function eventTitle(row: VisitorScanTrackingRow) {
  return row.event.titleAr || row.event.titleEn || "—";
}

function attendeeTypeLabel(row: VisitorScanTrackingRow) {
  return (
    row.attendeeType.nameAr ||
    row.attendeeType.nameEn ||
    row.attendeeType.code ||
    "—"
  );
}

function stateMeta(state: VisitorPresenceState) {
  if (state === "INSIDE") {
    return {
      label: "داخل الفعالية",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: DoorOpen,
    };
  }

  if (state === "OUTSIDE") {
    return {
      label: "خارج الفعالية",
      className: "bg-sky-50 text-sky-700 border-sky-200",
      icon: DoorClosed,
    };
  }

  return {
    label: "لا توجد حركة دخول/خروج مسموحة",
    className: "bg-zinc-50 text-zinc-600 border-zinc-200",
    icon: CircleAlert,
  };
}

function resultMeta(result?: string | null) {
  if (result === "ALLOWED") {
    return {
      label: "مسموح",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (result === "DENIED") {
    return {
      label: "مرفوض",
      className: "bg-red-50 text-red-700",
    };
  }

  if (result === "WARNING") {
    return {
      label: "تحذير",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "—",
    className: "bg-zinc-50 text-zinc-500",
  };
}

function movementLabel(type?: string | null) {
  const labels: Record<string, string> = {
    ENTRY: "دخول",
    EXIT: "خروج",
    CHECKPOINT: "نقطة عبور",
    BOOTH_VISIT: "زيارة جناح",
    SESSION_ATTENDANCE: "حضور جلسة",
    VIP_ACCESS: "دخول VIP",
  };

  return type ? labels[type] ?? type : "—";
}

function activeFiltersCount(filters: FilterDraft) {
  return Object.values(filters).filter((value) => value.trim()).length;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ScanTrackingPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterDraft>(EMPTY_FILTERS);
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo<VisitorScanTrackingParams>(
    () => ({
      page,
      limit: 25,
      ...toQueryParams(appliedFilters),
    }),
    [appliedFilters, page],
  );

  const trackingQuery = useVisitorScanTracking(queryParams);
  const filtersQuery = useScanTrackingFilters();

  const rows = trackingQuery.data?.items ?? [];
  const summary = trackingQuery.data?.summary;
  const total = trackingQuery.data?.total ?? 0;
  const totalPages = trackingQuery.data?.totalPages ?? 1;

  const eventOptions = useMemo(
    () => [
      { label: "كل الفعاليات", value: "" },
      ...(filtersQuery.data?.events ?? []).map((event) => ({
        label: `${event.titleAr || event.titleEn || "فعالية"} · ${event.scanCount.toLocaleString("ar-SY")} قراءة`,
        value: event.id,
      })),
    ],
    [filtersQuery.data?.events],
  );

  const appliedCount = activeFiltersCount(appliedFilters);

  function updateDraft<K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (
      draftFilters.from &&
      draftFilters.to &&
      new Date(draftFilters.from).getTime() > new Date(draftFilters.to).getTime()
    ) {
      toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    setPage(1);
    setAppliedFilters({ ...draftFilters, search: draftFilters.search.trim() });
  }

  function resetFilters() {
    setPage(1);
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }

  async function exportExcel() {
    try {
      setIsExporting(true);
      const result = await exportVisitorScanTracking(
        toQueryParams(appliedFilters),
      );
      downloadBlob(result.blob, result.filename);
      toast.success("تم تجهيز ملف Excel حسب الفلاتر الحالية");
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "تعذر تصدير ملف Excel";

      toast.error(message || "تعذر تصدير ملف Excel");
    } finally {
      setIsExporting(false);
    }
  }

  function openVisitor(row: VisitorScanTrackingRow) {
    const params = new URLSearchParams({ eventId: row.event.id });
    router.push(`/scan-tracking/${row.registrationId}?${params.toString()}`);
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.13)]">
        <div className="bg-[radial-gradient(circle_at_18%_15%,rgba(168,128,66,0.50),transparent_34%),linear-gradient(135deg,#050505,#171717)] p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C59B55]/25 bg-[#C59B55]/10 px-3 py-1.5 text-[11px] font-black text-[#D6B06E]">
                <ScanLine className="h-3.5 w-3.5" />
                VISITOR JOURNEY
              </div>
              <h1 className="mt-3 text-3xl font-black lg:text-4xl">
                تتبع الزوار
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-white/60">
                صف واحد لكل زائر داخل الفعالية، مع ملخص كامل لعدد القراءات
                والدخول والخروج. اضغط على أي زائر لرؤية مساره التفصيلي خطوة بخطوة.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/15 bg-white/[0.07] text-white hover:border-[#C59B55]/50 hover:bg-white/[0.10] hover:text-[#D6B06E]"
                onClick={() => trackingQuery.refetch()}
                disabled={trackingQuery.isFetching}
              >
                {trackingQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                تحديث
              </Button>

              <Button
                onClick={exportExcel}
                disabled={isExporting || total === 0}
                className="bg-[#A88042] hover:bg-[#C59B55]"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                تصدير Excel
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="الزوار ضمن النتائج"
          value={summary?.totalVisitors ?? 0}
          icon={Users}
          helper="زائر واحد = صف واحد"
        />
        <MetricCard
          label="داخل الفعالية الآن"
          value={summary?.insideVisitors ?? 0}
          icon={DoorOpen}
          helper="آخر حركة مسموحة دخول"
          tone="dark"
        />
        <MetricCard
          label="خارج الفعالية الآن"
          value={summary?.outsideVisitors ?? 0}
          icon={DoorClosed}
          helper="آخر حركة مسموحة خروج"
        />
        <MetricCard
          label="إجمالي القراءات"
          value={summary?.totalScans ?? 0}
          icon={ScanLine}
          helper={`${(summary?.allowedScans ?? 0).toLocaleString("ar-SY")} مسموح`}
        />
        <MetricCard
          label="القراءات المرفوضة"
          value={summary?.deniedScans ?? 0}
          icon={CircleAlert}
          helper={`${(summary?.warningScans ?? 0).toLocaleString("ar-SY")} تحذير`}
          tone="danger"
        />
      </section>

      <section className="rounded-[2rem] border border-black/[0.08] bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.05)] lg:p-6">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#2F3137]">
                  بحث وتصفية دقيقة
                </h2>
                <p className="mt-1 text-xs font-bold text-[#2F3137]/48">
                  الفلاتر تطبق على السيرفر وعلى ملف Excel بنفس المنطق.
                </p>
              </div>
            </div>
          </div>

          {appliedCount > 0 ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#A88042]/10 px-3 py-1.5 text-xs font-black text-[#8F6D37]">
              <BadgeCheck className="h-4 w-4" />
              {appliedCount.toLocaleString("ar-SY")} فلاتر مطبقة
            </div>
          ) : null}
        </div>

        <form onSubmit={applyFilters} className="mt-5 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
            <label className="block">
              <span className="mb-2 block text-xs font-black text-[#4B4B4B]/70">
                البحث عن زائر
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#4B4B4B]/35" />
                <input
                  value={draftFilters.search}
                  onChange={(event) => updateDraft("search", event.target.value)}
                  placeholder="الاسم، رقم التسجيل، الهاتف، البريد..."
                  className="h-12 w-full rounded-2xl border border-black/[0.09] bg-[#F8F8FF] pr-11 pl-4 text-sm font-bold text-[#333] outline-none transition placeholder:text-[#4B4B4B]/30 focus:border-[#A88042]/55 focus:ring-4 focus:ring-[#A88042]/10"
                />
              </div>
            </label>

            <Select
              label="الفعالية"
              value={draftFilters.eventId}
              options={eventOptions}
              placeholder={filtersQuery.isLoading ? "جاري تحميل الفعاليات..." : "كل الفعاليات"}
              disabled={filtersQuery.isLoading}
              onChange={(value) => updateDraft("eventId", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select
              label="الحالة الحالية للزائر"
              value={draftFilters.state}
              options={STATE_OPTIONS}
              onChange={(value) => updateDraft("state", value)}
            />

            <Select
              label="نتيجة القراءة"
              value={draftFilters.result}
              options={RESULT_OPTIONS}
              onChange={(value) => updateDraft("result", value)}
            />

            <Select
              label="نوع الحركة"
              value={draftFilters.type}
              options={MOVEMENT_OPTIONS}
              onChange={(value) => updateDraft("type", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DateTimeField
              label="من تاريخ"
              value={draftFilters.from}
              onChange={(value) => updateDraft("from", value)}
            />
            <DateTimeField
              label="إلى تاريخ"
              value={draftFilters.to}
              onChange={(value) => updateDraft("to", value)}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-black/[0.06] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              مسح الفلاتر
            </Button>
            <Button type="submit" className="min-w-36">
              <Filter className="h-4 w-4" />
              تطبيق الفلاتر
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-2 border-b border-black/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div>
            <h2 className="text-xl font-black text-[#2F3137]">الزوار وحركتهم</h2>
            <p className="mt-1 text-xs font-bold text-[#2F3137]/45">
              {total.toLocaleString("ar-SY")} زائر مطابق · الصفحة {page.toLocaleString("ar-SY")} من {totalPages.toLocaleString("ar-SY")}
            </p>
          </div>
          <p className="text-xs font-bold text-[#2F3137]/40">
            اضغط على الصف لفتح المسار الكامل للزائر
          </p>
        </div>

        {trackingQuery.isLoading && !trackingQuery.data ? (
          <LoadingState />
        ) : trackingQuery.isError ? (
          <ErrorState onRetry={() => trackingQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState filtered={appliedCount > 0} onReset={resetFilters} />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1240px] border-collapse text-right">
                <thead className="bg-[#F8F8FF]">
                  <tr className="text-[11px] font-black text-[#4B4B4B]/55">
                    <TableHead>الزائر</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>نوع الحضور</TableHead>
                    <TableHead>الحالة الحالية</TableHead>
                    <TableHead>القراءات</TableHead>
                    <TableHead>مسموح / مرفوض</TableHead>
                    <TableHead>دخول / خروج مسموح</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead>آخر بوابة</TableHead>
                    <TableHead className="w-16">التفاصيل</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.055]">
                  {rows.map((row) => (
                    <VisitorTableRow key={row.registrationId} row={row} onOpen={() => openVisitor(row)} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 xl:hidden">
              {rows.map((row) => (
                <VisitorCard key={row.registrationId} row={row} onOpen={() => openVisitor(row)} />
              ))}
            </div>
          </>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          disabled={trackingQuery.isFetching}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Users;
  tone?: "default" | "dark" | "danger";
}) {
  const dark = tone === "dark";
  const danger = tone === "danger";

  return (
    <div
      className={`rounded-[1.7rem] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.04)] ${
        dark
          ? "border-black bg-[#111] text-white"
          : "border-black/[0.08] bg-white text-[#303238]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-black ${dark ? "text-white/50" : "text-[#303238]/45"}`}>
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight">
            {value.toLocaleString("ar-SY")}
          </p>
          <p className={`mt-2 text-[11px] font-bold ${dark ? "text-white/35" : "text-[#303238]/35"}`}>
            {helper}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            dark
              ? "bg-[#A88042]/15 text-[#D1A75F]"
              : danger
                ? "bg-red-50 text-red-600"
                : "bg-[#A88042]/10 text-[#A88042]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#4B4B4B]/70">
        {label}
      </span>
      <div className="relative">
        <CalendarClock className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#4B4B4B]/35" />
        <input
          type="datetime-local"
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-black/[0.09] bg-[#F8F8FF] pr-11 pl-4 text-left text-sm font-bold text-[#333] outline-none transition focus:border-[#A88042]/55 focus:ring-4 focus:ring-[#A88042]/10"
        />
      </div>
    </label>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-4 ${className}`}>{children}</th>;
}

function VisitorTableRow({
  row,
  onOpen,
}: {
  row: VisitorScanTrackingRow;
  onOpen: () => void;
}) {
  const state = stateMeta(row.currentState);
  const StateIcon = state.icon;
  const result = resultMeta(row.lastResult);

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer text-sm transition hover:bg-[#A88042]/[0.035] focus:bg-[#A88042]/[0.05] focus:outline-none"
    >
      <td className="px-4 py-4">
        <div className="min-w-44">
          <p className="font-black text-[#2F3137]">{row.fullName}</p>
          <p className="mt-1 text-[11px] font-bold text-[#A88042]">
            {row.publicId}
          </p>
          <p dir="ltr" className="mt-1 text-right text-[11px] font-bold text-[#2F3137]/40">
            {row.phone || "—"}
          </p>
        </div>
      </td>
      <td className="max-w-56 px-4 py-4">
        <p className="line-clamp-2 font-extrabold text-[#2F3137]/78">
          {eventTitle(row)}
        </p>
      </td>
      <td className="px-4 py-4 text-xs font-bold text-[#2F3137]/60">
        {attendeeTypeLabel(row)}
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-black ${state.className}`}>
          <StateIcon className="h-3.5 w-3.5" />
          {state.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="inline-flex min-w-14 items-center justify-center rounded-xl bg-[#F8F8FF] px-3 py-2 font-black text-[#2F3137]">
          {row.scanCount.toLocaleString("ar-SY")}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
            {row.allowedCount.toLocaleString("ar-SY")}
          </span>
          <span className="text-[#2F3137]/25">/</span>
          <span className="rounded-lg bg-red-50 px-2 py-1 text-red-700">
            {row.deniedCount.toLocaleString("ar-SY")}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="rounded-lg bg-[#A88042]/10 px-2 py-1 text-[#8F6D37]">
            {row.entryCount.toLocaleString("ar-SY")}
          </span>
          <span className="text-[#2F3137]/25">/</span>
          <span className="rounded-lg bg-sky-50 px-2 py-1 text-sky-700">
            {row.exitCount.toLocaleString("ar-SY")}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="whitespace-nowrap text-xs font-bold text-[#2F3137]/65">
          {formatDateTime(row.lastSeenAt)}
        </p>
        <span className={`mt-1.5 inline-flex rounded-lg px-2 py-1 text-[10px] font-black ${result.className}`}>
          {movementLabel(row.lastMovementType)} · {result.label}
        </span>
      </td>
      <td className="max-w-44 px-4 py-4 text-xs font-bold text-[#2F3137]/55">
        {row.lastCheckpoint?.nameAr || row.lastCheckpoint?.nameEn || row.lastCheckpoint?.code || "—"}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white transition group-hover:bg-[#A88042]">
          <ArrowLeft className="h-4 w-4" />
        </span>
      </td>
    </tr>
  );
}

function VisitorCard({
  row,
  onOpen,
}: {
  row: VisitorScanTrackingRow;
  onOpen: () => void;
}) {
  const state = stateMeta(row.currentState);
  const StateIcon = state.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-[1.6rem] border border-black/[0.07] bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-[#A88042]/25 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[#2F3137]">
            {row.fullName}
          </p>
          <p className="mt-1 truncate text-[11px] font-black text-[#A88042]">
            {row.publicId}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${state.className}`}>
          <StateIcon className="h-3 w-3" />
          {state.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-[#F8F8FF] p-3">
        <p className="line-clamp-1 text-xs font-black text-[#2F3137]/75">
          {eventTitle(row)}
        </p>
        <p className="mt-1 text-[11px] font-bold text-[#2F3137]/45">
          {attendeeTypeLabel(row)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniValue label="القراءات" value={row.scanCount} />
        <MiniValue label="مسموح" value={row.allowedCount} tone="success" />
        <MiniValue label="مرفوض" value={row.deniedCount} tone="danger" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3">
        <p className="text-[11px] font-bold text-[#2F3137]/45">
          آخر نشاط: {formatDateTime(row.lastSeenAt)}
        </p>
        <ArrowLeft className="h-4 w-4 text-[#A88042]" />
      </div>
    </button>
  );
}

function MiniValue({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-white p-2.5 text-center">
      <p
        className={`text-base font-black ${
          tone === "success"
            ? "text-emerald-700"
            : tone === "danger"
              ? "text-red-700"
              : "text-[#2F3137]"
        }`}
      >
        {value.toLocaleString("ar-SY")}
      </p>
      <p className="mt-1 text-[9px] font-bold text-[#2F3137]/40">{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
        <p className="mt-3 text-sm font-black text-[#2F3137]/60">
          جاري تجميع حركة الزوار...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6">
      <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-8 text-center">
        <CircleAlert className="mx-auto h-8 w-8 text-red-600" />
        <p className="mt-3 text-base font-black text-red-800">
          تعذر تحميل بيانات تتبع الزوار
        </p>
        <p className="mt-2 text-xs font-bold text-red-700/60">
          تأكد من اتصال السيرفر ثم أعد المحاولة.
        </p>
        <Button className="mt-5" variant="danger" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="rounded-[1.6rem] border border-black/[0.06] bg-[#F8F8FF] p-10 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-[#A88042]" />
        <p className="mt-4 text-lg font-black text-[#2F3137]">
          {filtered ? "لا توجد نتائج مطابقة للفلاتر" : "لا توجد قراءات زوار حتى الآن"}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs font-bold leading-6 text-[#2F3137]/45">
          {filtered
            ? "جرّب توسيع الفترة الزمنية أو إزالة أحد الفلاتر."
            : "ستظهر هنا بطاقة واحدة لكل زائر بمجرد تسجيل أول قراءة QR مرتبطة به."}
        </p>
        {filtered ? (
          <Button className="mt-5" variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-4 lg:px-6">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
      >
        <ChevronRight className="h-4 w-4" />
        السابق
      </Button>

      <span className="text-xs font-black text-[#2F3137]/55">
        {page.toLocaleString("ar-SY")} / {totalPages.toLocaleString("ar-SY")}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
      >
        التالي
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}
