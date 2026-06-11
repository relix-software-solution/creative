export type RegistrationStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "BLOCKED"
  | "ARCHIVED"
  | string;

export type RegistrationSource = "ADMIN" | "PUBLIC" | "IMPORT" | string;

export type Registration = {
  id: string;
  eventId: string;
  attendeeTypeId: string;

  fullName: string;
  phone?: string | null;
  email?: string | null;

  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;

  customFields?: Record<string, unknown> | null;
  notes?: string | null;

  source?: RegistrationSource | null;
  status?: RegistrationStatus | null;

  archivedAt?: string | null;
  deletedAt?: string | null;
  isArchived?: boolean;

  createdAt?: string;
  updatedAt?: string;

  event?: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
  } | null;

  attendeeType?: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    code: string;
  } | null;
};

export type RegistrationsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  attendeeTypeId?: string;
  status?: string;
  search?: string;
};

export type CreateRegistrationPayload = {
  eventId: string;
  attendeeTypeId: string;
  fullName: string;
  phone?: string;
  email?: string;
  companyName?: string;
  jobTitle?: string;
  externalId?: string;
  customFields?: Record<string, unknown>;
  notes?: string;
  source: "ADMIN";
};

export type UpdateRegistrationPayload = Partial<CreateRegistrationPayload>;

export type RegistrationsListResponse = {
  items: Registration[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
