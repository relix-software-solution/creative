import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateEventPayload,
  EventItem,
  EventsListParams,
  EventsListResponse,
  UpdateEventPayload,
} from "./events.types";

function normalizeEventsList(data: unknown): EventsListResponse {
  const value = unwrapApiData<EventsListResponse | EventItem[]>(data);

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

export async function getEvents(params: EventsListParams) {
  const response = await adminClient.get("/events", {
    params,
  });

  return normalizeEventsList(response.data);
}

export async function getEvent(id: string) {
  const response = await adminClient.get(`/events/${id}`);
  return unwrapApiData<EventItem>(response.data);
}

export async function createEvent(payload: CreateEventPayload) {
  const response = await adminClient.post("/events", payload);
  return unwrapApiData<EventItem>(response.data);
}

export async function updateEvent(id: string, payload: UpdateEventPayload) {
  const response = await adminClient.patch(`/events/${id}`, payload);
  return unwrapApiData<EventItem>(response.data);
}

export async function deleteEvent(id: string) {
  const response = await adminClient.delete(`/events/${id}`);
  return unwrapApiData<EventItem>(response.data);
}
