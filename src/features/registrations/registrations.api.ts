import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationPayload,
  Registration,
  RegistrationsListParams,
  RegistrationsListResponse,
  UpdateRegistrationPayload,
} from "./registrations.types";

type RegistrationActionResponse = {
  id?: string;
  message?: string;
  registration?: Registration;
};

function isVisibleRegistration(registration: Registration) {
  return (
    registration.status !== "ARCHIVED" &&
    registration.isArchived !== true &&
    !registration.archivedAt &&
    !registration.deletedAt
  );
}

function normalizeRegistrationsList(data: unknown): RegistrationsListResponse {
  const value = unwrapApiData<RegistrationsListResponse | Registration[]>(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter(isVisibleRegistration);

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter(isVisibleRegistration);
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

function normalizeRegistrationActionResponse(
  data: unknown,
  fallbackId: string,
) {
  const value = unwrapApiData<RegistrationActionResponse | Registration>(data);

  if (
    value &&
    typeof value === "object" &&
    "registration" in value &&
    value.registration?.id
  ) {
    return {
      id: value.registration.id,
      registration: value.registration,
    };
  }

  if (value && typeof value === "object" && "id" in value && value.id) {
    return {
      id: value.id,
      registration: value as Registration,
    };
  }

  return {
    id: fallbackId,
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

  return normalizeRegistrationActionResponse(response.data, id);
}

export async function activateRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/activate`);

  return normalizeRegistrationActionResponse(response.data, id);
}

export async function cancelRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/cancel`);

  return normalizeRegistrationActionResponse(response.data, id);
}

export async function blockRegistration(id: string) {
  const response = await adminClient.post(`/registrations/${id}/block`);

  return normalizeRegistrationActionResponse(response.data, id);
}
