import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  AttendeeType,
  AttendeeTypesListParams,
  AttendeeTypesListResponse,
  CreateAttendeeTypePayload,
  UpdateAttendeeTypePayload,
} from "./attendee-types.types";

type DeleteAttendeeTypeResponse = {
  id?: string;
  message?: string;
  attendeeType?: AttendeeType;
};

function normalizeAttendeeTypesList(data: unknown): AttendeeTypesListResponse {
  const value = unwrapApiData<AttendeeTypesListResponse | AttendeeType[]>(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter((type) => type.isActive !== false);

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter((type) => type.isActive !== false);
  const limit = value.limit ?? 20;
  const total = value.total ?? items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
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

  const data = unwrapApiData<DeleteAttendeeTypeResponse | AttendeeType>(
    response.data,
  );

  if (
    data &&
    typeof data === "object" &&
    "attendeeType" in data &&
    data.attendeeType?.id
  ) {
    return {
      id: data.attendeeType.id,
      attendeeType: data.attendeeType,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      attendeeType: data as AttendeeType,
    };
  }

  return { id };
}
