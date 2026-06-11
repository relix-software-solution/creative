import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateUserPayload,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  User,
  UsersListParams,
  UsersListResponse,
} from "./users.types";

function normalizeUsersList(data: unknown): UsersListResponse {
  const value = unwrapApiData<UsersListResponse | User[]>(data);

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

export async function getUsers(params: UsersListParams) {
  const response = await adminClient.get("/users", {
    params,
  });

  return normalizeUsersList(response.data);
}

export async function getUser(id: string) {
  const response = await adminClient.get(`/users/${id}`);
  return unwrapApiData<User>(response.data);
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
  return unwrapApiData<User>(response.data);
}

export async function suspendUser(id: string) {
  const response = await adminClient.post(`/users/${id}/suspend`);
  return unwrapApiData<User>(response.data);
}

export async function resetUserPassword(
  id: string,
  payload: ResetUserPasswordPayload,
) {
  const response = await adminClient.post(
    `/users/${id}/reset-password`,
    payload,
  );

  return unwrapApiData<User>(response.data);
}

export async function deleteUser(id: string) {
  const response = await adminClient.delete(`/users/${id}`);
  return unwrapApiData<User>(response.data);
}
