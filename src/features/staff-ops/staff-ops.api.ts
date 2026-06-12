import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateStaffAssignmentPayload,
  StaffAssignment,
  StaffAssignmentActionResponse,
  StaffAssignmentsListParams,
  StaffAssignmentsListResponse,
  StaffSession,
  StaffSessionsListParams,
  StaffSessionsListResponse,
  StartStaffSessionPayload,
} from "./staff-ops.types";

function shouldShowAssignment(
  assignment: StaffAssignment,
  params: StaffAssignmentsListParams,
) {
  if (typeof params.isActive === "boolean") return true;

  return assignment.isActive !== false;
}

function normalizeAssignmentsList(
  data: unknown,
  params: StaffAssignmentsListParams,
): StaffAssignmentsListResponse {
  const value = unwrapApiData<StaffAssignmentsListResponse | StaffAssignment[]>(
    data,
  );

  if (Array.isArray(value)) {
    const items = value.filter((assignment) =>
      shouldShowAssignment(assignment, params),
    );

    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter((assignment) =>
    shouldShowAssignment(assignment, params),
  );

  const limit = value.limit ?? 20;
  const total =
    typeof params.isActive === "boolean"
      ? (value.total ?? items.length)
      : items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

function normalizeAssignmentActionResponse(data: unknown, fallbackId: string) {
  const value = unwrapApiData<StaffAssignmentActionResponse | StaffAssignment>(
    data,
  );

  if (
    value &&
    typeof value === "object" &&
    "staffAssignment" in value &&
    value.staffAssignment?.id
  ) {
    return {
      id: value.staffAssignment.id,
      assignment: value.staffAssignment,
    };
  }

  if (
    value &&
    typeof value === "object" &&
    "assignment" in value &&
    value.assignment?.id
  ) {
    return {
      id: value.assignment.id,
      assignment: value.assignment,
    };
  }

  if (value && typeof value === "object" && "id" in value && value.id) {
    return {
      id: value.id,
      assignment: value as StaffAssignment,
    };
  }

  return {
    id: fallbackId,
  };
}

export async function getStaffAssignments(
  params: StaffAssignmentsListParams = {},
) {
  const response = await adminClient.get("/staff-assignments", {
    params,
  });

  return normalizeAssignmentsList(response.data, params);
}

export async function createStaffAssignment(
  payload: CreateStaffAssignmentPayload,
) {
  const response = await adminClient.post("/staff-assignments", payload);

  return unwrapApiData<StaffAssignment>(response.data);
}

export async function deleteStaffAssignment(id: string) {
  const response = await adminClient.delete(`/staff-assignments/${id}`);

  return normalizeAssignmentActionResponse(response.data, id);
}

export async function getStaffSessions(params: StaffSessionsListParams = {}) {
  const response = await adminClient.get("/staff-sessions", {
    params,
  });

  return unwrapApiData<StaffSessionsListResponse>(response.data);
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
