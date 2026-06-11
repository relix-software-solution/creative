export type StaffAssignmentRole = "SCANNER" | "SUPERVISOR" | string;

export type StaffAssignment = {
  id: string;
  eventId: string;
  userId: string;
  checkpointId: string;
  deviceId: string;
  role?: StaffAssignmentRole | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  event?: {
    id: string;
    titleAr?: string;
    titleEn?: string | null;
    startsAt?: string;
    endsAt?: string | null;
  } | null;

  user?: {
    id: string;
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    role?: string;
  } | null;

  checkpoint?: {
    id: string;
    nameAr?: string;
    nameEn?: string | null;
    code?: string | null;
    type?: string | null;
    zone?: {
      id: string;
      nameAr?: string;
      nameEn?: string | null;
    } | null;
  } | null;

  device?: {
    id: string;
    name?: string;
    code?: string | null;
    status?: string | null;
    rawApiKey?: string | null;
    apiKey?: string | null;
    deviceApiKey?: string | null;
  } | null;
};

export type StaffAssignmentsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  userId?: string;
  checkpointId?: string;
  deviceId?: string;
  isActive?: boolean;
};

export type StaffAssignmentsListResponse = {
  items: StaffAssignment[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateStaffAssignmentPayload = {
  eventId: string;
  userId: string;
  checkpointId: string;
  deviceId: string;
};

export type StaffSession = {
  id: string;
  eventId: string;
  staffUserId?: string;
  deviceId: string;
  checkpointId: string;
  status?: string;
  startedAt?: string;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  event?: StaffAssignment["event"];
  checkpoint?: StaffAssignment["checkpoint"];
  device?: StaffAssignment["device"];
};

export type StartMyStaffSessionResponse = StaffSession;
