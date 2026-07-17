"use client";

import {
  CircleHelp,
  Link2,
  Loader2,
  MessageCircleMore,
  RotateCcw,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EventItem } from "@/features/events/events.types";
import {
  useCreateNotificationTemplate,
  useDeactivateNotificationTemplate,
  useEventRegistrationQrTemplate,
  useUpdateNotificationTemplate,
} from "@/features/notifications/notification-templates.queries";

const FULL_NAME_EDITOR_TOKEN = "[اسم الزائر]";
const QR_LINK_EDITOR_TOKEN = "[رابط الدخول]";

const FULL_NAME_API_TOKEN = "{{fullName}}";
const QR_LINK_API_TOKEN = "{{qrLink}}";

const DEFAULT_TEMPLATE_NAME = "رسالة تسجيل WhatsApp";

const DEFAULT_EDITOR_CONTENT = `مرحبًا [اسم الزائر]،

تم تسجيلك بنجاح.

يمكنك فتح رمز الدخول الخاص بك من الرابط التالي:
[رابط الدخول]

يرجى الاحتفاظ بهذه الرسالة وإظهار رمز الدخول عند البوابة.`;

const automaticFields = [
  {
    editorToken: FULL_NAME_EDITOR_TOKEN,
    label: "إضافة اسم الزائر",
    description: "يستبدله النظام تلقائيًا باسم الشخص الذي سجل.",
    icon: UserRound,
  },
  {
    editorToken: QR_LINK_EDITOR_TOKEN,
    label: "إضافة رابط الدخول",
    description: "يستبدله النظام تلقائيًا برابط رمز الدخول.",
    icon: Link2,
  },
] as const;

function replaceAll(value: string, searchValue: string, replacement: string) {
  return value.split(searchValue).join(replacement);
}

function toEditorContent(apiContent?: string | null) {
  if (!apiContent) {
    return DEFAULT_EDITOR_CONTENT;
  }

  return replaceAll(
    replaceAll(apiContent, FULL_NAME_API_TOKEN, FULL_NAME_EDITOR_TOKEN),
    QR_LINK_API_TOKEN,
    QR_LINK_EDITOR_TOKEN,
  );
}

function toApiContent(editorContent: string) {
  return replaceAll(
    replaceAll(editorContent, FULL_NAME_EDITOR_TOKEN, FULL_NAME_API_TOKEN),
    QR_LINK_EDITOR_TOKEN,
    QR_LINK_API_TOKEN,
  );
}

function buildPreview(editorContent: string) {
  return replaceAll(
    replaceAll(editorContent, FULL_NAME_EDITOR_TOKEN, "محمد أحمد"),
    QR_LINK_EDITOR_TOKEN,
    "https://example.com/qr/REG-123",
  );
}

