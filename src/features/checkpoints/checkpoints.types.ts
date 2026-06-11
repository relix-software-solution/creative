export type CheckpointType =
  | "ENTRY"
  | "EXIT"
  | "BOTH"
  | "SESSION_ROOM"
  | "VIP_AREA"
  | "INTERNAL_POINT"
  | "WORKSHOP_AREA"
  | "OTHER";

export type Checkpoint = {
  id: string;
  eventId: string;
  venueId: string;
  zoneId: string;
  type: CheckpointType;
  nameAr: string;
  nameEn: string;
  code: string;
  allowedAttendeeTypes: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  venue?: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
  zone?: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
};

export type CheckpointsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  venueId?: string;
  zoneId?: string;
};

export type CreateCheckpointPayload = {
  eventId: string;
  venueId: string;
  zoneId: string;
  type: CheckpointType;
  nameAr: string;
  nameEn: string;
  code: string;
  allowedAttendeeTypes: string[];
  isActive: boolean;
  sortOrder: number;
};

export type UpdateCheckpointPayload = Partial<CreateCheckpointPayload>;

export type CheckpointsListResponse = {
  items: Checkpoint[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
