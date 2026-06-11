import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateRegistrationFieldPayload,
  RegistrationField,
  RegistrationFieldsListParams,
  RegistrationFieldsListResponse,
  UpdateRegistrationFieldPayload,
} from "./registration-fields.types";

type DeleteRegistrationFieldResponse = {
  id?: string;
  message?: string;
  registrationField?: RegistrationField;
};

function normalizeRegistrationFieldsList(
  data: unknown,
): RegistrationFieldsListResponse {
  const value = unwrapApiData<
    RegistrationFieldsListResponse | RegistrationField[]
  >(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter((field) => field.isActive !== false);

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter((field) => field.isActive !== false);

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

  const data = unwrapApiData<
    DeleteRegistrationFieldResponse | RegistrationField
  >(response.data);

  if (
    data &&
    typeof data === "object" &&
    "registrationField" in data &&
    data.registrationField?.id
  ) {
    return {
      id: data.registrationField.id,
      registrationField: data.registrationField,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      registrationField: data as RegistrationField,
    };
  }

  return { id };
}
