import axios from "axios";
import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  BadgeAvailableFieldsResponse,
  BadgeTemplate,
  BadgeTemplatePayload,
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
  jobId?: string;
  storageCleanup?: {
    jobId?: string;
  };
};

type DeleteEventBrandingResponse = {
  id?: string;
  eventId?: string;
  deleted?: boolean;
  message?: string;
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

  if (!theme) {
    return;
  }

  if (theme.primary) {
    formData.append("theme.primary", theme.primary);
  }

  if (theme.primaryHover) {
    formData.append("theme.primaryHover", theme.primaryHover);
  }

  if (theme.background) {
    formData.append("theme.background", theme.background);
  }

  if (theme.text) {
    formData.append("theme.text", theme.text);
  }

  if (theme.radius) {
    formData.append("theme.radius", theme.radius);
  }
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
  if (!branding) {
    return false;
  }

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

export async function getEventBranding(
  eventId: string,
): Promise<EventBranding | null> {
  try {
    const response = await adminClient.get(`/event-branding/${eventId}`);

    return unwrapApiData<EventBranding>(response.data);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function createEventBranding(
  eventId: string,
  branding?: EventBrandingPayload,
) {
  const formData = buildBrandingFormData(eventId, branding);

  /*
   * لا نضع Content-Type يدويًا.
   * Axios يضيف multipart boundary الصحيح تلقائيًا.
   */
  const response = await adminClient.post("/event-branding", formData);

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
  );

  return unwrapApiData<EventBranding>(response.data);
}

export async function deleteEventBranding(eventId: string) {
  const response = await adminClient.delete(`/event-branding/${eventId}`);

  if (!response.data) {
    return {
      eventId,
      deleted: true,
    } satisfies DeleteEventBrandingResponse;
  }

  const data = unwrapApiData<DeleteEventBrandingResponse>(response.data);

  return {
    ...data,
    eventId: data.eventId ?? eventId,
    deleted: data.deleted ?? true,
  };
}

export async function createEvent(
  payload: CreateEventPayload,
): Promise<EventMutationResponse> {
  const eventResponse = await adminClient.post("/events", payload.event);

  const event = unwrapApiData<EventItem>(eventResponse.data);

  if (!hasBrandingPayload(payload.branding)) {
    return { event };
  }

  try {
    const branding = await createEventBranding(event.id, payload.branding);

    return {
      event: {
        ...event,
        branding,
        eventBranding: branding,
      },
      branding,
    };
  } catch {
    throw new Error(
      "تم إنشاء الفعالية، لكن تعذر حفظ الهوية البصرية. افتح الفعالية من القائمة وحاول تعديل الهوية مرة أخرى.",
    );
  }
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
    let branding: EventBranding;

    try {
      branding = await updateEventBranding(id, payload.branding);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }

      branding = await createEventBranding(id, payload.branding);
    }

    return {
      event: {
        ...event,
        branding,
        eventBranding: branding,
      },
      branding,
    };
  } catch {
    throw new Error(
      "تم تعديل بيانات الفعالية، لكن تعذر حفظ الهوية البصرية. أعد فتح الفعالية وحاول حفظ الهوية مرة أخرى.",
    );
  }
}

export async function deleteEvent(id: string) {
  const response = await adminClient.delete(`/events/${id}`);

  if (!response.data) {
    return { id };
  }

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

/*
 * Badge Template
 * يبقى مؤقتًا هنا حتى ننقل صفحة البادج بالكامل إلى feature المستقل.
 */

function appendBadgeValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildBadgeTemplateFormData(payload: BadgeTemplatePayload) {
  const formData = new FormData();

  appendBadgeValue(formData, "eventId", payload.eventId);
  appendBadgeValue(formData, "name", payload.name);
  appendBadgeValue(formData, "widthMm", payload.widthMm);
  appendBadgeValue(formData, "heightMm", payload.heightMm);

  appendBadgeValue(formData, "colors.primary", payload.colors?.primary);
  appendBadgeValue(formData, "colors.text", payload.colors?.text);
  appendBadgeValue(formData, "colors.background", payload.colors?.background);

  if (payload.selectedFields) {
    formData.append("selectedFields", JSON.stringify(payload.selectedFields));
  }

  if (payload.layout) {
    formData.append("layout", JSON.stringify(payload.layout));
  }

  if (payload.backgroundImage) {
    formData.append("backgroundImage", payload.backgroundImage);
  }

  return formData;
}

export async function getBadgeTemplateByEvent(eventId: string) {
  const response = await adminClient.get(`/badge-templates/events/${eventId}`);

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function createBadgeTemplate(payload: BadgeTemplatePayload) {
  const formData = buildBadgeTemplateFormData(payload);

  const response = await adminClient.post("/badge-templates", formData);

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function updateBadgeTemplate(
  eventId: string,
  payload: BadgeTemplatePayload,
) {
  const formData = buildBadgeTemplateFormData(payload);

  const response = await adminClient.patch(
    `/badge-templates/events/${eventId}`,
    formData,
  );

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function getBadgeAvailableFields(eventId: string) {
  try {
    const response = await adminClient.get(
      `/badge-templates/events/${eventId}/available-fields`,
    );

    const data = unwrapApiData<BadgeAvailableFieldsResponse>(response.data);

    return data.fields ?? [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}
