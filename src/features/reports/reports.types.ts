export type ReportDateRangeParams = {
  from?: string;
  to?: string;
};

export type EventReportParams = ReportDateRangeParams & {
  eventId: string;
};

export type ReportOverview = {
  totalRegistrations?: number;
  activeRegistrations?: number;
  cancelledRegistrations?: number;
  blockedRegistrations?: number;
  totalScans?: number;
  totalMovements?: number;
  activeStaffSessions?: number;
  uniqueAttendees?: number;
  [key: string]: unknown;
};

export type ReportBreakdownItem = {
  id?: string;
  code?: string;
  type?: string;
  label?: string;
  labelAr?: string;
  labelEn?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  count?: number;
  total?: number;
  value?: number;
  percentage?: number;
  [key: string]: unknown;
};

export type ReportHourItem = {
  hour?: string;
  date?: string;
  label?: string;
  count?: number;
  total?: number;
  value?: number;
  [key: string]: unknown;
};

export type ReportCheckpointItem = {
  id?: string;
  checkpointId?: string;
  checkpointName?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  scans?: number;
  movements?: number;
  entries?: number;
  exits?: number;
  total?: number;
  [key: string]: unknown;
};

export type ReportStaffPerformanceItem = {
  id?: string;
  staffUserId?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  scans?: number;
  movements?: number;
  sessions?: number;
  total?: number;
  [key: string]: unknown;
};
