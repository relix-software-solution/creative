import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import type {
  PublicQrTokenObject,
  PublicRegisterPayload,
} from "@/features/public-events/public-events.types";
import {
  ProvisionStaffOfflineKeyPayload,
  ProvisionStaffOfflineKeyResponse,
  StaffOfflineSyncError,
  StaffSyncBatchRequest,
  StaffSyncOperationResult,
  SubmitStaffSyncOperation,
  SyncOfflineStaffRegistrationInput,
  SyncOfflineStaffRegistrationResult,
} from "./staff-offline.types";

const SUCCESS_OPERATION_STATUSES = new Set([
  "PROCESSED",
  "COMPLETED",
  "SUCCESS",
  "SUCCEEDED",
  "SYNCED",
  "APPLIED",
  "ACCEPTED",
  "CREATED",
  "DONE",
]);

const FAILED_OPERATION_STATUSES = new Set([
  "FAILED",
  "SKIPPED",
  "REJECTED",
  "CONFLICT",
  "CANCELLED",
]);

export async function provisionMyAssignedDeviceOfflineKey(
  payload: ProvisionStaffOfflineKeyPayload,
) {
  const response = await adminClient.post("/staff/offline/key", payload);

  return unwrapApiData<ProvisionStaffOfflineKeyResponse>(response.data);
}

function createOperationId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  });
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function readNestedError(record: Record<string, unknown>) {
  const error = asRecord(record.error);

  return {
    code: firstString(
      record.errorCode,
      record.code,
      error?.code,
      error?.errorCode,
    ),

    message: firstString(
      record.errorMessage,
      record.message,
      error?.message,
      error?.errorMessage,
    ),
  };
}

function normalizeOperationResult(
  value: unknown,
): StaffSyncOperationResult | null {
  const operation = asRecord(value);

  if (!operation) {
    return null;
  }

  const operationId = firstString(
    operation.operationId,
    operation.idempotencyKey,
    operation.clientOperationId,
  );

  if (!operationId) {
    return null;
  }

  const output =
    asRecord(operation.output) ??
    asRecord(operation.result) ??
    asRecord(operation.data) ??
    {};

  const error = readNestedError(operation);

  return {
    operationId,

    type: firstString(operation.type, operation.operationType),

    status: normalizeStatus(
      operation.status ??
        operation.state ??
        operation.operationStatus ??
        operation.resultStatus,
    ),

    output,

    errorCode: error.code ?? null,
    errorMessage: error.message ?? null,
  };
}

function addOperationArray(
  target: unknown[][],
  record: Record<string, unknown> | null,
) {
  if (!record) {
    return;
  }

  if (Array.isArray(record.operations)) {
    target.push(record.operations);
  }

  if (Array.isArray(record.results)) {
    target.push(record.results);
  }

  const result = asRecord(record.result);

  if (!result) {
    return;
  }

  if (Array.isArray(result.operations)) {
    target.push(result.operations);
  }

  if (Array.isArray(result.results)) {
    target.push(result.results);
  }
}

function extractOperationResults(value: unknown): StaffSyncOperationResult[] {
  const root = asRecord(value);

  if (!root) {
    return [];
  }

  const arrays: unknown[][] = [];

  const data = asRecord(root.data);
  const batch = asRecord(root.batch);
  const rootResult = asRecord(root.result);

  const dataBatch = asRecord(data?.batch);
  const dataResult = asRecord(data?.result);

  addOperationArray(arrays, root);
  addOperationArray(arrays, data);
  addOperationArray(arrays, batch);
  addOperationArray(arrays, rootResult);
  addOperationArray(arrays, dataBatch);
  addOperationArray(arrays, dataResult);

  const results = arrays
    .flat()
    .map(normalizeOperationResult)
    .filter(
      (operation): operation is StaffSyncOperationResult => operation !== null,
    );

  const uniqueResults = new Map<string, StaffSyncOperationResult>();

  for (const result of results) {
    uniqueResults.set(result.operationId, result);
  }

  return [...uniqueResults.values()];
}

