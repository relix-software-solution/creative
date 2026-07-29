"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useAttendeeTypes } from "@/features/attendee-types/attendee-types.queries";
import { useEvents } from "@/features/events/events.queries";
import {
  RegistrationsImportFormValues,
  registrationsImportSchema,
} from "@/features/imports/imports.schema";
import {
  useCreateRegistrationsImport,
  useImportRows,
  useImports,
  usePreviewRegistrationsImport,
} from "@/features/imports/imports.queries";
import {
  ImportDuplicateStrategy,
  ImportJob,
  ImportJobStatus,
  ImportMapping,
  ImportPreviewResponse,
  ImportRow,
  ImportRowStatus,
} from "@/features/imports/imports.types";

type WizardStep = 1 | 2 | 3;
type SystemMappingKey = Exclude<keyof ImportMapping, "customFields">;

const importStatusLabels: Record<ImportJobStatus, string> = {
  PENDING: "بانتظار المعالجة",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  PARTIAL_FAILED: "مكتمل جزئيًا",
  FAILED: "فشل",
  CANCELLED: "ملغى",
};

const rowStatusLabels: Record<ImportRowStatus, string> = {
  PENDING: "بانتظار المعالجة",
  PROCESSED: "تم الاستيراد",
  FAILED: "فشل",
  DUPLICATE: "مكرر",
  SKIPPED: "متجاوز",
};

const duplicateStrategyLabels: Record<ImportDuplicateStrategy, string> = {
  SKIP: "تجاوز السجلات المكررة",
  FAIL: "اعتبار السجل المكرر فاشلًا",
  UPDATE_EXISTING: "تحديث التسجيل الموجود",
};

function getImportStatusVariant(
  status?: ImportJobStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING" || status === "PROCESSING") return "warning";
  if (status === "FAILED") return "danger";
  if (status === "PARTIAL_FAILED") return "gold";
  return "muted";
}

function getRowStatusVariant(
  status?: ImportRowStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "PROCESSED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED") return "danger";
  if (status === "DUPLICATE") return "gold";
  return "muted";
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

