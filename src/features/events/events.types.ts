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
