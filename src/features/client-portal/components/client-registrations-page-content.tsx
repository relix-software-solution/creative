"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useClientEvent,
  useClientEvents,
  useClientRegistrations,
  useExportClientRegistrations,
} from "../client-portal.queries";
import type {
  ClientAttendanceFilter,
  ClientRegistrationSortBy,
  ClientRegistrationSource,
  ClientRegistrationStatus,
  ClientSortDirection,
} from "../client-portal.types";
import {
  clientAttendanceStatusLabels,
  clientRegistrationSourceLabels,
  clientRegistrationStatusLabels,
  formatClientDate,
  formatClientNumber,
  getClientAttendanceVariant,
  getClientPortalErrorMessage,
  getClientRegistrationStatusVariant,
} from "../client-portal.constants";
import {
  ClientRegistrationFilters,
  type ClientRegistrationFilterValues,
} from "./client-registration-filters";
import { ClientPagination } from "./client-pagination";

const PAGE_LIMIT = 20;

const sortOptions = [
  { label: "تاريخ التسجيل", value: "registeredAt" },
  { label: "الاسم", value: "fullName" },
  { label: "الحالة", value: "status" },
  { label: "اسم الفعالية", value: "eventTitle" },
];

const directionOptions = [
  { label: "الأحدث أولًا", value: "desc" },
  { label: "الأقدم أولًا", value: "asc" },
];

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

function RegistrationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-2xl border border-black/5 bg-black/[0.05]"
        />
      ))}
    </div>
  );
}

