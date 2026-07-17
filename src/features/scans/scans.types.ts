export type ScanType = "ENTRY" | "EXIT";

export type QueuedScanStatus = "PENDING" | "SYNCED" | "FAILED";

export type CreateScanPayload = {
  operationId: string;
  eventId: string;
  deviceId: string;
  staffSessionId: string;
  checkpointId: string;
  qrToken: string;
  registrationId?: string | null;
  type: ScanType;
  scannedAtDevice: string;
  payload?: Record<string, unknown>;
};

export type ScanRegistration = {
  id?: string;
  publicId?: string | null;

  fullName?: string;
  name?: string;
  visitorName?: string;
  attendeeName?: string;

  phone?: string | null;
  mobile?: string | null;

  email?: string | null;

  companyName?: string | null;
  company?: string | null;
  organization?: string | null;
  organizationName?: string | null;

  jobTitle?: string | null;
  position?: string | null;

  status?: string;

  customFields?: Record<string, unknown> | null;

  attendeeType?: {
    id?: string;
    code?: string;
    nameAr?: string;
    nameEn?: string | null;
  } | null;
};

export type ScanQr = {
  qrToken?: string | null;
  token?: string | null;
  signedToken?: string | null;
  value?: string | null;

  imageUrl?: string | null;
  publicUrl?: string | null;
  qrImageUrl?: string | null;
  relativePath?: string | null;

  status?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type ScanResult = {
  allowed?: boolean;
  success?: boolean;
  decision?: "ALLOWED" | "DENIED" | string;
  status?: string;
  reason?: string;
  message?: string;

  qr?: ScanQr | null;

  scanEvent?: {
    id?: string;
    status?: string;
    reason?: string | null;
    type?: string;
    scannedAtDevice?: string;
    createdAt?: string;
  };

  movement?: {
    id?: string;
    type?: string;
    direction?: string;
    createdAt?: string;
  };

  registration?: ScanRegistration | null;
  attendee?: ScanRegistration | null;
  visitor?: ScanRegistration | null;

  data?: {
    registration?: ScanRegistration | null;
    attendee?: ScanRegistration | null;
    visitor?: ScanRegistration | null;
    qr?: ScanQr | null;
  };
};

export type QueuedStaffScan = CreateScanPayload & {
  id?: number;
  status: QueuedScanStatus;
  errorMessage?: string | null;
  createdAt: string;
  syncedAt?: string | null;
};
