export type ScanTrackingType = "ENTRY" | "EXIT" | string;

export type ScanTrackingDecision = "ALLOWED" | "DENIED" | "WARNING" | string;

export type ScanTrackingRegistration = {
  id?: string;
  publicId?: string | null;
  fullName?: string | null;
  name?: string | null;
  visitorName?: string | null;
  attendeeName?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  status?: string | null;
  attendeeType?: {
    id?: string;
    code?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
  } | null;
};

export type ScanTrackingEvent = {
  id?: string;
  titleAr?: string | null;
  titleEn?: string | null;
};

export type ScanTrackingCheckpoint = {
  id?: string;
  code?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  type?: string | null;
};

export type ScanTrackingDevice = {
  id?: string;
  name?: string | null;
  code?: string | null;
};

export type ScanTrackingUser = {
  id?: string;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
};

export type ScanTrackingStaffSession = {
  id?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  user?: ScanTrackingUser | null;
  staff?: ScanTrackingUser | null;
  staffUser?: ScanTrackingUser | null;
};

/**
 * Legacy raw-scan shape kept for compatibility with any code that still calls
 * /scans/raw. The visitor tracking UI uses the aggregated types below.
 */
export type ScanTrackingItem = {
  id: string;
  operationId?: string | null;
  eventId?: string | null;
  registrationId?: string | null;
  checkpointId?: string | null;
  deviceId?: string | null;
  staffSessionId?: string | null;
  qrToken?: string | null;
  type?: ScanTrackingType | null;
  direction?: ScanTrackingType | null;
  decision?: ScanTrackingDecision | null;
  result?: ScanTrackingDecision | null;
  allowed?: boolean | null;
  status?: string | null;
  rawStatus?: string | null;
  processingStatus?: string | null;
  reason?: string | null;
  message?: string | null;
  errorMessage?: string | null;
  scannedAtDevice?: string | null;
  receivedAtServer?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  registration?: ScanTrackingRegistration | null;
  attendee?: ScanTrackingRegistration | null;
  visitor?: ScanTrackingRegistration | null;
  event?: ScanTrackingEvent | null;
  checkpoint?: ScanTrackingCheckpoint | null;
  device?: ScanTrackingDevice | null;
  staffSession?: ScanTrackingStaffSession | null;
  staff?: ScanTrackingUser | null;
  user?: ScanTrackingUser | null;
  scanEvent?: {
    id?: string;
    status?: string | null;
    reason?: string | null;
    type?: string | null;
    scannedAtDevice?: string | null;
    createdAt?: string | null;
  } | null;
  movement?: {
    id?: string;
    type?: string | null;
    direction?: string | null;
    createdAt?: string | null;
  } | null;
  payload?: Record<string, unknown> | null;
  data?: {
    registration?: ScanTrackingRegistration | null;
    attendee?: ScanTrackingRegistration | null;
    visitor?: ScanTrackingRegistration | null;
    event?: ScanTrackingEvent | null;
    checkpoint?: ScanTrackingCheckpoint | null;
    device?: ScanTrackingDevice | null;
    staffSession?: ScanTrackingStaffSession | null;
  } | null;
};

export type ScanTrackingListParams = {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
  checkpointId?: string;
  deviceId?: string;
  staffSessionId?: string;
  type?: string;
  decision?: string;
  status?: string;
  from?: string;
  to?: string;
};

export type ScanTrackingListResponse = {
  items: ScanTrackingItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type VisitorPresenceState =
  | "INSIDE"
  | "OUTSIDE"
  | "NO_ALLOWED_MOVEMENT";

export type VisitorScanResult = "ALLOWED" | "DENIED" | "WARNING";

export type VisitorScanTrackingParams = {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
  attendeeTypeId?: string;
  type?: string;
  result?: VisitorScanResult | string;
  state?: VisitorPresenceState | string;
  from?: string;
  to?: string;
};

export type VisitorScanTrackingSummary = {
  totalVisitors: number;
  insideVisitors: number;
  outsideVisitors: number;
  noAllowedMovementVisitors: number;
  totalScans: number;
  allowedScans: number;
  deniedScans: number;
  warningScans: number;
};

export type VisitorScanTrackingRow = {
  registrationId: string;
  publicId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  jobTitle: string | null;
  registrationStatus: string;
  event: {
    id: string;
    titleAr: string;
    titleEn: string | null;
  };
  attendeeType: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
  };
  currentState: VisitorPresenceState;
  scanCount: number;
  allowedCount: number;
  deniedCount: number;
  warningCount: number;
  entryCount: number;
  exitCount: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastResult: VisitorScanResult | null;
  lastMovementType: string | null;
  lastReason: string | null;
  lastCheckpoint: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
  } | null;
};

export type VisitorScanTrackingResponse = {
  items: VisitorScanTrackingRow[];
  summary: VisitorScanTrackingSummary;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  appliedFilters: Omit<VisitorScanTrackingParams, "page" | "limit">;
};

export type VisitorScanTimelineItem = {
  id: string;
  operationId: string;
  type: string;
  status: string;
  result: VisitorScanResult | null;
  reason: string | null;
  scannedAtDevice: string;
  receivedAtServer: string;
  processedAt: string | null;
  checkpoint: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string | null;
    type: string;
  } | null;
  device: {
    id: string;
    code: string;
    name: string;
  };
  staffSession: {
    id: string;
    staffUser: {
      id: string;
      fullName: string;
    };
  } | null;
};

export type VisitorScanTrackingDetail = {
  visitor: {
    id: string;
    publicId: string;
    eventId: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    companyName: string | null;
    jobTitle: string | null;
    status: string;
    source: string;
    registeredAt: string;
    attendeeType: {
      id: string;
      code: string;
      nameAr: string;
      nameEn: string | null;
    };
    event: {
      id: string;
      titleAr: string;
      titleEn: string | null;
      startsAt: string;
      endsAt: string;
    };
  };
  summary: {
    currentState: VisitorPresenceState;
    scanCount: number;
    allowedCount: number;
    deniedCount: number;
    warningCount: number;
    entryCount: number;
    exitCount: number;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
  };
  timeline: VisitorScanTimelineItem[];
  appliedFilters: Omit<VisitorScanTrackingParams, "page" | "limit">;
};

export type ScanTrackingFilterEvent = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  scanCount: number;
};

export type ScanTrackingFiltersResponse = {
  events: ScanTrackingFilterEvent[];
};
