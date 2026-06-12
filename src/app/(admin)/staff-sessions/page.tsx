"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerOff,
  UserRoundCheck,
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
import { useUsers } from "@/features/users/users.queries";
import {
  startStaffSessionSchema,
  StartStaffSessionFormValues,
} from "@/features/staff-ops/staff-ops.schema";
import {
  useEndStaffSession,
  useStaffSessions,
  useStartStaffSession,
} from "@/features/staff-ops/staff-ops.queries";
import {
  StaffSession,
  StaffSessionStatus,
} from "@/features/staff-ops/staff-ops.types";

const PAGE_LIMIT = 20;

const statusLabels: Record<string, string> = {
  ACTIVE: "نشطة",
  ENDED: "منتهية",
  CLOSED: "مغلقة",
  EXPIRED: "منتهية",
};

function getStatusVariant(
  status?: StaffSessionStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "ACTIVE") return "success";
  if (status === "ENDED" || status === "CLOSED") return "muted";
  if (status === "EXPIRED") return "warning";
  return "gold";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusIcon(session: StaffSession) {
  if (isActiveSession(session)) {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  return <XCircle className="h-4 w-4" />;
}

function getEventName(session: StaffSession) {
  return (
    session.event?.titleAr || session.event?.titleEn || session.eventId || "—"
  );
}

function getStaffName(session: StaffSession) {
  return (
    session.staffUser?.fullName ||
    session.staffUser?.email ||
    session.staffUserId ||
    "—"
  );
}

function getDeviceName(session: StaffSession) {
  return (
    session.device?.name || session.device?.code || session.deviceId || "—"
  );
}

function getCheckpointName(session: StaffSession) {
  return (
    session.checkpoint?.nameAr ||
    session.checkpoint?.nameEn ||
    session.checkpointId ||
    "—"
  );
}

function isActiveSession(session: StaffSession) {
  return !session.status || session.status === "ACTIVE";
}

export default function StaffSessionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [checkpointFilter, setCheckpointFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StaffSession | null>(
    null,
  );

  const sessionsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      eventId: eventFilter || undefined,
      staffUserId: staffFilter || undefined,
      deviceId: deviceFilter || undefined,
      checkpointId: checkpointFilter || undefined,
      status: statusFilter || undefined,
    }),
    [
      page,
      eventFilter,
      staffFilter,
      deviceFilter,
      checkpointFilter,
      statusFilter,
    ],
  );

  const sessionsQuery = useStaffSessions(sessionsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const usersQuery = useUsers({ page: 1, limit: 100, role: "STAFF" });

  const devicesQuery = useDevices({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const checkpointsQuery = useCheckpoints({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const startSessionMutation = useStartStaffSession();
  const endSessionMutation = useEndStaffSession();

  const sessions = sessionsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const staffUsers = usersQuery.data?.items ?? [];
  const devices = devicesQuery.data?.items ?? [];
  const checkpoints = checkpointsQuery.data?.items ?? [];

  const total = sessionsQuery.data?.total ?? sessions.length;
  const totalPages = sessionsQuery.data?.totalPages ?? 1;

  const activeSessionsCount = sessions.filter(isActiveSession).length;
  const endedSessionsCount = sessions.filter(
    (session) => !isActiveSession(session),
  ).length;

  const isFiltering = Boolean(
    search ||
    eventFilter ||
    staffFilter ||
    deviceFilter ||
    checkpointFilter ||
    statusFilter,
  );

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;

    const term = search.trim().toLowerCase();

    return sessions.filter((session) => {
      return (
        getEventName(session).toLowerCase().includes(term) ||
        getStaffName(session).toLowerCase().includes(term) ||
        getDeviceName(session).toLowerCase().includes(term) ||
        getCheckpointName(session).toLowerCase().includes(term) ||
        session.id.toLowerCase().includes(term)
      );
    });
  }, [sessions, search]);

  const form = useForm<StartStaffSessionFormValues>({
    resolver: zodResolver(startStaffSessionSchema),
    defaultValues: {
      eventId: "",
      staffUserId: "",
      deviceId: "",
      checkpointId: "",
    },
  });

  const selectedEventId = form.watch("eventId");

  const formDevicesQuery = useDevices({
    page: 1,
    limit: 100,
    eventId: selectedEventId || undefined,
  });

  const formCheckpointsQuery = useCheckpoints({
    page: 1,
    limit: 100,
    eventId: selectedEventId || undefined,
  });

  const formDevices = formDevicesQuery.data?.items ?? [];
  const formCheckpoints = formCheckpointsQuery.data?.items ?? [];

  useEffect(() => {
    if (!sessionsQuery.isSuccess) return;

    if (sessions.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [sessions.length, sessionsQuery.isSuccess, page]);

  function openStartModal() {
    form.reset({
      eventId: eventFilter || "",
      staffUserId: staffFilter || "",
      deviceId: deviceFilter || "",
      checkpointId: checkpointFilter || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (startSessionMutation.isPending) return;

    setModalOpen(false);
    form.reset();
  }

  function requestEndSession(session: StaffSession) {
    setSelectedSession(session);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (endSessionMutation.isPending) return;

    setSelectedSession(null);
    setConfirmOpen(false);
  }

  const submitStartSession: SubmitHandler<StartStaffSessionFormValues> = (
    values,
  ) => {
    startSessionMutation.mutate(
      {
        eventId: values.eventId,
        staffUserId: values.staffUserId,
        deviceId: values.deviceId,
        checkpointId: values.checkpointId,
      },
      {
        onSuccess: closeModal,
      },
    );
  };

  function confirmEndSession() {
    if (!selectedSession) return;

    endSessionMutation.mutate(selectedSession.id, {
      onSuccess: closeConfirm,
    });
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setEventFilter("");
    setStaffFilter("");
    setDeviceFilter("");
    setCheckpointFilter("");
    setStatusFilter("");
  }

  function getEventOptionLabel(event: {
    id: string;
    titleAr?: string | null;
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
        eyebrow="Staff Sessions"
        title="جلسات الموظفين"
        description="مراقبة تشغيل موظفي السكانر على الأجهزة ونقاط الدخول."
        actions={
          <Button onClick={openStartModal}>
            <Plus className="h-4 w-4" />
            جلسة جديدة
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">الجلسات</p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {sessionsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <UserRoundCheck className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نشطة</p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {sessionsQuery.isLoading ? "..." : activeSessionsCount}
            </h3>

            <Badge variant="success">
              <CheckCircle2 className="h-4 w-4" />
              نشطة
            </Badge>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">منتهية</p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {sessionsQuery.isLoading ? "..." : endedSessionsCount}
            </h3>

            <Badge variant="muted">
              <TimerOff className="h-4 w-4" />
              منتهية
            </Badge>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge variant={sessionsQuery.isFetching ? "warning" : "success"}>
              {sessionsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => sessionsQuery.refetch()}
              disabled={sessionsQuery.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  sessionsQuery.isFetching ? "animate-spin" : ""
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
                <CardTitle>قائمة الجلسات</CardTitle>

                <CardDescription>
                  كل صف يمثل فترة تشغيل فعلية لموظف على جهاز ونقطة دخول.
                </CardDescription>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isFiltering ? (
                  <Button variant="outline" onClick={clearFilters}>
                    مسح الفلاتر
                  </Button>
                ) : null}

                <Button variant="outline" onClick={openStartModal}>
                  <Plus className="h-4 w-4" />
                  جلسة جديدة
                </Button>
              </div>
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-3">
              <Input
                value={search}
                placeholder="بحث..."
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
                  setDeviceFilter("");
                  setCheckpointFilter("");
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
                value={statusFilter}
                placeholder="كل الحالات"
                onChange={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                options={[
                  { label: "كل الحالات", value: "" },
                  { label: "نشطة", value: "ACTIVE" },
                  { label: "منتهية", value: "ENDED" },
                  { label: "مغلقة", value: "CLOSED" },
                  { label: "منتهية", value: "EXPIRED" },
                ]}
              />
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
              <Select
                value={deviceFilter}
                placeholder="كل الأجهزة"
                onChange={(value) => {
                  setPage(1);
                  setDeviceFilter(value);
                }}
                options={[
                  { label: "كل الأجهزة", value: "" },
                  ...devices
                    .filter((device) => device.status !== "REVOKED")
                    .map((device) => ({
                      label: `${device.name || device.code || device.id}${
                        device.code ? ` - ${device.code}` : ""
                      }`,
                      value: device.id,
                    })),
                ]}
              />

              <Select
                value={checkpointFilter}
                placeholder="كل نقاط الدخول"
                onChange={(value) => {
                  setPage(1);
                  setCheckpointFilter(value);
                }}
                options={[
                  { label: "كل نقاط الدخول", value: "" },
                  ...checkpoints
                    .filter((checkpoint) => checkpoint.isActive !== false)
                    .map((checkpoint) => ({
                      label:
                        checkpoint.nameAr || checkpoint.nameEn || checkpoint.id,
                      value: checkpoint.id,
                    })),
                ]}
              />
            </div>
          </div>

          {sessionsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل الجلسات...
                </p>
              </div>
            </div>
          ) : sessionsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل الجلسات
                </p>

                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
                </p>

                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => sessionsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Clock3 className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  {isFiltering ? "لا توجد نتائج" : "لا توجد جلسات"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل الفلاتر أو امسحها."
                    : "ستظهر هنا جلسات موظفي السكانر عند بدء التشغيل."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  ) : null}

                  <Button onClick={openStartModal}>
                    <Plus className="h-4 w-4" />
                    جلسة جديدة
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
                      <TableHead className="w-[20%]">الموظف</TableHead>
                      <TableHead className="w-[17%]">الفعالية</TableHead>
                      <TableHead className="w-[15%]">الجهاز</TableHead>
                      <TableHead className="w-[16%]">النقطة</TableHead>
                      <TableHead className="w-[7%] text-center">
                        الحالة
                      </TableHead>
                      <TableHead className="w-[10%]">البداية</TableHead>
                      <TableHead className="w-[10%]">النهاية</TableHead>
                      <TableHead className="w-[5%] text-center">
                        إجراء
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#4B4B4B]">
                              {getStaffName(session)}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45"
                            >
                              {session.staffUser?.email || session.staffUserId}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/35">
                              ID: {session.id.slice(0, 8)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {getEventName(session)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {getDeviceName(session)}
                            </p>

                            {session.device?.code ? (
                              <p
                                dir="ltr"
                                className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45"
                              >
                                {session.device.code}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {getCheckpointName(session)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex justify-center">
                            <Badge
                              variant={getStatusVariant(session.status)}
                              title={
                                isActiveSession(session)
                                  ? "نشطة"
                                  : statusLabels[session.status ?? ""] ||
                                    "منتهية"
                              }
                              aria-label={
                                isActiveSession(session)
                                  ? "نشطة"
                                  : statusLabels[session.status ?? ""] ||
                                    "منتهية"
                              }
                              className="h-8 w-8 justify-center rounded-full p-0"
                            >
                              {getStatusIcon(session)}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p
                            dir="ltr"
                            className="truncate text-right text-sm font-bold text-[#4B4B4B]"
                            title={formatDateTime(
                              session.startedAt || session.createdAt,
                            )}
                          >
                            {formatDateTime(
                              session.startedAt || session.createdAt,
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">
                          <p
                            dir="ltr"
                            className="truncate text-right text-sm font-bold text-[#4B4B4B]"
                            title={formatDateTime(session.endedAt)}
                          >
                            {formatDateTime(session.endedAt)}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="danger"
                              title="إنهاء"
                              aria-label="إنهاء"
                              className="h-8 w-8 shrink-0 p-0"
                              disabled={
                                !isActiveSession(session) ||
                                endSessionMutation.isPending
                              }
                              onClick={() => requestEndSession(session)}
                            >
                              {endSessionMutation.isPending &&
                              selectedSession?.id === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TimerOff className="h-4 w-4" />
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
                  الصفحة {page} من {totalPages} — عرض {filteredSessions.length}{" "}
                  من أصل {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || sessionsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages || sessionsQuery.isFetching}
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
        title="بدء جلسة موظف"
        description="تشغيل يدوي لموظف على جهاز ونقطة دخول محددة."
        className="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={startSessionMutation.isPending}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(submitStartSession)}
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              بدء
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(submitStartSession)}
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

              form.setValue("deviceId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });

              form.setValue("checkpointId", "", {
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
            value={form.watch("staffUserId")}
            placeholder="اختر الموظف"
            error={form.formState.errors.staffUserId?.message}
            onChange={(value) => {
              form.setValue("staffUserId", value, {
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

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="الجهاز"
              value={form.watch("deviceId")}
              placeholder={
                selectedEventId ? "اختر الجهاز" : "اختر الفعالية أولًا"
              }
              disabled={!selectedEventId || formDevicesQuery.isLoading}
              error={form.formState.errors.deviceId?.message}
              onChange={(value) => {
                form.setValue("deviceId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              options={formDevices
                .filter((device) => device.status !== "REVOKED")
                .map((device) => ({
                  label: `${device.name || device.code || device.id}${
                    device.code ? ` - ${device.code}` : ""
                  }`,
                  value: device.id,
                }))}
            />

            <Select
              label="نقطة الدخول"
              value={form.watch("checkpointId")}
              placeholder={
                selectedEventId ? "اختر نقطة الدخول" : "اختر الفعالية أولًا"
              }
              disabled={!selectedEventId || formCheckpointsQuery.isLoading}
              error={form.formState.errors.checkpointId?.message}
              onChange={(value) => {
                form.setValue("checkpointId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              options={formCheckpoints
                .filter((checkpoint) => checkpoint.isActive !== false)
                .map((checkpoint) => ({
                  label:
                    checkpoint.nameAr || checkpoint.nameEn || checkpoint.id,
                  value: checkpoint.id,
                }))}
            />
          </div>

          <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
            <p className="text-sm font-extrabold text-[#4B4B4B]">
              ملاحظة مختصرة
            </p>

            <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/55">
              غالبًا الموظف يبدأ الجلسة من واجهة السكانر، وهذه الصفحة للمراقبة
              أو التشغيل اليدوي عند الحاجة.
            </p>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="إنهاء الجلسة"
        description={
          selectedSession
            ? `سيتم إنهاء جلسة ${getStaffName(selectedSession)}.`
            : "سيتم إنهاء هذه الجلسة."
        }
        confirmText="إنهاء"
        variant="danger"
        isLoading={endSessionMutation.isPending}
        onClose={closeConfirm}
        onConfirm={confirmEndSession}
      />
    </div>
  );
}
