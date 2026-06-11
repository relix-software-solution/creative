"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Clipboard,
  Edit,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcwKey,
  Search,
  ShieldAlert,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
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
  deviceSchema,
  DeviceFormValues,
} from "@/features/devices/devices.schema";
import {
  useActivateDevice,
  useCreateDevice,
  useDeleteDevice,
  useDevices,
  useRevokeDevice,
  useRotateDeviceApiKey,
  useSuspendDevice,
  useUpdateDevice,
} from "@/features/devices/devices.queries";
import {
  CreateDevicePayload,
  Device,
  DeviceSecretResponse,
  DeviceStatus,
  UpdateDevicePayload,
} from "@/features/devices/devices.types";

type DeviceModalMode = "create" | "edit";
type PendingAction =
  | "activate"
  | "suspend"
  | "revoke"
  | "delete"
  | "rotate"
  | null;

const statusLabels: Record<string, string> = {
  ACTIVE: "فعّال",
  SUSPENDED: "موقوف",
  REVOKED: "ملغى",
  INACTIVE: "غير فعّال",
};

function getStatusVariant(
  status?: DeviceStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "REVOKED") return "danger";
  if (status === "INACTIVE") return "muted";
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

function parseMetadata(value?: string) {
  if (!value?.trim()) return undefined;
  return JSON.parse(value) as Record<string, unknown>;
}

function buildCreatePayload(values: DeviceFormValues): CreateDevicePayload {
  return {
    eventId: values.eventId,
    name: values.name.trim(),
    code: values.code?.trim() || undefined,
    metadata: parseMetadata(values.metadataJson),
  };
}

function buildUpdatePayload(values: DeviceFormValues): UpdateDevicePayload {
  return {
    name: values.name.trim(),
    code: values.code?.trim() || undefined,
    metadata: parseMetadata(values.metadataJson),
  };
}

function stringifyMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) return "";

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "";
  }
}

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceModalMode, setDeviceModalMode] =
    useState<DeviceModalMode>("create");

  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [secretResponse, setSecretResponse] =
    useState<DeviceSecretResponse | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const devicesParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      eventId: eventFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, search, eventFilter, statusFilter],
  );

  const devicesQuery = useDevices(devicesParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const createDeviceMutation = useCreateDevice();
  const updateDeviceMutation = useUpdateDevice();
  const rotateDeviceMutation = useRotateDeviceApiKey();
  const activateDeviceMutation = useActivateDevice();
  const suspendDeviceMutation = useSuspendDevice();
  const revokeDeviceMutation = useRevokeDevice();
  const deleteDeviceMutation = useDeleteDevice();

  const devices = devicesQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const total = devicesQuery.data?.total ?? devices.length;
  const totalPages = devicesQuery.data?.totalPages ?? 1;

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      eventId: "",
      name: "",
      code: "",
      metadataJson: "",
    },
  });

  const isDeviceSubmitting =
    createDeviceMutation.isPending || updateDeviceMutation.isPending;

  const isActionSubmitting =
    rotateDeviceMutation.isPending ||
    activateDeviceMutation.isPending ||
    suspendDeviceMutation.isPending ||
    revokeDeviceMutation.isPending ||
    deleteDeviceMutation.isPending;

  function openCreateModal() {
    setDeviceModalMode("create");
    setSelectedDevice(null);
    form.reset({
      eventId: eventFilter || "",
      name: "",
      code: "",
      metadataJson: JSON.stringify(
        {
          platform: "web",
          appVersion: "1.0.0",
        },
        null,
        2,
      ),
    });
    setDeviceModalOpen(true);
  }

  function openEditModal(device: Device) {
    setDeviceModalMode("edit");
    setSelectedDevice(device);
    form.reset({
      eventId: device.eventId,
      name: device.name ?? "",
      code: device.code ?? "",
      metadataJson: stringifyMetadata(device.metadata),
    });
    setDeviceModalOpen(true);
  }

  function closeDeviceModal() {
    if (isDeviceSubmitting) return;
    setDeviceModalOpen(false);
    setSelectedDevice(null);
    form.reset();
  }

  function openSecretModal(response: DeviceSecretResponse) {
    setSecretResponse(response);
    setSecretModalOpen(true);
  }

  function closeSecretModal() {
    setSecretModalOpen(false);
    setSecretResponse(null);
  }

  function requestAction(device: Device, action: PendingAction) {
    setSelectedDevice(device);
    setPendingAction(action);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (isActionSubmitting) return;
    setSelectedDevice(null);
    setPendingAction(null);
    setConfirmOpen(false);
  }

  const submitDevice: SubmitHandler<DeviceFormValues> = (values) => {
    if (deviceModalMode === "create") {
      createDeviceMutation.mutate(buildCreatePayload(values), {
        onSuccess: (response) => {
          closeDeviceModal();
          openSecretModal(response);
        },
      });

      return;
    }

    if (!selectedDevice) return;

    updateDeviceMutation.mutate(
      {
        id: selectedDevice.id,
        payload: buildUpdatePayload(values),
      },
      {
        onSuccess: closeDeviceModal,
      },
    );
  };

  function confirmAction() {
    if (!selectedDevice || !pendingAction) return;

    if (pendingAction === "rotate") {
      rotateDeviceMutation.mutate(selectedDevice.id, {
        onSuccess: (response) => {
          closeConfirm();
          openSecretModal(response);
        },
      });
      return;
    }

    if (pendingAction === "activate") {
      activateDeviceMutation.mutate(selectedDevice.id, {
        onSuccess: closeConfirm,
      });
      return;
    }

    if (pendingAction === "suspend") {
      suspendDeviceMutation.mutate(selectedDevice.id, {
        onSuccess: closeConfirm,
      });
      return;
    }

    if (pendingAction === "revoke") {
      revokeDeviceMutation.mutate(selectedDevice.id, {
        onSuccess: closeConfirm,
      });
      return;
    }

    if (pendingAction === "delete") {
      deleteDeviceMutation.mutate(selectedDevice.id, {
        onSuccess: closeConfirm,
      });
    }
  }

  async function copySecret() {
    if (!secretResponse?.rawApiKey) return;

    try {
      await navigator.clipboard.writeText(secretResponse.rawApiKey);
      toast.success("تم نسخ API Key");
    } catch {
      toast.error("تعذر نسخ المفتاح");
    }
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setEventFilter("");
    setStatusFilter("");
  }

  function getConfirmCopy() {
    if (!selectedDevice) {
      return {
        title: "تأكيد العملية",
        description: "هل تريد تنفيذ هذه العملية؟",
        confirmText: "تأكيد",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "rotate") {
      return {
        title: "تدوير API Key",
        description:
          "سيتم إنشاء مفتاح جديد للجهاز، والمفتاح القديم لن يعمل بعد ذلك.",
        confirmText: "تدوير المفتاح",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "activate") {
      return {
        title: "تفعيل الجهاز",
        description: `سيتم تفعيل الجهاز ${selectedDevice.name}.`,
        confirmText: "تفعيل",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "suspend") {
      return {
        title: "إيقاف الجهاز",
        description: `سيتم إيقاف الجهاز ${selectedDevice.name} مؤقتًا.`,
        confirmText: "إيقاف",
        variant: "danger" as const,
      };
    }

    if (pendingAction === "revoke") {
      return {
        title: "إلغاء الجهاز",
        description:
          "سيتم إلغاء الجهاز ومنعه من استخدام Device API Key. سجلات السكانر ستبقى محفوظة.",
        confirmText: "إلغاء الجهاز",
        variant: "danger" as const,
      };
    }

    return {
      title: "حذف الجهاز",
      description:
        "سيتم حذف/إلغاء الجهاز حسب منطق الباك. لا تستخدم هذا الخيار إلا عند الحاجة.",
      confirmText: "حذف",
      variant: "danger" as const,
    };
  }

  const confirmCopy = getConfirmCopy();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Devices"
        title="إدارة الأجهزة"
        description="إدارة أجهزة السكانر وربطها بالفعاليات وتوليد Device API Key للاستخدام لاحقًا في تطبيق الموظفين."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            جهاز جديد
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">إجمالي الأجهزة</p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <Smartphone className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">فعّالة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {devices.filter((device) => device.status === "ACTIVE").length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">موقوفة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {devices.filter((device) => device.status === "SUSPENDED").length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={devicesQuery.isFetching ? "warning" : "success"}>
              {devicesQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>قائمة الأجهزة</CardTitle>
                <CardDescription>
                  كل جهاز يحصل على API Key خاص به لاستخدامه في مسارات
                  <span className="mx-1 font-extrabold">/device</span>
                  لاحقًا.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => devicesQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>

                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_260px_200px]">
              <Input
                value={search}
                placeholder="بحث باسم الجهاز أو الكود..."
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
                    label: event.titleAr,
                    value: event.id,
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
                  { label: "فعّال", value: "ACTIVE" },
                  { label: "موقوف", value: "SUSPENDED" },
                  { label: "ملغى", value: "REVOKED" },
                  { label: "غير فعّال", value: "INACTIVE" },
                ]}
              />
            </div>
          </div>

          {devicesQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل الأجهزة...
                </p>
              </div>
            </div>
          ) : devicesQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل الأجهزة
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => devicesQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <Smartphone className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد أجهزة
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف جهاز سكانر جديد واربطه بفعالية حتى نستخدمه لاحقًا في
                  عمليات الدخول والمزامنة.
                </p>

                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  جهاز جديد
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الجهاز</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر ظهور</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                            <Smartphone className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-extrabold">{device.name}</p>
                            <p
                              dir="ltr"
                              className="mt-1 text-xs font-bold text-[#4B4B4B]/45"
                            >
                              {device.code || device.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {device.event?.titleAr ||
                          events.find((event) => event.id === device.eventId)
                            ?.titleAr ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(device.status)}>
                          {statusLabels[device.status ?? ""] ||
                            device.status ||
                            "غير محدد"}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatDate(device.lastSeenAt)}</TableCell>
                      <TableCell>{formatDate(device.createdAt)}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(device)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAction(device, "rotate")}
                          >
                            <RotateCcwKey className="h-4 w-4" />
                            API Key
                          </Button>

                          {device.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => requestAction(device, "suspend")}
                            >
                              <XCircle className="h-4 w-4" />
                              إيقاف
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => requestAction(device, "activate")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              تفعيل
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAction(device, "revoke")}
                          >
                            <ShieldAlert className="h-4 w-4" />
                            Revoke
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestAction(device, "delete")}
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
        open={deviceModalOpen}
        onClose={closeDeviceModal}
        title={deviceModalMode === "create" ? "إضافة جهاز" : "تعديل جهاز"}
        description={
          deviceModalMode === "create"
            ? "أنشئ جهاز سكانر جديد واربطه بفعالية."
            : "عدّل بيانات الجهاز والـ metadata الخاصة به."
        }
        className="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeDeviceModal}
              disabled={isDeviceSubmitting}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(submitDevice)}
              disabled={isDeviceSubmitting}
            >
              {isDeviceSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              حفظ
            </Button>
          </>
        }
      >
        <form className="grid gap-4" onSubmit={form.handleSubmit(submitDevice)}>
          <Select
            label="الفعالية"
            value={form.watch("eventId")}
            disabled={deviceModalMode === "edit"}
            error={form.formState.errors.eventId?.message}
            placeholder="اختر الفعالية"
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

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="اسم الجهاز"
              error={form.formState.errors.name?.message}
              {...form.register("name")}
            />

            <Input
              label="كود الجهاز"
              dir="ltr"
              placeholder="K6_DEVICE_01"
              error={form.formState.errors.code?.message}
              {...form.register("code")}
            />
          </div>

          <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
            <p className="text-sm font-extrabold text-[#4B4B4B]">ملاحظة مهمة</p>
            <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/55">
              عند إنشاء الجهاز سيظهر Device API Key مرة واحدة. انسخه واحفظه لأنه
              سيستخدم لاحقًا في تطبيق السكانر.
            </p>
          </div>
        </form>
      </Modal>

      <Modal
        open={secretModalOpen}
        onClose={closeSecretModal}
        title="Device API Key"
        description="انسخ هذا المفتاح الآن. قد لا يظهر مرة أخرى إلا عند تدوير المفتاح."
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={closeSecretModal}>
              إغلاق
            </Button>

            <Button onClick={copySecret}>
              <Clipboard className="h-4 w-4" />
              نسخ المفتاح
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-extrabold text-amber-800">
              احفظ المفتاح الآن
            </p>
            <p className="mt-1 text-xs font-bold leading-6 text-amber-800/70">
              هذا المفتاح يعطي صلاحية للجهاز لاستخدام مسارات Device API مثل
              /device/me و /device/scans لاحقًا.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
            <p className="mb-2 text-xs font-bold text-[#4B4B4B]/50">الجهاز</p>
            <p className="font-extrabold text-[#4B4B4B]">
              {secretResponse?.device.name || "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black p-4 text-white">
            <div className="mb-2 flex items-center gap-2 text-[#D6B06E]">
              <KeyRound className="h-4 w-4" />
              <p className="text-sm font-extrabold">Raw API Key</p>
            </div>

            <pre
              dir="ltr"
              className="custom-scrollbar max-h-40 overflow-auto whitespace-pre-wrap break-all text-left text-xs font-bold leading-6 text-white/80"
            >
              {secretResponse?.rawApiKey}
            </pre>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        variant={confirmCopy.variant}
        isLoading={isActionSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
