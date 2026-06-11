"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Eye,
  ImagePlus,
  Loader2,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { useRegistrations } from "@/features/registrations/registrations.queries";
import {
  useCreateRegistrationQrImage,
  useGenerateRegistrationQr,
  useRegistrationQr,
  useRevokeRegistrationQr,
  useValidateQr,
} from "@/features/qr/qr.queries";
import {
  QrRegistration,
  QrResponse,
  ValidateQrResponse,
} from "@/features/qr/qr.types";

type PendingAction = "generate" | "image" | "revoke" | null;

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

function getQrToken(data?: QrResponse | null) {
  return (
    data?.qrToken || data?.token || data?.qr?.qrToken || data?.qr?.token || ""
  );
}

function getQrStatus(data?: QrResponse | null) {
  return data?.status || data?.qr?.status || "—";
}

function getQrImageUrl(data?: QrResponse | null) {
  const url =
    data?.publicUrl ||
    data?.imageUrl ||
    data?.qrImageUrl ||
    data?.qr?.publicUrl ||
    data?.qr?.imageUrl ||
    data?.qr?.qrImageUrl ||
    "";

  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const origin = apiBase.replace(/\/api\/v1\/?$/, "");

  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function getStatusVariant(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "REVOKED") return "danger";
  if (status === "EXPIRED") return "warning";
  if (status === "USED") return "muted";
  return "gold";
}

function isQrValid(data?: ValidateQrResponse | null) {
  if (!data) return false;

  return (
    data.valid === true ||
    data.allowed === true ||
    data.success === true ||
    data.decision === "ALLOWED"
  );
}

function getRegistrationName(registration?: QrRegistration | null) {
  if (!registration) return "—";

  return (
    registration.fullName ||
    registration.email ||
    registration.phone ||
    registration.publicId ||
    registration.id
  );
}

