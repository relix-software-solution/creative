import axios from "axios";
import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  DigitalTicketPreviewPayload,
  DigitalTicketPreviewResponse,
  DigitalTicketTemplate,
  DigitalTicketTemplatesListResponse,
  SaveDigitalTicketTemplatePayload,
} from "./digital-ticket-templates.types";

type TemplateWrapper = {
  template?: DigitalTicketTemplate;
};

function normalizeTemplate(data: unknown): DigitalTicketTemplate {
  const value = unwrapApiData<DigitalTicketTemplate | TemplateWrapper>(data);

  if (
    value &&
    typeof value === "object" &&
    "template" in value &&
    value.template
  ) {
    return value.template;
  }

  return value as DigitalTicketTemplate;
}

function normalizeTemplatesList(data: unknown): DigitalTicketTemplate[] {
  const value = unwrapApiData<
    | DigitalTicketTemplate
    | DigitalTicketTemplate[]
    | DigitalTicketTemplatesListResponse
  >(data);

  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    "items" in value &&
    Array.isArray(value.items)
  ) {
    return value.items;
  }

  if (
    typeof value === "object" &&
    "templates" in value &&
    Array.isArray(value.templates)
  ) {
    return value.templates;
  }

  if (typeof value === "object" && "id" in value) {
    return [value as DigitalTicketTemplate];
  }

  return [];
}

function buildTemplateFormData({
  payload,
  includeEventId,
}: {
  payload: SaveDigitalTicketTemplatePayload;
  includeEventId: boolean;
}) {
  const formData = new FormData();

  if (includeEventId) {
    formData.append("eventId", payload.eventId);
  }

  formData.append("name", payload.name.trim());

  formData.append("widthPx", String(payload.widthPx));

  formData.append("heightPx", String(payload.heightPx));

  formData.append("theme", JSON.stringify(payload.theme));

  formData.append("elements", JSON.stringify(payload.elements));

  formData.append("selectedFields", JSON.stringify(payload.selectedFields));

  if (payload.backgroundImage instanceof File) {
    formData.append(
      "backgroundImage",
      payload.backgroundImage,
      payload.backgroundImage.name,
    );
  }

  return formData;
}

/**
 * مهم:
 * بعض إعدادات adminClient تضع application/json افتراضيًا.
 * لذلك نحدد multipart هنا بوضوح ونمنع تحويل FormData إلى JSON.
 */
const multipartConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },

  transformRequest: [(data: unknown) => data],
};

export async function getEventDigitalTicketTemplate(
  eventId: string,
): Promise<DigitalTicketTemplate | null> {
  try {
    const response = await adminClient.get(
      `/digital-ticket-templates/events/${eventId}`,
    );

    const templates = normalizeTemplatesList(response.data);

    /**
     * القالب العام للفعالية لا يملك attendeeTypeId.
     */
    return (
      templates.find(
        (template) =>
          !template.attendeeTypeId ||
          template.attendeeTypeScopeKey === "__EVENT__",
      ) ?? null
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createDigitalTicketTemplate(
  payload: SaveDigitalTicketTemplatePayload,
) {
  const formData = buildTemplateFormData({
    payload,
    includeEventId: true,
  });

  const response = await adminClient.post(
    "/digital-ticket-templates",
    formData,
    multipartConfig,
  );

  return normalizeTemplate(response.data);
}

export async function updateEventDigitalTicketTemplate(
  payload: SaveDigitalTicketTemplatePayload,
) {
  const formData = buildTemplateFormData({
    payload,
    includeEventId: false,
  });

  const response = await adminClient.patch(
    `/digital-ticket-templates/events/${payload.eventId}`,
    formData,
    multipartConfig,
  );

  return normalizeTemplate(response.data);
}

export async function deleteEventDigitalTicketTemplate(eventId: string) {
  const response = await adminClient.delete(
    `/digital-ticket-templates/events/${eventId}`,
  );

  return unwrapApiData<{
    deleted?: boolean;
    id?: string;
    message?: string;
  }>(response.data);
}

export async function previewDigitalTicketTemplate(
  eventId: string,
  payload: DigitalTicketPreviewPayload,
): Promise<DigitalTicketPreviewResponse> {
  const response = await adminClient.post(
    `/digital-ticket-templates/events/${eventId}/preview`,
    payload,
  );

  return unwrapApiData<DigitalTicketPreviewResponse>(response.data);
}
