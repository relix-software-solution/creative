export type NotificationTemplateType = "REGISTRATION_QR" | string;

export type NotificationTemplateChannel = "WHATSAPP" | "EMAIL" | "SMS";

export type NotificationTemplateLocale = "AR" | "EN" | string;

export type NotificationTemplate = {
  id: string;
  eventId: string;
  type: NotificationTemplateType;
  channel: NotificationTemplateChannel;
  locale: NotificationTemplateLocale;
  name: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationTemplatesListResponse = {
  items?: NotificationTemplate[];
  templates?: NotificationTemplate[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateNotificationTemplatePayload = {
  eventId: string;
  type: "REGISTRATION_QR";
  channel: "WHATSAPP";
  locale: "AR" | "EN";
  name: string;
  content: string;
  isActive: boolean;
};

export type UpdateNotificationTemplatePayload = {
  name?: string;
  content?: string;
  isActive?: boolean;
};
