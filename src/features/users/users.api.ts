import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateUserPayload,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  User,
  UserActionResponse,
  UsersListParams,
  UsersListResponse,
} from "./users.types";

function shouldShowUser(user: User, params: UsersListParams) {
  if (params.status) return true;

  return user.status !== "DELETED" && !user.deletedAt;
}

function normalizeUsersList(
  data: unknown,
  params: UsersListParams,
): UsersListResponse {
  const value = unwrapApiData<UsersListResponse | User[]>(data);

  if (Array.isArray(value)) {
    const items = value.filter((user) => shouldShowUser(user, params));

    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter((user) =>
    shouldShowUser(user, params),
  );

  const limit = value.limit ?? 20;
  const total = params.status ? (value.total ?? items.length) : items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

function normalizeUserActionResponse(data: unknown, fallbackId: string) {
  const value = unwrapApiData<UserActionResponse | User>(data);

  if (value && typeof value === "object" && "user" in value && value.user?.id) {
    return {
      id: value.user.id,
      user: value.user,
    };
  }

  if (value && typeof value === "object" && "id" in value && value.id) {
    return {
      id: value.id,
      user: value as User,
    };
  }

  return {
    id: fallbackId,
  };
}

export async function getUsers(params: UsersListParams = {}) {
  const response = await adminClient.get("/users", { params });

  return normalizeUsersList(response.data, params);
}

export async function createUser(payload: CreateUserPayload) {
  const response = await adminClient.post("/users", payload);

  return unwrapApiData<User>(response.data);
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await adminClient.patch(`/users/${id}`, payload);

  return unwrapApiData<User>(response.data);
}

export async function activateUser(id: string) {
  const response = await adminClient.post(`/users/${id}/activate`);

  return normalizeUserActionResponse(response.data, id);
}

export async function suspendUser(id: string) {
  const response = await adminClient.post(`/users/${id}/suspend`);

  return normalizeUserActionResponse(response.data, id);
}

export async function deleteUser(id: string) {
  const response = await adminClient.delete(`/users/${id}`);

  return normalizeUserActionResponse(response.data, id);
}

export async function resetUserPassword(
  id: string,
  payload: ResetUserPasswordPayload,
) {
  const response = await adminClient.post(
    `/users/${id}/reset-password`,
    payload,
  );

  return unwrapApiData<UserActionResponse>(response.data);
}
