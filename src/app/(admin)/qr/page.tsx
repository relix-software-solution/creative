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
import { useEffect, useMemo, useState } from "react";
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

const PAGE_LIMIT = 20;

const qrStatusLabels: Record<string, string> = {
  ACTIVE: "فعّال",
  REVOKED: "ملغى",
  EXPIRED: "منتهي",
  USED: "مستخدم",
  INACTIVE: "غير فعّال",
};

const registrationStatusLabels: Record<string, string> = {
  PENDING: "بانتظار التفعيل",
  ACTIVE: "فعّال",
  CANCELLED: "ملغي",
  BLOCKED: "محظور",
};

type LooseQrResponse = QrResponse & {
  url?: string;
  path?: string;
  fileUrl?: string;
  qrUrl?: string;
  image?: string;
  data?: QrResponse & {
    url?: string;
    path?: string;
    fileUrl?: string;
    qrUrl?: string;
    image?: string;
  };
};

function formatDate(value?: string | null) {
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

function getApiOrigin() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  return apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

function normalizeUrl(url?: string | null) {
  if (!url) return "";

  const cleanUrl = url.trim();
  if (!cleanUrl) return "";

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  const origin = getApiOrigin();

  if (!origin) {
    return cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  }

  return `${origin}${cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`}`;
}

function getQrToken(data?: QrResponse | null) {
  const status = data?.status || data?.qr?.status;

  if (status === "REVOKED") return "";

  return (
    data?.qrToken || data?.token || data?.qr?.qrToken || data?.qr?.token || ""
  );
}

function getQrStatus(data?: QrResponse | null) {
  return data?.status || data?.qr?.status || "";
}

function getQrValidFrom(data?: QrResponse | null) {
  return data?.validFrom || data?.qr?.validFrom || null;
}

function getQrValidUntil(data?: QrResponse | null) {
  return data?.validUntil || data?.qr?.validUntil || null;
}

function getQrImageUrl(data?: QrResponse | null) {
  if (data?.status === "REVOKED" || data?.qr?.status === "REVOKED") {
    return "";
  }

  const url =
    data?.objectUrl ||
    data?.publicUrl ||
    data?.imageUrl ||
    data?.qrImageUrl ||
    data?.url ||
    data?.path ||
    data?.fileUrl ||
    data?.qrUrl ||
    data?.image ||
    data?.qr?.objectUrl ||
    data?.qr?.publicUrl ||
    data?.qr?.imageUrl ||
    data?.qr?.qrImageUrl ||
    data?.data?.objectUrl ||
    data?.data?.publicUrl ||
    data?.data?.imageUrl ||
    data?.data?.qrImageUrl ||
    data?.data?.url ||
    data?.data?.path ||
    data?.data?.fileUrl ||
    data?.data?.qrUrl ||
    data?.data?.image ||
    "";

  return normalizeUrl(url);
}

function getStatusVariant(
  status?: string | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "ACTIVE") return "success";
  if (status === "REVOKED") return "danger";
  if (status === "EXPIRED") return "warning";
  if (status === "USED") return "muted";
  return "gold";
}

function getRegistrationStatusVariant(
  status?: string | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "BLOCKED") return "danger";
  if (status === "CANCELLED") return "muted";
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

function getRegistrationContact(registration: QrRegistration) {
  return registration.phone || registration.email || "—";
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
  const [imageBroken, setImageBroken] = useState(false);

  const [validateToken, setValidateToken] = useState("");
  const [validateResult, setValidateResult] =
    useState<ValidateQrResponse | null>(null);

  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const registrationsParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
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
  const currentQrValidFrom = getQrValidFrom(currentQr);
  const currentQrValidUntil = getQrValidUntil(currentQr);

  const hasQr = Boolean(currentQrToken);
  const hasQrImage = Boolean(currentQrImageUrl) && !imageBroken;
  const isQrLoading = qrQuery.isLoading && !latestQrResult;

  const isActionLoading =
    generateQrMutation.isPending ||
    createImageMutation.isPending ||
    revokeQrMutation.isPending;

  const isFiltering = Boolean(search || eventFilter);

  useEffect(() => {
    setImageBroken(false);
  }, [currentQrImageUrl]);

  useEffect(() => {
    if (!registrationsQuery.isSuccess) return;

    if (registrations.length === 0 && page > 1) {
      setPage((value) => Math.max(1, value - 1));
    }
  }, [registrations.length, registrationsQuery.isSuccess, page]);

  function openDetails(registration: QrRegistration) {
    setSelectedRegistration(registration);
    setLatestQrResult(null);
    setImageBroken(false);
    setDetailsOpen(true);
  }

  function closeDetails() {
    if (isActionLoading) return;

    setDetailsOpen(false);
    setSelectedRegistration(null);
    setLatestQrResult(null);
    setImageBroken(false);
  }

  function requestAction(action: PendingAction, registration?: QrRegistration) {
    if (registration) {
      setSelectedRegistration(registration);
      setDetailsOpen(true);
    }

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
          setImageBroken(false);
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
          setImageBroken(false);
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
          setImageBroken(false);
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
    const token = validateToken.trim();

    if (!token) {
      toast.error("QR Token مطلوب");
      return;
    }

    setValidateResult(null);

    validateQrMutation.mutate(
      {
        qrToken: token,
      },
      {
        onSuccess: (data) => {
          setValidateResult(data);
        },
      },
    );
  }

  function clearValidate() {
    setValidateToken("");
    setValidateResult(null);
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setEventFilter("");
  }

  function getEventTitle() {
    return events.find((event) => event.id === eventFilter)?.titleAr || "الكل";
  }

  function getConfirmCopy() {
    if (pendingAction === "generate") {
      return {
        title: "توليد QR",
        description: selectedRegistration
          ? `سيتم توليد QR للتسجيل: ${getRegistrationName(selectedRegistration)}.`
          : "سيتم توليد QR لهذا التسجيل.",
        confirmText: "توليد",
        variant: "gold" as const,
      };
    }

    if (pendingAction === "image") {
      return {
        title: "إنشاء صورة QR",
        description:
          "سيتم إنشاء صورة QR قابلة للنسخ أو الإرسال للزائر اعتمادًا على QR الحالي.",
        confirmText: "إنشاء",
        variant: "gold" as const,
      };
    }

    return {
      title: "إلغاء QR",
      description: "سيتم إلغاء QR الحالي ولن يعود صالحًا للدخول أو التحقق.",
      confirmText: "إلغاء",
      variant: "danger" as const,
    };
  }

  const confirmCopy = getConfirmCopy();

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="QR Management"
        title="إدارة QR"
        description="توليد QR للتسجيلات، إنشاء صورة، التحقق من Token، أو إلغاء QR."
        actions={
          <Button
            variant="outline"
            onClick={() => registrationsQuery.refetch()}
            disabled={registrationsQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                registrationsQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">التسجيلات</p>

          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">
              {registrationsQuery.isLoading ? "..." : total}
            </h3>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">الفعالية</p>

          <h3 className="mt-3 truncate text-xl font-extrabold text-[#4B4B4B]">
            {getEventTitle()}
          </h3>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">البيانات</p>

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
              <RefreshCw
                className={`h-4 w-4 ${
                  registrationsQuery.isFetching ? "animate-spin" : ""
                }`}
              />
              تحديث
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden border-black/5 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#4B4B4B]/60">التحقق</p>

          <div className="mt-3">
            <Badge
              variant={
                validateResult
                  ? isQrValid(validateResult)
                    ? "success"
                    : "danger"
                  : "muted"
              }
            >
              {validateResult
                ? isQrValid(validateResult)
                  ? "صالح"
                  : "مرفوض"
                : "جاهز"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>فحص QR Token</CardTitle>

              <CardDescription>
                استخدمه للتأكد من صلاحية QR قبل تجربة الدخول.
              </CardDescription>
            </div>

            {validateResult || validateToken ? (
              <Button variant="outline" onClick={clearValidate}>
                مسح
              </Button>
            ) : null}
          </div>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Input
              value={validateToken}
              dir="ltr"
              placeholder="Paste QR Token..."
              icon={<ShieldCheck className="h-4 w-4" />}
              onChange={(event) => setValidateToken(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitValidate();
              }}
            />

            <Button
              className="shrink-0 px-8"
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

                <div className="min-w-0">
                  <p
                    className={
                      isQrValid(validateResult)
                        ? "text-sm font-extrabold text-emerald-800"
                        : "text-sm font-extrabold text-red-800"
                    }
                  >
                    {isQrValid(validateResult) ? "QR صالح" : "QR مرفوض"}
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
                    <p className="mt-2 truncate text-sm font-extrabold text-[#4B4B4B]">
                      {getRegistrationName(validateResult.registration)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>التسجيلات</CardTitle>

                <CardDescription>
                  افتح ملف QR للتسجيل ثم نفّذ العمليات من داخله.
                </CardDescription>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isFiltering ? (
                  <Button variant="outline" onClick={clearFilters}>
                    مسح الفلاتر
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  onClick={() => registrationsQuery.refetch()}
                  disabled={registrationsQuery.isFetching}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      registrationsQuery.isFetching ? "animate-spin" : ""
                    }`}
                  />
                  تحديث
                </Button>
              </div>
            </div>

            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,280px)] items-center gap-3">
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
                    label: event.titleAr || event.titleEn || event.id,
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

                <p className="mt-2 text-sm font-bold text-red-600/70">
                  تحقق من الاتصال بالباك أو صلاحية الجلسة.
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
                  {isFiltering ? "لا توجد نتائج" : "لا توجد تسجيلات"}
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  {isFiltering
                    ? "جرّب تعديل الفلاتر أو امسحها."
                    : "أنشئ تسجيلات أولًا ثم ارجع لتوليد QR."}
                </p>

                {isFiltering ? (
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={clearFilters}
                  >
                    مسح الفلاتر
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-black/5">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-[#F8F8FF]">
                      <TableHead className="w-[24%]">الزائر</TableHead>
                      <TableHead className="w-[22%]">التواصل</TableHead>
                      <TableHead className="w-[18%]">الشركة</TableHead>
                      <TableHead className="w-[16%]">النوع</TableHead>
                      <TableHead className="w-[10%]">الحالة</TableHead>
                      <TableHead className="w-[10%] text-center">QR</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-[#4B4B4B]">
                              {registration.fullName || "—"}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45"
                            >
                              {registration.publicId || registration.id}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p
                              dir="ltr"
                              className="truncate text-right text-sm font-bold"
                            >
                              {getRegistrationContact(registration)}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                              {registration.email || "—"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {registration.companyName || "—"}
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-[#4B4B4B]/45">
                            {registration.jobTitle || "—"}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <p className="truncate font-bold">
                            {registration.attendeeType?.nameAr ||
                              registration.attendeeType?.code ||
                              "—"}
                          </p>
                        </TableCell>

                        <TableCell className="align-top">
                          <Badge
                            variant={getRegistrationStatusVariant(
                              registration.status,
                            )}
                          >
                            {registrationStatusLabels[
                              registration.status ?? ""
                            ] ||
                              registration.status ||
                              "—"}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex flex-nowrap items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              title="فتح ملف QR"
                              aria-label="فتح ملف QR"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() => openDetails(registration)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              title="توليد QR"
                              aria-label="توليد QR"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("generate", registration)
                              }
                              disabled={isActionLoading}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              title="إلغاء QR"
                              aria-label="إلغاء QR"
                              className="h-8 w-8 shrink-0 p-0"
                              onClick={() =>
                                requestAction("revoke", registration)
                              }
                              disabled={isActionLoading}
                            >
                              <ShieldX className="h-4 w-4" />
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
        open={detailsOpen}
        onClose={closeDetails}
        title="ملف QR"
        description={
          selectedRegistration
            ? getRegistrationName(selectedRegistration)
            : "تفاصيل QR"
        }
        className="max-w-4xl"
        footer={
          <>
            <Button variant="outline" onClick={closeDetails}>
              إغلاق
            </Button>

            <Button
              variant="outline"
              disabled={!currentQrToken || isActionLoading}
              onClick={() => copyText(currentQrToken, "تم نسخ QR Token")}
            >
              <Clipboard className="h-4 w-4" />
              نسخ Token
            </Button>

            <Button
              variant="danger"
              disabled={!selectedRegistration || !hasQr || isActionLoading}
              onClick={() => requestAction("revoke")}
            >
              <ShieldX className="h-4 w-4" />
              إلغاء QR
            </Button>
          </>
        }
      >
        {isQrLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />

              <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                جاري تحميل QR...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                  <p className="text-xs font-bold text-[#4B4B4B]/50">حالة QR</p>

                  <div className="mt-2">
                    {currentQrStatus ? (
                      <Badge variant={getStatusVariant(currentQrStatus)}>
                        {qrStatusLabels[currentQrStatus] || currentQrStatus}
                      </Badge>
                    ) : (
                      <Badge variant="muted">لا يوجد</Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-bold text-[#4B4B4B]/50">
                    من تاريخ
                  </p>

                  <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                    {formatDate(currentQrValidFrom)}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-bold text-[#4B4B4B]/50">
                    حتى تاريخ
                  </p>

                  <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                    {formatDate(currentQrValidUntil)}
                  </p>
                </div>
              </div>

              {!hasQr ? (
                <div className="rounded-3xl border border-[#A88042]/20 bg-[#A88042]/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                      <QrCode className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-[#4B4B4B]">
                        لا يوجد QR لهذا التسجيل
                      </p>

                      <p className="mt-1 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                        ابدأ بتوليد QR، وبعدها يمكنك إنشاء صورة ونسخها للزائر.
                      </p>

                      <Button
                        className="mt-4"
                        disabled={!selectedRegistration || isActionLoading}
                        onClick={() => requestAction("generate")}
                      >
                        {generateQrMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4" />
                        )}
                        توليد QR
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 rounded-2xl border border-black/10 bg-black p-4 text-white">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#D6B06E]">
                      <QrCode className="h-4 w-4" />
                      <p className="text-sm font-extrabold">QR Token</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyText(currentQrToken, "تم نسخ QR Token")
                      }
                    >
                      <Clipboard className="h-4 w-4" />
                      نسخ
                    </Button>
                  </div>

                  <div
                    dir="ltr"
                    className="max-h-32 min-w-0 overflow-y-auto overflow-x-hidden rounded-xl bg-white/5 p-3 text-left text-xs font-bold leading-6 text-white/80"
                  >
                    <span className="block max-w-full break-all [overflow-wrap:anywhere]">
                      {currentQrToken}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={!selectedRegistration || isActionLoading}
                  onClick={() => requestAction("generate")}
                >
                  {generateQrMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  توليد جديد
                </Button>

                <Button
                  variant="outline"
                  disabled={!selectedRegistration || !hasQr || isActionLoading}
                  onClick={() => requestAction("image")}
                >
                  {createImageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  إنشاء صورة
                </Button>

                <Button
                  variant="danger"
                  disabled={!selectedRegistration || !hasQr || isActionLoading}
                  onClick={() => requestAction("revoke")}
                >
                  {revokeQrMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldX className="h-4 w-4" />
                  )}
                  إلغاء
                </Button>
              </div>
            </div>

            <div className="min-w-0 rounded-[2rem] border border-black/10 bg-[#F8F8FF] p-5">
              {hasQrImage ? (
                <div className="text-center">
                  <img
                    src={currentQrImageUrl}
                    alt="QR Code"
                    onError={() => setImageBroken(true)}
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
                      {imageBroken ? (
                        <XCircle className="h-8 w-8 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-8 w-8" />
                      )}
                    </div>

                    <p className="text-sm font-extrabold text-[#4B4B4B]">
                      {imageBroken ? "تعذر عرض الصورة" : "لا توجد صورة"}
                    </p>

                    <p className="mt-2 text-xs font-bold leading-6 text-[#4B4B4B]/55">
                      {imageBroken
                        ? "الرابط غير قابل للعرض مباشرة. سيتم استخدام نسخة blob عند إنشاء الصورة."
                        : hasQr
                          ? "اضغط إنشاء صورة لعرض QR هنا."
                          : "ولّد QR أولًا ثم أنشئ الصورة."}
                    </p>

                    <Button
                      className="mt-4"
                      variant="outline"
                      disabled={!hasQr || isActionLoading}
                      onClick={() => requestAction("image")}
                    >
                      {createImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      إنشاء صورة
                    </Button>
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
