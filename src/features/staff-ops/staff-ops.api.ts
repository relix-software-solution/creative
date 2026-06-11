import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateStaffAssignmentPayload,
  StaffAssignment,
  StaffAssignmentsListParams,
  StaffAssignmentsListResponse,
  StaffSession,
  StaffSessionsListParams,
  StaffSessionsListResponse,
  StartStaffSessionPayload,
} from "./staff-ops.types";

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

function normalizeSessionsList(data: unknown): StaffSessionsListResponse {
  const value = unwrapApiData<StaffSessionsListResponse | StaffSession[]>(data);

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
  const response = await adminClient.post("/staff-assignments", {
    eventId: payload.eventId,
    userId: payload.userId,
    checkpointId: payload.checkpointId,
    deviceId: payload.deviceId,
  });

  return unwrapApiData<StaffAssignment>(response.data);
}

export async function deleteStaffAssignment(id: string) {
  const response = await adminClient.delete(`/staff-assignments/${id}`);
  return unwrapApiData<StaffAssignment>(response.data);
}

export async function getStaffSessions(params: StaffSessionsListParams = {}) {
  const response = await adminClient.get("/staff-sessions", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      eventId: params.eventId || undefined,
      staffUserId: params.staffUserId || undefined,
      deviceId: params.deviceId || undefined,
      checkpointId: params.checkpointId || undefined,
      status: params.status || undefined,
    },
  });

  return normalizeSessionsList(response.data);
}

export async function getStaffSession(id: string) {
  const response = await adminClient.get(`/staff-sessions/${id}`);
  return unwrapApiData<StaffSession>(response.data);
}

export async function startStaffSession(payload: StartStaffSessionPayload) {
  const response = await adminClient.post("/staff-sessions/start", payload);
  return unwrapApiData<StaffSession>(response.data);
}

export async function endStaffSession(id: string) {
  const response = await adminClient.post(`/staff-sessions/${id}/end`);
  return unwrapApiData<StaffSession>(response.data);
}
