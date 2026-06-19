"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserCheck,
  XCircle,
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
import { usePublicEvent } from "@/features/public-events/public-events.queries";
import { PublicRegistrationField } from "@/features/public-events/public-events.types";

type PendingAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "cancel"
  | "block"
  | null;

const PAGE_LIMIT = 20;

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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function stringifyCustomFields(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "";

  return JSON.stringify(value, null, 2);
}

function parseCustomFields(value?: string) {
  if (!value || !value.trim()) return {};

  return JSON.parse(value) as Record<string, unknown>;
}

function normalizePayload(
  values: RegistrationFormValues,
  fields: PublicRegistrationField[],
  customValues: Record<string, unknown>,
) {
  return {
    eventId: values.eventId,
    attendeeTypeId: values.attendeeTypeId,
    fullName: values.fullName.trim(),
    phone: values.phone?.trim() || undefined,
    email: values.email?.trim() || undefined,
    externalId: values.externalId?.trim() || undefined,
    customFields: normalizeCustomFieldsForSubmit(fields, customValues),
    notes: values.notes?.trim() || undefined,
    source: "ADMIN" as const,
  };
}

function formatCustomFieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) return value.map(String).join("، ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getVisibleRegistrationFields(
  fields: PublicRegistrationField[] | undefined,
  attendeeTypeId?: string,
) {
  return (fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter(
      (field) => !attendeeTypeId || field.attendeeTypeId === attendeeTypeId,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getEmptyValueForField(field: PublicRegistrationField) {
  if (field.type === "CHECKBOX") return false;
  return "";
}

function normalizeCustomFieldsForSubmit(
  fields: PublicRegistrationField[],
  values: Record<string, unknown>,
) {
  const result: Record<string, unknown> = {};

  fields.forEach((field) => {
    const value = values[field.key];

    if (value === undefined || value === null || value === "") return;

    result[field.key] = value;
  });

  return result;
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

  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});

  const [pendingValues, setPendingValues] =
    useState<RegistrationFormValues | null>(null);

  const registrationsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
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

  const selectedFormAttendeeTypeId = form.watch("attendeeTypeId");

  const publicEventQuery = usePublicEvent(selectedFormEventId);

  const formRegistrationFields = useMemo(() => {
    return getVisibleRegistrationFields(
      publicEventQuery.data?.registrationFields,
      selectedFormAttendeeTypeId,
    );
  }, [publicEventQuery.data?.registrationFields, selectedFormAttendeeTypeId]);

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

  const isFiltering = Boolean(
    eventFilter || attendeeTypeFilter || statusFilter || search,
  );

  useEffect(() => {
    if (!registrationsQuery.isSuccess) return;

    if (registrations.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [registrations.length, registrationsQuery.isSuccess, page]);

  function openCreateModal() {
    setSelectedRegistration(null);
    setPendingAction(null);
    setPendingValues(null);
    setCustomFields({});

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
    setPendingAction(null);
    setPendingValues(null);
    setCustomFields(registration.customFields ?? {});

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
    setPendingAction(null);
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
    setPendingValues(null);
    setPendingAction(action);
    setConfirmOpen(true);
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

    const payload = normalizePayload(
      pendingValues,
      formRegistrationFields,
      customFields,
    );

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
          ? `سيتم أرشفة التسجيل: ${
              selectedRegistration?.fullName ?? ""
            }. سيختفي من القائمة وسيتم إلغاء QR فعال إن وجد.`
          : pendingAction === "activate"
            ? `سيتم تفعيل التسجيل: ${selectedRegistration?.fullName ?? ""}.`
            : pendingAction === "cancel"
              ? `سيتم إلغاء التسجيل: ${selectedRegistration?.fullName ?? ""}.`
              : `سيتم حظر التسجيل: ${selectedRegistration?.fullName ?? ""}.`;

  const confirmText =
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
              : "تأكيد الحظر";

  return (
    <div className="space-y-6" dir="rtl">
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
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي التسجيلات
          </p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {registrationsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {registrationsQuery.isLoading ? "..." : registrations.length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge
              variant={registrationsQuery.isFetching ? "warning" : "success"}
            >
              {registrationsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => registrationsQuery.refetch()}
              disabled={registrationsQuery.isFetching}
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  registrationsQuery.isFetching ? "animate-spin" : ""
                }`}
              />
              تحديث
            </Button>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>قائمة التسجيلات</CardTitle>

                <CardDescription>
                  فلتر حسب الفعالية ونوع الحضور والحالة، أو ابحث بالاسم والهاتف
                  والبريد.
                </CardDescription>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isFiltering ? (
                  <Button variant="outline" onClick={clearFilters}>
                    مسح الفلاتر
                  </Button>
                ) : null}

                <Button variant="outline" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  تسجيل جديد
                </Button>
              </div>
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_auto] items-center gap-3">
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

              <Button
                className="shrink-0 px-8"
                variant="secondary"
                onClick={handleSearch}
              >
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
                  {isFiltering
                    ? "لا توجد تسجيلات مطابقة"
                    : "لا توجد تسجيلات بعد"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل الفلاتر أو امسحها لعرض كل التسجيلات."
                    : "أضف أول تسجيل، أو استخدم لاحقًا الاستيراد لإضافة تسجيلات دفعة واحدة."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  ) : null}

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    إضافة تسجيل
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-black/5">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-[#F8F8FF]">
                      <TableHead className="w-[18%]">المسجل</TableHead>
                      <TableHead className="w-[16%]">الفعالية</TableHead>
                      <TableHead className="w-[13%]">نوع الحضور</TableHead>
                      <TableHead className="w-[17%]">التواصل</TableHead>
                      <TableHead className="w-[13%]">حقول إضافية</TableHead>
                      <TableHead className="w-[9%]">الحالة</TableHead>
                      <TableHead className="w-[14%] text-center">
                        الإجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#4B4B4B]">
                              {registration.fullName}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                              {registration.externalId ||
                                registration.id.slice(0, 8)}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-[#A88042]">
                              {formatDate(registration.createdAt)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {getEventTitle(registration.eventId)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {getAttendeeTypeTitle(registration.attendeeTypeId)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p dir="ltr" className="truncate text-right">
                              {registration.phone || "—"}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                              {registration.email || "—"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0 space-y-1">
                            {registration.customFields &&
                            Object.keys(registration.customFields).length >
                              0 ? (
                              Object.entries(registration.customFields)
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <p
                                    key={key}
                                    className="truncate text-xs font-bold"
                                  >
                                    <span className="text-[#4B4B4B]/45">
                                      {key}:{" "}
                                    </span>
                                    <span className="text-[#4B4B4B]">
                                      {formatCustomFieldValue(value)}
                                    </span>
                                  </p>
                                ))
                            ) : (
                              <p className="text-sm font-bold text-[#4B4B4B]/40">
                                —
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <Badge
                            variant={getStatusVariant(registration.status)}
                          >
                            {statusLabels[registration.status ?? ""] ||
                              registration.status ||
                              "—"}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex flex-nowrap items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              title="تعديل"
                              aria-label="تعديل"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => openEditModal(registration)}
                              disabled={isSubmitting}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="تفعيل"
                              aria-label="تفعيل"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("activate", registration)
                              }
                              disabled={
                                isSubmitting || registration.status === "ACTIVE"
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="إلغاء"
                              aria-label="إلغاء"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("cancel", registration)
                              }
                              disabled={
                                isSubmitting ||
                                registration.status === "CANCELLED"
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="حظر"
                              aria-label="حظر"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("block", registration)
                              }
                              disabled={
                                isSubmitting ||
                                registration.status === "BLOCKED"
                              }
                            >
                              <Ban className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              title="حذف"
                              aria-label="حذف"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("delete", registration)
                              }
                              disabled={isSubmitting}
                            >
                              {deleteRegistrationMutation.isPending &&
                              selectedRegistration?.id === registration.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
                  الصفحة {page} من {totalPages} — عرض {registrations.length} من
                  أصل {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || registrationsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={
                      page >= totalPages || registrationsQuery.isFetching
                    }
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
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
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

              setCustomFields({});
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
            disabled={isSubmitting}
            {...form.register("fullName")}
          />

          <Input
            label="رقم الهاتف"
            placeholder="+963944123456"
            error={form.formState.errors.phone?.message}
            disabled={isSubmitting}
            {...form.register("phone")}
          />

          <Input
            label="البريد الإلكتروني"
            placeholder="visitor@example.com"
            error={form.formState.errors.email?.message}
            disabled={isSubmitting}
            {...form.register("email")}
          />

          {formRegistrationFields.length > 0 ? (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-[#F8F8FF] p-4 lg:col-span-2">
              <div>
                <p className="text-base font-extrabold text-[#4B4B4B]">
                  الحقول الإضافية
                </p>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/50">
                  هذه الحقول تأتي من إعدادات نوع الحضور المختار.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {formRegistrationFields.map((field) => {
                  const value = customFields[field.key];

                  if (field.type === "TEXTAREA") {
                    return (
                      <div key={field.id} className="space-y-2 lg:col-span-2">
                        <label className="text-sm font-bold text-[#4B4B4B]">
                          {field.labelAr || field.labelEn || field.key}
                          {field.isRequired ? (
                            <span className="mr-1 text-red-500">*</span>
                          ) : null}
                        </label>

                        <textarea
                          rows={3}
                          value={String(value ?? "")}
                          disabled={isSubmitting}
                          placeholder={
                            field.placeholderAr || field.placeholderEn || ""
                          }
                          onChange={(event) => {
                            setCustomFields((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }));
                          }}
                          className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
                        />
                      </div>
                    );
                  }

                  if (field.type === "SELECT") {
                    const options = Array.isArray(field.options)
                      ? field.options
                      : [];

                    return (
                      <Select
                        key={field.id}
                        label={`${field.labelAr || field.labelEn || field.key}${
                          field.isRequired ? " *" : ""
                        }`}
                        value={String(value ?? "")}
                        placeholder={
                          field.placeholderAr || field.placeholderEn || "اختر"
                        }
                        disabled={isSubmitting}
                        onChange={(nextValue) => {
                          setCustomFields((current) => ({
                            ...current,
                            [field.key]: nextValue,
                          }));
                        }}
                        options={options.map((option) => {
                          if (typeof option === "string") {
                            return {
                              label: option,
                              value: option,
                            };
                          }

                          return {
                            label:
                              option.labelAr || option.labelEn || option.value,
                            value: option.value,
                          };
                        })}
                      />
                    );
                  }

                  if (field.type === "CHECKBOX") {
                    return (
                      <label
                        key={field.id}
                        className="flex min-h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B]"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          disabled={isSubmitting}
                          onChange={(event) => {
                            setCustomFields((current) => ({
                              ...current,
                              [field.key]: event.target.checked,
                            }));
                          }}
                        />

                        <span>
                          {field.labelAr || field.labelEn || field.key}
                          {field.isRequired ? (
                            <span className="mr-1 text-red-500">*</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  }

                  return (
                    <Input
                      key={field.id}
                      label={`${field.labelAr || field.labelEn || field.key}${
                        field.isRequired ? " *" : ""
                      }`}
                      type={
                        field.type === "EMAIL"
                          ? "email"
                          : field.type === "PHONE"
                            ? "tel"
                            : field.type === "NUMBER"
                              ? "number"
                              : field.type === "DATE"
                                ? "date"
                                : "text"
                      }
                      value={String(value ?? "")}
                      placeholder={
                        field.placeholderAr || field.placeholderEn || ""
                      }
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setCustomFields((current) => ({
                          ...current,
                          [field.key]:
                            field.type === "NUMBER"
                              ? event.target.value
                              : event.target.value,
                        }));
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">ملاحظات</label>

            <textarea
              {...form.register("notes")}
              rows={3}
              disabled={isSubmitting}
              placeholder="ملاحظات داخلية عن التسجيل..."
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