function formatFileSize(value?: number | null) {
  if (!value) return "—";

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getFileName(job: ImportJob) {
  return job.fileName || "ملف تسجيلات";
}

function getRowError(row: ImportRow) {
  if (row.errorMessage) return row.errorMessage;
  if (row.status === "DUPLICATE") return "التسجيل موجود مسبقًا";

  return "—";
}

function getMappedPreviewValue(
  row: Record<string, unknown>,
  mapping: ImportMapping,
  key: SystemMappingKey,
) {
  const header = mapping[key];

  if (!header) return "—";

  const value = row[header];

  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}

export default function ImportsPage() {
  const [page, setPage] = useState(1);
  const [rowsPage, setRowsPage] = useState(1);

  const [eventFilter, setEventFilter] = useState("");
  const [attendeeTypeFilter, setAttendeeTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowStatusFilter, setRowStatusFilter] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [rowsModalOpen, setRowsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [dataStartRow, setDataStartRow] = useState(2);
  const [generateQr, setGenerateQr] = useState(true);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<ImportDuplicateStrategy>("SKIP");
  const [externalIdPrefix, setExternalIdPrefix] = useState("");

  const importsParams = useMemo(
    () => ({
      page,
      limit: 20,
      eventId: eventFilter || undefined,
      attendeeTypeId: attendeeTypeFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, eventFilter, attendeeTypeFilter, statusFilter],
  );

  const rowsParams = useMemo(
    () => ({
      page: rowsPage,
      limit: 20,
      status: rowStatusFilter || undefined,
    }),
    [rowsPage, rowStatusFilter],
  );

  const importsQuery = useImports(importsParams);
  const eventsQuery = useEvents({ page: 1, limit: 100 });

  const attendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: eventFilter || undefined,
  });

  const rowsQuery = useImportRows(selectedJob?.id ?? "", rowsParams);
  const previewMutation = usePreviewRegistrationsImport();
  const createImportMutation = useCreateRegistrationsImport();

  const form = useForm<RegistrationsImportFormValues>({
    resolver: zodResolver(registrationsImportSchema),
    defaultValues: {
      eventId: "",
      attendeeTypeId: "",
      file: undefined,
    },
  });

  const jobs = importsQuery.data?.items ?? [];
  const rows = rowsQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const attendeeTypes = attendeeTypesQuery.data?.items ?? [];
  const total = importsQuery.data?.total ?? jobs.length;
  const totalPages = importsQuery.data?.totalPages ?? 1;
  const rowsTotal = rowsQuery.data?.total ?? rows.length;
  const rowsTotalPages = rowsQuery.data?.totalPages ?? 1;

  const selectedFormEventId = form.watch("eventId");
  const selectedFile = form.watch("file");

  const formAttendeeTypesQuery = useAttendeeTypes({
    page: 1,
    limit: 100,
    eventId: selectedFormEventId || undefined,
  });

  const formAttendeeTypes = formAttendeeTypesQuery.data?.items ?? [];

  const isAnalyzing = previewMutation.isPending;
  const isSubmitting = createImportMutation.isPending;

  const headerOptions = useMemo(
    () => [
      { label: "غير مربوط", value: "" },
      ...(preview?.headers.map((header) => ({
        label: `${header.columnLetter} — ${header.label}`,
        value: header.key,
      })) ?? []),
    ],
    [preview],
  );

  const mappedHeaderKeys = useMemo(() => {
    return new Set(
      [
        mapping.fullName,
        mapping.phone,
        mapping.email,
        mapping.companyName,
        mapping.jobTitle,
        mapping.externalId,
        mapping.notes,
        mapping.attendeeTypeCode,
        ...Object.values(mapping.customFields ?? {}),
      ].filter((value): value is string => Boolean(value)),
    );
  }, [mapping]);

  const unmappedHeaders =
    preview?.headers.filter((header) => !mappedHeaderKeys.has(header.key)) ??
    [];

  function resetWizard() {
    setWizardStep(1);
    setPreview(null);
    setMapping({});
    setSelectedSheetName("");
    setHeaderRow(1);
    setDataStartRow(2);
    setGenerateQr(true);
    setDuplicateStrategy("SKIP");
    setExternalIdPrefix("");
  }

  function openUploadModal() {
    form.reset({
      eventId: eventFilter || "",
      attendeeTypeId: attendeeTypeFilter || "",
      file: undefined,
    });

    resetWizard();
    setUploadModalOpen(true);
  }

  function closeUploadModal(force = false) {
    if (!force && (isSubmitting || isAnalyzing)) return;

    setUploadModalOpen(false);
    setConfirmOpen(false);
    form.reset();
    resetWizard();
  }

  function openRowsModal(job: ImportJob) {
    setSelectedJob(job);
    setRowsPage(1);
    setRowStatusFilter("");
    setRowsModalOpen(true);
  }

  function closeRowsModal() {
    setRowsModalOpen(false);
    setSelectedJob(null);
    setRowsPage(1);
    setRowStatusFilter("");
  }

  function clearFilters() {
    setPage(1);
    setEventFilter("");
    setAttendeeTypeFilter("");
    setStatusFilter("");
  }

  async function analyzeFile(useCurrentParser = false) {
    const valid = await form.trigger();

    if (!valid) return;

    const values = form.getValues();

    try {
      const result = await previewMutation.mutateAsync({
        eventId: values.eventId,
        attendeeTypeId: values.attendeeTypeId,
        file: values.file,
        sheetName: useCurrentParser
          ? selectedSheetName || undefined
          : undefined,
        headerRow: useCurrentParser ? headerRow : undefined,
        dataStartRow: useCurrentParser ? dataStartRow : undefined,
      });

      setPreview(result);
      setSelectedSheetName(result.selectedSheetName);
      setHeaderRow(result.headerRow);
      setDataStartRow(result.dataStartRow);
      setMapping(result.suggestedMapping);
      setWizardStep(2);
    } catch {
      // Mutation تعرض رسالة الخطأ.
    }
  }

  function setSystemMapping(key: SystemMappingKey, value: string) {
    setMapping((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  }

  function setCustomFieldMapping(key: string, value: string) {
    setMapping((current) => ({
      ...current,
      customFields: {
        ...(current.customFields ?? {}),
        [key]: value,
      },
    }));
  }

  function goToReview() {
    if (!mapping.fullName) {
      toast.error("اربط عمود الاسم الكامل قبل المتابعة.");
      return;
    }

    const allMappedHeaders = [
      mapping.fullName,
      mapping.phone,
      mapping.email,
      mapping.companyName,
      mapping.jobTitle,
      mapping.externalId,
      mapping.notes,
      mapping.attendeeTypeCode,
      ...Object.values(mapping.customFields ?? {}),
    ].filter((value): value is string => Boolean(value));

    const duplicateMappings = allMappedHeaders.filter(
      (header, index, values) => values.indexOf(header) !== index,
    );

    if (duplicateMappings.length > 0) {
      toast.warning("يوجد عمود واحد مربوط بأكثر من حقل. راجع الربط.");
    }

    setWizardStep(3);
  }

  function confirmImport() {
    if (!preview || !mapping.fullName) {
      toast.error("بيانات المعاينة أو ربط الاسم غير مكتملة.");
      return;
    }

    setConfirmOpen(true);
  }

  function executeImport() {
    const values = form.getValues();

    if (!preview || !mapping.fullName) return;

    createImportMutation.mutate(
      {
        eventId: values.eventId,
        attendeeTypeId: values.attendeeTypeId,
        file: values.file,
        generateQr,
        duplicateStrategy,
        externalIdPrefix: externalIdPrefix.trim() || undefined,
        mapping,
        sheetName: selectedSheetName,
        headerRow,
        dataStartRow,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          closeUploadModal(true);
          setPage(1);
        },
      },
    );
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      jobs.find((job) => job.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function getAttendeeTypeTitle(attendeeTypeId?: string | null) {
    if (!attendeeTypeId) return "حسب الملف / النوع الافتراضي";

    return (
      attendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      formAttendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      jobs.find((job) => job.attendeeTypeId === attendeeTypeId)?.attendeeType
        ?.nameAr ||
      "—"
    );
  }

  function renderWizardFooter() {
    if (wizardStep === 1) {
      return (
        <>
          <Button
            variant="outline"
            onClick={() => closeUploadModal()}
            disabled={isAnalyzing}
          >
            إلغاء
          </Button>

          <Button
            onClick={() => void analyzeFile(false)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            تحليل الملف
          </Button>
        </>
      );
    }

    if (wizardStep === 2) {
      return (
        <>
          <Button variant="outline" onClick={() => setWizardStep(1)}>
            <ArrowRight className="h-4 w-4" />
            السابق
          </Button>

          <Button onClick={goToReview}>
            مراجعة نهائية
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="outline" onClick={() => setWizardStep(2)}>
          <ArrowRight className="h-4 w-4" />
          تعديل الربط
        </Button>

        <Button onClick={confirmImport} disabled={isSubmitting}>
          <UploadCloud className="h-4 w-4" />
          بدء الاستيراد
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Imports"
        title="استيراد التسجيلات"
        description="حلّل ملف CSV أو Excel، اربط أعمدته بحقول النظام، ثم راجع النتائج قبل بدء الاستيراد."
        actions={
          <Button onClick={openUploadModal}>
            <UploadCloud className="h-4 w-4" />
            رفع ملف تسجيلات
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">
            عمليات الاستيراد
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="text-3xl font-extrabold text-[#4B4B4B]">{total}</h3>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">نتائج الصفحة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {jobs.length}
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">قيد المعالجة</p>
          <h3 className="mt-3 text-3xl font-extrabold text-[#4B4B4B]">
            {
              jobs.filter(
                (job) =>
                  job.status === "PENDING" || job.status === "PROCESSING",
              ).length
            }
          </h3>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold text-[#4B4B4B]/60">حالة البيانات</p>
          <div className="mt-3">
            <Badge variant={importsQuery.isFetching ? "warning" : "success"}>
              {importsQuery.isFetching ? "تحديث..." : "مستقرة"}
            </Badge>
          </div>
        </Card>
      </section>

      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>سجل عمليات الاستيراد</CardTitle>
                <CardDescription>
                  تابع الملفات، نتائج الصفوف، التسجيلات المكررة، وأخطاء التحقق.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => importsQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>

                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[240px_240px_200px_auto]">
              <Select
                value={eventFilter}
                placeholder="كل الفعاليات"
                onChange={(value) => {
                  setPage(1);
                  setEventFilter(value);
                  setAttendeeTypeFilter("");
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
                value={attendeeTypeFilter}
                placeholder="كل أنواع الحضور"
                disabled={!eventFilter}
                onChange={(value) => {
                  setPage(1);
                  setAttendeeTypeFilter(value);
                }}
                options={[
                  { label: "كل أنواع الحضور", value: "" },
                  ...attendeeTypes.map((type) => ({
                    label: type.nameAr,
                    value: type.id,
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
                  { label: "بانتظار المعالجة", value: "PENDING" },
                  { label: "قيد المعالجة", value: "PROCESSING" },
                  { label: "مكتمل", value: "COMPLETED" },
                  { label: "مكتمل جزئيًا", value: "PARTIAL_FAILED" },
                  { label: "فشل", value: "FAILED" },
                  { label: "ملغى", value: "CANCELLED" },
                ]}
              />

              <Button variant="secondary" onClick={openUploadModal}>
                <Plus className="h-4 w-4" />
                رفع ملف جديد
              </Button>
            </div>
          </div>

          {importsQuery.isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل عمليات الاستيراد...
                </p>
              </div>
            </div>
          ) : importsQuery.isError ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50">
              <div className="text-center">
                <p className="text-lg font-extrabold text-red-700">
                  تعذر تحميل عمليات الاستيراد
                </p>
                <Button
                  className="mt-4"
                  variant="danger"
                  onClick={() => importsQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A88042]/10 text-[#A88042]">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <p className="text-lg font-extrabold text-[#4B4B4B]">
                  لا توجد عمليات استيراد بعد
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/60">
                  ارفع الملف ثم راجع صف العناوين وربط الأعمدة قبل التنفيذ.
                </p>
                <Button className="mt-5" onClick={openUploadModal}>
                  <UploadCloud className="h-4 w-4" />
                  رفع ملف تسجيلات
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الملف</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>نوع الحضور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>النتائج</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-extrabold">{getFileName(job)}</p>
                          <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                            {formatFileSize(job.fileSizeBytes)} —{" "}
                            {job.id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{getEventTitle(job.eventId)}</TableCell>

                      <TableCell>
                        {getAttendeeTypeTitle(job.attendeeTypeId)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getImportStatusVariant(job.status)}>
                          {importStatusLabels[job.status] || job.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="grid min-w-[190px] gap-1 text-xs font-bold text-[#4B4B4B]/60">
                          <div className="flex justify-between">
                            <span>الإجمالي</span>
                            <span>{job.totalRows}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>تم الاستيراد</span>
                            <span>{job.successRows}</span>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span>مكرر</span>
                            <span>{job.duplicateRows}</span>
                          </div>
                          <div className="flex justify-between text-red-700">
                            <span>فاشل</span>
                            <span>{job.failedRows}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p>{formatDate(job.createdAt)}</p>
                          {job.completedAt ? (
                            <p className="mt-1 text-xs font-bold text-[#A88042]">
                              اكتمل: {formatDate(job.completedAt)}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRowsModal(job)}
                        >
                          <Eye className="h-4 w-4" />
                          التفاصيل
                        </Button>
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
        open={uploadModalOpen}
        onClose={() => closeUploadModal()}
        title="استيراد تسجيلات من ملف"
        description={`المرحلة ${wizardStep} من 3 — ${
          wizardStep === 1
            ? "اختيار وتحليل الملف"
            : wizardStep === 2
              ? "ربط الأعمدة"
              : "المراجعة النهائية"
        }`}
        className="max-w-6xl"
        footer={renderWizardFooter()}
      >
        {wizardStep === 1 ? (
          <form className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
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
                  form.setValue("attendeeTypeId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setPreview(null);
                }}
                options={events.map((event) => ({
                  label: event.titleAr,
                  value: event.id,
                }))}
              />

              <Select
                label="نوع الحضور الافتراضي"
                value={form.watch("attendeeTypeId")}
                placeholder="اختر نوع الحضور"
                disabled={!form.watch("eventId")}
                error={form.formState.errors.attendeeTypeId?.message}
                onChange={(value) => {
                  form.setValue("attendeeTypeId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setPreview(null);
                }}
                options={formAttendeeTypes.map((type) => ({
                  label: `${type.nameAr} — ${type.code}`,
                  value: type.id,
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-extrabold text-[#4B4B4B]">
                ملف التسجيلات
              </label>

              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#A88042]/45 bg-[#A88042]/5 p-6 text-center transition hover:bg-[#A88042]/10">
                <UploadCloud className="mb-3 h-9 w-9 text-[#A88042]" />
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  {selectedFile?.name || "اضغط لاختيار ملف CSV أو XLS أو XLSX"}
                </p>
                <p className="mt-2 text-xs font-bold leading-6 text-[#4B4B4B]/50">
                  الحد الأعلى 20MB. لا يشترط أن تكون أسماء الأعمدة في أول صف.
                </p>

                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    form.setValue("file", file, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setPreview(null);
                  }}
                />
              </label>

              {form.formState.errors.file ? (
                <p className="text-sm font-bold text-red-600">
                  {form.formState.errors.file.message}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-7 text-blue-800">
              النظام سيقرأ أسماء الـSheets، يكتشف صف العناوين، يقترح ربط
              الأعمدة، ويعرض أول الصفوف قبل إنشاء أي تسجيل.
            </div>
          </form>
        ) : null}

        {wizardStep === 2 && preview ? (
          <div className="space-y-6">
            <section className="grid gap-4 rounded-3xl border border-black/10 bg-[#F8F8FF] p-5 md:grid-cols-4">
              <Select
                label="ورقة Excel"
                value={selectedSheetName}
                onChange={setSelectedSheetName}
                options={preview.sheets.map((sheet) => ({
                  label: sheet,
                  value: sheet,
                }))}
              />

              <Input
                label="رقم صف العناوين"
                type="number"
                min={1}
                value={headerRow}
                onChange={(event) => setHeaderRow(Number(event.target.value))}
              />

              <Input
                label="أول صف بيانات"
                type="number"
                min={2}
                value={dataStartRow}
                onChange={(event) =>
                  setDataStartRow(Number(event.target.value))
                }
              />

              <div className="flex items-end">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={isAnalyzing}
                  onClick={() => void analyzeFile(true)}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  إعادة التحليل
                </Button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">الملف</p>
                <p className="mt-2 truncate text-sm font-extrabold">
                  {preview.file.name}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">الورقة</p>
                <p className="mt-2 text-sm font-extrabold">
                  {preview.selectedSheetName}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  صفوف البيانات
                </p>
                <p className="mt-2 text-2xl font-extrabold">
                  {preview.totalRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  صف العناوين المكتشف
                </p>
                <p className="mt-2 text-2xl font-extrabold">
                  {preview.detectedHeaderRow}
                </p>
              </Card>
            </section>

            {preview.warnings.length > 0 ? (
              <section className="space-y-2">
                {preview.warnings.map((warning, index) => (
                  <div
                    key={`${warning.code}-${index}`}
                    className={`rounded-2xl border p-4 text-sm font-bold leading-7 ${
                      warning.severity === "ERROR"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : warning.severity === "WARNING"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-blue-200 bg-blue-50 text-blue-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
                      <div>
                        <p>{warning.message}</p>
                        {warning.rowNumbers?.length ? (
                          <p className="mt-1 text-xs opacity-75">
                            الصفوف: {warning.rowNumbers.join("، ")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                  حقول النظام
                </h3>
                <p className="mt-1 text-sm font-bold text-[#4B4B4B]/55">
                  الاسم الكامل إلزامي. الهاتف اختياري في مسار الاستيراد فقط.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {preview.availableFields.system.map((field) => (
                  <Select
                    key={field.key}
                    label={`${field.labelAr}${field.required ? " *" : ""}`}
                    value={mapping[field.key] ?? ""}
                    placeholder="اختر عمود الملف"
                    onChange={(value) => setSystemMapping(field.key, value)}
                    options={headerOptions}
                  />
                ))}
              </div>
            </section>

            {preview.availableFields.custom.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                    حقول الفعالية الإضافية
                  </h3>
                  <p className="mt-1 text-sm font-bold text-[#4B4B4B]/55">
                    هذه الحقول مأخوذة مباشرة من إعدادات الفعالية ونوع الحضور.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {preview.availableFields.custom.map((field) => (
                    <Select
                      key={field.key}
                      label={`${field.labelAr}${field.required ? " *" : ""}`}
                      value={mapping.customFields?.[field.key] ?? ""}
                      placeholder="اختر عمود الملف"
                      onChange={(value) =>
                        setCustomFieldMapping(field.key, value)
                      }
                      options={headerOptions}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 rounded-3xl border border-black/10 p-5 md:grid-cols-2">
              <Select
                label="سياسة السجلات المكررة"
                value={duplicateStrategy}
                onChange={(value) =>
                  setDuplicateStrategy(value as ImportDuplicateStrategy)
                }
                options={Object.entries(duplicateStrategyLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
              />

              <Input
                label="بادئة المعرف الخارجي — اختياري"
                value={externalIdPrefix}
                placeholder="مثال: EXHIBITOR-"
                onChange={(event) => setExternalIdPrefix(event.target.value)}
              />

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 bg-[#F8F8FF] p-4 md:col-span-2">
                <input
                  type="checkbox"
                  checked={generateQr}
                  onChange={(event) => setGenerateQr(event.target.checked)}
                  className="h-5 w-5 accent-[#A88042]"
                />
                <div>
                  <p className="text-sm font-extrabold text-[#4B4B4B]">
                    تشغيل Registration Pipeline للتسجيلات المستوردة
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#4B4B4B]/55">
                    اتركه مفعّلًا حتى يتم تجهيز QR والإشعارات وفق Pipeline
                    الحالي.
                  </p>
                </div>
              </label>
            </section>

            {unmappedHeaders.length > 0 ? (
              <section className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <p className="text-sm font-extrabold text-[#4B4B4B]">
                  أعمدة غير مربوطة وسيتم تجاهلها
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unmappedHeaders.map((header) => (
                    <Badge key={header.key} variant="muted">
                      {header.columnLetter} — {header.label}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {wizardStep === 3 && preview ? (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  عدد الصفوف
                </p>
                <p className="mt-2 text-2xl font-extrabold">
                  {preview.totalRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  نوع الحضور
                </p>
                <p className="mt-2 text-sm font-extrabold">
                  {getAttendeeTypeTitle(form.getValues("attendeeTypeId"))}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">المكرر</p>
                <p className="mt-2 text-sm font-extrabold">
                  {duplicateStrategyLabels[duplicateStrategy]}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  Pipeline / QR
                </p>
                <p className="mt-2 text-sm font-extrabold">
                  {generateQr ? "مفعّل" : "متوقف"}
                </p>
              </Card>
            </section>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-7 text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
                <p>
                  لن يتم إنشاء أي تسجيل قبل الضغط على «بدء الاستيراد». الجدول
                  التالي معاينة من الملف فقط.
                </p>
              </div>
            </div>

            <div className="overflow-auto rounded-3xl border border-black/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>صف Excel</TableHead>
                    <TableHead>الاسم الكامل</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>المسمى الوظيفي</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>المعرف الخارجي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.previewRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-extrabold">
                        {getMappedPreviewValue(row.values, mapping, "fullName")}
                      </TableCell>
                      <TableCell>
                        {getMappedPreviewValue(
                          row.values,
                          mapping,
                          "companyName",
                        )}
                      </TableCell>
                      <TableCell>
                        {getMappedPreviewValue(row.values, mapping, "jobTitle")}
                      </TableCell>
                      <TableCell>
                        {getMappedPreviewValue(row.values, mapping, "phone")}
                      </TableCell>
                      <TableCell>
                        {getMappedPreviewValue(row.values, mapping, "email")}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const value = getMappedPreviewValue(
                            row.values,
                            mapping,
                            "externalId",
                          );

                          return value === "—"
                            ? "—"
                            : `${externalIdPrefix}${value}`;
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={rowsModalOpen}
        onClose={closeRowsModal}
        title="تفاصيل عملية الاستيراد"
        description={
          selectedJob
            ? `الملف: ${getFileName(selectedJob)}`
            : "تفاصيل الصفوف المستوردة"
        }
        className="max-w-6xl"
        footer={
          <Button variant="outline" onClick={closeRowsModal}>
            إغلاق
          </Button>
        }
      >
        <div className="space-y-5">
          {selectedJob ? (
            <div className="grid gap-3 md:grid-cols-5">
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  إجمالي الصفوف
                </p>
                <p className="mt-2 text-2xl font-extrabold">
                  {selectedJob.totalRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  تم الاستيراد
                </p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                  {selectedJob.successRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">مكرر</p>
                <p className="mt-2 text-2xl font-extrabold text-amber-700">
                  {selectedJob.duplicateRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">فاشل</p>
                <p className="mt-2 text-2xl font-extrabold text-red-700">
                  {selectedJob.failedRows}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">الحالة</p>
                <div className="mt-2">
                  <Badge variant={getImportStatusVariant(selectedJob.status)}>
                    {importStatusLabels[selectedJob.status]}
                  </Badge>
                </div>
              </Card>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#4B4B4B]">
                صفوف الملف
              </p>
              <p className="mt-1 text-xs font-bold text-[#4B4B4B]/50">
                عدد النتائج: {rowsTotal}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={rowStatusFilter}
                placeholder="كل حالات الصفوف"
                onChange={(value) => {
                  setRowsPage(1);
                  setRowStatusFilter(value);
                }}
                options={[
                  { label: "كل حالات الصفوف", value: "" },
                  { label: "تم الاستيراد", value: "PROCESSED" },
                  { label: "مكرر", value: "DUPLICATE" },
                  { label: "فشل", value: "FAILED" },
                  { label: "متجاوز", value: "SKIPPED" },
                  { label: "بانتظار المعالجة", value: "PENDING" },
                ]}
                className="w-56"
              />

              <Button variant="outline" onClick={() => rowsQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>

          {rowsQuery.isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border border-black/10 bg-[#F8F8FF]">
              <Loader2 className="h-8 w-8 animate-spin text-[#A88042]" />
            </div>
          ) : rowsQuery.isError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-lg font-extrabold text-red-700">
                تعذر تحميل صفوف الاستيراد
              </p>
              <Button
                className="mt-4"
                variant="danger"
                onClick={() => rowsQuery.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-black/10 bg-[#F8F8FF] p-6 text-center">
              <Search className="mx-auto h-8 w-8 text-[#A88042]" />
              <p className="mt-3 text-sm font-extrabold text-[#4B4B4B]">
                لا توجد صفوف مطابقة
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الصف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>البيانات الأصلية</TableHead>
                    <TableHead>البيانات المطبّعة</TableHead>
                    <TableHead>الخطأ</TableHead>
                    <TableHead>Registration ID</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <Badge variant={getRowStatusVariant(row.status)}>
                          {rowStatusLabels[row.status] || row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <pre className="custom-scrollbar max-h-36 max-w-[320px] overflow-auto rounded-2xl bg-black p-3 text-left text-xs leading-5 text-white">
                          {stringifyValue(row.rawData)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        <pre className="custom-scrollbar max-h-36 max-w-[320px] overflow-auto rounded-2xl bg-[#F8F8FF] p-3 text-left text-xs leading-5 text-[#4B4B4B]">
                          {stringifyValue(row.normalizedData)}
                        </pre>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px]">
                          {row.errorCode ? (
                            <Badge variant="danger">{row.errorCode}</Badge>
                          ) : null}
                          <p className="mt-2 text-sm font-bold leading-6 text-red-700">
                            {getRowError(row)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.registrationId ? "success" : "muted"}
                        >
                          {row.registrationId
                            ? row.registrationId.slice(0, 8)
                            : "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-[#4B4B4B]/55">
                  الصفحة {rowsPage} من {rowsTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={rowsPage <= 1}
                    onClick={() =>
                      setRowsPage((value) => Math.max(1, value - 1))
                    }
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    disabled={rowsPage >= rowsTotalPages}
                    onClick={() => setRowsPage((value) => value + 1)}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد بدء الاستيراد"
        description={
          preview
            ? `سيتم إنشاء Job لمعالجة ${preview.totalRows} صف من الملف ${preview.file.name}.`
            : "سيتم بدء عملية الاستيراد."
        }
        confirmText="بدء الاستيراد"
        variant="gold"
        isLoading={isSubmitting}
        onClose={() => {
          if (!isSubmitting) setConfirmOpen(false);
        }}
        onConfirm={executeImport}
      />
    </div>
  );
}
