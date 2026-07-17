"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import {
  getSavedStaffScannerContext,
  saveStaffScannerContext,
} from "@/lib/offline/staff-scanner-context";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  usePublicEvent,
  useRegisterToPublicEvent,
} from "@/features/public-events/public-events.queries";
import { useCreateScan } from "@/features/scans/scans.queries";
import { CreateScanPayload, ScanResult } from "@/features/scans/scans.types";
import {
  useMyStaffAssignment,
  useStartMyStaffSession,
} from "@/features/staff/staff.queries";
import { StaffSession } from "@/features/staff/staff.types";
import {
  generateStaffVisitorQr,
  getAllStaffVisitorsForOffline,
  getStaffVisitorBadge,
  StaffVisitorBadgeResponse,
} from "@/features/staff-visitors/staff-visitors.api";
import {
  StaffVisitor,
  StaffVisitorsResponse,
  useStaffVisitors,
} from "@/features/staff-visitors/staff-visitors.queries";
import { StaffBadgePreviewModal } from "@/features/staff-scanner/components/StaffBadgePreviewModal";
import { StaffCameraPanel } from "@/features/staff-scanner/components/StaffCameraPanel";
import { StaffCreateVisitorModal } from "@/features/staff-scanner/components/StaffCreateVisitorModal";
import { StaffScannerHeader } from "@/features/staff-scanner/components/StaffScannerHeader";
import { StaffVisitorCard } from "@/features/staff-scanner/components/StaffVisitorCard";
import { StaffVisitorsPanel } from "@/features/staff-scanner/components/StaffVisitorsPanel";
import {
  buildVisitorFromRegisterResponse,
  cleanCustomFields,
  createOperationId,
  extractQrToken,
  getAttendeeTypes,
  getBackgroundUrl,
  getCheckpointName,
  getDefaultScanType,
  getDeviceApiKey,
  getDeviceLabel,
  getEventTitle,
  getExtraFields,
  getLogoUrl,
  getQrImageFromQrResponse,
  getQrTokenFromQrResponse,
  getRegistrationFields,
  getRegistrationIdFromScan,
  getResultMessage,
  getTheme,
  getVisibleFields,
  getVisitorInfoFromScan,
  getVisitorInfoFromStaffVisitor,
  getVisitorQrImageUrl,
  getVisitorQrToken,
  isAllowedResult,
} from "@/features/staff-scanner/utils/staff-scanner.helpers";
import {
  ScannerControls,
  StaffScannerPublicEventResponse,
  StaffScannerRegisterForm,
  StaffScannerVisitor,
  StaffScannerVisitorSource,
} from "@/features/staff-scanner/utils/staff-scanner.types";
import {
  addOfflineVisitorRegistration,
  addScanToQueue,
  cachePublicEventForStaffScanner,
  cacheScannerAsset,
  cacheStaffVisitors,
  getCachedPublicEvent,
  getCachedScannerAsset,
  getCachedStaffVisitorsCount,
  getPendingOfflineWorkCount,
  replaceCachedStaffVisitorsForEvent,
  searchCachedStaffVisitors,
  syncQueuedScans,
  syncQueuedVisitorRegistrations,
  getCachedStaffBadgeTemplate,
  saveCachedStaffBadgeTemplate,
} from "@/lib/offline/staff-scanner-db";
import { registerToPublicEvent } from "@/features/public-events/public-events.api";
import { useDeviceStore } from "@/stores/device-store";
import { createOfflineQrImageDataUrl } from "@/lib/offline/staff-offline-qr-image";
import { createOfflineVisitorQrToken } from "@/lib/offline/staff-offline-qr";

