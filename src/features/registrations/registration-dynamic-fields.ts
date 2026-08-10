export type RegistrationDynamicFieldDefinition = {
  id?: string;
  attendeeTypeId?: string | null;
  key: string;
  labelAr?: string | null;
  labelEn?: string | null;
  type?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type RegistrationDynamicFieldSource = {
  attendeeTypeId?: string | null;
  customFields?: Record<string, unknown> | null;
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;
};

export type RegistrationDynamicFieldItem = {
  key: string;
  label: string;
  value: unknown;
  formattedValue: string;
  field: RegistrationDynamicFieldDefinition;
};

export function normalizeRegistrationFieldKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

export function isBaseRegistrationFieldKey(key: string) {
  const normalizedKey = normalizeRegistrationFieldKey(key);

  return normalizedKey === "fullname" || normalizedKey === "phone";
}

function getEquivalentNormalizedKeys(key: string) {
  const normalizedKey = normalizeRegistrationFieldKey(key);

  if (normalizedKey === "company" || normalizedKey === "companyname") {
    return new Set(["company", "companyname"]);
  }

  if (normalizedKey === "jobtitle" || normalizedKey === "position") {
    return new Set(["jobtitle", "position"]);
  }

  return new Set([normalizedKey]);
}

function hasDisplayValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function getLegacyFieldValue(
  registration: RegistrationDynamicFieldSource,
  fieldKey: string,
) {
  const normalizedKey = normalizeRegistrationFieldKey(fieldKey);

  if (normalizedKey === "email") {
    return registration.email;
  }

  if (normalizedKey === "company" || normalizedKey === "companyname") {
    return registration.companyName;
  }

  if (normalizedKey === "jobtitle" || normalizedKey === "position") {
    return registration.jobTitle;
  }

  if (normalizedKey === "externalid") {
    return registration.externalId;
  }

  if (normalizedKey === "notes") {
    return registration.notes;
  }

  return undefined;
}

export function getRegistrationDynamicFieldValue(
  registration: RegistrationDynamicFieldSource,
  fieldKey: string,
) {
  const customFields = registration.customFields ?? {};

  const exactValue = customFields[fieldKey];

  if (hasDisplayValue(exactValue)) {
    return exactValue;
  }

  /*
   * دعم أي تسجيلات أقدم أو مفاتيح تغير تنسيقها فقط
   * مثل company_name / companyName / company.
   */
  const equivalentKeys = getEquivalentNormalizedKeys(fieldKey);
  const matchingCustomKey = Object.keys(customFields).find((key) =>
    equivalentKeys.has(normalizeRegistrationFieldKey(key)),
  );

  if (matchingCustomKey) {
    const normalizedValue = customFields[matchingCustomKey];

    if (hasDisplayValue(normalizedValue)) {
      return normalizedValue;
    }
  }

  return getLegacyFieldValue(registration, fieldKey);
}

export function formatRegistrationDynamicFieldValue(value: unknown) {
  if (!hasDisplayValue(value)) return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) return value.map(String).join("، ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function getApplicableRegistrationFields(
  fields: RegistrationDynamicFieldDefinition[] | null | undefined,
  attendeeTypeId?: string | null,
) {
  return (fields ?? [])
    .filter((field) => field.isActive !== false)
    .filter((field) => !isBaseRegistrationFieldKey(field.key))
    .filter(
      (field) =>
        !field.attendeeTypeId || field.attendeeTypeId === attendeeTypeId,
    )
    .sort(
      (first, second) =>
        (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
    );
}

export function getRegistrationDynamicFieldItems(
  registration: RegistrationDynamicFieldSource,
  fields: RegistrationDynamicFieldDefinition[] | null | undefined,
  options: { includeEmpty?: boolean } = {},
): RegistrationDynamicFieldItem[] {
  return getApplicableRegistrationFields(fields, registration.attendeeTypeId)
    .map((field) => {
      const value = getRegistrationDynamicFieldValue(registration, field.key);

      return {
        key: field.key,
        label: field.labelAr || field.labelEn || field.key,
        value,
        formattedValue: formatRegistrationDynamicFieldValue(value),
        field,
      };
    })
    .filter((item) => options.includeEmpty || hasDisplayValue(item.value));
}

export function buildRegistrationCustomFieldsForEdit(
  registration: RegistrationDynamicFieldSource,
  fields: RegistrationDynamicFieldDefinition[] | null | undefined,
) {
  const result: Record<string, unknown> = {
    ...(registration.customFields ?? {}),
  };

  for (const field of getApplicableRegistrationFields(
    fields,
    registration.attendeeTypeId,
  )) {
    if (hasDisplayValue(result[field.key])) {
      continue;
    }

    const value = getRegistrationDynamicFieldValue(registration, field.key);

    if (hasDisplayValue(value)) {
      result[field.key] = value;
    }
  }

  return result;
}