export function EventWhatsAppMessageDialog({
  open,
  event,
  onClose,
}: {
  open: boolean;
  event: EventItem | null;
  onClose: () => void;
}) {
  const locale = "AR" as const;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const initializedRef = useRef(false);

  const eventId = event?.id ?? "";

  const templateQuery = useEventRegistrationQrTemplate(eventId, locale, open);

  const createMutation = useCreateNotificationTemplate();

  const updateMutation = useUpdateNotificationTemplate();

  const deactivateMutation = useDeactivateNotificationTemplate();

  const [name, setName] = useState(DEFAULT_TEMPLATE_NAME);

  const [content, setContent] = useState(DEFAULT_EDITOR_CONTENT);

  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const template = templateQuery.data;

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending;

  useEffect(() => {
    initializedRef.current = false;

    const timer = window.setTimeout(() => {
      setErrors({});
      setName(DEFAULT_TEMPLATE_NAME);
      setContent(DEFAULT_EDITOR_CONTENT);
      setIsActive(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [eventId, open]);

  useEffect(() => {
    if (!open || !templateQuery.isSuccess || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const timer = window.setTimeout(() => {
      if (template) {
        setName(template.name || DEFAULT_TEMPLATE_NAME);
        setContent(toEditorContent(template.content));
        setIsActive(template.isActive !== false);
      } else {
        setName(DEFAULT_TEMPLATE_NAME);
        setContent(DEFAULT_EDITOR_CONTENT);
        setIsActive(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, template, templateQuery.isSuccess]);

  const previewContent = useMemo(() => buildPreview(content), [content]);

  const includesFullName = content.includes(FULL_NAME_EDITOR_TOKEN);

  const includesQrLink = content.includes(QR_LINK_EDITOR_TOKEN);

  function insertAutomaticField(token: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent((current) => `${current}${token}`);
      return;
    }

    const selectionStart = textarea.selectionStart ?? content.length;

    const selectionEnd = textarea.selectionEnd ?? content.length;

    const nextContent =
      content.slice(0, selectionStart) + token + content.slice(selectionEnd);

    setContent(nextContent);

    setErrors((current) => ({
      ...current,
      content: "",
    }));

    requestAnimationFrame(() => {
      textarea.focus();

      const nextCursor = selectionStart + token.length;

      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "اسم الرسالة مطلوب";
    }

    if (!content.trim()) {
      nextErrors.content = "نص الرسالة مطلوب";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!event || !validate()) {
      return;
    }

    const apiContent = toApiContent(content.trim());

    try {
      if (template?.id) {
        await updateMutation.mutateAsync({
          templateId: template.id,
          eventId: event.id,
          locale,
          payload: {
            name: name.trim(),
            content: apiContent,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          eventId: event.id,
          type: "REGISTRATION_QR",

          /**
           * هذا الحقل هو الذي كان ناقصًا
           * وسبب الخطأ الظاهر في الصورة.
           */
          channel: "WHATSAPP",

          locale,
          name: name.trim(),
          content: apiContent,
          isActive,
        });
      }

      onClose();
    } catch {
      // Toast يظهر من React Query mutation.
    }
  }

  async function handleDeactivate() {
    if (!event || !template?.id) {
      return;
    }

    const confirmed = window.confirm(
      "هل تريد تعطيل رسالة WhatsApp لهذه الفعالية؟ يمكن إعادة تفعيلها لاحقًا.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateMutation.mutateAsync({
        templateId: template.id,
        eventId: event.id,
        locale,
      });

      setIsActive(false);
    } catch {
      // Toast يظهر من mutation.
    }
  }

  function resetMessage() {
    setName(DEFAULT_TEMPLATE_NAME);
    setContent(DEFAULT_EDITOR_CONTENT);
    setIsActive(true);
    setErrors({});
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="رسالة WhatsApp"
      description={
        event
          ? `إعداد رسالة التسجيل الخاصة بفعالية: ${event.titleAr}`
          : "إعداد رسالة التسجيل"
      }
      className="max-w-4xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            {template?.id ? (
              <Button
                type="button"
                variant="danger"
                disabled={isSubmitting || template.isActive === false}
                onClick={handleDeactivate}
              >
                {deactivateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                تعطيل الرسالة
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={resetMessage}
            >
              <RotateCcw className="h-4 w-4" />
              إعادة النص الافتراضي
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || templateQuery.isLoading}
              onClick={handleSave}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {template?.id ? "حفظ التعديلات" : "إنشاء الرسالة"}
            </Button>
          </div>
        </div>
      }
    >
      {templateQuery.isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

            <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
              جاري تحميل إعدادات الرسالة...
            </p>
          </div>
        </div>
      ) : templateQuery.isError ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <p className="text-lg font-extrabold text-red-700">
              تعذر تحميل قالب الرسالة
            </p>

            <Button
              type="button"
              variant="danger"
              className="mt-4"
              onClick={() => templateQuery.refetch()}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                    محتوى الرسالة
                  </h3>

                  <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                    اكتب الرسالة بشكل طبيعي، ثم أضف الحقول التلقائية من الأزرار
                    الموجودة أسفل النص.
                  </p>
                </div>

                <MessageCircleMore className="h-5 w-5 text-[#A88042]" />
              </div>

              <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                  <div>
                    <p className="text-sm font-extrabold text-blue-800">
                      كيف تعمل الحقول التلقائية؟
                    </p>

                    <p className="mt-1 text-xs font-bold leading-6 text-blue-700/75">
                      عندما تضع
                      <strong className="mx-1">[اسم الزائر]</strong>
                      يستبدله النظام باسم الشخص الحقيقي. وعندما تضع
                      <strong className="mx-1">[رابط الدخول]</strong>
                      يستبدله النظام برابط الدخول الحقيقي. لا يحتاج الأدمن إلى
                      كتابة أي أكواد.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="اسم الرسالة"
                  value={name}
                  disabled={isSubmitting}
                  error={errors.name}
                  placeholder="مثال: رسالة تسجيل الزوار"
                  onChange={(event) => {
                    setName(event.target.value);

                    setErrors((current) => ({
                      ...current,
                      name: "",
                    }));
                  }}
                />

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#4B4B4B]">
                    نص رسالة WhatsApp
                  </label>

                  <textarea
                    ref={textareaRef}
                    dir="rtl"
                    rows={12}
                    value={content}
                    disabled={isSubmitting}
                    placeholder="اكتب رسالة WhatsApp هنا..."
                    onChange={(event) => {
                      setContent(event.target.value);

                      setErrors((current) => ({
                        ...current,
                        content: "",
                      }));
                    }}
                    className={`w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm font-bold leading-7 text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:bg-black/5 ${
                      errors.content ? "border-red-500" : "border-black/10"
                    }`}
                  />

                  <div className="flex items-center justify-between gap-3">
                    {errors.content ? (
                      <p className="text-sm font-bold text-red-600">
                        {errors.content}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-[#4B4B4B]/40">
                        يمكنك كتابة رسالة عادية حتى من دون حقول تلقائية.
                      </p>
                    )}

                    <span
                      dir="ltr"
                      className="text-xs font-bold text-[#4B4B4B]/40"
                    >
                      {content.length} characters
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-extrabold text-[#4B4B4B]">
                    أضف بيانات الزائر تلقائيًا
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {automaticFields.map((field) => {
                      const Icon = field.icon;

                      return (
                        <button
                          key={field.editorToken}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            insertAutomaticField(field.editorToken)
                          }
                          className="flex items-start gap-3 rounded-2xl border border-[#A88042]/25 bg-[#A88042]/10 p-3 text-right transition hover:border-[#A88042]/50 hover:bg-[#A88042]/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#A88042]">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-extrabold text-[#8F6D37]">
                              {field.label}
                            </p>

                            <p className="mt-1 text-xs font-bold leading-5 text-[#4B4B4B]/55">
                              {field.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!includesFullName || !includesQrLink ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold leading-6 text-amber-800">
                      {!includesFullName && !includesQrLink
                        ? "الرسالة لا تحتوي حاليًا على اسم الزائر أو رابط الدخول. ستُرسل كنص ثابت."
                        : !includesFullName
                          ? "الرسالة لا تحتوي على اسم الزائر، لكنها ستعمل بشكل طبيعي."
                          : "الرسالة لا تحتوي على رابط الدخول. يُفضّل إضافته حتى يستطيع الزائر فتح رمز الدخول."}
                    </p>
                  </div>
                ) : null}

                <label className="flex min-h-[52px] items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#F8F8FF] px-4">
                  <div>
                    <p className="text-sm font-extrabold text-[#4B4B4B]">
                      تفعيل رسالة WhatsApp
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                      عند التفعيل يصبح القالب متاحًا للإرسال بعد تسجيل الزائر.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isActive}
                    disabled={isSubmitting}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-5 w-5 accent-[#A88042]"
                  />
                </label>
              </div>
            </div>
          </section>

          <aside>
            <div className="sticky top-0 rounded-[1.5rem] border border-black/10 bg-[#F8F8FF] p-4">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                  معاينة الرسالة
                </h3>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                  هنا تظهر الرسالة بعد وضع بيانات زائر تجريبية بدل الحقول
                  التلقائية.
                </p>
              </div>

              <div
                dir="rtl"
                className="min-h-[380px] rounded-[1.5rem] bg-[#E7F6EA] p-4"
              >
                <div className="mr-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-white p-4 shadow-sm">
                  <p className="whitespace-pre-wrap break-words text-sm font-bold leading-7 text-[#2E2E2E]">
                    {previewContent || "ستظهر معاينة الرسالة هنا..."}
                  </p>

                  <div
                    dir="ltr"
                    className="mt-2 text-left text-[10px] font-bold text-black/35"
                  >
                    12:30 PM ✓✓
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-bold leading-6 text-emerald-800">
                  عند الحفظ سيتم إرسال القالب إلى قناة WhatsApp تلقائيًا. لا
                  يحتاج المستخدم إلى اختيار القناة أو معرفة أسماء المتغيرات
                  التقنية.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Modal>
  );
}
