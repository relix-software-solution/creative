export type NotificationStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type NotificationChannel = "WHATSAPP" | "EMAIL" | "SMS";
export type NotificationProvider = "FAKE" | "WASENDER" | "META_CLOUD";

export type NotificationSummary = {
  total: number;
  recentCount: number;
  recentFailedCount: number;
  windowHours: number;
  statuses: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    cancelled: number;
  };
  channels: {
    whatsapp: number;
    email: number;
    sms: number;
  };
  providers: {
    fake: number;
    wasender: number;
    metaCloud: number;
  };
  deliveryRate: number;
  failureRate: number;
  failedThreshold: number;
  alert: boolean;
  latestFailureAt?: string | null;
  latestDeliveredAt?: string | null;
};

export type NotificationLogItem = {
  id: string;
  eventId?: string | null;
  registrationId?: string | null;
  templateId?: string | null;
  notificationType?: string | null;
  dedupeKey?: string | null;
  channel: NotificationChannel;
  provider: NotificationProvider;
  recipient: string;
  status: NotificationStatus;
  subject?: string | null;
  content: string;
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
  } | null;
  registration?: {
    id: string;
    publicId: string;
    fullName: string;
    phone?: string | null;
  } | null;
  template?: {
    id: string;
    name: string;
    type: string;
    locale: string;
  } | null;
};

export type NotificationLogsParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  registrationId?: string;
  channel?: NotificationChannel;
  provider?: NotificationProvider;
  status?: NotificationStatus;
  recipient?: string;
};

export type NotificationLogsResponse = {
  items: NotificationLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type NotificationSummaryParams = {
  eventId?: string;
  hours?: number;
};

export type NotificationTemplateListItem = {
  id: string;
  eventId?: string | null;
  type: string;
  channel: NotificationChannel;
  locale: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationTemplatesParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  channel?: NotificationChannel;
  isActive?: boolean;
};

export type NotificationTemplatesResponse = {
  items: NotificationTemplateListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
