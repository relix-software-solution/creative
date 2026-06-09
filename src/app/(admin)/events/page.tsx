"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
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
import { useClients } from "@/features/clients/clients.queries";
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/features/events/events.queries";
import { EventFormValues, eventSchema } from "@/features/events/events.schema";
import {
  DuplicateStrategy,
  EventItem,
  EventType,
} from "@/features/events/events.types";

type PendingAction = "create" | "update" | "delete" | null;

const eventTypeLabels: Record<EventType, string> = {
  EXHIBITION: "معرض",
  CONFERENCE: "مؤتمر",
  WORKSHOP: "ورشة عمل",
  OTHER: "أخرى",
};

const duplicateStrategyLabels: Record<DuplicateStrategy, string> = {
  PHONE: "حسب الهاتف",
  EMAIL: "حسب البريد",
  EXTERNAL_ID: "حسب الرقم الخارجي",
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function toIsoOrUndefined(value?: string) {
  if (!value) return undefined;
  return new Date(value).toISOString();
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

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [pendingValues, setPendingValues] = useState<EventFormValues | null>(
    null,
  );

  const eventsParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      clientId: clientFilter || undefined,
    }),
    [page, search, clientFilter],
  );

  const eventsQuery = useEvents(eventsParams);
  const clientsQuery = useClients({ page: 1, limit: 100 });

  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      clientId: "",
      type: "EXHIBITION",
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      startsAt: "",
      endsAt: "",
      timezone: "Asia/Damascus",
      allowReEntry: true,
      duplicateStrategy: "PHONE",
      qrValidFrom: "",
      qrValidUntil: "",
    },
  });

  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? events.length;
  const totalPages = eventsQuery.data?.totalPages ?? 1;
  const clients = clientsQuery.data?.items ?? [];

  const isSubmitting =
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    deleteEventMutation.isPending;

  function openCreateModal() {
    setSelectedEvent(null);
    form.reset({
      clientId: "",
      type: "EXHIBITION",
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      startsAt: "",
      endsAt: "",
      timezone: "Asia/Damascus",
      allowReEntry: true,
      duplicateStrategy: "PHONE",
      qrValidFrom: "",
      qrValidUntil: "",
    });
    setFormModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setSelectedEvent(event);
    form.reset({
      clientId: event.clientId,
      type: event.type,
      titleAr: event.titleAr,
      titleEn: event.titleEn,
      descriptionAr: event.descriptionAr ?? "",
      descriptionEn: event.descriptionEn ?? "",
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      timezone: event.timezone ?? "Asia/Damascus",
      allowReEntry: event.allowReEntry,
      duplicateStrategy: event.duplicateStrategy,
      qrValidFrom: toDatetimeLocal(event.qrValidFrom),
      qrValidUntil: toDatetimeLocal(event.qrValidUntil),
    });
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setSelectedEvent(null);
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

  function requestSubmit(values: EventFormValues) {
    setPendingValues(values);
    setPendingAction(selectedEvent ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestDelete(event: EventItem) {
    setSelectedEvent(event);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function normalizePayload(values: EventFormValues) {
    return {
      clientId: values.clientId,
      type: values.type,
      titleAr: values.titleAr.trim(),
      titleEn: values.titleEn.trim(),
      descriptionAr: values.descriptionAr?.trim() || undefined,
      descriptionEn: values.descriptionEn?.trim() || undefined,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      timezone: values.timezone.trim() || "Asia/Damascus",
      allowReEntry: values.allowReEntry,
      duplicateStrategy: values.duplicateStrategy,
      qrValidFrom: toIsoOrUndefined(values.qrValidFrom),
      qrValidUntil: toIsoOrUndefined(values.qrValidUntil),
    };
  }

  function confirmAction() {
    if (pendingAction === "delete" && selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id, {
        onSuccess: () => {
          closeConfirm();
          setSelectedEvent(null);
        },
      });

      return;
    }

    if (!pendingValues) return;

    const payload = normalizePayload(pendingValues);

    if (pendingAction === "update" && selectedEvent) {
      updateEventMutation.mutate(
        {
          id: selectedEvent.id,
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
      createEventMutation.mutate(payload, {
        onSuccess: () => {
          closeConfirm();
          closeFormModal();
        },
      });
    }
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إنشاء الفعالية"
      : pendingAction === "update"
        ? "تأكيد تعديل الفعالية"
        : "تأكيد حذف الفعالية";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إنشاء فعالية جديدة وربطها بالعميل المحدد."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات الفعالية: ${selectedEvent?.titleAr ?? ""}.`
        : `سيتم حذف الفعالية: ${selectedEvent?.titleAr ?? ""}. تأكد من عدم وجود بيانات تشغيلية مهمة مرتبطة بها.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Events Management"
        title="إدارة الفعاليات"
        description="إنشاء وإدارة الفعاليات التابعة للعملاء، مع ضبط التواريخ وصلاحية QR وسياسة التكرار."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة فعالية
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي الفعاليات
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {events.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={eventsQuery.isFetching ? "warning" : "success"}>
              {eventsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>قائمة الفعاليات</CardTitle>
              <CardDescription>
                استعرض الفعاليات وابحث أو فلتر حسب العميل.
              </CardDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px_auto] xl:min-w-[760px]">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="ابحث باسم الفعالية..."
                icon={<Search className="h-5 w-5" />}
              />

              <Select
                value={clientFilter}
                placeholder="كل العملاء"
                onChange={(value) => {
                  setPage(1);
                  setClientFilter(value);
                }}
                options={[
                  { label: "كل العملاء", value: "" },
                  ...clients.map((client) => ({
                    label: client.name,
                    value: client.id,
                  })),
                ]}
              />

              <Button variant="secondary" onClick={handleSearch}>
                بحث
              </Button>
            </div>
          </div>

          {eventsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل الفعاليات...
                </p>
              </div>
            </div>
          ) : eventsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل الفعاليات
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => eventsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد فعاليات بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أضف أول فعالية حتى نكمل بعدها المواقع والمناطق ونقاط الدخول.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  إضافة فعالية
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>البداية</TableHead>
                    <TableHead>النهاية</TableHead>
                    <TableHead>QR</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">{event.titleAr}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {event.titleEn}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {event.client?.name ||
                          clients.find((client) => client.id === event.clientId)
                            ?.name ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        <Badge variant="gold">
                          {eventTypeLabels[event.type]}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatDate(event.startsAt)}</TableCell>
                      <TableCell>{formatDate(event.endsAt)}</TableCell>

                      <TableCell>
                        <Badge
                          variant={event.allowReEntry ? "success" : "muted"}
                        >
                          {event.allowReEntry ? "يسمح بالعودة" : "دخول مرة"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(event)}
                          >
                            <Edit className="h-4 w-4" />
                            تعديل
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => requestDelete(event)}
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
        title={selectedEvent ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
        description={
          selectedEvent
            ? "عدّل بيانات الفعالية ثم أكّد العملية قبل الحفظ."
            : "أدخل بيانات الفعالية واربطها بالعميل المناسب."
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
              {selectedEvent ? "متابعة التعديل" : "متابعة الإضافة"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={form.handleSubmit(requestSubmit)}
        >
          <Select
            label="العميل"
            className="lg:col-span-2"
            value={form.watch("clientId")}
            placeholder="اختر العميل"
            error={form.formState.errors.clientId?.message}
            onChange={(value) => {
              form.setValue("clientId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={clients.map((client) => ({
              label: client.name,
              value: client.id,
            }))}
          />

          <Input
            label="اسم الفعالية بالعربي"
            placeholder="مثال: معرض دمشق الدولي"
            error={form.formState.errors.titleAr?.message}
            {...form.register("titleAr")}
          />

          <Input
            label="اسم الفعالية بالإنجليزي"
            placeholder="Damascus International Fair"
            error={form.formState.errors.titleEn?.message}
            {...form.register("titleEn")}
          />

          <Select
            label="نوع الفعالية"
            value={form.watch("type")}
            error={form.formState.errors.type?.message}
            onChange={(value) => {
              form.setValue("type", value as EventType, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: "معرض", value: "EXHIBITION" },
              { label: "مؤتمر", value: "CONFERENCE" },
              { label: "ورشة عمل", value: "WORKSHOP" },
              { label: "أخرى", value: "OTHER" },
            ]}
          />

          <Input
            label="المنطقة الزمنية"
            placeholder="Asia/Damascus"
            error={form.formState.errors.timezone?.message}
            {...form.register("timezone")}
          />

          <Input
            label="تاريخ البداية"
            type="datetime-local"
            error={form.formState.errors.startsAt?.message}
            {...form.register("startsAt")}
          />

          <Input
            label="تاريخ النهاية"
            type="datetime-local"
            error={form.formState.errors.endsAt?.message}
            {...form.register("endsAt")}
          />

          <Input
            label="صلاحية QR من"
            type="datetime-local"
            error={form.formState.errors.qrValidFrom?.message}
            {...form.register("qrValidFrom")}
          />

          <Input
            label="صلاحية QR حتى"
            type="datetime-local"
            error={form.formState.errors.qrValidUntil?.message}
            {...form.register("qrValidUntil")}
          />

          <Select
            label="استراتيجية منع التكرار"
            value={form.watch("duplicateStrategy")}
            error={form.formState.errors.duplicateStrategy?.message}
            onChange={(value) => {
              form.setValue("duplicateStrategy", value as DuplicateStrategy, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={[
              { label: duplicateStrategyLabels.PHONE, value: "PHONE" },
              { label: duplicateStrategyLabels.EMAIL, value: "EMAIL" },
              {
                label: duplicateStrategyLabels.EXTERNAL_ID,
                value: "EXTERNAL_ID",
              },
            ]}
          />

          <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#A88042]"
              {...form.register("allowReEntry")}
            />
            <span className="text-sm font-extrabold text-[#4B4B4B]">
              السماح بإعادة الدخول بنفس QR
            </span>
          </label>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف العربي
            </label>
            <textarea
              {...form.register("descriptionAr")}
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
              placeholder="أدخل وصف الفعالية بالعربي..."
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-bold text-[#4B4B4B]">
              الوصف الإنجليزي
            </label>
            <textarea
              {...form.register("descriptionEn")}
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
              placeholder="Enter event description in English..."
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
