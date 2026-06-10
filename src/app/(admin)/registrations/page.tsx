"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
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
import { useAttendeeTypes } from "@/features/attendee-types/attendee-types.queries";
import { useEvents } from "@/features/events/events.queries";
import {
  RegistrationFormValues,
  registrationSchema,
} from "@/features/registrations/registrations.schema";
import {
  useActivateRegistration,
  useBlockRegistration,
  useCancelRegistration,
  useCreateRegistration,
  useDeleteRegistration,
  useRegistrations,
  useUpdateRegistration,
} from "@/features/registrations/registrations.queries";
import { Registration } from "@/features/registrations/registrations.types";

type PendingAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "cancel"
  | "block"
  | null;

const statusLabels: Record<string, string> = {
  PENDING: "بانتظار التفعيل",
  ACTIVE: "فعّال",
  CANCELLED: "ملغي",
  BLOCKED: "محظور",
};

function getStatusVariant(
  status?: string | null,
): "success" | "warning" | "muted" | "danger" | "gold" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED") return "muted";
  if (status === "BLOCKED") return "danger";
  return "gold";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function stringifyCustomFields(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "";
  return JSON.stringify(value, null, 2);
}

function parseCustomFields(value?: string) {
  if (!value || !value.trim()) return {};
  return JSON.parse(value) as Record<string, unknown>;
}

