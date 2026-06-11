export type PublicAttendeeType = {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
};

export type PublicRegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CHECKBOX";

export type PublicRegistrationFieldOption = {
  labelAr?: string;
  labelEn?: string;
  value: string;
};

export type PublicRegistrationField = {
  id: string;
  attendeeTypeId: string;
  key: string;
  labelAr: string;
  labelEn?: string | null;
  type: PublicRegistrationFieldType;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  options?: PublicRegistrationFieldOption[] | string[] | null;
  isRequired: boolean;
  isActive?: boolean;
  sortOrder: number;
};

export type PublicEvent = {
  id: string;
  type?: string | null;
  titleAr: string;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  startsAt: string;
  endsAt?: string | null;
  timezone?: string | null;
  client?: {
    id: string;
    name: string;
  } | null;
  attendeeTypes?: PublicAttendeeType[];
  registrationFields?: PublicRegistrationField[];
};

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
  companyName?: string | null;
  jobTitle?: string | null;
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
    companyName?: string | null;
    jobTitle?: string | null;
    status?: string;
  };

  qr?: PublicQrTokenObject | null;
};

export type PublicRegistrationSuccessData = {
  eventId: string;
  registrationId: string;
  publicId?: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  status?: string;
  qrToken?: string;
  qrImageUrl?: string;
};
