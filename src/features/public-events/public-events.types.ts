export type PublicRegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CHECKBOX";

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
  phone?: string;
  email?: string;
  companyName?: string;
  jobTitle?: string;
  externalId?: string;
  customFields?: Record<string, unknown>;
  notes?: string;
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

export type PublicRegisterResponse = {
  id?: string;
  publicId?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  attendeeTypeId?: string;
  customFields?: Record<string, unknown>;
  status?: string;

  /**
   * الباك ممكن يرجعها string:
   * qrToken: "eyJ..."
   *
   * أو object:
   * qrToken: { token: "eyJ..." }
   */
  qrToken?: string | PublicQrTokenObject | null;

  qrImageUrl?: string;
  imageUrl?: string;
  publicUrl?: string;

  registration?: {
    id?: string;
    publicId?: string;
    fullName?: string;
    phone?: string | null;
    email?: string | null;
    status?: string;
    attendeeTypeId?: string;
    customFields?: Record<string, unknown>;
  };

  qr?: PublicQrTokenObject | null;
};

export type PublicRegistrationSuccessData = {
  eventId?: string;
  registrationId?: string;
  publicId?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  status?: string;
  qrToken?: string;
  qrImageUrl?: string;
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
  type:
    | "TEXT"
    | "TEXTAREA"
    | "SELECT"
    | "CHECKBOX"
    | "EMAIL"
    | "PHONE"
    | "NUMBER"
    | "DATE"
    | string;
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
  titleAr: string;
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
