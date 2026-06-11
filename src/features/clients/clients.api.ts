import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  Client,
  ClientsListParams,
  ClientsListResponse,
  CreateClientPayload,
  UpdateClientPayload,
} from "./clients.types";

type DeleteClientResponse = {
  id?: string;
  message?: string;
  client?: Client;
};

function normalizeClientsList(data: unknown): ClientsListResponse {
  const value = unwrapApiData<ClientsListResponse | Client[]>(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter((client) => client.isActive !== false);

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter(
    (client) => client.isActive !== false,
  );

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

export async function getClients(params: ClientsListParams) {
  const response = await adminClient.get("/clients", {
    params,
  });

  return normalizeClientsList(response.data);
}

export async function getClient(id: string) {
  const response = await adminClient.get(`/clients/${id}`);

  const client = unwrapApiData<Client>(response.data);

  return client;
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

  const data = unwrapApiData<DeleteClientResponse | Client>(response.data);

  if (data && typeof data === "object" && "client" in data && data.client?.id) {
    return {
      id: data.client.id,
      client: data.client,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      client: data as Client,
    };
  }

  return { id };
}
