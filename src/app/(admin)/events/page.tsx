"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { useClients } from "@/features/clients/clients.queries";
import {
  useBadgeAvailableFields,
  useCreateBadgeTemplate,
  useCreateEvent,
  useDeleteEvent,
  useDeleteEventBranding,
  useEventBadgeTemplate,
  useEventBranding,
  useEvents,
  useUpdateBadgeTemplate,
  useUpdateEvent,
} from "@/features/events/events.queries";
import { EventFormValues, eventSchema } from "@/features/events/events.schema";
import { EventItem } from "@/features/events/events.types";
import { BadgeState } from "./_components/EventBadgeSection";
import { EventBadgeDialog } from "./_components/EventBadgeDialog";
import { EventFormModal } from "./_components/EventFormModal";
import { EventStatsCards } from "./_components/EventStatsCards";
import { EventsTableCard } from "./_components/EventsTableCard";
import { RegistrationQrModal } from "./_components/RegistrationQrModal";
import {
  BadgeFieldLayoutMap,
  BadgeVisibleMap,
  ImageType,
} from "./_lib/events-page.types";
import {
  cleanOptional,
  defaultBadgeAvailableFields,
  defaultTheme,
  getBranding,
  getDefaultFormValues,
  hasPersistedBranding,
  PAGE_LIMIT,
  PendingAction,
  resolveAssetUrl,
  toDatetimeLocal,
  toIsoOrUndefined,
} from "./_lib/events-page.utils";
import { EventWhatsAppMessageDialog } from "./_components/EventWhatsAppMessageDialog";
import { EventDigitalTicketDialog } from "./_components/EventDigitalTicketDialog";

function getDefaultFieldLayout({
  key,
  type,
  index,
}: {
  key: string;
  type?: string;
  index: number;
}) {
  if (key === "qrCode" || type === "QR") {
    return {
      x: 60,
      y: 80,
      width: 25,
      height: 25,
    };
  }

  return {
    x: 10,
    y: 20 + index * 12,
    width: 70,
    fontSize: key === "fullName" ? 18 : 12,
  };
}

