export type ClientEventStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ClientEventType =
  | "EXHIBITION"
  | "CONFERENCE"
  | "WORKSHOP"
  | "SUMMIT"
  | "FESTIVAL"
  | "CAREER_FAIR"
  | "OTHER";

export type ClientRegistrationStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "BLOCKED"
  | "ARCHIVED";

export type ClientRegistrationSource =
  | "ONLINE"
  | "ONSITE"
  | "EXCEL_IMPORT"
  | "OFFLINE_DEVICE"
  | "ADMIN"
  | "PUBLIC";

export type ClientAttendanceFilter = "ATTENDED" | "NOT_ATTENDED";

export type ClientAttendanceStatus =
  | "NOT_CHECKED_IN"
  | "INSIDE"
  | "EXITED";

export type ClientSortDirection = "asc" | "desc";

export type ClientEventSortBy =
  | "startsAt"
  | "endsAt"
  | "createdAt"
  | "titleAr"
  | "status";

export type ClientRegistrationSortBy =
  | "registeredAt"
  | "fullName"
  | "status"
  | "eventTitle";

export type ClientAnalyticsGranularity = "DAY" | "WEEK" | "MONTH";

export type ClientDashboardSummary = {
  generatedAt: string;
  client: {
    id: string;
    name: string;
  };
  events: {
    total: number;
    draft: number;
    scheduled: number;
    active: number;
    completed: number;
    cancelled: number;
    archived: number;
  };
  registrations: {
    total: number;
    pending: number;
    active: number;
    cancelled: number;
    blocked: number;
    archived: number;
  };
  attendance: {
    uniqueCheckedIn: number;
    uniqueExited: number;
    currentInsideApprox: number;
    attendanceRate: number;
  };
};

export type ClientVenueSummary = {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  city?: string | null;
  country?: string | null;
};

export type ClientVenueDetails = ClientVenueSummary & {
  addressAr?: string | null;
  addressEn?: string | null;
};

export type ClientAttendeeTypeSummary = {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
};

export type ClientAttendeeTypeDetails = ClientAttendeeTypeSummary & {
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type ClientEventListItem = {
  id: string;
  type: ClientEventType;
  status: ClientEventStatus;
  titleAr: string;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  venues: ClientVenueSummary[];
  _count: {
    registrations: number;
    attendeeTypes: number;
    venues: number;
  };
};

export type ClientEventDetails = Omit<
  ClientEventListItem,
  "venues" | "_count"
> & {
  allowReEntry: boolean;
  duplicateStrategy: string;
  qrValidFrom?: string | null;
  qrValidUntil?: string | null;
  venues: ClientVenueDetails[];
  attendeeTypes: ClientAttendeeTypeDetails[];
  _count: {
    registrations: number;
    attendeeTypes: number;
    venues: number;
    checkpoints: number;
  };
};

export type ClientEventsListParams = {
  search?: string;
  status?: ClientEventStatus;
  type?: ClientEventType;
  from?: string;
  to?: string;
  country?: string;
  sortBy?: ClientEventSortBy;
  sortDirection?: ClientSortDirection;
  page?: number;
  limit?: number;
};

export type ClientAttendanceInfo = {
  status: ClientAttendanceStatus;
  hasCheckedIn: boolean;
  hasExited: boolean;
  firstCheckedInAt?: string | null;
  lastEntryAt?: string | null;
  lastCheckedOutAt?: string | null;
};

export type ClientRegistrationEventSummary = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  type: ClientEventType;
  status: ClientEventStatus;
  startsAt: string;
  endsAt: string;
  timezone: string;
  venues: ClientVenueSummary[];
};

export type ClientRegistrationEventDetails = Omit<
  ClientRegistrationEventSummary,
  "venues"
> & {
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  venues: ClientVenueDetails[];
};

export type ClientRegistrationListItem = {
  id: string;
  publicId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  status: ClientRegistrationStatus;
  source: ClientRegistrationSource;
  registeredAt: string;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  event: ClientRegistrationEventSummary;
  attendeeType: ClientAttendeeTypeSummary;
  attendance: ClientAttendanceInfo;
};

export type ClientRegistrationDetails = Omit<
  ClientRegistrationListItem,
  "event" | "attendeeType"
> & {
  event: ClientRegistrationEventDetails;
  attendeeType: ClientAttendeeTypeDetails;
};

export type ClientRegistrationFilters = {
  search?: string;
  eventId?: string;
  eventIds?: string[];
  attendeeTypeId?: string;
  status?: ClientRegistrationStatus;
  source?: ClientRegistrationSource;
  attendance?: ClientAttendanceFilter;
  from?: string;
  to?: string;
  eventCountry?: string;
};

export type ClientRegistrationsListParams = ClientRegistrationFilters & {
  sortBy?: ClientRegistrationSortBy;
  sortDirection?: ClientSortDirection;
  page?: number;
  limit?: number;
};

export type ClientPaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ClientEventsListResponse =
  ClientPaginatedResponse<ClientEventListItem>;

export type ClientRegistrationsListResponse =
  ClientPaginatedResponse<ClientRegistrationListItem>;

export type ClientAnalyticsQuery = ClientRegistrationFilters & {
  granularity?: ClientAnalyticsGranularity;
  topLimit?: number;
};

export type ClientAnalytics = {
  generatedAt: string;
  timezone: "UTC" | string;
  period: {
    from: string;
    to: string;
    granularity: ClientAnalyticsGranularity;
  };
  overview: {
    totalRegistrations: number;
    activeRegistrations: number;
    cancelledRegistrations: number;
    uniqueCheckedIn: number;
    uniqueExited: number;
    currentInsideApprox: number;
    attendanceRate: number | null;
    cancellationRate: number | null;
    eventsWithRegistrations: number;
    averageRegistrationsPerEvent: number | null;
  };
  registrationsByStatus: Array<{
    status: ClientRegistrationStatus;
    count: number;
  }>;
  registrationsBySource: Array<{
    source: ClientRegistrationSource;
    count: number;
  }>;
  registrationsOverTime: Array<{
    date: string;
    count: number;
  }>;
  topEvents: Array<{
    event: {
      id: string;
      titleAr: string;
      titleEn?: string | null;
      type: ClientEventType;
      status: ClientEventStatus;
      startsAt: string;
      endsAt: string;
      timezone: string;
    };
    registrations: number;
    attended: number;
    attendanceRate: number | null;
  }>;
};

export type ClientRegistrationExportResult = {
  blob: Blob;
  filename: string;
};
