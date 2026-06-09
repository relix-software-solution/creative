import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationFieldPayload,
  RegistrationField,
  RegistrationFieldsListParams,
  RegistrationFieldsListResponse,
  UpdateRegistrationFieldPayload,
} from "./registration-fields.types";

function normalizeRegistrationFieldsList(
  data: unknown,
): RegistrationFieldsListResponse {
  const value = unwrapApiData<
    RegistrationFieldsListResponse | RegistrationField[]
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

export async function getRegistrationFields(
  params: RegistrationFieldsListParams,
) {
  const response = await adminClient.get("/registration-fields", {
    params,
  });

  return normalizeRegistrationFieldsList(response.data);
}

export async function getRegistrationField(id: string) {
  const response = await adminClient.get(`/registration-fields/${id}`);
  return unwrapApiData<RegistrationField>(response.data);
}

export async function createRegistrationField(
  payload: CreateRegistrationFieldPayload,
) {
  const response = await adminClient.post("/registration-fields", payload);
  return unwrapApiData<RegistrationField>(response.data);
}

export async function updateRegistrationField(
  id: string,
  payload: UpdateRegistrationFieldPayload,
) {
  const response = await adminClient.patch(
    `/registration-fields/${id}`,
    payload,
  );
  return unwrapApiData<RegistrationField>(response.data);
}

export async function deleteRegistrationField(id: string) {
  const response = await adminClient.delete(`/registration-fields/${id}`);
  return unwrapApiData<RegistrationField>(response.data);
}
