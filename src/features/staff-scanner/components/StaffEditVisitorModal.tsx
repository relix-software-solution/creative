"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PublicRegistrationField } from "@/features/public-events/public-events.types";
import {
  StaffVisitor,
  UpdateStaffVisitorPayload,
} from "@/features/staff-visitors/staff-visitors.api";
import { StaffScannerTheme } from "../utils/staff-scanner.types";

type EditVisitorForm = {
  fullName: string;
  phone: string;
};

function getFieldLabel(field: PublicRegistrationField) {
  return field.labelAr || field.labelEn || field.key;
}


type StaffSelectOption = {
  value: string;
  labelAr?: string | null;
  labelEn?: string | null;
};

function getStaffSelectOptions(field: PublicRegistrationField) {
  const rawOptions = Array.isArray(field.options) ? field.options : [];

  return rawOptions
    .map((option): { value: string; label: string } | null => {
      if (typeof option === "string") {
        const value = option.trim();

        return value ? { value, label: value } : null;
      }

      if (!option || typeof option !== "object") {
        return null;
      }

      const typedOption = option as StaffSelectOption;
      const value = String(typedOption.value ?? "").trim();

      if (!value) {
        return null;
      }

      return {
        value,
        label:
          String(typedOption.labelAr ?? "").trim() ||
          String(typedOption.labelEn ?? "").trim() ||
          value,
      };
    })
    .filter((option): option is { value: string; label: string } => Boolean(option));
}

function canonicalizeSelectValue(
  field: PublicRegistrationField,
  value: unknown,
) {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  const raw = String(value).trim();
  const options = getStaffSelectOptions(field);

  const exact = options.find((option) => option.value === raw);

  if (exact) {
    return exact.value;
  }

  const normalized = raw.toLocaleLowerCase();
  const caseInsensitive = options.find((option) => {
    return (
      option.value.toLocaleLowerCase() === normalized ||
      option.label.toLocaleLowerCase() === normalized
    );
  });

  return caseInsensitive?.value ?? raw;
}

function isLikelyPhoneValue(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw || /[A-Za-z\u0600-\u06FF]/.test(raw)) {
    return false;
  }

  return raw.replace(/\D/g, "").length >= 7;
}

function getInitialPhone(visitor: StaffVisitor) {
  const currentPhone = String(visitor.phone ?? "").trim();
  const customFields = (visitor.customFields ?? {}) as Record<string, unknown>;
  const landline = String(customFields.landline ?? "").trim();

  if (!isLikelyPhoneValue(currentPhone) && isLikelyPhoneValue(landline)) {
    return landline;
  }

  return currentPhone;
}

function normalizeFieldKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}

function isBaseFieldKey(key: string) {
  const normalizedKey = normalizeFieldKey(key);

  return normalizedKey === "fullname" || normalizedKey === "phone";
}

type StaffVisitorWithLegacyDynamicFields = StaffVisitor & {
  email?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  externalId?: string | null;
  notes?: string | null;
};

function getLegacyDynamicFieldValue(
  visitor: StaffVisitorWithLegacyDynamicFields,
  fieldKey: string,
) {
  const normalizedKey = normalizeFieldKey(fieldKey);

  if (normalizedKey === "email") {
    return visitor.email;
  }

  if (normalizedKey === "company" || normalizedKey === "companyname") {
    return visitor.companyName;
  }

  if (normalizedKey === "jobtitle" || normalizedKey === "position") {
    return visitor.jobTitle;
  }

  if (normalizedKey === "externalid") {
    return visitor.externalId;
  }

  if (normalizedKey === "notes") {
    return visitor.notes;
  }

  return undefined;
}

function normalizeInitialCustomFields(
  visitor: StaffVisitor | null,
  registrationFields: PublicRegistrationField[],
) {
  if (!visitor) {
    return {};
  }

  const normalized: Record<string, unknown> = {
    ...(visitor.customFields ?? {}),
  };

  const legacyVisitor = visitor as StaffVisitorWithLegacyDynamicFields;

  /*
   * دعم التسجيلات القديمة التي حُفظت فيها بعض
   * الحقول الديناميكية كأعمدة أساسية.
   */
  for (const field of registrationFields) {
    const currentValue = normalized[field.key];

    if (
      currentValue === undefined ||
      currentValue === null ||
      currentValue === ""
    ) {
      const legacyValue = getLegacyDynamicFieldValue(legacyVisitor, field.key);

      if (
        legacyValue !== undefined &&
        legacyValue !== null &&
        legacyValue !== ""
      ) {
        normalized[field.key] = legacyValue;
      }
    }

    if (String(field.type ?? "").toUpperCase() === "SELECT") {
      normalized[field.key] = canonicalizeSelectValue(
        field,
        normalized[field.key],
      );
    }
  }

  return normalized;
}

