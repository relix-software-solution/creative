import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationsImportPayload,
  CreateRegistrationsImportResponse,
  ImportJob,
  ImportPreviewResponse,
  ImportRowsListParams,
  ImportRowsListResponse,
  ImportsListParams,
  ImportsListResponse,
  PreviewRegistrationsImportPayload,
} from "./imports.types";

function normalizeImportsList(data: unknown): ImportsListResponse {
  const value = unwrapApiData<ImportsListResponse | ImportJob[]>(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length || 20,
      totalPages: 1,
    };
  }

  return {
    items: value.items ?? [],
    total: value.total ?? value.items?.length ?? 0,
    page: value.page ?? 1,
    limit: value.limit ?? 20,
    totalPages: value.totalPages ?? 1,
  };
}

function normalizeImportRowsList(data: unknown): ImportRowsListResponse {
  const value = unwrapApiData<
    ImportRowsListResponse | ImportRowsListResponse["items"]
  >(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length || 20,
      totalPages: 1,
    };
  }

  return {
    items: value.items ?? [],
    total: value.total ?? value.items?.length ?? 0,
    page: value.page ?? 1,
    limit: value.limit ?? 20,
    totalPages: value.totalPages ?? 1,
  };
}

function appendParserFields(
  formData: FormData,
  payload: {
    sheetName?: string;
    headerRow?: number;
    dataStartRow?: number;
  },
) {
  if (payload.sheetName) {
    formData.append("sheetName", payload.sheetName);
  }

  if (payload.headerRow) {
    formData.append("headerRow", String(payload.headerRow));
  }

  if (payload.dataStartRow) {
    formData.append("dataStartRow", String(payload.dataStartRow));
  }
}

export async function previewRegistrationsImport(
  payload: PreviewRegistrationsImportPayload,
) {
  const formData = new FormData();

  formData.append("eventId", payload.eventId);

  if (payload.attendeeTypeId) {
    formData.append("attendeeTypeId", payload.attendeeTypeId);
  }

  appendParserFields(formData, payload);
  formData.append("file", payload.file);

  const response = await adminClient.post(
    "/imports/registrations/preview",
    formData,
  );

  return unwrapApiData<ImportPreviewResponse>(response.data);
}

export async function createRegistrationsImport(
  payload: CreateRegistrationsImportPayload,
) {
  const formData = new FormData();

  formData.append("eventId", payload.eventId);

  if (payload.attendeeTypeId) {
    formData.append("attendeeTypeId", payload.attendeeTypeId);
  }

  formData.append("generateQr", String(payload.generateQr));
  formData.append("duplicateStrategy", payload.duplicateStrategy);
  formData.append("mapping", JSON.stringify(payload.mapping));

  if (payload.externalIdPrefix?.trim()) {
    formData.append("externalIdPrefix", payload.externalIdPrefix.trim());
  }

  appendParserFields(formData, payload);
  formData.append("file", payload.file);

  const response = await adminClient.post("/imports/registrations", formData);
  const value = unwrapApiData<
    CreateRegistrationsImportResponse | ImportJob
  >(response.data);

  if ("importJob" in value) {
    return value;
  }

  return {
    importJob: value,
    queued: false,
  } satisfies CreateRegistrationsImportResponse;
}

export async function getImports(params: ImportsListParams) {
  const response = await adminClient.get("/imports", {
    params,
  });

  return normalizeImportsList(response.data);
}

export async function getImportJob(id: string) {
  const response = await adminClient.get(`/imports/${id}`);
  return unwrapApiData<ImportJob>(response.data);
}

export async function getImportRows(
  importJobId: string,
  params: ImportRowsListParams,
) {
  const response = await adminClient.get(`/imports/${importJobId}/rows`, {
    params,
  });

  return normalizeImportRowsList(response.data);
}
