export type DeviceStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"
  | "INACTIVE"
  | string;

export type Device = {
  id: string;
  eventId: string;
  name: string;
  code?: string | null;
  status?: DeviceStatus;
  metadata?: Record<string, unknown> | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  event?: {
    id: string;
    titleAr?: string;
    titleEn?: string | null;
  } | null;
};

export type DevicesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
  status?: string;
};

export type DevicesListResponse = {
  items: Device[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateDevicePayload = {
  eventId: string;
  name: string;
  code?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateDevicePayload = {
  name?: string;
  code?: string;
  metadata?: Record<string, unknown>;
};

export type DeviceSecretResponse = {
  device: Device;
  rawApiKey: string;
};
