import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  AttendeeType,
  AttendeeTypesListParams,
  AttendeeTypesListResponse,
  CreateAttendeeTypePayload,
  UpdateAttendeeTypePayload,
} from "./attendee-types.types";

function normalizeAttendeeTypesList(data: unknown): AttendeeTypesListResponse {
  const value = unwrapApiData<AttendeeTypesListResponse | AttendeeType[]>(data);

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

export async function getAttendeeTypes(params: AttendeeTypesListParams) {
  const response = await adminClient.get("/attendee-types", {
    params,
  });

  return normalizeAttendeeTypesList(response.data);
}

export async function getAttendeeType(id: string) {
  const response = await adminClient.get(`/attendee-types/${id}`);
  return unwrapApiData<AttendeeType>(response.data);
}

export async function createAttendeeType(payload: CreateAttendeeTypePayload) {
  const response = await adminClient.post("/attendee-types", payload);
  return unwrapApiData<AttendeeType>(response.data);
}

export async function updateAttendeeType(
  id: string,
  payload: UpdateAttendeeTypePayload,
) {
  const response = await adminClient.patch(`/attendee-types/${id}`, payload);
  return unwrapApiData<AttendeeType>(response.data);
}

export async function deleteAttendeeType(id: string) {
  const response = await adminClient.delete(`/attendee-types/${id}`);
  return unwrapApiData<AttendeeType>(response.data);
}