export default function QrAdminPage() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [search, setSearch] = useState("");

  const [selectedRegistration, setSelectedRegistration] =
    useState<QrRegistration | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [latestQrResult, setLatestQrResult] = useState<QrResponse | null>(null);
  const [validateToken, setValidateToken] = useState("");
  const [validateResult, setValidateResult] =
    useState<ValidateQrResponse | null>(null);

  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const registrationsParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
      search: search || undefined,
    }),
    [page, eventFilter, search],
  );

  const registrationsQuery = useRegistrations(registrationsParams);

  const registrations = (registrationsQuery.data?.items ??
    []) as QrRegistration[];

  const events = eventsQuery.data?.items ?? [];
  const total = registrationsQuery.data?.total ?? registrations.length;
  const totalPages = registrationsQuery.data?.totalPages ?? 1;

  const qrQuery = useRegistrationQr(selectedRegistration?.id ?? "");

  const generateQrMutation = useGenerateRegistrationQr();
  const createImageMutation = useCreateRegistrationQrImage();
  const revokeQrMutation = useRevokeRegistrationQr();
  const validateQrMutation = useValidateQr();

  const currentQr = latestQrResult || qrQuery.data || null;
  const currentQrToken = getQrToken(currentQr);
  const currentQrStatus = getQrStatus(currentQr);
  const currentQrImageUrl = getQrImageUrl(currentQr);

  const isActionLoading =
    generateQrMutation.isPending ||
    createImageMutation.isPending ||
    revokeQrMutation.isPending;

  function openDetails(registration: QrRegistration) {
    setSelectedRegistration(registration);
    setLatestQrResult(null);
    setDetailsOpen(true);
  }

  function closeDetails() {
    if (isActionLoading) return;

    setDetailsOpen(false);
    setSelectedRegistration(null);
    setLatestQrResult(null);
  }

  function requestAction(action: PendingAction, registration?: QrRegistration) {
    if (registration) setSelectedRegistration(registration);

    setPendingAction(action);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (isActionLoading) return;

    setConfirmOpen(false);
    setPendingAction(null);
  }

  function confirmAction() {
    if (!selectedRegistration || !pendingAction) return;

    if (pendingAction === "generate") {
      generateQrMutation.mutate(selectedRegistration.id, {
        onSuccess: (data) => {
          setLatestQrResult(data);
          setDetailsOpen(true);
          closeConfirm();
        },
      });

      return;
    }

    if (pendingAction === "image") {
      createImageMutation.mutate(selectedRegistration.id, {
        onSuccess: (data) => {
          setLatestQrResult(data);
          setDetailsOpen(true);
          closeConfirm();
        },
      });

      return;
    }

    if (pendingAction === "revoke") {
      revokeQrMutation.mutate(selectedRegistration.id, {
        onSuccess: (data) => {
          setLatestQrResult(data);
          setDetailsOpen(true);
          closeConfirm();
        },
      });
    }
  }

  async function copyText(value: string, label = "تم النسخ") {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(label);
    } catch {
      toast.error("تعذر النسخ");
    }
  }

  function submitValidate() {
    if (!validateToken.trim()) {
      toast.error("QR Token مطلوب");
      return;
    }

    setValidateResult(null);

    validateQrMutation.mutate(
      {
        qrToken: validateToken.trim(),
      },
      {
        onSuccess: (data) => {
          setValidateResult(data);
        },
      },
    );
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setEventFilter("");
  }

  function getConfirmCopy() {
    if (pendingAction === "generate") {
      return {
        title: "توليد QR",
        description:
          "سيتم توليد QR جديد لهذا التسجيل. إذا كان يوجد QR سابق قد يتم استبداله حسب منطق الباك.",
        confirmText: "توليد",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "image") {
      return {
        title: "إنشاء صورة QR",
        description:
          "سيتم إنشاء/تحديث صورة QR لهذا التسجيل وإرجاع رابط الصورة إن توفر.",
        confirmText: "إنشاء الصورة",
        variant: "gold" as const,
      };
    }

    return {
      title: "إلغاء QR",
      description:
        "سيتم إلغاء QR الحالي لهذا التسجيل، ولن يعود صالحًا للاستخدام.",
      confirmText: "إلغاء QR",
      variant: "danger" as const,
    };
  }

  const confirmCopy = getConfirmCopy();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="QR Management"
        title="إدارة QR"
        description="توليد QR للتسجيلات، إنشاء صور QR، التحقق من Token، وإلغاء QR عند الحاجة."
        actions={
          <Button
            variant="outline"
            onClick={() => registrationsQuery.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            التسجيلات المعروضة
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">الفعالية</p>
          <h3 className="mt-3 truncate text-xl font-extrabold text-[#4B4B4B]">
            {events.find((event) => event.id === eventFilter)?.titleAr ||
              "كل الفعاليات"}
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

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">Validate</p>
          <div className="mt-3">
            <Badge variant={validateResult ? "gold" : "muted"}>
              {validateResult ? "تم التحقق" : "جاهز"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6">
            <CardTitle>التحقق من QR Token</CardTitle>
            <CardDescription>
              الصق QR Token للتحقق من صلاحيته قبل استخدامه في السكانر.
            </CardDescription>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
            <Input
              value={validateToken}
              dir="ltr"
              placeholder="Paste QR Token here..."
              icon={<ShieldCheck className="h-4 w-4" />}
              onChange={(event) => setValidateToken(event.target.value)}
            />

            <Button
              disabled={validateQrMutation.isPending}
              onClick={submitValidate}
            >
              {validateQrMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              تحقق
            </Button>
          </div>

          {validateResult ? (
            <div
              className={
                isQrValid(validateResult)
                  ? "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                  : "mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
              }
            >
              <div className="flex items-start gap-3">
                <div
                  className={
                    isQrValid(validateResult)
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700"
                  }
                >
                  {isQrValid(validateResult) ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p
                    className={
                      isQrValid(validateResult)
                        ? "text-sm font-extrabold text-emerald-800"
                        : "text-sm font-extrabold text-red-800"
                    }
                  >
                    {isQrValid(validateResult) ? "QR صالح" : "QR غير صالح"}
                  </p>

                  <p
                    className={
                      isQrValid(validateResult)
                        ? "mt-1 text-xs font-bold leading-6 text-emerald-800/70"
                        : "mt-1 text-xs font-bold leading-6 text-red-800/70"
                    }
                  >
                    {validateResult.message ||
                      validateResult.reason ||
                      "تم تنفيذ عملية التحقق"}
                  </p>

                  {validateResult.registration ? (
                    <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                      التسجيل:{" "}
                      {getRegistrationName(validateResult.registration)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>تسجيلات QR</CardTitle>
                <CardDescription>
                  اختر تسجيلًا لتوليد QR أو إنشاء صورة أو إلغاء QR الحالي.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>

                <Button
                  variant="outline"
                  onClick={() => registrationsQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
              <Input
                value={search}
                placeholder="بحث بالاسم، الهاتف، البريد..."
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
                  <QrCode className="h-7 w-7" />
                </div>

                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد تسجيلات
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  أنشئ تسجيلات أولًا ثم ارجع لتوليد QR.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الزائر</TableHead>
                    <TableHead>التواصل</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>نوع الحضور</TableHead>
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
                            {registration.fullName || "—"}
                          </p>
                          <p
                            dir="ltr"
                            className="mt-1 text-xs font-bold text-[#4B4B4B]/45"
                          >
                            {registration.publicId || registration.id}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p dir="ltr" className="text-sm font-bold">
                            {registration.phone || "—"}
                          </p>
                          <p className="text-xs font-bold text-[#4B4B4B]/45">
                            {registration.email || "—"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{registration.companyName || "—"}</TableCell>

                      <TableCell>
                        {registration.attendeeType?.nameAr ||
                          registration.attendeeType?.code ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        <Badge variant="gold">
                          {registration.status || "—"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(registration)}
                          >
                            <Eye className="h-4 w-4" />
                            عرض
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              requestAction("generate", registration)
                            }
                          >
                            <QrCode className="h-4 w-4" />
                            Generate
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestAction("image", registration)}
                          >
                            <ImagePlus className="h-4 w-4" />
                            Image
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              requestAction("revoke", registration)
                            }
                          >
                            <ShieldX className="h-4 w-4" />
                            Revoke
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
        open={detailsOpen}
        onClose={closeDetails}
        title="تفاصيل QR"
        description={
          selectedRegistration
            ? `التسجيل: ${getRegistrationName(selectedRegistration)}`
            : "تفاصيل QR"
        }
        className="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={closeDetails}>
              إغلاق
            </Button>

            <Button
              variant="outline"
              disabled={!currentQrToken}
              onClick={() => copyText(currentQrToken, "تم نسخ QR Token")}
            >
              <Clipboard className="h-4 w-4" />
              نسخ Token
            </Button>

            <Button
              disabled={!selectedRegistration || isActionLoading}
              onClick={() => requestAction("image")}
            >
              <ImagePlus className="h-4 w-4" />
              إنشاء صورة
            </Button>
          </>
        }
      >
        {qrQuery.isLoading && !latestQrResult ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
              <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                جاري تحميل QR...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/50">Status</p>
                <div className="mt-2">
                  <Badge variant={getStatusVariant(currentQrStatus)}>
                    {currentQrStatus}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-black p-4 text-white">
                <div className="mb-2 flex items-center gap-2 text-[#D6B06E]">
                  <QrCode className="h-4 w-4" />
                  <p className="text-sm font-extrabold">QR Token</p>
                </div>

                <pre
                  dir="ltr"
                  className="custom-scrollbar max-h-40 overflow-auto whitespace-pre-wrap break-all text-left text-xs font-bold leading-6 text-white/80"
                >
                  {currentQrToken || "لا يوجد QR Token بعد"}
                </pre>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-bold text-[#4B4B4B]/50">
                    Valid From
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                    {formatDate(
                      currentQr?.validFrom || currentQr?.qr?.validFrom,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-bold text-[#4B4B4B]/50">
                    Valid Until
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                    {formatDate(
                      currentQr?.validUntil || currentQr?.qr?.validUntil,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!selectedRegistration || isActionLoading}
                  onClick={() => requestAction("generate")}
                >
                  <RotateCcw className="h-4 w-4" />
                  Generate
                </Button>

                <Button
                  variant="outline"
                  disabled={!selectedRegistration || isActionLoading}
                  onClick={() => requestAction("image")}
                >
                  <ImagePlus className="h-4 w-4" />
                  Image
                </Button>

                <Button
                  variant="danger"
                  disabled={!selectedRegistration || isActionLoading}
                  onClick={() => requestAction("revoke")}
                >
                  <ShieldX className="h-4 w-4" />
                  Revoke
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[#F8F8FF] p-5">
              {currentQrImageUrl ? (
                <div className="text-center">
                  <img
                    src={currentQrImageUrl}
                    alt="QR Code"
                    className="mx-auto h-56 w-56 rounded-2xl border border-black/10 bg-white object-contain p-3"
                  />

                  <Button
                    className="mt-4 w-full"
                    variant="outline"
                    onClick={() =>
                      copyText(currentQrImageUrl, "تم نسخ رابط الصورة")
                    }
                  >
                    <Clipboard className="h-4 w-4" />
                    نسخ رابط الصورة
                  </Button>
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                      <AlertTriangle className="h-8 w-8" />
                    </div>

                    <p className="text-sm font-extrabold text-[#4B4B4B]">
                      لا توجد صورة QR
                    </p>

                    <p className="mt-2 text-xs font-bold leading-6 text-[#4B4B4B]/55">
                      اضغط إنشاء صورة QR لعرض الصورة هنا.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        variant={confirmCopy.variant}
        isLoading={isActionLoading}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
