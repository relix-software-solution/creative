export type PublicRegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CHECKBOX"
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

  /**
   * الحقول التالية اختيارية في الباك.
   * تظهر في الواجهة فقط عندما يعيدها registrationFields للفعالية.
   */
  email?: string;
  companyName?: string;
  jobTitle?: string;
  externalId?: string;
  notes?: string;

  customFields?: Record<string, unknown>;

  offlineOperationId?: string;
  offlineQrToken?: string;
};

export type PublicQrTokenObject = {
  qrToken?: string;
  token?: string;
  value?: string;
  signedToken?: string;
  imageUrl?: string;
  publicUrl?: string;
  qrImageUrl?: string;
};

export type PublicDigitalTicketImage = {
  id?: string;
  status?: string;
  imageUrl?: string;
  publicUrl?: string;
  url?: string;
  fileUrl?: string;
};

export type PublicRegisterResponse = {
  id?: string;
  publicId?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;
  attendeeTypeId?: string;
  customFields?: Record<string, unknown>;
  status?: string;

  /**
   * Public registration يرجع qrToken مباشرة.
   * أبقينا أكثر من شكل لأن بعض الاستجابات قد تغلفه داخل object.
   */
  qrToken?: string | PublicQrTokenObject | null;
  qrImageUrl?: string;
  imageUrl?: string;
  publicUrl?: string;
  qr?: PublicQrTokenObject | null;

  /**
   * دعم جاهز لصورة Digital Ticket النهائية.
   * يجب على الباك العام إرجاع أحد هذه الحقول عندما تصبح صورة PNG متاحة.
   */
  digitalTicketImageUrl?: string;
  ticketImageUrl?: string;
  digitalTicketStatus?: string;
  digitalTicket?: PublicDigitalTicketImage | null;
  ticket?: PublicDigitalTicketImage | null;
  digitalTicketImage?: PublicDigitalTicketImage | null;

  registration?: {
    id?: string;
    publicId?: string;
    fullName?: string;
    phone?: string | null;
    email?: string | null;
    companyName?: string | null;
    jobTitle?: string | null;
    externalId?: string | null;
    notes?: string | null;
    status?: string;
    attendeeTypeId?: string;
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

export type PublicRegistrationFieldOption = {
  labelAr?: string;
  labelEn?: string | null;
  value: string;
};

export type PublicRegistrationField = {
  id: string;
  eventId: string;
  attendeeTypeId: string;
  key: string;
  labelAr: string;
  labelEn?: string | null;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  type: PublicRegistrationFieldType;
  source?: "FIXED" | "CUSTOM" | "SYSTEM" | string;
  options?: PublicRegistrationFieldOption[] | string[] | null;
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

  /**
   * أصبحت اختيارية في الفرونت حتى لا نفرض ظهور اسم الفعالية
   * عندما تكون الخلفية المصممة متضمنة الاسم والشعار.
   */
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
