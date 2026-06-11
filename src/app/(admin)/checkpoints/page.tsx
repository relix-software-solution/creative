"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DoorOpen,
  Edit,
  Loader2,
  MapPinned,
  Plus,
  RefreshCcw,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  useCheckpoints,
  useCreateCheckpoint,
  useDeleteCheckpoint,
  useUpdateCheckpoint,
} from "@/features/checkpoints/checkpoints.queries";
import {
  CheckpointFormInput,
  CheckpointFormValues,
  checkpointSchema,
} from "@/features/checkpoints/checkpoints.schema";
import {
  Checkpoint,
  CheckpointType,
} from "@/features/checkpoints/checkpoints.types";
import { useEvents } from "@/features/events/events.queries";
import { useVenues } from "@/features/venues/venues.queries";
import { useZones } from "@/features/zones/zones.queries";

type PendingAction = "create" | "update" | "delete" | null;

const PAGE_LIMIT = 20;

const checkpointTypeLabels: Record<CheckpointType, string> = {
  ENTRY: "دخول",
  EXIT: "خروج",
  BOTH: "دخول وخروج",
  SESSION_ROOM: "قاعة جلسة",
  VIP_AREA: "منطقة VIP",
  INTERNAL_POINT: "نقطة داخلية",
  WORKSHOP_AREA: "منطقة ورشة",
  OTHER: "أخرى",
};

const checkpointTypeOptions = [
  { label: "دخول", value: "ENTRY" },
  { label: "خروج", value: "EXIT" },
  { label: "دخول وخروج", value: "BOTH" },
  { label: "قاعة جلسة", value: "SESSION_ROOM" },
  { label: "منطقة VIP", value: "VIP_AREA" },
  { label: "نقطة داخلية", value: "INTERNAL_POINT" },
  { label: "منطقة ورشة", value: "WORKSHOP_AREA" },
  { label: "أخرى", value: "OTHER" },
] satisfies { label: string; value: CheckpointType }[];

function normalizePayload(values: CheckpointFormValues) {
  return {
    eventId: values.eventId,
    venueId: values.venueId,
    zoneId: values.zoneId,
    type: values.type,
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    code: values.code.trim().toUpperCase().replace(/\s+/g, "_"),
    allowedAttendeeTypes: values.allowedAttendeeTypes,
    isActive: values.isActive,
    sortOrder: Number(values.sortOrder),
  };
}

