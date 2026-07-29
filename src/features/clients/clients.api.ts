import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  Client,
  ClientAccessAccount,
  ClientsListParams,
  ClientsListResponse,
  CreateClientAccessAccountPayload,
  CreateClientPayload,
  CreateClientWithAccessAccountPayload,
  CreateClientWithAccessAccountResponse,
  UpdateClientAccessAccountPayload,
  UpdateClientPayload,
} from "./clients.types";

function normalizeClientsList(data: unknown): ClientsListResponse {
  const value = unwrapApiData<ClientsListResponse | Client[]>(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length || 20,
      totalPages: value.length > 0 ? 1 : 0,
    };
  }

  const items = value.items ?? [];
  const limit = value.limit ?? 20;
  const total = value.total ?? items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages:
      value.totalPages ??
      (total === 0 ? 0 : Math.ceil(total / limit)),
  };
}

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }

  return (
    error as {
      response?: {
        status?: number;
      };
    }
  ).response?.status === 404;
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

/**
 * المسار القديم محفوظ للتوافق مع أي استخدامات قديمة.
 * شاشة العملاء الجديدة تستخدم createClientWithAccessAccount.
 */
export async function createClient(payload: CreateClientPayload) {
  const response = await adminClient.post("/clients", payload);

  return unwrapApiData<Client>(response.data);
}

export async function createClientWithAccessAccount(
  payload: CreateClientWithAccessAccountPayload,
) {
  const response = await adminClient.post(
    "/clients/with-access-account",
    payload,
  );

  return unwrapApiData<CreateClientWithAccessAccountResponse>(response.data);
}

export async function updateClient(id: string, payload: UpdateClientPayload) {
  const response = await adminClient.patch(`/clients/${id}`, payload);

  return unwrapApiData<Client>(response.data);
}

export async function getClientAccessAccount(
  clientId: string,
): Promise<ClientAccessAccount | null> {
  try {
    const response = await adminClient.get(
      `/clients/${clientId}/access-account`,
    );

    return unwrapApiData<ClientAccessAccount>(response.data);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function createClientAccessAccount(
  clientId: string,
  payload: CreateClientAccessAccountPayload,
) {
  const response = await adminClient.post(
    `/clients/${clientId}/access-account`,
    payload,
  );

  return unwrapApiData<{
    client: Client;
    accessAccount: ClientAccessAccount;
  }>(response.data);
}

export async function updateClientAccessAccount(
  clientId: string,
  payload: UpdateClientAccessAccountPayload,
) {
  const response = await adminClient.patch(
    `/clients/${clientId}/access-account`,
    payload,
  );

  return unwrapApiData<ClientAccessAccount>(response.data);
}

export async function resetClientAccessAccountPassword(
  clientId: string,
  newPassword: string,
) {
  const response = await adminClient.post(
    `/clients/${clientId}/access-account/reset-password`,
    { newPassword },
  );

  return unwrapApiData<{ reset: boolean }>(response.data);
}

export async function setClientActiveStatus(
  id: string,
  isActive: boolean,
) {
  const response = await adminClient.patch(`/clients/${id}/status`, {
    isActive,
  });

  return unwrapApiData<{
    changed: boolean;
    client: Client;
  }>(response.data);
}

export async function deleteClientPermanently(id: string) {
  const response = await adminClient.delete(`/clients/${id}`);

  return unwrapApiData<{
    deleted: boolean;
    id: string;
  }>(response.data);
}
