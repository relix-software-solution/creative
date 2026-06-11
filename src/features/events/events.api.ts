import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateEventPayload,
  EventItem,
  EventsListParams,
  EventsListResponse,
  UpdateEventPayload,
} from "./events.types";

type DeleteEventResponse = {
  id?: string;
  message?: string;
  event?: EventItem;
};

function isVisibleEvent(event: EventItem) {
  return event.isActive !== false && event.status !== "ARCHIVED";
}

function normalizeEventsList(data: unknown): EventsListResponse {
  const value = unwrapApiData<EventsListResponse | EventItem[]>(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter(isVisibleEvent);

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter(isVisibleEvent);
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

  const data = unwrapApiData<DeleteEventResponse | EventItem>(response.data);

  if (data && typeof data === "object" && "event" in data && data.event?.id) {
    return {
      id: data.event.id,
      event: data.event,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      event: data as EventItem,
    };
  }

  return { id };
}