export function StaffEditVisitorModal({
  open,
  visitor,
  theme,
  registrationFields,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  visitor: StaffVisitor | null;
  theme: StaffScannerTheme;
  registrationFields: PublicRegistrationField[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    visitor: StaffVisitor,
    changes: UpdateStaffVisitorPayload,
  ) => void | Promise<void>;
}) {
  const [form, setForm] = useState<EditVisitorForm>({
    fullName: "",
    phone: "",
  });

  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !visitor) {
      return;
    }

    setForm({
      fullName: visitor.fullName ?? "",
      phone: getInitialPhone(visitor),
    });

    setCustomFields(normalizeInitialCustomFields(visitor, registrationFields));
    setErrors({});
  }, [open, visitor, registrationFields]);

  const editableCustomFields = useMemo(() => {
    if (!visitor) {
      return [];
    }

    const attendeeTypeId =
      visitor.attendeeTypeId || visitor.attendeeType?.id || "";

    return registrationFields.filter((field) => {
      const fieldRecord = field as PublicRegistrationField & {
        attendeeTypeId?: string | null;
        attendeeTypeIds?: string[] | null;
        isActive?: boolean;
        visible?: boolean;
      };

      if (isBaseFieldKey(field.key)) {
        return false;
      }

      if (fieldRecord.isActive === false || fieldRecord.visible === false) {
        return false;
      }

      if (
        fieldRecord.attendeeTypeId &&
        fieldRecord.attendeeTypeId !== attendeeTypeId
      ) {
        return false;
      }

      if (
        Array.isArray(fieldRecord.attendeeTypeIds) &&
        fieldRecord.attendeeTypeIds.length > 0 &&
        !fieldRecord.attendeeTypeIds.includes(attendeeTypeId)
      ) {
        return false;
      }

      return true;
    });
  }, [registrationFields, visitor]);

  function updateForm(key: keyof EditVisitorForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function updateCustomField(key: string, value: unknown) {
    setCustomFields((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "الاسم الكامل مطلوب";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "رقم الهاتف مطلوب";
    }

    for (const field of editableCustomFields) {
      const value = customFields[field.key];

      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        value === false;

      if (field.isRequired && isEmpty) {
        nextErrors[field.key] = `${getFieldLabel(field)} مطلوب`;
        continue;
      }

      if (
        !isEmpty &&
        String(field.type ?? "").toUpperCase() === "SELECT"
      ) {
        const allowedValues = getStaffSelectOptions(field).map(
          (option) => option.value,
        );
        const currentValue = String(value ?? "").trim();

        if (!allowedValues.includes(currentValue)) {
          nextErrors[field.key] = `${getFieldLabel(field)} يحتوي قيمة قديمة؛ اختر قيمة صحيحة`;
        }
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!visitor || !validate()) {
      return;
    }

    const cleanedCustomFields = Object.fromEntries(
      Object.entries(customFields).filter(([, value]) => {
        return value !== undefined && value !== null && value !== "";
      }),
    );

    const changes: UpdateStaffVisitorPayload = {};

    const nextFullName = form.fullName.trim();
    const nextPhone = form.phone.trim();

    if (nextFullName !== String(visitor.fullName ?? "").trim()) {
      changes.fullName = nextFullName;
    }

    if (nextPhone !== String(visitor.phone ?? "").trim()) {
      changes.phone = nextPhone;
    }

    const initialCustomFields = Object.fromEntries(
      Object.entries(
        normalizeInitialCustomFields(visitor, registrationFields),
      ).filter(([, value]) => {
        return value !== undefined && value !== null && value !== "";
      }),
    );

    if (
      JSON.stringify(initialCustomFields) !== JSON.stringify(cleanedCustomFields)
    ) {
      changes.customFields = cleanedCustomFields;
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    await onSubmit(visitor, changes);
  }

  function renderCustomField(field: PublicRegistrationField) {
    const value = customFields[field.key];

    const type = String(field.type ?? "TEXT").toUpperCase();
    const label = getFieldLabel(field);

    if (type === "BOOLEAN" || type === "CHECKBOX") {
      return (
        <label
          key={field.key}
          className="flex min-h-12 items-center justify-between rounded-2xl border border-black/10 bg-white px-4"
        >
          <span className="text-sm font-black" style={{ color: theme.text }}>
            {label}
          </span>

          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={isSubmitting}
            onChange={(event) =>
              updateCustomField(field.key, event.target.checked)
            }
            className="h-5 w-5"
            style={{ accentColor: theme.primary }}
          />
        </label>
      );
    }

    if (type === "NUMBER") {
      return (
        <EditInput
          key={field.key}
          label={label}
          value={value === undefined || value === null ? "" : String(value)}
          error={errors[field.key]}
          disabled={isSubmitting}
          type="number"
          onChange={(nextValue) =>
            updateCustomField(
              field.key,
              nextValue === "" ? "" : Number(nextValue),
            )
          }
        />
      );
    }

    if (type === "SELECT") {
      const currentValue =
        value === undefined || value === null ? "" : String(value);
      const options = getStaffSelectOptions(field);
      const isLegacyInvalidValue =
        Boolean(currentValue) &&
        !options.some((option) => option.value === currentValue);

      const selectOptions = isLegacyInvalidValue
        ? [
            {
              value: currentValue,
              label: `قيمة قديمة: ${currentValue}`,
              disabled: true,
            },
            ...options,
          ]
        : options;

      return (
        <Select
          key={field.key}
          label={label}
          value={currentValue}
          options={selectOptions}
          error={errors[field.key]}
          disabled={isSubmitting}
          required={field.isRequired}
          placeholder="اختر قيمة"
          onChange={(nextValue) => updateCustomField(field.key, nextValue)}
          accentColor={theme.primary}
          textColor={theme.text}
          borderRadius={theme.radius}
        />
      );
    }

    return (
      <EditInput
        key={field.key}
        label={label}
        value={value === undefined || value === null ? "" : String(value)}
        error={errors[field.key]}
        disabled={isSubmitting}
        onChange={(nextValue) => updateCustomField(field.key, nextValue)}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      title="تعديل بيانات الزائر"
      description="سيظهر التعديل فورًا في البحث والبادج، ويُزامن عند توفر الإنترنت."
      className="max-w-3xl"
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <EditInput
            label="الاسم الكامل"
            value={form.fullName}
            error={errors.fullName}
            disabled={isSubmitting}
            onChange={(value) => updateForm("fullName", value)}
          />

          <EditInput
            label="رقم الهاتف"
            value={form.phone}
            error={errors.phone}
            disabled={isSubmitting}
            dir="ltr"
            onChange={(value) => updateForm("phone", value)}
          />

          {/* <EditInput
            label="البريد الإلكتروني"
            value={form.email}
            error={errors.email}
            disabled={isSubmitting}
            type="email"
            dir="ltr"
            onChange={(value) => updateForm("email", value)}
          /> */}

          {/* <EditInput
            label="اسم الشركة"
            value={form.companyName}
            disabled={isSubmitting}
            onChange={(value) => updateForm("companyName", value)}
          /> */}

          {/* <EditInput
            label="المسمى الوظيفي"
            value={form.jobTitle}
            disabled={isSubmitting}
            onChange={(value) => updateForm("jobTitle", value)}
          /> */}
        </div>

        {editableCustomFields.length > 0 ? (
          <section className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
            <h3
              className="mb-4 text-sm font-black"
              style={{ color: theme.text }}
            >
              الحقول الإضافية
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {editableCustomFields.map(renderCustomField)}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            إلغاء
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: theme.primary }}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ التعديل
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditInput({
  label,
  value,
  error,
  disabled,
  type = "text",
  dir = "rtl",
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  type?: "text" | "email" | "number";
  dir?: "rtl" | "ltr";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-black text-[#4B4B4B]">
        {label}
      </span>

      <input
        type={type}
        dir={dir}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm font-bold text-[#2F3137] outline-none transition focus:ring-4 disabled:opacity-60 ${
          error ? "border-red-300" : "border-black/10"
        }`}
      />

      {error ? (
        <span className="mt-1 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
