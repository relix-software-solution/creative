export type EventType = "EXHIBITION" | "CONFERENCE" | "WORKSHOP" | "OTHER";

export type DuplicateStrategy = "PHONE" | "EMAIL" | "EXTERNAL_ID";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED"
  | string;

export type EventBrandingTheme = {
  primary?: string | null;
  primaryHover?: string | null;
  background?: string | null;
  text?: string | null;
  radius?: string | null;
};

export type EventBranding = {
  id?: string;
  eventId: string;
  logoUrl?: string | null;
  backgroundImageUrl?: string | null;
  theme?: EventBrandingTheme | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BadgeSelectedFieldSource = "FIXED" | "CUSTOM" | "SYSTEM";

export type BadgeSelectedField = {
  key: string;
  source: BadgeSelectedFieldSource;
  label: string;
  visible: boolean;
};

export type BadgeTemplateLayout = {
  fields: Record<
    string,
    {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      fontSize?: number;
    }
  >;
};

export type BadgeTemplate = {
  id: string;
  eventId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  backgroundImageUrl?: string | null;
  colors?: {
    primary?: string | null;
    text?: string | null;
    background?: string | null;
  } | null;
  selectedFields?: BadgeSelectedField[] | null;
  layout?: BadgeTemplateLayout | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BadgeTemplatePayload = {
  eventId?: string;
  name?: string;
  widthMm?: number;
  heightMm?: number;
  colors?: {
    primary?: string;
    text?: string;
    background?: string;
  };
  selectedFields?: BadgeSelectedField[];
  layout?: BadgeTemplateLayout;
  backgroundImage?: File | null;
};

export type EventItem = {
  id: string;
  clientId: string;
  type: EventType;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  allowReEntry: boolean;
  duplicateStrategy: DuplicateStrategy;
  qrValidFrom?: string | null;
  qrValidUntil?: string | null;
  status?: EventStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  badgeTemplate?: BadgeTemplate | null;
  badge?: BadgeTemplate | null;

  client?: {
    id: string;
    name: string;
  } | null;

  branding?: EventBranding | null;
  eventBranding?: EventBranding | null;
};

export type EventsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
};

export type EventBasePayload = {
  clientId: string;
  type: EventType;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  allowReEntry: boolean;
  duplicateStrategy: DuplicateStrategy;
  qrValidFrom?: string;
  qrValidUntil?: string;
};

export type EventBrandingPayload = {
  theme?: EventBrandingTheme;
  logo?: File | null;
  backgroundImage?: File | null;
};

export type CreateEventPayload = {
  event: EventBasePayload;
  branding?: EventBrandingPayload;
};

export type UpdateEventPayload = {
  event: Partial<EventBasePayload>;
  branding?: EventBrandingPayload;
};

export type EventsListResponse = {
  items: EventItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type EventMutationResponse = {
  event: EventItem;
  branding?: EventBranding;
};

export type BadgeFieldSource = "FIXED" | "CUSTOM" | "SYSTEM";

export type BadgeFieldType =
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "QR"
  | string;

export type BadgeAvailableField = {
  key: string;
  labelAr: string;
  labelEn: string;
  source: BadgeFieldSource;
  type: BadgeFieldType;
  required: boolean;
};

export type BadgeAvailableFieldsResponse = {
  fields: BadgeAvailableField[];
};
