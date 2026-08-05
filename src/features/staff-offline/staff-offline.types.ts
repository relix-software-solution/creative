import type {
  PublicRegisterPayload,
  PublicRegisterResponse,
} from "@/features/public-events/public-events.types";

export type StaffSyncOperationType =
  | "OFFLINE_REGISTRATION"
  | "OFFLINE_SCAN"
  | "QR_GENERATION"
  | "SCAN_EVENT";

export type StaffSyncOperationStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "COMPLETED"
  | "SUCCESS"
  | "SUCCEEDED"
  | "SYNCED"
  | "APPLIED"
  | "ACCEPTED"
  | "CREATED"
  | "DUPLICATE"
  | "FAILED"
  | "SKIPPED"
  | "REJECTED"
  | "CONFLICT"
  | string;

export type SubmitStaffSyncOperation = {
  operationId: string;
  type: StaffSyncOperationType;
  payload: Record<string, unknown>;
};

export type StaffSyncOperationResult = {
  operationId: string;
  type?: StaffSyncOperationType | string;
  status: StaffSyncOperationStatus;

  output: Record<string, unknown>;

  errorCode?: string | null;
  errorMessage?: string | null;
  retryable?: boolean | null;
};

export type StaffSyncBatchRequest = {
  batchId: string;
  eventId: string;
  deviceId?: string;
  staffSessionId: string;
  operations: SubmitStaffSyncOperation[];
};

export type ProvisionStaffOfflineKeyPayload = {
  publicKey: string;
  keyVersion: number;
};

export type ProvisionStaffOfflineKeyResponse = {
  deviceId: string;
  eventId: string;
  keyVersion: number;
  status: string;
  validFrom: string;
  validUntil?: string | null;
};

export type SyncOfflineStaffRegistrationInput = {
  eventId: string;
  deviceId: string;
  staffSessionId: string;
  deviceApiKey?: string | null;
  payload: PublicRegisterPayload;
};

export type SyncOfflineStaffRegistrationResult = PublicRegisterResponse & {
  sync: {
    operationId: string;
    operationStatus: string;
    duplicate: boolean;

    offlineRegistrationId: string;
    offlineQrToken: string;
    signedOfflineQr: string;

    canonicalRegistrationId: string;
    canonicalPublicId?: string | null;
    canonicalQrToken?: string | null;
  };
};

export class StaffOfflineSyncError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly httpStatus?: number;

  constructor(
    message: string,
    options?: {
      code?: string;
      retryable?: boolean;
      httpStatus?: number;
    },
  ) {
    super(message);

    this.name = "StaffOfflineSyncError";
    this.code = options?.code ?? "STAFF_OFFLINE_SYNC_FAILED";
    this.retryable = options?.retryable ?? false;
    this.httpStatus = options?.httpStatus;
  }
}
