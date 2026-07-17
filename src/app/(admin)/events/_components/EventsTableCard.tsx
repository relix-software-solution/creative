"use client";

import {
  CalendarDays,
  Edit,
  IdCard,
  ImageIcon,
  Loader2,
  MessageCircleMore,
  Plus,
  QrCode,
  Search,
  TicketCheck,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventItem } from "@/features/events/events.types";
import {
  eventTypeLabels,
  formatDate,
  getEventLogo,
  resolveAssetUrl,
} from "../_lib/events-page.utils";

export function EventsTableCard({
  events,
  clients,
  total,
  totalPages,
  page,
  searchInput,
  clientFilter,
  isLoading,
  isError,
  isFetching,
  isSubmitting,
  isFiltering,
  deletingEventId,
  onSearchInputChange,
  onClientFilterChange,
  onSearch,
  onClearFilters,
  onCreate,
  onEdit,
  onOpenBadge,
  onOpenDigitalTicket,
  onOpenWhatsAppMessage,
  onDelete,
  onOpenRegistrationQr,
  onRefetch,
  onPageChange,
}: {
  events: EventItem[];
  clients: Array<{ id: string; name: string }>;
  total: number;
  totalPages: number;
  page: number;
  searchInput: string;
  clientFilter: string;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isSubmitting: boolean;
  isFiltering: boolean;
  deletingEventId?: string;
  onSearchInputChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onCreate: () => void;
  onEdit: (event: EventItem) => void;
  onOpenDigitalTicket: (event: EventItem) => void;
  onOpenBadge: (event: EventItem) => void;
  onOpenWhatsAppMessage: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onOpenRegistrationQr: (event: EventItem) => void;
  onRefetch: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="overflow-hidden border-black/5 shadow-sm">
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>قائمة الفعاليات</CardTitle>

            <CardDescription>
              استعرض الفعاليات وابحث أو فلتر حسب العميل.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-[280px]">
              <Input
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSearch();
                  }
                }}
                placeholder="ابحث باسم الفعالية..."
                icon={<Search className="h-5 w-5" />}
              />

              {searchInput ? (
                <button
                  type="button"
                  onClick={() => onSearchInputChange("")}
                  className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#4B4B4B]/45 transition hover:bg-black/5 hover:text-[#4B4B4B]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="w-full lg:w-[220px]">
              <Select
                value={clientFilter}
                placeholder="كل العملاء"
                onChange={onClientFilterChange}
                options={[
                  { label: "كل العملاء", value: "" },
                  ...clients.map((client) => ({
                    label: client.name,
                    value: client.id,
                  })),
                ]}
              />
            </div>

            <Button
              className="w-full lg:w-auto"
              variant="secondary"
              onClick={onSearch}
            >
              بحث
            </Button>

            {isFiltering ? (
              <Button
                className="w-full lg:w-auto"
                variant="outline"
                onClick={onClearFilters}
              >
                مسح
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

              <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                جاري تحميل الفعاليات...
              </p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
            <div className="text-center">
              <p className="text-lg font-extrabold text-red-700">
                تعذر تحميل الفعاليات
              </p>

              <Button className="mt-4" variant="danger" onClick={onRefetch}>
                إعادة المحاولة
              </Button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                <CalendarDays className="h-7 w-7" />
              </div>

              <p className="text-lg font-extrabold text-[#4B4B4B]">
                {isFiltering ? "لا توجد نتائج مطابقة" : "لا توجد فعاليات بعد"}
              </p>

              <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                {isFiltering
                  ? "جرّب تعديل البحث أو مسح الفلاتر."
                  : "أضف أول فعالية مع هويتها البصرية."}
              </p>

              <div className="mt-5 flex justify-center gap-2">
                {isFiltering ? (
                  <Button variant="outline" onClick={onClearFilters}>
                    مسح الفلاتر
                  </Button>
                ) : null}

                <Button onClick={onCreate}>
                  <Plus className="h-4 w-4" />
                  إضافة فعالية
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-3xl border border-black/5">
              <Table className="min-w-[1120px] table-fixed">
                <TableHeader>
                  <TableRow className="bg-[#F8F8FF]">
                    <TableHead className="w-[27%]">الفعالية</TableHead>

                    <TableHead className="w-[16%]">العميل</TableHead>

                    <TableHead className="w-[10%]">النوع</TableHead>

                    <TableHead className="w-[12%]">البداية</TableHead>

                    <TableHead className="w-[12%]">النهاية</TableHead>

                    <TableHead className="w-[7%]">QR</TableHead>

                    <TableHead className="w-[16%] text-center">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {events.map((event) => {
                    const logoUrl = getEventLogo(event);

                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8FF]">
                              {logoUrl ? (
                                <img
                                  src={resolveAssetUrl(logoUrl)}
                                  alt={event.titleAr}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-[#A88042]" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-[#4B4B4B]">
                                {event.titleAr}
                              </p>

                              <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                {event.titleEn}
                              </p>

                              <p
                                dir="ltr"
                                className="mt-1 truncate text-left text-xs font-bold text-[#4B4B4B]/35"
                              >
                                ID: {event.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="truncate font-bold">
                            {event.client?.name ||
                              clients.find(
                                (client) => client.id === event.clientId,
                              )?.name ||
                              "—"}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Badge variant="gold">
                            {eventTypeLabels[event.type]}
                          </Badge>
                        </TableCell>

                        <TableCell>{formatDate(event.startsAt)}</TableCell>

                        <TableCell>{formatDate(event.endsAt)}</TableCell>

                        <TableCell>
                          <Badge
                            variant={event.allowReEntry ? "success" : "muted"}
                          >
                            {event.allowReEntry ? "عودة" : "مرة"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              title="تعديل الفعالية"
                              aria-label="تعديل الفعالية"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => onEdit(event)}
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="إعداد البادج"
                              aria-label="إعداد البادج"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => onOpenBadge(event)}
                              disabled={isSubmitting}
                            >
                              <IdCard className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="تصميم بطاقة الدخول"
                              aria-label="تصميم بطاقة الدخول"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => onOpenDigitalTicket(event)}
                              disabled={isSubmitting}
                            >
                              <TicketCheck className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="رسالة WhatsApp"
                              aria-label="رسالة WhatsApp"
                              className="h-8 w-8 shrink-0 p-0 text-emerald-700"
                              onClick={() => onOpenWhatsAppMessage(event)}
                              disabled={isSubmitting}
                            >
                              <MessageCircleMore className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="QR رابط التسجيل"
                              aria-label="QR رابط التسجيل"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => onOpenRegistrationQr(event)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              title="حذف الفعالية"
                              aria-label="حذف الفعالية"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => onDelete(event)}
                              disabled={isSubmitting}
                            >
                              {deletingEventId === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[#4B4B4B]/55">
                الصفحة {page} من {totalPages} — عرض {events.length} من أصل{" "}
                {total}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1 || isFetching}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                  السابق
                </Button>

                <Button
                  variant="outline"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                  التالي
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
