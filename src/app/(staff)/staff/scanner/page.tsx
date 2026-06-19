"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clipboard,
  Loader2,
  Mail,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Wifi,
  WifiOff,
  Download,
  Printer,
  XCircle,
} from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PublicEvent,
  PublicEventBranding,
  PublicRegistrationField,
} from "@/features/public-events/public-events.types";
import {
  useCreateRegistrationQrImage,
  useGenerateRegistrationQr,
  useRegistrationQr,
} from "@/features/qr/qr.queries";
import { QrResponse } from "@/features/qr/qr.types";
import { usePublicEvent } from "@/features/public-events/public-events.queries";
import { Registration } from "@/features/registrations/registrations.types";
import { useRegistrations } from "@/features/registrations/registrations.queries";
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
  publicId: string;
  status: string;
  attendeeType: string;
};

const fallbackTheme = {
  primary: "#A88042",
  primaryHover: "#8F6D37",
  background: "#F8F8FF",
  text: "#4B4B4B",
  radius: "1.5rem",
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

function getBranding(event?: PublicEvent | null): PublicEventBranding | null {
  if (!event) return null;

  return event.branding || event.eventBranding || null;
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const backendOrigin =
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:3000";

  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

function getTheme(event?: PublicEvent | null) {
  const theme = getBranding(event)?.theme;

  return {
    primary: theme?.primary || fallbackTheme.primary,
    primaryHover: theme?.primaryHover || fallbackTheme.primaryHover,
    background: theme?.background || fallbackTheme.background,
    text: theme?.text || fallbackTheme.text,
    radius: theme?.radius || fallbackTheme.radius,
  };
}

function getLogoUrl(event?: PublicEvent | null) {
  return resolveAssetUrl(getBranding(event)?.logoUrl);
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

  const reason =
    result.message || result.reason || result.scanEvent?.reason || "";

  if (reason === "WRONG_EVENT") {
    return "هذا الـ QR تابع لفعالية مختلفة عن تكليف هذا الستاف.";
  }

  if (reason === "QR_REVOKED") {
    return "تم إلغاء هذا الـ QR ولا يمكن استخدامه.";
  }

  if (reason === "QR_EXPIRED") {
    return "انتهت صلاحية هذا الـ QR.";
  }

  if (reason === "REGISTRATION_NOT_ACTIVE") {
    return "تسجيل هذا الزائر غير فعال.";
  }

  if (reason === "ALREADY_ENTERED") {
    return "تم تسجيل دخول هذا الزائر مسبقًا.";
  }

  if (reason) return reason;

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

function getStatusLabel(status?: string | null) {
  if (status === "ACTIVE") return "فعّال";
  if (status === "PENDING") return "بانتظار التفعيل";
  if (status === "CANCELLED") return "ملغي";
  if (status === "BLOCKED") return "محظور";
  if (status === "ARCHIVED") return "مؤرشف";

  return status || "—";
}

function getRegistrationQrToken(registration?: Registration | null) {
  if (!registration) return "";

  if (typeof registration.qrToken === "string") {
    return registration.qrToken.trim();
  }

  return (
    registration.qrToken?.qrToken ||
    registration.qrToken?.token ||
    registration.qrToken?.value ||
    registration.qrToken?.signedToken ||
    registration.qr?.qrToken ||
    registration.qr?.token ||
    registration.qr?.value ||
    registration.qr?.signedToken ||
    ""
  );
}

function getRegistrationQrImageUrl(registration?: Registration | null) {
  if (!registration) return "";

  return (
    resolveAssetUrl(registration.qrImageUrl) ||
    resolveAssetUrl(registration.imageUrl) ||
    resolveAssetUrl(registration.publicUrl) ||
    resolveAssetUrl(registration.qr?.qrImageUrl) ||
    resolveAssetUrl(registration.qr?.imageUrl) ||
    resolveAssetUrl(registration.qr?.publicUrl) ||
    ""
  );
}

function formatCustomValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) return value.map(String).join("، ");
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

function getFieldLabel(
  key: string,
  registrationFields: PublicRegistrationField[],
) {
  const field = registrationFields.find((item) => item.key === key);

  return field?.labelAr || field?.labelEn || key;
}

function getRegistrationExtraFields(
  registration: Registration,
  registrationFields: PublicRegistrationField[],
) {
  const customFields = registration.customFields ?? {};
  const knownKeys = new Set<string>();

  const fromSchema = registrationFields
    .filter((field) => {
      const exists = customFields[field.key] !== undefined;

      if (exists) {
        knownKeys.add(field.key);
      }

      return exists;
    })
    .map((field) => ({
      key: field.key,
      label: field.labelAr || field.labelEn || field.key,
      value: customFields[field.key],
    }));

  const unknownFields = Object.entries(customFields)
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key, registrationFields),
      value,
    }));

  return [...fromSchema, ...unknownFields];
}

