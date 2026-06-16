"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Copy,
  Edit,
  ExternalLink,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  QrCode,
  RefreshCcw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
  useEventBranding,
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

const PAGE_LIMIT = 20;

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

const defaultTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#F8F8FF",
  text: "#4B4B4B",
  radius: "1.5rem",
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
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

function cleanOptional(value?: string) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000";

  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

function getBranding(event: EventItem) {
  return event.branding || event.eventBranding || null;
}

function getEventLogo(event: EventItem) {
  return getBranding(event)?.logoUrl || "";
}

function getDefaultFormValues(): EventFormValues {
  return {
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
    themePrimary: defaultTheme.primary,
    themePrimaryHover: defaultTheme.primaryHover,
    themeBackground: defaultTheme.background,
    themeText: defaultTheme.text,
    themeRadius: defaultTheme.radius,
  };
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

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [backgroundPreview, setBackgroundPreview] = useState("");

  const [registrationQrOpen, setRegistrationQrOpen] = useState(false);
  const [registrationQrEvent, setRegistrationQrEvent] =
    useState<EventItem | null>(null);

  const [editingEventId, setEditingEventId] = useState("");

  const eventsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
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
  const brandingQuery = useEventBranding(editingEventId);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaultFormValues(),
  });

  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? events.length;
  const totalPages = eventsQuery.data?.totalPages ?? 1;
  const clients = clientsQuery.data?.items ?? [];
  const watchedValues = form.watch();

  const isSubmitting =
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    deleteEventMutation.isPending;

  const isFiltering = Boolean(search || clientFilter);

  useEffect(() => {
    if (!eventsQuery.isSuccess) return;

    if (events.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [events.length, eventsQuery.isSuccess, page]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (backgroundPreview.startsWith("blob:")) {
        URL.revokeObjectURL(backgroundPreview);
      }
    };
  }, [logoPreview, backgroundPreview]);

  useEffect(() => {
    if (!formModalOpen) return;
    if (!selectedEvent) return;
    if (!brandingQuery.data) return;

    const branding = brandingQuery.data;

    setLogoPreview(resolveAssetUrl(branding.logoUrl));
    setBackgroundPreview(resolveAssetUrl(branding.backgroundImageUrl));

    form.setValue(
      "themePrimary",
      branding.theme?.primary ?? defaultTheme.primary,
    );
    form.setValue(
      "themePrimaryHover",
      branding.theme?.primaryHover ?? defaultTheme.primaryHover,
    );
    form.setValue(
      "themeBackground",
      branding.theme?.background ?? defaultTheme.background,
    );
    form.setValue("themeText", branding.theme?.text ?? defaultTheme.text);
    form.setValue("themeRadius", branding.theme?.radius ?? defaultTheme.radius);
  }, [brandingQuery.data, form, formModalOpen, selectedEvent]);

  function resetAssets() {
    if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    if (backgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(backgroundPreview);
    }

    setLogoFile(null);
    setBackgroundFile(null);
    setLogoPreview("");
    setBackgroundPreview("");
  }

  function openCreateModal() {
    setSelectedEvent(null);
    setPendingValues(null);
    resetAssets();
    form.reset(getDefaultFormValues());
    setFormModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setSelectedEvent(event);
    setPendingValues(null);
    resetAssets();

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
      themePrimary: defaultTheme.primary,
      themePrimaryHover: defaultTheme.primaryHover,
      themeBackground: defaultTheme.background,
      themeText: defaultTheme.text,
      themeRadius: defaultTheme.radius,
    });

    setEditingEventId(event.id);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    if (isSubmitting) return;

    setFormModalOpen(false);
    setSelectedEvent(null);
    setPendingValues(null);
    setEditingEventId("");
    resetAssets();
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
    setSearchInput("");
    setSearch("");
    setClientFilter("");
    setPage(1);
  }

  function requestSubmit(values: EventFormValues) {
    setPendingValues(values);
    setPendingAction(selectedEvent ? "update" : "create");
    setConfirmOpen(true);
  }

  function requestDelete(event: EventItem) {
    setSelectedEvent(event);
    setPendingValues(null);
    setPendingAction("delete");
    setConfirmOpen(true);
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    type: "logo" | "background",
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === "logo") {
      if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);

      setLogoFile(file);
      setLogoPreview(previewUrl);
      return;
    }

    if (backgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(backgroundPreview);
    }

    setBackgroundFile(file);
    setBackgroundPreview(previewUrl);
  }

  function removeImage(type: "logo" | "background") {
    if (type === "logo") {
      if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);

      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    if (backgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(backgroundPreview);
    }

    setBackgroundFile(null);
    setBackgroundPreview("");
  }

  function buildPayload(values: EventFormValues) {
    return {
      event: {
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
      },

      branding: {
        logo: logoFile,
        backgroundImage: backgroundFile,
        theme: {
          primary: cleanOptional(values.themePrimary),
          primaryHover: cleanOptional(values.themePrimaryHover),
          background: cleanOptional(values.themeBackground),
          text: cleanOptional(values.themeText),
          radius: cleanOptional(values.themeRadius),
        },
      },
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

    const payload = buildPayload(pendingValues);

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
      ? "سيتم إنشاء فعالية جديدة ثم رفع الهوية البصرية لها."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات الفعالية والهوية البصرية: ${
            selectedEvent?.titleAr ?? ""
          }.`
        : `سيتم أرشفة الفعالية: ${
            selectedEvent?.titleAr ?? ""
          }. الحذف في النظام ليس حذفًا نهائيًا.`;

  const confirmText =
    pendingAction === "create"
      ? "تأكيد الإضافة"
      : pendingAction === "update"
        ? "تأكيد التعديل"
        : "تأكيد الحذف";

  function getPublicRegistrationUrl(eventId: string) {
    if (typeof window === "undefined") return `/register/${eventId}`;

    return `${window.location.origin}/register/${eventId}`;
  }

  async function copyRegistrationLink(eventId: string) {
    const url = getPublicRegistrationUrl(eventId);

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
  }

  function openRegistrationQr(event: EventItem) {
    setRegistrationQrEvent(event);
    setRegistrationQrOpen(true);
  }

  function closeRegistrationQr() {
    setRegistrationQrOpen(false);
    setRegistrationQrEvent(null);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Events Management"
        title="إدارة الفعاليات"
        description="إنشاء وإدارة الفعاليات مع الهوية البصرية وصلاحية QR."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            إضافة فعالية
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            إجمالي الفعاليات
          </p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {eventsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>

          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {eventsQuery.isLoading ? "..." : events.length}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Badge variant={eventsQuery.isFetching ? "warning" : "success"}>
              {eventsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => eventsQuery.refetch()}
              disabled={eventsQuery.isFetching}
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  eventsQuery.isFetching ? "animate-spin" : ""
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
              <CardTitle>قائمة الفعاليات</CardTitle>

              <CardDescription>
                استعرض الفعاليات وابحث أو فلتر حسب العميل.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[280px]">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="ابحث باسم الفعالية..."
                  icon={<Search className="h-5 w-5" />}
                />

                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#4B4B4B]/45 transition hover:bg-black/5 hover:text-[#4B4B4B]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="w-full lg:w-[220px]">
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
              </div>

              <Button
                className="w-full lg:w-auto"
                variant="secondary"
                onClick={handleSearch}
              >
                بحث
              </Button>

              {isFiltering ? (
                <Button
                  className="w-full lg:w-auto"
                  variant="outline"
                  onClick={clearFilters}
                >
                  مسح
                </Button>
              ) : null}
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
                  {isFiltering ? "لا توجد نتائج مطابقة" : "لا توجد فعاليات بعد"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل البحث أو مسح الفلاتر."
                    : "أضف أول فعالية مع هويتها البصرية."}
                </p>

                <div className="mt-5 flex justify-center gap-2">
                  {isFiltering ? (
                    <Button variant="outline" onClick={clearFilters}>
                      مسح الفلاتر
                    </Button>
                  ) : null}

                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    إضافة فعالية
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
                      <TableHead className="w-[30%]">الفعالية</TableHead>
                      <TableHead className="w-[18%]">العميل</TableHead>
                      <TableHead className="w-[11%]">النوع</TableHead>
                      <TableHead className="w-[13%]">البداية</TableHead>
                      <TableHead className="w-[13%]">النهاية</TableHead>
                      <TableHead className="w-[8%]">QR</TableHead>
                      <TableHead className="w-[10%] text-center">
                        الإجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {events.map((event) => {
                      const logoUrl = getEventLogo(event);

                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8FF]">
                                {logoUrl ? (
                                  <img
                                    src={resolveAssetUrl(logoUrl)}
                                    alt={event.titleAr}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-[#A88042]" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-[#4B4B4B]">
                                  {event.titleAr}
                                </p>

                                <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                                  {event.titleEn}
                                </p>

                                <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/35">
                                  ID: {event.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <p className="truncate font-bold">
                              {event.client?.name ||
                                clients.find(
                                  (client) => client.id === event.clientId,
                                )?.name ||
                                "—"}
                            </p>
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
                              {event.allowReEntry ? "عودة" : "مرة"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                title="تعديل"
                                aria-label="تعديل"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => openEditModal(event)}
                                disabled={isSubmitting}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                title="QR رابط التسجيل"
                                aria-label="QR رابط التسجيل"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => openRegistrationQr(event)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="danger"
                                title="حذف"
                                aria-label="حذف"
                                className="h-8 w-8 shrink-0 p-0"
                                onClick={() => requestDelete(event)}
                                disabled={isSubmitting}
                              >
                                {deleteEventMutation.isPending &&
                                selectedEvent?.id === event.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {page} من {totalPages} — عرض {events.length} من أصل{" "}
                  {total}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || eventsQuery.isFetching}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages || eventsQuery.isFetching}
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
        title={selectedEvent ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
        description={
          selectedEvent
            ? "عدّل البيانات والهوية البصرية."
            : "أدخل بيانات الفعالية وارفع الهوية البصرية."
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
              {selectedEvent ? "متابعة التعديل" : "متابعة الإضافة"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(requestSubmit)}
        >
          <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                  بيانات الفعالية
                </h3>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                  المعلومات الأساسية والتواريخ.
                </p>
              </div>

              <CalendarDays className="h-5 w-5 text-[#A88042]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label="العميل"
                className="md:col-span-2"
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
                disabled={isSubmitting}
                {...form.register("titleAr")}
              />

              <Input
                label="اسم الفعالية بالإنجليزي"
                placeholder="Damascus International Fair"
                error={form.formState.errors.titleEn?.message}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                {...form.register("timezone")}
              />

              <Input
                label="تاريخ البداية"
                type="datetime-local"
                error={form.formState.errors.startsAt?.message}
                disabled={isSubmitting}
                {...form.register("startsAt")}
              />

              <Input
                label="تاريخ النهاية"
                type="datetime-local"
                error={form.formState.errors.endsAt?.message}
                disabled={isSubmitting}
                {...form.register("endsAt")}
              />

              <Input
                label="صلاحية QR من"
                type="datetime-local"
                error={form.formState.errors.qrValidFrom?.message}
                disabled={isSubmitting}
                {...form.register("qrValidFrom")}
              />

              <Input
                label="صلاحية QR حتى"
                type="datetime-local"
                error={form.formState.errors.qrValidUntil?.message}
                disabled={isSubmitting}
                {...form.register("qrValidUntil")}
              />

              <Select
                label="استراتيجية منع التكرار"
                value={form.watch("duplicateStrategy")}
                error={form.formState.errors.duplicateStrategy?.message}
                onChange={(value) => {
                  form.setValue(
                    "duplicateStrategy",
                    value as DuplicateStrategy,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  );
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
                  disabled={isSubmitting}
                  {...form.register("allowReEntry")}
                />

                <span className="text-sm font-extrabold text-[#4B4B4B]">
                  السماح بإعادة الدخول بنفس QR
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                  الهوية البصرية
                </h3>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                  ارفع الشعار والخلفية واختر الألوان.
                </p>
              </div>

              <Palette className="h-5 w-5 text-[#A88042]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ImageUploadCard
                label="شعار الفعالية"
                hint="PNG / JPG / WEBP"
                preview={logoPreview}
                onRemove={() => removeImage("logo")}
                onChange={(event) => handleImageChange(event, "logo")}
              />

              <ImageUploadCard
                label="صورة الخلفية"
                hint="يفضل صورة عريضة"
                preview={backgroundPreview}
                onRemove={() => removeImage("background")}
                onChange={(event) => handleImageChange(event, "background")}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ColorPickerField
                label="اللون الأساسي"
                value={watchedValues.themePrimary || defaultTheme.primary}
                onChange={(value) =>
                  form.setValue("themePrimary", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.themePrimary?.message}
              />

              <ColorPickerField
                label="لون Hover"
                value={
                  watchedValues.themePrimaryHover || defaultTheme.primaryHover
                }
                onChange={(value) =>
                  form.setValue("themePrimaryHover", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.themePrimaryHover?.message}
              />

              <ColorPickerField
                label="لون الخلفية"
                value={watchedValues.themeBackground || defaultTheme.background}
                onChange={(value) =>
                  form.setValue("themeBackground", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.themeBackground?.message}
              />

              <ColorPickerField
                label="لون النص"
                value={watchedValues.themeText || defaultTheme.text}
                onChange={(value) =>
                  form.setValue("themeText", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={form.formState.errors.themeText?.message}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                label="Radius"
                placeholder="1.5rem"
                dir="ltr"
                error={form.formState.errors.themeRadius?.message}
                disabled={isSubmitting}
                {...form.register("themeRadius")}
              />

              <div
                className="flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-extrabold text-white"
                style={{
                  backgroundColor:
                    watchedValues.themePrimary || defaultTheme.primary,
                  borderRadius:
                    watchedValues.themeRadius || defaultTheme.radius,
                }}
              >
                معاينة الزر
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
            <h3 className="mb-3 text-lg font-extrabold text-[#4B4B4B]">
              الوصف
            </h3>

            <div className="grid gap-3">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4B4B4B]">
                  الوصف العربي
                </label>

                <textarea
                  {...form.register("descriptionAr")}
                  rows={2}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
                  placeholder="أدخل وصف الفعالية بالعربي..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4B4B4B]">
                  الوصف الإنجليزي
                </label>

                <textarea
                  {...form.register("descriptionEn")}
                  rows={2}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/40 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5"
                  placeholder="Enter event description in English..."
                />
              </div>
            </div>
          </section>
        </form>
      </Modal>

      <Modal
        open={registrationQrOpen}
        onClose={closeRegistrationQr}
        title="QR رابط التسجيل"
        description={
          registrationQrEvent
            ? registrationQrEvent.titleAr
            : "رابط التسجيل العام للفعالية"
        }
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={closeRegistrationQr}>
              إغلاق
            </Button>

            {registrationQrEvent ? (
              <Button
                variant="outline"
                onClick={() => copyRegistrationLink(registrationQrEvent.id)}
              >
                <Copy className="h-4 w-4" />
                نسخ الرابط
              </Button>
            ) : null}

            {registrationQrEvent ? (
              <a
                href={getPublicRegistrationUrl(registrationQrEvent.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white transition hover:bg-[#8F6D37]"
              >
                <ExternalLink className="h-4 w-4" />
                فتح صفحة التسجيل
              </a>
            ) : null}
          </>
        }
      >
        {registrationQrEvent ? (
          <div className="space-y-5 text-center">
            <div className="rounded-[2rem] border border-black/10 bg-[#F8F8FF] p-5">
              <p className="text-sm font-extrabold text-[#A88042]">
                {eventTypeLabels[registrationQrEvent.type] ||
                  registrationQrEvent.type}
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
                {registrationQrEvent.titleAr}
              </h3>

              {registrationQrEvent.titleEn ? (
                <p className="mt-1 text-sm font-bold text-[#4B4B4B]/50">
                  {registrationQrEvent.titleEn}
                </p>
              ) : null}
            </div>

            <div className="mx-auto flex w-fit justify-center rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
              <QRCodeSVG
                value={getPublicRegistrationUrl(registrationQrEvent.id)}
                size={260}
                includeMargin
              />
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
              <p className="mb-2 text-xs font-bold text-[#4B4B4B]/50">
                رابط التسجيل
              </p>

              <p
                dir="ltr"
                className="break-all text-center text-sm font-extrabold text-[#4B4B4B]"
              >
                {getPublicRegistrationUrl(registrationQrEvent.id)}
              </p>
            </div>
          </div>
        ) : null}
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

function ImageUploadCard({
  label,
  hint,
  preview,
  onChange,
  onRemove,
}: {
  label: string;
  hint: string;
  preview: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8FF]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div>
          <p className="text-sm font-extrabold text-[#4B4B4B]">{label}</p>
          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">{hint}</p>
        </div>

        {preview ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
            aria-label="حذف الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <label className="group flex h-44 cursor-pointer items-center justify-center bg-white transition hover:bg-[#A88042]/5">
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042] transition group-hover:scale-105">
              <UploadCloud className="h-7 w-7" />
            </div>

            <p className="mt-3 text-sm font-extrabold text-[#4B4B4B]">
              رفع صورة
            </p>

            <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
              اضغط للاختيار
            </p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </label>
    </div>
  );
}

function ColorPickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-[#4B4B4B]">{label}</label>

      <div className="flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 transition focus-within:border-[#A88042] focus-within:ring-4 focus-within:ring-[#A88042]/10">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />

        <input
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-left text-sm font-extrabold text-[#4B4B4B] outline-none"
        />
      </div>

      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
