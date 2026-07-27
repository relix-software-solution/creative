"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import {
  getSavedStaffScannerContext,
  saveStaffScannerContext,
} from "@/lib/offline/staff-scanner-context";
import { Loader2, RefreshCw, Usb, XCircle } from "lucide-react";
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
import { usePublicEvent } from "@/features/public-events/public-events.queries";
import { useCreateScan } from "@/features/scans/scans.queries";
import { CreateScanPayload, ScanResult } from "@/features/scans/scans.types";
import {
  useMyStaffAssignment,
  useStartMyStaffSession,
} from "@/features/staff/staff.queries";
import { StaffSession } from "@/features/staff/staff.types";
import {
  generateStaffVisitorQr,
  StaffVisitorBadgeResponse,
  updateStaffVisitor,
  UpdateStaffVisitorPayload,
} from "@/features/staff-visitors/staff-visitors.api";
import {
  StaffVisitor,
  StaffVisitorsResponse,
} from "@/features/staff-visitors/staff-visitors.queries";
import { StaffBadgePreviewModal } from "@/features/staff-scanner/components/StaffBadgePreviewModal";
import { StaffCameraPanel } from "@/features/staff-scanner/components/StaffCameraPanel";
import { StaffCreateVisitorModal } from "@/features/staff-scanner/components/StaffCreateVisitorModal";
import { StaffScannerHeader } from "@/features/staff-scanner/components/StaffScannerHeader";
import { StaffVisitorCard } from "@/features/staff-scanner/components/StaffVisitorCard";
import { StaffVisitorsPanel } from "@/features/staff-scanner/components/StaffVisitorsPanel";
import { StaffEditVisitorModal } from "@/features/staff-scanner/components/StaffEditVisitorModal";
import {
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
  getPublicEventInfo,
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
  getCachedPublicEvent,
  getCachedScannerAsset,
  getCachedStaffVisitorsCount,
  getPendingOfflineWorkCount,
  getPermanentFailedOfflineWorkCount,
  searchCachedStaffVisitors,
  downloadStaffVisitorsSnapshot,
  getCachedStaffVisitorsSnapshot,
  StaffVisitorsSnapshotStatus,
  syncQueuedScans,
  syncQueuedVisitorRegistrations,
  getCachedStaffBadgeTemplate,
  queueStaffVisitorUpdate,
  syncQueuedStaffVisitorUpdates,
  findCachedStaffVisitorByQr,
  saveCachedStaffVisitorQr,
} from "@/lib/offline/staff-scanner-db";
import { useDeviceStore } from "@/stores/device-store";
import { createOfflineQrImageDataUrl } from "@/lib/offline/staff-offline-qr-image";
import { createOfflineVisitorQrToken } from "@/lib/offline/staff-offline-qr";
import {
  provisionMyAssignedDeviceOfflineKey,
  syncOfflineStaffRegistration,
} from "@/features/staff-offline/staff-offline.api";
import { prepareStaffDeviceOfflineKey } from "@/lib/offline/staff-device-offline-key";

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
  const isSyncingQueueRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const visitorResultRef = useRef<HTMLElement | null>(null);
  const startedSessionRef = useRef(false);
  const isProcessingScanRef = useRef(false);
  const [isSubmittingVisitorRegistration, setIsSubmittingVisitorRegistration] =
    useState(false);

  const [isCachingVisitors, setIsCachingVisitors] = useState(false);
  const isCachingVisitorsRef = useRef(false);

  const lastVisitorsServerRefreshRef = useRef(0);

  const visitorsServerRefreshPromiseRef = useRef<Promise<void> | null>(null);

  const [cachedVisitorsCount, setCachedVisitorsCount] = useState(0);

  const [visitorSnapshotTotal, setVisitorSnapshotTotal] = useState<
    number | null
  >(null);

  const [visitorSnapshotStatus, setVisitorSnapshotStatus] =
    useState<StaffVisitorsSnapshotStatus>("IDLE");

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
  const [permanentFailedCount, setPermanentFailedCount] = useState(0);
  const [lastOfflineSaved, setLastOfflineSaved] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [hardwareScannerEnabled, setHardwareScannerEnabled] = useState(true);

  const [hardwareScannerReading, setHardwareScannerReading] = useState(false);

  const hardwareScannerBufferRef = useRef("");

  const hardwareScannerLastKeyAtRef = useRef(0);

  const hardwareScannerTimerRef = useRef<number | null>(null);

  const [visitorSearchInput, setVisitorSearchInput] = useState("");
  const [visitorSearch, setVisitorSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editingVisitor, setEditingVisitor] = useState<StaffVisitor | null>(
    null,
  );

  const [isUpdatingVisitor, setIsUpdatingVisitor] = useState(false);

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

  const assignmentQuery = useMyStaffAssignment(isOnline);
  const startMySessionMutation = useStartMyStaffSession();
  const createScanMutation = useCreateScan();

  const assignment = assignmentQuery.data ?? null;

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

  const scanType = useMemo(() => {
    return getDefaultScanType(assignment, activeContext.checkpointType);
  }, [assignment, activeContext.checkpointType]);

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

  const isReady = Boolean(
    activeContext.eventId &&
    activeContext.checkpointId &&
    activeContext.deviceId &&
    activeContext.staffSessionId,
  );

  const isSubmittingScan = createScanMutation.isPending;
  const isRegistering = isSubmittingVisitorRegistration;

  const scanVisitor: StaffScannerVisitor | null = useMemo(() => {
    if (!rawScanResult) return null;

    return getVisitorInfoFromScan(rawScanResult);
  }, [rawScanResult]);

  const displayVisitor = selectedVisitor || scanVisitor;

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

  function isEditableScanTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    );
  }

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
    if (!hardwareScannerEnabled) {
      return;
    }

    const MAX_KEY_GAP_MS = 150;
    const IDLE_SUBMIT_MS = 180;
    const MIN_TOKEN_LENGTH = 8;

    function clearHardwareBuffer() {
      hardwareScannerBufferRef.current = "";

      if (hardwareScannerTimerRef.current !== null) {
        window.clearTimeout(hardwareScannerTimerRef.current);

        hardwareScannerTimerRef.current = null;
      }
    }

    function submitHardwareBuffer() {
      const value = hardwareScannerBufferRef.current.trim();

      clearHardwareBuffer();

      if (value.length < MIN_TOKEN_LENGTH || isProcessingScanRef.current) {
        return;
      }

      setHardwareScannerReading(true);

      void handleDecodedQr(value).finally(() => {
        setHardwareScannerReading(false);
      });
    }

    function handleHardwareKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) {
        return;
      }

      /*
       * لا نتدخل عندما المستخدم يكتب داخل:
       * - البحث
       * - التسجيل
       * - التعديل
       */
      if (isEditableScanTarget(event.target)) {
        return;
      }

      const now = performance.now();

      if (now - hardwareScannerLastKeyAtRef.current > MAX_KEY_GAP_MS) {
        hardwareScannerBufferRef.current = "";
      }

      hardwareScannerLastKeyAtRef.current = now;

      /*
       * معظم أجهزة Barcode Scanner ترسل Enter
       * بعد نهاية القراءة.
       */
      if (event.key === "Enter" || event.key === "Tab") {
        if (hardwareScannerBufferRef.current) {
          event.preventDefault();
          submitHardwareBuffer();
        }

        return;
      }

      /*
       * نستقبل الأحرف القابلة للطباعة فقط.
       */
      if (event.key.length !== 1) {
        return;
      }

      hardwareScannerBufferRef.current += event.key;

      if (hardwareScannerTimerRef.current !== null) {
        window.clearTimeout(hardwareScannerTimerRef.current);
      }

      /*
       * Fallback للأجهزة التي لا ترسل Enter:
       * نعالج الرمز بعد توقف إرسال الأحرف.
       */
      hardwareScannerTimerRef.current = window.setTimeout(() => {
        submitHardwareBuffer();
      }, IDLE_SUBMIT_MS);
    }

    window.addEventListener("keydown", handleHardwareKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleHardwareKeyDown, true);

      clearHardwareBuffer();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hardwareScannerEnabled,
    isReady,
    isOnline,
    activeContext.eventId,
    activeContext.deviceId,
    activeContext.staffSessionId,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let lastKnownOnline = navigator.onLine;

    async function checkConnectionAndSync() {
      const onlineNow = navigator.onLine;

      setIsOnline(onlineNow);

      if (onlineNow && !lastKnownOnline) {
        await syncOfflineQueue();
      }

      lastKnownOnline = onlineNow;
    }

    function handleFocus() {
      void checkConnectionAndSync();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkConnectionAndSync();
      }
    }

    const intervalId = window.setInterval(() => {
      void checkConnectionAndSync();
    }, 5000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isReady,
    activeContext.eventId,
    activeContext.deviceId,
    activeContext.staffSessionId,
  ]);

  useEffect(() => {
    if (!isOnline) return;
    if (!isReady) return;
    if (!activeContext.deviceId) return;

    let cancelled = false;

    async function prepareOfflineSigning() {
      try {
        await prepareStaffDeviceOfflineKey({
          deviceId: activeContext.deviceId,
          online: true,
          provisionPublicKey: provisionMyAssignedDeviceOfflineKey,
        });

        if (!cancelled) {
          console.info("Staff offline signing key is ready.");
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Could not prepare offline signing key:", error);
        }
      }
    }

    void prepareOfflineSigning();

    return () => {
      cancelled = true;
    };
  }, [isOnline, isReady, activeContext.deviceId]);

  useEffect(() => {
    if (!isOnline || !isReady) return;
    if (!activeContext.staffSessionId) return;
    if (!staffSession?.id && !cachedContext?.staffSessionId) return;

    const timer = window.setTimeout(() => {
      void syncOfflineQueue();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnline,
    isReady,
    activeContext.eventId,
    activeContext.deviceId,
    activeContext.staffSessionId,
  ]);

  useEffect(() => {
    if (!isOnline || !isReady || !activeContext.eventId) {
      return;
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshVisitorsFromServer({
          silent: true,
        });
      }
    }

    /*
     * تحديث عند فتح الصفحة.
     */
    refreshWhenVisible();

    /*
     * تحديث كل دقيقة لجلب تسجيلات:
     * - الأدمن
     * - أجهزة الستاف الأخرى
     * - عمليات الحذف
     */
    const intervalId = window.setInterval(refreshWhenVisible, 60_000);

    window.addEventListener("focus", refreshWhenVisible);

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener("focus", refreshWhenVisible);

      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnline,
    isReady,
    activeContext.eventId,
    activeContext.deviceId,
    activeContext.staffSessionId,
  ]);

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

    cachePublicEventForStaffScanner(
      activeContext.eventId,
      onlineEventData,
    ).then(() => {
      if (!cancelled) {
        setCachedEventData(onlineEventData);
      }
    });

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

    const abortController = new AbortController();

    const timer = window.setTimeout(() => {
      void refreshOfflineVisitorsCache({
        silent: true,
        signal: abortController.signal,
      });
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnline,
    activeContext.eventId,
    activeContext.deviceId,
    activeContext.staffSessionId,
    isReady,
  ]);

  useEffect(() => {
    if (!activeContext.eventId) return;

    let cancelled = false;

    async function loadCachedVisitorsState() {
      const [count, snapshot] = await Promise.all([
        getCachedStaffVisitorsCount(activeContext.eventId),
        getCachedStaffVisitorsSnapshot(activeContext.eventId),
      ]);

      if (cancelled) return;

      setCachedVisitorsCount(count);
      setVisitorSnapshotTotal(snapshot?.totalCount ?? null);
      setVisitorSnapshotStatus(snapshot?.status ?? "IDLE");
    }

    void loadCachedVisitorsState();

    return () => {
      cancelled = true;
    };
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
    /*
     * لا نبدأ جلسة جديدة أثناء Offline.
     * عند الأوفلاين نستخدم staffSessionId المحفوظ في cachedContext.
     */
    if (!isOnline) return;
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

        window.setTimeout(() => {
          void syncOfflineQueue();
        }, 500);
      },

      onError: () => {
        startedSessionRef.current = false;
      },
    });
  }, [isOnline, assignment, setScannerContext, startMySessionMutation]);

  async function refreshPendingCount() {
    const [pending, permanentFailed] = await Promise.all([
      getPendingOfflineWorkCount(),
      getPermanentFailedOfflineWorkCount(),
    ]);

    setPendingCount(pending);
    setPermanentFailedCount(permanentFailed);
  }

  async function reloadCurrentVisitorResults(options?: {
    fallbackSearch?: string;
  }) {
    if (!activeContext.eventId) {
      return;
    }

    const currentSearch =
      visitorSearchInput.trim() ||
      visitorSearch.trim() ||
      options?.fallbackSearch?.trim() ||
      "";

    const cachedSearch = await searchCachedStaffVisitors(
      activeContext.eventId,
      currentSearch,
      20,
    );

    setOfflineVisitorsData(cachedSearch as StaffVisitorsResponse);

    /*
     * نحافظ على قيمة البحث الفعلية فقط.
     * لا نضع publicId المحلي OFFLINE-* تلقائيًا.
     */
    if (currentSearch) {
      setVisitorSearchInput(currentSearch);
      setVisitorSearch(currentSearch);
    }
  }

  async function syncOfflineQueue() {
    if (isSyncingQueueRef.current) {
      return;
    }

    if (!navigator.onLine) {
      toast.error("لا يوجد اتصال للمزامنة.");
      return;
    }

    // if (!isReady) {
    //   toast.error("جلسة السكانر غير جاهزة للمزامنة بعد.");
    //   return;
    // }

    isSyncingQueueRef.current = true;
    setIsSyncingQueue(true);

    try {
      /*
       * الترتيب مهم:
       *
       * 1. التسجيلات المحلية
       * 2. تعديلات الزوار
       * 3. السكانات
       */
      const visitorResult = await syncQueuedVisitorRegistrations({
        registerVisitor: (eventId, payload) =>
          syncOfflineStaffRegistration({
            eventId,
            deviceId: activeContext.deviceId,
            staffSessionId: activeContext.staffSessionId,
            deviceApiKey: activeDeviceApiKey,
            payload,
          }),
      });

      if (visitorResult.busy) {
        await refreshPendingCount();

        toast.info("المزامنة جارية حاليًا في تبويب أو جهاز آخر.");

        return;
      }

      /*
       * نعيد تحميل IndexedDB فورًا.
       *
       * syncQueuedVisitorRegistrations يستبدل:
       * offline-visitor-* بالـID الرسمي،
       * ويحدّث الحالة والـQR محليًا.
       */
      if (
        visitorResult.synced > 0 ||
        visitorResult.failed > 0 ||
        visitorResult.permanentFailed > 0
      ) {
        await reloadCurrentVisitorResults();
      }

      const visitorUpdateResult = await syncQueuedStaffVisitorUpdates({
        updateVisitor: updateStaffVisitor,
      });

      if (visitorUpdateResult.busy) {
        await refreshPendingCount();
        await reloadCurrentVisitorResults();

        toast.info(
          "تمت معالجة التسجيلات، وتوجد مزامنة أخرى مسؤولة عن تعديلات الزوار.",
        );

        return;
      }

      if (
        visitorUpdateResult.synced > 0 ||
        visitorUpdateResult.failed > 0 ||
        visitorUpdateResult.permanentFailed > 0
      ) {
        await reloadCurrentVisitorResults();
      }

      const scanResult = await syncQueuedScans({
        submitScan: (payload) =>
          createScanMutation.mutateAsync({
            payload,
            deviceApiKey: activeDeviceApiKey,
          }),
      });

      await refreshPendingCount();

      /*
       * نحدّث النتائج المحلية قبل تنزيل Snapshot جديد.
       * هذا يمنع بقاء بطاقة React على نسخة قديمة.
       */
      await reloadCurrentVisitorResults();

      /*
       * تنزيل Snapshot يتم بعد تحديث الواجهة المحلية.
       * LOCAL_SYNCED يبقى محميًا عندك لمدة 24 ساعة،
       * لذلك لن يختفي التسجيل بسبب تأخر Snapshot السيرفر.
       */
      if (visitorResult.synced > 0 || visitorUpdateResult.synced > 0) {
        try {
          await refreshOfflineVisitorsCache({
            silent: true,
          });

          await reloadCurrentVisitorResults();
        } catch (error) {
          console.warn(
            "Could not refresh visitors snapshot after sync:",
            error,
          );
        }
      }

      if (scanResult.busy) {
        toast.info(
          "تمت معالجة التسجيلات، وتوجد مزامنة أخرى مسؤولة عن السكانات.",
        );

        return;
      }

      const total =
        visitorResult.total + visitorUpdateResult.total + scanResult.total;

      const synced =
        visitorResult.synced + visitorUpdateResult.synced + scanResult.synced;

      const retryableFailed =
        visitorResult.failed + visitorUpdateResult.failed + scanResult.failed;

      const permanentFailed =
        visitorResult.permanentFailed +
        visitorUpdateResult.permanentFailed +
        scanResult.permanentFailed;

      const skipped =
        visitorResult.skipped +
        visitorUpdateResult.skipped +
        scanResult.skipped;

      if (total === 0 && skipped === 0) {
        toast.info("لا توجد عمليات معلقة للمزامنة.");
        return;
      }

      if (permanentFailed > 0) {
        toast.error(
          synced > 0
            ? `تمت مزامنة ${synced} عملية، وتعذر نهائيًا رفع ${permanentFailed} عملية. راجع الهاتف والبريد المكررين.`
            : `تعذر رفع ${permanentFailed} عملية نهائيًا. قد يكون الهاتف أو البريد مسجلًا مسبقًا.`,
        );

        return;
      }

      if (retryableFailed > 0) {
        toast.warning(
          `تمت مزامنة ${synced} عملية، وستتم إعادة محاولة ${retryableFailed} عملية لاحقًا.`,
        );

        return;
      }

      if (synced > 0) {
        toast.success(`تمت مزامنة ${synced} عملية بنجاح.`);

        return;
      }

      if (skipped > 0) {
        toast.warning(
          `تم تجاوز ${skipped} عملية لعدم اكتمال بياناتها المحلية.`,
        );
      }
    } catch (error) {
      console.error("Offline queue synchronization failed:", error);

      await refreshPendingCount();
      await reloadCurrentVisitorResults();

      toast.error("تعذر إكمال المزامنة المحلية.");
    } finally {
      isSyncingQueueRef.current = false;
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

  function buildPayload(
    token: string,
    registrationId?: string | null,
  ): CreateScanPayload {
    return {
      operationId: createOperationId(),
      eventId: activeContext.eventId,
      deviceId: activeContext.deviceId,
      staffSessionId: activeContext.staffSessionId,
      checkpointId: activeContext.checkpointId,
      qrToken: token.trim(),
      registrationId: registrationId || undefined,
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

  function toServerScanPayload(payload: CreateScanPayload): CreateScanPayload {
    /*
     * registrationId حقل مساعد محلي داخل IndexedDB.
     * السيرفر يستخرج registrationId من QR بعد التحقق منه،
     * لذلك لا نرسله إلى CreateScanDto.
     */
    return {
      operationId: payload.operationId,

      eventId: payload.eventId,
      deviceId: payload.deviceId,
      staffSessionId: payload.staffSessionId,
      checkpointId: payload.checkpointId,

      qrToken: payload.qrToken,

      type: payload.type,
      scannedAtDevice: payload.scannedAtDevice,

      payload: payload.payload,
    };
  }

  function revealVisitorResult() {
    window.setTimeout(() => {
      visitorResultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function prepareScannedVisitorPreview(
    visitor: StaffVisitor,
    scannedQrToken: string,
  ): Promise<StaffScannerVisitor> {
    const preview = getVisitorInfoFromStaffVisitor(visitor);

    const token = scannedQrToken.trim() || preview.qrToken || "";

    const storedToken = getVisitorQrToken(visitor);

    /*
     * لا نستعمل صورة محفوظة تخص توكنًا مختلفًا.
     */
    let qrImageUrl = storedToken === token ? getVisitorQrImageUrl(visitor) : "";

    if (!qrImageUrl && token) {
      try {
        qrImageUrl = await createOfflineQrImageDataUrl(token);
      } catch {
        qrImageUrl = "";
      }
    }

    return {
      ...preview,

      qrToken: token,

      qrImageUrl: qrImageUrl || preview.qrImageUrl || "",
    };
  }

  async function submitPayload(
    originalPayload: CreateScanPayload,
    knownVisitor?: StaffVisitor | null,
  ) {
    const cachedVisitor =
      knownVisitor ??
      (await findCachedStaffVisitorByQr(
        activeContext.eventId,
        originalPayload.qrToken,
      ));

    const preview = cachedVisitor
      ? await prepareScannedVisitorPreview(
          cachedVisitor,
          originalPayload.qrToken,
        )
      : null;

    const payload: CreateScanPayload =
      cachedVisitor && !originalPayload.registrationId
        ? {
            ...originalPayload,
            registrationId: cachedVisitor.id,
          }
        : originalPayload;

    /*
     * نظهر الزائر فورًا من IndexedDB، قبل انتظار الشبكة.
     */
    if (preview) {
      setRawScanResult(null);
      setSelectedVisitor(preview);

      setVisitorSource(isOnline ? "scan" : "offline-scan");

      setLastOfflineSaved(false);

      revealVisitorResult();
    }

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if (!isOnline || !onlineNow) {
      await addScanToQueue(payload);
      await refreshPendingCount();

      setRawScanResult(null);

      if (preview) {
        setSelectedVisitor(preview);
        setVisitorSource("offline-scan");
        setLastOfflineSaved(false);

        toast.success(
          `تم التعرف على ${preview.fullName} وحفظ عملية الدخول محليًا.`,
        );
      } else {
        setSelectedVisitor(null);
        setLastOfflineSaved(true);

        toast.warning(
          "تم حفظ عملية المسح محليًا، لكن الرمز غير موجود في مخزن الزوار على هذا الجهاز.",
        );
      }

      isProcessingScanRef.current = false;

      return;
    }

    try {
      const data = await createScanMutation.mutateAsync({
        payload: toServerScanPayload(payload),
        deviceApiKey: activeDeviceApiKey,
      });

      const responseVisitor = getVisitorInfoFromScan(data);

      const responseQrToken =
        responseVisitor.qrToken || preview?.qrToken || payload.qrToken;

      let responseQrImageUrl = responseVisitor.qrImageUrl || "";

      if (!responseQrImageUrl && responseQrToken) {
        try {
          responseQrImageUrl =
            await createOfflineQrImageDataUrl(responseQrToken);
        } catch {
          responseQrImageUrl = "";
        }
      }

      const finalVisitor: StaffScannerVisitor = {
        ...(preview ?? {}),

        ...responseVisitor,

        fullName:
          responseVisitor.fullName !== "زائر"
            ? responseVisitor.fullName
            : preview?.fullName || "زائر",

        phone: responseVisitor.phone ?? preview?.phone ?? null,

        email: responseVisitor.email ?? preview?.email ?? null,

        attendeeTypeName:
          responseVisitor.attendeeTypeName ?? preview?.attendeeTypeName ?? null,

        attendeeTypeCode:
          responseVisitor.attendeeTypeCode ?? preview?.attendeeTypeCode ?? null,

        customFields: {
          ...(preview?.customFields ?? {}),
          ...(responseVisitor.customFields ?? {}),
        },

        qrToken: responseQrToken,

        qrImageUrl: responseQrImageUrl || preview?.qrImageUrl || "",
      };

      setRawScanResult(data);
      setSelectedVisitor(finalVisitor);
      setVisitorSource("scan");
      setLastOfflineSaved(false);

      revealVisitorResult();

      isProcessingScanRef.current = false;

      if (isAllowedResult(data)) {
        toast.success(`تم السماح بدخول ${finalVisitor.fullName}.`);
      } else {
        toast.error(getResultMessage(data));
      }

      if ("vibrate" in navigator) {
        navigator.vibrate?.(isAllowedResult(data) ? 120 : [120, 80, 120]);
      }
    } catch (error) {
      if (!hasHttpResponse(error)) {
        setIsOnline(false);
        await addScanToQueue(payload);
        await refreshPendingCount();

        setRawScanResult(null);

        if (preview) {
          setSelectedVisitor(preview);
          setVisitorSource("offline-scan");
          setLastOfflineSaved(false);

          revealVisitorResult();

          toast.warning(
            `تم التعرف على ${preview.fullName}. تعذر الاتصال، لذلك حُفظت عملية الدخول محليًا.`,
          );
        } else {
          setSelectedVisitor(null);
          setLastOfflineSaved(true);

          toast.warning(
            "تعذر الاتصال بالسيرفر، وتم حفظ المسح محليًا، لكن لم نجد بيانات الزائر في المخزن.",
          );
        }
      } else {
        toast.error("تعذر تنفيذ عملية المسح على السيرفر.");
      }

      isProcessingScanRef.current = false;
    }
  }

  async function persistGeneratedVisitorQr(
    registrationId: string,
    response: unknown,
  ) {
    const qrToken = getQrTokenFromQrResponse(response);

    if (!qrToken) {
      return null;
    }

    let qrImageUrl = getQrImageFromQrResponse(response);

    /*
     * بعض endpoints ترجع Token فقط.
     * عندها ننشئ صورة QR محليًا من نفس التوكن.
     */
    if (!qrImageUrl) {
      try {
        qrImageUrl = await createOfflineQrImageDataUrl(qrToken);
      } catch {
        qrImageUrl = "";
      }
    }

    const cachedVisitor = await saveCachedStaffVisitorQr({
      eventId: activeContext.eventId,
      registrationId,
      qrToken,
      qrImageUrl,
    });

    if (cachedVisitor) {
      replaceVisitorInCurrentResults(cachedVisitor);
    }

    return {
      qrToken,
      qrImageUrl,
      cachedVisitor,
    };
  }

  async function getVisitorQrTokenForScan(visitor: StaffVisitor) {
    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    /*
     * عند Offline نستخدم التوكن المخزن فقط.
     */
    if (!isOnline || !onlineNow) {
      const cachedToken = getVisitorQrToken(visitor);

      if (!cachedToken) {
        toast.error("لا يوجد QR محفوظ لهذا الزائر.");
      }

      return cachedToken;
    }

    if (!visitor.id) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");

      return "";
    }

    setShowingVisitorQrId(visitor.id);

    try {
      /*
       * أثناء Online نطلب التوكن الرسمي من الباك.
       * QrService سيعيد نفس التوكن الفعال إن كان موجودًا.
       */
      const response = await generateStaffVisitorQr(visitor.id);

      const persisted = await persistGeneratedVisitorQr(visitor.id, response);

      if (!persisted?.qrToken) {
        toast.error("تم طلب تجهيز QR لكن السيرفر لم يرجع qrToken.");

        return "";
      }

      const effectiveVisitor = persisted.cachedVisitor ?? visitor;

      const scannerVisitor = getVisitorInfoFromStaffVisitor(effectiveVisitor);

      setRawScanResult(null);

      setSelectedVisitor({
        ...scannerVisitor,

        qrToken: persisted.qrToken,

        qrImageUrl: persisted.qrImageUrl || scannerVisitor.qrImageUrl,
      });

      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      return persisted.qrToken;
    } catch (error) {
      console.error("Could not prepare visitor QR:", error);

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

      await submitPayload(buildPayload(token, visitor.id), visitor);
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

  async function refreshOfflineVisitorsCache(options?: {
    silent?: boolean;
    forceRestart?: boolean;
    signal?: AbortSignal;
  }) {
    const currentEventId = activeContext.eventId;

    if (!currentEventId) return;

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if (!isOnline || !onlineNow) {
      setVisitorSnapshotStatus("PAUSED_OFFLINE");

      if (!options?.silent) {
        toast.error("لا يوجد اتصال لتحديث مخزن الزوار.");
      }

      return;
    }

    if (isCachingVisitorsRef.current) {
      return;
    }

    isCachingVisitorsRef.current = true;
    setIsCachingVisitors(true);
    setVisitorSnapshotStatus("DOWNLOADING");

    try {
      const result = await downloadStaffVisitorsSnapshot({
        eventId: currentEventId,
        forceRestart: options?.forceRestart,
        signal: options?.signal,

        onProgress: (progress) => {
          setCachedVisitorsCount(progress.downloadedCount);
          setVisitorSnapshotTotal(progress.totalCount);
          setVisitorSnapshotStatus(progress.status);
        },
      });

      setCachedVisitorsCount(result.downloadedCount);
      setVisitorSnapshotTotal(result.totalCount);
      setVisitorSnapshotStatus(result.status);

      if (visitorSearch.trim().length >= 2) {
        const cachedSearch = await searchCachedStaffVisitors(
          currentEventId,
          visitorSearch,
          20,
        );

        setOfflineVisitorsData(cachedSearch as StaffVisitorsResponse);
      }

      if (!options?.silent) {
        if (result.completed) {
          toast.success(
            `تم تجهيز مخزن الزوار: ${result.downloadedCount} زائر.`,
          );
        } else if (result.pausedOffline) {
          toast.info(
            `توقف التحميل مؤقتًا عند ${result.downloadedCount} زائر وسيُستكمل عند عودة الاتصال.`,
          );
        }
      }
    } catch (error) {
      const isAbortError =
        error instanceof Error && error.name === "AbortError";

      if (isAbortError) {
        return;
      }

      const browserOnline =
        typeof navigator === "undefined" ? isOnline : navigator.onLine;

      if (!browserOnline || !hasHttpResponse(error)) {
        setIsOnline(false);
        setVisitorSnapshotStatus("PAUSED_OFFLINE");

        if (!options?.silent) {
          toast.info("توقف تحميل الزوار وسيتم استكماله عند عودة الاتصال.");
        }

        return;
      }

      setVisitorSnapshotStatus("FAILED");

      console.error("Could not download visitors snapshot:", error);

      if (!options?.silent) {
        toast.error("تعذر تنزيل مخزن الزوار من السيرفر.");
      }
    } finally {
      isCachingVisitorsRef.current = false;
      setIsCachingVisitors(false);
    }
  }

  async function refreshVisitorsFromServer(options?: {
    force?: boolean;
    silent?: boolean;
  }) {
    const currentEventId = activeContext.eventId;

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    if (!isOnline || !onlineNow || !isReady || !currentEventId) {
      return;
    }

    const now = Date.now();

    if (
      !options?.force &&
      now - lastVisitorsServerRefreshRef.current < 45_000
    ) {
      return;
    }

    if (visitorsServerRefreshPromiseRef.current) {
      return visitorsServerRefreshPromiseRef.current;
    }

    const refreshTask = (async () => {
      lastVisitorsServerRefreshRef.current = Date.now();

      const snapshot = await getCachedStaffVisitorsSnapshot(currentEventId);

      /*
       * ممنوع حذف مخزن مكتمل أثناء التشغيل الطبيعي.
       *
       * إذا المخزن مكتمل نستخدمه كما هو.
       * التسجيلات المنشأة من هذا الجهاز تُضاف مباشرة
       * بواسطة cacheStaffVisitors.
       */
      if (snapshot?.status === "COMPLETED") {
        const count = await getCachedStaffVisitorsCount(currentEventId);

        setCachedVisitorsCount(count);
        setVisitorSnapshotTotal(snapshot.totalCount);
        setVisitorSnapshotStatus("COMPLETED");

        await reloadCurrentVisitorResults();

        return;
      }

      /*
       * إذا التنزيل غير مكتمل نستكمله من cursor السابق.
       * لا نبدأ من الصفر ولا نحذف البيانات الموجودة.
       */
      await refreshOfflineVisitorsCache({
        silent: options?.silent ?? true,
        forceRestart: false,
      });

      await reloadCurrentVisitorResults();
    })();

    visitorsServerRefreshPromiseRef.current = refreshTask;

    try {
      await refreshTask;
    } finally {
      if (visitorsServerRefreshPromiseRef.current === refreshTask) {
        visitorsServerRefreshPromiseRef.current = null;
      }
    }
  }

  async function submitVisitorUpdate(
    visitor: StaffVisitor,
    changes: UpdateStaffVisitorPayload,
  ) {
    if (!activeContext.eventId) {
      toast.error("لا يوجد رقم فعالية لتعديل الزائر.");
      return;
    }

    setIsUpdatingVisitor(true);

    try {
      /*
       * نحفظ محليًا أولًا دائمًا.
       *
       * بذلك:
       * - تظهر البيانات الجديدة مباشرة.
       * - تعمل الطباعة مباشرة.
       * - لا يضيع التعديل لو انقطع الإنترنت أثناء PATCH.
       */
      const localResult = await queueStaffVisitorUpdate({
        eventId: activeContext.eventId,
        registrationId: visitor.id,
        changes,
      });

      replaceVisitorInCurrentResults(localResult.visitor);

      if (
        selectedVisitor?.id === visitor.id ||
        selectedVisitor?.registrationId === visitor.id
      ) {
        setSelectedVisitor(getVisitorInfoFromStaffVisitor(localResult.visitor));
      }

      setEditingVisitor(localResult.visitor);
      setEditModalOpen(false);

      const onlineNow =
        typeof navigator === "undefined" ? isOnline : navigator.onLine;

      if (!isOnline || !onlineNow) {
        await refreshPendingCount();

        toast.warning("تم حفظ التعديل محليًا، وسيُرفع عند عودة الاتصال.");

        return;
      }

      const syncResult = await syncQueuedStaffVisitorUpdates({
        updateVisitor: updateStaffVisitor,
      });

      await refreshPendingCount();

      if (syncResult.busy) {
        toast.info("تم حفظ التعديل، وتوجد مزامنة أخرى ستقوم برفعه.");
        return;
      }

      if (syncResult.permanentFailed > 0) {
        toast.error(
          "تم حفظ التعديل محليًا، لكن يوجد تعارض مع نسخة أحدث على السيرفر.",
        );
        return;
      }

      if (syncResult.failed > 0) {
        toast.warning("تم حفظ التعديل محليًا، وستتم إعادة محاولة رفعه لاحقًا.");
        return;
      }

      if (syncResult.synced > 0) {
        const cachedSearch = visitorSearch.trim()
          ? await searchCachedStaffVisitors(
              activeContext.eventId,
              visitorSearch,
              20,
            )
          : null;

        if (cachedSearch) {
          setOfflineVisitorsData(cachedSearch as StaffVisitorsResponse);
        }

        toast.success("تم تعديل بيانات الزائر بنجاح.");
        return;
      }

      /*
       * يحصل عند تعديل تسجيل محلي جديد لم يُرفع بعد.
       * التعديل اندمج داخل عملية التسجيل نفسها.
       */
      toast.success("تم تحديث بيانات الزائر المحلية.");
    } catch (error) {
      console.error("Could not update staff visitor:", error);

      toast.error("تعذر حفظ تعديل الزائر.");
    } finally {
      setIsUpdatingVisitor(false);
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
    if (total === 0 && isOnline && visitorSnapshotStatus !== "COMPLETED") {
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

  function openEditVisitorModal(visitor: StaffVisitor) {
    setEditingVisitor(visitor);
    setEditModalOpen(true);
  }

  function closeEditVisitorModal() {
    if (isUpdatingVisitor) {
      return;
    }

    setEditModalOpen(false);
    setEditingVisitor(null);
  }

  function replaceVisitorInCurrentResults(updatedVisitor: StaffVisitor) {
    setOfflineVisitorsData((current) => {
      if (!current) {
        return current;
      }

      const currentItems = current.visitors.items ?? [];

      const exists = currentItems.some(
        (visitor) => visitor.id === updatedVisitor.id,
      );

      const items = exists
        ? currentItems.map((visitor) =>
            visitor.id === updatedVisitor.id ? updatedVisitor : visitor,
          )
        : [updatedVisitor, ...currentItems];

      return {
        ...current,

        visitors: {
          ...current.visitors,
          items,
        },
      };
    });
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

    const normalizedEmail = registerForm.email.trim();

    if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
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

  function getOfflineRegistrationValidUntil() {
    const publicEvent = getPublicEventInfo(eventData);

    const candidate = publicEvent?.qrValidUntil || publicEvent?.endsAt;

    if (candidate) {
      const parsed = new Date(candidate);

      if (
        !Number.isNaN(parsed.getTime()) &&
        parsed.getTime() > Date.now() + 60 * 60 * 1000
      ) {
        return parsed.toISOString();
      }
    }

    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  async function submitRegisterForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    if (!activeContext.eventId) {
      toast.error("لا يوجد رقم فعالية لتسجيل الزائر.");
      return;
    }

    if (!activeContext.deviceId) {
      toast.error("بيانات جهاز السكانر غير مكتملة.");
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

      email: registerForm.email.trim() || undefined,

      customFields,
    };

    /*
     * جميع تسجيلات الستاف تبدأ محليًا، سواء كان الجهاز:
     * - Online
     * - Offline
     *
     * وبذلك نحصل دائمًا على نفس QR الموقّع،
     * ثم يُرفع التسجيل لاحقًا دون تغيير الرمز المطبوع.
     */
    async function saveOfflineVisitor() {
      const now = new Date().toISOString();

      const localId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `offline-visitor-${crypto.randomUUID()}`
          : `offline-visitor-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;

      const operationId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `visitor-registration-${crypto.randomUUID()}`
          : `visitor-registration-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}`;

      const publicId = `OFFLINE-${operationId
        .replaceAll("-", "")
        .slice(-8)
        .toUpperCase()}`;

      const onlineAtCreation =
        typeof navigator === "undefined" ? isOnline : navigator.onLine;

      let secureOfflineQr: Awaited<
        ReturnType<typeof createOfflineVisitorQrToken>
      >;

      try {
        secureOfflineQr = await createOfflineVisitorQrToken({
          eventId: activeContext.eventId,

          issuerDeviceId: activeContext.deviceId,

          localId,

          operationId,

          attendeeTypeId: registerAttendeeTypeId,

          fullName: payload.fullName,

          createdAtDevice: now,

          validUntil: getOfflineRegistrationValidUntil(),

          online: onlineAtCreation,

          provisionPublicKey: provisionMyAssignedDeviceOfflineKey,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (
          message === "OFFLINE_KEY_REQUIRES_FIRST_ONLINE_SETUP" ||
          message === "OFFLINE_KEY_WAS_NOT_PROVISIONED"
        ) {
          toast.error(
            "يجب فتح السكانر مرة واحدة أثناء وجود الإنترنت لتجهيز الجهاز للتسجيل الأوفلاين الآمن.",
          );

          return false;
        }

        if (
          message === "ED25519_NOT_SUPPORTED" ||
          message === "WEB_CRYPTO_NOT_SUPPORTED"
        ) {
          toast.error(
            "هذا المتصفح لا يدعم التوقيع الآمن للتسجيل الأوفلاين. استخدم Chrome أو Edge حديثًا.",
          );

          return false;
        }

        console.error("Could not create secure offline QR:", error);

        toast.error("تعذر تجهيز QR آمن. لم يتم حفظ التسجيل.");

        return false;
      }

      let offlineQrImageUrl = "";

      try {
        offlineQrImageUrl = await createOfflineQrImageDataUrl(
          secureOfflineQr.signedOfflineQr,
        );
      } catch (error) {
        console.error("Could not create offline QR image:", error);

        toast.error("تعذر إنشاء صورة QR للتسجيل.");

        return false;
      }

      const { visitor } = await addOfflineVisitorRegistration({
        eventId: activeContext.eventId,

        payload,

        attendeeType,

        localId,

        operationId,

        publicId,

        createdAtDevice: now,

        issuerDeviceId: activeContext.deviceId,

        issuerKeyVersion: secureOfflineQr.issuerKeyVersion,

        offlineQrToken: secureOfflineQr.offlineQrToken,

        signedOfflineQr: secureOfflineQr.signedOfflineQr,

        offlineQrImageUrl,
      });

      if (!visitor) {
        await refreshPendingCount();

        toast.error(
          "تم العثور على عملية محلية قديمة دون بيانات زائر قابلة للعرض. حدّث الصفحة ثم أعد المحاولة.",
        );

        return false;
      }

      await refreshPendingCount();

      setCachedVisitorsCount(
        await getCachedStaffVisitorsCount(activeContext.eventId),
      );

      setCreateModalOpen(false);

      setRawScanResult(null);

      setSelectedVisitor(getVisitorInfoFromStaffVisitor(visitor));

      setVisitorSource("created");

      setLastOfflineSaved(false);

      setVisitorSearchInput(visitor.fullName);

      setVisitorSearch(visitor.fullName);

      setOfflineVisitorsData((current) => {
        const currentItems = current?.visitors?.items ?? [];

        /*
         * منع تكرار البطاقة إذا أعادت React تنفيذ تحديث سابق.
         */
        const items = [
          visitor,

          ...currentItems.filter((item) => item.id !== visitor.id),
        ];

        return {
          event: current?.event || {
            id: activeContext.eventId,
          },

          visitors: {
            items,

            page: 1,

            limit: 20,

            total: Math.max(
              (current?.visitors?.total ?? currentItems.length) + 1,
              items.length,
            ),

            totalPages: Math.max(
              1,
              Math.ceil(
                Math.max(
                  (current?.visitors?.total ?? currentItems.length) + 1,
                  items.length,
                ) / 20,
              ),
            ),
          },
        };
      });

      if (onlineAtCreation) {
        toast.success("تم حفظ التسجيل وتجهيز QR، وجاري رفعه إلى السيرفر.");
      } else {
        toast.warning(
          "تم حفظ التسجيل محليًا وتجهيز QR للطباعة. سيتم رفعه عند عودة الإنترنت.",
        );
      }

      return true;
    }

    setIsSubmittingVisitorRegistration(true);

    try {
      /*
       * لا نستعمل registerToPublicEvent هنا.
       *
       * نحفظ محليًا أولًا دائمًا، ثم نستخدم مسار
       * Offline Sync لرفع التسجيل إلى السيرفر.
       */
      const savedLocally = await saveOfflineVisitor();

      if (!savedLocally) {
        return;
      }

      const onlineAfterSave =
        typeof navigator === "undefined" ? isOnline : navigator.onLine;

      if (onlineAfterSave) {
        /*
         * نترك تحديثات React وIndexedDB تنتهي،
         * ثم نبدأ المزامنة بالخلفية.
         */
        window.setTimeout(() => {
          void syncOfflineQueue();
        }, 150);
      }
    } catch (error) {
      console.error("Could not create staff visitor registration:", error);

      toast.error("تعذر حفظ التسجيل على الجهاز.");
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

    await submitPayload(buildPayload(token, displayRegistrationId));
  }

  async function showVisitorQr(visitor: StaffVisitor) {
    if (!visitor.id) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");

      return;
    }

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    /*
     * Offline: نستخدم التوكن المحفوظ.
     */
    if (!isOnline || !onlineNow) {
      const existingToken = getVisitorQrToken(visitor);

      if (!existingToken) {
        toast.error("لا يوجد QR محفوظ لهذا الزائر، ويلزم اتصال لتجهيزه.");

        return;
      }

      let existingImageUrl = getVisitorQrImageUrl(visitor);

      if (!existingImageUrl) {
        try {
          existingImageUrl = await createOfflineQrImageDataUrl(existingToken);
        } catch {
          existingImageUrl = "";
        }
      }

      const scannerVisitor = getVisitorInfoFromStaffVisitor(visitor);

      setRawScanResult(null);

      setSelectedVisitor({
        ...scannerVisitor,

        qrToken: existingToken,

        qrImageUrl: existingImageUrl || scannerVisitor.qrImageUrl,
      });

      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      toast.success("تم تجهيز QR من البيانات المحفوظة");

      return;
    }

    /*
     * Online: نطلب التوكن الرسمي ثم نخزنه فورًا.
     */
    setShowingVisitorQrId(visitor.id);

    try {
      const response = await generateStaffVisitorQr(visitor.id);

      const persisted = await persistGeneratedVisitorQr(visitor.id, response);

      if (!persisted?.qrToken) {
        toast.error("لم يرجع السيرفر QR Token صالحًا لهذا الزائر.");

        return;
      }

      const effectiveVisitor = persisted.cachedVisitor ?? visitor;

      const scannerVisitor = getVisitorInfoFromStaffVisitor(effectiveVisitor);

      setRawScanResult(null);

      setSelectedVisitor({
        ...scannerVisitor,

        qrToken: persisted.qrToken,

        qrImageUrl: persisted.qrImageUrl || scannerVisitor.qrImageUrl,
      });

      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      toast.success("تم تجهيز QR للزائر");
    } catch (error) {
      console.error("Could not generate visitor QR:", error);

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

    const onlineNow =
      typeof navigator === "undefined" ? isOnline : navigator.onLine;

    /*
     * Offline: نستخدم QR الموجود على البطاقة.
     */
    if (!isOnline || !onlineNow) {
      const existingToken = displayVisitor?.qrToken || cardQrToken;

      if (!existingToken) {
        toast.error("لا يوجد QR محفوظ، ويلزم اتصال لتجهيزه.");

        return;
      }

      let qrImageUrl = displayVisitor?.qrImageUrl || cardQrImageUrl;

      if (!qrImageUrl) {
        try {
          qrImageUrl = await createOfflineQrImageDataUrl(existingToken);
        } catch {
          qrImageUrl = "";
        }
      }

      if (displayVisitor) {
        setSelectedVisitor({
          ...displayVisitor,

          qrToken: existingToken,

          qrImageUrl: qrImageUrl || displayVisitor.qrImageUrl,
        });
      }

      toast.success("تم تجهيز QR محليًا");

      return;
    }

    setShowingVisitorQrId(displayRegistrationId);

    try {
      const response = await generateStaffVisitorQr(displayRegistrationId);

      const persisted = await persistGeneratedVisitorQr(
        displayRegistrationId,
        response,
      );

      if (!persisted?.qrToken) {
        toast.error("لم يرجع السيرفر QR Token صالحًا.");

        return;
      }

      if (persisted.cachedVisitor) {
        setSelectedVisitor(
          getVisitorInfoFromStaffVisitor(persisted.cachedVisitor),
        );
      } else if (displayVisitor) {
        setSelectedVisitor({
          ...displayVisitor,

          qrToken: persisted.qrToken,

          qrImageUrl: persisted.qrImageUrl || displayVisitor.qrImageUrl,
        });
      }

      setVisitorSource("lookup");
      setLastOfflineSaved(false);

      toast.success("تم تجهيز QR للزائر");
    } catch (error) {
      console.error("Could not generate display visitor QR:", error);

      toast.error("تعذر تجهيز QR لهذا الزائر.");
    } finally {
      setShowingVisitorQrId("");
    }
  }

  function resolveLocalBadgeFieldValue(
    key: string,
    visitor: StaffVisitor,
    qrToken: string,
    qrImageUrl: string,
  ) {
    const fixedFields: Record<string, unknown> = {
      fullName: visitor.fullName,
      phone: visitor.phone,
      email: visitor.email,
      publicId: visitor.publicId,

      companyName: visitor.companyName,
      jobTitle: visitor.jobTitle,
      externalId: visitor.externalId,

      "attendeeType.code": visitor.attendeeType?.code,
      "attendeeType.nameAr": visitor.attendeeType?.nameAr,
      "attendeeType.nameEn": visitor.attendeeType?.nameEn,

      qrCode: qrImageUrl,
      qrToken,
    };

    if (key in fixedFields) {
      return fixedFields[key] ?? null;
    }

    return visitor.customFields?.[key] ?? null;
  }

  async function openBadgePreview(
    registrationId: string,
    visitor?: StaffVisitor,
  ) {
    if (!registrationId) {
      toast.error("لا يوجد رقم تسجيل لهذا الزائر.");
      return;
    }

    if (!visitor) {
      toast.error("لا توجد بيانات زائر كافية لطباعة البادج.");
      return;
    }

    if (!activeContext.eventId) {
      toast.error("لا يوجد رقم فعالية لطباعة البادج.");
      return;
    }

    setPrintingVisitorId(registrationId);

    try {
      const cachedTemplate = await getCachedStaffBadgeTemplate(
        activeContext.eventId,
      );

      if (!cachedTemplate?.template) {
        toast.error(
          "قالب البادج غير مخزن على الجهاز بعد. حدّث مخزن الزوار وأنت متصل.",
        );

        return;
      }

      const qrToken = getVisitorQrToken(visitor);

      if (!qrToken) {
        toast.error("لا يوجد QR Token محفوظ لهذا الزائر.");
        return;
      }

      let qrImageUrl = getVisitorQrImageUrl(visitor);

      if (!qrImageUrl) {
        try {
          qrImageUrl = await createOfflineQrImageDataUrl(qrToken);
        } catch {
          toast.error("تعذر إنشاء صورة QR محليًا.");
          return;
        }
      }

      const fields: StaffVisitorBadgeResponse["fields"] = [];

      const selectedFields = cachedTemplate.template.selectedFields;

      if (Array.isArray(selectedFields)) {
        for (const selectedField of selectedFields) {
          if (typeof selectedField === "string") {
            fields.push({
              key: selectedField,
              label: selectedField,
              labelAr: selectedField,
              value: resolveLocalBadgeFieldValue(
                selectedField,
                visitor,
                qrToken,
                qrImageUrl,
              ),
            });

            continue;
          }

          if (
            typeof selectedField === "object" &&
            selectedField !== null &&
            "key" in selectedField &&
            typeof selectedField.key === "string"
          ) {
            const field = selectedField as {
              key: string;
              label?: string | null;
              labelAr?: string | null;
              labelEn?: string | null;
            };

            fields.push({
              key: field.key,
              label: field.labelAr || field.labelEn || field.label || field.key,
              labelAr: field.labelAr ?? null,
              labelEn: field.labelEn ?? null,
              value: resolveLocalBadgeFieldValue(
                field.key,
                visitor,
                qrToken,
                qrImageUrl,
              ),
            });
          }
        }
      }

      const badgeData: StaffVisitorBadgeResponse = {
        template: cachedTemplate.template,

        registration: {
          ...visitor,
          qrToken,
          qrImageUrl,
        },

        qr: {
          qrToken,
          token: qrToken,
          compactQrToken: qrToken,

          qrImageUrl,
          imageUrl: qrImageUrl,
          publicUrl: qrImageUrl,

          status: "OFFLINE_CACHED",
        },

        fields,
      };

      setBadgePreviewData(badgeData);

      setBadgePreviewVisitor({
        ...visitor,
        qrToken,
        qrImageUrl,
      });

      setBadgePreviewOpen(true);
    } catch (error) {
      console.error("Could not prepare local badge preview:", error);

      toast.error("تعذر تجهيز البادج من البيانات المحلية.");
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

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
                <span className="text-[#2F3137]/50">
                  بانتظار الرفع: {pendingCount}
                </span>

                {permanentFailedCount > 0 ? (
                  <span className="text-red-700">
                    تحتاج مراجعة: {permanentFailedCount}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-xs font-bold text-[#2F3137]/60">
              {visitorSnapshotStatus === "DOWNLOADING" ? (
                <span>
                  جاري تخزين الزوار: {cachedVisitorsCount}
                  {visitorSnapshotTotal !== null
                    ? ` من ${visitorSnapshotTotal}`
                    : ""}
                </span>
              ) : null}

              {visitorSnapshotStatus === "COMPLETED" ? (
                <span className="text-emerald-700">
                  مخزن الزوار جاهز: {cachedVisitorsCount}
                  {visitorSnapshotTotal !== null
                    ? ` من ${visitorSnapshotTotal}`
                    : ""}
                </span>
              ) : null}

              {visitorSnapshotStatus === "PAUSED_OFFLINE" ? (
                <span className="text-amber-700">
                  {cachedVisitorsCount > 0
                    ? `مخزن الزوار المحلي متاح: ${cachedVisitorsCount} زائر — التحديث متوقف حتى عودة الإنترنت`
                    : "لا يوجد مخزن زوار مكتمل، وسيتم استكمال التنزيل عند عودة الإنترنت"}
                </span>
              ) : null}

              {visitorSnapshotStatus === "FAILED" ? (
                <span className="text-red-700">تعذر تجهيز مخزن الزوار</span>
              ) : null}

              {visitorSnapshotStatus === "IDLE" ? (
                <span>لم يبدأ تجهيز مخزن الزوار بعد</span>
              ) : null}
            </div>

            <Button
              variant="outline"
              disabled={
                !isOnline || !isReady || isSyncingQueue || pendingCount === 0
              }
              onClick={() => void syncOfflineQueue()}
            >
              {isSyncingQueue ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              مزامنة الآن
            </Button>
          </section>

          <section
            className="flex flex-col gap-4 border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderRadius: theme.radius,
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <Usb
                  className="h-5 w-5"
                  style={{
                    color: theme.primary,
                  }}
                />

                <p
                  className="text-sm font-extrabold"
                  style={{
                    color: theme.text,
                  }}
                >
                  قارئ الباركود المكتبي
                </p>
              </div>

              <p
                className="mt-1 text-xs font-bold leading-6 opacity-55"
                style={{
                  color: theme.text,
                }}
              >
                وصّل جهاز HENEX بوضع USB-HID، ثم امسح QR مباشرة من الشاشة أو
                البادج.
              </p>
            </div>

            <Button
              type="button"
              variant={hardwareScannerEnabled ? undefined : "outline"}
              disabled={hardwareScannerReading}
              onClick={() => {
                setHardwareScannerEnabled((current) => !current);

                /*
                 * إخراج التركيز من خانة البحث حتى يصبح
                 * قارئ USB قادرًا على إرسال الرمز للصفحة.
                 */
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              style={
                hardwareScannerEnabled
                  ? {
                      backgroundColor: theme.primary,
                    }
                  : undefined
              }
            >
              {hardwareScannerReading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Usb className="h-4 w-4" />
              )}

              {hardwareScannerReading
                ? "جاري قراءة الرمز"
                : hardwareScannerEnabled
                  ? "قارئ USB جاهز"
                  : "تشغيل قارئ USB"}
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
              onEdit={openEditVisitorModal}
              onPrint={printVisitorBadge}
              onGenerateQr={showVisitorQr}
              onScan={scanVisitorFromTable}
              generatingVisitorId={showingVisitorQrId}
              scanningVisitorId={scanningVisitorId}
              printingVisitorId={printingVisitorId}
            />

            {displayVisitor ? (
              <section
                ref={visitorResultRef}
                className="overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.08)]"
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
                  onScan={
                    visitorSource === "scan" || visitorSource === "offline-scan"
                      ? null
                      : scanDisplayVisitor
                  }
                  onGenerateQr={generateQrForDisplayVisitor}
                  onPrintBadge={printDisplayVisitorBadge}
                  onClear={clearScanResult}
                />
              </section>
            ) : null}
          </section>
        </div>
      </main>

      <StaffEditVisitorModal
        open={editModalOpen}
        visitor={editingVisitor}
        theme={theme}
        registrationFields={registrationFields}
        isSubmitting={isUpdatingVisitor}
        onClose={closeEditVisitorModal}
        onSubmit={submitVisitorUpdate}
      />

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
