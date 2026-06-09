"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Loader2, Plus, Tags, Trash2, UsersRound } from "lucide-react";
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
import {
  AttendeeTypeFormInput,
  AttendeeTypeFormValues,
  attendeeTypeSchema,
} from "@/features/attendee-types/attendee-types.schema";
import {
  useAttendeeTypes,
  useCreateAttendeeType,
  useDeleteAttendeeType,
  useUpdateAttendeeType,
} from "@/features/attendee-types/attendee-types.queries";
import { AttendeeType } from "@/features/attendee-types/attendee-types.types";
import { useEvents } from "@/features/events/events.queries";

type PendingAction = "create" | "update" | "delete" | null;

export default function AttendeeTypesPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedAttendeeType, setSelectedAttendeeType] =
    useState<AttendeeType | null>(null);
  const [pendingValues, setPendingValues] =
    useState<AttendeeTypeFormValues | null>(null);

  const attendeeTypesParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
    }),
    [page, eventFilter],
  );

  const attendeeTypesQuery = useAttendeeTypes(attendeeTypesParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const createAttendeeTypeMutation = useCreateAttendeeType();
  const updateAttendeeTypeMutation = useUpdateAttendeeType();
  const deleteAttendeeTypeMutation = useDeleteAttendeeType();

  const form = useForm<AttendeeTypeFormInput, unknown, AttendeeTypeFormValues>({
    resolver: zodResolver(attendeeTypeSchema),
    defaultValues: {
      eventId: "",
      code: "",
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      isActive: true,
      sortOrder: 1,
    },
  });

  const attendeeTypes = attendeeTypesQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const total = attendeeTypesQuery.data?.total ?? attendeeTypes.length;
  const totalPages = attendeeTypesQuery.data?.totalPages ?? 1;

  const isSubmitting =
    createAttendeeTypeMutation.isPending ||
    updateAttendeeTypeMutation.isPending ||
    deleteAttendeeTypeMutation.isPending;

  function openCreateModal() {
    setSelectedAttendeeType(null);
    form.reset({
      eventId: eventFilter || "",
      code: "",
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      isActive: true,
      sortOrder: 1,
    });
    setFormModalOpen(true);
  }

  function openEditModal(attendeeType: AttendeeType) {
    setSelectedAttendeeType(attendeeType);
    form.reset({
      eventId: attendeeType.eventId,
      code: attendeeType.code,
      nameAr: attendeeType.nameAr,
      nameEn: attendeeType.nameEn,
      descriptionAr: attendeeType.descriptionAr ?? "",
      descriptionEn: attendeeType.descriptionEn ?? "",
      isActive: attendeeType.isActive,
      sortOrder: attendeeType.sortOrder ?? 1,
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedAttendeeType(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  const requestSubmit: SubmitHandler<AttendeeTypeFormValues> = (values) => {
    setPendingValues(values);
    setPendingAction(selectedAttendeeType ? "update" : "create");
    setConfirmOpen(true);
  };

  function requestDelete(attendeeType: AttendeeType) {
    setSelectedAttendeeType(attendeeType);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function normalizePayload(values: AttendeeTypeFormValues) {
    return {
      eventId: values.eventId,
      code: values.code.trim().toUpperCase().replace(/\s+/g, "_"),
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      descriptionAr: values.descriptionAr?.trim() || undefined,
      descriptionEn: values.descriptionEn?.trim() || undefined,
      isActive: values.isActive,
      sortOrder: Number(values.sortOrder),
    };
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      attendeeTypes.find((type) => type.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedAttendeeType) {
      deleteAttendeeTypeMutation.mutate(selectedAttendeeType.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedAttendeeType(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedAttendeeType) {
      updateAttendeeTypeMutation.mutate(
        {
          id: selectedAttendeeType.id,
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
      createAttendeeTypeMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة نوع الحضور"
      : pendingAction === "update"
        ? "تأكيد تعديل نوع الحضور"
        : "تأكيد حذف نوع الحضور";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة نوع حضور جديد وربطه بالفعالية المحددة."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات نوع الحضور: ${selectedAttendeeType?.nameAr ?? ""}.`
        : `سيتم حذف نوع الحضور: ${
            selectedAttendeeType?.nameAr ?? ""
          }. تأكد من عدم وجود تسجيلات أو حقول مرتبطة به قبل المتابعة.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendee Types"
        title="أنواع الحضور"
        description="إدارة تصنيفات الحضور داخل كل فعالية مثل زائر، VIP، عارض، متحدث أو موظف."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة نوع حضور
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الأنواع</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <UsersRound className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {attendeeTypes.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge
              variant={attendeeTypesQuery.isFetching ? "warning" : "success"}
            >
              {attendeeTypesQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة أنواع الحضور</CardTitle>
              <CardDescription>
                اختر فعالية ثم أضف أنواع الحضور التي ستظهر لاحقًا في نموذج
                التسجيل.
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
                نوع جديد
              </Button>
            </div>
          </div>

          {attendeeTypesQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل أنواع الحضور...
                </p>
              </div>
            </div>
          ) : attendeeTypesQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل أنواع الحضور
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => attendeeTypesQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : attendeeTypes.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Tags className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد أنواع حضور بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول نوع حضور حتى تتمكن لاحقًا من بناء حقول التسجيل الخاصة
                  به.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة نوع حضور
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع الحضور</TableHead>
                    <TableHead>الكود</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {attendeeTypes.map((attendeeType) => (
                    <TableRow key={attendeeType.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">
                            {attendeeType.nameAr}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {attendeeType.nameEn}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="black">{attendeeType.code}</Badge>
                      </TableCell>

                      <TableCell>
                        {getEventTitle(attendeeType.eventId)}
                      </TableCell>

                      <TableCell className="max-w-[260px] truncate">
                        {attendeeType.descriptionAr ||
                          attendeeType.descriptionEn ||
                          "—"}
                      </TableCell>

                      <TableCell>{attendeeType.sortOrder}</TableCell>

                      <TableCell>
                        <Badge
                          variant={attendeeType.isActive ? "success" : "danger"}
                        >
                          {attendeeType.isActive ? "فعّال" : "معطّل"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(attendeeType)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(attendeeType)}
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
          selectedAttendeeType ? "تعديل نوع الحضور" : "إضافة نوع حضور جديد"
        }
        description={
          selectedAttendeeType
            ? "عدّل بيانات نوع الحضور ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات نوع الحضور واربطه بالفعالية المناسبة."
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
              {selectedAttendeeType ? "متابعة التعديل" : "متابعة الإضافة"}
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
            label="كود نوع الحضور"
            placeholder="VISITOR"
            error={form.formState.errors.code?.message}
            {...form.register("code")}
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

          <Input
            label="الاسم العربي"
            placeholder="زائر"
            error={form.formState.errors.nameAr?.message}
            {...form.register("nameAr")}
          />

          <Input
            label="الاسم الإنجليزي"
            placeholder="Visitor"
            error={form.formState.errors.nameEn?.message}
            {...form.register("nameEn")}
          />

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف العربي
            </label>
            <textarea
              {...form.register("descriptionAr")}
              rows={3}
              placeholder="مثال: زائر عام للفعالية"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف الإنجليزي
            </label>
            <textarea
              {...form.register("descriptionEn")}
              rows={3}
              placeholder="General visitor"
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
          </div>

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 lg:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              {...form.register("isActive")}
            />
            <span className="text-sm font-extrabold text-[#4B4B4B]">
              نوع الحضور فعّال
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
