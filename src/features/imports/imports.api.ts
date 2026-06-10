import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationsImportPayload,
  ImportJob,
  ImportRowsListParams,
  ImportRowsListResponse,
  ImportsListParams,
  ImportsListResponse,
} from "./imports.types";

function normalizeImportsList(data: unknown): ImportsListResponse {
  const value = unwrapApiData<ImportsListResponse | ImportJob[]>(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length,
      totalPages: 1,
    };
  }

  return {
    items: value.items ?? [],
    total: value.total,
    page: value.page,
    limit: value.limit,
    totalPages: value.totalPages,
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
      limit: value.length,
      totalPages: 1,
    };
  }

  return {
    items: value.items ?? [],
    total: value.total,
    page: value.page,
    limit: value.limit,
    totalPages: value.totalPages,
  };
}

export async function createRegistrationsImport(
  payload: CreateRegistrationsImportPayload,
) {
  const formData = new FormData();

  formData.append("eventId", payload.eventId);
  formData.append("attendeeTypeId", payload.attendeeTypeId);
  formData.append("file", payload.file);

  const response = await adminClient.post("/imports/registrations", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapApiData<ImportJob>(response.data);
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