function areThemeValuesEqual(first?: string | null, second?: string | null) {
  return (first ?? "").trim() === (second ?? "").trim();
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

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [badgeEvent, setBadgeEvent] = useState<EventItem | null>(null);

  const [whatsappMessageOpen, setWhatsAppMessageOpen] = useState(false);

  const [whatsappMessageEvent, setWhatsAppMessageEvent] =
    useState<EventItem | null>(null);

  const [digitalTicketDialogOpen, setDigitalTicketDialogOpen] = useState(false);

  const [digitalTicketEvent, setDigitalTicketEvent] =
    useState<EventItem | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [backgroundPreview, setBackgroundPreview] = useState("");

  const [registrationQrOpen, setRegistrationQrOpen] = useState(false);
  const [registrationQrEvent, setRegistrationQrEvent] =
    useState<EventItem | null>(null);

  const [editingEventId, setEditingEventId] = useState("");
  const [badgeEditingEventId, setBadgeEditingEventId] = useState("");

  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [badgeName, setBadgeName] = useState("Default Badge");
  const [badgeWidthMm, setBadgeWidthMm] = useState("90");
  const [badgeHeightMm, setBadgeHeightMm] = useState("120");

  const [badgePrimaryColor, setBadgePrimaryColor] = useState(
    defaultTheme.primary,
  );

  const [badgeTextColor, setBadgeTextColor] = useState(defaultTheme.text);
  const [badgeBackgroundColor, setBadgeBackgroundColor] = useState("#FFFFFF");

  const [badgeBackgroundFile, setBadgeBackgroundFile] = useState<File | null>(
    null,
  );

  const [badgeBackgroundPreview, setBadgeBackgroundPreview] = useState("");
  const [badgeBackgroundRemoved, setBadgeBackgroundRemoved] = useState(false);

  const [badgeVisibleFields, setBadgeVisibleFields] = useState<BadgeVisibleMap>(
    {
      fullName: true,
      qrCode: true,
    },
  );

  const [badgeFieldLayout, setBadgeFieldLayout] = useState<BadgeFieldLayoutMap>(
    {
      fullName: {
        x: 10,
        y: 20,
        width: 70,
        fontSize: 18,
      },
      qrCode: {
        x: 60,
        y: 80,
        width: 25,
        height: 25,
      },
    },
  );

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
  const deleteEventBrandingMutation = useDeleteEventBranding();

  const brandingQuery = useEventBranding(editingEventId);

  const badgeTemplateQuery = useEventBadgeTemplate(badgeEditingEventId);
  const badgeAvailableFieldsQuery =
    useBadgeAvailableFields(badgeEditingEventId);

  const effectiveBranding = useMemo(() => {
    /*
     * null تعني أن الاستعلام نجح ولا يوجد Branding.
     * لذلك لا نستخدم ?? هنا كي لا نرجع إلى بيانات قائمة قديمة.
     */
    if (brandingQuery.isSuccess) {
      return brandingQuery.data;
    }

    return getBranding(selectedEvent);
  }, [brandingQuery.data, brandingQuery.isSuccess, selectedEvent]);

  const eventHasPersistedBranding = hasPersistedBranding(effectiveBranding);

  const badgeAvailableFields = useMemo(() => {
    const apiFields = badgeAvailableFieldsQuery.data ?? [];

    const defaultBaseFields = defaultBadgeAvailableFields.filter((field) =>
      ["fullName", "qrCode"].includes(field.key),
    );

    const apiBaseFields = apiFields.filter((field) =>
      ["fullName", "qrCode"].includes(field.key),
    );

    const baseFields = defaultBaseFields.map((defaultField) => {
      return (
        apiBaseFields.find((field) => field.key === defaultField.key) ??
        defaultField
      );
    });

    const customFields = apiFields.filter((field) => {
      if (["fullName", "qrCode"].includes(field.key)) {
        return false;
      }

      return String(field.source).toUpperCase() === "CUSTOM";
    });

    return [...baseFields, ...customFields];
  }, [badgeAvailableFieldsQuery.data]);

  const createBadgeTemplateMutation = useCreateBadgeTemplate();
  const updateBadgeTemplateMutation = useUpdateBadgeTemplate();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaultFormValues(),
  });

  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? events.length;
  const totalPages = eventsQuery.data?.totalPages ?? 1;
  const clients = clientsQuery.data?.items ?? [];

  const isEventSubmitting =
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    deleteEventMutation.isPending ||
    deleteEventBrandingMutation.isPending;

  const isBadgeSubmitting =
    createBadgeTemplateMutation.isPending ||
    updateBadgeTemplateMutation.isPending;

  const isSubmitting = isEventSubmitting || isBadgeSubmitting;
  const isFiltering = Boolean(search || clientFilter);

  useEffect(() => {
    if (!eventsQuery.isSuccess) {
      return;
    }

    if (events.length === 0 && page > 1) {
      const timer = window.setTimeout(() => {
        setPage((value) => Math.max(1, value - 1));
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [events.length, eventsQuery.isSuccess, page]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }

      if (backgroundPreview.startsWith("blob:")) {
        URL.revokeObjectURL(backgroundPreview);
      }

      if (badgeBackgroundPreview.startsWith("blob:")) {
        URL.revokeObjectURL(badgeBackgroundPreview);
      }
    };
  }, [logoPreview, backgroundPreview, badgeBackgroundPreview]);

  useEffect(() => {
    if (!formModalOpen || !selectedEvent || !brandingQuery.isSuccess) {
      return;
    }

    const branding = brandingQuery.data;
    const dirtyFields = form.formState.dirtyFields;

    const timer = window.setTimeout(() => {
      if (!logoPreview.startsWith("blob:")) {
        setLogoPreview(resolveAssetUrl(branding?.logoUrl));
      }

      if (!backgroundPreview.startsWith("blob:")) {
        setBackgroundPreview(resolveAssetUrl(branding?.backgroundImageUrl));
      }
    }, 0);

    if (!dirtyFields.themePrimary) {
      form.setValue(
        "themePrimary",
        branding?.theme?.primary ?? defaultTheme.primary,
        { shouldDirty: false },
      );
    }

    if (!dirtyFields.themePrimaryHover) {
      form.setValue(
        "themePrimaryHover",
        branding?.theme?.primaryHover ?? defaultTheme.primaryHover,
        { shouldDirty: false },
      );
    }

    if (!dirtyFields.themeBackground) {
      form.setValue(
        "themeBackground",
        branding?.theme?.background ?? defaultTheme.background,
        { shouldDirty: false },
      );
    }

    if (!dirtyFields.themeText) {
      form.setValue("themeText", branding?.theme?.text ?? defaultTheme.text, {
        shouldDirty: false,
      });
    }

    if (!dirtyFields.themeRadius) {
      form.setValue(
        "themeRadius",
        branding?.theme?.radius ?? defaultTheme.radius,
        { shouldDirty: false },
      );
    }

    return () => window.clearTimeout(timer);
  }, [
    backgroundPreview,
    brandingQuery.data,
    brandingQuery.isSuccess,
    form,
    formModalOpen,
    logoPreview,
    selectedEvent,
  ]);

  useEffect(() => {
    if (!badgeDialogOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBadgeVisibleFields((current) => {
        const next = { ...current };

        badgeAvailableFields.forEach((field) => {
          if (next[field.key] === undefined) {
            next[field.key] = field.key === "fullName" || field.key === "qrCode";
          }
        });

        return next;
      });

      setBadgeFieldLayout((current) => {
        const next = { ...current };

        badgeAvailableFields.forEach((field, index) => {
          if (next[field.key]) {
            return;
          }

          next[field.key] = getDefaultFieldLayout({
            key: field.key,
            type: field.type,
            index,
          });
        });

        return next;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [badgeAvailableFields, badgeDialogOpen]);

  useEffect(() => {
    if (!badgeDialogOpen || !badgeEvent || !badgeTemplateQuery.data) {
      return;
    }

    const badgeTemplate = badgeTemplateQuery.data;
    const selectedFields = badgeTemplate.selectedFields || [];
    const layoutFields = badgeTemplate.layout?.fields || {};

    const nextVisibleFields: BadgeVisibleMap = {};
    const nextLayout: BadgeFieldLayoutMap = {};

    badgeAvailableFields.forEach((field, index) => {
      const selectedField = selectedFields.find(
        (item) => item.key === field.key,
      );

      nextVisibleFields[field.key] =
        selectedField?.visible ??
        (field.key === "fullName" || field.key === "qrCode");

      const savedLayout = layoutFields[field.key];

      if (savedLayout) {
        nextLayout[field.key] = {
          x: savedLayout.x ?? 10,
          y: savedLayout.y ?? 10,
          width: savedLayout.width,
          height: savedLayout.height,
          fontSize: savedLayout.fontSize,
        };

        return;
      }

      nextLayout[field.key] = getDefaultFieldLayout({
        key: field.key,
        type: field.type,
        index,
      });
    });

    const timer = window.setTimeout(() => {
      setBadgeEnabled(true);
      setBadgeName(badgeTemplate.name || "Default Badge");
      setBadgeWidthMm(String(badgeTemplate.widthMm || 90));
      setBadgeHeightMm(String(badgeTemplate.heightMm || 120));
      setBadgePrimaryColor(
        badgeTemplate.colors?.primary || defaultTheme.primary,
      );
      setBadgeTextColor(badgeTemplate.colors?.text || defaultTheme.text);
      setBadgeBackgroundColor(badgeTemplate.colors?.background || "#FFFFFF");
      setBadgeBackgroundPreview(
        resolveAssetUrl(badgeTemplate.backgroundImageUrl),
      );
      setBadgeVisibleFields(nextVisibleFields);
      setBadgeFieldLayout(nextLayout);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    badgeTemplateQuery.data,
    badgeDialogOpen,
    badgeEvent,
    badgeAvailableFields,
  ]);

  function resetBadgeState() {
    if (badgeBackgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(badgeBackgroundPreview);
    }

    setBadgeEnabled(true);
    setBadgeName("Default Badge");
    setBadgeWidthMm("90");
    setBadgeHeightMm("120");
    setBadgePrimaryColor(defaultTheme.primary);
    setBadgeTextColor(defaultTheme.text);
    setBadgeBackgroundColor("#FFFFFF");
    setBadgeBackgroundFile(null);
    setBadgeBackgroundPreview("");
    setBadgeBackgroundRemoved(false);

    setBadgeVisibleFields({
      fullName: true,
      qrCode: true,
    });

    setBadgeFieldLayout({
      fullName: {
        x: 10,
        y: 20,
        width: 70,
        fontSize: 18,
      },
      qrCode: {
        x: 58,
        y: 78,
        width: 26,
        height: 26,
      },
    });
  }

  function resetAssets() {
    if (logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

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
    setEditingEventId("");

    resetAssets();
    form.reset(getDefaultFormValues());

    setFormModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setSelectedEvent(event);
    setPendingValues(null);

    resetAssets();

    const embeddedBranding = getBranding(event);

    setLogoPreview(resolveAssetUrl(embeddedBranding?.logoUrl));

    setBackgroundPreview(resolveAssetUrl(embeddedBranding?.backgroundImageUrl));

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

      themePrimary: embeddedBranding?.theme?.primary ?? defaultTheme.primary,

      themePrimaryHover:
        embeddedBranding?.theme?.primaryHover ?? defaultTheme.primaryHover,

      themeBackground:
        embeddedBranding?.theme?.background ?? defaultTheme.background,

      themeText: embeddedBranding?.theme?.text ?? defaultTheme.text,

      themeRadius: embeddedBranding?.theme?.radius ?? defaultTheme.radius,
    });

    setEditingEventId(event.id);
    setFormModalOpen(true);
  }

  function closeFormModal(force = false) {
    if (isEventSubmitting && !force) {
      return;
    }

    setFormModalOpen(false);
    setSelectedEvent(null);
    setPendingValues(null);
    setEditingEventId("");

    resetAssets();
    form.reset(getDefaultFormValues());
  }

  function openBadgeDialog(event: EventItem) {
    resetBadgeState();

    setBadgeEvent(event);
    setBadgeEditingEventId(event.id);
    setBadgeDialogOpen(true);
  }

  function closeBadgeDialog() {
    if (isBadgeSubmitting) {
      return;
    }

    setBadgeDialogOpen(false);
    setBadgeEvent(null);
    setBadgeEditingEventId("");

    resetBadgeState();
  }

  function openDigitalTicketDialog(event: EventItem) {
    setDigitalTicketEvent(event);
    setDigitalTicketDialogOpen(true);
  }

  function closeDigitalTicketDialog() {
    setDigitalTicketDialogOpen(false);
    setDigitalTicketEvent(null);
  }

  function closeConfirm(force = false) {
    if (isSubmitting && !force) {
      return;
    }

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

  function requestDeleteBranding() {
    if (!selectedEvent || !eventHasPersistedBranding) {
      return;
    }

    setPendingValues(null);
    setPendingAction("deleteBranding");
    setConfirmOpen(true);
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    type: ImageType,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "logo") {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }

      setLogoFile(file);
      setLogoPreview(previewUrl);

      event.target.value = "";
      return;
    }

    if (type === "background") {
      if (backgroundPreview.startsWith("blob:")) {
        URL.revokeObjectURL(backgroundPreview);
      }

      setBackgroundFile(file);
      setBackgroundPreview(previewUrl);

      event.target.value = "";
      return;
    }

    if (badgeBackgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(badgeBackgroundPreview);
    }

    setBadgeBackgroundFile(file);
    setBadgeBackgroundPreview(previewUrl);
    setBadgeBackgroundRemoved(false);

    event.target.value = "";
  }

  function removeImage(type: ImageType) {
    if (type === "logo") {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);

        setLogoFile(null);
        setLogoPreview(resolveAssetUrl(effectiveBranding?.logoUrl));

        return;
      }

      if (logoPreview && selectedEvent) {
        toast.info(
          "لا يمكن حذف الشعار وحده من الباك الحالي. يمكنك استبداله أو حذف الهوية البصرية كاملة.",
        );

        return;
      }

      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    if (type === "background") {
      if (backgroundPreview.startsWith("blob:")) {
        URL.revokeObjectURL(backgroundPreview);

        setBackgroundFile(null);
        setBackgroundPreview(
          resolveAssetUrl(effectiveBranding?.backgroundImageUrl),
        );

        return;
      }

      if (backgroundPreview && selectedEvent) {
        toast.info(
          "لا يمكن حذف الخلفية وحدها من الباك الحالي. يمكنك استبدالها أو حذف الهوية البصرية كاملة.",
        );

        return;
      }

      setBackgroundFile(null);
      setBackgroundPreview("");
      return;
    }

    if (badgeBackgroundPreview.startsWith("blob:")) {
      URL.revokeObjectURL(badgeBackgroundPreview);
    }

    setBadgeBackgroundFile(null);
    setBadgeBackgroundPreview("");
    setBadgeBackgroundRemoved(true);
  }

  function buildBadgeSelectedFields() {
    return badgeAvailableFields.map((field) => ({
      key: field.key,
      source: field.source,
      label: field.labelAr || field.labelEn || field.key,
      visible: Boolean(badgeVisibleFields[field.key]),
    }));
  }

  function buildBadgeLayout() {
    return {
      fields: badgeFieldLayout,
    };
  }

  function buildBadgePayload(eventId?: string) {
    if (!badgeEnabled) {
      return null;
    }

    return {
      eventId,
      name: cleanOptional(badgeName) || "Default Badge",
      widthMm: Number(badgeWidthMm || 90),
      heightMm: Number(badgeHeightMm || 120),

      colors: {
        primary: cleanOptional(badgePrimaryColor) || defaultTheme.primary,

        text: cleanOptional(badgeTextColor) || defaultTheme.text,

        background: cleanOptional(badgeBackgroundColor) || "#FFFFFF",
      },

      selectedFields: buildBadgeSelectedFields(),
      layout: buildBadgeLayout(),
      backgroundImage: badgeBackgroundFile,
      removeBackgroundImage: badgeBackgroundRemoved,
    };
  }

  function buildPayload(values: EventFormValues) {
    const baselineTheme = {
      primary: effectiveBranding?.theme?.primary ?? defaultTheme.primary,

      primaryHover:
        effectiveBranding?.theme?.primaryHover ?? defaultTheme.primaryHover,

      background:
        effectiveBranding?.theme?.background ?? defaultTheme.background,

      text: effectiveBranding?.theme?.text ?? defaultTheme.text,

      radius: effectiveBranding?.theme?.radius ?? defaultTheme.radius,
    };

    const nextTheme = {
      primary: cleanOptional(values.themePrimary) || defaultTheme.primary,

      primaryHover:
        cleanOptional(values.themePrimaryHover) || defaultTheme.primaryHover,

      background:
        cleanOptional(values.themeBackground) || defaultTheme.background,

      text: cleanOptional(values.themeText) || defaultTheme.text,

      radius: cleanOptional(values.themeRadius) || defaultTheme.radius,
    };

    const hasThemeChanges =
      !areThemeValuesEqual(baselineTheme.primary, nextTheme.primary) ||
      !areThemeValuesEqual(
        baselineTheme.primaryHover,
        nextTheme.primaryHover,
      ) ||
      !areThemeValuesEqual(baselineTheme.background, nextTheme.background) ||
      !areThemeValuesEqual(baselineTheme.text, nextTheme.text) ||
      !areThemeValuesEqual(baselineTheme.radius, nextTheme.radius);

    const shouldSendBranding = Boolean(
      logoFile || backgroundFile || hasThemeChanges,
    );

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

      ...(shouldSendBranding
        ? {
            branding: {
              logo: logoFile,
              backgroundImage: backgroundFile,
              theme: nextTheme,
            },
          }
        : {}),
    };
  }

  async function saveBadgeTemplate() {
    if (!badgeEvent) {
      return;
    }

    const badgePayload = buildBadgePayload(badgeEvent.id);

    if (!badgePayload) {
      return;
    }

    try {
      try {
        await updateBadgeTemplateMutation.mutateAsync({
          eventId: badgeEvent.id,
          payload: badgePayload,
        });
      } catch {
        await createBadgeTemplateMutation.mutateAsync({
          ...badgePayload,
          eventId: badgeEvent.id,
        });
      }

      closeBadgeDialog();
    } catch {
      // رسالة الخطأ تظهر من hooks.
    }
  }

  async function confirmAction() {
    if (pendingAction === "deleteBranding" && selectedEvent) {
      try {
        await deleteEventBrandingMutation.mutateAsync(selectedEvent.id);

        if (logoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(logoPreview);
        }

        if (backgroundPreview.startsWith("blob:")) {
          URL.revokeObjectURL(backgroundPreview);
        }

        setLogoFile(null);
        setBackgroundFile(null);
        setLogoPreview("");
        setBackgroundPreview("");

        form.setValue("themePrimary", defaultTheme.primary, {
          shouldDirty: false,
        });

        form.setValue("themePrimaryHover", defaultTheme.primaryHover, {
          shouldDirty: false,
        });

        form.setValue("themeBackground", defaultTheme.background, {
          shouldDirty: false,
        });

        form.setValue("themeText", defaultTheme.text, {
          shouldDirty: false,
        });

        form.setValue("themeRadius", defaultTheme.radius, {
          shouldDirty: false,
        });

        closeConfirm(true);
      } catch {
        // رسالة الخطأ تظهر من hook.
      }

      return;
    }

    if (pendingAction === "delete" && selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id, {
        onSuccess: () => {
          closeConfirm(true);
          setSelectedEvent(null);
        },
      });

      return;
    }

    if (!pendingValues) {
      return;
    }

    const payload = buildPayload(pendingValues);

    if (pendingAction === "update" && selectedEvent) {
      try {
        await updateEventMutation.mutateAsync({
          id: selectedEvent.id,
          payload,
        });

        closeConfirm(true);
        closeFormModal(true);
      } catch {
        // رسالة الخطأ تظهر من hook.
      }

      return;
    }

    if (pendingAction === "create") {
      try {
        await createEventMutation.mutateAsync(payload);

        closeConfirm(true);
        closeFormModal(true);
      } catch {
        // رسالة الخطأ تظهر من hook.
      }
    }
  }

  function getPublicRegistrationUrl(eventId: string) {
    if (typeof window === "undefined") {
      return `/register/${eventId}`;
    }

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

  function openWhatsAppMessage(event: EventItem) {
    setWhatsAppMessageEvent(event);
    setWhatsAppMessageOpen(true);
  }

  function closeWhatsAppMessage() {
    setWhatsAppMessageOpen(false);
    setWhatsAppMessageEvent(null);
  }

  const confirmTitle =
    pendingAction === "create"
      ? "تأكيد إنشاء الفعالية"
      : pendingAction === "update"
        ? "تأكيد تعديل الفعالية"
        : pendingAction === "deleteBranding"
          ? "تأكيد حذف الهوية البصرية"
          : "تأكيد حذف الفعالية";

  const confirmDescription =
    pendingAction === "create"
      ? "سيتم إنشاء الفعالية، ولن تُنشأ هوية بصرية إلا عند اختيار صور أو تعديل الألوان الافتراضية."
      : pendingAction === "update"
        ? `سيتم تعديل بيانات الفعالية: ${selectedEvent?.titleAr ?? ""}.`
        : pendingAction === "deleteBranding"
          ? "سيتم حذف الشعار والخلفية والألوان المحفوظة نهائيًا، من دون حذف الفعالية."
          : `سيتم حذف الفعالية نهائيًا مع البيانات والملفات التابعة لها: ${
              selectedEvent?.titleAr ?? ""
            }.`;

  const confirmText =
    pendingAction === "create"
      ? "تأكيد الإضافة"
      : pendingAction === "update"
        ? "تأكيد التعديل"
        : pendingAction === "deleteBranding"
          ? "حذف الهوية"
          : "تأكيد الحذف";

  const badgeState: BadgeState = {
    badgeEnabled,
    setBadgeEnabled,

    badgeName,
    setBadgeName,

    badgeWidthMm,
    setBadgeWidthMm,

    badgeHeightMm,
    setBadgeHeightMm,

    badgePrimaryColor,
    setBadgePrimaryColor,

    badgeTextColor,
    setBadgeTextColor,

    badgeBackgroundColor,
    setBadgeBackgroundColor,

    badgeBackgroundPreview,

    visibleFields: badgeVisibleFields,
    setVisibleFields: setBadgeVisibleFields,

    fieldLayout: badgeFieldLayout,
    setFieldLayout: setBadgeFieldLayout,
  };

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

      <EventStatsCards
        total={total}
        pageItemsCount={events.length}
        isLoading={eventsQuery.isLoading}
        isFetching={eventsQuery.isFetching}
        onRefresh={() => eventsQuery.refetch()}
      />

      <EventsTableCard
        events={events}
        clients={clients}
        total={total}
        totalPages={totalPages}
        page={page}
        searchInput={searchInput}
        clientFilter={clientFilter}
        isLoading={eventsQuery.isLoading}
        isError={eventsQuery.isError}
        isFetching={eventsQuery.isFetching}
        isSubmitting={isSubmitting}
        isFiltering={isFiltering}
        deletingEventId={
          deleteEventMutation.isPending ? selectedEvent?.id : undefined
        }
        onSearchInputChange={setSearchInput}
        onClientFilterChange={(value) => {
          setPage(1);
          setClientFilter(value);
        }}
        onSearch={handleSearch}
        onClearFilters={clearFilters}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onOpenBadge={openBadgeDialog}
        onOpenDigitalTicket={openDigitalTicketDialog}
        onDelete={requestDelete}
        onOpenRegistrationQr={openRegistrationQr}
        onOpenWhatsAppMessage={openWhatsAppMessage}
        onRefetch={() => eventsQuery.refetch()}
        onPageChange={setPage}
      />

      <EventFormModal
        open={formModalOpen}
        selectedEvent={selectedEvent}
        form={form}
        clients={clients}
        isSubmitting={isEventSubmitting}
        isBrandingLoading={Boolean(selectedEvent) && brandingQuery.isLoading}
        isDeletingBranding={deleteEventBrandingMutation.isPending}
        hasPersistedBranding={eventHasPersistedBranding}
        logoPreview={logoPreview}
        backgroundPreview={backgroundPreview}
        onClose={() => closeFormModal()}
        onSubmit={requestSubmit}
        onImageChange={handleImageChange}
        onImageRemove={removeImage}
        onDeleteBranding={requestDeleteBranding}
      />

      <EventBadgeDialog
        open={badgeDialogOpen}
        event={badgeEvent}
        badge={badgeState}
        availableFields={badgeAvailableFields}
        isLoading={
          badgeAvailableFieldsQuery.isLoading || badgeTemplateQuery.isLoading
        }
        isSubmitting={isBadgeSubmitting}
        onClose={closeBadgeDialog}
        onSave={saveBadgeTemplate}
        onImageChange={handleImageChange}
        onImageRemove={removeImage}
      />

      <EventDigitalTicketDialog
        open={digitalTicketDialogOpen}
        event={digitalTicketEvent}
        onClose={closeDigitalTicketDialog}
      />

      <RegistrationQrModal
        open={registrationQrOpen}
        event={registrationQrEvent}
        onClose={closeRegistrationQr}
        getPublicRegistrationUrl={getPublicRegistrationUrl}
        onCopy={copyRegistrationLink}
      />

      <EventWhatsAppMessageDialog
        open={whatsappMessageOpen}
        event={whatsappMessageEvent}
        onClose={closeWhatsAppMessage}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={confirmText}
        variant={
          pendingAction === "delete" || pendingAction === "deleteBranding"
            ? "danger"
            : "gold"
        }
        isLoading={isEventSubmitting}
        onClose={() => closeConfirm()}
        onConfirm={confirmAction}
      />
    </div>
  );
}
