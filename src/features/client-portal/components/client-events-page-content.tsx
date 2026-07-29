"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FilterX,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { useClientEvents } from "../client-portal.queries";
import type {
  ClientEventSortBy,
  ClientEventStatus,
  ClientEventType,
  ClientSortDirection,
} from "../client-portal.types";
import {
  clientEventStatusLabels,
  clientEventTypeLabels,
  formatClientDate,
  formatClientNumber,
  getClientEventStatusVariant,
  getClientPortalErrorMessage,
} from "../client-portal.constants";
import { ClientPagination } from "./client-pagination";

const PAGE_LIMIT = 12;

const statusOptions = [
  { label: "كل الحالات", value: "" },
  ...Object.entries(clientEventStatusLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

const typeOptions = [
  { label: "كل الأنواع", value: "" },
  ...Object.entries(clientEventTypeLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

const sortOptions = [
  { label: "تاريخ البداية", value: "startsAt" },
  { label: "تاريخ النهاية", value: "endsAt" },
  { label: "تاريخ الإنشاء", value: "createdAt" },
  { label: "اسم الفعالية", value: "titleAr" },
  { label: "الحالة", value: "status" },
];

const directionOptions = [
  { label: "الأحدث أولًا", value: "desc" },
  { label: "الأقدم أولًا", value: "asc" },
];

function EventsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-[2rem] border border-black/5 bg-black/[0.06]"
        />
      ))}
    </div>
  );
}

