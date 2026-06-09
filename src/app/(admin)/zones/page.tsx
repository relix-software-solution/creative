"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Layers3, Loader2, MapPinned, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
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
import { useVenues } from "@/features/venues/venues.queries";
import {
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useZones,
} from "@/features/zones/zones.queries";
import {
  ZoneFormInput,
  ZoneFormValues,
  zoneSchema,
} from "@/features/zones/zones.schema";
import { Zone } from "@/features/zones/zones.types";

type PendingAction = "create" | "update" | "delete" | null;

export default function ZonesPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [pendingValues, setPendingValues] = useState<ZoneFormValues | null>(
    null,
  );

  const zonesParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
      venueId: venueFilter || undefined,
    }),
    [page, eventFilter, venueFilter],
  );

  const zonesQuery = useZones(zonesParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const venuesQuery = useVenues({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const createZoneMutation = useCreateZone();
  const updateZoneMutation = useUpdateZone();
  const deleteZoneMutation = useDeleteZone();

  const form = useForm<ZoneFormInput, unknown, ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      eventId: "",
      venueId: "",
      nameAr: "",
      nameEn: "",
      code: "",
      sortOrder: 1,
    },
  });

  const zones = zonesQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const venues = venuesQuery.data?.items ?? [];
  const total = zonesQuery.data?.total ?? zones.length;
  const totalPages = zonesQuery.data?.totalPages ?? 1;

  const selectedFormEventId = form.watch("eventId");

  const formVenuesQuery = useVenues({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
  });

  const formVenues = formVenuesQuery.data?.items ?? [];

  const isSubmitting =
    createZoneMutation.isPending ||
    updateZoneMutation.isPending ||
    deleteZoneMutation.isPending;

  function openCreateModal() {
    setSelectedZone(null);
    form.reset({
      eventId: eventFilter || "",
      venueId: venueFilter || "",
      nameAr: "",
      nameEn: "",
      code: "",
      sortOrder: 1,
    });
    setFormModalOpen(true);
  }

  function openEditModal(zone: Zone) {
    setSelectedZone(zone);
    form.reset({
      eventId: zone.eventId,
      venueId: zone.venueId,
      nameAr: zone.nameAr,
      nameEn: zone.nameEn,
      code: zone.code,
      sortOrder: zone.sortOrder ?? 1,
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedZone(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  const requestSubmit: SubmitHandler<ZoneFormValues> = (values) => {
    setPendingValues(values);
    setPendingAction(selectedZone ? "update" : "create");
    setConfirmOpen(true);
  };

  function requestDelete(zone: Zone) {
    setSelectedZone(zone);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function normalizePayload(values: ZoneFormValues) {
    return {
      eventId: values.eventId,
      venueId: values.venueId,
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      code: values.code.trim().toUpperCase().replace(/\s+/g, "_"),
      sortOrder: Number(values.sortOrder),
    };
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      zones.find((zone) => zone.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function getVenueTitle(venueId: string) {
    return (
      venues.find((venue) => venue.id === venueId)?.nameAr ||
      formVenues.find((venue) => venue.id === venueId)?.nameAr ||
      zones.find((zone) => zone.venueId === venueId)?.venue?.nameAr ||
      "—"
    );
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedZone) {
      deleteZoneMutation.mutate(selectedZone.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedZone(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedZone) {
      updateZoneMutation.mutate(
        {
          id: selectedZone.id,
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
      createZoneMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة المنطقة"
      : pendingAction === "update"
        ? "تأكيد تعديل المنطقة"
        : "تأكيد حذف المنطقة";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة منطقة جديدة وربطها بالمكان والفعالية المحددين."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات المنطقة: ${selectedZone?.nameAr ?? ""}.`
        : `سيتم حذف المنطقة: ${selectedZone?.nameAr ?? ""}. تأكد من عدم وجود نقاط دخول مرتبطة بها قبل المتابعة.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Zones Management"
        title="إدارة المناطق"
        description="تقسيم المكان إلى مناطق تشغيلية مثل منطقة الدخول، منطقة VIP، منطقة العارضين، أو أي تقسيم داخلي."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة منطقة
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي المناطق</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Layers3 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {zones.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={zonesQuery.isFetching ? "warning" : "success"}>
              {zonesQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة المناطق</CardTitle>
              <CardDescription>
                فلتر حسب الفعالية والمكان، ثم أضف أو عدّل المناطق.
              </CardDescription>
            </div>

            <div className="grid gap-3 md:grid-cols-[240px_240px_auto]">
              <Select
                value={eventFilter}
                placeholder="كل الفعاليات"
                onChange={(value) => {
                  setPage(1);
                  setEventFilter(value);
                  setVenueFilter("");
                }}
                options={[
                  { label: "كل الفعاليات", value: "" },
                  ...events.map((event) => ({
                    label: event.titleAr,
                    value: event.id,
                  })),
                ]}
              />

              <Select
                value={venueFilter}
                placeholder="كل الأماكن"
                disabled={!eventFilter}
                onChange={(value) => {
                  setPage(1);
                  setVenueFilter(value);
                }}
                options={[
                  { label: "كل الأماكن", value: "" },
                  ...venues.map((venue) => ({
                    label: venue.nameAr,
                    value: venue.id,
                  })),
                ]}
              />

              <Button variant="outline" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                منطقة جديدة
              </Button>
            </div>
          </div>

          {zonesQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل المناطق...
                </p>
              </div>
            </div>
          ) : zonesQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل المناطق
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => zonesQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : zones.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <MapPinned className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد مناطق بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول منطقة داخل المكان حتى نكمل بعدها نقاط الدخول.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة منطقة
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنطقة</TableHead>
                    <TableHead>الكود</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>المكان</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">{zone.nameAr}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {zone.nameEn}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="black">{zone.code}</Badge>
                      </TableCell>

                      <TableCell>{getEventTitle(zone.eventId)}</TableCell>
                      <TableCell>{getVenueTitle(zone.venueId)}</TableCell>

                      <TableCell>{zone.sortOrder}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(zone)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(zone)}
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
        title={selectedZone ? "تعديل المنطقة" : "إضافة منطقة جديدة"}
        description={
          selectedZone
            ? "عدّل بيانات المنطقة ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات المنطقة واربطها بالفعالية والمكان المناسبين."
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
              {selectedZone ? "متابعة التعديل" : "متابعة الإضافة"}
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
              form.setValue("venueId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={events.map((event) => ({
              label: event.titleAr,
              value: event.id,
            }))}
          />

          <Select
            label="المكان"
            className="lg:col-span-2"
            value={form.watch("venueId")}
            placeholder="اختر المكان"
            disabled={!form.watch("eventId")}
            error={form.formState.errors.venueId?.message}
            onChange={(value) => {
              form.setValue("venueId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={formVenues.map((venue) => ({
              label: venue.nameAr,
              value: venue.id,
            }))}
          />

          <Input
            label="اسم المنطقة بالعربي"
            placeholder="مثال: منطقة الدخول"
            error={form.formState.errors.nameAr?.message}
            {...form.register("nameAr")}
          />

          <Input
            label="اسم المنطقة بالإنجليزي"
            placeholder="Entry Zone"
            error={form.formState.errors.nameEn?.message}
            {...form.register("nameEn")}
          />

          <Input
            label="كود المنطقة"
            placeholder="ENTRY_ZONE"
            error={form.formState.errors.code?.message}
            {...form.register("code")}
          />

          <Input
            label="الترتيب"
            type="number"
            min={0}
            error={form.formState.errors.sortOrder?.message}
            {...form.register("sortOrder")}
          />
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
