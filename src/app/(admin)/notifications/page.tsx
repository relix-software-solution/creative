"use client";

import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEvents } from "@/features/events/events.queries";
import {
  useNotificationLogs,
  useNotificationSummary,
  useNotificationTemplates,
  useRetryFailedNotifications,
  useRetryNotificationLog,
  useSetNotificationTemplateActive,
} from "@/features/notifications/notification-center.queries";
import type {
  NotificationLogItem,
  NotificationProvider,
  NotificationStatus,
} from "@/features/notifications/notification-center.types";

const numberFormatter = new Intl.NumberFormat("ar-SY");

function formatNumber(value?: number | null) {
  return numberFormatter.format(value ?? 0);
}

function formatPercent(value?: number | null) {
  return `${new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 1 }).format(value ?? 0)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: NotificationStatus) {
  return {
    PENDING: "بانتظار الإرسال",
    SENT: "تم الإرسال",
    DELIVERED: "تم التسليم",
    FAILED: "فشل",
    CANCELLED: "ملغى",
  }[status];
}

function statusVariant(status: NotificationStatus): "gold" | "success" | "danger" | "muted" {
  if (status === "DELIVERED" || status === "SENT") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PENDING") return "gold";
  return "muted";
}

function providerLabel(provider: NotificationProvider) {
  return provider === "WASENDER" ? "WaSender" : provider === "META_CLOUD" ? "Meta Cloud" : "Fake / Test";
}

export default function NotificationsPage() {
  const [eventId, setEventId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [provider, setProvider] = useState("ALL");
  const [recipient, setRecipient] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<NotificationLogItem | null>(null);

  const eventsQuery = useEvents({ page: 1, limit: 100 });
  const events = useMemo(() => eventsQuery.data?.items ?? [], [eventsQuery.data?.items]);

  const filterParams = useMemo(
    () => ({
      page,
      limit: 20,
      ...(eventId !== "ALL" ? { eventId } : {}),
      ...(status !== "ALL" ? { status: status as NotificationStatus } : {}),
      ...(provider !== "ALL" ? { provider: provider as NotificationProvider } : {}),
      ...(recipientQuery ? { recipient: recipientQuery } : {}),
    }),
    [eventId, page, provider, recipientQuery, status],
  );

  const summaryQuery = useNotificationSummary({
    ...(eventId !== "ALL" ? { eventId } : {}),
  });
  const logsQuery = useNotificationLogs(filterParams);
  const templatesQuery = useNotificationTemplates({
    page: 1,
    limit: 100,
    ...(eventId !== "ALL" ? { eventId } : {}),
  });
  const retryLogMutation = useRetryNotificationLog();
  const retryFailedMutation = useRetryFailedNotifications();
  const templateActiveMutation = useSetNotificationTemplateActive();

  const summary = summaryQuery.data;
  const logs = logsQuery.data?.items ?? [];
  const templates = templatesQuery.data?.items ?? [];
  const totalPages = logsQuery.data?.totalPages ?? 1;
  const isFetching = summaryQuery.isFetching || logsQuery.isFetching || templatesQuery.isFetching;

  function refreshAll() {
    summaryQuery.refetch();
    logsQuery.refetch();
    templatesQuery.refetch();
  }

  function applyRecipientSearch() {
    setPage(1);
    setRecipientQuery(recipient.trim());
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        eyebrow="Notifications"
        title="مركز الإشعارات"
        description="مراقبة رسائل WhatsApp وسجل الإرسال والفشل والقوالب المستخدمة في الفعاليات."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => retryFailedMutation.mutate({ sinceMinutes: 1440, limit: 100 })}
              disabled={!summary?.recentFailedCount || retryFailedMutation.isPending}
              isLoading={retryFailedMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              إعادة الفاشلة
            </Button>
            <Button variant="outline" onClick={refreshAll} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        }
      />

      {summary?.alert ? (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 text-red-600" />
              <div>
                <p className="font-extrabold text-red-800">تنبيه: معدل فشل الإشعارات يحتاج مراجعة</p>
                <p className="mt-1 text-sm font-bold text-red-700/70">
                  يوجد {formatNumber(summary.recentFailedCount)} فشل خلال آخر {formatNumber(summary.windowHours)} ساعة، والحد التنبيهي الحالي {formatNumber(summary.failedThreshold)}.
                </p>
              </div>
            </div>
            <Button variant="danger" onClick={() => { setStatus("FAILED"); setPage(1); }}>
              عرض الفاشلة
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {summaryQuery.isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-[2rem] border border-black/10 bg-[#F8F8FF]">
          <Loader2 className="h-8 w-8 animate-spin text-[#A88042]" />
        </div>
      ) : summaryQuery.isError || !summary ? (
        <Card className="border-red-200 bg-red-50"><CardContent><p className="font-extrabold text-red-700">تعذر تحميل ملخص الإشعارات.</p></CardContent></Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="إجمالي الإشعارات" value={summary.total} icon={<BellRing />} />
          <MetricCard label="آخر 24 ساعة" value={summary.recentCount} icon={<Clock3 />} />
          <MetricCard label="تم التسليم" value={summary.statuses.delivered} icon={<CheckCircle2 />} tone="success" />
          <MetricCard label="بانتظار الإرسال" value={summary.statuses.pending} icon={<Send />} tone="gold" />
          <MetricCard label="فشل" value={summary.statuses.failed} icon={<XCircle />} tone={summary.statuses.failed > 0 ? "danger" : "success"} />
        </section>
      )}

      {summary ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-black/5 p-5 shadow-sm">
            <p className="text-xs font-bold text-[#4B4B4B]/55">نسبة التسليم</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">{formatPercent(summary.deliveryRate)}</p>
            <p className="mt-2 text-xs font-bold text-[#4B4B4B]/50">آخر تسليم: {formatDateTime(summary.latestDeliveredAt)}</p>
          </Card>
          <Card className="border-black/5 p-5 shadow-sm">
            <p className="text-xs font-bold text-[#4B4B4B]/55">نسبة الفشل</p>
            <p className={`mt-2 text-3xl font-extrabold ${summary.failureRate > 5 ? "text-red-600" : "text-[#4B4B4B]"}`}>{formatPercent(summary.failureRate)}</p>
            <p className="mt-2 text-xs font-bold text-[#4B4B4B]/50">آخر فشل: {formatDateTime(summary.latestFailureAt)}</p>
          </Card>
          <Card className="border-black/5 p-5 shadow-sm">
            <p className="text-xs font-bold text-[#4B4B4B]/55">مزود WhatsApp</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="gold">WaSender: {formatNumber(summary.providers.wasender)}</Badge>
              <Badge variant="muted">Meta: {formatNumber(summary.providers.metaCloud)}</Badge>
              <Badge variant="muted">Test: {formatNumber(summary.providers.fake)}</Badge>
            </div>
          </Card>
        </section>
      ) : null}

      <Card className="border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-5">
            <CardTitle>سجل الإرسال</CardTitle>
            <CardDescription>كل محاولات الإرسال وحالتها والفعالية والزائر المرتبط بها.</CardDescription>
          </div>

          <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_.7fr_.7fr_minmax(220px,1fr)_auto] xl:items-end">
            <Select
              label="الفعالية"
              value={eventId}
              onChange={(value) => { setEventId(value); setPage(1); }}
              options={[
                { label: "كل الفعاليات", value: "ALL" },
                ...events.map((event) => ({ label: event.titleAr || event.titleEn || event.id, value: event.id })),
              ]}
            />
            <Select
              label="الحالة"
              value={status}
              onChange={(value) => { setStatus(value); setPage(1); }}
              options={[
                { label: "كل الحالات", value: "ALL" },
                { label: "بانتظار الإرسال", value: "PENDING" },
                { label: "تم الإرسال", value: "SENT" },
                { label: "تم التسليم", value: "DELIVERED" },
                { label: "فشل", value: "FAILED" },
                { label: "ملغى", value: "CANCELLED" },
              ]}
            />
            <Select
              label="المزود"
              value={provider}
              onChange={(value) => { setProvider(value); setPage(1); }}
              options={[
                { label: "كل المزودين", value: "ALL" },
                { label: "WaSender", value: "WASENDER" },
                { label: "Meta Cloud", value: "META_CLOUD" },
                { label: "Test", value: "FAKE" },
              ]}
            />
            <Input
              label="رقم المستلم"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") applyRecipientSearch(); }}
              placeholder="+963..."
              icon={<Search className="h-4 w-4" />}
            />
            <Button variant="outline" onClick={applyRecipientSearch}><Search className="h-4 w-4" />بحث</Button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-black/5">
            {logsQuery.isLoading ? (
              <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#A88042]" /></div>
            ) : logs.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center text-sm font-bold text-[#4B4B4B]/55">لا توجد إشعارات مطابقة للفلاتر.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F8FF]">
                    <TableHead>الزائر / المستلم</TableHead>
                    <TableHead>الفعالية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المزود</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead className="text-center">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <p className="font-extrabold">{log.registration?.fullName || log.recipient}</p>
                        <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45" dir="ltr">{log.recipient}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate font-bold">{log.event?.titleAr || log.event?.titleEn || "عام"}</TableCell>
                      <TableCell><Badge variant={statusVariant(log.status)}>{statusLabel(log.status)}</Badge></TableCell>
                      <TableCell><span className="text-xs font-extrabold">{providerLabel(log.provider)}</span></TableCell>
                      <TableCell className="text-xs font-bold text-[#4B4B4B]/60">{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setSelectedLog(log)} title="التفاصيل"><Eye className="h-4 w-4" /></Button>
                          {log.status === "FAILED" ? (
                            <Button
                              size="icon"
                              variant="outline"
                              title="إعادة المحاولة"
                              onClick={() => retryLogMutation.mutate(log.id)}
                              disabled={retryLogMutation.isPending}
                            ><RotateCcw className="h-4 w-4" /></Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[#4B4B4B]/55">
              {formatNumber(logsQuery.data?.total)} إشعار · صفحة {formatNumber(page)} من {formatNumber(totalPages)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>السابق</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/5 shadow-sm">
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>قوالب الرسائل</CardTitle>
              <CardDescription>القوالب المستخدمة تلقائياً لإرسال QR وتذاكر التسجيل.</CardDescription>
            </div>
            <Badge variant="gold">{formatNumber(templatesQuery.data?.total)} قالب</Badge>
          </div>

          {templatesQuery.isLoading ? (
            <div className="flex min-h-36 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#A88042]" /></div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl bg-[#F8F8FF] p-6 text-center text-sm font-bold text-[#4B4B4B]/55">لا توجد قوالب لهذه الفعالية.</div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {templates.map((template) => {
                const event = events.find((item) => item.id === template.eventId);
                return (
                  <div key={template.id} className="rounded-3xl border border-black/5 bg-[#F8F8FF] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-[#4B4B4B]">{template.name}</p>
                          <Badge variant={template.isActive ? "success" : "muted"}>{template.isActive ? "فعال" : "معطل"}</Badge>
                        </div>
                        <p className="mt-2 text-xs font-bold text-[#4B4B4B]/50">{event?.titleAr || event?.titleEn || "قالب عام"} · {template.locale} · {template.channel}</p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-[#A88042]" />
                    </div>
                    <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-7 text-[#4B4B4B]/75">{template.content}</p>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant={template.isActive ? "outline" : "primary"}
                        isLoading={templateActiveMutation.isPending}
                        onClick={() => templateActiveMutation.mutate({ templateId: template.id, isActive: !template.isActive })}
                      >
                        <Settings2 className="h-4 w-4" />
                        {template.isActive ? "تعطيل" : "تفعيل"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="تفاصيل الإشعار"
        description="بيانات محاولة الإرسال والرسالة وأي خطأ صادر من المزود."
      >
        {selectedLog ? <LogDetails log={selectedLog} /> : null}
      </Modal>
    </div>
  );
}

function MetricCard({ label, value, icon, tone = "default" }: { label: string; value: number; icon: ReactNode; tone?: "default" | "success" | "danger" | "gold" }) {
  const iconClass = tone === "danger" ? "bg-red-50 text-red-600" : tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-[#A88042]/10 text-[#A88042]";
  return (
    <Card className="border-black/5 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold text-[#4B4B4B]/55">{label}</p><p className="mt-2 text-3xl font-extrabold text-[#4B4B4B]">{formatNumber(value)}</p></div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
      </div>
    </Card>
  );
}

function LogDetails({ log }: { log: NotificationLogItem }) {
  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="الحالة" value={statusLabel(log.status)} />
        <Detail label="المزود" value={providerLabel(log.provider)} />
        <Detail label="المستلم" value={log.recipient} ltr />
        <Detail label="الفعالية" value={log.event?.titleAr || log.event?.titleEn || "عام"} />
        <Detail label="الزائر" value={log.registration?.fullName || "—"} />
        <Detail label="وقت الإنشاء" value={formatDateTime(log.createdAt)} />
      </div>
      <div className="rounded-2xl border border-black/5 bg-[#F8F8FF] p-4">
        <p className="text-xs font-extrabold text-[#4B4B4B]/55">محتوى الرسالة</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#4B4B4B]">{log.content}</p>
      </div>
      {log.errorCode || log.errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-extrabold text-red-700"><AlertTriangle className="h-4 w-4" />{log.errorCode || "خطأ الإرسال"}</div>
          <p className="mt-2 text-sm leading-6 text-red-700/80">{log.errorMessage || "لا توجد تفاصيل إضافية."}</p>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div className="rounded-2xl bg-[#F8F8FF] p-4"><p className="text-xs font-bold text-[#4B4B4B]/50">{label}</p><p className="mt-1 font-extrabold text-[#4B4B4B]" dir={ltr ? "ltr" : undefined}>{value}</p></div>;
}
