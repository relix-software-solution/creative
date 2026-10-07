export type ReportDateRangeParams = {
  from?: string;
  to?: string;
};

export type ReportOverview = {
  event: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
    status?: string | null;
    startsAt: string;
    endsAt: string;
  };
  registrations: {
    total: number;
    active: number;
    cancelled: number;
    blocked: number;
    archived: number;
  };
  movements: {
    total: number;
    allowed: number;
    denied: number;
    warnings: number;
    entries: number;
    exits: number;
  };
  attendance: {
    uniqueCheckedIn: number;
    currentInside?: number;
    currentInsideApprox?: number;
    attendanceRate: number;
  };
  qr: {
    totalGenerated: number;
    active: number;
    revoked: number;
    expired: number;
  };
};

export type ReportBreakdownItem = {
  attendeeTypeId?: string;
  attendeeTypeCode?: string;
  attendeeTypeNameAr?: string;
  attendeeTypeNameEn?: string | null;
  type?: string;
  result?: string;
  count?: number;
  total?: number;
  active?: number;
  cancelled?: number;
  blocked?: number;
};

export type ReportHourItem = {
  hour: string;
  total: number;
  allowed: number;
  denied: number;
};

export type ReportCheckpointItem = {
  checkpointId: string;
  checkpointCode?: string | null;
  checkpointNameAr: string;
  checkpointNameEn?: string | null;
  totalMovements: number;
  allowed: number;
  denied: number;
  entries: number;
  exits: number;
};

export type ReportStaffPerformanceItem = {
  staffUserId: string;
  fullName: string;
  totalMovements: number;
  allowed: number;
  denied: number;
  activeSessionsCount: number;
  lastSeenAt?: string | null;
};
