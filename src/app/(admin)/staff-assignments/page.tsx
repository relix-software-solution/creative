"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UsersRound,
  XCircle,
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
import { useCheckpoints } from "@/features/checkpoints/checkpoints.queries";
import { useDevices } from "@/features/devices/devices.queries";
import { useEvents } from "@/features/events/events.queries";
import {
  staffAssignmentSchema,
  StaffAssignmentFormValues,
} from "@/features/staff-ops/staff-ops.schema";
import {
  useCreateStaffAssignment,
  useDeleteStaffAssignment,
  useStaffAssignments,
} from "@/features/staff-ops/staff-ops.queries";
import { StaffAssignment } from "@/features/staff-ops/staff-ops.types";
import { useUsers } from "@/features/users/users.queries";

const PAGE_LIMIT = 20;

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

function getEventName(assignment: StaffAssignment) {
  return (
    assignment.event?.titleAr ||
    assignment.event?.titleEn ||
    assignment.eventId ||
    "—"
  );
}

function getStaffName(assignment: StaffAssignment) {
  return (
    assignment.user?.fullName ||
    assignment.user?.email ||
    assignment.userId ||
    "—"
  );
}

function getCheckpointName(assignment: StaffAssignment) {
  return (
    assignment.checkpoint?.nameAr ||
    assignment.checkpoint?.nameEn ||
    assignment.checkpoint?.code ||
    assignment.checkpointId ||
    "—"
  );
}

function getDeviceName(assignment: StaffAssignment) {
  return (
    assignment.device?.name ||
    assignment.device?.code ||
    assignment.deviceId ||
    "—"
  );
}

function getAssignmentRole(assignment: StaffAssignment) {
  return assignment.role || "SCANNER";
}