export function ClientEventsPageContent() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<ClientEventSortBy>("startsAt");
  const [sortDirection, setSortDirection] =
    useState<ClientSortDirection>("desc");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      status: (status || undefined) as ClientEventStatus | undefined,
      type: (type || undefined) as ClientEventType | undefined,
      country: country.trim() || undefined,
      from: from ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
      sortBy,
      sortDirection,
    }),
    [country, from, page, search, sortBy, sortDirection, status, to, type],
  );

  const eventsQuery = useClientEvents(params);
  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? 0;
  const pages = Math.max(eventsQuery.data?.pages ?? 0, 1);

  const activeFiltersCount = [search, status, type, country, from, to].filter(
    Boolean,
  ).length;

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setType("");
    setCountry("");
    setFrom("");
    setTo("");
    setSortBy("startsAt");
    setSortDirection("desc");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="بوابة العميل"
        title="الفعاليات"
        description="استعرض جميع الفعاليات المرتبطة بحسابك، مع تفاصيل المكان والمواعيد وأعداد التسجيلات."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => eventsQuery.refetch()}
            isLoading={eventsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#A88042]" />
                <h2 className="font-extrabold text-[#4B4B4B]">البحث والفلاتر</h2>
              </div>
              <p className="mt-1 text-xs font-bold text-[#4B4B4B]/50">
                {activeFiltersCount > 0
                  ? `${formatClientNumber(activeFiltersCount)} فلاتر مفعّلة`
                  : "لا توجد فلاتر مفعّلة"}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeFiltersCount === 0}
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4" />
              مسح الفلاتر
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="بحث"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="اسم الفعالية..."
              icon={<Search className="h-4 w-4" />}
            />

            <Select
              label="الحالة"
              value={status}
              options={statusOptions}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />

            <Select
              label="نوع الفعالية"
              value={type}
              options={typeOptions}
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
            />

            <Input
              label="دولة الفعالية"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setPage(1);
              }}
              placeholder="مثال: سوريا"
              icon={<MapPin className="h-4 w-4" />}
            />

            <Input
              label="من تاريخ"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />

            <Input
              label="إلى تاريخ"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />

            <Select
              label="الترتيب حسب"
              value={sortBy}
              options={sortOptions}
              onChange={(value) => {
                setSortBy(value as ClientEventSortBy);
                setPage(1);
              }}
            />

            <Select
              label="اتجاه الترتيب"
              value={sortDirection}
              options={directionOptions}
              onChange={(value) => {
                setSortDirection(value as ClientSortDirection);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#252525]">نتائج الفعاليات</h2>
          <p className="mt-1 text-sm font-bold text-[#4B4B4B]/50">
            {eventsQuery.isLoading
              ? "جاري تحميل النتائج..."
              : `${formatClientNumber(total)} فعالية مطابقة`}
          </p>
        </div>

        {eventsQuery.isFetching && !eventsQuery.isLoading ? (
          <Badge variant="gold">جاري تحديث النتائج</Badge>
        ) : null}
      </div>

      {eventsQuery.isLoading ? <EventsSkeleton /> : null}

      {eventsQuery.isError ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-extrabold text-[#252525]">
              تعذر تحميل الفعاليات
            </h3>
            <p className="mt-2 max-w-lg text-sm font-bold leading-7 text-[#4B4B4B]/55">
              {getClientPortalErrorMessage(
                eventsQuery.error,
                "حدث خطأ أثناء تحميل الفعاليات",
              )}
            </p>
            <Button className="mt-5" onClick={() => eventsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <CalendarDays className="mb-4 h-14 w-14 text-[#A88042]/45" />
            <h3 className="text-xl font-extrabold text-[#252525]">
              لا توجد فعاليات مطابقة
            </h3>
            <p className="mt-2 max-w-lg text-sm font-bold leading-7 text-[#4B4B4B]/50">
              جرّب تعديل الفلاتر أو مسحها لعرض جميع فعاليات حسابك.
            </p>
            {activeFiltersCount > 0 ? (
              <Button className="mt-5" variant="outline" onClick={resetFilters}>
                مسح الفلاتر
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!eventsQuery.isLoading && !eventsQuery.isError && events.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const venue = event.venues[0];

            return (
              <Card
                key={event.id}
                className="group overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[#A88042]/35 hover:shadow-[0_28px_80px_rgba(168,128,66,0.14)]"
              >
                <div className="h-1.5 bg-gradient-to-l from-[#A88042] via-[#C59B55] to-black" />
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={getClientEventStatusVariant(event.status)}>
                      {clientEventStatusLabels[event.status]}
                    </Badge>
                    <Badge variant="muted">{clientEventTypeLabels[event.type]}</Badge>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-xl font-extrabold leading-8 text-[#252525]">
                    {event.titleAr}
                  </h3>

                  {event.titleEn ? (
                    <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/40" dir="ltr">
                      {event.titleEn}
                    </p>
                  ) : null}

                  <div className="mt-5 space-y-3 text-sm font-bold text-[#4B4B4B]/65">
                    <div className="flex items-start gap-3">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#A88042]" />
                      <span>{formatClientDate(event.startsAt)}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A88042]" />
                      <span className="line-clamp-2">
                        {venue
                          ? [venue.nameAr, venue.city, venue.country]
                              .filter(Boolean)
                              .join("، ")
                          : "لم يتم تحديد مكان"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8F8FF] p-3">
                    <div>
                      <div className="flex items-center gap-2 text-[#A88042]">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-extrabold">التسجيلات</span>
                      </div>
                      <p className="mt-1 text-xl font-extrabold text-[#252525]">
                        {formatClientNumber(event._count.registrations)}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-extrabold">فئات الحضور</span>
                      </div>
                      <p className="mt-1 text-xl font-extrabold text-[#252525]">
                        {formatClientNumber(event._count.attendeeTypes)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/client/events/${event.id}`}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-extrabold text-white transition hover:bg-[#A88042] focus:outline-none focus:ring-4 focus:ring-[#A88042]/15"
                  >
                    عرض التفاصيل
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <ClientPagination
        page={page}
        pages={pages}
        total={total}
        limit={PAGE_LIMIT}
        disabled={eventsQuery.isFetching}
        onPageChange={setPage}
      />
    </div>
  );
}
