import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateNotificationTemplatePayload,
  NotificationTemplate,
  NotificationTemplatesListResponse,
  UpdateNotificationTemplatePayload,
} from "./notification-templates.types";

type NotificationTemplateMutationResponse = {
  template?: NotificationTemplate;
};

function normalizeTemplate(data: unknown): NotificationTemplate {
  const value = unwrapApiData<
    NotificationTemplate | NotificationTemplateMutationResponse
  >(data);

  if (
    value &&
    typeof value === "object" &&
    "template" in value &&
    value.template
  ) {
    return value.template;
  }

  return value as NotificationTemplate;
}

function normalizeTemplatesList(data: unknown): NotificationTemplate[] {
  const value = unwrapApiData<
    NotificationTemplate[] | NotificationTemplatesListResponse
  >(data);

  if (Array.isArray(value)) {
    return value;
  }

  return value.items ?? value.templates ?? [];
}

export async function getEventRegistrationQrTemplate(
  eventId: string,
  locale: "AR" | "EN" = "AR",
): Promise<NotificationTemplate | null> {
  const response = await adminClient.get("/notifications/templates", {
    params: {
      eventId,
      page: 1,
      limit: 100,
    },
  });

  const templates = normalizeTemplatesList(response.data);

  const exactTemplate = templates.find(
    (template) =>
      template.eventId === eventId &&
      template.type === "REGISTRATION_QR" &&
      template.channel === "WHATSAPP" &&
      template.locale === locale,
  );

  return exactTemplate ?? null;
}

export async function createNotificationTemplate(
  payload: CreateNotificationTemplatePayload,
) {
  const response = await adminClient.post("/notifications/templates", payload);

  return normalizeTemplate(response.data);
}

export async function updateNotificationTemplate(
  templateId: string,
  payload: UpdateNotificationTemplatePayload,
) {
  const response = await adminClient.patch(
    `/notifications/templates/${templateId}`,
    payload,
  );

  return normalizeTemplate(response.data);
}

/**
 * DELETE في الباك يعطّل القالب ولا يحذفه نهائيًا.
 */
export async function deactivateNotificationTemplate(templateId: string) {
  const response = await adminClient.delete(
    `/notifications/templates/${templateId}`,
  );

  if (!response.data) {
    return {
      id: templateId,
      deactivated: true,
    };
  }

  return unwrapApiData<{
    id?: string;
    deactivated?: boolean;
    deleted?: boolean;
    message?: string;
    template?: NotificationTemplate;
  }>(response.data);
}