export default function RegistrationsPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [attendeeTypeFilter, setAttendeeTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [pendingValues, setPendingValues] =
    useState<RegistrationFormValues | null>(null);

  const registrationsParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
      attendeeTypeId: attendeeTypeFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
    }),
    [page, eventFilter, attendeeTypeFilter, statusFilter, search],
  );

  const registrationsQuery = useRegistrations(registrationsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const attendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const createRegistrationMutation = useCreateRegistration();
  const updateRegistrationMutation = useUpdateRegistration();
  const deleteRegistrationMutation = useDeleteRegistration();
  const activateRegistrationMutation = useActivateRegistration();
  const cancelRegistrationMutation = useCancelRegistration();
  const blockRegistrationMutation = useBlockRegistration();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId: "",
      attendeeTypeId: "",
      fullName: "",
      phone: "",
      email: "",
      companyName: "",
      jobTitle: "",
      externalId: "",
      notes: "",
      customFieldsJson: "",
    },
  });

  const registrations = registrationsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const attendeeTypes = attendeeTypesQuery.data?.items ?? [];
  const total = registrationsQuery.data?.total ?? registrations.length;
  const totalPages = registrationsQuery.data?.totalPages ?? 1;

  const selectedFormEventId = form.watch("eventId");

  const formAttendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
  });

  const formAttendeeTypes = formAttendeeTypesQuery.data?.items ?? [];

  const isSubmitting =
    createRegistrationMutation.isPending ||
    updateRegistrationMutation.isPending ||
    deleteRegistrationMutation.isPending ||
    activateRegistrationMutation.isPending ||
    cancelRegistrationMutation.isPending ||
    blockRegistrationMutation.isPending;

  function openCreateModal() {
    setSelectedRegistration(null);
    form.reset({
      eventId: eventFilter || "",
      attendeeTypeId: attendeeTypeFilter || "",
      fullName: "",
      phone: "",
      email: "",
      companyName: "",
      jobTitle: "",
      externalId: "",
      notes: "",
      customFieldsJson: "",
    });
    setFormModalOpen(true);
  }

  function openEditModal(registration: Registration) {
    setSelectedRegistration(registration);
    form.reset({
      eventId: registration.eventId,
      attendeeTypeId: registration.attendeeTypeId,
      fullName: registration.fullName ?? "",
      phone: registration.phone ?? "",
      email: registration.email ?? "",
      companyName: registration.companyName ?? "",
      jobTitle: registration.jobTitle ?? "",
      externalId: registration.externalId ?? "",
      notes: registration.notes ?? "",
      customFieldsJson: stringifyCustomFields(registration.customFields),
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedRegistration(null);
    setPendingValues(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingValues(null);
  }

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setPage(1);
    setEventFilter("");
    setAttendeeTypeFilter("");
    setStatusFilter("");
    setSearchInput("");
    setSearch("");
  }

  function requestSubmit(values: RegistrationFormValues) {
    setPendingValues(values);
    setPendingAction(selectedRegistration ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestAction(action: PendingAction, registration: Registration) {
    setSelectedRegistration(registration);
    setPendingAction(action);
    setConfirmOpen(true);
  }

  function normalizePayload(values: RegistrationFormValues) {
    return {
      eventId: values.eventId,
      attendeeTypeId: values.attendeeTypeId,
      fullName: values.fullName.trim(),
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      companyName: values.companyName?.trim() || undefined,
      jobTitle: values.jobTitle?.trim() || undefined,
      externalId: values.externalId?.trim() || undefined,
      customFields: parseCustomFields(values.customFieldsJson),
      notes: values.notes?.trim() || undefined,
      source: "ADMIN" as const,
    };
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      registrations.find((item) => item.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function getAttendeeTypeTitle(attendeeTypeId: string) {
    return (
      attendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      formAttendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      registrations.find((item) => item.attendeeTypeId === attendeeTypeId)
        ?.attendeeType?.nameAr ||
      "—"
    );
  }

  function confirmAction() {
    if (!pendingAction) return;

    if (pendingAction === "delete" && selectedRegistration) {
      deleteRegistrationMutation.mutate(selectedRegistration.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedRegistration(null);
        },
      });
      return;
    }

    if (pendingAction === "activate" && selectedRegistration) {
      activateRegistrationMutation.mutate(selectedRegistration.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedRegistration(null);
        },
      });
      return;
    }

    if (pendingAction === "cancel" && selectedRegistration) {
      cancelRegistrationMutation.mutate(selectedRegistration.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedRegistration(null);
        },
      });
      return;
    }

    if (pendingAction === "block" && selectedRegistration) {
      blockRegistrationMutation.mutate(selectedRegistration.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedRegistration(null);
        },
      });
      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedRegistration) {
      updateRegistrationMutation.mutate(
        {
          id: selectedRegistration.id,
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
      createRegistrationMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إنشاء التسجيل"
      : pendingAction === "update"
        ? "تأكيد تعديل التسجيل"
        : pendingAction === "delete"
          ? "تأكيد حذف التسجيل"
          : pendingAction === "activate"
            ? "تأكيد تفعيل التسجيل"
            : pendingAction === "cancel"
              ? "تأكيد إلغاء التسجيل"
              : "تأكيد حظر التسجيل";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إنشاء تسجيل جديد من لوحة الإدارة."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات التسجيل: ${selectedRegistration?.fullName ?? ""}.`
        : pendingAction === "delete"
          ? `سيتم حذف التسجيل: ${
              selectedRegistration?.fullName ?? ""
            }. تأكد قبل المتابعة.`
          : pendingAction === "activate"
            ? `سيتم تفعيل التسجيل: ${selectedRegistration?.fullName ?? ""}.`
            : pendingAction === "cancel"
              ? `سيتم إلغاء التسجيل: ${selectedRegistration?.fullName ?? ""}.`
              : `سيتم حظر التسجيل: ${selectedRegistration?.fullName ?? ""}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registrations"
        title="إدارة التسجيلات"
        description="إنشاء وإدارة تسجيلات الحضور يدويًا من لوحة الإدارة، مع تفعيل أو إلغاء أو حظر التسجيل."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة تسجيل
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي التسجيلات
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {registrations.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge
              variant={registrationsQuery.isFetching ? "warning" : "success"}
            >
              {registrationsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>قائمة التسجيلات</CardTitle>
                <CardDescription>
                  فلتر حسب الفعالية ونوع الحضور والحالة، أو ابحث بالاسم والهاتف
                  والبريد.
                </CardDescription>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>

            <div className="grid gap-3 xl:grid-cols-[220px_220px_170px_1fr_auto]">
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

              <Select
                value={statusFilter}
                placeholder="كل الحالات"
                onChange={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                options={[
                  { label: "كل الحالات", value: "" },
                  { label: "بانتظار التفعيل", value: "PENDING" },
                  { label: "فعّال", value: "ACTIVE" },
                  { label: "ملغي", value: "CANCELLED" },
                  { label: "محظور", value: "BLOCKED" },
                ]}
              />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="بحث بالاسم أو الهاتف أو البريد..."
                icon={<Search className="h-5 w-5" />}
              />

              <Button variant="secondary" onClick={handleSearch}>
                بحث
              </Button>
            </div>
          </div>

          {registrationsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل التسجيلات...
                </p>
              </div>
            </div>
          ) : registrationsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل التسجيلات
                </p>
                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال أو صلاحية الجلسة.
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => registrationsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <UserCheck className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد تسجيلات بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول تسجيل، أو استخدم لاحقًا الاستيراد لإضافة تسجيلات دفعة
                  واحدة.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة تسجيل
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المسجل</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>نوع الحضور</TableHead>
                    <TableHead>التواصل</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">
                            {registration.fullName}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {registration.externalId ||
                              registration.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#A88042]">
                            {formatDate(registration.createdAt)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getEventTitle(registration.eventId)}
                      </TableCell>

                      <TableCell>
                        {getAttendeeTypeTitle(registration.attendeeTypeId)}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p dir="ltr" className="text-right">
                            {registration.phone || "—"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {registration.email || "—"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p>{registration.companyName || "—"}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {registration.jobTitle || "—"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(registration.status)}>
                          {statusLabels[registration.status ?? ""] ||
                            registration.status ||
                            "—"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(registration)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              requestAction("activate", registration)
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            تفعيل
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              requestAction("cancel", registration)
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            إلغاء
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAction("block", registration)}
                          >
                            <Ban className="h-4 w-4" />
                            حظر
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              requestAction("delete", registration)
                            }
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
        title={selectedRegistration ? "تعديل التسجيل" : "إضافة تسجيل جديد"}
        description={
          selectedRegistration
            ? "عدّل بيانات التسجيل ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات الشخص واربطه بالفعالية ونوع الحضور."
        }
        className="max-w-4xl"
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
              {selectedRegistration ? "متابعة التعديل" : "متابعة الإضافة"}
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
            label="الاسم الكامل"
            placeholder="مثال: محمد أحمد"
            error={form.formState.errors.fullName?.message}
            {...form.register("fullName")}
          />

          <Input
            label="رقم الهاتف"
            placeholder="+963944123456"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />

          <Input
            label="البريد الإلكتروني"
            placeholder="visitor@example.com"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />

          <Input
            label="الشركة"
            placeholder="Example Co"
            error={form.formState.errors.companyName?.message}
            {...form.register("companyName")}
          />

          <Input
            label="المسمى الوظيفي"
            placeholder="Manager"
            error={form.formState.errors.jobTitle?.message}
            {...form.register("jobTitle")}
          />

          <Input
            label="External ID"
            placeholder="REG-001"
            error={form.formState.errors.externalId?.message}
            {...form.register("externalId")}
          />

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الحقول الإضافية JSON
            </label>
            <textarea
              {...form.register("customFieldsJson")}
              rows={5}
              dir="ltr"
              placeholder={`{\n  "mealPreference": "regular"\n}`}
              className="custom-scrollbar w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-left font-mono text-sm text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
            />
            {form.formState.errors.customFieldsJson ? (
              <p className="text-sm font-bold text-red-600">
                {form.formState.errors.customFieldsJson.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">ملاحظات</label>
            <textarea
              {...form.register("notes")}
              rows={3}
              placeholder="ملاحظات داخلية عن التسجيل..."
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
              : pendingAction === "delete"
                ? "تأكيد الحذف"
                : pendingAction === "activate"
                  ? "تأكيد التفعيل"
                  : pendingAction === "cancel"
                    ? "تأكيد الإلغاء"
                    : "تأكيد الحظر"
        }
        variant={
          pendingAction === "delete" || pendingAction === "block"
            ? "danger"
            : pendingAction === "activate"
              ? "success"
              : "gold"
        }
        isLoading={isSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
