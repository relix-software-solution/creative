"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  Camera,
  CheckCircle2,
  Clipboard,
  Loader2,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateScan } from "@/features/scans/scans.queries";
import {
  CreateScanPayload,
  ScanResult,
  ScanType,
} from "@/features/scans/scans.types";
import {
  useMyStaffAssignment,
  useStartMyStaffSession,
} from "@/features/staff/staff.queries";
import { StaffAssignment, StaffSession } from "@/features/staff/staff.types";
import {
  addScanToQueue,
  getPendingScansCount,
} from "@/lib/offline/staff-scanner-db";
import { useDeviceStore } from "@/stores/device-store";

type ScannerControls = {
  stop: () => void;
};

type VisitorInfo = {
  fullName: string;
  phone: string;
  email: string;
  companyName: string;
  jobTitle: string;
  publicId: string;
  status: string;
  attendeeType: string;
};

function createOperationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `staff-scan-${crypto.randomUUID()}`;
  }

  return `staff-scan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractQrToken(decodedValue: string) {
  const value = decodedValue.trim();

  if (!value) return "";

  try {
    const url = new URL(value);

    const queryKeys = ["qrToken", "token", "code", "qr", "t"];

    for (const key of queryKeys) {
      const queryValue = url.searchParams.get(key);

      if (queryValue?.trim()) {
        return queryValue.trim();
      }
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];

    return lastPart?.trim() || value;
  } catch {
    return value;
  }
}

function getEventTitle(assignment?: StaffAssignment | null) {
  return (
    assignment?.event?.titleAr ||
    assignment?.event?.titleEn ||
    assignment?.eventId ||
    "الفعالية"
  );
}

function getCheckpointName(assignment?: StaffAssignment | null) {
  return (
    assignment?.checkpoint?.nameAr ||
    assignment?.checkpoint?.nameEn ||
    assignment?.checkpoint?.code ||
    "نقطة المسح"
  );
}

function getDeviceLabel(assignment?: StaffAssignment | null) {
  return (
    assignment?.device?.name ||
    assignment?.device?.code ||
    assignment?.deviceId ||
    "جهاز السكانر"
  );
}

function getDeviceApiKey(assignment?: StaffAssignment | null) {
  const device = assignment?.device as
    | {
        rawApiKey?: string | null;
        deviceApiKey?: string | null;
        apiKey?: string | null;
      }
    | null
    | undefined;

  return device?.rawApiKey || device?.deviceApiKey || device?.apiKey || null;
}

function getDefaultScanType(assignment?: StaffAssignment | null): ScanType {
  if (assignment?.checkpoint?.type === "EXIT") return "EXIT";
  return "ENTRY";
}

function isAllowedResult(result?: ScanResult | null) {
  if (!result) return false;

  return (
    result.allowed === true ||
    result.success === true ||
    result.decision === "ALLOWED" ||
    result.status === "ALLOWED" ||
    result.scanEvent?.status === "ALLOWED"
  );
}

function getResultMessage(result?: ScanResult | null) {
  if (!result) return "";

  if (result.message) return result.message;
  if (result.reason) return result.reason;
  if (result.scanEvent?.reason) return result.scanEvent.reason;

  return isAllowedResult(result) ? "تم السماح بالدخول" : "تم رفض الدخول";
}

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .replace(/[\s_\-.]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
}

function getDeepStringValue(
  source: unknown,
  acceptedKeys: string[],
  depth = 0,
): string {
  if (!source || depth > 6) return "";

  const normalizedAcceptedKeys = acceptedKeys.map(normalizeKey);

  if (Array.isArray(source)) {
    for (const item of source) {
      const value = getDeepStringValue(item, acceptedKeys, depth + 1);
      if (value) return value;
    }

    return "";
  }

  if (typeof source !== "object") return "";

  const record = source as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (
      normalizedAcceptedKeys.includes(normalizeKey(key)) &&
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nestedValue = getDeepStringValue(value, acceptedKeys, depth + 1);

      if (nestedValue) return nestedValue;
    }
  }

  return "";
}

function getRegistrationCandidate(result?: ScanResult | null) {
  if (!result) return null;

  return (
    result.registration ||
    result.attendee ||
    result.visitor ||
    result.data?.registration ||
    result.data?.attendee ||
    result.data?.visitor ||
    null
  );
}

function getVisitorInfo(result?: ScanResult | null): VisitorInfo {
  const registration = getRegistrationCandidate(result);

  const attendeeType =
    registration?.attendeeType?.nameAr ||
    registration?.attendeeType?.nameEn ||
    registration?.attendeeType?.code ||
    getDeepStringValue(result, ["attendeeTypeName", "attendeeType", "type"]);

  return {
    fullName:
      getDeepStringValue(result, [
        "fullName",
        "name",
        "visitorName",
        "attendeeName",
        "الاسم",
        "اسم الزائر",
      ]) || "—",

    phone:
      getDeepStringValue(result, [
        "phone",
        "mobile",
        "phoneNumber",
        "رقم الهاتف",
        "الهاتف",
      ]) || "—",

    email:
      getDeepStringValue(result, [
        "email",
        "mail",
        "البريد",
        "البريد الإلكتروني",
      ]) || "—",

    companyName:
      getDeepStringValue(result, [
        "companyName",
        "company",
        "organization",
        "organizationName",
        "company_name",
        "companyAr",
        "companyEn",
        "الشركة",
        "اسم الشركة",
      ]) || "—",

    jobTitle:
      getDeepStringValue(result, [
        "jobTitle",
        "job",
        "position",
        "title",
        "job_title",
        "roleTitle",
        "المسمى الوظيفي",
        "الوظيفة",
        "المنصب",
      ]) || "—",

    publicId:
      getDeepStringValue(result, [
        "publicId",
        "registrationNumber",
        "code",
        "registrationCode",
        "رقم التسجيل",
      ]) || "—",

    status:
      getDeepStringValue(result, ["status", "registrationStatus", "الحالة"]) ||
      "—",

    attendeeType: attendeeType || "—",
  };
}

function formatDateTime(value?: string | null) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("ar-SY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getResultTime(result?: ScanResult | null) {
  return (
    result?.scanEvent?.createdAt ||
    result?.scanEvent?.scannedAtDevice ||
    result?.movement?.createdAt ||
    new Date().toISOString()
  );
}

export default function StaffScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const startedSessionRef = useRef(false);
  const isProcessingScanRef = useRef(false);

  const setScannerContext = useDeviceStore((state) => state.setScannerContext);

  const assignmentId = useDeviceStore((state) => state.assignmentId);
  const eventId = useDeviceStore((state) => state.eventId);
  const eventTitle = useDeviceStore((state) => state.eventTitle);
  const checkpointId = useDeviceStore((state) => state.checkpointId);
  const checkpointName = useDeviceStore((state) => state.checkpointName);
  const checkpointType = useDeviceStore((state) => state.checkpointType);
  const deviceId = useDeviceStore((state) => state.deviceId);
  const deviceName = useDeviceStore((state) => state.deviceName);
  const deviceCode = useDeviceStore((state) => state.deviceCode);
  const deviceApiKey = useDeviceStore((state) => state.deviceApiKey);
  const staffSessionId = useDeviceStore((state) => state.staffSessionId);

  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [scanType, setScanType] = useState<ScanType>("ENTRY");

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastOfflineSaved, setLastOfflineSaved] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualError, setManualError] = useState("");

  const assignmentQuery = useMyStaffAssignment();
  const startMySessionMutation = useStartMyStaffSession();
  const createScanMutation = useCreateScan();

  const assignment = assignmentQuery.data ?? null;

  const activeContext = useMemo(() => {
    return {
      eventId: staffSession?.eventId || eventId || "",
      checkpointId: staffSession?.checkpointId || checkpointId || "",
      deviceId: staffSession?.deviceId || deviceId || "",
      staffSessionId: staffSession?.id || staffSessionId || "",
      eventTitle: eventTitle || getEventTitle(assignment),
      checkpointName: checkpointName || getCheckpointName(assignment),
      checkpointType: checkpointType || assignment?.checkpoint?.type || null,
      deviceLabel: deviceName || deviceCode || getDeviceLabel(assignment),
    };
  }, [
    assignment,
    staffSession,
    eventId,
    checkpointId,
    deviceId,
    staffSessionId,
    eventTitle,
    checkpointName,
    checkpointType,
    deviceName,
    deviceCode,
  ]);

  const isReady = Boolean(
    activeContext.eventId &&
    activeContext.checkpointId &&
    activeContext.deviceId &&
    activeContext.staffSessionId,
  );

  const isSubmitting = createScanMutation.isPending;
  const allowed = isAllowedResult(scanResult);
  const visitor = getVisitorInfo(scanResult);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!assignment) return;

    setScannerContext({
      assignmentId: assignment.id,
      eventId: assignment.eventId,
      eventTitle: getEventTitle(assignment),
      checkpointId: assignment.checkpointId,
      checkpointName: getCheckpointName(assignment),
      checkpointType: assignment.checkpoint?.type ?? null,
      deviceId: assignment.deviceId,
      deviceName: assignment.device?.name ?? null,
      deviceCode: assignment.device?.code ?? null,
      deviceApiKey: getDeviceApiKey(assignment),
      staffSessionId: null,
    });

    setScanType(getDefaultScanType(assignment));
  }, [assignment, setScannerContext]);

  useEffect(() => {
    if (!assignment) return;
    if (startedSessionRef.current) return;

    startedSessionRef.current = true;

    startMySessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setStaffSession(session);

        setScannerContext({
          staffSessionId: session.id,
          eventId: session.eventId || assignment.eventId,
          checkpointId: session.checkpointId || assignment.checkpointId,
          deviceId: session.deviceId || assignment.deviceId,
        });
      },

      onError: () => {
        startedSessionRef.current = false;
      },
    });
  }, [assignment, setScannerContext, startMySessionMutation]);

  async function refreshPendingCount() {
    const count = await getPendingScansCount();
    setPendingCount(count);
  }

  function clearResult() {
    setScanResult(null);
    setLastOfflineSaved(false);
    setManualError("");
    setCameraError("");
    setQrToken("");
    isProcessingScanRef.current = false;
  }

  function validateScan(token: string) {
    if (!isReady) {
      setManualError("جاري تجهيز جلسة السكانر، حاول بعد لحظات.");
      return false;
    }

    if (!token.trim()) {
      setManualError("QR Token مطلوب");
      return false;
    }

    setManualError("");
    return true;
  }

  function buildPayload(token: string): CreateScanPayload {
    return {
      operationId: createOperationId(),
      eventId: activeContext.eventId,
      deviceId: activeContext.deviceId,
      staffSessionId: activeContext.staffSessionId,
      checkpointId: activeContext.checkpointId,
      qrToken: token.trim(),
      type: scanType,
      scannedAtDevice: new Date().toISOString(),
      payload: {
        source: deviceApiKey ? "staff-device-scanner" : "staff-jwt-scanner",
        mode: isOnline ? "online" : "offline",
        assignmentId,
      },
    };
  }

  async function submitPayload(payload: CreateScanPayload) {
    if (!isOnline) {
      await addScanToQueue(payload);
      await refreshPendingCount();

      setLastOfflineSaved(true);
      setScanResult(null);
      setQrToken("");
      isProcessingScanRef.current = false;

      toast.warning("تم حفظ العملية محليًا لعدم وجود اتصال");
      return;
    }

    createScanMutation.mutate(
      {
        payload,
        deviceApiKey,
      },
      {
        onSuccess: (data) => {
          setScanResult(data);
          setLastOfflineSaved(false);
          setQrToken("");
          isProcessingScanRef.current = false;

          if (isAllowedResult(data)) {
            toast.success("تم السماح بالدخول");
          } else {
            toast.error(getResultMessage(data));
          }

          if ("vibrate" in navigator) {
            navigator.vibrate?.(isAllowedResult(data) ? 120 : [120, 80, 120]);
          }
        },

        onError: async () => {
          await addScanToQueue(payload);
          await refreshPendingCount();

          setScanResult(null);
          setLastOfflineSaved(true);
          setQrToken("");
          isProcessingScanRef.current = false;
        },
      },
    );
  }

  async function handleDecodedQr(decodedText: string) {
    const token = extractQrToken(decodedText);

    if (!token) return;
    if (isProcessingScanRef.current) return;

    isProcessingScanRef.current = true;

    if (!validateScan(token)) {
      isProcessingScanRef.current = false;
      return;
    }

    await stopCamera();
    await submitPayload(buildPayload(token));
  }

  async function submitManualScan(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const token = extractQrToken(qrToken);

    if (!validateScan(token)) return;

    setScanResult(null);
    setLastOfflineSaved(false);
    isProcessingScanRef.current = true;

    await submitPayload(buildPayload(token));
  }

  async function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setIsCameraStarting(false);
  }

  async function startCamera() {
    setCameraError("");
    setManualError("");
    setScanResult(null);
    setLastOfflineSaved(false);
    isProcessingScanRef.current = false;

    if (!isReady) {
      setCameraError("جاري تجهيز جلسة السكانر، انتظر لحظات ثم حاول مجددًا.");
      return;
    }

    if (!window.isSecureContext) {
      setCameraError(
        "الكاميرا تحتاج HTTPS على الجوال. افتح الصفحة من رابط Cloudflare HTTPS.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("المتصفح لا يدعم تشغيل الكاميرا.");
      return;
    }

    try {
      setIsCameraStarting(true);
      setIsCameraOpen(true);

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 150);
      });

      const video = videoRef.current;

      if (!video) {
        throw new Error("Video element is not ready");
      }

      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        video,
        (result) => {
          const text = result?.getText();

          if (!text) return;

          handleDecodedQr(text);
        },
      );

      controlsRef.current = controls;
      setIsCameraStarting(false);
      toast.success("تم تشغيل الكاميرا");
    } catch {
      await stopCamera();

      setCameraError(
        "تعذر تشغيل الكاميرا. تأكد أنك أعطيت إذن الكاميرا وأن الرابط HTTPS.",
      );
    }
  }

  async function pasteFromClipboard() {
    try {
      const value = await navigator.clipboard.readText();

      if (!value.trim()) return;

      setQrToken(value.trim());
      setManualError("");
      toast.success("تم لصق QR Token");
    } catch {
      setManualError("تعذر قراءة الحافظة");
    }
  }

  async function startNewScan() {
    clearResult();
    await startCamera();
  }

  if (assignmentQuery.isLoading || startMySessionMutation.isPending) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#A88042]" />

          <h1 className="mt-5 text-2xl font-extrabold text-[#4B4B4B]">
            جاري تجهيز السكانر
          </h1>

          <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
            يتم تحميل تكليفك وبدء جلسة المسح تلقائيًا.
          </p>
        </div>
      </div>
    );
  }

  if (assignmentQuery.isError) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-100 text-red-700">
            <XCircle className="h-11 w-11" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-[#4B4B4B]">
            لا يوجد تكليف فعال
          </h1>

          <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
            يرجى مراجعة المشرف لتفعيل تكليف السكانر لهذا الحساب.
          </p>

          <Button
            className="mt-6 w-full"
            onClick={() => assignmentQuery.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-10 sm:px-5 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
        <div className="bg-[radial-gradient(circle_at_20%_20%,rgba(197,155,85,0.35),transparent_35%),linear-gradient(135deg,#050505,#171717)] p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#C59B55]">
                Staff Scanner
              </p>

              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                امسح QR الزائر
              </h1>

              <p className="mt-3 text-sm font-bold leading-7 text-white/60">
                {activeContext.eventTitle} — {activeContext.checkpointName}
              </p>

              <p className="mt-1 text-xs font-bold text-white/45">
                {activeContext.deviceLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <Badge variant={isOnline ? "success" : "warning"}>
                {isOnline ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                {isOnline ? "متصل" : "Offline"}
              </Badge>

              <Badge variant={isReady ? "success" : "warning"}>
                {isReady ? "جاهز للمسح" : "تجهيز..."}
              </Badge>

              <Badge variant={pendingCount > 0 ? "warning" : "success"}>
                Pending: {pendingCount}
              </Badge>

              <Badge variant="gold">{scanType}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#4B4B4B]">
                  الكاميرا
                </h2>

                <p className="mt-1 text-sm font-bold text-[#4B4B4B]/55">
                  اضغط تشغيل الكاميرا ووجّهها نحو QR.
                </p>
              </div>

              <Button variant="outline" onClick={refreshPendingCount}>
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>

            {cameraError ? (
              <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : null}

            {isCameraOpen ? (
              <div className="relative mb-5 overflow-hidden rounded-[2rem] bg-black p-3">
                <video
                  ref={videoRef}
                  className="h-[58vh] max-h-[560px] min-h-[360px] w-full rounded-[1.5rem] object-cover"
                  playsInline
                  muted
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-64 w-64 rounded-[2rem] border-4 border-[#C59B55] shadow-[0_0_0_999px_rgba(0,0,0,0.42)]" />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-5 py-2 text-sm font-extrabold text-white">
                  وجّه الكاميرا نحو QR
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={!isReady || isCameraStarting || isSubmitting}
                className="mb-5 flex min-h-[380px] w-full items-center justify-center rounded-[2rem] border-2 border-dashed border-[#A88042]/30 bg-[#F8F8FF] transition hover:bg-[#A88042]/5 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[460px]"
              >
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-black text-[#C59B55] shadow-xl">
                    {isCameraStarting || isSubmitting ? (
                      <Loader2 className="h-12 w-12 animate-spin" />
                    ) : (
                      <QrCode className="h-14 w-14" />
                    )}
                  </div>

                  <p className="text-3xl font-extrabold text-[#4B4B4B]">
                    تشغيل الكاميرا
                  </p>

                  <p className="mt-3 text-sm font-bold text-[#4B4B4B]/55">
                    اضغط هنا لبدء قراءة QR
                  </p>
                </div>
              </button>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                disabled={!isReady || isCameraStarting || isSubmitting}
                onClick={isCameraOpen ? stopCamera : startCamera}
                variant={isCameraOpen ? "danger" : "secondary"}
              >
                <Camera className="h-5 w-5" />
                {isCameraOpen ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
              </Button>

              <Button size="lg" variant="outline" onClick={startNewScan}>
                <RefreshCw className="h-5 w-5" />
                Scan جديد
              </Button>
            </div>
          </div>

          <form
            className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-6"
            onSubmit={submitManualScan}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#4B4B4B]">
                  إدخال يدوي
                </h3>

                <p className="mt-1 text-xs font-bold text-[#4B4B4B]/45">
                  استخدمه فقط إذا الكاميرا لم تعمل.
                </p>
              </div>

              <span className="rounded-full bg-[#A88042]/10 px-3 py-1 text-xs font-extrabold text-[#A88042]">
                Backup
              </span>
            </div>

            <textarea
              value={qrToken}
              onChange={(event) => {
                setQrToken(event.target.value);
                setManualError("");
              }}
              placeholder="الصق QR Token هنا..."
              dir="ltr"
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/10 bg-[#F8F8FF] px-4 py-3 text-left text-sm font-bold outline-none transition focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
            />

            {manualError ? (
              <p className="mt-2 text-sm font-bold text-red-600">
                {manualError}
              </p>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={pasteFromClipboard}
              >
                <Clipboard className="h-4 w-4" />
                لصق
              </Button>

              <Button type="submit" disabled={isSubmitting || !isReady}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
                تنفيذ يدوي
              </Button>
            </div>
          </form>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
            {!scanResult && !lastOfflineSaved ? (
              <div className="flex min-h-[620px] items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#A88042]/10 text-[#A88042]">
                    <ScanLine className="h-12 w-12" />
                  </div>

                  <h2 className="mt-5 text-2xl font-extrabold text-[#4B4B4B]">
                    بانتظار أول Scan
                  </h2>

                  <p className="mt-3 text-sm font-bold leading-7 text-[#4B4B4B]/55">
                    بعد قراءة QR ستظهر بيانات الزائر هنا بشكل واضح.
                  </p>
                </div>
              </div>
            ) : lastOfflineSaved ? (
              <div className="p-5">
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center">
                  <WifiOff className="mx-auto h-14 w-14 text-amber-700" />

                  <h2 className="mt-4 text-3xl font-extrabold text-amber-800">
                    محفوظ محليًا
                  </h2>

                  <p className="mt-3 text-sm font-bold leading-7 text-amber-800/70">
                    سيتم إرسال العملية عند عودة الاتصال والمزامنة.
                  </p>

                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={startNewScan}
                  >
                    <RefreshCw className="h-5 w-5" />
                    Scan جديد
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={
                    allowed
                      ? "bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white"
                      : "bg-gradient-to-br from-red-600 to-red-500 p-6 text-white"
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/15">
                      {allowed ? (
                        <CheckCircle2 className="h-10 w-10" />
                      ) : (
                        <XCircle className="h-10 w-10" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-white/70">
                        {allowed ? "ALLOWED" : "DENIED"}
                      </p>

                      <h2 className="mt-1 text-4xl font-extrabold">
                        {allowed ? "مسموح" : "مرفوض"}
                      </h2>

                      <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                        {getResultMessage(scanResult)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-[#F8F8FF] p-4">
                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/45">
                      <UserRound className="h-4 w-4 text-[#A88042]" />
                      اسم الزائر
                    </div>

                    <p className="mt-2 break-words text-3xl font-extrabold text-[#4B4B4B]">
                      {visitor.fullName}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/45">
                      <Phone className="h-4 w-4 text-[#A88042]" />
                      الهاتف
                    </div>

                    <p
                      dir="ltr"
                      className="mt-2 break-all text-left text-base font-extrabold text-[#4B4B4B]"
                    >
                      {visitor.phone}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/45">
                      <Mail className="h-4 w-4 text-[#A88042]" />
                      البريد الإلكتروني
                    </div>

                    <p
                      dir="ltr"
                      className="mt-2 break-all text-left text-base font-extrabold text-[#4B4B4B]"
                    >
                      {visitor.email}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/45">
                        <Building2 className="h-4 w-4 text-[#A88042]" />
                        الشركة
                      </div>

                      <p className="mt-2 break-words text-lg font-extrabold text-[#4B4B4B]">
                        {visitor.companyName}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4B4B4B]/45">
                        <BriefcaseBusiness className="h-4 w-4 text-[#A88042]" />
                        المسمى الوظيفي
                      </div>

                      <p className="mt-2 break-words text-lg font-extrabold text-[#4B4B4B]">
                        {visitor.jobTitle}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-[#4B4B4B]/45">
                      رقم التسجيل
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 break-all text-left text-sm font-extrabold text-[#A88042]"
                    >
                      {visitor.publicId}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-[#4B4B4B]/45">
                        نوع الحضور
                      </p>

                      <p className="mt-2 text-lg font-extrabold text-[#4B4B4B]">
                        {visitor.attendeeType}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-[#4B4B4B]/45">
                        نقطة المسح
                      </p>

                      <p className="mt-2 text-lg font-extrabold text-[#4B4B4B]">
                        {activeContext.checkpointName}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-[#4B4B4B]/45">
                      وقت المسح
                    </p>

                    <p className="mt-2 text-sm font-extrabold text-[#4B4B4B]">
                      {formatDateTime(getResultTime(scanResult))}
                    </p>
                  </div>

                  {visitor.companyName === "—" || visitor.jobTitle === "—" ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
                      إذا بقيت الشركة أو المسمى الوظيفي فارغة، فهذا يعني أن
                      Response المسح لا يرجع هذه الحقول أو يرجعها باسم مختلف.
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 border-t border-black/10 bg-white p-4 sm:grid-cols-2 xl:grid-cols-1">
                  <Button size="lg" onClick={startNewScan}>
                    <RefreshCw className="h-5 w-5" />
                    Scan جديد
                  </Button>

                  <Button
                    size="lg"
                    variant={allowed ? "outline" : "danger"}
                    onClick={clearResult}
                  >
                    {allowed ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5" />
                    )}
                    إخفاء النتيجة
                  </Button>
                </div>
              </>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
