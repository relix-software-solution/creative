import axios from "axios";
import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateEventPayload,
  EventBranding,
  EventBrandingPayload,
  EventItem,
  EventMutationResponse,
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

function appendTheme(formData: FormData, branding?: EventBrandingPayload) {
  const theme = branding?.theme;

  if (!theme) return;

  if (theme.primary) formData.append("theme.primary", theme.primary);
  if (theme.primaryHover) {
    formData.append("theme.primaryHover", theme.primaryHover);
  }
  if (theme.background) {
    formData.append("theme.background", theme.background);
  }
  if (theme.text) formData.append("theme.text", theme.text);
  if (theme.radius) formData.append("theme.radius", theme.radius);
}

function buildBrandingFormData(
  eventId: string,
  branding?: EventBrandingPayload,
) {
  const formData = new FormData();

  formData.append("eventId", eventId);
  appendTheme(formData, branding);

  if (branding?.logo) {
    formData.append("logo", branding.logo);
  }

  if (branding?.backgroundImage) {
    formData.append("backgroundImage", branding.backgroundImage);
  }

  return formData;
}

function hasBrandingPayload(branding?: EventBrandingPayload) {
  if (!branding) return false;

  return Boolean(
    branding.logo ||
    branding.backgroundImage ||
    branding.theme?.primary ||
    branding.theme?.primaryHover ||
    branding.theme?.background ||
    branding.theme?.text ||
    branding.theme?.radius,
  );
}

function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
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

export async function getEventBranding(eventId: string) {
  const response = await adminClient.get(`/event-branding/${eventId}`);

  return unwrapApiData<EventBranding>(response.data);
}

export async function createEventBranding(
  eventId: string,
  branding?: EventBrandingPayload,
) {
  const formData = buildBrandingFormData(eventId, branding);

  const response = await adminClient.post("/event-branding", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapApiData<EventBranding>(response.data);
}

export async function updateEventBranding(
  eventId: string,
  branding?: EventBrandingPayload,
) {
  const formData = buildBrandingFormData(eventId, branding);

  const response = await adminClient.patch(
    `/event-branding/${eventId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrapApiData<EventBranding>(response.data);
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<EventMutationResponse> {
  const eventResponse = await adminClient.post("/events", payload.event);

  const event = unwrapApiData<EventItem>(eventResponse.data);

  if (!hasBrandingPayload(payload.branding)) {
    return { event };
  }

  const branding = await createEventBranding(event.id, payload.branding);

  return {
    event: {
      ...event,
      branding,
    },
    branding,
  };
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<EventMutationResponse> {
  const eventResponse = await adminClient.patch(`/events/${id}`, payload.event);

  const event = unwrapApiData<EventItem>(eventResponse.data);

  if (!hasBrandingPayload(payload.branding)) {
    return { event };
  }

  try {
    const branding = await updateEventBranding(id, payload.branding);

    return {
      event: {
        ...event,
        branding,
      },
      branding,
    };
  } catch (error) {
    if (!isNotFoundError(error)) throw error;

    const branding = await createEventBranding(id, payload.branding);

    return {
      event: {
        ...event,
        branding,
      },
      branding,
    };
  }
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
