"use client";

import {
  CalendarDays,
  FilterX,
  MapPin,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  clientRegistrationSourceLabels,
  clientRegistrationStatusLabels,
  formatClientNumber,
} from "../client-portal.constants";
import type {
  ClientAttendanceFilter,
  ClientAttendeeTypeDetails,
  ClientEventListItem,
  ClientRegistrationSource,
  ClientRegistrationStatus,
} from "../client-portal.types";

export type ClientRegistrationFilterValues = {
  searchInput: string;
  eventId: string;
  attendeeTypeId: string;
  status: string;
  source: string;
  attendance: string;
  eventCountry: string;
  from: string;
  to: string;
};

type ClientRegistrationFiltersProps = {
  values: ClientRegistrationFilterValues;
  events: ClientEventListItem[];
  attendeeTypes: ClientAttendeeTypeDetails[];
  eventsLoading?: boolean;
  attendeeTypesLoading?: boolean;
  activeFiltersCount: number;
  onChange: <K extends keyof ClientRegistrationFilterValues>(
    key: K,
    value: ClientRegistrationFilterValues[K],
  ) => void;
  onReset: () => void;
};

const statusOptions = [
  { label: "كل الحالات", value: "" },
  ...Object.entries(clientRegistrationStatusLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

const sourceOptions = [
  { label: "كل المصادر", value: "" },
  ...Object.entries(clientRegistrationSourceLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

const attendanceOptions = [
  { label: "كل حالات الحضور", value: "" },
  { label: "حضر الفعالية", value: "ATTENDED" },
  { label: "لم يحضر", value: "NOT_ATTENDED" },
];

export function ClientRegistrationFilters({
  values,
  events,
  attendeeTypes,
  eventsLoading = false,
  attendeeTypesLoading = false,
  activeFiltersCount,
  onChange,
  onReset,
}: ClientRegistrationFiltersProps) {
  const eventOptions = [
    { label: eventsLoading ? "جاري تحميل الفعاليات..." : "كل الفعاليات", value: "" },
    ...events.map((event) => ({
      value: event.id,
      label: event.titleAr || event.titleEn || "فعالية بدون اسم",
    })),
  ];

  const attendeeTypeOptions = [
    {
      label: attendeeTypesLoading
        ? "جاري تحميل فئات الحضور..."
        : values.eventId
          ? "كل فئات الحضور"
          : "اختر فعالية أولًا",
      value: "",
    },
    ...attendeeTypes.map((attendeeType) => ({
      value: attendeeType.id,
      label:
        attendeeType.nameAr || attendeeType.nameEn || attendeeType.code,
    })),
  ];

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#A88042]" />
              <h2 className="font-extrabold text-[#4B4B4B]">
                البحث والفلاتر
              </h2>
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
            onClick={onReset}
          >
            <FilterX className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="بحث"
            value={values.searchInput}
            onChange={(event) => onChange("searchInput", event.target.value)}
            placeholder="الاسم، الهاتف، البريد أو الشركة..."
            icon={<Search className="h-4 w-4" />}
          />

          <Select
            label="الفعالية"
            value={values.eventId}
            options={eventOptions}
            disabled={eventsLoading}
            onChange={(value) => onChange("eventId", value)}
          />

          <Select
            label="فئة الحضور"
            value={values.attendeeTypeId}
            options={attendeeTypeOptions}
            disabled={!values.eventId || attendeeTypesLoading}
            onChange={(value) => onChange("attendeeTypeId", value)}
          />

          <Select
            label="حالة التسجيل"
            value={values.status}
            options={statusOptions}
            onChange={(value) =>
              onChange("status", value as ClientRegistrationStatus | "")
            }
          />

          <Select
            label="مصدر التسجيل"
            value={values.source}
            options={sourceOptions}
            onChange={(value) =>
              onChange("source", value as ClientRegistrationSource | "")
            }
          />

          <Select
            label="حالة الحضور"
            value={values.attendance}
            options={attendanceOptions}
            onChange={(value) =>
              onChange("attendance", value as ClientAttendanceFilter | "")
            }
          />

          <Input
            label="دولة الفعالية"
            value={values.eventCountry}
            onChange={(event) => onChange("eventCountry", event.target.value)}
            placeholder="مثال: سوريا"
            icon={<MapPin className="h-4 w-4" />}
          />

          <div className="hidden xl:block" aria-hidden="true" />

          <Input
            label="تاريخ التسجيل من"
            type="date"
            value={values.from}
            max={values.to || undefined}
            onChange={(event) => onChange("from", event.target.value)}
            icon={<CalendarDays className="h-4 w-4" />}
          />

          <Input
            label="تاريخ التسجيل إلى"
            type="date"
            value={values.to}
            min={values.from || undefined}
            onChange={(event) => onChange("to", event.target.value)}
            icon={<CalendarDays className="h-4 w-4" />}
          />

          <div className="hidden items-end xl:flex">
            <div className="flex h-12 w-full items-center gap-3 rounded-2xl border border-dashed border-[#A88042]/25 bg-[#A88042]/5 px-4 text-xs font-bold text-[#4B4B4B]/55">
              <Tags className="h-4 w-4 text-[#A88042]" />
              الفلاتر تطبق على الجدول والتحليلات والتصدير.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
