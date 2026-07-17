export type ScanTrackingType = "ENTRY" | "EXIT" | string;

export type ScanTrackingDecision = "ALLOWED" | "DENIED" | string;

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
};

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
  allowed?: boolean | null;

  status?: string | null;
  rawStatus?: string | null;
  processingStatus?: string | null;

  reason?: string | null;
  message?: string | null;
  errorMessage?: string | null;

  scannedAtDevice?: string | null;
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