export default function StaffAssignmentsPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<StaffAssignment | null>(null);

  const assignmentsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      eventId: eventFilter || undefined,
      userId: staffFilter || undefined,
      isActive:
        activeFilter === "ACTIVE"
          ? true
          : activeFilter === "INACTIVE"
            ? false
            : undefined,
    }),
    [page, eventFilter, staffFilter, activeFilter],
  );

  const assignmentsQuery = useStaffAssignments(assignmentsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const usersQuery = useUsers({ page: 1, limit: 100, role: "STAFF" });

  const form = useForm<StaffAssignmentFormValues>({
    resolver: zodResolver(staffAssignmentSchema),
    defaultValues: {
      eventId: "",
      userId: "",
      checkpointId: "",
      deviceId: "",
    },
  });

  const selectedEventId = form.watch("eventId");

  const checkpointsQuery = useCheckpoints({
    page: 1,
    limit: 100,
    eventId: selectedEventId || undefined,
  });

  const devicesQuery = useDevices({
    page: 1,
    limit: 100,
    eventId: selectedEventId || undefined,
  });

  const createAssignmentMutation = useCreateStaffAssignment();
  const deleteAssignmentMutation = useDeleteStaffAssignment();

  const assignments = assignmentsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const staffUsers = usersQuery.data?.items ?? [];
  const checkpoints = checkpointsQuery.data?.items ?? [];
  const devices = devicesQuery.data?.items ?? [];

  const total = assignmentsQuery.data?.total ?? assignments.length;
  const totalPages = assignmentsQuery.data?.totalPages ?? 1;

  const isSubmitting = createAssignmentMutation.isPending;
  const isDeleting = deleteAssignmentMutation.isPending;

  const isFiltering = Boolean(
    search || eventFilter || staffFilter || activeFilter,
  );

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;

    const term = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      return (
        getEventName(assignment).toLowerCase().includes(term) ||
        getStaffName(assignment).toLowerCase().includes(term) ||
        getCheckpointName(assignment).toLowerCase().includes(term) ||
        getDeviceName(assignment).toLowerCase().includes(term) ||
        getAssignmentRole(assignment).toLowerCase().includes(term)
      );
    });
  }, [assignments, search]);

  useEffect(() => {
    if (!assignmentsQuery.isSuccess) return;

    if (assignments.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [assignments.length, assignmentsQuery.isSuccess, page]);

  function openCreateModal() {
    form.reset({
      eventId: eventFilter || "",
      userId: staffFilter || "",
      checkpointId: "",
      deviceId: "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setModalOpen(false);
    form.reset();
  }

  function requestDelete(assignment: StaffAssignment) {
    setSelectedAssignment(assignment);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (isDeleting) return;

    setSelectedAssignment(null);
    setConfirmOpen(false);
  }

  const submitAssignment: SubmitHandler<StaffAssignmentFormValues> = (
    values,
  ) => {
    createAssignmentMutation.mutate(
      {
        eventId: values.eventId,
        userId: values.userId,
        checkpointId: values.checkpointId,
        deviceId: values.deviceId,
      },
      {
        onSuccess: closeModal,
      },
    );
  };

  function confirmDelete() {
    if (!selectedAssignment) return;

    deleteAssignmentMutation.mutate(selectedAssignment.id, {
      onSuccess: closeConfirm,
    });
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setEventFilter("");
    setStaffFilter("");
    setActiveFilter("");
  }

  function getEventOptionLabel(event: {
    id: string;
    titleAr?: string;
    titleEn?: string | null;
  }) {
    return event.titleAr || event.titleEn || event.id;
  }

  function getStaffOptionLabel(user: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  }) {
    return user.fullName || user.email || user.id;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Staff Assignments"
        title="تكليفات موظفي السكانر"
        description="اربط موظف Staff بفعالية ونقطة مسح وجهاز. بعد ذلك الموظف يسجل دخول ويبدأ المسح مباشرة."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            تكليف جديد
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي التكليفات
          </p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {assignmentsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <UsersRound className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">النشطة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {assignmentsQuery.isLoading
              ? "..."
              : assignments.filter((item) => item.isActive !== false).length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">المعطلة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {assignmentsQuery.isLoading
              ? "..."
              : assignments.filter((item) => item.isActive === false).length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge
              variant={assignmentsQuery.isFetching ? "warning" : "success"}
            >
              {assignmentsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => assignmentsQuery.refetch()}
              disabled={assignmentsQuery.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  assignmentsQuery.isFetching ? "animate-spin" : ""
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
                <CardTitle>قائمة التكليفات</CardTitle>

                <CardDescription>
                  كل تكليف يحدد الموظف والفعالية ونقطة المسح والجهاز الذي سيعمل
                  عليه.
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
                  تكليف جديد
                </Button>
              </div>
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.75fr)] items-center gap-3">
              <Input
                value={search}
                placeholder="بحث بالموظف أو الفعالية أو الجهاز..."
                icon={<Search className="h-4 w-4" />}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
              />

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
                    label: getEventOptionLabel(event),
                    value: event.id,
                  })),
                ]}
              />

              <Select
                value={staffFilter}
                placeholder="كل الموظفين"
                onChange={(value) => {
                  setPage(1);
                  setStaffFilter(value);
                }}
                options={[
                  { label: "كل الموظفين", value: "" },
                  ...staffUsers.map((user) => ({
                    label: getStaffOptionLabel(user),
                    value: user.id,
                  })),
                ]}
              />

              <Select
                value={activeFilter}
                placeholder="كل الحالات"
                onChange={(value) => {
                  setPage(1);
                  setActiveFilter(value);
                }}
                options={[
                  { label: "كل الحالات", value: "" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "معطل", value: "INACTIVE" },
                ]}
              />
            </div>
          </div>

          {assignmentsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل التكليفات...
                </p>
              </div>
            </div>
          ) : assignmentsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل التكليفات
                </p>

                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
                </p>

                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => assignmentsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <UserCheck className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  {isFiltering ? "لا توجد تكليفات مطابقة" : "لا توجد تكليفات"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل الفلاتر أو امسحها لعرض كل التكليفات."
                    : "أضف تكليفًا جديدًا حتى يستطيع موظف السكانر العمل مباشرة بعد تسجيل الدخول."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  ) : null}

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    تكليف جديد
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
                      <TableHead className="w-[18%]">الموظف</TableHead>
                      <TableHead className="w-[17%]">الفعالية</TableHead>
                      <TableHead className="w-[18%]">نقطة المسح</TableHead>
                      <TableHead className="w-[16%]">الجهاز</TableHead>
                      <TableHead className="w-[10%]">الدور</TableHead>
                      <TableHead className="w-[10%]">الحالة</TableHead>
                      <TableHead className="w-[8%]">التاريخ</TableHead>
                      <TableHead className="w-[7%] text-center">
                        الإجراء
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#4B4B4B]">
                              {getStaffName(assignment)}
                            </p>

                            {assignment.user?.email ? (
                              <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                {assignment.user.email}
                              </p>
                            ) : null}

                            <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/35">
                              ID: {assignment.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {getEventName(assignment)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#4B4B4B]">
                              {getCheckpointName(assignment)}
                            </p>

                            {assignment.checkpoint?.type ? (
                              <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                {assignment.checkpoint.type}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#4B4B4B]">
                              {getDeviceName(assignment)}
                            </p>

                            {assignment.device?.status ? (
                              <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                {assignment.device.status}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <Badge variant="gold">
                            {getAssignmentRole(assignment)}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-top">
                          <Badge
                            variant={
                              assignment.isActive === false
                                ? "danger"
                                : "success"
                            }
                          >
                            {assignment.isActive === false ? (
                              <>
                                <XCircle className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                              </>
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate">
                            {formatDate(assignment.createdAt)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="danger"
                              title="تعطيل"
                              aria-label="تعطيل"
                              className="h-8 w-8 shrink-0 p-0"
                              disabled={
                                assignment.isActive === false || isDeleting
                              }
                              onClick={() => requestDelete(assignment)}
                            >
                              {isDeleting &&
                              selectedAssignment?.id === assignment.id ? (
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
                  الصفحة {page} من {totalPages} — عرض{" "}
                  {filteredAssignments.length} من أصل {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || assignmentsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages || assignmentsQuery.isFetching}
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
        open={modalOpen}
        onClose={closeModal}
        title="تكليف موظف سكانر"
        description="حدد الموظف والفعالية ونقطة المسح والجهاز. بعدها الموظف يسجل دخول ويبدأ المسح مباشرة."
        className="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(submitAssignment)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              حفظ التكليف
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(submitAssignment)}
        >
          <Select
            label="الفعالية"
            value={form.watch("eventId")}
            placeholder="اختر الفعالية"
            error={form.formState.errors.eventId?.message}
            onChange={(value) => {
              form.setValue("eventId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });

              form.setValue("checkpointId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });

              form.setValue("deviceId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={events.map((event) => ({
              label: getEventOptionLabel(event),
              value: event.id,
            }))}
          />

          <Select
            label="الموظف Staff"
            value={form.watch("userId")}
            placeholder="اختر موظف التشغيل"
            error={form.formState.errors.userId?.message}
            onChange={(value) => {
              form.setValue("userId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={staffUsers.map((user) => ({
              label: `${getStaffOptionLabel(user)}${
                user.email ? ` - ${user.email}` : ""
              }`,
              value: user.id,
            }))}
          />

          <Select
            label="نقطة المسح"
            value={form.watch("checkpointId")}
            placeholder={
              selectedEventId
                ? checkpointsQuery.isLoading
                  ? "جاري تحميل نقاط المسح..."
                  : "اختر نقطة المسح"
                : "اختر الفعالية أولًا"
            }
            disabled={!selectedEventId || checkpointsQuery.isLoading}
            error={form.formState.errors.checkpointId?.message}
            onChange={(value) => {
              form.setValue("checkpointId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={checkpoints
              .filter((checkpoint) => checkpoint.isActive !== false)
              .map((checkpoint) => ({
                label: `${checkpoint.nameAr || checkpoint.nameEn || checkpoint.id}${
                  checkpoint.code ? ` - ${checkpoint.code}` : ""
                }`,
                value: checkpoint.id,
              }))}
          />

          <Select
            label="الجهاز"
            value={form.watch("deviceId")}
            placeholder={
              selectedEventId
                ? devicesQuery.isLoading
                  ? "جاري تحميل الأجهزة..."
                  : "اختر الجهاز"
                : "اختر الفعالية أولًا"
            }
            disabled={!selectedEventId || devicesQuery.isLoading}
            error={form.formState.errors.deviceId?.message}
            onChange={(value) => {
              form.setValue("deviceId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={devices
              .filter((device) => device.status !== "REVOKED")
              .map((device) => ({
                label: `${device.name || device.code || device.id}${
                  device.code ? ` - ${device.code}` : ""
                }`,
                value: device.id,
              }))}
          />

          <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
            <p className="text-sm font-extrabold text-[#4B4B4B]">
              الفلو الجديد
            </p>

            <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/55">
              بعد حفظ هذا التكليف، موظف الـ Staff لن يختار أي شيء. فقط يسجل
              دخول، النظام يجلب التكليف النشط، يبدأ الجلسة تلقائيًا، ويفتح
              السكانر مباشرة.
            </p>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="تعطيل التكليف"
        description={
          selectedAssignment
            ? `سيتم تعطيل تكليف ${getStaffName(
                selectedAssignment,
              )} ولن يستطيع استخدام هذا التكليف في واجهة السكانر.`
            : "سيتم تعطيل هذا التكليف."
        }
        confirmText="تعطيل"
        variant="danger"
        isLoading={isDeleting}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
