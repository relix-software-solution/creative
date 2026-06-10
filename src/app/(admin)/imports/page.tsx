"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
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
} from "@/features/imports/imports.queries";
import {
  ImportJob,
  ImportJobStatus,
  ImportRow,
  ImportRowStatus,
} from "@/features/imports/imports.types";

type PendingAction = "create" | null;

const importStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المعالجة",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  PARTIALLY_COMPLETED: "مكتمل جزئيًا",
};

const rowStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المعالجة",
  SUCCESS: "نجح",
  FAILED: "فشل",
  SKIPPED: "متجاوز",
};

function getImportStatusVariant(
  status?: ImportJobStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING" || status === "PROCESSING") return "warning";
  if (status === "FAILED") return "danger";
  if (status === "PARTIALLY_COMPLETED") return "gold";
  return "muted";
}

function getRowStatusVariant(
  status?: ImportRowStatus | null,
): "success" | "warning" | "danger" | "muted" | "gold" {
  if (status === "SUCCESS") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED") return "danger";
  if (status === "SKIPPED") return "muted";
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

function getFileName(job: ImportJob) {
  return job.originalFileName || job.fileName || "ملف تسجيلات";
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

function getRowError(row: ImportRow) {
  if (row.errorMessage) return row.errorMessage;

  if (Array.isArray(row.errors)) {
    return row.errors.join("، ");
  }

  if (typeof row.errors === "string") {
    return row.errors;
  }

  return "—";
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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingValues, setPendingValues] =
    useState<RegistrationsImportFormValues | null>(null);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

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

  const isSubmitting = createImportMutation.isPending;

  function openUploadModal() {
    form.reset({
      eventId: eventFilter || "",
      attendeeTypeId: attendeeTypeFilter || "",
      file: undefined,
    });
    setPendingValues(null);
    setPendingAction(null);
    setUploadModalOpen(true);
  }

  function closeUploadModal() {
    if (isSubmitting) return;
    setUploadModalOpen(false);
    setPendingValues(null);
    setPendingAction(null);
    form.reset();
  }

  function closeConfirm() {
    if (isSubmitting) return;
    setConfirmOpen(false);
    setPendingValues(null);
    setPendingAction(null);
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

  const requestSubmit: SubmitHandler<RegistrationsImportFormValues> = (
    values,
  ) => {
    setPendingValues(values);
    setPendingAction("create");
    setConfirmOpen(true);
  };

  function confirmAction() {
    if (pendingAction !== "create" || !pendingValues) return;

    createImportMutation.mutate(pendingValues, {
      onSuccess: () => {
        closeConfirm();
        closeUploadModal();
      },
    });
  }

  function getEventTitle(eventId: string) {
    return (
      events.find((event) => event.id === eventId)?.titleAr ||
      jobs.find((job) => job.eventId === eventId)?.event?.titleAr ||
      "—"
    );
  }

  function getAttendeeTypeTitle(attendeeTypeId: string) {
    return (
      attendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      formAttendeeTypes.find((type) => type.id === attendeeTypeId)?.nameAr ||
      jobs.find((job) => job.attendeeTypeId === attendeeTypeId)?.attendeeType
        ?.nameAr ||
      "—"
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Imports"
        title="استيراد التسجيلات"
        description="رفع ملف CSV أو Excel لتسجيل عدد كبير من الحضور دفعة واحدة، مع متابعة النتائج والصفوف الفاشلة."
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
                  تابع حالة ملفات التسجيلات التي تم رفعها، وافتح تفاصيل الصفوف
                  لمعرفة الناجح والفاشل.
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
                  { label: "مكتمل جزئيًا", value: "PARTIALLY_COMPLETED" },
                  { label: "فشل", value: "FAILED" },
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
                  ارفع ملف CSV أو Excel لإضافة تسجيلات كثيرة دفعة واحدة.
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
                          {importStatusLabels[job.status] || job.status || "—"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="grid min-w-[180px] gap-1 text-xs font-bold text-[#4B4B4B]/60">
                          <div className="flex justify-between">
                            <span>الإجمالي</span>
                            <span>{job.totalRows ?? 0}</span>
                          </div>

                          <div className="flex justify-between text-emerald-700">
                            <span>ناجح</span>
                            <span>{job.successRows ?? 0}</span>
                          </div>

                          <div className="flex justify-between text-red-700">
                            <span>فاشل</span>
                            <span>{job.failedRows ?? 0}</span>
                          </div>

                          <div className="flex justify-between">
                            <span>متجاوز</span>
                            <span>{job.skippedRows ?? 0}</span>
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
        onClose={closeUploadModal}
        title="رفع ملف تسجيلات"
        description="اختر الفعالية ونوع الحضور ثم ارفع ملف CSV أو Excel يحتوي بيانات التسجيلات."
        className="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeUploadModal}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>

            <Button
              onClick={form.handleSubmit(requestSubmit)}
              disabled={isSubmitting}
            >
              متابعة الرفع
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(requestSubmit)}
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
              form.setValue("attendeeTypeId", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={events.map((event) => ({
              label: event.titleAr,
              value: event.id,
            }))}
          />

          <Select
            label="نوع الحضور"
            value={form.watch("attendeeTypeId")}
            placeholder="اختر نوع الحضور"
            disabled={!form.watch("eventId")}
            error={form.formState.errors.attendeeTypeId?.message}
            onChange={(value) => {
              form.setValue("attendeeTypeId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            options={formAttendeeTypes.map((type) => ({
              label: type.nameAr,
              value: type.id,
            }))}
          />

          <div className="space-y-2">
            <label className="text-sm font-extrabold text-[#4B4B4B]">
              ملف التسجيلات
            </label>

            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#A88042]/45 bg-[#A88042]/5 p-6 text-center transition hover:bg-[#A88042]/10">
              <UploadCloud className="mb-3 h-9 w-9 text-[#A88042]" />

              <p className="text-sm font-extrabold text-[#4B4B4B]">
                {selectedFile?.name || "اضغط لاختيار ملف CSV أو Excel"}
              </p>

              <p className="mt-2 text-xs font-bold leading-6 text-[#4B4B4B]/50">
                الصيغ المدعومة: CSV, XLS, XLSX
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
                }}
              />
            </label>

            {form.formState.errors.file ? (
              <p className="text-sm font-bold text-red-600">
                {form.formState.errors.file.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
            <p className="text-sm font-extrabold text-[#4B4B4B]">
              الأعمدة المقترحة داخل الملف
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "fullName",
                "phone",
                "email",
                "companyName",
                "jobTitle",
                "externalId",
                "notes",
              ].map((column) => (
                <Badge key={column} variant="muted">
                  {column}
                </Badge>
              ))}
            </div>

            <p className="mt-3 text-xs font-bold leading-6 text-[#4B4B4B]/55">
              أي أعمدة إضافية ممكن يحفظها الباك داخل customFields حسب طريقة
              المعالجة عندكم.
            </p>
          </div>
        </form>
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
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">
                  إجمالي الصفوف
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
                  {selectedJob.totalRows ?? 0}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">ناجح</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                  {selectedJob.successRows ?? 0}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">فاشل</p>
                <p className="mt-2 text-2xl font-extrabold text-red-700">
                  {selectedJob.failedRows ?? 0}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/55">الحالة</p>
                <div className="mt-2">
                  <Badge variant={getImportStatusVariant(selectedJob.status)}>
                    {importStatusLabels[selectedJob.status] ||
                      selectedJob.status ||
                      "—"}
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
                  { label: "ناجح", value: "SUCCESS" },
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
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#A88042]" />
                <p className="mt-3 text-sm font-bold text-[#4B4B4B]/60">
                  جاري تحميل صفوف الاستيراد...
                </p>
              </div>
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
                    <TableHead>البيانات</TableHead>
                    <TableHead>الأخطاء</TableHead>
                    <TableHead>Registration ID</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowNumber ?? "—"}</TableCell>

                      <TableCell>
                        <Badge variant={getRowStatusVariant(row.status)}>
                          {rowStatusLabels[row.status] || row.status || "—"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <pre className="custom-scrollbar max-h-32 max-w-[360px] overflow-auto rounded-2xl bg-black p-3 text-left text-xs leading-5 text-white">
                          {stringifyValue(row.data)}
                        </pre>
                      </TableCell>

                      <TableCell>
                        <p className="max-w-[260px] text-sm font-bold leading-6 text-red-700">
                          {getRowError(row)}
                        </p>
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
        title="تأكيد رفع ملف التسجيلات"
        description={
          selectedFile
            ? `سيتم رفع الملف ${selectedFile.name} وبدء عملية الاستيراد مباشرة.`
            : "سيتم رفع الملف وبدء عملية الاستيراد مباشرة."
        }
        confirmText="تأكيد الرفع"
        variant="gold"
        isLoading={isSubmitting}
        onClose={closeConfirm}
        onConfirm={confirmAction}
      />
    </div>
  );
}
