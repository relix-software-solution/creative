"use client";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  DoorOpen,
  Filter,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ScanTrackingItem,
  ScanTrackingListParams,
  useScanTrackingList,
} from "@/features/scan-tracking/scan-tracking.queries";

const defaultFilters = {
  search: "",
  type: "",
  decision: "",
  from: "",
  to: "",
};

function getRegistration(scan: ScanTrackingItem) {
  return (
    scan.registration ||
    scan.attendee ||
    scan.visitor ||
    scan.data?.registration ||
    scan.data?.attendee ||
    scan.data?.visitor ||
    null
  );
}

function getVisitorName(scan: ScanTrackingItem) {
  const registration = getRegistration(scan);

  return (
    registration?.fullName ||
    registration?.name ||
    registration?.visitorName ||
    registration?.attendeeName ||
    "زائر غير معروف"
  );
}

function getVisitorPhone(scan: ScanTrackingItem) {
  const registration = getRegistration(scan);

  return registration?.phone || registration?.mobile || "—";
}

function getPublicId(scan: ScanTrackingItem) {
  const registration = getRegistration(scan);

  return registration?.publicId || registration?.id || "—";
}

function getAttendeeType(scan: ScanTrackingItem) {
  const registration = getRegistration(scan);
  const attendeeType = registration?.attendeeType;

  return (
    attendeeType?.nameAr || attendeeType?.nameEn || attendeeType?.code || "—"
  );
}

function getEventTitle(scan: ScanTrackingItem) {
  return scan.event?.titleAr || scan.event?.titleEn || "—";
}

function getCheckpointName(scan: ScanTrackingItem) {
  return scan.checkpoint?.nameAr || scan.checkpoint?.nameEn || "—";
}

function getDeviceName(scan: ScanTrackingItem) {
  return scan.device?.name || scan.device?.code || "—";
}

function getStaffName(scan: ScanTrackingItem) {
  return (
    scan.staff?.fullName ||
    scan.staff?.name ||
    scan.user?.fullName ||
    scan.user?.name ||
    scan.staffSession?.user?.fullName ||
    scan.staffSession?.user?.name ||
    scan.staffSession?.staff?.fullName ||
    scan.staffSession?.staff?.name ||
    scan.staffSession?.id ||
    "—"
  );
}

function getScanType(scan: ScanTrackingItem) {
  const value = scan.type || "";

  if (value === "ENTRY") return "دخول";
  if (value === "EXIT") return "خروج";

  return value || "—";
}

function isAllowedScan(scan: ScanTrackingItem) {
  return (
    scan.allowed === true ||
    scan.decision === "ALLOWED" ||
    scan.status === "ALLOWED" ||
    scan.status === "SUCCESS"
  );
}

function isDeniedScan(scan: ScanTrackingItem) {
  return (
    scan.allowed === false ||
    scan.decision === "DENIED" ||
    scan.status === "DENIED" ||
    scan.status === "REJECTED" ||
    Boolean(scan.reason)
  );
}

function getDecisionLabel(scan: ScanTrackingItem) {
  if (isAllowedScan(scan)) return "مسموح";
  if (isDeniedScan(scan)) return "مرفوض";

  return scan.decision || scan.status || "—";
}

function getReason(scan: ScanTrackingItem) {
  return scan.reason || scan.message || "—";
}

