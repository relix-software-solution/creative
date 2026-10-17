"use client";

import { AlertTriangle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StaffVisitorReviewItem } from "@/lib/offline/staff-scanner-db";

function humanizeError(item: StaffVisitorReviewItem) {
  if (item.kind === "SYNCED_MISMATCH") {
    return "العملية معلّمة كمرفوعة، لكن القيم التي أكدها السيرفر لا تطابق التعديل المحلي المحفوظ. تحتاج إعادة تطبيق آمنة أو مراجعة يدوية.";
  }

  const message = item.update.errorMessage || "خطأ غير معروف";

  if (message.includes("qualification has an invalid option")) {
    return "قيمة حقل المؤهل غير موجودة ضمن الخيارات المسموحة للفعالية.";
  }

  if (message.includes("Duplicate registration for this event")) {
    return "يوجد تسجيل آخر لنفس الزائر في نفس الفعالية، لذلك رفض السيرفر التعديل.";
  }

  if (item.update.errorCode === "HTTP_409") {
    return "يوجد تعارض في بيانات هذا التسجيل ويحتاج مراجعة يدوية.";
  }

  if (item.update.errorCode === "HTTP_400") {
    return `السيرفر رفض البيانات: ${message}`;
  }

  return message;
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    fullName: "الاسم",
    phone: "الهاتف",
    email: "البريد",
    companyName: "الشركة",
    jobTitle: "المسمى الوظيفي",
    notes: "الملاحظات",
  };

  if (labels[field]) return labels[field];
  if (field.startsWith("customFields.")) return field.slice("customFields.".length);
  return field;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function StaffVisitorReviewModal({
  open,
  items,
  loading,
  repairingOperationId,
  onClose,
  onRefresh,
  onReview,
  onRepair,
}: {
  open: boolean;
  items: StaffVisitorReviewItem[];
  loading: boolean;
  repairingOperationId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onReview: (item: StaffVisitorReviewItem) => void;
  onRepair: (item: StaffVisitorReviewItem) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" dir="rtl">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 p-5">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-extrabold text-[#2F3137]">
                الحالات التي تحتاج مراجعة
              </h2>
            </div>
            <p className="mt-1 text-xs font-bold leading-6 text-[#2F3137]/60">
              تعرض القائمة الفشل الحقيقي وأي عملية تبدو مرفوعة لكن رد السيرفر لا يطابق القيم المحلية. لا يتم حذف أي تعديل محلي من هذه الشاشة.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#2F3137]/60 hover:bg-black/5"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3">
          <span className="text-sm font-extrabold text-red-700">
            {items.length} حالة تحتاج تحقق
          </span>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث القائمة
          </Button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-[#2F3137]/60">
              جاري تحميل الحالات...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-extrabold text-emerald-800">
              لا توجد تعديلات زوار تحتاج مراجعة.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const changes = item.update.changes ?? {};
                const customFields =
                  (changes.customFields as Record<string, unknown> | undefined) ?? {};
                const name =
                  changes.fullName || item.visitor?.fullName || item.update.registrationId;
                const phone = changes.phone ?? item.visitor?.phone ?? null;
                const integrityIssue = item.kind === "SYNCED_MISMATCH";
                const repairing = repairingOperationId === item.update.operationId;

                return (
                  <article
                    key={item.update.operationId}
                    className={`rounded-2xl border p-4 ${
                      integrityIssue
                        ? "border-amber-300 bg-amber-50/60"
                        : "border-red-200 bg-red-50/40"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#2F3137]">
                            {name}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${
                              integrityIssue
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {integrityIssue ? "اختلاف بعد الرفع" : "فشل رفع"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#2F3137]/55">
                          {phone ? `الهاتف المحفوظ محليًا: ${phone}` : "لا يوجد هاتف في التعديل المحلي"}
                        </p>
                        <p className="mt-1 break-all text-[11px] font-bold text-[#2F3137]/45">
                          ID: {item.update.registrationId}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {integrityIssue && item.repairChanges ? (
                          <Button
                            onClick={() => onRepair(item)}
                            disabled={Boolean(repairingOperationId)}
                          >
                            {repairing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                            إعادة تطبيق الآمن
                          </Button>
                        ) : null}

                        <Button variant="outline" onClick={() => onReview(item)}>
                          مراجعة وتعديل
                        </Button>
                      </div>
                    </div>

                    <div
                      className={`mt-4 rounded-xl border bg-white p-3 ${
                        integrityIssue ? "border-amber-200" : "border-red-200"
                      }`}
                    >
                      <p
                        className={`text-xs font-extrabold ${
                          integrityIssue ? "text-amber-700" : "text-red-700"
                        }`}
                      >
                        {integrityIssue ? "سبب المراجعة" : "سبب الفشل"}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#2F3137]">
                        {humanizeError(item)}
                      </p>
                      {!integrityIssue ? (
                        <p className="mt-1 text-[11px] font-bold text-[#2F3137]/45">
                          {item.update.errorCode || "NO_CODE"} — {item.update.errorMessage || "بدون رسالة"}
                        </p>
                      ) : null}
                    </div>

                    {integrityIssue && item.mismatches.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-extrabold text-[#2F3137]/70">
                          الاختلاف بين التعديل المحلي ورد السيرفر
                        </p>
                        <div className="space-y-2">
                          {item.mismatches.map((mismatch) => (
                            <div
                              key={mismatch.field}
                              className="grid gap-2 rounded-xl border border-amber-200 bg-white p-3 sm:grid-cols-[150px_1fr_1fr]"
                            >
                              <div className="text-xs font-extrabold text-[#2F3137]">
                                {fieldLabel(mismatch.field)}
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-emerald-700">المحفوظ محليًا</div>
                                <div className="mt-1 break-words text-xs font-extrabold text-[#2F3137]">
                                  {displayValue(mismatch.localValue)}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-red-700">رد السيرفر</div>
                                <div className="mt-1 break-words text-xs font-extrabold text-[#2F3137]">
                                  {displayValue(mismatch.serverValue)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <p className="mb-2 text-xs font-extrabold text-[#2F3137]/70">
                        البيانات المحلية المقصودة
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {changes.fullName !== undefined ? (
                          <div className="rounded-xl border border-black/10 bg-white p-3">
                            <div className="text-[11px] font-bold text-[#2F3137]/45">الاسم</div>
                            <div className="mt-1 break-words text-xs font-extrabold text-[#2F3137]">
                              {displayValue(changes.fullName)}
                            </div>
                          </div>
                        ) : null}

                        {changes.phone !== undefined ? (
                          <div className="rounded-xl border border-black/10 bg-white p-3">
                            <div className="text-[11px] font-bold text-[#2F3137]/45">الهاتف</div>
                            <div className="mt-1 break-words text-xs font-extrabold text-[#2F3137]">
                              {displayValue(changes.phone)}
                            </div>
                          </div>
                        ) : null}

                        {Object.entries(customFields).map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-black/10 bg-white p-3"
                          >
                            <div className="break-all text-[11px] font-bold text-[#2F3137]/45">
                              {key}
                            </div>
                            <div className="mt-1 break-words text-xs font-extrabold text-[#2F3137]">
                              {displayValue(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
