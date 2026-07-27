export type PublicRegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "BOOLEAN"
  | string;

export type PublicEventsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PublicEventsListResponse = {
  items: PublicEvent[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type PublicRegisterPayload = {
  attendeeTypeId: string;
  fullName: string;
  phone: string;

  email?: string | null;
  companyName?: string;
  jobTitle?: string;
  externalId?: string;
  notes?: string;

  customFields?: Record<string, unknown>;

  /**
   * هوية التسجيل الذي تم إنشاؤه محليًا.
   */
  offlineOperationId?: string;
  offlineRegistrationId?: string;
  offlinePublicId?: string;

  /**
   * offlineQrToken:
   * القيمة العشوائية القصيرة الموجودة داخل Payload الموقّع.
   *
   * signedOfflineQr:
   * التوكن الكامل الذي يحتوي Payload والتوقيع.
   */
  offlineQrToken?: string;
  signedOfflineQr?: string;
};

export type PublicQrTokenObject = {
  id?: string | null;
  registrationId?: string | null;

  qrToken?: string | null;
  token?: string | null;
  value?: string | null;
  signedToken?: string | null;
  compactQrToken?: string | null;

  imageUrl?: string | null;
  publicUrl?: string | null;
  qrImageUrl?: string | null;
  relativePath?: string | null;

  status?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type PublicDigitalTicketImage = {
  id?: string;
  status?: string;

  imageUrl?: string;
  publicUrl?: string;
  relativePath?: string;
  url?: string;
  fileUrl?: string;
};

export type PublicRegisterResponse = {
  id?: string;
  publicId?: string;

  eventId?: string;
  attendeeTypeId?: string;

  fullName?: string;
  phone?: string | null;
  email?: string | null;

  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;

  status?: string;
  source?: string;

  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;

  customFields?: Record<string, unknown>;

  qrToken?: string | PublicQrTokenObject | null;

  qrImageUrl?: string;
  imageUrl?: string;
  publicUrl?: string;

  qr?: PublicQrTokenObject | null;

  digitalTicketImageUrl?: string;
  ticketImageUrl?: string;
  digitalTicketStatus?: string;

  digitalTicket?: PublicDigitalTicketImage | null;
  ticket?: PublicDigitalTicketImage | null;
  digitalTicketImage?: PublicDigitalTicketImage | null;

  registration?: {
    id?: string;
    publicId?: string;

    eventId?: string;
    attendeeTypeId?: string;

    fullName?: string;
    phone?: string | null;
    email?: string | null;

    companyName?: string | null;
    jobTitle?: string | null;
    externalId?: string | null;
    notes?: string | null;

    status?: string;
    source?: string;

    registeredAt?: string;
    createdAt?: string;
    updatedAt?: string;

    customFields?: Record<string, unknown>;

    digitalTicketImageUrl?: string;
    ticketImageUrl?: string;
    digitalTicketStatus?: string;

    digitalTicket?: PublicDigitalTicketImage | null;
    ticket?: PublicDigitalTicketImage | null;
    digitalTicketImage?: PublicDigitalTicketImage | null;
  };
};

export type PublicRegistrationSuccessData = {
  eventId?: string;

  registrationId?: string;
  publicId?: string;

  fullName?: string;
  phone?: string | null;
  email?: string | null;

  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;

  status?: string;

  qrToken?: string;
  qrImageUrl?: string;

  digitalTicketImageUrl?: string;
  digitalTicketStatus?: string;

  attendeeTypeId?: string;
  customFields?: Record<string, unknown>;
};

/**
 * قيم SELECT تصل إلى الواجهة وتدخل داخل عناصر HTML option.
 *
 * لذلك نبقي القيمة string حتى تتوافق مع مكونات Select
 * الموجودة في صفحات الإدارة والتسجيل.
 */
export type PublicRegistrationFieldOption =
  | string
  | {
      labelAr?: string | null;
      labelEn?: string | null;
      label?: string | null;
      value: string;
    };

export type PublicRegistrationField = {
  id: string;
  eventId: string;

  /**
   * null تعني أن الحقل عام لجميع أنواع الحضور.
   */
  attendeeTypeId?: string | null;

  key: string;

  labelAr: string;
  labelEn?: string | null;

  placeholderAr?: string | null;
  placeholderEn?: string | null;

  type: PublicRegistrationFieldType;
  source?: "FIXED" | "CUSTOM" | "SYSTEM" | string;

  options?: PublicRegistrationFieldOption[] | null;

  isRequired?: boolean;
  isActive?: boolean;

  sortOrder: number;
};

export type PublicAttendeeType = {
  id: string;
  eventId: string;

  code: string;

  nameAr: string;
  nameEn?: string | null;

  descriptionAr?: string | null;
  descriptionEn?: string | null;

  isActive?: boolean;
  sortOrder: number;
};

export type PublicEventBrandingTheme = {
  primary?: string | null;
  primaryHover?: string | null;
  background?: string | null;
  text?: string | null;
  radius?: string | null;
};

export type PublicEventBranding = {
  id?: string;
  eventId: string;

  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
  certificateImageUrl?: string | null;

  theme?: PublicEventBrandingTheme | null;

  isActive?: boolean;
};

export type PublicEvent = {
  id: string;

  clientId?: string;

  client?: {
    id?: string;
    name?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
  } | null;

  type?: string;

  titleAr?: string | null;
  titleEn?: string | null;

  descriptionAr?: string | null;
  descriptionEn?: string | null;

  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;

  allowReEntry?: boolean;
  duplicateStrategy?: string;

  qrValidFrom?: string | null;
  qrValidUntil?: string | null;

  attendeeTypes?: PublicAttendeeType[];
  registrationFields?: PublicRegistrationField[];

  branding?: PublicEventBranding | null;
  eventBranding?: PublicEventBranding | null;
};
