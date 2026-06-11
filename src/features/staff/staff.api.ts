import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateStaffAssignmentPayload,
  StaffAssignment,
  StaffAssignmentsListParams,
  StaffAssignmentsListResponse,
  StaffSession,
  StartMyStaffSessionResponse,
} from "./staff.types";

function normalizeAssignmentsList(data: unknown): StaffAssignmentsListResponse {
  const value = unwrapApiData<StaffAssignmentsListResponse | StaffAssignment[]>(
    data,
  );

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

export async function getStaffAssignments(
  params: StaffAssignmentsListParams = {},
) {
  const response = await adminClient.get("/staff-assignments", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      eventId: params.eventId || undefined,
      userId: params.userId || undefined,
      checkpointId: params.checkpointId || undefined,
      deviceId: params.deviceId || undefined,
      isActive: params.isActive,
    },
  });

  return normalizeAssignmentsList(response.data);
}

export async function createStaffAssignment(
  payload: CreateStaffAssignmentPayload,
) {
  const response = await adminClient.post("/staff-assignments", payload);
  return unwrapApiData<StaffAssignment>(response.data);
}

export async function deleteStaffAssignment(id: string) {
  const response = await adminClient.delete(`/staff-assignments/${id}`);
  return unwrapApiData<StaffAssignment>(response.data);
}

export async function getMyStaffAssignment() {
  const response = await adminClient.get("/staff-assignments/me");
  return unwrapApiData<StaffAssignment>(response.data);
}

export async function startMyStaffSession() {
  const response = await adminClient.post("/staff-sessions/start-my-session");
  return unwrapApiData<StartMyStaffSessionResponse>(response.data);
}

export async function endStaffSession(id: string) {
  const response = await adminClient.post(`/staff-sessions/${id}/end`);
  return unwrapApiData<StaffSession>(response.data);
}
