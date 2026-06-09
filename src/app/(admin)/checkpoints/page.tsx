"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DoorOpen,
  Edit,
  Loader2,
  MapPinned,
  Plus,
  ScanLine,
  Trash2,
} from "lucide-react";
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
import { useCheckpoints } from "@/features/checkpoints/checkpoints.queries";
import {
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

const checkpointTypeLabels: Record<CheckpointType, string> = {
  ENTRY_GATE: "بوابة دخول",
  EXIT_GATE: "بوابة خروج",
  REGISTRATION_DESK: "مكتب تسجيل",
  INFO_DESK: "مكتب معلومات",
  OTHER: "أخرى",
};

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
      limit: 20,
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
      type: "ENTRY_GATE",
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

  function openCreateModal() {
    setSelectedCheckpoint(null);
    form.reset({
      eventId: eventFilter || "",
      venueId: venueFilter || "",
      zoneId: zoneFilter || "",
      type: "ENTRY_GATE",
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
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  const requestSubmit: SubmitHandler<CheckpointFormValues> = (values) => {
    setPendingValues(values);
    setPendingAction(selectedCheckpoint ? "update" : "create");
    setConfirmOpen(true);
  };

  function requestDelete(checkpoint: Checkpoint) {
    setSelectedCheckpoint(checkpoint);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

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
      ? "تأكيد إضافة نقطة الدخول"
      : pendingAction === "update"
        ? "تأكيد تعديل نقطة الدخول"
        : "تأكيد حذف نقطة الدخول";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة نقطة دخول جديدة وربطها بالفعالية والمكان والمنطقة المحددة."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات نقطة الدخول: ${selectedCheckpoint?.nameAr ?? ""}.`
        : `سيتم حذف نقطة الدخول: ${
            selectedCheckpoint?.nameAr ?? ""
          }. تأكد من عدم اعتماد جهاز سكانر عليها قبل المتابعة.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Checkpoints Management"
        title="إدارة نقاط الدخول"
        description="إدارة بوابات الدخول والخروج ونقاط التحقق المرتبطة بالمناطق، وهي الأساس الذي سيستخدمه السكانر لاحقًا."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة نقطة
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي النقاط</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <ScanLine className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {checkpoints.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge
              variant={checkpointsQuery.isFetching ? "warning" : "success"}
            >
              {checkpointsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة نقاط الدخول</CardTitle>
              <CardDescription>
                فلتر حسب الفعالية والمكان والمنطقة، ثم أضف أو عدّل نقاط الدخول.
              </CardDescription>
            </div>

            <div className="grid gap-3 md:grid-cols-[220px_220px_220px_auto]">
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

              <Button variant="outline" onClick={openCreateModal}>
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
                  جاري تحميل نقاط الدخول...
                </p>
              </div>
            </div>
          ) : checkpointsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل نقاط الدخول
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
                  لا توجد نقاط دخول بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول نقطة دخول حتى تصبح جاهزة للربط مع الأجهزة والسكانر.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة نقطة
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
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
                          <p className="font-extrabold">{checkpoint.nameAr}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {checkpoint.nameEn}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#A88042]">
                            {getEventTitle(checkpoint.eventId)}
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
                          <p className="font-bold">
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
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(checkpoint)}
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
        title={
          selectedCheckpoint ? "تعديل نقطة الدخول" : "إضافة نقطة دخول جديدة"
        }
        description={
          selectedCheckpoint
            ? "عدّل بيانات نقطة الدخول ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات نقطة الدخول واربطها بالفعالية والمكان والمنطقة."
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
            label="نوع النقطة"
            value={form.watch("type")}
            error={form.formState.errors.type?.message}
            onChange={(value) => {
              form.setValue("type", value as CheckpointType, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: "بوابة دخول", value: "ENTRY_GATE" },
              { label: "بوابة خروج", value: "EXIT_GATE" },
              { label: "مكتب تسجيل", value: "REGISTRATION_DESK" },
              { label: "مكتب معلومات", value: "INFO_DESK" },
              { label: "أخرى", value: "OTHER" },
            ]}
          />

          <Input
            label="كود النقطة"
            placeholder="MAIN_GATE"
            error={form.formState.errors.code?.message}
            {...form.register("code")}
          />

          <Input
            label="اسم النقطة بالعربي"
            placeholder="مثال: البوابة الرئيسية"
            error={form.formState.errors.nameAr?.message}
            {...form.register("nameAr")}
          />

          <Input
            label="اسم النقطة بالإنجليزي"
            placeholder="Main Gate"
            error={form.formState.errors.nameEn?.message}
            {...form.register("nameEn")}
          />

          <Input
            label="أنواع الحضور المسموحة"
            placeholder="VISITOR, VIP"
            error={form.formState.errors.allowedAttendeeTypes?.message}
            {...form.register("allowedAttendeeTypes")}
          />

          <Input
            label="الترتيب"
            type="number"
            min={0}
            error={form.formState.errors.sortOrder?.message}
            {...form.register("sortOrder", {
              valueAsNumber: true,
            })}
          />

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 lg:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              {...form.register("isActive")}
            />
            <span className="text-sm font-extrabold text-[#4B4B4B]">
              نقطة الدخول فعّالة
            </span>
          </label>
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