export function ClientRegistrationsPageContent() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] =
    useState<ClientRegistrationFilterValues>(initialFilters);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] =
    useState<ClientRegistrationSortBy>("registeredAt");
  const [sortDirection, setSortDirection] =
    useState<ClientSortDirection>("desc");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(filters.searchInput.trim());
      setPage(1);
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
      page,
      limit: PAGE_LIMIT,
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
      sortBy,
      sortDirection,
    }),
    [filters, page, search, sortBy, sortDirection],
  );

  const registrationsQuery = useClientRegistrations(params);
  const exportMutation = useExportClientRegistrations();

  const registrations = registrationsQuery.data?.items ?? [];
  const total = registrationsQuery.data?.total ?? 0;
  const pages = Math.max(registrationsQuery.data?.pages ?? 0, 1);

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

      if (key === "eventId") {
        next.attendeeTypeId = "";
      }

      return next;
    });
    setPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setSearch("");
    setSortBy("registeredAt");
    setSortDirection("desc");
    setPage(1);
  }

  function exportRows() {
    exportMutation.mutate({
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
      sortBy,
      sortDirection,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="بوابة العميل"
        title="التسجيلات"
        description="تابع المسجلين في فعالياتك، حالات التسجيل والحضور، ونزّل النتائج المطابقة بصيغة Excel."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => registrationsQuery.refetch()}
              isLoading={registrationsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>

            <Button
              type="button"
              onClick={exportRows}
              isLoading={exportMutation.isPending}
              disabled={registrationsQuery.isLoading}
            >
              <Download className="h-4 w-4" />
              تصدير Excel
            </Button>
          </>
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
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="الترتيب حسب"
              value={sortBy}
              options={sortOptions}
              onChange={(value) => {
                setSortBy(value as ClientRegistrationSortBy);
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
          <h2 className="text-xl font-extrabold text-[#252525]">
            نتائج التسجيلات
          </h2>
          <p className="mt-1 text-sm font-bold text-[#4B4B4B]/50">
            {registrationsQuery.isLoading
              ? "جاري تحميل النتائج..."
              : `${formatClientNumber(total)} تسجيل مطابق`}
          </p>
        </div>

        {registrationsQuery.isFetching && !registrationsQuery.isLoading ? (
          <Badge variant="gold">جاري تحديث النتائج</Badge>
        ) : null}
      </div>

      {registrationsQuery.isLoading ? <RegistrationsSkeleton /> : null}

      {registrationsQuery.isError ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <Users className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-extrabold text-[#252525]">
              تعذر تحميل التسجيلات
            </h3>
            <p className="mt-2 max-w-lg text-sm font-bold leading-7 text-[#4B4B4B]/55">
              {getClientPortalErrorMessage(
                registrationsQuery.error,
                "حدث خطأ أثناء تحميل التسجيلات",
              )}
            </p>
            <Button className="mt-5" onClick={() => registrationsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!registrationsQuery.isLoading &&
      !registrationsQuery.isError &&
      registrations.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <Users className="mb-4 h-14 w-14 text-[#A88042]/45" />
            <h3 className="text-xl font-extrabold text-[#252525]">
              لا توجد تسجيلات مطابقة
            </h3>
            <p className="mt-2 max-w-lg text-sm font-bold leading-7 text-[#4B4B4B]/50">
              عدّل الفلاتر أو امسحها لعرض جميع تسجيلات فعالياتك.
            </p>
            {activeFiltersCount > 0 ? (
              <Button className="mt-5" variant="outline" onClick={resetFilters}>
                مسح الفلاتر
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!registrationsQuery.isLoading &&
      !registrationsQuery.isError &&
      registrations.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المسجل</TableHead>
                  <TableHead>الفعالية</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>حالة التسجيل</TableHead>
                  <TableHead>الحضور</TableHead>
                  <TableHead>المصدر</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>التفاصيل</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div>
                        <p className="font-extrabold text-[#252525]">
                          {registration.fullName}
                        </p>
                        <p className="mt-1 text-xs text-[#4B4B4B]/50">
                          {registration.email || registration.phone || "—"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-56 whitespace-normal">
                        <p className="font-extrabold text-[#252525]">
                          {registration.event.titleAr ||
                            registration.event.titleEn ||
                            "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#4B4B4B]/50">
                          {formatClientDate(registration.event.startsAt)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {registration.attendeeType?.nameAr ||
                        registration.attendeeType?.nameEn ||
                        registration.attendeeType?.code ||
                        "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getClientRegistrationStatusVariant(
                          registration.status,
                        )}
                      >
                        {clientRegistrationStatusLabels[registration.status]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getClientAttendanceVariant(
                          registration.attendance.status,
                        )}
                      >
                        {clientAttendanceStatusLabels[
                          registration.attendance.status
                        ]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {clientRegistrationSourceLabels[registration.source]}
                    </TableCell>

                    <TableCell>
                      {formatClientDate(registration.registeredAt)}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/client/registrations/${registration.id}`}
                        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#A88042] hover:text-[#8F6D37]"
                      >
                        عرض
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {registrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold text-[#252525]">
                        {registration.fullName}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/50">
                        {registration.event.titleAr || registration.event.titleEn}
                      </p>
                    </div>
                    <Badge
                      variant={getClientAttendanceVariant(
                        registration.attendance.status,
                      )}
                    >
                      {clientAttendanceStatusLabels[
                        registration.attendance.status
                      ]}
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-sm font-bold text-[#4B4B4B]/65 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-[#A88042]" />
                      {clientRegistrationStatusLabels[registration.status]}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-[#A88042]" />
                      {registration.attendeeType?.nameAr ||
                        registration.attendeeType?.nameEn ||
                        "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#A88042]" />
                      <span className="truncate">{registration.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#A88042]" />
                      {registration.phone || "—"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/10 pt-4">
                    <span className="text-xs font-bold text-[#4B4B4B]/50">
                      {formatClientDate(registration.registeredAt)}
                    </span>
                    <Link
                      href={`/client/registrations/${registration.id}`}
                      className="inline-flex items-center gap-2 text-xs font-extrabold text-[#A88042]"
                    >
                      عرض التفاصيل
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ClientPagination
            page={page}
            pages={pages}
            total={total}
            limit={PAGE_LIMIT}
            disabled={registrationsQuery.isFetching}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
