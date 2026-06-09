export type EventType = "EXHIBITION" | "CONFERENCE" | "WORKSHOP" | "OTHER";

export type DuplicateStrategy = "PHONE" | "EMAIL" | "EXTERNAL_ID";

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
  createdAt?: string;
  updatedAt?: string;
  client?: {
    id: string;
    name: string;
  } | null;
};

export type EventsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
};

export type CreateEventPayload = {
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

export type UpdateEventPayload = Partial<CreateEventPayload>;

export type EventsListResponse = {
  items: EventItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