function readQrToken(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  return (
    firstString(
      record.qrToken,
      record.canonicalQrToken,
      record.compactQrToken,
      record.token,
      record.signedToken,
      record.value,
    ) ?? ""
  );
}

function readCanonicalRegistrationOutput(output: Record<string, unknown>) {
  const registration =
    asRecord(output.registration) ??
    asRecord(output.canonicalRegistration) ??
    asRecord(output.backendRegistration) ??
    asRecord(output.data);

  const mapping =
    asRecord(output.mapping) ??
    asRecord(output.offlineRegistrationMapping) ??
    asRecord(output.registrationMapping);

  const registrationId = firstString(
    output.registrationId,
    output.canonicalRegistrationId,
    output.backendRegistrationId,

    registration?.id,
    registration?.registrationId,
    registration?.canonicalRegistrationId,

    mapping?.registrationId,
    mapping?.canonicalRegistrationId,
    mapping?.backendRegistrationId,

    output.publicId ? output.id : undefined,
  );

  const publicId = firstString(
    output.publicId,
    output.canonicalPublicId,
    output.registrationPublicId,

    registration?.publicId,
    registration?.canonicalPublicId,
    registration?.registrationPublicId,

    mapping?.publicId,
    mapping?.canonicalPublicId,
  );

  const qrObject =
    asRecord(output.qr) ??
    asRecord(output.canonicalQr) ??
    asRecord(registration?.qr) ??
    asRecord(registration?.qrToken);

  const canonicalQrToken = firstString(
    output.canonicalQrToken,
    output.qrToken,
    output.compactQrToken,

    registration?.canonicalQrToken,
    registration?.qrToken,
    registration?.compactQrToken,

    readQrToken(qrObject),
  );

  return {
    registration,
    registrationId,
    publicId,
    canonicalQrToken,
  };
}

function assertRequiredString(
  value: unknown,
  field: string,
  code: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new StaffOfflineSyncError(`${field} is required`, {
      code,
      retryable: false,
    });
  }

  return value.trim();
}

function assertOperationSucceeded(operation: StaffSyncOperationResult) {
  const status = normalizeStatus(operation.status);

  if (FAILED_OPERATION_STATUSES.has(status)) {
    throw new StaffOfflineSyncError(
      operation.errorMessage ||
        operation.errorCode ||
        `Offline operation failed with status ${status}`,
      {
        code: operation.errorCode || `OFFLINE_OPERATION_${status}`,
        retryable: false,
      },
    );
  }

  if (status === "DUPLICATE") {
    const outputStatus = normalizeStatus(
      operation.output.status ?? operation.output.resultStatus,
    );

    if (
      operation.errorCode === "DUPLICATE_REGISTRATION" ||
      outputStatus === "MATCHED_EXISTING"
    ) {
      throw new StaffOfflineSyncError(
        "يوجد زائر مسجل مسبقًا بنفس الهاتف أو البريد.",
        {
          code: "DUPLICATE_REGISTRATION",
          retryable: false,
        },
      );
    }

    if (operation.errorCode || operation.errorMessage) {
      throw new StaffOfflineSyncError(
        operation.errorMessage ||
          operation.errorCode ||
          "Conflicting duplicate offline operation",
        {
          code: operation.errorCode || "OFFLINE_OPERATION_CONFLICT",

          retryable: false,
        },
      );
    }

    /*
     * Duplicate لنفس operationId بعد نجاح سابق.
     * هذا فقط النوع الذي يمكن اعتباره Idempotent success.
     */
    return;
  }

  if (!SUCCESS_OPERATION_STATUSES.has(status)) {
    throw new StaffOfflineSyncError(
      status
        ? `Unexpected offline operation status: ${status}`
        : "Offline operation status is missing",
      {
        code: status
          ? `UNEXPECTED_OFFLINE_OPERATION_STATUS_${status}`
          : "OFFLINE_OPERATION_STATUS_MISSING",

        retryable: true,
      },
    );
  }
}

function getHttpErrorDetails(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }

  const response = (
    error as {
      response?: {
        status?: number;

        data?: {
          message?: string | string[];
          error?: string;
        };
      };
    }
  ).response;

  if (!response) {
    return null;
  }

  const responseMessage = response.data?.message;

  const message = Array.isArray(responseMessage)
    ? responseMessage[0]
    : responseMessage || response.data?.error;

  return {
    status: response.status,
    message,
  };
}

