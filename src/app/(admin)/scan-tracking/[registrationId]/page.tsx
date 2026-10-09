"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  CircleX,
  DoorClosed,
  DoorOpen,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  ScanLine,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  VisitorPresenceState,
  VisitorScanTimelineItem,
  useVisitorScanTrackingDetail,
} from "@/features/scan-tracking/scan-tracking.queries";

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function movementMeta(type: string) {
  const map: Record<
    string,
    { label: string; icon: typeof DoorOpen; className: string }
  > = {
    ENTRY: {
      label: "دخول",
      icon: DoorOpen,
      className: "bg-emerald-50 text-emerald-700",
    },
    EXIT: {
      label: "خروج",
      icon: DoorClosed,
      className: "bg-sky-50 text-sky-700",
    },
    CHECKPOINT: {
      label: "نقطة عبور",
      icon: MapPin,
      className: "bg-violet-50 text-violet-700",
    },
    BOOTH_VISIT: {
      label: "زيارة جناح",
      icon: Users,
      className: "bg-fuchsia-50 text-fuchsia-700",
    },
    SESSION_ATTENDANCE: {
      label: "حضور جلسة",
      icon: BadgeCheck,
      className: "bg-amber-50 text-amber-700",
    },
    VIP_ACCESS: {
      label: "دخول VIP",
      icon: ShieldCheck,
      className: "bg-[#A88042]/10 text-[#8F6D37]",
    },
  };

  return (
    map[type] ?? {
      label: type,
      icon: ScanLine,
      className: "bg-zinc-50 text-zinc-700",
    }
  );
}

