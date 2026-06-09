import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  Client,
  ClientsListParams,
  ClientsListResponse,
  CreateClientPayload,
  UpdateClientPayload,
} from "./clients.types";

function normalizeClientsList(data: unknown): ClientsListResponse {
  const value = unwrapApiData<ClientsListResponse | Client[]>(data);

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

export async function getClients(params: ClientsListParams) {
  const response = await adminClient.get("/clients", {
    params,
  });

  return normalizeClientsList(response.data);
}

export async function getClient(id: string) {
  const response = await adminClient.get(`/clients/${id}`);
  return unwrapApiData<Client>(response.data);
}

export async function createClient(payload: CreateClientPayload) {
  const response = await adminClient.post("/clients", payload);
  return unwrapApiData<Client>(response.data);
}

export async function updateClient(id: string, payload: UpdateClientPayload) {
  const response = await adminClient.patch(`/clients/${id}`, payload);
  return unwrapApiData<Client>(response.data);
}

export async function deleteClient(id: string) {
  const response = await adminClient.delete(`/clients/${id}`);
  return unwrapApiData<Client>(response.data);
}
