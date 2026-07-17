export type BadgeTemplateColorMap = {
  primary?: string | null;
  primaryHover?: string | null;
  background?: string | null;
  text?: string | null;
  accent?: string | null;
  [key: string]: unknown;
};

export type BadgeTemplateLayout = {
  direction?: "rtl" | "ltr" | string;
  qrPosition?: "top" | "bottom" | "left" | "right" | string;
  showLogo?: boolean;
  showEventTitle?: boolean;
  [key: string]: unknown;
};

export type BadgeTemplateSelectedField = {
  key: string;
  label?: string | null;
  labelAr?: string | null;
  labelEn?: string | null;
  visible?: boolean;
  sortOrder?: number;
  [key: string]: unknown;
};

export type BadgeTemplate = {
  id?: string;
  eventId?: string;
  widthMm?: number | string | null;
  heightMm?: number | string | null;
  backgroundImageUrl?: string | null;
  backgroundImageRelativePath?: string | null;
  colors?: BadgeTemplateColorMap | null;
  layout?: BadgeTemplateLayout | null;
  selectedFields?: BadgeTemplateSelectedField[] | string[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BadgeAvailableField = {
  key: string;
  label?: string | null;
  labelAr?: string | null;
  labelEn?: string | null;
  type?: string | null;
  source?: "fixed" | "system" | "custom" | string;
  isRequired?: boolean;
};

export type BadgeAvailableFieldsResponse = {
  fixedFields?: BadgeAvailableField[];
  systemFields?: BadgeAvailableField[];
  customFields?: BadgeAvailableField[];
  fields?: BadgeAvailableField[];
};

export type BadgeResolvedRegistration = {
  id: string;
  eventId?: string;
  publicId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  customFields?: Record<string, unknown> | null;
  attendeeType?: {
    id?: string;
    code?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
  } | null;
};

export type BadgeResolvedQr = {
  qrToken?: string | null;
  token?: string | null;
  imageUrl?: string | null;
  publicUrl?: string | null;
  qrImageUrl?: string | null;
  relativePath?: string | null;
  status?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type BadgeResolvedField = {
  key: string;
  label?: string | null;
  labelAr?: string | null;
  labelEn?: string | null;
  value: unknown;
};

export type BadgeResolvedData = {
  template?: BadgeTemplate | null;
  registration?: BadgeResolvedRegistration | null;
  qr?: BadgeResolvedQr | null;
  fields?: BadgeResolvedField[];
};

export type BadgeTemplatePayload = {
  eventId: string;
  widthMm?: string | number;
  heightMm?: string | number;
  colors?: BadgeTemplateColorMap;
  layout?: BadgeTemplateLayout;
  selectedFields?: BadgeTemplateSelectedField[] | string[];
  backgroundImage?: File | null;
};
