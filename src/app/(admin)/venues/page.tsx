"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Edit, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
      limit: 20,
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

  function openCreateModal() {
    setSelectedVenue(null);
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

  function requestSubmit(values: VenueFormValues) {
    setPendingValues(values);
    setPendingAction(selectedVenue ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestDelete(venue: Venue) {
    setSelectedVenue(venue);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

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
        : `سيتم حذف المكان: ${selectedVenue?.nameAr ?? ""}. تأكد من عدم وجود مناطق أو نقاط دخول مرتبطة به قبل المتابعة.`;

  return (
    <div className="space-y-6">
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
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الأماكن</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {venues.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={venuesQuery.isFetching ? "warning" : "success"}>
              {venuesQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة الأماكن</CardTitle>
              <CardDescription>
                فلتر حسب الفعالية، ثم أضف أو عدّل الأماكن المرتبطة بها.
              </CardDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-[260px_auto]">
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

              <Button variant="outline" onClick={openCreateModal}>
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
                  لا توجد أماكن بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول مكان للفعالية حتى نكمل بعدها المناطق ونقاط الدخول.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة مكان
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
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
                          <p className="font-extrabold">{venue.nameAr}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {venue.nameEn}
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
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(venue)}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {page} من {totalPages}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
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
            {...form.register("nameAr")}
          />

          <Input
            label="اسم المكان بالإنجليزي"
            placeholder="Main Hall"
            error={form.formState.errors.nameEn?.message}
            {...form.register("nameEn")}
          />

          <Input
            label="المدينة"
            placeholder="Damascus"
            error={form.formState.errors.city?.message}
            {...form.register("city")}
          />

          <Input
            label="الدولة"
            placeholder="Syria"
            error={form.formState.errors.country?.message}
            {...form.register("country")}
          />

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              العنوان العربي
            </label>
            <textarea
              {...form.register("addressAr")}
              rows={3}
              placeholder="مثال: دمشق - طريق المطار"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              العنوان الإنجليزي
            </label>
            <textarea
              {...form.register("addressEn")}
              rows={3}
              placeholder="Damascus - Airport Road"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={
          pendingAction === "create"
            ? "تأكيد الإضافة"
            : pendingAction === "update"
              ? "تأكيد التعديل"
              : "تأكيد الحذف"
        }
        variant={pendingAction === "delete" ? "danger" : "gold"}
        isLoading={isSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
