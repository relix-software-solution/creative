export type AdminDashboardKpis = {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  registrationsLast24Hours: number;
  totalScans: number;
  scansLastHour: number;
  totalClients: number;
  activeClients: number;
  activeDevices: number;
  onlineDevices: number;
  activeStaffSessions: number;
  currentlyInside: number;
  failedNotifications: number;
};

export type AdminDashboardLive = {
  activeEventCount: number;
  activeEventRegistrations: number;
  uniqueCheckedIn: number;
  currentlyInside: number;
  attendanceRate: number;
  occupancyRate: number;
  activeCheckpoints: number;
  movementsLastHour: number;
};

export type AdminDashboardAlerts = {
  failedNotifications: number;
  failedNotificationsLast24Hours: number;
  suspendedDevices: number;
  failedImports: number;
  pendingImports: number;
};

export type AdminDashboardRegistrationTrendItem = {
  date: string;
  count: number;
};

export type AdminDashboardMovementTrendItem = {
  hour: string;
  entries: number;
  exits: number;
  denied: number;
  total: number;
};

export type AdminDashboardRecentRegistration = {
  id: string;
  publicId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  source: string;
  registeredAt: string;
  event: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
  };
  attendeeType: {
    id: string;
    code: string;
    nameAr: string;
    nameEn?: string | null;
  };
};

export type AdminDashboardRecentMovement = {
  id: string;
  type: string;
  result: string;
  reason?: string | null;
  occurredAt: string;
  registration: {
    id: string;
    fullName: string;
  };
  event: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
  };
  checkpoint?: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    code: string;
  } | null;
};

export type AdminDashboardEventSummary = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  timezone: string;
  client: {
    id: string;
    name: string;
  };
  registrations: number;
  checkpoints: number;
  staffSessions: number;
};

export type AdminDashboardTopEvent = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  client: {
    id: string;
    name: string;
  };
  registrations: number;
  movements: number;
};

export type AdminDashboardSummary = {
  generatedAt: string;
  timezone: string;
  refreshRecommendedAfterSeconds: number;
  kpis: AdminDashboardKpis;
  live: AdminDashboardLive;
  alerts: AdminDashboardAlerts;
  registrationTrend: AdminDashboardRegistrationTrendItem[];
  movementTrend: AdminDashboardMovementTrendItem[];
  recentRegistrations: AdminDashboardRecentRegistration[];
  recentMovements: AdminDashboardRecentMovement[];
  events: {
    active: AdminDashboardEventSummary[];
    upcoming: AdminDashboardEventSummary[];
  };
  topEvents: AdminDashboardTopEvent[];
};