function resultMeta(result?: string | null) {
  if (result === "ALLOWED") {
    return {
      label: "مسموح",
      icon: CircleCheck,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (result === "DENIED") {
    return {
      label: "مرفوض",
      icon: CircleX,
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (result === "WARNING") {
    return {
      label: "تحذير",
      icon: CircleAlert,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "قيد المعالجة",
    icon: ScanLine,
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
}

function stateMeta(state: VisitorPresenceState) {
  if (state === "INSIDE") {
    return {
      label: "داخل الفعالية الآن",
      description: "آخر حركة دخول/خروج مسموحة كانت دخولاً.",
      icon: DoorOpen,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (state === "OUTSIDE") {
    return {
      label: "خارج الفعالية الآن",
      description: "آخر حركة دخول/خروج مسموحة كانت خروجاً.",
      icon: DoorClosed,
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  return {
    label: "لا توجد حركة دخول/خروج مسموحة",
    description: "قد توجد قراءات جلسات أو نقاط عبور، لكن لا يوجد دخول/خروج مسموح مسجل.",
    icon: CircleAlert,
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
}

function translateReason(reason?: string | null) {
  if (!reason || reason === "ALLOWED") return null;

  const reasons: Record<string, string> = {
    ALREADY_ENTERED: "الزائر مسجل كداخل مسبقاً ولا يسمح بإعادة الدخول بهذه الحالة.",
    ALREADY_EXITED: "تم تسجيل خروج سابق ولا تسمح قواعد الحركة الحالية بهذه العملية.",
    ATTENDEE_TYPE_NOT_ALLOWED: "نوع الحضور غير مسموح له باستخدام نقطة الدخول هذه.",
    CHECKPOINT_NOT_ALLOWED: "نقطة الدخول غير مسموحة لهذا الزائر أو لنوع حضوره.",
    WRONG_EVENT: "رمز QR مرتبط بفعالية مختلفة.",
    EVENT_MISMATCH: "رمز QR لا يطابق الفعالية الحالية.",
    QR_REVOKED: "تم إلغاء رمز QR لهذا التسجيل.",
    TOKEN_REVOKED: "تم إلغاء رمز الدخول.",
    QR_EXPIRED: "انتهت صلاحية رمز QR.",
    TOKEN_EXPIRED: "انتهت صلاحية رمز الدخول.",
    TOKEN_NOT_FOUND: "رمز الدخول غير موجود في النظام.",
    INVALID_SIGNATURE: "توقيع رمز QR غير صالح.",
    INVALID_QR: "رمز QR غير صالح أو غير قابل للتحقق.",
    REGISTRATION_INACTIVE: "التسجيل غير فعال حالياً.",
    REGISTRATION_BLOCKED: "التسجيل محظور.",
    REGISTRATION_CANCELLED: "تم إلغاء التسجيل.",
    OFFLINE_REGISTRATION_NOT_SYNCED: "التسجيل الأوفلاين لم تتم مزامنته بعد.",
    REENTRY_NOT_ALLOWED: "إعادة الدخول غير مسموحة لهذه الفعالية.",
    ENTRY_REQUIRED_BEFORE_EXIT: "لا يمكن تسجيل الخروج قبل وجود دخول مسموح.",
  };

  return reasons[reason] ?? reason.replaceAll("_", " ");
}

function checkpointName(item: VisitorScanTimelineItem) {
  return (
    item.checkpoint?.nameAr ||
    item.checkpoint?.nameEn ||
    item.checkpoint?.code ||
    "—"
  );
}

export default function VisitorScanTrackingDetailPage() {
  const params = useParams<{ registrationId: string }>();
  const searchParams = useSearchParams();
  const registrationId = params.registrationId;
  const eventId = searchParams.get("eventId") ?? undefined;

  const detailQuery = useVisitorScanTrackingDetail(registrationId, { eventId });
  const data = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#A88042]" />
          <p className="mt-3 text-sm font-black text-[#2F3137]/55">
            جاري تحميل مسار الزائر...
          </p>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !data) {
    return (
      <div className="space-y-5">
        <Link
          href="/scan-tracking"
          className="inline-flex items-center gap-2 text-sm font-black text-[#A88042]"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لتتبع الزوار
        </Link>
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center">
          <CircleAlert className="mx-auto h-9 w-9 text-red-600" />
          <p className="mt-4 text-lg font-black text-red-800">
            تعذر تحميل سجل هذا الزائر
          </p>
          <Button className="mt-5" variant="danger" onClick={() => detailQuery.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const { visitor, summary, timeline } = data;
  const state = stateMeta(summary.currentState);
  const StateIcon = state.icon;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/scan-tracking"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 text-xs font-black text-[#4B4B4B] transition hover:border-[#A88042]/40 hover:text-[#8F6D37]"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لتتبع الزوار
        </Link>

        <p className="text-xs font-bold text-[#2F3137]/40">
          آخر تحديث من سجل القراءات الخام
        </p>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_26px_75px_rgba(0,0,0,0.13)]">
        <div className="bg-[radial-gradient(circle_at_15%_10%,rgba(168,128,66,0.52),transparent_34%),linear-gradient(135deg,#050505,#171717)] p-6 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#D1A75F]">
                VISITOR JOURNEY
              </p>
              <h1 className="mt-2 text-3xl font-black lg:text-4xl">
                {visitor.fullName}
              </h1>
              <p className="mt-2 text-sm font-bold text-white/55">
                {visitor.event.titleAr || visitor.event.titleEn || "—"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <InfoPill icon={IdCard} text={visitor.publicId} />
                <InfoPill icon={Phone} text={visitor.phone || "بدون هاتف"} ltr />
                <InfoPill
                  icon={UserRound}
                  text={
                    visitor.attendeeType.nameAr ||
                    visitor.attendeeType.nameEn ||
                    visitor.attendeeType.code
                  }
                />
              </div>
            </div>

            <div className={`max-w-sm rounded-[1.5rem] border px-5 py-4 ${state.className}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70">
                  <StateIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black">{state.label}</p>
                  <p className="mt-1 text-[10px] font-bold leading-5 opacity-65">
                    {state.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="كل القراءات" value={summary.scanCount} icon={ScanLine} />
        <StatCard label="مسموح" value={summary.allowedCount} icon={CircleCheck} tone="success" />
        <StatCard label="مرفوض" value={summary.deniedCount} icon={CircleX} tone="danger" />
        <StatCard label="تحذير" value={summary.warningCount} icon={CircleAlert} tone="warning" />
        <StatCard label="دخول مسموح" value={summary.entryCount} icon={DoorOpen} />
        <StatCard label="خروج مسموح" value={summary.exitCount} icon={DoorClosed} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-black/[0.08] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.045)]">
            <h2 className="text-lg font-black text-[#2F3137]">بيانات الزائر</h2>
            <div className="mt-5 space-y-4">
              <DetailLine icon={UserRound} label="الاسم" value={visitor.fullName} />
              <DetailLine icon={Phone} label="الهاتف" value={visitor.phone || "—"} ltr />
              <DetailLine icon={Mail} label="البريد" value={visitor.email || "—"} ltr />
              <DetailLine icon={Users} label="الشركة" value={visitor.companyName || "—"} />
              <DetailLine icon={IdCard} label="المسمى الوظيفي" value={visitor.jobTitle || "—"} />
              <DetailLine
                icon={CalendarClock}
                label="وقت التسجيل"
                value={formatDateTime(visitor.registeredAt)}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/[0.08] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.045)]">
            <h2 className="text-lg font-black text-[#2F3137]">ملخص المسار</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <JourneyValue label="أول قراءة" value={formatDateTime(summary.firstSeenAt)} />
              <JourneyValue label="آخر قراءة" value={formatDateTime(summary.lastSeenAt)} />
            </div>
            <p className="mt-4 text-xs font-bold leading-6 text-[#2F3137]/45">
              الحالة الحالية لا تُحسب من عدد عمليات الدخول ناقص الخروج؛ بل من آخر
              حركة <strong className="text-[#2F3137]/70">دخول أو خروج مسموحة</strong>
              ، حتى تبقى النتيجة صحيحة مع إعادة الدخول والقراءات المرفوضة.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.045)]">
          <div className="border-b border-black/[0.06] p-5 lg:p-6">
            <h2 className="text-xl font-black text-[#2F3137]">المسار التفصيلي</h2>
            <p className="mt-1 text-xs font-bold text-[#2F3137]/45">
              كل قراءة مرتبة من الأحدث إلى الأقدم مع نتيجتها والبوابة والجهاز والموظف.
            </p>
          </div>

          {timeline.length === 0 ? (
            <div className="p-10 text-center">
              <ScanLine className="mx-auto h-9 w-9 text-[#A88042]" />
              <p className="mt-4 text-sm font-black text-[#2F3137]">
                لا توجد قراءات ضمن هذا السجل
              </p>
            </div>
          ) : (
            <div className="p-4 lg:p-6">
              <div className="relative space-y-4 before:absolute before:right-[23px] before:top-7 before:bottom-7 before:w-px before:bg-black/[0.08]">
                {timeline.map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  text,
  ltr = false,
}: {
  icon: typeof IdCard;
  text: string;
  ltr?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-[11px] font-black text-white/70">
      <Icon className="h-3.5 w-3.5 text-[#D1A75F]" />
      <span dir={ltr ? "ltr" : undefined}>{text}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof ScanLine;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "danger"
        ? "bg-red-50 text-red-700"
        : tone === "warning"
          ? "bg-amber-50 text-amber-700"
          : "bg-[#A88042]/10 text-[#A88042]";

  return (
    <div className="rounded-[1.6rem] border border-black/[0.08] bg-white p-4 shadow-[0_16px_45px_rgba(0,0,0,0.035)]">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-4 text-2xl font-black text-[#2F3137]">
        {value.toLocaleString("ar-SY")}
      </p>
      <p className="mt-1 text-[10px] font-black text-[#2F3137]/42">{label}</p>
    </div>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F8FF] text-[#A88042]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-[#2F3137]/38">{label}</p>
        <p
          dir={ltr ? "ltr" : undefined}
          className={`mt-1 break-words text-sm font-black text-[#2F3137]/78 ${ltr ? "text-right" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function JourneyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F8FF] p-4">
      <p className="text-[10px] font-black text-[#2F3137]/38">{label}</p>
      <p className="mt-2 text-xs font-black leading-5 text-[#2F3137]/75">{value}</p>
    </div>
  );
}

function TimelineItem({ item }: { item: VisitorScanTimelineItem }) {
  const movement = movementMeta(item.type);
  const result = resultMeta(item.result);
  const MovementIcon = movement.icon;
  const ResultIcon = result.icon;
  const reason = translateReason(item.reason);

  return (
    <article className="relative pr-14">
      <div className={`absolute right-0 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white ${movement.className}`}>
        <MovementIcon className="h-5 w-5" />
      </div>

      <div className="rounded-[1.5rem] border border-black/[0.07] bg-[#FCFCFF] p-4 transition hover:border-[#A88042]/20 hover:bg-white hover:shadow-md lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${movement.className}`}>
                {movement.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-black ${result.className}`}>
                <ResultIcon className="h-3.5 w-3.5" />
                {result.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-black text-[#2F3137]">
              {checkpointName(item)}
            </p>
          </div>

          <div className="text-right sm:text-left">
            <p className="text-xs font-black text-[#2F3137]/70">
              {formatDateTime(item.scannedAtDevice)}
            </p>
            <p className="mt-1 text-[9px] font-bold text-[#2F3137]/35">
              استلام السيرفر: {formatDateTime(item.receivedAtServer)}
            </p>
          </div>
        </div>

        {reason && item.result !== "ALLOWED" ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-3">
            <p className="text-[10px] font-black text-red-500">سبب عدم السماح</p>
            <p className="mt-1 text-xs font-bold leading-6 text-red-800/75">
              {reason}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 text-[10px] font-bold text-[#2F3137]/50 sm:grid-cols-3">
          <MetaItem
            icon={MonitorSmartphone}
            label="الجهاز"
            value={item.device?.name || item.device?.code || "—"}
          />
          <MetaItem
            icon={UserRound}
            label="الموظف"
            value={item.staffSession?.staffUser?.fullName || "—"}
          />
          <MetaItem
            icon={ShieldCheck}
            label="المعالجة"
            value={item.status || "—"}
          />
        </div>
      </div>
    </article>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MonitorSmartphone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#A88042]" />
      <div className="min-w-0">
        <p className="text-[9px] text-[#2F3137]/35">{label}</p>
        <p className="mt-0.5 truncate text-[10px] font-black text-[#2F3137]/65">{value}</p>
      </div>
    </div>
  );
}