function normalizeRequestError(error: unknown): StaffOfflineSyncError {
  if (error instanceof StaffOfflineSyncError) {
    return error;
  }

  const http = getHttpErrorDetails(error);

  if (http?.status) {
    const retryable =
      http.status === 408 ||
      http.status === 425 ||
      http.status === 429 ||
      http.status >= 500;

    return new StaffOfflineSyncError(http.message || `HTTP ${http.status}`, {
      code: `HTTP_${http.status}`,
      retryable,
      httpStatus: http.status,
    });
  }

  if (error instanceof Error) {
    return new StaffOfflineSyncError(error.message || "Network error", {
      code: "NETWORK_OR_UNKNOWN_ERROR",
      retryable: true,
    });
  }

  return new StaffOfflineSyncError("Unknown offline synchronization error", {
    code: "UNKNOWN_OFFLINE_SYNC_ERROR",
    retryable: true,
  });
}

function toQrObject(
  qrToken: string,
  canonicalQrToken?: string | null,
): PublicQrTokenObject {
  return {
    qrToken,
    token: qrToken,
    status: canonicalQrToken ? "ACTIVE" : "OFFLINE_VERIFIED",
  };
}

export async function syncOfflineStaffRegistration(
  input: SyncOfflineStaffRegistrationInput,
): Promise<SyncOfflineStaffRegistrationResult> {
  const eventId = assertRequiredString(
    input.eventId,
    "eventId",
    "EVENT_ID_REQUIRED",
  );

  const deviceId = assertRequiredString(
    input.deviceId,
    "deviceId",
    "DEVICE_ID_REQUIRED",
  );

  const staffSessionId = assertRequiredString(
    input.staffSessionId,
    "staffSessionId",
    "STAFF_SESSION_ID_REQUIRED",
  );

  const operationId = assertRequiredString(
    input.payload.offlineOperationId,
    "offlineOperationId",
    "OFFLINE_OPERATION_ID_REQUIRED",
  );

  const offlineRegistrationId = assertRequiredString(
    input.payload.offlineRegistrationId,
    "offlineRegistrationId",
    "OFFLINE_REGISTRATION_ID_REQUIRED",
  );

  const signedOfflineQr = assertRequiredString(
    input.payload.signedOfflineQr,
    "signedOfflineQr",
    "SIGNED_OFFLINE_QR_REQUIRED",
  );

  const offlineQrToken = assertRequiredString(
    input.payload.offlineQrToken,
    "offlineQrToken",
    "OFFLINE_QR_TOKEN_REQUIRED",
  );

  const operation: SubmitStaffSyncOperation = {
    operationId,
    type: "OFFLINE_REGISTRATION",

    payload: {
      eventId,

      signedOfflineQr,
      offlineRegistrationOperationId: operationId,
      offlineRegistrationId,
      offlineQrToken,

      attendeeTypeId: input.payload.attendeeTypeId,

      fullName: input.payload.fullName,
      phone: input.payload.phone,

      email: input.payload.email ?? null,
      companyName: input.payload.companyName ?? null,
      jobTitle: input.payload.jobTitle ?? null,

      externalId: input.payload.externalId ?? operationId,

      customFields: input.payload.customFields ?? {},

      notes:
        input.payload.notes ?? "Created securely offline from staff scanner.",
    },
  };

  const commonBody = {
    batchId: createOperationId("offline-registration-batch"),
    eventId,
    staffSessionId,
    operations: [operation],
  };

  try {
    const response = input.deviceApiKey?.trim()
      ? await adminClient.post("/device/sync/batches", commonBody, {
          headers: {
            "X-Device-Api-Key": input.deviceApiKey.trim(),
          },
        })
      : await adminClient.post("/sync/batches", {
          ...commonBody,
          deviceId,
        } satisfies StaffSyncBatchRequest);

    const responseData = unwrapApiData<unknown>(response.data);

    const operationResult = extractOperationResults(responseData).find(
      (item) => item.operationId === operationId,
    );

    if (!operationResult) {
      throw new StaffOfflineSyncError(
        `Sync response does not contain operation ${operationId}`,
        {
          code: "OFFLINE_OPERATION_RESULT_MISSING",
          retryable: true,
        },
      );
    }

    assertOperationSucceeded(operationResult);

    const operationOutput = operationResult.output;

    const outputStatus = normalizeStatus(
      operationOutput.status ??
        operationOutput.resultStatus ??
        operationOutput.syncStatus,
    );

    if (
      outputStatus === "MATCHED_EXISTING" ||
      outputStatus === "ALREADY_EXISTS"
    ) {
      throw new StaffOfflineSyncError(
        "يوجد تسجيل سابق بنفس الهاتف أو البريد. لم يتم إنشاء زائر جديد.",
        {
          code: "DUPLICATE_REGISTRATION",
          retryable: false,
        },
      );
    }

    const canonical = readCanonicalRegistrationOutput(operationResult.output);

    if (!canonical.registrationId) {
      throw new StaffOfflineSyncError(
        "Backend confirmed the operation without returning a canonical registration ID",
        {
          code: "CANONICAL_REGISTRATION_ID_MISSING",
          retryable: true,
        },
      );
    }

    const canonicalRegistration = canonical.registration;

    const canonicalPublicId =
      canonical.publicId ?? input.payload.offlinePublicId ?? null;

    /**
     * PublicRegisterResponse يقبل string | undefined.
     *
     * نبقي null داخل sync metadata فقط،
     * لكن Response العام يأخذ undefined عندما لا توجد قيمة.
     */
    const responsePublicId = canonicalPublicId ?? undefined;

    const effectiveQrToken = canonical.canonicalQrToken ?? signedOfflineQr;

    const duplicate = normalizeStatus(operationResult.status) === "DUPLICATE";

    const fullName =
      firstString(canonicalRegistration?.fullName, input.payload.fullName) ??
      input.payload.fullName;

    const phone =
      firstString(canonicalRegistration?.phone, input.payload.phone) ??
      input.payload.phone;

    const email =
      firstString(canonicalRegistration?.email, input.payload.email) ?? null;

    const companyName =
      firstString(
        canonicalRegistration?.companyName,
        input.payload.companyName,
      ) ?? null;

    const jobTitle =
      firstString(canonicalRegistration?.jobTitle, input.payload.jobTitle) ??
      null;

    const externalId =
      firstString(
        canonicalRegistration?.externalId,
        input.payload.externalId,
        operationId,
      ) ?? operationId;

    const notes =
      firstString(canonicalRegistration?.notes, input.payload.notes) ?? null;

    const attendeeTypeId =
      firstString(
        canonicalRegistration?.attendeeTypeId,
        input.payload.attendeeTypeId,
      ) ?? input.payload.attendeeTypeId;

    const customFields =
      asRecord(canonicalRegistration?.customFields) ??
      input.payload.customFields ??
      {};

    const status = firstString(canonicalRegistration?.status) ?? "ACTIVE";

    return {
      id: canonical.registrationId,
      publicId: responsePublicId,

      fullName,
      phone,
      email,

      companyName,
      jobTitle,
      externalId,
      notes,

      attendeeTypeId,
      customFields,
      status,

      qrToken: effectiveQrToken,

      qr: toQrObject(effectiveQrToken, canonical.canonicalQrToken),

      registration: {
        id: canonical.registrationId,
        publicId: responsePublicId,

        fullName,
        phone,
        email,

        companyName,
        jobTitle,
        externalId,
        notes,

        status,
        attendeeTypeId,
        customFields,
      },

      sync: {
        operationId,
        operationStatus: normalizeStatus(operationResult.status),
        duplicate,

        offlineRegistrationId,
        offlineQrToken,
        signedOfflineQr,

        canonicalRegistrationId: canonical.registrationId,
        canonicalPublicId,
        canonicalQrToken: canonical.canonicalQrToken ?? null,
      },
    };
  } catch (error) {
    throw normalizeRequestError(error);
  }
}
