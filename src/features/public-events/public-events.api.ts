import { publicClient } from "@/lib/api/public-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  PublicEvent,
  PublicEventsListParams,
  PublicEventsListResponse,
  PublicRegisterPayload,
  PublicRegisterResponse,
} from "./public-events.types";

function normalizePublicEventsList(data: unknown): PublicEventsListResponse {
  const value = unwrapApiData<PublicEventsListResponse | PublicEvent[]>(data);

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

export async function getPublicEvents(
  params: PublicEventsListParams = {},
): Promise<PublicEventsListResponse> {
  const response = await publicClient.get("/public/events", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search?.trim() || undefined,
    },
  });

  return normalizePublicEventsList(response.data);
}

export async function getPublicEvent(id: string): Promise<PublicEvent> {
  const response = await publicClient.get(`/public/events/${id}`);

  return unwrapApiData<PublicEvent>(response.data);
}

export async function registerToPublicEvent(
  eventId: string,
  payload: PublicRegisterPayload,
): Promise<PublicRegisterResponse> {
  const response = await publicClient.post(
    `/public/events/${eventId}/register`,
    payload,
  );

  return unwrapApiData<PublicRegisterResponse>(response.data);
}
