export type AdminSettings = {
  id: string;
  organizationName: string;
  timezone: string;
  defaultLocale: "ar" | "en";
  reportExportMaxRows: number;
  reportDefaultRangeDays: number;
  notificationSummaryHours: number;
  notificationAlertThreshold: number;
  notificationPollingSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAdminSettingsPayload = Partial<
  Pick<
    AdminSettings,
    | "organizationName"
    | "timezone"
    | "defaultLocale"
    | "reportExportMaxRows"
    | "reportDefaultRangeDays"
    | "notificationSummaryHours"
    | "notificationAlertThreshold"
    | "notificationPollingSeconds"
  >
>;
