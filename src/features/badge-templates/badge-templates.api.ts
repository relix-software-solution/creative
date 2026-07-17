import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  BadgeAvailableFieldsResponse,
  BadgeResolvedData,
  BadgeTemplate,
  BadgeTemplatePayload,
} from "./badge-templates.types";

function appendJsonField(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;

  if (typeof value === "string") {
    formData.append(key, value);
    return;
  }

  formData.append(key, JSON.stringify(value));
}

function buildBadgeTemplateFormData(payload: BadgeTemplatePayload) {
  const formData = new FormData();

  formData.append("eventId", payload.eventId);

  if (payload.widthMm !== undefined && payload.widthMm !== null) {
    formData.append("widthMm", String(payload.widthMm));
  }

  if (payload.heightMm !== undefined && payload.heightMm !== null) {
    formData.append("heightMm", String(payload.heightMm));
  }

  appendJsonField(formData, "colors", payload.colors);
  appendJsonField(formData, "layout", payload.layout);
  appendJsonField(formData, "selectedFields", payload.selectedFields);

  if (payload.backgroundImage) {
    formData.append("backgroundImage", payload.backgroundImage);
  }

  return formData;
}

export async function getBadgeTemplates() {
  const response = await adminClient.get("/badge-templates");

  return unwrapApiData<BadgeTemplate[] | { items?: BadgeTemplate[] }>(
    response.data,
  );
}

export async function getBadgeTemplateByEvent(eventId: string) {
  const response = await adminClient.get(`/badge-templates/events/${eventId}`);

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function createBadgeTemplate(payload: BadgeTemplatePayload) {
  const response = await adminClient.post(
    "/badge-templates",
    buildBadgeTemplateFormData(payload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function updateBadgeTemplateByEvent(
  eventId: string,
  payload: Omit<BadgeTemplatePayload, "eventId">,
) {
  const response = await adminClient.patch(
    `/badge-templates/events/${eventId}`,
    buildBadgeTemplateFormData({
      ...payload,
      eventId,
    }),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrapApiData<BadgeTemplate>(response.data);
}

export async function deleteBadgeTemplateByEvent(eventId: string) {
  const response = await adminClient.delete(
    `/badge-templates/events/${eventId}`,
  );

  return unwrapApiData<{ deleted?: boolean; id?: string }>(response.data);
}

export async function getBadgeAvailableFields(eventId: string) {
  const response = await adminClient.get(
    `/badge-templates/events/${eventId}/available-fields`,
  );

  return unwrapApiData<BadgeAvailableFieldsResponse>(response.data);
}

export async function getResolvedBadgeData(
  eventId: string,
  registrationId: string,
) {
  const response = await adminClient.get(
    `/badge-templates/events/${eventId}/registrations/${registrationId}`,
  );

  return unwrapApiData<BadgeResolvedData>(response.data);
}
