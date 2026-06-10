export type ImportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIALLY_COMPLETED"
  | string;

export type ImportRowStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED"
  | string;

export type ImportJob = {
  id: string;
  eventId: string;
  attendeeTypeId: string;

  fileName?: string | null;
  originalFileName?: string | null;

  status: ImportJobStatus;

  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  skippedRows?: number | null;

  errorMessage?: string | null;

  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;

  event?: {
    id: string;
    titleAr: string;
    titleEn?: string | null;
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
  rowNumber?: number | null;

  status: ImportRowStatus;

  data?: Record<string, unknown> | null;
  errors?: string[] | string | null;
  errorMessage?: string | null;

  registrationId?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type ImportsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  attendeeTypeId?: string;
  status?: string;
};

export type ImportRowsListParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export type ImportsListResponse = {
  items: ImportJob[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type ImportRowsListResponse = {
  items: ImportRow[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateRegistrationsImportPayload = {
  eventId: string;
  attendeeTypeId: string;
  file: File;
};
