"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Edit,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
  useCreateVenue,
  useDeleteVenue,
  useUpdateVenue,
  useVenues,
} from "@/features/venues/venues.queries";
import { VenueFormValues, venueSchema } from "@/features/venues/venues.schema";
import { Venue } from "@/features/venues/venues.types";

type PendingAction = "create" | "update" | "delete" | null;

const PAGE_LIMIT = 20;

function normalizePayload(values: VenueFormValues) {
  return {
    eventId: values.eventId,
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    addressAr: values.addressAr?.trim() || undefined,
    addressEn: values.addressEn?.trim() || undefined,
    city: values.city.trim(),
    country: values.country.trim(),
  };
}

export default function VenuesPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [pendingValues, setPendingValues] = useState<VenueFormValues | null>(
    null,
  );

  const venuesParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      eventId: eventFilter || undefined,
    }),
    [page, eventFilter],
  );

  const venuesQuery = useVenues(venuesParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const createVenueMutation = useCreateVenue();
  const updateVenueMutation = useUpdateVenue();
  const deleteVenueMutation = useDeleteVenue();

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      eventId: "",
      nameAr: "",
      nameEn: "",
      addressAr: "",
      addressEn: "",
      city: "Damascus",
      country: "Syria",
    },
  });

  const venues = venuesQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const total = venuesQuery.data?.total ?? venues.length;
  const totalPages = venuesQuery.data?.totalPages ?? 1;

  const isSubmitting =
    createVenueMutation.isPending ||
    updateVenueMutation.isPending ||
    deleteVenueMutation.isPending;

  const isFiltering = Boolean(eventFilter);

  useEffect(() => {
    if (!venuesQuery.isSuccess) return;

    if (venues.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [venues.length, venuesQuery.isSuccess, page]);

  function openCreateModal() {
    setSelectedVenue(null);
    setPendingValues(null);

    form.reset({
      eventId: eventFilter || "",
      nameAr: "",
      nameEn: "",
      addressAr: "",
      addressEn: "",
      city: "Damascus",
      country: "Syria",
    });

    setFormModalOpen(true);
  }

  function openEditModal(venue: Venue) {
    setSelectedVenue(venue);
    setPendingValues(null);

    form.reset({
      eventId: venue.eventId,
      nameAr: venue.nameAr,
      nameEn: venue.nameEn,
      addressAr: venue.addressAr ?? "",
      addressEn: venue.addressEn ?? "",
      city: venue.city ?? "",
      country: venue.country ?? "",
    });

    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;

    setFormModalOpen(false);
    setSelectedVenue(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;

    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  function clearFilters() {
    setEventFilter("");
    setPage(1);
  }

  function requestSubmit(values: VenueFormValues) {
    setPendingValues(values);
    setPendingAction(selectedVenue ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestDelete(venue: Venue) {
    setSelectedVenue(venue);
    setPendingValues(null);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedVenue) {
      deleteVenueMutation.mutate(selectedVenue.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedVenue(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedVenue) {
      updateVenueMutation.mutate(
        {
          id: selectedVenue.id,
          payload,
        },
        {
          onSuccess: () => {
            closeConfirm();
            closeFormModal();
          },
        },
      );

      return;
    }

    if (pendingAction === "create") {
      createVenueMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      venues.find((venue) => venue.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة المكان"
      : pendingAction === "update"
        ? "تأكيد تعديل المكان"
        : "تأكيد حذف المكان";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة مكان جديد وربطه بالفعالية المحددة."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات المكان: ${selectedVenue?.nameAr ?? ""}.`
        : `سيتم حذف المكان: ${selectedVenue?.nameAr ?? ""}. لا يمكن حذف المكان إذا كان مرتبطًا بمناطق أو نقاط دخول.`;

  const confirmText =
    pendingAction === "create"
      ? "تأكيد الإضافة"
      : pendingAction === "update"
        ? "تأكيد التعديل"
        : "تأكيد الحذف";

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Locations Management"
        title="إدارة الأماكن"
        description="إدارة القاعات أو المواقع المرتبطة بكل فعالية، وهي الخطوة التي تسبق إنشاء المناطق ونقاط الدخول."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة مكان
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الأماكن</p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {venuesQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {venuesQuery.isLoading ? "..." : venues.length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge variant={venuesQuery.isFetching ? "warning" : "success"}>
              {venuesQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => venuesQuery.refetch()}
              disabled={venuesQuery.isFetching}
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  venuesQuery.isFetching ? "animate-spin" : ""
                }`}
              />
              تحديث
            </Button>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة الأماكن</CardTitle>

              <CardDescription>
                فلتر حسب الفعالية، ثم أضف أو عدّل الأماكن المرتبطة بها.
              </CardDescription>
            </div>

            <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 xl:w-auto">
              <div className="min-w-[260px]">
                <Select
                  value={eventFilter}
                  placeholder="كل الفعاليات"
                  onChange={(value) => {
                    setPage(1);
                    setEventFilter(value);
                  }}
                  options={[
                    { label: "كل الفعاليات", value: "" },
                    ...events.map((event) => ({
                      label: event.titleAr,
                      value: event.id,
                    })),
                  ]}
                />
              </div>

              {isFiltering ? (
                <Button
                  className="shrink-0"
                  variant="outline"
                  onClick={clearFilters}
                >
                  مسح
                </Button>
              ) : null}

              <Button
                className="shrink-0"
                variant="outline"
                onClick={openCreateModal}
              >
                <Plus className="h-4 w-4" />
                مكان جديد
              </Button>
            </div>
          </div>

          {venuesQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل الأماكن...
                </p>
              </div>
            </div>
          ) : venuesQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل الأماكن
                </p>

                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
                </p>

                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => venuesQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : venues.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <MapPin className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  {isFiltering
                    ? "لا توجد أماكن لهذه الفعالية"
                    : "لا توجد أماكن بعد"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب اختيار فعالية أخرى أو امسح الفلتر لعرض كل الأماكن."
                    : "أضف أول مكان للفعالية حتى نكمل بعدها المناطق ونقاط الدخول."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلتر
                    </Button>
                  ) : null}

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    إضافة مكان
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-black/5">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F8FF]">
                      <TableHead>المكان</TableHead>
                      <TableHead>الفعالية</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>الدولة</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <div>
                            <p className="font-extrabold text-[#4B4B4B]">
                              {venue.nameAr}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                              {venue.nameEn}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/35">
                              ID: {venue.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>{getEventTitle(venue.eventId)}</TableCell>

                        <TableCell>{venue.city || "—"}</TableCell>

                        <TableCell>{venue.country || "—"}</TableCell>

                        <TableCell className="max-w-[260px] truncate">
                          {venue.addressAr || venue.addressEn || "—"}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(venue)}
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4" />
                              تعديل
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => requestDelete(venue)}
                              disabled={isSubmitting}
                            >
                              {deleteVenueMutation.isPending &&
                              selectedVenue?.id === venue.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {page} من {totalPages} — عرض {venues.length} من أصل{" "}
                  {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || venuesQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages || venuesQuery.isFetching}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={formModalOpen}
        onClose={closeFormModal}
        title={selectedVenue ? "تعديل المكان" : "إضافة مكان جديد"}
        description={
          selectedVenue
            ? "عدّل بيانات المكان ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات المكان واربطه بالفعالية المناسبة."
        }
        className="max-w-3xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(requestSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {selectedVenue ? "متابعة التعديل" : "متابعة الإضافة"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={form.handleSubmit(requestSubmit)}
        >
          <Select
            label="الفعالية"
            className="lg:col-span-2"
            value={form.watch("eventId")}
            placeholder="اختر الفعالية"
            error={form.formState.errors.eventId?.message}
            onChange={(value) => {
              form.setValue("eventId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={events.map((event) => ({
              label: event.titleAr,
              value: event.id,
            }))}
          />

          <Input
            label="اسم المكان بالعربي"
            placeholder="مثال: القاعة الرئيسية"
            error={form.formState.errors.nameAr?.message}
            disabled={isSubmitting}
            {...form.register("nameAr")}
          />

          <Input
            label="اسم المكان بالإنجليزي"
            placeholder="Main Hall"
            error={form.formState.errors.nameEn?.message}
            disabled={isSubmitting}
            {...form.register("nameEn")}
          />

          <Input
            label="المدينة"
            placeholder="Damascus"
            error={form.formState.errors.city?.message}
            disabled={isSubmitting}
            {...form.register("city")}
          />

          <Input
            label="الدولة"
            placeholder="Syria"
            error={form.formState.errors.country?.message}
            disabled={isSubmitting}
            {...form.register("country")}
          />

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              العنوان العربي
            </label>

            <textarea
              {...form.register("addressAr")}
              rows={3}
              disabled={isSubmitting}
              placeholder="مثال: دمشق - طريق المطار"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              العنوان الإنجليزي
            </label>

            <textarea
              {...form.register("addressEn")}
              rows={3}
              disabled={isSubmitting}
              placeholder="Damascus - Airport Road"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={confirmText}
        variant={pendingAction === "delete" ? "danger" : "gold"}
        isLoading={isSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
