"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutTemplate,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  TicketCheck,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import {
  useCreateDigitalTicketTemplate,
  useDeleteDigitalTicketTemplate,
  useEventDigitalTicketTemplate,
  useUpdateDigitalTicketTemplate,
} from "@/features/digital-ticket-templates/digital-ticket-templates.queries";

import {
  DigitalTicketElement,
  DigitalTicketSelectedField,
  DigitalTicketTheme,
} from "@/features/digital-ticket-templates/digital-ticket-templates.types";

import { useEventBranding } from "@/features/events/events.queries";
import { EventItem } from "@/features/events/events.types";

const TICKET_WIDTH = 1080;
const TICKET_HEIGHT = 1920;

type TicketSettings = {
  name: string;
  primaryColor: string;
  primaryHoverColor: string;
  backgroundColor: string;
  textColor: string;
};

type ExtendedDigitalTicketTheme = DigitalTicketTheme & {
  primaryHover?: string;
};

const FALLBACK_SETTINGS: TicketSettings = {
  name: "بطاقة الدخول الرقمية",
  primaryColor: "#2EAAC9",
  primaryHoverColor: "#C77582",
  backgroundColor: "#F8F8FF",
  textColor: "#000000",
};

function resolveAssetUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000";

  return `${backendOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();

  if (normalized && /^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (normalized && /^#[0-9a-f]{3}$/i.test(normalized)) {
    return `#${normalized
      .slice(1)
      .split("")
      .map((character) => character.repeat(2))
      .join("")
      .toUpperCase()}`;
  }

  return fallback.toUpperCase();
}

function isValidHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function asThemeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readThemeColor(theme: unknown, key: string, fallback: string) {
  const record = asThemeRecord(theme);
  const value = record[key];

  return normalizeHexColor(
    typeof value === "string" ? value : undefined,
    fallback,
  );
}

function hexToRgb(color: string) {
  const normalized = normalizeHexColor(color, "#000000");

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgba(color: string, alpha: number) {
  const { red, green, blue } = hexToRgb(color);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatDatePart(value?: string | null, timeZone?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

function formatPreviewDateRange(
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone?: string | null,
) {
  const start = formatDatePart(startsAt, timeZone);
  const end = formatDatePart(endsAt, timeZone);

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  return "2/8/2026 - 5/8/2026";
}

function formatTimePart(value?: string | null, timeZone?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  })
    .format(date)
    .replace(/\s+/g, " ")
    .trim();
}

function formatPreviewTimeRange(
  startsAt?: string | null,
  endsAt?: string | null,
  timeZone?: string | null,
) {
  const start = formatTimePart(startsAt, timeZone);
  const end = formatTimePart(endsAt, timeZone);

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  return "3:00 PM - 10:00 PM";
}

/**
 * تصميم البطاقة النهائي ثابت داخل الباك.
 *
 * نحتفظ بالعناصر الأساسية داخل القالب للمحافظة على عقد الـ API،
 * لكن الباك هو المسؤول عن المواضع والتصميم الفعلي للصورة.
 */
function buildElements(settings: TicketSettings): DigitalTicketElement[] {
  return [
    {
      id: "branding-logo",
      type: "IMAGE",
      source: "branding.logoUrl",
      x: 255,
      y: 65,
      width: 570,
      height: 210,
    },
    {
      id: "visitor-name",
      type: "FIELD",
      fieldKey: "fullName",
      x: 100,
      y: 430,
      width: 880,
      height: 100,
      fontSize: 58,
      fontFamily: "Almarai",
      bold: true,
      color: settings.textColor,
      align: "center",
    },
    {
      id: "registration-qr",
      type: "QR",
      fieldKey: "qrCode",
      x: 280,
      y: 675,
      width: 520,
      height: 520,
    },
    {
      id: "event-time",
      type: "FIELD",
      fieldKey: "eventTimeFormatted",
      x: 120,
      y: 1490,
      width: 390,
      height: 170,
      fontSize: 34,
      fontFamily: "Almarai",
      bold: true,
      color: settings.textColor,
      align: "center",
    },
    {
      id: "event-date",
      type: "FIELD",
      fieldKey: "eventDateFormatted",
      x: 570,
      y: 1490,
      width: 390,
      height: 170,
      fontSize: 34,
      fontFamily: "Almarai",
      bold: true,
      color: settings.textColor,
      align: "center",
    },
  ];
}

/**
 * هذه الحقول تبقى ضمن الـ API Contract.
 *
 * eventName مطلوب ضمن البيانات التي يعتمد عليها الباك لاختيار
 * تصميم البطاقة الرقمية الثابت، حتى لو لم يظهر اسم الفعالية في الصورة.
 */
function buildSelectedFields(): DigitalTicketSelectedField[] {
  return [
    {
      key: "eventName",
      source: "SYSTEM",
      label: "اسم الفعالية",
      visible: true,
    },
    {
      key: "fullName",
      source: "FIXED",
      label: "اسم الزائر",
      visible: true,
    },
    {
      key: "qrCode",
      source: "SYSTEM",
      label: "رمز الدخول",
      visible: true,
    },
    {
      key: "eventDate",
      source: "SYSTEM",
      label: "تاريخ الفعالية",
      visible: true,
    },
  ];
}

export function EventDigitalTicketDialog({
  open,
  event,
  onClose,
}: {
  open: boolean;
  event: EventItem | null;
  onClose: () => void;
}) {
  const eventId = event?.id ?? "";

  const templateQuery = useEventDigitalTicketTemplate(eventId, open);
  const brandingQuery = useEventBranding(eventId);

  const createMutation = useCreateDigitalTicketTemplate();
  const updateMutation = useUpdateDigitalTicketTemplate();
  const deleteMutation = useDeleteDigitalTicketTemplate();

  const initializedRef = useRef("");

  const [settings, setSettings] = useState<TicketSettings>(FALLBACK_SETTINGS);

  const template = templateQuery.data;
  const branding = brandingQuery.data;

  const eventName =
    event?.titleAr?.trim() || event?.titleEn?.trim() || "الفعالية";

  const logoUrl = useMemo(
    () => resolveAssetUrl(branding?.logoUrl),
    [branding?.logoUrl],
  );

  const previewDate = useMemo(
    () =>
      formatPreviewDateRange(event?.startsAt, event?.endsAt, event?.timezone),
    [event?.startsAt, event?.endsAt, event?.timezone],
  );

  const previewTime = useMemo(
    () =>
      formatPreviewTimeRange(event?.startsAt, event?.endsAt, event?.timezone),
    [event?.startsAt, event?.endsAt, event?.timezone],
  );

  const theme = useMemo<ExtendedDigitalTicketTheme>(
    () => ({
      primary: normalizeHexColor(
        settings.primaryColor,
        FALLBACK_SETTINGS.primaryColor,
      ),
      primaryHover: normalizeHexColor(
        settings.primaryHoverColor,
        FALLBACK_SETTINGS.primaryHoverColor,
      ),
      background: normalizeHexColor(
        settings.backgroundColor,
        FALLBACK_SETTINGS.backgroundColor,
      ),
      text: normalizeHexColor(settings.textColor, FALLBACK_SETTINGS.textColor),
    }),
    [
      settings.primaryColor,
      settings.primaryHoverColor,
      settings.backgroundColor,
      settings.textColor,
    ],
  );

  const elements = useMemo(() => buildElements(settings), [settings]);

  const selectedFields = useMemo(() => buildSelectedFields(), []);

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (!open) {
      initializedRef.current = "";
    }
  }, [open]);

  useEffect(() => {
    if (!open || templateQuery.isLoading || brandingQuery.isLoading) {
      return;
    }

    const initializationKey = `${eventId}:${template?.id ?? "new"}`;

    if (initializedRef.current === initializationKey) {
      return;
    }

    const primaryColor = readThemeColor(
      template?.theme,
      "primary",
      readThemeColor(
        branding?.theme,
        "primary",
        FALLBACK_SETTINGS.primaryColor,
      ),
    );

    const primaryHoverColor = readThemeColor(
      template?.theme,
      "primaryHover",
      readThemeColor(
        branding?.theme,
        "primaryHover",
        FALLBACK_SETTINGS.primaryHoverColor,
      ),
    );

    const backgroundColor = readThemeColor(
      template?.theme,
      "background",
      readThemeColor(
        branding?.theme,
        "background",
        FALLBACK_SETTINGS.backgroundColor,
      ),
    );

    const textColor = readThemeColor(
      template?.theme,
      "text",
      readThemeColor(branding?.theme, "text", FALLBACK_SETTINGS.textColor),
    );

    setSettings({
      name: template?.name || FALLBACK_SETTINGS.name,
      primaryColor,
      primaryHoverColor,
      backgroundColor,
      textColor,
    });

    initializedRef.current = initializationKey;
  }, [
    open,
    eventId,
    template,
    branding,
    templateQuery.isLoading,
    brandingQuery.isLoading,
  ]);

  function updateSetting<Key extends keyof TicketSettings>(
    key: Key,
    value: TicketSettings[Key],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyEventBranding() {
    setSettings((current) => ({
      ...current,
      primaryColor: readThemeColor(
        branding?.theme,
        "primary",
        FALLBACK_SETTINGS.primaryColor,
      ),
      primaryHoverColor: readThemeColor(
        branding?.theme,
        "primaryHover",
        FALLBACK_SETTINGS.primaryHoverColor,
      ),
      backgroundColor: readThemeColor(
        branding?.theme,
        "background",
        FALLBACK_SETTINGS.backgroundColor,
      ),
      textColor: readThemeColor(
        branding?.theme,
        "text",
        FALLBACK_SETTINGS.textColor,
      ),
    }));

    toast.success("تم تطبيق ألوان الهوية البصرية على البطاقة");
  }

  function resetColors() {
    setSettings((current) => ({
      ...current,
      primaryColor: FALLBACK_SETTINGS.primaryColor,
      primaryHoverColor: FALLBACK_SETTINGS.primaryHoverColor,
      backgroundColor: FALLBACK_SETTINGS.backgroundColor,
      textColor: FALLBACK_SETTINGS.textColor,
    }));

    toast.success("تمت إعادة ألوان البطاقة الافتراضية");
  }

  function validateSettings() {
    if (!settings.name.trim()) {
      toast.error("اسم القالب مطلوب");
      return false;
    }

    const colors = [
      {
        label: "اللون الرئيسي",
        value: settings.primaryColor,
      },
      {
        label: "اللون الثانوي",
        value: settings.primaryHoverColor,
      },
      {
        label: "لون الخلفية",
        value: settings.backgroundColor,
      },
      {
        label: "لون النص",
        value: settings.textColor,
      },
    ];

    const invalidColor = colors.find((item) => !isValidHexColor(item.value));

    if (invalidColor) {
      toast.error(`${invalidColor.label} غير صحيح. استخدم قيمة مثل #2EAAC9`);

      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!event || !validateSettings()) {
      return;
    }

    const payload = {
      eventId: event.id,
      name: settings.name.trim(),
      widthPx: TICKET_WIDTH,
      heightPx: TICKET_HEIGHT,
      theme,
      elements,
      selectedFields,

      /**
       * التصميم الثابت في الباك لا يستخدم خلفية القالب المرفوعة.
       * لذلك لا نرسل ملفًا جديدًا ولا نغيّر الخلفية القديمة.
       */
      backgroundImage: null,
    };

    try {
      if (template?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }

  async function handleDelete() {
    if (!event || !template?.id) {
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد من حذف قالب بطاقة الدخول؟ لن يتمكن النظام من إنشاء بطاقات جديدة لهذه الفعالية حتى إنشاء قالب آخر.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        eventId: event.id,
      });

      initializedRef.current = "";

      setSettings({
        ...FALLBACK_SETTINGS,
        primaryColor: readThemeColor(
          branding?.theme,
          "primary",
          FALLBACK_SETTINGS.primaryColor,
        ),
        primaryHoverColor: readThemeColor(
          branding?.theme,
          "primaryHover",
          FALLBACK_SETTINGS.primaryHoverColor,
        ),
        backgroundColor: readThemeColor(
          branding?.theme,
          "background",
          FALLBACK_SETTINGS.backgroundColor,
        ),
        textColor: readThemeColor(
          branding?.theme,
          "text",
          FALLBACK_SETTINGS.textColor,
        ),
      });
    } catch {
      // رسالة الخطأ تظهر من Mutation.
    }
  }

  function handleClose() {
    if (!isBusy) {
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="تصميم بطاقة الدخول"
      description={
        event
          ? `إعداد بطاقة الدخول الخاصة بفعالية: ${eventName}`
          : "إعداد بطاقة الدخول الرقمية"
      }
      className="w-[96vw] max-w-[1180px]"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            {template?.id ? (
              <Button
                type="button"
                variant="danger"
                disabled={isBusy}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                حذف القالب
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleClose}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              disabled={
                isBusy || templateQuery.isLoading || brandingQuery.isLoading
              }
              onClick={handleSave}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {template?.id ? "حفظ التعديلات" : "إنشاء القالب"}
            </Button>
          </div>
        </div>
      }
    >
      {templateQuery.isLoading || brandingQuery.isLoading ? (
        <LoadingState />
      ) : templateQuery.isError ? (
        <ErrorState onRetry={() => templateQuery.refetch()} />
      ) : (
        <div
          dir="rtl"
          className="grid max-h-[76vh] min-h-[620px] overflow-y-auto rounded-3xl border border-black/10 bg-white lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden"
        >
          <section className="min-w-0 p-4 sm:p-6 xl:overflow-y-auto">
            <div className="space-y-5">
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                  <div>
                    <p className="text-sm font-extrabold text-blue-900">
                      تصميم البطاقة جاهز ومثبت
                    </p>

                    <p className="mt-1 text-xs font-bold leading-6 text-blue-800/70">
                      الشعار واسم الزائر ورمز QR وتاريخ الفعالية ووقتها يضيفها
                      النظام تلقائيًا. المطلوب هنا فقط اختيار الألوان المناسبة.
                    </p>
                  </div>
                </div>
              </div>

              <EditorSection
                title="معلومات القالب"
                description="هذا الاسم يظهر داخل لوحة التحكم فقط، ولا يظهر للزائر."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                <TextControl
                  label="اسم القالب"
                  value={settings.name}
                  placeholder="مثال: بطاقة الزوار العامة"
                  onChange={(value) => updateSetting("name", value)}
                />
              </EditorSection>

              <EditorSection
                title="ألوان البطاقة"
                description="تظهر التغييرات مباشرة في المعاينة."
                icon={<Palette className="h-5 w-5" />}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyEventBranding}
                  >
                    <Palette className="h-4 w-4" />
                    تطبيق هوية الفعالية
                  </Button>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorControl
                    label="اللون الرئيسي"
                    description="يستخدم في الأيقونات وحدود البطاقة."
                    value={settings.primaryColor}
                    onChange={(value) => updateSetting("primaryColor", value)}
                  />

                  <ColorControl
                    label="لون التدرج الثانوي"
                    description="يستخدم في الجهة الثانية من الهيدر."
                    value={settings.primaryHoverColor}
                    onChange={(value) =>
                      updateSetting("primaryHoverColor", value)
                    }
                  />

                  <ColorControl
                    label="لون الخلفية"
                    description="لون المساحة المحيطة بالبطاقة."
                    value={settings.backgroundColor}
                    onChange={(value) =>
                      updateSetting("backgroundColor", value)
                    }
                  />

                  <ColorControl
                    label="لون النص"
                    description="لون اسم الزائر والتاريخ والوقت."
                    value={settings.textColor}
                    onChange={(value) => updateSetting("textColor", value)}
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button type="button" variant="outline" onClick={resetColors}>
                    <RotateCcw className="h-4 w-4" />
                    إعادة الألوان الافتراضية
                  </Button>
                </div>
              </EditorSection>

              <EditorSection
                title="البيانات التلقائية"
                description="لا يحتاج مستخدم لوحة التحكم إلى إدخالها."
                icon={<TicketCheck className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <AutomaticField label="شعار الفعالية" />
                  <AutomaticField label="اسم الزائر" />
                  <AutomaticField label="رمز QR" />
                  <AutomaticField label="تاريخ بداية ونهاية الفعالية" />
                  <AutomaticField label="وقت بداية ونهاية الفعالية" />
                </div>
              </EditorSection>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

function PreviewInfoCard({
  icon,
  label,
  value,
  primaryColor,
  secondaryColor,
  textColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}) {
  return (
    <div
      className="flex min-h-[108px] flex-col items-center rounded-[1rem] border bg-white px-2 py-3 text-center"
      style={{
        borderColor: rgba(primaryColor, 0.28),
      }}
    >
      <div
        style={{
          color: primaryColor,
        }}
      >
        {icon}
      </div>

      <div className="mt-1.5 flex w-full items-center justify-center gap-2">
        <span
          className="h-px min-w-0 flex-1"
          style={{
            backgroundColor: rgba(primaryColor, 0.45),
          }}
        />

        <span
          className="shrink-0 text-[9px] font-extrabold"
          style={{
            color: secondaryColor,
          }}
        >
          {label}
        </span>

        <span
          className="h-px min-w-0 flex-1"
          style={{
            backgroundColor: rgba(primaryColor, 0.45),
          }}
        />
      </div>

      <p
        dir="ltr"
        className="mt-4 whitespace-nowrap text-[10px] font-extrabold"
        style={{
          color: textColor,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function EditorSection({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#4B4B4B]">{title}</h3>

            {description ? (
              <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/45">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function TextControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-[#4B4B4B]">{label}</span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-right text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/30 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10"
      />
    </label>
  );
}

function ColorControl({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const colorValue = normalizeHexColor(value, "#000000");

  return (
    <label className="block">
      <span className="text-sm font-extrabold text-[#4B4B4B]">{label}</span>

      {description ? (
        <span className="mt-1 block text-xs font-bold leading-5 text-[#4B4B4B]/45">
          {description}
        </span>
      ) : null}

      <div
        dir="ltr"
        className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-2.5 transition focus-within:border-[#A88042] focus-within:ring-4 focus-within:ring-[#A88042]/10"
      >
        <input
          type="color"
          value={colorValue}
          aria-label={label}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />

        <input
          value={value}
          dir="ltr"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          onBlur={(event) =>
            onChange(normalizeHexColor(event.target.value, colorValue))
          }
          className="min-w-0 flex-1 bg-transparent text-left font-mono text-sm font-bold uppercase tracking-wide text-[#4B4B4B] outline-none"
        />
      </div>
    </label>
  );
}

function AutomaticField({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />

      <span className="text-sm font-extrabold text-emerald-900">{label}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[560px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#A88042]" />

        <p className="mt-3 text-sm font-bold text-[#4B4B4B]/55">
          جاري تحميل إعدادات البطاقة...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8">
      <div className="text-center">
        <p className="font-extrabold text-red-700">
          تعذر تحميل قالب بطاقة الدخول
        </p>

        <Button
          type="button"
          variant="danger"
          className="mt-4"
          onClick={onRetry}
        >
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}
