"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  FileInput,
  ListChecks,
  Loader2,
  Plus,
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
import { useAttendeeTypes } from "@/features/attendee-types/attendee-types.queries";
import { useEvents } from "@/features/events/events.queries";
import {
  RegistrationFieldFormInput,
  RegistrationFieldFormValues,
  registrationFieldSchema,
} from "@/features/registration-fields/registration-fields.schema";
import {
  useCreateRegistrationField,
  useDeleteRegistrationField,
  useRegistrationFields,
  useUpdateRegistrationField,
} from "@/features/registration-fields/registration-fields.queries";
import {
  RegistrationField,
  RegistrationFieldType,
} from "@/features/registration-fields/registration-fields.types";

type PendingAction = "create" | "update" | "delete" | null;

const fieldTypeLabels: Record<RegistrationFieldType, string> = {
  TEXT: "نص قصير",
  TEXTAREA: "نص طويل",
  EMAIL: "بريد إلكتروني",
  PHONE: "رقم هاتف",
  NUMBER: "رقم",
  DATE: "تاريخ",
  SELECT: "قائمة اختيار",
  CHECKBOX: "مربع اختيار",
};

export default function RegistrationFieldsPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [attendeeTypeFilter, setAttendeeTypeFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedField, setSelectedField] = useState<RegistrationField | null>(
    null,
  );
  const [pendingValues, setPendingValues] =
    useState<RegistrationFieldFormValues | null>(null);

  const fieldsParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
      attendeeTypeId: attendeeTypeFilter || undefined,
    }),
    [page, eventFilter, attendeeTypeFilter],
  );

  const fieldsQuery = useRegistrationFields(fieldsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const attendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const createFieldMutation = useCreateRegistrationField();
  const updateFieldMutation = useUpdateRegistrationField();
  const deleteFieldMutation = useDeleteRegistrationField();

  const form = useForm<
    RegistrationFieldFormInput,
    unknown,
    RegistrationFieldFormValues
  >({
    resolver: zodResolver(registrationFieldSchema),
    defaultValues: {
      eventId: "",
      attendeeTypeId: "",
      key: "",
      labelAr: "",
      labelEn: "",
      type: "TEXT",
      placeholderAr: "",
      placeholderEn: "",
      options: "",
      isRequired: false,
      isActive: true,
      sortOrder: 1,
    },
  });

  const fields = fieldsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const attendeeTypes = attendeeTypesQuery.data?.items ?? [];
  const total = fieldsQuery.data?.total ?? fields.length;
  const totalPages = fieldsQuery.data?.totalPages ?? 1;

  const selectedFormEventId = form.watch("eventId");
  const selectedFormType = form.watch("type");

  const formAttendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
  });

  const formAttendeeTypes = formAttendeeTypesQuery.data?.items ?? [];

  const isSubmitting =
    createFieldMutation.isPending ||
    updateFieldMutation.isPending ||
    deleteFieldMutation.isPending;

  function openCreateModal() {
    setSelectedField(null);
    form.reset({
      eventId: eventFilter || "",
      attendeeTypeId: attendeeTypeFilter || "",
      key: "",
      labelAr: "",
      labelEn: "",
      type: "TEXT",
      placeholderAr: "",
      placeholderEn: "",
      options: "",
      isRequired: false,
      isActive: true,
      sortOrder: 1,
    });
    setFormModalOpen(true);
  }

  function openEditModal(field: RegistrationField) {
    setSelectedField(field);
    form.reset({
      eventId: field.eventId,
      attendeeTypeId: field.attendeeTypeId,
      key: field.key,
      labelAr: field.labelAr,
      labelEn: field.labelEn,
      type: field.type,
      placeholderAr: field.placeholderAr ?? "",
      placeholderEn: field.placeholderEn ?? "",
      options: field.options?.join(", ") ?? "",
      isRequired: field.isRequired,
      isActive: field.isActive,
      sortOrder: field.sortOrder ?? 1,
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedField(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  const requestSubmit: SubmitHandler<RegistrationFieldFormValues> = (
    values,
  ) => {
    setPendingValues(values);
    setPendingAction(selectedField ? "update" : "create");
    setConfirmOpen(true);
  };

  function requestDelete(field: RegistrationField) {
    setSelectedField(field);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function normalizePayload(values: RegistrationFieldFormValues) {
    return {
      eventId: values.eventId,
      attendeeTypeId: values.attendeeTypeId,
      key: values.key.trim(),
      labelAr: values.labelAr.trim(),
      labelEn: values.labelEn.trim(),
      type: values.type,
      placeholderAr: values.placeholderAr?.trim() || undefined,
      placeholderEn: values.placeholderEn?.trim() || undefined,
      options: values.type === "SELECT" ? values.options : [],
      isRequired: values.isRequired,
      isActive: values.isActive,
      sortOrder: Number(values.sortOrder),
    };
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      fields.find((field) => field.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function getAttendeeTypeTitle(attendeeTypeId: string) {
    return (
      attendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      formAttendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      fields.find((field) => field.attendeeTypeId === attendeeTypeId)
        ?.attendeeType?.nameAr ||
      "—"
    );
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedField) {
      deleteFieldMutation.mutate(selectedField.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedField(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedField) {
      updateFieldMutation.mutate(
        {
          id: selectedField.id,
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
      createFieldMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إضافة حقل التسجيل"
      : pendingAction === "update"
        ? "تأكيد تعديل حقل التسجيل"
        : "تأكيد حذف حقل التسجيل";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إضافة حقل جديد إلى نموذج التسجيل الخاص بنوع الحضور المحدد."
      : pendingAction === "update"
        ? `سيتم تعديل حقل التسجيل: ${selectedField?.labelAr ?? ""}.`
        : `سيتم حذف حقل التسجيل: ${selectedField?.labelAr ?? ""}. تأكد من عدم اعتماد التسجيلات الحالية عليه قبل المتابعة.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registration Fields"
        title="حقول التسجيل"
        description="بناء نموذج التسجيل لكل نوع حضور داخل الفعالية، مثل الاسم والهاتف والبريد والشركة."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة حقل
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الحقول</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <FileInput className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {fields.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={fieldsQuery.isFetching ? "warning" : "success"}>
              {fieldsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة حقول التسجيل</CardTitle>
              <CardDescription>
                فلتر حسب الفعالية ونوع الحضور، ثم أضف الحقول المطلوبة.
              </CardDescription>
            </div>

            <div className="grid gap-3 md:grid-cols-[240px_240px_auto]">
              <Select
                value={eventFilter}
                placeholder="كل الفعاليات"
                onChange={(value) => {
                  setPage(1);
                  setEventFilter(value);
                  setAttendeeTypeFilter("");
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
                value={attendeeTypeFilter}
                placeholder="كل أنواع الحضور"
                disabled={!eventFilter}
                onChange={(value) => {
                  setPage(1);
                  setAttendeeTypeFilter(value);
                }}
                options={[
                  { label: "كل أنواع الحضور", value: "" },
                  ...attendeeTypes.map((type) => ({
                    label: type.nameAr,
                    value: type.id,
                  })),
                ]}
              />

              <Button variant="outline" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                حقل جديد
              </Button>
            </div>
          </div>

          {fieldsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل الحقول...
                </p>
              </div>
            </div>
          ) : fieldsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل حقول التسجيل
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => fieldsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : fields.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <ListChecks className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد حقول تسجيل بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول حقل حتى تبدأ ببناء نموذج التسجيل العام للزوار.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة حقل
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحقل</TableHead>
                    <TableHead>المفتاح</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>نوع الحضور</TableHead>
                    <TableHead>مطلوب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">{field.labelAr}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {field.labelEn}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#A88042]">
                            {getEventTitle(field.eventId)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="black">{field.key}</Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="gold">
                          {fieldTypeLabels[field.type] ?? field.type}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {getAttendeeTypeTitle(field.attendeeTypeId)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={field.isRequired ? "warning" : "muted"}>
                          {field.isRequired ? "مطلوب" : "اختياري"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={field.isActive ? "success" : "danger"}>
                          {field.isActive ? "فعّال" : "معطّل"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(field)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(field)}
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
        title={selectedField ? "تعديل حقل التسجيل" : "إضافة حقل تسجيل جديد"}
        description={
          selectedField
            ? "عدّل بيانات الحقل ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات الحقل واربطه بالفعالية ونوع الحضور."
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
              {selectedField ? "متابعة التعديل" : "متابعة الإضافة"}
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
              form.setValue("attendeeTypeId", "", {
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
            label="نوع الحضور"
            className="lg:col-span-2"
            value={form.watch("attendeeTypeId")}
            placeholder="اختر نوع الحضور"
            disabled={!form.watch("eventId")}
            error={form.formState.errors.attendeeTypeId?.message}
            onChange={(value) => {
              form.setValue("attendeeTypeId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={formAttendeeTypes.map((type) => ({
              label: type.nameAr,
              value: type.id,
            }))}
          />

          <Input
            label="مفتاح الحقل"
            placeholder="fullName"
            error={form.formState.errors.key?.message}
            {...form.register("key")}
          />

          <Select
            label="نوع الحقل"
            value={form.watch("type")}
            error={form.formState.errors.type?.message}
            onChange={(value) => {
              form.setValue("type", value as RegistrationFieldType, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: "نص قصير", value: "TEXT" },
              { label: "نص طويل", value: "TEXTAREA" },
              { label: "بريد إلكتروني", value: "EMAIL" },
              { label: "رقم هاتف", value: "PHONE" },
              { label: "رقم", value: "NUMBER" },
              { label: "تاريخ", value: "DATE" },
              { label: "قائمة اختيار", value: "SELECT" },
              { label: "مربع اختيار", value: "CHECKBOX" },
            ]}
          />

          <Input
            label="اسم الحقل بالعربي"
            placeholder="الاسم الكامل"
            error={form.formState.errors.labelAr?.message}
            {...form.register("labelAr")}
          />

          <Input
            label="اسم الحقل بالإنجليزي"
            placeholder="Full Name"
            error={form.formState.errors.labelEn?.message}
            {...form.register("labelEn")}
          />

          <Input
            label="Placeholder عربي"
            placeholder="اكتب الاسم الكامل"
            error={form.formState.errors.placeholderAr?.message}
            {...form.register("placeholderAr")}
          />

          <Input
            label="Placeholder إنجليزي"
            placeholder="Enter full name"
            error={form.formState.errors.placeholderEn?.message}
            {...form.register("placeholderEn")}
          />

          {selectedFormType === "SELECT" ? (
            <Input
              label="خيارات القائمة"
              placeholder="Option 1, Option 2, Option 3"
              error={form.formState.errors.options?.message}
              {...form.register("options")}
            />
          ) : null}

          <Input
            label="الترتيب"
            type="number"
            min={0}
            error={form.formState.errors.sortOrder?.message}
            {...form.register("sortOrder", {
              valueAsNumber: true,
            })}
          />

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              {...form.register("isRequired")}
            />
            <span className="text-sm font-extrabold text-[#4B4B4B]">
              الحقل مطلوب
            </span>
          </label>

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              {...form.register("isActive")}
            />
            <span className="text-sm font-extrabold text-[#4B4B4B]">
              الحقل فعّال
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
