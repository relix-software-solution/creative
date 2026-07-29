export type ImportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export type ImportRowStatus =
  | "PENDING"
  | "PROCESSED"
  | "FAILED"
  | "DUPLICATE"
  | "SKIPPED";

export type ImportDuplicateStrategy = "SKIP" | "FAIL" | "UPDATE_EXISTING";

export type ImportMapping = {
  fullName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  jobTitle?: string;
  externalId?: string;
  notes?: string;
  attendeeTypeCode?: string;
  customFields?: Record<string, string>;
};

export type ImportJob = {
  id: string;
  eventId: string;
  attendeeTypeId?: string | null;

  fileName: string;
  fileMimeType?: string | null;
  fileSizeBytes?: number | null;

  status: ImportJobStatus;

  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  duplicateRows: number;

  options?: Record<string, unknown> | null;
  summary?: Record<string, unknown> | null;

  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  event?: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
    status?: string;
  } | null;

  attendeeType?: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    code: string;
  } | null;
};

export type ImportRow = {
  id: string;
  importJobId: string;
  rowNumber: number;

  status: ImportRowStatus;

  rawData: Record<string, unknown>;
  normalizedData?: Record<string, unknown> | null;

  errorCode?: string | null;
  errorMessage?: string | null;

  registrationId?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ImportsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  attendeeTypeId?: string;
  status?: ImportJobStatus | string;
};

export type ImportRowsListParams = {
  page?: number;
  limit?: number;
  status?: ImportRowStatus | string;
};

export type ImportsListResponse = {
  items: ImportJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ImportRowsListResponse = {
  items: ImportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ImportPreviewHeader = {
  key: string;
  label: string;
  columnIndex: number;
  columnLetter: string;
  sampleValues: string[];
};

export type ImportPreviewWarning = {
  code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  rowNumbers?: number[];
};

export type ImportPreviewResponse = {
  file: {
    name: string;
    size: number;
    mimeType?: string | null;
  };
  sheets: string[];
  selectedSheetName: string;
  detectedHeaderRow: number;
  headerRow: number;
  dataStartRow: number;
  totalRows: number;
  headers: ImportPreviewHeader[];
  previewRows: Array<{
    rowNumber: number;
    values: Record<string, unknown>;
  }>;
  suggestedMapping: ImportMapping;
  availableFields: {
    system: Array<{
      key: keyof Omit<ImportMapping, "customFields">;
      labelAr: string;
      required: boolean;
    }>;
    custom: Array<{
      key: string;
      labelAr: string;
      labelEn?: string | null;
      type: string;
      required: boolean;
      attendeeTypeId?: string | null;
    }>;
  };
  warnings: ImportPreviewWarning[];
};

export type PreviewRegistrationsImportPayload = {
  eventId: string;
  attendeeTypeId?: string;
  file: File;
  sheetName?: string;
  headerRow?: number;
  dataStartRow?: number;
};

export type CreateRegistrationsImportPayload = {
  eventId: string;
  attendeeTypeId?: string;
  file: File;
  generateQr: boolean;
  duplicateStrategy: ImportDuplicateStrategy;
  externalIdPrefix?: string;
  mapping: ImportMapping;
  sheetName: string;
  headerRow: number;
  dataStartRow: number;
};

export type CreateRegistrationsImportResponse = {
  importJob: ImportJob;
  queued: boolean;
};