function getNestedQr(data?: QrResponse | null) {
  if (!data) return null;
  return data.qr || data.data || data;
}

function getQrTokenFromQrResponse(data?: QrResponse | null) {
  const qr = getNestedQr(data);

  return qr?.qrToken || qr?.token || "";
}

function getQrImageFromQrResponse(data?: QrResponse | null) {
  const qr = getNestedQr(data);

  return (
    resolveAssetUrl(qr?.objectUrl) ||
    resolveAssetUrl(qr?.publicUrl) ||
    resolveAssetUrl(qr?.imageUrl) ||
    resolveAssetUrl(qr?.qrImageUrl) ||
    resolveAssetUrl(qr?.url) ||
    resolveAssetUrl(qr?.path) ||
    resolveAssetUrl(qr?.fileUrl) ||
    resolveAssetUrl(qr?.qrUrl) ||
    resolveAssetUrl(qr?.image) ||
    ""
  );
}

function getScanRegistration(result?: ScanResult | null) {
  return getRegistrationCandidate(result);
}

function getRegistrationIdFromResult(result?: ScanResult | null) {
  const registration = getScanRegistration(result);
  return registration?.id || "";
}

function getScanExtraFields(
  result: ScanResult | null,
  registrationFields: PublicRegistrationField[],
) {
  const registration = getScanRegistration(result);
  const customFields = registration?.customFields ?? {};
  const knownKeys = new Set<string>();

  const fromSchema = registrationFields
    .filter((field) => {
      const exists = customFields[field.key] !== undefined;

      if (exists) knownKeys.add(field.key);

      return exists;
    })
    .map((field) => ({
      key: field.key,
      label: field.labelAr || field.labelEn || field.key,
      value: customFields[field.key],
    }));

  const unknownFields = Object.entries(customFields)
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key, registrationFields),
      value,
    }));

  return [...fromSchema, ...unknownFields];
}

function getQrTokenFromScanOrQr(
  result?: ScanResult | null,
  qrData?: QrResponse | null,
) {
  const registration = getScanRegistration(result);

  return (
    getQrTokenFromQrResponse(qrData) ||
    getRegistrationQrToken(registration as Registration | null) ||
    ""
  );
}