export default function StaffScannerPage() {
  const [cachedContext, setCachedContext] = useState<
    ReturnType<typeof getSavedStaffScannerContext>
  >(() => {
    if (typeof window === "undefined") return null;

    return getSavedStaffScannerContext();
  });

  const [cachedEventData, setCachedEventData] = useState<
    StaffScannerPublicEventResponse | undefined
  >(undefined);

  const [offlineVisitorsData, setOfflineVisitorsData] =
    useState<StaffVisitorsResponse | null>(null);

  const [cachedLogoUrl, setCachedLogoUrl] = useState("");
  const [cachedBackgroundUrl, setCachedBackgroundUrl] = useState("");

  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const startedSessionRef = useRef(false);
  const isProcessingScanRef = useRef(false);
  const [isSubmittingVisitorRegistration, setIsSubmittingVisitorRegistration] =
    useState(false);

  const [isCachingVisitors, setIsCachingVisitors] = useState(false);
  const [cachedVisitorsCount, setCachedVisitorsCount] = useState(0);
  const cachedVisitorsEventRef = useRef("");

  const setScannerContext = useDeviceStore((state) => state.setScannerContext);

  const assignmentId = useDeviceStore((state) => state.assignmentId);
  const eventId = useDeviceStore((state) => state.eventId);
  const checkpointId = useDeviceStore((state) => state.checkpointId);
  const checkpointType = useDeviceStore((state) => state.checkpointType);
  const deviceId = useDeviceStore((state) => state.deviceId);
  const staffSessionId = useDeviceStore((state) => state.staffSessionId);
  const storedDeviceApiKey = useDeviceStore((state) => state.deviceApiKey);

  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);

  const [rawScanResult, setRawScanResult] = useState<ScanResult | null>(null);
  const [selectedVisitor, setSelectedVisitor] =
    useState<StaffScannerVisitor | null>(null);

  const [visitorSource, setVisitorSource] =
    useState<StaffScannerVisitorSource>("lookup");

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const [pendingCount, setPendingCount] = useState(0);
  const [lastOfflineSaved, setLastOfflineSaved] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [visitorSearchInput, setVisitorSearchInput] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [registerForm, setRegisterForm] = useState<StaffScannerRegisterForm>({
    fullName: "",
    phone: "",
    email: "",
  });

  const [registerAttendeeTypeId, setRegisterAttendeeTypeId] = useState("");
  const [registerCustomFields, setRegisterCustomFields] = useState<
    Record<string, unknown>
  >({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>(
    {},
  );

  const [showingVisitorQrId, setShowingVisitorQrId] = useState("");
  const [scanningVisitorId, setScanningVisitorId] = useState("");
  const [printingVisitorId, setPrintingVisitorId] = useState("");

  const [badgePreviewOpen, setBadgePreviewOpen] = useState(false);
  const [badgePreviewData, setBadgePreviewData] =
    useState<StaffVisitorBadgeResponse | null>(null);
  const [badgePreviewVisitor, setBadgePreviewVisitor] =
    useState<StaffVisitor | null>(null);

  const assignmentQuery = useMyStaffAssignment();
  const startMySessionMutation = useStartMyStaffSession();
  const createScanMutation = useCreateScan();

  const assignment = assignmentQuery.data ?? null;
  const scanType = useMemo(() => getDefaultScanType(assignment), [assignment]);

  const activeContext = useMemo(() => {
    return {
      eventId:
        staffSession?.eventId ||
        assignment?.eventId ||
        eventId ||
        cachedContext?.eventId ||
        "",

      checkpointId:
        staffSession?.checkpointId ||
        assignment?.checkpointId ||
        checkpointId ||
        cachedContext?.checkpointId ||
        "",

      deviceId:
        staffSession?.deviceId ||
        assignment?.deviceId ||
        deviceId ||
        cachedContext?.deviceId ||
        "",

      staffSessionId:
        staffSession?.id ||
        staffSessionId ||
        cachedContext?.staffSessionId ||
        "",

      eventTitle: assignment
        ? getEventTitle(assignment)
        : cachedContext?.eventTitle || "المعرض",

      checkpointName: assignment
        ? getCheckpointName(assignment)
        : cachedContext?.checkpointName || "بوابة الدخول",

      checkpointType:
        assignment?.checkpoint?.type ||
        checkpointType ||
        cachedContext?.checkpointType ||
        null,

      deviceLabel: assignment
        ? getDeviceLabel(assignment)
        : cachedContext?.deviceName ||
          cachedContext?.deviceCode ||
          "Staff Scanner Device",
    };
  }, [
    assignment,
    staffSession,
    eventId,
    checkpointId,
    deviceId,
    staffSessionId,
    checkpointType,
    cachedContext,
  ]);

  const activeDeviceApiKey = useMemo(() => {
    return (
      getDeviceApiKey(assignment) ||
      storedDeviceApiKey ||
      cachedContext?.deviceApiKey ||
      ""
    );
  }, [assignment, storedDeviceApiKey, cachedContext?.deviceApiKey]);

  const activeAssignmentId =
    assignment?.id || assignmentId || cachedContext?.assignmentId || undefined;

  const publicEventQuery = usePublicEvent(activeContext.eventId, isOnline);

  const onlineEventData = publicEventQuery.data as
    | StaffScannerPublicEventResponse
    | undefined;

  const eventData = (onlineEventData || cachedEventData) as
    | StaffScannerPublicEventResponse
    | undefined;

  const theme = useMemo(() => getTheme(eventData), [eventData]);

  const rawLogoUrl = useMemo(() => getLogoUrl(eventData), [eventData]);

  const rawBackgroundUrl = useMemo(
    () => getBackgroundUrl(eventData),
    [eventData],
  );

  const logoUrl = isOnline
    ? rawLogoUrl || cachedLogoUrl
    : cachedLogoUrl || rawLogoUrl;

  const backgroundUrl = isOnline
    ? rawBackgroundUrl || cachedBackgroundUrl
    : cachedBackgroundUrl || rawBackgroundUrl;

  const attendeeTypes = useMemo(() => getAttendeeTypes(eventData), [eventData]);

  const registrationFields = useMemo(
    () => getRegistrationFields(eventData),
    [eventData],
  );

  const defaultAttendeeType = attendeeTypes[0];

  const visibleRegisterFields = useMemo(() => {
    if (!registerAttendeeTypeId) return [];

    return getVisibleFields(registrationFields, registerAttendeeTypeId);
  }, [registrationFields, registerAttendeeTypeId]);

  const visitorSearchEnabled = Boolean(visitorSearch.trim().length >= 2);

  const searchedVisitors = offlineVisitorsData?.visitors?.items ?? [];

  const registerMutation = useRegisterToPublicEvent(activeContext.eventId);

  const isReady = Boolean(
    activeContext.eventId &&
    activeContext.checkpointId &&
    activeContext.deviceId &&
    activeContext.staffSessionId,
  );

  const isSubmittingScan = createScanMutation.isPending;
  const isRegistering =
    registerMutation.isPending || isSubmittingVisitorRegistration;

  const scanVisitor: StaffScannerVisitor | null = useMemo(() => {
    if (!rawScanResult) return null;

    return getVisitorInfoFromScan(rawScanResult);
  }, [rawScanResult]);

  const displayVisitor = scanVisitor || selectedVisitor;

  const scannedRegistrationId = getRegistrationIdFromScan(rawScanResult) as
    | string
    | undefined;

  const displayRegistrationId =
    scannedRegistrationId ||
    displayVisitor?.registrationId ||
    displayVisitor?.id ||
    "";

  const cardQrToken =
    displayVisitor?.qrToken || getQrTokenFromQrResponse(rawScanResult) || "";

  const cardQrImageUrl =
    displayVisitor?.qrImageUrl || getQrImageFromQrResponse(rawScanResult) || "";

  const displayExtraFields = displayVisitor
    ? getExtraFields(displayVisitor.customFields ?? {}, registrationFields)
    : [];

  const pageStyle: CSSProperties = {
    backgroundColor: theme.background,
    color: theme.text,
    backgroundImage: backgroundUrl
      ? `linear-gradient(rgba(248,248,255,0.92), rgba(248,248,255,0.94)), url(${backgroundUrl})`
      : `radial-gradient(circle at top right, ${theme.primary}22, transparent 34%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
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
    if (!isOnline) return;
    if (!activeContext.eventId || !activeContext.deviceId) return;

    const timer = window.setTimeout(() => {
      syncOfflineQueue();
    }, 800);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, activeContext.eventId, activeContext.deviceId]);

  useEffect(() => {
    if (!activeContext.eventId) return;

    let cancelled = false;

    getCachedPublicEvent(activeContext.eventId).then((cached) => {
      if (cancelled || !cached?.data) return;

      setCachedEventData(cached.data as StaffScannerPublicEventResponse);
    });

    return () => {
      cancelled = true;
    };
  }, [activeContext.eventId]);

  useEffect(() => {
    if (!activeContext.eventId || !onlineEventData) return;

    let cancelled = false;

    cachePublicEventForStaffScanner(activeContext.eventId, onlineEventData).then(
      () => {
        if (!cancelled) {
          setCachedEventData(onlineEventData);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [activeContext.eventId, onlineEventData]);

  useEffect(() => {
    if (!rawLogoUrl) {
      const timer = window.setTimeout(() => setCachedLogoUrl(""), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;

    async function hydrateLogo() {
      const cached = await getCachedScannerAsset(rawLogoUrl);

      if (!cancelled && cached?.dataUrl) {
        setCachedLogoUrl(cached.dataUrl);
      }

      if (!isOnline) return;

      try {
        const next = await cacheScannerAsset(rawLogoUrl);

        if (!cancelled && next?.dataUrl) {
          setCachedLogoUrl(next.dataUrl);
        }
      } catch {
        // Asset cache is best-effort only.
      }
    }

    hydrateLogo();

    return () => {
      cancelled = true;
    };
  }, [rawLogoUrl, isOnline]);

  useEffect(() => {
    if (!rawBackgroundUrl) {
      const timer = window.setTimeout(() => setCachedBackgroundUrl(""), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;

    async function hydrateBackground() {
      const cached = await getCachedScannerAsset(rawBackgroundUrl);

      if (!cancelled && cached?.dataUrl) {
        setCachedBackgroundUrl(cached.dataUrl);
      }

      if (!isOnline) return;

      try {
        const next = await cacheScannerAsset(rawBackgroundUrl);

        if (!cancelled && next?.dataUrl) {
          setCachedBackgroundUrl(next.dataUrl);
        }
      } catch {
        // Asset cache is best-effort only.
      }
    }

    hydrateBackground();

    return () => {
      cancelled = true;
    };
  }, [rawBackgroundUrl, isOnline]);

  useEffect(() => {
    if (!isOnline) return;
    if (!activeContext.eventId) return;
    if (!isReady) return;

    if (cachedVisitorsEventRef.current === activeContext.eventId) return;

    cachedVisitorsEventRef.current = activeContext.eventId;

    const timer = window.setTimeout(() => {
      refreshOfflineVisitorsCache({ silent: true });
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, activeContext.eventId, isReady]);

  useEffect(() => {
    if (!activeContext.eventId) return;

    getCachedStaffVisitorsCount(activeContext.eventId).then((count) => {
      setCachedVisitorsCount(count);
    });
  }, [activeContext.eventId]);

  useEffect(() => {
    if (!activeContext.eventId || !visitorSearchEnabled) {
      const timer = window.setTimeout(() => setOfflineVisitorsData(null), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;

    searchCachedStaffVisitors(activeContext.eventId, visitorSearch, 20).then(
      (response) => {
        if (cancelled) return;

        setOfflineVisitorsData(response as StaffVisitorsResponse);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [activeContext.eventId, visitorSearch, visitorSearchEnabled]);

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

    const nextContext = {
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
      staffSessionId: cachedContext?.staffSessionId || null,
      savedAt: new Date().toISOString(),
    };

    setScannerContext(nextContext);
    saveStaffScannerContext(nextContext);

    const timer = window.setTimeout(() => setCachedContext(nextContext), 0);

    return () => window.clearTimeout(timer);
  }, [assignment, setScannerContext, cachedContext?.staffSessionId]);

  useEffect(() => {
    if (!assignment) return;
    if (startedSessionRef.current) return;

    startedSessionRef.current = true;

    startMySessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setStaffSession(session);

        const nextContext = {
          assignmentId: assignment.id,
          eventId: session.eventId || assignment.eventId,
          eventTitle: getEventTitle(assignment),
          checkpointId: session.checkpointId || assignment.checkpointId,
          checkpointName: getCheckpointName(assignment),
          checkpointType: assignment.checkpoint?.type ?? null,
          deviceId: session.deviceId || assignment.deviceId,
          deviceName: assignment.device?.name ?? null,
          deviceCode: assignment.device?.code ?? null,
          deviceApiKey: getDeviceApiKey(assignment),
          staffSessionId: session.id,
          savedAt: new Date().toISOString(),
        };

        setScannerContext({
          assignmentId: nextContext.assignmentId,
          eventId: nextContext.eventId,
          eventTitle: nextContext.eventTitle,
          checkpointId: nextContext.checkpointId,
          checkpointName: nextContext.checkpointName,
          checkpointType: nextContext.checkpointType,
          deviceId: nextContext.deviceId,
          deviceName: nextContext.deviceName,
          deviceCode: nextContext.deviceCode,
          deviceApiKey: nextContext.deviceApiKey,
          staffSessionId: session.id,
        });

        saveStaffScannerContext(nextContext);
        setCachedContext(nextContext);
      },

      onError: () => {
        startedSessionRef.current = false;
      },
    });
  }, [assignment, setScannerContext, startMySessionMutation]);

  async function refreshPendingCount() {
    const count = await getPendingOfflineWorkCount();
    setPendingCount(count);
  }

  async function syncOfflineQueue() {
    if (isSyncingQueue) return;

    if (!navigator.onLine) {
      toast.error("لا يوجد اتصال للمزامنة.");
      return;
    }

    setIsSyncingQueue(true);

    try {
      const visitorResult = await syncQueuedVisitorRegistrations({
        registerVisitor: (eventId, payload) =>
          registerToPublicEvent(eventId, payload),
      });

      const scanResult = await syncQueuedScans({
        submitScan: (payload) =>
          createScanMutation.mutateAsync({
            payload,
            deviceApiKey: activeDeviceApiKey,
          }),
      });

      await refreshPendingCount();

      const total = visitorResult.total + scanResult.total;
      const synced = visitorResult.synced + scanResult.synced;
      const failed = visitorResult.failed + scanResult.failed;

      if (visitorResult.synced > 0) {
        refreshOfflineVisitorsCache({ silent: true });
      }

      if (total === 0) {
        toast.info("لا توجد عمليات معلقة للمزامنة.");
        return;
      }

      if (synced > 0 && failed === 0) {
        toast.success(`تمت مزامنة ${synced} عملية بنجاح.`);
        return;
      }

      if (synced > 0 && failed > 0) {
        toast.warning(`تمت مزامنة ${synced} عملية، وفشل ${failed}.`);
        return;
      }

      if (failed > 0) {
        toast.error(`فشلت مزامنة ${failed} عملية.`);
      }
    } finally {
      setIsSyncingQueue(false);
    }
  }

  function hasHttpResponse(error: unknown) {
    return Boolean(
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: unknown }).response,
    );
  }

  function clearScanResult() {
    setRawScanResult(null);
    setSelectedVisitor(null);
    setVisitorSource("lookup");
    setCameraError("");
    setLastOfflineSaved(false);
    isProcessingScanRef.current = false;
  }

  function validateScan(token: string) {
    if (!isReady) {
      setCameraError("جاري تجهيز جلسة السكانر، حاول بعد لحظات.");
      return false;
    }

    if (!token.trim()) {
      setCameraError("لا يوجد QR Token لتنفيذ السكان.");
      toast.error("لا يوجد QR Token لهذا الزائر.");
      return false;
    }

    setCameraError("");
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
        source: activeDeviceApiKey
          ? "staff-device-scanner"
          : "staff-jwt-scanner",
        mode: isOnline ? "online" : "offline",
        assignmentId: activeAssignmentId,
        trigger: "staff-table-or-camera-scan",
      },
    };
  }

  async function submitPayload(payload: CreateScanPayload) {
    if (!isOnline) {
      await addScanToQueue(payload);
      await refreshPendingCount();

      setRawScanResult(null);
      setSelectedVisitor(null);
      setLastOfflineSaved(true);
      isProcessingScanRef.current = false;

      toast.warning("تم حفظ العملية محليًا لعدم وجود اتصال");
      return;
    }

    try {
      const data = await createScanMutation.mutateAsync({
        payload,
        deviceApiKey: activeDeviceApiKey,
      });

      setRawScanResult(data);
      setSelectedVisitor(null);
      setVisitorSource("scan");
      setLastOfflineSaved(false);
      isProcessingScanRef.current = false;

      if (isAllowedResult(data)) {
        toast.success("تم السماح بالدخول");
      } else {
        toast.error(getResultMessage(data));
      }

      if ("vibrate" in navigator) {
        navigator.vibrate?.(isAllowedResult(data) ? 120 : [120, 80, 120]);
      }
    } catch (error) {
      if (!hasHttpResponse(error)) {
        await addScanToQueue(payload);
        await refreshPendingCount();

        setRawScanResult(null);
        setSelectedVisitor(null);
        setLastOfflineSaved(true);

        toast.warning("تعذر الاتصال بالسيرفر، تم حفظ العملية محليًا");
      }

      isProcessingScanRef.current = false;
    }
  }

  async function getVisitorQrTokenForScan(visitor: StaffVisitor) {
    const existingToken = getVisitorQrToken(visitor);

    if (existingToken) {
      return existingToken;
    }

    if (!visitor.id) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");
      return "";
    }

    setShowingVisitorQrId(visitor.id);

    try {
      const response = await generateStaffVisitorQr(visitor.id);

      const token =
        getQrTokenFromQrResponse(response) ||
        getQrTokenFromQrResponse(response.qr) ||
        "";

      const imageUrl =
        getQrImageFromQrResponse(response) ||
        getQrImageFromQrResponse(response.qr) ||
        "";

      if (!token) {
        toast.error(
          "تم طلب تجهيز QR لكن الباك لم يرجع qrToken. لازم endpoint توليد QR يرجع qr.qrToken أو qrToken.",
        );
        return "";
      }

      const scannerVisitor = getVisitorInfoFromStaffVisitor(visitor);

      setRawScanResult(null);
      setSelectedVisitor({
        ...scannerVisitor,
        qrToken: token,
        qrImageUrl: imageUrl || scannerVisitor.qrImageUrl,
      });
      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      refreshOfflineVisitorsCache({ silent: true });

      return token;
    } catch {
      toast.error("تعذر تجهيز QR لهذا الزائر.");
      return "";
    } finally {
      setShowingVisitorQrId("");
    }
  }

  async function scanVisitorFromTable(visitor: StaffVisitor) {
    const token = await getVisitorQrTokenForScan(visitor);

    if (!token) return;
    if (!validateScan(token)) return;

    setScanningVisitorId(visitor.id);

    try {
      setRawScanResult(null);
      setSelectedVisitor(null);
      setVisitorSource("scan");
      setLastOfflineSaved(false);
      isProcessingScanRef.current = true;

      await submitPayload(buildPayload(token));
    } finally {
      setScanningVisitorId("");
      isProcessingScanRef.current = false;
    }
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

  async function refreshOfflineVisitorsCache(options?: { silent?: boolean }) {
    if (!activeContext.eventId) return;

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if (!isOnline || !onlineNow) {
      if (!options?.silent) {
        toast.error("لا يوجد اتصال لتحديث مخزن الزوار.");
      }

      return;
    }

    if (isCachingVisitors) return;

    setIsCachingVisitors(true);

    try {
      const response = await getAllStaffVisitorsForOffline({
        limit: 20,
        maxPages: 500,
      });

      const items = response.visitors.items ?? [];
      const itemsWithCachedQrImages: StaffVisitor[] = [];

      for (const visitor of items) {
        const qrToken = getVisitorQrToken(visitor);

        if (qrToken) {
          try {
            const qrImageDataUrl = await createOfflineQrImageDataUrl(qrToken);

            itemsWithCachedQrImages.push({
              ...visitor,
              qrImageUrl: qrImageDataUrl,
              imageUrl: qrImageDataUrl,
              publicUrl: qrImageDataUrl,
            });

            continue;
          } catch {
            // إذا فشل توليد QR من التوكن، نجرب الصورة الموجودة من السيرفر.
          }
        }

        const remoteQrImageUrl = getVisitorQrImageUrl(visitor);

        if (!remoteQrImageUrl || remoteQrImageUrl.startsWith("data:")) {
          itemsWithCachedQrImages.push(visitor);
          continue;
        }

        try {
          const cachedAsset = await cacheScannerAsset(remoteQrImageUrl);

          itemsWithCachedQrImages.push({
            ...visitor,
            qrImageUrl: cachedAsset?.dataUrl || remoteQrImageUrl,
            imageUrl: cachedAsset?.dataUrl || remoteQrImageUrl,
            publicUrl: cachedAsset?.dataUrl || remoteQrImageUrl,
          });
        } catch {
          itemsWithCachedQrImages.push(visitor);
        }
      }

      await replaceCachedStaffVisitorsForEvent(
        activeContext.eventId,
        itemsWithCachedQrImages,
      );

      const count = await getCachedStaffVisitorsCount(activeContext.eventId);
      setCachedVisitorsCount(count);

      if (visitorSearch.trim().length >= 2) {
        const cachedSearch = await searchCachedStaffVisitors(
          activeContext.eventId,
          visitorSearch,
          20,
        );

        setOfflineVisitorsData(cachedSearch as StaffVisitorsResponse);
      }

      if (!options?.silent) {
        toast.success(`تم تحديث مخزن الزوار: ${count} زائر.`);
      }
    } catch {
      if (!options?.silent) {
        toast.error("تعذر تحديث مخزن الزوار من السيرفر.");
      }
    } finally {
      setIsCachingVisitors(false);
    }
  }

  async function submitVisitorSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const term = visitorSearchInput.trim();

    if (term.length < 2) {
      toast.error("اكتب حرفين على الأقل للبحث");
      return;
    }

    if (!activeContext.eventId) {
      toast.error("لا يوجد رقم فعالية للبحث.");
      return;
    }

    setRawScanResult(null);
    setSelectedVisitor(null);
    setLastOfflineSaved(false);
    setVisitorSearch(term);

    const cachedSearch = await searchCachedStaffVisitors(
      activeContext.eventId,
      term,
      20,
    );

    setOfflineVisitorsData(cachedSearch as StaffVisitorsResponse);

    const total = cachedSearch.visitors.total ?? 0;

    if (total === 0 && isOnline && cachedVisitorsCount === 0) {
      toast.info("جاري تحميل الزوار لأول مرة ثم إعادة البحث.");

      await refreshOfflineVisitorsCache({ silent: true });

      const retrySearch = await searchCachedStaffVisitors(
        activeContext.eventId,
        term,
        20,
      );

      setOfflineVisitorsData(retrySearch as StaffVisitorsResponse);
    }
  }

  function openCreateModal() {
    setRegisterForm({
      fullName: "",
      phone: "",
      email: "",
    });

    setRegisterAttendeeTypeId(defaultAttendeeType?.id || "");
    setRegisterCustomFields({});
    setRegisterErrors({});
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isRegistering) return;

    setCreateModalOpen(false);
  }

  function updateRegisterForm(
    key: keyof StaffScannerRegisterForm,
    value: string,
  ) {
    setRegisterForm((current) => ({
      ...current,
      [key]: value,
    }));

    setRegisterErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function updateRegisterCustomField(key: string, value: unknown) {
    setRegisterCustomFields((current) => ({
      ...current,
      [key]: value,
    }));

    setRegisterErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function validateRegisterForm() {
    const nextErrors: Record<string, string> = {};

    if (!registerAttendeeTypeId) {
      nextErrors.attendeeTypeId = "نوع الحضور مطلوب";
    }

    if (!registerForm.fullName.trim()) {
      nextErrors.fullName = "الاسم الكامل مطلوب";
    }

    if (!registerForm.phone.trim()) {
      nextErrors.phone = "رقم الهاتف مطلوب";
    }

    if (!registerForm.email.trim()) {
      nextErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^\S+@\S+\.\S+$/.test(registerForm.email.trim())) {
      nextErrors.email = "البريد الإلكتروني غير صحيح";
    }

    visibleRegisterFields.forEach((field) => {
      const value = registerCustomFields[field.key];

      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        value === false;

      if (field.isRequired && isEmpty) {
        nextErrors[field.key] =
          `${field.labelAr || field.labelEn || field.key} مطلوب`;
      }
    });

    setRegisterErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function submitRegisterForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateRegisterForm()) return;

    if (!activeContext.eventId) {
      toast.error("لا يوجد رقم فعالية لتسجيل الزائر.");
      return;
    }

    const attendeeType = attendeeTypes.find(
      (type) => type.id === registerAttendeeTypeId,
    );

    const customFields = cleanCustomFields(
      visibleRegisterFields,
      registerCustomFields,
    );

    const payload = {
      attendeeTypeId: registerAttendeeTypeId,
      fullName: registerForm.fullName.trim(),
      phone: registerForm.phone.trim(),
      email: registerForm.email.trim(),
      customFields,
    };

    async function saveOfflineVisitor() {
      const now = new Date().toISOString();

      const localId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `offline-visitor-${crypto.randomUUID()}`
          : `offline-visitor-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;

      const operationId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `visitor-registration-${crypto.randomUUID()}`
          : `visitor-registration-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;

      const publicId = `OFFLINE-${Date.now().toString().slice(-8)}`;

      const offlineQrToken = createOfflineVisitorQrToken({
        eventId: activeContext.eventId,
        localId,
        operationId,
        publicId,
        fullName: payload.fullName,
        createdAtDevice: now,
      });

      const offlineQrImageUrl =
        await createOfflineQrImageDataUrl(offlineQrToken);

      const { visitor } = await addOfflineVisitorRegistration({
        eventId: activeContext.eventId,
        payload,
        attendeeType,
        localId,
        operationId,
        publicId,
        createdAtDevice: now,
        offlineQrToken,
        offlineQrImageUrl,
      });

      await refreshPendingCount();

      toast.warning(
        "تم تسجيل الزائر محليًا وتجهيز QR للطباعة. سيتم رفعه عند المزامنة.",
      );

      setCreateModalOpen(false);
      setRawScanResult(null);
      setSelectedVisitor(getVisitorInfoFromStaffVisitor(visitor));
      setVisitorSource("created");
      setLastOfflineSaved(false);

      setVisitorSearchInput(visitor.publicId || visitor.fullName);
      setVisitorSearch(visitor.publicId || visitor.fullName);

      setOfflineVisitorsData((current) => {
        const currentItems = current?.visitors?.items ?? [];

        return {
          event: current?.event || {
            id: activeContext.eventId,
          },
          visitors: {
            items: [visitor, ...currentItems],
            page: 1,
            limit: 20,
            total: currentItems.length + 1,
            totalPages: 1,
          },
        };
      });
    }

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if (!isOnline || !onlineNow) {
      await saveOfflineVisitor();
      return;
    }

    setIsSubmittingVisitorRegistration(true);

    try {
      const data = await registerToPublicEvent(activeContext.eventId, payload);

      const visitor = buildVisitorFromRegisterResponse(data, {
        attendeeTypeId: registerAttendeeTypeId,
        attendeeType,
        fullName: registerForm.fullName.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim(),
        customFields,
      });

      toast.success("تم تسجيل الزائر بنجاح");

      setCreateModalOpen(false);
      setRawScanResult(null);
      setSelectedVisitor(visitor);
      setVisitorSource("created");
      setLastOfflineSaved(false);

      setVisitorSearchInput(visitor.publicId || visitor.fullName);
      setVisitorSearch(visitor.publicId || visitor.fullName);

      refreshOfflineVisitorsCache({ silent: true });
    } catch (error) {
      // إذا الخطأ Network Error / ERR_INTERNET_DISCONNECTED
      // نخزن الزائر أوفلاين بدل ما نفشل العملية.
      if (!hasHttpResponse(error)) {
        await saveOfflineVisitor();
        return;
      }

      toast.error("تعذر تسجيل الزائر. تحقق من البيانات أو صلاحيات التسجيل.");
    } finally {
      setIsSubmittingVisitorRegistration(false);
    }
  }

  async function scanDisplayVisitor() {
    if (!displayVisitor) return;

    const token = cardQrToken || displayVisitor.qrToken || "";

    if (!validateScan(token)) return;

    setRawScanResult(null);
    setSelectedVisitor(null);
    setVisitorSource("scan");
    setLastOfflineSaved(false);
    isProcessingScanRef.current = true;

    await submitPayload(buildPayload(token));
  }

  async function showVisitorQr(visitor: StaffVisitor) {
    if (!visitor.id) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");
      return;
    }

    const existingToken = getVisitorQrToken(visitor);
    const existingImageUrl = getVisitorQrImageUrl(visitor);

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if ((!isOnline || !onlineNow) && existingToken) {
      const scannerVisitor = getVisitorInfoFromStaffVisitor(visitor);

      setRawScanResult(null);
      setSelectedVisitor({
        ...scannerVisitor,
        qrToken: existingToken,
        qrImageUrl:
          existingImageUrl ||
          (await createOfflineQrImageDataUrl(existingToken)),
      });
      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      toast.success("تم تجهيز QR من المخزن المحلي");
      return;
    }

    setShowingVisitorQrId(visitor.id);

    try {
      const response = await generateStaffVisitorQr(visitor.id);

      const scannerVisitor = getVisitorInfoFromStaffVisitor(visitor);

      const qrToken =
        getQrTokenFromQrResponse(response) ||
        getQrTokenFromQrResponse(response.qr) ||
        scannerVisitor.qrToken ||
        "";

      const qrImageUrl =
        getQrImageFromQrResponse(response) ||
        getQrImageFromQrResponse(response.qr) ||
        scannerVisitor.qrImageUrl ||
        "";

      setRawScanResult(null);
      setSelectedVisitor({
        ...scannerVisitor,
        qrToken,
        qrImageUrl,
      });
      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      toast.success("تم تجهيز QR للزائر");
      refreshOfflineVisitorsCache({ silent: true });
    } catch {
      if (existingToken) {
        const scannerVisitor = getVisitorInfoFromStaffVisitor(visitor);

        setRawScanResult(null);
        setSelectedVisitor({
          ...scannerVisitor,
          qrToken: existingToken,
          qrImageUrl:
            existingImageUrl ||
            (await createOfflineQrImageDataUrl(existingToken)),
        });
        setVisitorSource("lookup");
        setLastOfflineSaved(false);

        toast.success("تم تجهيز QR من المخزن المحلي");
        return;
      }

      toast.error("تعذر تجهيز QR لهذا الزائر.");
    } finally {
      setShowingVisitorQrId("");
    }
  }

  async function generateQrForDisplayVisitor() {
    if (!displayRegistrationId) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");
      return;
    }

    setShowingVisitorQrId(displayRegistrationId);

    try {
      const response = await generateStaffVisitorQr(displayRegistrationId);

      const qrToken = getQrTokenFromQrResponse(response);
      const qrImageUrl = getQrImageFromQrResponse(response);

      if (displayVisitor) {
        setSelectedVisitor({
          ...displayVisitor,
          qrToken: qrToken || displayVisitor.qrToken,
          qrImageUrl: qrImageUrl || displayVisitor.qrImageUrl,
        });
      }

      toast.success("تم تجهيز QR للزائر");
    } catch {
      toast.error("تعذر تجهيز QR لهذا الزائر.");
    } finally {
      setShowingVisitorQrId("");
    }
  }

  async function openBadgePreview(
    registrationId: string,
    visitor?: StaffVisitor,
  ) {
    if (!registrationId) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");
      return;
    }

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    async function openOfflineBadgePreview() {
      if (!visitor) {
        toast.error("لا توجد بيانات محلية كافية لطباعة البادج.");
        return;
      }

      const cachedTemplate = activeContext.eventId
        ? await getCachedStaffBadgeTemplate(activeContext.eventId)
        : null;

      if (!cachedTemplate?.template) {
        toast.warning(
          "لا يوجد قالب بادج محفوظ محليًا. افتح معاينة بادج مرة واحدة Online حتى يتم حفظ القالب.",
        );
      }

      const qrToken = getVisitorQrToken(visitor);
      let qrImageUrl = getVisitorQrImageUrl(visitor);

      if (!qrImageUrl && qrToken) {
        qrImageUrl = await createOfflineQrImageDataUrl(qrToken);
      }

      setBadgePreviewData({
        template: cachedTemplate?.template ?? null,
        registration: {
          ...visitor,
          qrImageUrl,
        },
        qr: {
          qrToken,
          token: qrToken,
          qrImageUrl,
          imageUrl: qrImageUrl,
          publicUrl: qrImageUrl,
          status: "OFFLINE_CACHED",
        },
        fields: getExtraFields(
          visitor.customFields ?? {},
          registrationFields,
        ).map((field) => ({
          key: field.key,
          label: field.label,
          labelAr: field.label,
          value: field.value,
        })),
      });

      setBadgePreviewVisitor({
        ...visitor,
        qrImageUrl,
      });

      setBadgePreviewOpen(true);
    }

    if (!isOnline || !onlineNow) {
      await openOfflineBadgePreview();
      return;
    }

    setPrintingVisitorId(registrationId);

    try {
      if (!activeContext.eventId) {
        toast.error("لا يوجد رقم فعالية لجلب البادج.");
        return;
      }

      const badgeData = await getStaffVisitorBadge(
        activeContext.eventId,
        registrationId,
      );

      await saveCachedStaffBadgeTemplate(
        activeContext.eventId,
        badgeData.template,
      );

      setBadgePreviewData(badgeData);
      setBadgePreviewVisitor(visitor || null);
      setBadgePreviewOpen(true);
    } catch {
      if (visitor) {
        await openOfflineBadgePreview();
        return;
      }

      toast.error("تعذر جلب بيانات البادج للطباعة.");
    } finally {
      setPrintingVisitorId("");
    }
  }

  async function printVisitorBadge(visitor: StaffVisitor) {
    await openBadgePreview(visitor.id, visitor);
  }

  async function printDisplayVisitorBadge() {
    if (!displayVisitor) return;

    await openBadgePreview(displayRegistrationId, {
      id: displayRegistrationId,
      publicId: displayVisitor.publicId ?? null,
      fullName: displayVisitor.fullName,
      phone: displayVisitor.phone ?? null,
      email: displayVisitor.email ?? null,
      status: displayVisitor.status ?? null,
      customFields: displayVisitor.customFields ?? {},
      attendeeType: {
        id: "",
        code: displayVisitor.attendeeTypeCode ?? null,
        nameAr: displayVisitor.attendeeTypeName ?? null,
        nameEn: displayVisitor.attendeeTypeName ?? null,
      },
      qrToken: displayVisitor.qrToken ?? null,
      qrImageUrl: displayVisitor.qrImageUrl ?? null,
    });
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
    setRawScanResult(null);
    setSelectedVisitor(null);
    setVisitorSource("scan");
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

  async function startNewScan() {
    clearScanResult();
    await startCamera();
  }

  if (
    (assignmentQuery.isLoading || startMySessionMutation.isPending) &&
    !cachedContext
  ) {
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

  if (assignmentQuery.isError && !cachedContext) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-100 text-red-700">
            <XCircle className="h-11 w-11" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-[#4B4B4B]">
            لا يوجد تكليف محفوظ
          </h1>

          <p className="mt-2 text-sm font-bold leading-7 text-[#4B4B4B]/60">
            افتح صفحة السكانر مرة واحدة أثناء وجود اتصال حتى يتم حفظ التكليف
            وتشغيل وضع Offline.
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
    <>
      <main
        className="min-h-screen px-3 py-5 sm:px-5 lg:px-8"
        style={pageStyle}
      >
        <div className="mx-auto max-w-7xl space-y-5">
          <StaffScannerHeader
            theme={theme}
            logoUrl={logoUrl}
            eventTitle={activeContext.eventTitle}
            checkpointName={activeContext.checkpointName}
            deviceLabel={activeContext.deviceLabel}
            isOnline={isOnline}
            isReady={isReady}
            pendingCount={pendingCount}
            scanType={scanType}
          />

          <section className="flex flex-col gap-3 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#2F3137]">
                المزامنة المحلية
              </p>

              <p className="mt-1 text-xs font-bold text-[#2F3137]/50">
                العمليات غير المرفوعة: {pendingCount}
              </p>
            </div>

            <Button
              variant="outline"
              disabled={!isOnline || isSyncingQueue || pendingCount === 0}
              onClick={syncOfflineQueue}
            >
              {isSyncingQueue ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              مزامنة الآن
            </Button>
          </section>

          <section className="grid gap-5">
            <StaffCameraPanel
              theme={theme}
              isReady={isReady}
              isSubmitting={isSubmittingScan}
              isCameraOpen={isCameraOpen}
              isCameraStarting={isCameraStarting}
              cameraError={cameraError}
              videoRef={videoRef}
              onStart={startCamera}
              onStop={stopCamera}
              onRefresh={refreshPendingCount}
              onNewScan={startNewScan}
            />

            {lastOfflineSaved ? (
              <section
                className="border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold leading-7 text-amber-800"
                style={{ borderRadius: theme.radius }}
              >
                تم حفظ عملية المسح محليًا بسبب عدم وجود اتصال. سيتم رفعها عند
                المزامنة.
              </section>
            ) : null}

            <StaffVisitorsPanel
              theme={theme}
              searchInput={visitorSearchInput}
              setSearchInput={setVisitorSearchInput}
              onSearch={submitVisitorSearch}
              isFetching={isCachingVisitors}
              isError={false}
              searchEnabled={visitorSearchEnabled}
              visitors={searchedVisitors}
              registrationFields={registrationFields}
              onCreate={openCreateModal}
              onPrint={printVisitorBadge}
              onGenerateQr={showVisitorQr}
              onScan={scanVisitorFromTable}
              generatingVisitorId={showingVisitorQrId}
              scanningVisitorId={scanningVisitorId}
              printingVisitorId={printingVisitorId}
            />

            {displayVisitor ? (
              <section
                className="overflow-hidden  shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
                style={{
                  borderRadius: `calc(${theme.radius} + 0.5rem)`,
                }}
              >
                <StaffVisitorCard
                  source={visitorSource}
                  theme={theme}
                  visitor={displayVisitor}
                  eventTitle={activeContext.eventTitle}
                  checkpointName={activeContext.checkpointName}
                  qrImageUrl={cardQrImageUrl}
                  qrToken={cardQrToken}
                  extraFields={displayExtraFields}
                  isGeneratingQr={showingVisitorQrId === displayRegistrationId}
                  isSubmittingScan={isSubmittingScan}
                  isPrintingBadge={printingVisitorId === displayRegistrationId}
                  canScan={Boolean(
                    (cardQrToken || displayRegistrationId) && isReady,
                  )}
                  onScan={visitorSource === "scan" ? null : scanDisplayVisitor}
                  onGenerateQr={generateQrForDisplayVisitor}
                  onPrintBadge={printDisplayVisitorBadge}
                  onClear={clearScanResult}
                />
              </section>
            ) : null}
          </section>
        </div>
      </main>

      <StaffCreateVisitorModal
        open={createModalOpen}
        theme={theme}
        attendeeTypes={attendeeTypes}
        attendeeTypeId={registerAttendeeTypeId}
        form={registerForm}
        customFields={registerCustomFields}
        visibleFields={visibleRegisterFields}
        errors={registerErrors}
        isSubmitting={isRegistering}
        onClose={closeCreateModal}
        onSubmit={submitRegisterForm}
        onAttendeeTypeChange={(value) => {
          setRegisterAttendeeTypeId(value);
          setRegisterCustomFields({});
          setRegisterErrors({});
        }}
        onFormChange={updateRegisterForm}
        onCustomChange={updateRegisterCustomField}
      />

      <StaffBadgePreviewModal
        open={badgePreviewOpen}
        theme={theme}
        data={badgePreviewData}
        visitor={badgePreviewVisitor}
        eventTitle={activeContext.eventTitle}
        onClose={() => {
          setBadgePreviewOpen(false);
          setBadgePreviewData(null);
          setBadgePreviewVisitor(null);
        }}
      />
    </>
  );
}
