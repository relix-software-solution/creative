"use client";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCheckpoints } from "@/features/checkpoints/checkpoints.queries";
import {
  useStaffAssignments,
} from "@/features/staff/staff.queries";
import { useStartStaffSession } from "@/features/staff-ops/staff-ops.queries";
import { StaffAssignment } from "@/features/staff/staff.types";
import { useAuthStore } from "@/stores/auth-store";
import { useDeviceStore } from "@/stores/device-store";

function getAssignmentTitle(assignment: StaffAssignment) {
  return (
    assignment.event?.titleAr ||
    assignment.event?.titleEn ||
    assignment.eventId ||
    "فعالية"
  );
}

function formatCheckpointName(checkpoint: {
  nameAr?: string;
  nameEn?: string | null;
  code?: string;
}) {
  return `${checkpoint.nameAr || checkpoint.nameEn || "نقطة مسح"}${
    checkpoint.code ? ` - ${checkpoint.code}` : ""
  }`;
}

export default function StaffSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const savedDeviceId = useDeviceStore((state) => state.deviceId);
  const savedEventId = useDeviceStore((state) => state.eventId);
  const savedCheckpointId = useDeviceStore((state) => state.checkpointId);
  const savedStaffSessionId = useDeviceStore((state) => state.staffSessionId);
  const setDeviceContext = useDeviceStore((state) => state.setDeviceContext);
  const clearDevice = useDeviceStore((state) => state.clearDevice);

  const [assignmentId, setAssignmentId] = useState("");
  const [checkpointId, setCheckpointId] = useState(savedCheckpointId ?? "");
  const [deviceId, setDeviceId] = useState(savedDeviceId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const assignmentsQuery = useStaffAssignments({ page: 1, limit: 50 });
  const startSessionMutation = useStartStaffSession();

  const assignments = useMemo(
    () => assignmentsQuery.data?.items ?? [],
    [assignmentsQuery.data?.items],
  );

  const selectedAssignment = useMemo(() => {
    if (assignmentId) {
      return assignments.find((assignment) => assignment.id === assignmentId);
    }

    if (savedEventId) {
      return assignments.find(
        (assignment) => assignment.eventId === savedEventId,
      );
    }

    return assignments[0];
  }, [assignmentId, assignments, savedEventId]);

  const activeEventId = selectedAssignment?.eventId || savedEventId || "";

  const checkpointsQuery = useCheckpoints({
    page: 1,
    limit: 100,
    eventId: activeEventId || undefined,
  });

  const checkpoints = checkpointsQuery.data?.items ?? [];

  const isConfigured = Boolean(
    savedDeviceId && savedEventId && savedCheckpointId && savedStaffSessionId,
  );

  function clearFieldError(key: string) {
    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function validateSetup() {
    const nextErrors: Record<string, string> = {};

    if (!selectedAssignment) {
      nextErrors.assignmentId = "اختر التكليف / المعرض";
    }

    if (!checkpointId) {
      nextErrors.checkpointId = "اختر نقطة المسح";
    }

    if (!deviceId.trim()) {
      nextErrors.deviceId = "Device ID مطلوب";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function startSetupSession() {
    if (!validateSetup()) return;

    if (!user?.id) {
      toast.error("تعذر تحديد حساب الموظف");
      return;
    }

    if (!selectedAssignment) return;

    const payload = {
      eventId: selectedAssignment.eventId,
      staffUserId: user.id,
      deviceId: deviceId.trim(),
      checkpointId,
    };

    startSessionMutation.mutate(payload, {
      onSuccess: (session) => {
        setDeviceContext({
          deviceId: payload.deviceId,
          eventId: payload.eventId,
          checkpointId: payload.checkpointId,
          staffSessionId: session.id,
        });

        toast.success("تم تجهيز الجهاز وبدء الجلسة");
        router.replace("/staff/scanner");
      },
    });
  }

  function resetDeviceSetup() {
    clearDevice();
    setAssignmentId("");
    setCheckpointId("");
    setDeviceId("");
    setErrors({});
    toast.success("تم مسح إعداد الجهاز");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,128,66,0.35),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.12),transparent_25%)]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#C59B55]">
                Staff Device Setup
              </p>

              <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">
                إعداد جهاز السكانر
              </h1>

              <p className="mt-2 text-sm font-bold leading-7 text-white/60">
                يتم تجهيز الجهاز مرة واحدة قبل التشغيل، بعدها صفحة السكانر تصبح
                للمسح فقط.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={isConfigured ? "success" : "warning"}>
                {isConfigured ? "الجهاز مجهز" : "غير مجهز"}
              </Badge>

              <Link href="/staff/scanner">
                <Button variant="secondary">
                  <ArrowRight className="h-4 w-4" />
                  الذهاب للسكانر
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {isConfigured ? (
        <Card>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>الجهاز جاهز للتشغيل</CardTitle>
                <CardDescription>
                  هذا الجهاز مربوط بجلسة نشطة ويمكن استخدام صفحة السكانر مباشرة.
                </CardDescription>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/45">Device ID</p>
                <p dir="ltr" className="mt-2 break-all text-sm font-extrabold">
                  {savedDeviceId}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/45">Event ID</p>
                <p dir="ltr" className="mt-2 break-all text-sm font-extrabold">
                  {savedEventId}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#F8F8FF] p-4">
                <p className="text-xs font-bold text-[#4B4B4B]/45">
                  Checkpoint ID
                </p>
                <p dir="ltr" className="mt-2 break-all text-sm font-extrabold">
                  {savedCheckpointId}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => router.replace("/staff/scanner")}
              >
                <ShieldCheck className="h-5 w-5" />
                فتح السكانر
              </Button>

              <Button
                className="flex-1"
                size="lg"
                variant="danger"
                onClick={resetDeviceSetup}
              >
                <Trash2 className="h-5 w-5" />
                إعادة إعداد الجهاز
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent>
          <div className="mb-6">
            <CardTitle>إعداد التشغيل</CardTitle>
            <CardDescription>
              اختر المعرض ونقطة المسح والصق Device ID الخاص بالجهاز.
            </CardDescription>
          </div>

          <div className="grid gap-4">
            <Select
              label="المعرض / التكليف"
              value={selectedAssignment?.id || assignmentId}
              placeholder={
                assignmentsQuery.isLoading
                  ? "جاري تحميل التكليفات..."
                  : "اختر المعرض"
              }
              disabled={assignmentsQuery.isLoading}
              error={errors.assignmentId}
              onChange={(value) => {
                setAssignmentId(value);
                setCheckpointId("");

                const assignment = assignments.find(
                  (item) => item.id === value,
                );

                setDeviceContext({
                  eventId: assignment?.eventId ?? null,
                  checkpointId: null,
                  staffSessionId: null,
                });

                clearFieldError("assignmentId");
              }}
              options={assignments
                .filter((assignment) => assignment.isActive !== false)
                .map((assignment) => ({
                  label: getAssignmentTitle(assignment),
                  value: assignment.id,
                }))}
            />

            <Select
              label="نقطة المسح"
              value={checkpointId}
              placeholder={
                !activeEventId
                  ? "اختر المعرض أولًا"
                  : checkpointsQuery.isLoading
                    ? "جاري تحميل نقاط المسح..."
                    : "اختر نقطة المسح"
              }
              disabled={!activeEventId || checkpointsQuery.isLoading}
              error={errors.checkpointId}
              onChange={(value) => {
                setCheckpointId(value);

                setDeviceContext({
                  checkpointId: value || null,
                  staffSessionId: null,
                });

                clearFieldError("checkpointId");
              }}
              options={checkpoints
                .filter((checkpoint) => checkpoint.isActive !== false)
                .map((checkpoint) => ({
                  label: formatCheckpointName(checkpoint),
                  value: checkpoint.id,
                }))}
            />

            <Input
              label="Device ID"
              value={deviceId}
              placeholder="ألصق Device ID الخاص بالجهاز"
              dir="ltr"
              icon={<Smartphone className="h-4 w-4" />}
              error={errors.deviceId}
              onChange={(event) => {
                setDeviceId(event.target.value);

                setDeviceContext({
                  deviceId: event.target.value || null,
                  staffSessionId: null,
                });

                clearFieldError("deviceId");
              }}
            />

            <div className="rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-4">
              <p className="text-sm font-extrabold text-[#4B4B4B]">
                ملاحظة تشغيلية
              </p>

              <p className="mt-1 text-xs font-bold leading-6 text-[#4B4B4B]/60">
                هذه الصفحة تُستخدم قبل بداية المعرض لتجهيز الجهاز. بعد الحفظ،
                صفحة السكانر ستكون مخصصة للمسح فقط.
              </p>
            </div>

            {assignmentsQuery.isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
                تعذر تحميل تكليفات هذا الموظف. تأكد أن الباك يسمح لحساب STAFF
                بقراءة تكليفاته.
              </div>
            ) : null}

            {checkpointsQuery.isError && activeEventId ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
                تعذر تحميل نقاط المسح. إذا ظهر 403 فهذا يعني أن الباك لا يسمح
                لحساب STAFF بقراءة Checkpoints.
              </div>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={startSessionMutation.isPending}
              onClick={startSetupSession}
            >
              {startSessionMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              حفظ الإعداد وبدء الجلسة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