function getScanTime(scan: ScanTrackingItem) {
  return scan.scannedAtDevice || scan.createdAt || "";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ar-SY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ScanTrackingPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState(defaultFilters);

  const params = useMemo<ScanTrackingListParams>(() => {
    return {
      page,
      limit: 20,
      search: filters.search || undefined,
      type: filters.type || undefined,
      decision: filters.decision || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    };
  }, [page, filters]);

  const scansQuery = useScanTrackingList(params);
  const scans = scansQuery.data?.items ?? [];

  const total = scansQuery.data?.total ?? 0;
  const totalPages = scansQuery.data?.totalPages ?? 1;

  const currentPageStats = useMemo(() => {
    return {
      total: scans.length,
      allowed: scans.filter(isAllowedScan).length,
      denied: scans.filter(isDeniedScan).length,
      entry: scans.filter((scan) => scan.type === "ENTRY").length,
      exit: scans.filter((scan) => scan.type === "EXIT").length,
    };
  }, [scans]);

  function submitSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    setPage(1);
    setFilters((current) => ({
      ...current,
      search: searchInput.trim(),
    }));
  }

  function resetFilters() {
    setPage(1);
    setSearchInput("");
    setFilters(defaultFilters);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
        <div className="bg-[radial-gradient(circle_at_20%_20%,rgba(168,128,66,0.45),transparent_35%),linear-gradient(135deg,#050505,#171717)] p-6 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#C59B55]">
                Visitor Scan Tracking
              </p>

              <h1 className="mt-2 text-3xl font-black lg:text-4xl">
                تتبع حركة الزوار
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-white/60">
                راقب كل عمليات قراءة QR، دخول وخروج الزوار، البوابات، الأجهزة،
                الموظفين، ونتائج السماح أو الرفض.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <StatPill label="المعروض" value={currentPageStats.total} />
              <StatPill label="مسموح" value={currentPageStats.allowed} />
              <StatPill label="مرفوض" value={currentPageStats.denied} />
              <StatPill label="الإجمالي" value={total} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.06)] lg:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#2F3137]">فلاتر البحث</h2>

            <p className="mt-1 text-xs font-bold text-[#2F3137]/50">
              ابحث باسم الزائر، رقم التسجيل، الهاتف، أو فلتر حسب الحركة
              والنتيجة.
            </p>
          </div>

          <Button variant="outline" onClick={() => scansQuery.refetch()}>
            {scansQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تحديث
          </Button>
        </div>

        <form
          className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_auto_auto_auto_auto_auto]"
          onSubmit={submitSearch}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />

            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="بحث باسم الزائر أو رقم التسجيل أو الهاتف..."
              className="h-12 w-full rounded-2xl border border-black/10 bg-white pr-11 pl-4 text-sm font-bold text-[#2F3137] outline-none transition placeholder:text-black/35 focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>

          <select
            value={filters.type}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }));
            }}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#2F3137] outline-none focus:ring-4 focus:ring-[#A88042]/10"
          >
            <option value="">كل الحركات</option>
            <option value="ENTRY">دخول</option>
            <option value="EXIT">خروج</option>
          </select>

          <select
            value={filters.decision}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                decision: event.target.value,
              }));
            }}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#2F3137] outline-none focus:ring-4 focus:ring-[#A88042]/10"
          >
            <option value="">كل النتائج</option>
            <option value="ALLOWED">مسموح</option>
            <option value="DENIED">مرفوض</option>
          </select>

          <input
            type="datetime-local"
            value={filters.from}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                from: event.target.value,
              }));
            }}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#2F3137] outline-none focus:ring-4 focus:ring-[#A88042]/10"
          />

          <input
            type="datetime-local"
            value={filters.to}
            onChange={(event) => {
              setPage(1);
              setFilters((current) => ({
                ...current,
                to: event.target.value,
              }));
            }}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#2F3137] outline-none focus:ring-4 focus:ring-[#A88042]/10"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" disabled={scansQuery.isFetching}>
              {scansQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              تطبيق
            </Button>

            <Button type="button" variant="outline" onClick={resetFilters}>
              مسح
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          title="حركات الدخول"
          value={currentPageStats.entry}
          icon={<CircleCheck className="h-5 w-5" />}
          tone="green"
        />

        <SummaryCard
          title="حركات الخروج"
          value={currentPageStats.exit}
          icon={<ChevronLeft className="h-5 w-5" />}
          tone="blue"
        />

        <SummaryCard
          title="المسموحة"
          value={currentPageStats.allowed}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="green"
        />

        <SummaryCard
          title="المرفوضة"
          value={currentPageStats.denied}
          icon={<CircleX className="h-5 w-5" />}
          tone="red"
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-black/10 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div>
            <h2 className="text-xl font-black text-[#2F3137]">
              سجل عمليات السكان
            </h2>

            <p className="mt-1 text-xs font-bold text-[#2F3137]/50">
              الصفحة {page} من {totalPages} — إجمالي النتائج: {total}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || scansQuery.isFetching}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>

            <Button
              variant="outline"
              disabled={page >= totalPages || scansQuery.isFetching}
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {scansQuery.isError ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-700">
              <CircleX className="h-9 w-9" />
            </div>

            <h3 className="mt-4 text-xl font-black text-[#2F3137]">
              تعذر تحميل سجل السكان
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-7 text-[#2F3137]/55">
              تأكد أن الباك يدعم endpoint الخاص بجلب عمليات السكان. الإعداد
              الحالي يستخدم GET /scans.
            </p>

            <Button className="mt-5" onClick={() => scansQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : scansQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#A88042]" />
          </div>
        ) : scans.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#A88042]/10 text-[#A88042]">
              <Search className="h-9 w-9" />
            </div>

            <h3 className="mt-4 text-xl font-black text-[#2F3137]">
              لا توجد عمليات مطابقة
            </h3>

            <p className="mt-2 text-sm font-bold text-[#2F3137]/50">
              جرّب تغيير الفلاتر أو البحث باسم زائر آخر.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-right">
              <thead>
                <tr className="bg-[#F7F7FB]">
                  <TableHead>الوقت</TableHead>
                  <TableHead>الزائر</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>نوع الحضور</TableHead>
                  <TableHead>الحركة</TableHead>
                  <TableHead>النتيجة</TableHead>
                  <TableHead>المعرض</TableHead>
                  <TableHead>البوابة</TableHead>
                  <TableHead>الجهاز</TableHead>
                  <TableHead>الموظف</TableHead>
                  <TableHead>سبب الرفض</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/5">
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="transition hover:bg-black/[0.02]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-[#A88042]" />
                        <span>{formatDateTime(getScanTime(scan))}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#2F3137]">
                          {getVisitorName(scan)}
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 truncate text-xs font-black text-[#A88042]"
                        >
                          {getPublicId(scan)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell dir="ltr" className="text-left">
                      {getVisitorPhone(scan)}
                    </TableCell>

                    <TableCell>{getAttendeeType(scan)}</TableCell>

                    <TableCell>
                      <TypeBadge type={scan.type || ""} />
                    </TableCell>

                    <TableCell>
                      <DecisionBadge scan={scan} />
                    </TableCell>

                    <TableCell>{getEventTitle(scan)}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-black/35" />
                        <span>{getCheckpointName(scan)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MonitorSmartphone className="h-4 w-4 text-black/35" />
                        <span>{getDeviceName(scan)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-black/35" />
                        <span>{getStaffName(scan)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="line-clamp-2 text-xs font-bold text-[#2F3137]/55">
                        {getReason(scan)}
                      </span>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-[11px] font-black text-white/45">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: "green" | "red" | "blue";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.05)]">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-black text-[#2F3137]/50">{title}</p>

      <p className="mt-1 text-3xl font-black text-[#2F3137]">{value}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isEntry = type === "ENTRY";
  const isExit = type === "EXIT";

  return (
    <span
      className={
        isEntry
          ? "inline-flex rounded-full bg-[#A88042]/10 px-3 py-1 text-xs font-black text-[#A88042]"
          : isExit
            ? "inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"
            : "inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-black text-[#2F3137]/60"
      }
    >
      {isEntry ? "دخول" : isExit ? "خروج" : type || "—"}
    </span>
  );
}

function DecisionBadge({ scan }: { scan: ScanTrackingItem }) {
  const allowed = isAllowedScan(scan);
  const denied = isDeniedScan(scan);

  return (
    <span
      className={
        allowed
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
          : denied
            ? "inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700"
            : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"
      }
    >
      {allowed ? (
        <CircleCheck className="h-3.5 w-3.5" />
      ) : denied ? (
        <CircleX className="h-3.5 w-3.5" />
      ) : null}

      {getDecisionLabel(scan)}
    </span>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-4 text-xs font-black text-[#2F3137]/50">
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
  dir,
}: {
  children: React.ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <td
      dir={dir}
      className={`px-4 py-4 text-sm font-bold text-[#2F3137] ${className}`}
    >
      {children}
    </td>
  );
}