export default function CheckpointsPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [selectedCheckpoint, setSelectedCheckpoint] =
    useState<Checkpoint | null>(null);

  const [pendingValues, setPendingValues] =
    useState<CheckpointFormValues | null>(null);

  const checkpointsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      eventId: eventFilter || undefined,
      venueId: venueFilter || undefined,
      zoneId: zoneFilter || undefined,
    }),
    [page, eventFilter, venueFilter, zoneFilter],
  );

  const checkpointsQuery = useCheckpoints(checkpointsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const venuesQuery = useVenues({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const zonesQuery = useZones({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
    venueId: venueFilter || undefined,
  });

  const createCheckpointMutation = useCreateCheckpoint();
  const updateCheckpointMutation = useUpdateCheckpoint();
  const deleteCheckpointMutation = useDeleteCheckpoint();

  const form = useForm<CheckpointFormInput, unknown, CheckpointFormValues>({
    resolver: zodResolver(checkpointSchema),
    defaultValues: {
      eventId: "",
      venueId: "",
      zoneId: "",
      type: "ENTRY",
      nameAr: "",
      nameEn: "",
      code: "",
      allowedAttendeeTypes: "VISITOR",
      isActive: true,
      sortOrder: 1,
    },
  });

  const checkpoints = checkpointsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const venues = venuesQuery.data?.items ?? [];
  const zones = zonesQuery.data?.items ?? [];

  const total = checkpointsQuery.data?.total ?? checkpoints.length;
  const totalPages = checkpointsQuery.data?.totalPages ?? 1;

  const selectedFormEventId = form.watch("eventId");
  const selectedFormVenueId = form.watch("venueId");

  const formVenuesQuery = useVenues({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
  });

  const formZonesQuery = useZones({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
    venueId: selectedFormVenueId || undefined,
  });

  const formVenues = formVenuesQuery.data?.items ?? [];
  const formZones = formZonesQuery.data?.items ?? [];

  const isSubmitting =
    createCheckpointMutation.isPending ||
    updateCheckpointMutation.isPending ||
    deleteCheckpointMutation.isPending;

  const isFiltering = Boolean(eventFilter || venueFilter || zoneFilter);

  useEffect(() => {
    if (!checkpointsQuery.isSuccess) return;

    if (checkpoints.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [checkpoints.length, checkpointsQuery.isSuccess, page]);

  function openCreateModal() {
    setSelectedCheckpoint(null);
    setPendingAction(null);
    setPendingValues(null);

    form.reset({
      eventId: eventFilter || "",
      venueId: venueFilter || "",
      zoneId: zoneFilter || "",
      type: "ENTRY",
      nameAr: "",
      nameEn: "",
      code: "",
      allowedAttendeeTypes: "VISITOR",
      isActive: true,
      sortOrder: 1,
    });

    setFormModalOpen(true);
  }

  function openEditModal(checkpoint: Checkpoint) {
    setSelectedCheckpoint(checkpoint);
    setPendingAction(null);
    setPendingValues(null);

    form.reset({
      eventId: checkpoint.eventId,
      venueId: checkpoint.venueId,
      zoneId: checkpoint.zoneId,
      type: checkpoint.type,
      nameAr: checkpoint.nameAr,
      nameEn: checkpoint.nameEn,
      code: checkpoint.code,
      allowedAttendeeTypes:
        checkpoint.allowedAttendeeTypes?.join(", ") || "VISITOR",
      isActive: checkpoint.isActive,
      sortOrder: checkpoint.sortOrder ?? 1,
    });

    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;

    setFormModalOpen(false);
    setSelectedCheckpoint(null);
    setPendingValues(null);
    setPendingAction(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;

    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  function clearFilters() {
    setPage(1);
    setEventFilter("");
    setVenueFilter("");
    setZoneFilter("");
  }

  const requestSubmit: SubmitHandler<CheckpointFormValues> = (values) => {
    setPendingValues(values);
    setPendingAction(selectedCheckpoint ? "update" : "create");
    setConfirmOpen(true);
  };

  function requestDelete(checkpoint: Checkpoint) {
    setSelectedCheckpoint(checkpoint);
    setPendingAction("delete");
    setPendingValues(null);
    setConfirmOpen(true);
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      checkpoints.find((checkpoint) => checkpoint.eventId === eventId)?.event
        ?.titleAr ||
      "—"
    );
  }

  function getVenueTitle(venueId: string) {
    return (
      venues.find((venue) => venue.id === venueId)?.nameAr ||
      formVenues.find((venue) => venue.id === venueId)?.nameAr ||
      checkpoints.find((checkpoint) => checkpoint.venueId === venueId)?.venue
        ?.nameAr ||
      "—"
    );
  }

  function getZoneTitle(zoneId: string) {
    return (
      zones.find((zone) => zone.id === zoneId)?.nameAr ||
      formZones.find((zone) => zone.id === zoneId)?.nameAr ||
      checkpoints.find((checkpoint) => checkpoint.zoneId === zoneId)?.zone
        ?.nameAr ||
      "—"
    );
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedCheckpoint) {
      deleteCheckpointMutation.mutate(selectedCheckpoint.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedCheckpoint(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedCheckpoint) {
      updateCheckpointMutation.mutate(
        {
          id: selectedCheckpoint.id,
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
      createCheckpointMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة نقطة المسح"
      : pendingAction === "update"
        ? "تأكيد تعديل نقطة المسح"
        : "تأكيد حذف نقطة المسح";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة نقطة مسح جديدة وربطها بالفعالية والمكان والمنطقة المحددة."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات نقطة المسح: ${selectedCheckpoint?.nameAr ?? ""}.`
        : `سيتم تعطيل نقطة المسح: ${
            selectedCheckpoint?.nameAr ?? ""
          }. سيتم إخفاؤها من القائمة مع الحفاظ على سجلات المسح والحركة.`;

  const confirmText =
    pendingAction === "create"
      ? "تأكيد الإضافة"
      : pendingAction === "update"
        ? "تأكيد التعديل"
        : "تأكيد الحذف";

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Checkpoints Management"
        title="إدارة نقاط المسح"
        description="إدارة بوابات الدخول والخروج والنقاط الداخلية داخل المعرض، وهي الأساس الذي سيستخدمه السكانر لتتبع حركة الزوار."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة نقطة
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي نقاط المسح
          </p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {checkpointsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <ScanLine className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {checkpointsQuery.isLoading ? "..." : checkpoints.length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge
              variant={checkpointsQuery.isFetching ? "warning" : "success"}
            >
              {checkpointsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => checkpointsQuery.refetch()}
              disabled={checkpointsQuery.isFetching}
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  checkpointsQuery.isFetching ? "animate-spin" : ""
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
              <CardTitle>قائمة نقاط المسح</CardTitle>

              <CardDescription>
                فلتر حسب الفعالية والمكان والمنطقة، ثم أضف أو عدّل نقاط المسح.
              </CardDescription>
            </div>

            <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 xl:w-auto">
              <div className="min-w-[220px]">
                <Select
                  value={eventFilter}
                  placeholder="كل الفعاليات"
                  onChange={(value) => {
                    setPage(1);
                    setEventFilter(value);
                    setVenueFilter("");
                    setZoneFilter("");
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

              <div className="min-w-[220px]">
                <Select
                  value={venueFilter}
                  placeholder="كل الأماكن"
                  disabled={!eventFilter}
                  onChange={(value) => {
                    setPage(1);
                    setVenueFilter(value);
                    setZoneFilter("");
                  }}
                  options={[
                    { label: "كل الأماكن", value: "" },
                    ...venues.map((venue) => ({
                      label: venue.nameAr,
                      value: venue.id,
                    })),
                  ]}
                />
              </div>

              <div className="min-w-[220px]">
                <Select
                  value={zoneFilter}
                  placeholder="كل المناطق"
                  disabled={!venueFilter}
                  onChange={(value) => {
                    setPage(1);
                    setZoneFilter(value);
                  }}
                  options={[
                    { label: "كل المناطق", value: "" },
                    ...zones.map((zone) => ({
                      label: zone.nameAr,
                      value: zone.id,
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
                نقطة جديدة
              </Button>
            </div>
          </div>

          {checkpointsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل نقاط المسح...
                </p>
              </div>
            </div>
          ) : checkpointsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل نقاط المسح
                </p>

                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
                </p>

                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => checkpointsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <DoorOpen className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  {isFiltering
                    ? "لا توجد نقاط مسح مطابقة"
                    : "لا توجد نقاط مسح بعد"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل الفلاتر أو امسحها لعرض كل نقاط المسح."
                    : "أضف أول نقطة مسح حتى تصبح جاهزة للربط مع الأجهزة والسكانر."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  ) : null}

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    إضافة نقطة
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
                      <TableHead>النقطة</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الكود</TableHead>
                      <TableHead>المكان / المنطقة</TableHead>
                      <TableHead>أنواع الحضور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {checkpoints.map((checkpoint) => (
                      <TableRow key={checkpoint.id}>
                        <TableCell>
                          <div>
                            <p className="font-extrabold text-[#4B4B4B]">
                              {checkpoint.nameAr}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                              {checkpoint.nameEn}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#A88042]">
                              {getEventTitle(checkpoint.eventId)}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/35">
                              ID: {checkpoint.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="gold">
                            {checkpointTypeLabels[checkpoint.type] ??
                              checkpoint.type}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant="black">{checkpoint.code}</Badge>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-bold text-[#4B4B4B]">
                              {getVenueTitle(checkpoint.venueId)}
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                              {getZoneTitle(checkpoint.zoneId)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {checkpoint.allowedAttendeeTypes?.length ? (
                              checkpoint.allowedAttendeeTypes.map((type) => (
                                <Badge key={type} variant="muted">
                                  {type}
                                </Badge>
                              ))
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={checkpoint.isActive ? "success" : "danger"}
                          >
                            {checkpoint.isActive ? "فعّالة" : "معطّلة"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(checkpoint)}
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4" />
                              تعديل
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => requestDelete(checkpoint)}
                              disabled={isSubmitting}
                            >
                              {deleteCheckpointMutation.isPending &&
                              selectedCheckpoint?.id === checkpoint.id ? (
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
                  الصفحة {page} من {totalPages} — عرض {checkpoints.length} من
                  أصل {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || checkpointsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages || checkpointsQuery.isFetching}
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
        title={selectedCheckpoint ? "تعديل نقطة المسح" : "إضافة نقطة مسح جديدة"}
        description={
          selectedCheckpoint
            ? "عدّل بيانات نقطة المسح ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات نقطة المسح واربطها بالفعالية والمكان والمنطقة."
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
              {selectedCheckpoint ? "متابعة التعديل" : "متابعة الإضافة"}
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

              form.setValue("zoneId", "", {
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

              form.setValue("zoneId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={formVenues.map((venue) => ({
              label: venue.nameAr,
              value: venue.id,
            }))}
          />

          <Select
            label="المنطقة"
            className="lg:col-span-2"
            value={form.watch("zoneId")}
            placeholder="اختر المنطقة"
            disabled={!form.watch("venueId")}
            error={form.formState.errors.zoneId?.message}
            onChange={(value) => {
              form.setValue("zoneId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={formZones.map((zone) => ({
              label: zone.nameAr,
              value: zone.id,
            }))}
          />

          <Select
            label="نوع نقطة المسح"
            value={form.watch("type")}
            error={form.formState.errors.type?.message}
            onChange={(value) => {
              form.setValue("type", value as CheckpointType, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={checkpointTypeOptions}
          />

          <Input
            label="كود النقطة"
            placeholder="MAIN_ENTRANCE"
            error={form.formState.errors.code?.message}
            disabled={isSubmitting}
            {...form.register("code")}
          />

          <Input
            label="اسم النقطة بالعربي"
            placeholder="مثال: بوابة الدخول الرئيسية"
            error={form.formState.errors.nameAr?.message}
            disabled={isSubmitting}
            {...form.register("nameAr")}
          />

          <Input
            label="اسم النقطة بالإنجليزي"
            placeholder="Main Entrance"
            error={form.formState.errors.nameEn?.message}
            disabled={isSubmitting}
            {...form.register("nameEn")}
          />

          <Input
            label="أنواع الحضور المسموحة"
            placeholder="VISITOR, VIP"
            error={form.formState.errors.allowedAttendeeTypes?.message}
            disabled={isSubmitting}
            {...form.register("allowedAttendeeTypes")}
          />

          <Input
            label="الترتيب"
            type="number"
            min={0}
            error={form.formState.errors.sortOrder?.message}
            disabled={isSubmitting}
            {...form.register("sortOrder", {
              valueAsNumber: true,
            })}
          />

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 lg:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              disabled={isSubmitting}
              {...form.register("isActive")}
            />

            <span className="text-sm font-extrabold text-[#4B4B4B]">
              نقطة المسح فعّالة
            </span>
          </label>

          <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4 lg:col-span-2">
            <div className="flex gap-3">
              <MapPinned className="mt-1 h-5 w-5 shrink-0 text-[#A88042]" />

              <div>
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  ملاحظة تشغيلية
                </p>

                <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/60">
                  استخدم ENTRY للبوابة الرئيسية، INTERNAL_POINT للنقاط داخل
                  المعرض، و EXIT لبوابة الخروج. لاحقًا سيظهر أثر كل Scan ضمن
                  تتبع حركة الزائر.
                </p>
              </div>
            </div>
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