function getQrImageFromScanOrQr(
  result?: ScanResult | null,
  qrData?: QrResponse | null,
) {
  const registration = getScanRegistration(result);

  return (
    getQrImageFromQrResponse(qrData) ||
    getRegistrationQrImageUrl(registration as Registration | null) ||
    ""
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

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastOfflineSaved, setLastOfflineSaved] = useState(false);

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pendingCount, setPendingCount] = useState(0);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualError, setManualError] = useState("");

  const [registrationSearchInput, setRegistrationSearchInput] = useState("");
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);

  const assignmentQuery = useMyStaffAssignment();
  const startMySessionMutation = useStartMyStaffSession();
  const createScanMutation = useCreateScan();

  const assignment = assignmentQuery.data ?? null;
  const scanType = useMemo(() => getDefaultScanType(assignment), [assignment]);

  const activeContext = useMemo(() => {
    return {
      eventId: staffSession?.eventId || assignment?.eventId || eventId || "",
      checkpointId:
        staffSession?.checkpointId ||
        assignment?.checkpointId ||
        checkpointId ||
        "",
      deviceId:
        staffSession?.deviceId || assignment?.deviceId || deviceId || "",
      staffSessionId: staffSession?.id || staffSessionId || "",
      eventTitle: getEventTitle(assignment),
      checkpointName: getCheckpointName(assignment),
      checkpointType: assignment?.checkpoint?.type || checkpointType || null,
      deviceLabel: getDeviceLabel(assignment),
    };
  }, [
    assignment,
    staffSession,
    eventId,
    checkpointId,
    deviceId,
    staffSessionId,
    checkpointType,
  ]);

  const publicEventQuery = usePublicEvent(activeContext.eventId);
  const publicEvent = publicEventQuery.data ?? null;

  const theme = useMemo(() => getTheme(publicEvent), [publicEvent]);
  const logoUrl = useMemo(() => getLogoUrl(publicEvent), [publicEvent]);

  const registrationFields = useMemo(() => {
    return publicEvent?.registrationFields ?? [];
  }, [publicEvent?.registrationFields]);

  const registrationSearchEnabled = Boolean(
    activeContext.eventId && registrationSearch.trim().length >= 2,
  );

  const registrationsQuery = useRegistrations(
    {
      page: 1,
      limit: 8,
      eventId: activeContext.eventId || undefined,
      search: registrationSearch.trim() || undefined,
    },
    registrationSearchEnabled,
  );

  const searchedRegistrations = registrationsQuery.data?.items ?? [];

  const isReady = Boolean(
    activeContext.eventId &&
    activeContext.checkpointId &&
    activeContext.deviceId &&
    activeContext.staffSessionId,
  );

  const isSubmitting = createScanMutation.isPending;
  const allowed = isAllowedResult(scanResult);
  const visitor = getVisitorInfo(scanResult);

  const scannedRegistrationId = getRegistrationIdFromResult(scanResult);

  const registrationQrQuery = useRegistrationQr(scannedRegistrationId);
  const createQrImageMutation = useCreateRegistrationQrImage();
  const generateQrMutation = useGenerateRegistrationQr();

  const scanQrImageUrl = getQrImageFromScanOrQr(
    scanResult,
    registrationQrQuery.data,
  );

  const scanQrToken = getQrTokenFromScanOrQr(
    scanResult,
    registrationQrQuery.data,
  );

  const scanExtraFields = useMemo(() => {
    return getScanExtraFields(scanResult, registrationFields);
  }, [scanResult, registrationFields]);

  const themedCardStyle: CSSProperties = {
    borderRadius: `calc(${theme.radius} + 0.5rem)`,
  };

  const themedSoftStyle: CSSProperties = {
    borderRadius: theme.radius,
    backgroundColor: theme.background,
    color: theme.text,
  };

  const themedButtonStyle: CSSProperties = {
    borderRadius: theme.radius,
    backgroundColor: theme.primary,
    boxShadow: `0 18px 40px ${theme.primary}33`,
  };

  useEffect(() => {
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
    setSelectedRegistration(null);
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
          setSelectedRegistration(null);
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
    setSelectedRegistration(null);
    isProcessingScanRef.current = true;

    await submitPayload(buildPayload(token));
  }

  function submitRegistrationSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const term = registrationSearchInput.trim();

    if (term.length < 2) {
      toast.error("اكتب حرفين على الأقل للبحث");
      return;
    }

    setSelectedRegistration(null);
    setRegistrationSearch(term);
  }

  function selectRegistration(registration: Registration) {
    setSelectedRegistration(registration);
    setScanResult(null);
    setLastOfflineSaved(false);

    const token = getRegistrationQrToken(registration);

    if (token) {
      setQrToken(token);
    }
  }

  async function scanSelectedRegistration(registration: Registration) {
    const token = getRegistrationQrToken(registration);

    if (!token) {
      toast.error("هذا التسجيل لا يحتوي QR Token");
      return;
    }

    if (!validateScan(token)) return;

    setSelectedRegistration(registration);
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
    setSelectedRegistration(null);
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
      <section
        className="overflow-hidden border border-black/10 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
        style={themedCardStyle}
      >
        <div
          className="p-5 sm:p-7"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${theme.primary}55, transparent 35%), linear-gradient(135deg,#050505,#171717)`,
          }}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/10 p-2"
                  style={{ borderRadius: theme.radius }}
                >
                  <img
                    src={logoUrl}
                    alt={activeContext.eventTitle}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}

              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-wide"
                  style={{ color: theme.primary }}
                >
                  Staff Scanner
                </p>

                <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                  امسح QR الزائر
                </h1>

                <p className="mt-3 text-sm font-bold leading-7 text-white/65">
                  {activeContext.eventTitle} — {activeContext.checkpointName}
                </p>

                <p className="mt-1 text-xs font-bold text-white/45">
                  {activeContext.deviceLabel}
                </p>
              </div>
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
          <div
            className="border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-6"
            style={themedCardStyle}
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  className="text-2xl font-extrabold"
                  style={{ color: theme.text }}
                >
                  الكاميرا
                </h2>

                <p
                  className="mt-1 text-sm font-bold opacity-55"
                  style={{ color: theme.text }}
                >
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
              <div
                className="relative mb-5 overflow-hidden bg-black p-3"
                style={themedCardStyle}
              >
                <video
                  ref={videoRef}
                  className="h-[58vh] max-h-[560px] min-h-[360px] w-full object-cover"
                  style={{ borderRadius: theme.radius }}
                  playsInline
                  muted
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-64 w-64 border-4 shadow-[0_0_0_999px_rgba(0,0,0,0.42)]"
                    style={{
                      borderRadius: theme.radius,
                      borderColor: theme.primary,
                    }}
                  />
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
                className="mb-5 flex min-h-[380px] w-full items-center justify-center border-2 border-dashed transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[460px]"
                style={{
                  ...themedSoftStyle,
                  borderColor: `${theme.primary}55`,
                }}
              >
                <div className="text-center">
                  <div
                    className="mx-auto mb-5 flex h-28 w-28 items-center justify-center bg-black shadow-xl"
                    style={{
                      borderRadius: theme.radius,
                      color: theme.primary,
                    }}
                  >
                    {isCameraStarting || isSubmitting ? (
                      <Loader2 className="h-12 w-12 animate-spin" />
                    ) : (
                      <QrCode className="h-14 w-14" />
                    )}
                  </div>

                  <p
                    className="text-3xl font-extrabold"
                    style={{ color: theme.text }}
                  >
                    تشغيل الكاميرا
                  </p>

                  <p
                    className="mt-3 text-sm font-bold opacity-55"
                    style={{ color: theme.text }}
                  >
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

          <section
            className="border border-black/10 bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.06)] sm:p-6"
            style={themedCardStyle}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3
                  className="text-lg font-extrabold"
                  style={{ color: theme.text }}
                >
                  بحث عن زائر
                </h3>

                <p
                  className="mt-1 text-xs font-bold opacity-55"
                  style={{ color: theme.text }}
                >
                  ابحث بالاسم أو الهاتف أو البريد أو رقم التسجيل.
                </p>
              </div>

              <Badge variant="gold">Manual Lookup</Badge>
            </div>

            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={submitRegistrationSearch}
            >
              <input
                value={registrationSearchInput}
                onChange={(event) =>
                  setRegistrationSearchInput(event.target.value)
                }
                placeholder="اكتب اسم الزائر أو رقمه أو بريده..."
                className="h-12 w-full border border-black/10 bg-white px-4 text-sm font-bold outline-none transition placeholder:text-black/35 focus:ring-4"
                style={
                  {
                    borderRadius: theme.radius,
                    color: theme.text,
                    "--tw-ring-color": `${theme.primary}1A`,
                  } as CSSProperties
                }
              />

              <Button
                type="submit"
                disabled={
                  !activeContext.eventId || registrationsQuery.isFetching
                }
                style={themedButtonStyle}
              >
                {registrationsQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                بحث
              </Button>
            </form>

            {registrationSearchEnabled && registrationsQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
                تعذر البحث عن التسجيلات. إذا ظهر 403، يجب السماح للـ STAFF
                بالبحث ضمن فعاليته من الباك.
              </div>
            ) : null}

            {registrationSearchEnabled &&
            !registrationsQuery.isFetching &&
            searchedRegistrations.length === 0 ? (
              <div
                className="mt-4 border border-black/10 p-4 text-center text-sm font-bold opacity-65"
                style={themedSoftStyle}
              >
                لا توجد نتائج مطابقة.
              </div>
            ) : null}

            {searchedRegistrations.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {searchedRegistrations.map((registration) => {
                  const hasToken = Boolean(
                    getRegistrationQrToken(registration),
                  );
                  const hasImage = Boolean(
                    getRegistrationQrImageUrl(registration),
                  );

                  return (
                    <button
                      key={registration.id}
                      type="button"
                      onClick={() => selectRegistration(registration)}
                      className="w-full border border-black/10 bg-white p-4 text-right transition hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ borderRadius: theme.radius }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p
                            className="truncate text-base font-extrabold"
                            style={{ color: theme.text }}
                          >
                            {registration.fullName}
                          </p>

                          <p
                            className="mt-1 truncate text-xs font-bold opacity-55"
                            style={{ color: theme.text }}
                          >
                            {registration.phone || "—"}{" "}
                            {registration.email
                              ? `— ${registration.email}`
                              : ""}
                          </p>

                          <p
                            className="mt-1 truncate text-xs font-bold"
                            style={{ color: theme.primary }}
                          >
                            {registration.publicId ||
                              registration.externalId ||
                              registration.id}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              registration.status === "ACTIVE"
                                ? "success"
                                : "warning"
                            }
                          >
                            {getStatusLabel(registration.status)}
                          </Badge>

                          <Badge
                            variant={hasToken || hasImage ? "success" : "muted"}
                          >
                            {hasToken || hasImage ? "QR موجود" : "بدون QR"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section
            className="overflow-hidden border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
            style={themedCardStyle}
          >
            {selectedRegistration && !scanResult && !lastOfflineSaved ? (
              <div className="space-y-4 p-4">
                <div
                  className="border p-5 text-white"
                  style={{
                    borderRadius: `calc(${theme.radius} + 0.25rem)`,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
                  }}
                >
                  <p className="text-xs font-extrabold uppercase tracking-wide text-white/70">
                    Visitor Lookup
                  </p>

                  <h2 className="mt-2 break-words text-3xl font-extrabold">
                    {selectedRegistration.fullName}
                  </h2>

                  <p className="mt-2 text-sm font-bold text-white/75">
                    {getStatusLabel(selectedRegistration.status)}
                  </p>
                </div>

                <div className="space-y-3">
                  <InfoCard
                    icon={
                      <Phone
                        className="h-4 w-4"
                        style={{ color: theme.primary }}
                      />
                    }
                    label="الهاتف"
                    value={selectedRegistration.phone || "—"}
                    dir="ltr"
                    theme={theme}
                  />

                  <InfoCard
                    icon={
                      <Mail
                        className="h-4 w-4"
                        style={{ color: theme.primary }}
                      />
                    }
                    label="البريد الإلكتروني"
                    value={selectedRegistration.email || "—"}
                    dir="ltr"
                    theme={theme}
                  />

                  <InfoCard
                    icon={
                      <UserRound
                        className="h-4 w-4"
                        style={{ color: theme.primary }}
                      />
                    }
                    label="نوع الحضور"
                    value={
                      selectedRegistration.attendeeType?.nameAr ||
                      selectedRegistration.attendeeType?.nameEn ||
                      selectedRegistration.attendeeType?.code ||
                      "—"
                    }
                    theme={theme}
                  />

                  <InfoCard
                    icon={
                      <QrCode
                        className="h-4 w-4"
                        style={{ color: theme.primary }}
                      />
                    }
                    label="رقم التسجيل"
                    value={
                      selectedRegistration.publicId ||
                      selectedRegistration.externalId ||
                      selectedRegistration.id
                    }
                    dir="ltr"
                    theme={theme}
                  />

                  {getRegistrationExtraFields(
                    selectedRegistration,
                    registrationFields,
                  ).map((field) => (
                    <InfoCard
                      key={field.key}
                      label={field.label}
                      value={formatCustomValue(field.value)}
                      theme={theme}
                    />
                  ))}
                </div>

                <div className="grid gap-3">
                  <Button
                    size="lg"
                    disabled={
                      !getRegistrationQrToken(selectedRegistration) ||
                      isSubmitting ||
                      !isReady
                    }
                    onClick={() =>
                      scanSelectedRegistration(selectedRegistration)
                    }
                    style={themedButtonStyle}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ScanLine className="h-5 w-5" />
                    )}
                    تنفيذ Scan لهذا الزائر
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setSelectedRegistration(null)}
                  >
                    إخفاء البطاقة
                  </Button>
                </div>

                {!getRegistrationQrToken(selectedRegistration) ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-6 text-amber-800">
                    تم العثور على الزائر، لكن الباك لم يرجع QR Token ضمن بيانات
                    التسجيل. لعمل Scan مباشر من البحث، يجب إرجاع QR Token أو
                    Active QR مع التسجيل.
                  </div>
                ) : null}
              </div>
            ) : !scanResult && !lastOfflineSaved ? (
              <div className="flex min-h-[620px] items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div
                    className="mx-auto flex h-24 w-24 items-center justify-center"
                    style={{
                      borderRadius: theme.radius,
                      backgroundColor: `${theme.primary}1A`,
                      color: theme.primary,
                    }}
                  >
                    <ScanLine className="h-12 w-12" />
                  </div>

                  <h2
                    className="mt-5 text-2xl font-extrabold"
                    style={{ color: theme.text }}
                  >
                    بانتظار أول Scan
                  </h2>

                  <p
                    className="mt-3 text-sm font-bold leading-7 opacity-55"
                    style={{ color: theme.text }}
                  >
                    بعد قراءة QR أو اختيار زائر من البحث ستظهر البيانات هنا.
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
              <VisitorScanBadge
                allowed={allowed}
                visitor={visitor}
                theme={theme}
                eventTitle={activeContext.eventTitle}
                checkpointName={activeContext.checkpointName}
                scanType={scanType}
                resultMessage={getResultMessage(scanResult)}
                resultTime={formatDateTime(getResultTime(scanResult))}
                extraFields={scanExtraFields}
                qrImageUrl={scanQrImageUrl}
                qrToken={scanQrToken}
                isGeneratingQr={
                  createQrImageMutation.isPending ||
                  generateQrMutation.isPending ||
                  registrationQrQuery.isFetching
                }
                onGenerateQr={() => {
                  if (!scannedRegistrationId) {
                    toast.error("لا يوجد رقم تسجيل لتوليد QR");
                    return;
                  }

                  generateQrMutation.mutate(scannedRegistrationId, {
                    onSuccess: () => {
                      createQrImageMutation.mutate(scannedRegistrationId);
                    },
                  });
                }}
                onNewScan={startNewScan}
                onClear={clearResult}
              />
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  theme,
  dir,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  theme: ReturnType<typeof getTheme>;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div
      className="bg-white p-4 shadow-sm"
      style={{
        borderRadius: theme.radius,
        color: theme.text,
      }}
    >
      <div className="flex items-center gap-2 text-xs font-bold opacity-45">
        {icon}
        {label}
      </div>

      <p
        dir={dir}
        className={`mt-2 break-words text-base font-extrabold ${
          dir === "ltr" ? "text-left" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function VisitorScanBadge({
  allowed,
  visitor,
  theme,
  eventTitle,
  checkpointName,
  scanType,
  resultMessage,
  resultTime,
  extraFields,
  qrImageUrl,
  qrToken,
  isGeneratingQr,
  onGenerateQr,
  onNewScan,
  onClear,
}: {
  allowed: boolean;
  visitor: VisitorInfo;
  theme: ReturnType<typeof getTheme>;
  eventTitle: string;
  checkpointName: string;
  scanType: ScanType;
  resultMessage: string;
  resultTime: string;
  extraFields: { key: string; label: string; value: unknown }[];
  qrImageUrl: string;
  qrToken: string;
  isGeneratingQr: boolean;
  onGenerateQr: () => void;
  onNewScan: () => void;
  onClear: () => void;
}) {
  const statusBg = allowed ? "#059669" : "#DC2626";
  const statusText = allowed ? "مسموح بالدخول" : "مرفوض";

  function printBadge() {
    window.print();
  }

  function downloadQr() {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${visitor.publicId || "visitor-qr"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="bg-white">
      <div className="p-4 print:p-0">
        <div
          id="visitor-print-badge"
          className="overflow-hidden border border-black/10 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)] print:shadow-none"
          style={{
            borderRadius: `calc(${theme.radius} + 0.5rem)`,
            color: theme.text,
          }}
        >
          <div
            className="p-5 text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-white/70">
                  {eventTitle}
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight">
                  {visitor.fullName}
                </h2>

                <p className="mt-2 text-sm font-bold text-white/75">
                  {checkpointName}
                </p>
              </div>

              <div
                className="shrink-0 rounded-2xl px-3 py-2 text-center text-xs font-black text-white"
                style={{ backgroundColor: statusBg }}
              >
                {allowed ? "ALLOWED" : "DENIED"}
              </div>
            </div>
          </div>

          <div className="p-4" style={{ backgroundColor: theme.background }}>
            <div
              className="mb-4 rounded-3xl border p-4 text-center"
              style={{
                borderColor: allowed ? "#10B98155" : "#EF444455",
                backgroundColor: allowed ? "#ECFDF5" : "#FEF2F2",
                color: allowed ? "#047857" : "#B91C1C",
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {allowed ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : (
                  <XCircle className="h-7 w-7" />
                )}

                <p className="text-2xl font-black">{statusText}</p>
              </div>

              <p className="mt-2 text-sm font-bold leading-6">
                {resultMessage}
              </p>
            </div>

            <div className="grid gap-3">
              <BadgeInfoRow label="الهاتف" value={visitor.phone} dir="ltr" />
              <BadgeInfoRow
                label="البريد الإلكتروني"
                value={visitor.email}
                dir="ltr"
              />
              <BadgeInfoRow
                label="رقم التسجيل"
                value={visitor.publicId}
                dir="ltr"
              />
              <BadgeInfoRow label="نوع الحركة" value={scanType} />
              <BadgeInfoRow label="نوع الحضور" value={visitor.attendeeType} />
              <BadgeInfoRow label="وقت المسح" value={resultTime} />

              {extraFields.map((field) => (
                <BadgeInfoRow
                  key={field.key}
                  label={field.label}
                  value={formatCustomValue(field.value)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-3xl bg-white p-4 text-center shadow-sm">
              <p
                className="mb-3 text-sm font-black"
                style={{ color: theme.text }}
              >
                QR الخاص بالزائر
              </p>

              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Visitor QR"
                  className="mx-auto h-56 w-56 rounded-2xl bg-white object-contain p-2"
                />
              ) : qrToken ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800">
                  يوجد QR Token لكن لا توجد صورة QR. اضغط توليد / تحديث QR.
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800">
                  لم يتم إرجاع QR لهذا التسجيل.
                </div>
              )}

              {qrToken ? (
                <p
                  dir="ltr"
                  className="mx-auto mt-3 max-w-[260px] truncate text-xs font-bold opacity-50"
                >
                  {qrToken}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 print:hidden">
          <Button
            size="lg"
            disabled={isGeneratingQr}
            onClick={onGenerateQr}
            style={{
              borderRadius: theme.radius,
              backgroundColor: theme.primary,
            }}
          >
            {isGeneratingQr ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <QrCode className="h-5 w-5" />
            )}
            توليد / تحديث QR
          </Button>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Button
              size="lg"
              variant="outline"
              disabled={!qrImageUrl}
              onClick={downloadQr}
            >
              <Download className="h-5 w-5" />
              تحميل QR
            </Button>

            <Button size="lg" variant="outline" onClick={printBadge}>
              <Printer className="h-5 w-5" />
              طباعة البادج
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Button size="lg" onClick={onNewScan}>
              <RefreshCw className="h-5 w-5" />
              Scan جديد
            </Button>

            <Button
              size="lg"
              variant={allowed ? "outline" : "danger"}
              onClick={onClear}
            >
              {allowed ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
              إخفاء النتيجة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeInfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-black/40">{label}</p>

      <p
        dir={dir}
        className={`mt-1 break-words text-lg font-black text-[#333] ${
          dir === "ltr" ? "text-left" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
