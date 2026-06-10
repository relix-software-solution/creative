import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationPayload,
  Registration,
  RegistrationsListParams,
  RegistrationsListResponse,
  UpdateRegistrationPayload,
} from "./registrations.types";

function normalizeRegistrationsList(data: unknown): RegistrationsListResponse {
  const value = unwrapApiData<RegistrationsListResponse | Registration[]>(data);

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

export async function getRegistrations(params: RegistrationsListParams) {
  const response = await adminClient.get("/registrations", {
    params,
  });

  return normalizeRegistrationsList(response.data);
}

export async function getRegistration(id: string) {
  const response = await adminClient.get(`/registrations/${id}`);
  return unwrapApiData<Registration>(response.data);
}

export async function createRegistration(payload: CreateRegistrationPayload) {
  const response = await adminClient.post("/registrations", payload);
  return unwrapApiData<Registration>(response.data);
}

export async function updateRegistration(
  id: string,
  payload: UpdateRegistrationPayload,
) {
  const response = await adminClient.patch(`/registrations/${id}`, payload);
  return unwrapApiData<Registration>(response.data);
}

export async function deleteRegistration(id: string) {
  const response = await adminClient.delete(`/registrations/${id}`);
  return unwrapApiData<Registration>(response.data);
}

export async function activateRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/activate`);
  return unwrapApiData<Registration>(response.data);
}

export async function cancelRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/cancel`);
  return unwrapApiData<Registration>(response.data);
}

export async function blockRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/block`);
  return unwrapApiData<Registration>(response.data);
}
