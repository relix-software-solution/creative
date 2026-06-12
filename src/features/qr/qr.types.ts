export type QrStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED"
  | "USED"
  | "INACTIVE"
  | string;

export type QrRegistration = {
  id: string;
  publicId?: string | null;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  status?: string;
  eventId?: string;
  attendeeTypeId?: string;
  attendeeType?: {
    id?: string;
    code?: string;
    nameAr?: string;
    nameEn?: string | null;
  } | null;
};

export type QrRecord = {
  id?: string;
  registrationId?: string;
  qrToken?: string;
  token?: string;
  status?: QrStatus;

  publicUrl?: string;
  imageUrl?: string;
  qrImageUrl?: string;
  url?: string;
  path?: string;
  fileUrl?: string;
  qrUrl?: string;
  image?: string;

  objectUrl?: string;

  validFrom?: string | null;
  validUntil?: string | null;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  registration?: QrRegistration | null;
};

export type QrResponse = QrRecord & {
  qr?: QrRecord;
  data?: QrRecord;
  message?: string;
};

export type ValidateQrPayload = {
  qrToken: string;
};

export type ValidateQrResponse = {
  valid?: boolean;
  allowed?: boolean;
  success?: boolean;
  decision?: "ALLOWED" | "DENIED" | string;
  reason?: string;
  message?: string;
  qr?: QrRecord | null;
  registration?: QrRegistration | null;
};
